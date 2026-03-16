"""LLM routing with streaming support and fallback chain."""

import json
import time
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, Optional

import httpx
from cachetools import TTLCache
from loguru import logger

from app.core.config import settings
from app.core.mongodb import get_database

_token_cache: TTLCache = TTLCache(maxsize=1024, ttl=300)
_http_client: Optional[httpx.AsyncClient] = None

GROK_API_URL = "https://api.x.ai/v1/chat/completions"
NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"


def init() -> None:
    """Initialize the LLM router (HTTP client, caches)."""
    global _http_client
    _http_client = httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0))
    logger.info("LLM router initialized")


async def _close() -> None:
    global _http_client
    if _http_client:
        await _http_client.aclose()
        _http_client = None


def _get_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0))
    return _http_client


def count_tokens(text: str) -> int:
    """Rough token count (≈ 4 chars per token)."""
    return max(1, len(text) // 4)


async def _record_usage(user_id: str, provider: str, model: str, prompt_tokens: int, completion_tokens: int) -> None:
    """Record LLM usage to MongoDB."""
    try:
        db = get_database()
        await db.llm_usage.insert_one({
            "user_id": user_id,
            "provider": provider,
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
            "created_at": datetime.now(timezone.utc),
        })
    except Exception as exc:
        logger.error("Failed to record LLM usage: {}", exc)


async def call_grok_stream(
    prompt: str, model: str = "grok-3-mini"
) -> AsyncGenerator[str, None]:
    """Stream completions from the Grok API."""
    if not settings.GROK_KEY:
        raise ValueError("GROK_KEY not configured")

    client = _get_client()
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": True,
    }
    async with client.stream(
        "POST",
        GROK_API_URL,
        json=payload,
        headers={
            "Authorization": f"Bearer {settings.GROK_KEY}",
            "Content-Type": "application/json",
        },
    ) as response:
        response.raise_for_status()
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                data = line[6:]
                if data.strip() == "[DONE]":
                    break
                try:
                    chunk = json.loads(data)
                    delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if delta:
                        yield delta
                except json.JSONDecodeError:
                    continue


async def call_nvidia_stream(
    prompt: str, model: str = "meta/llama-3.1-70b-instruct"
) -> AsyncGenerator[str, None]:
    """Stream completions from the NVIDIA NIM API."""
    if not settings.NVIDIA_KEY:
        raise ValueError("NVIDIA_KEY not configured")

    client = _get_client()
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": True,
    }
    async with client.stream(
        "POST",
        NVIDIA_API_URL,
        json=payload,
        headers={
            "Authorization": f"Bearer {settings.NVIDIA_KEY}",
            "Content-Type": "application/json",
        },
    ) as response:
        response.raise_for_status()
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                data = line[6:]
                if data.strip() == "[DONE]":
                    break
                try:
                    chunk = json.loads(data)
                    delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if delta:
                        yield delta
                except json.JSONDecodeError:
                    continue


async def call_local_model(prompt: str) -> AsyncGenerator[str, None]:
    """Fallback to a local Ollama-compatible model."""
    client = _get_client()
    payload = {
        "model": "codellama",
        "prompt": prompt,
        "stream": True,
    }
    try:
        async with client.stream(
            "POST",
            settings.LOCAL_FALLBACK,
            json=payload,
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.strip():
                    try:
                        chunk = json.loads(line)
                        text = chunk.get("response", "")
                        if text:
                            yield text
                        if chunk.get("done", False):
                            break
                    except json.JSONDecodeError:
                        continue
    except Exception as exc:
        logger.error("Local model fallback failed: {}", exc)
        yield f"[Error: local model unavailable – {exc}]"


async def generate_stream(
    prompt: str,
    prefer: str = "grok",
    user_id: str = "",
    model: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """Route to preferred provider with fallback chain.

    Preference order: prefer → other cloud → local.
    """
    prompt_tokens = count_tokens(prompt)
    completion_text = ""
    provider_used = prefer

    providers = []
    if prefer == "grok":
        providers = [
            ("grok", lambda: call_grok_stream(prompt, model or "grok-3-mini")),
            ("nvidia", lambda: call_nvidia_stream(prompt, model or "meta/llama-3.1-70b-instruct")),
            ("local", lambda: call_local_model(prompt)),
        ]
    elif prefer == "nvidia":
        providers = [
            ("nvidia", lambda: call_nvidia_stream(prompt, model or "meta/llama-3.1-70b-instruct")),
            ("grok", lambda: call_grok_stream(prompt, model or "grok-3-mini")),
            ("local", lambda: call_local_model(prompt)),
        ]
    else:
        providers = [
            ("local", lambda: call_local_model(prompt)),
            ("grok", lambda: call_grok_stream(prompt, model or "grok-3-mini")),
            ("nvidia", lambda: call_nvidia_stream(prompt, model or "meta/llama-3.1-70b-instruct")),
        ]

    for provider_name, provider_fn in providers:
        try:
            provider_used = provider_name
            async for chunk in provider_fn():
                completion_text += chunk
                yield chunk
            # If we get here the provider worked
            break
        except Exception as exc:
            logger.warning("Provider {} failed, trying next: {}", provider_name, exc)
            continue

    # Record usage
    completion_tokens = count_tokens(completion_text)
    if user_id:
        await _record_usage(user_id, provider_used, model or "default", prompt_tokens, completion_tokens)
