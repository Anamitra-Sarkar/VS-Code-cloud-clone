"""Tests for LLM router – mocking httpx streams."""

import json
from unittest.mock import patch, MagicMock, AsyncMock

import pytest
import pytest_asyncio

from tests.conftest import FakeDatabase


@pytest.fixture
def fake_db():
    return FakeDatabase()


class FakeAsyncLineIterator:
    """Mock for httpx response.aiter_lines()."""

    def __init__(self, lines):
        self._lines = lines
        self._index = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self._index >= len(self._lines):
            raise StopAsyncIteration
        line = self._lines[self._index]
        self._index += 1
        return line


class FakeStreamResponse:
    """Mock for httpx async stream context manager."""

    def __init__(self, lines):
        self.lines = lines

    async def __aenter__(self):
        resp = MagicMock()
        resp.raise_for_status = MagicMock()
        resp.aiter_lines = lambda: FakeAsyncLineIterator(self.lines)
        return resp

    async def __aexit__(self, *args):
        pass


@pytest.mark.asyncio
async def test_generate_stream_grok(fake_db):
    """Test that generate_stream routes to Grok and yields chunks."""
    from app.core import llm_router
    from app.core.llm_router import settings as real_settings

    lines = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}',
        'data: {"choices":[{"delta":{"content":" World"}}]}',
        "data: [DONE]",
    ]
    fake_response = FakeStreamResponse(lines)

    with patch("app.core.mongodb.get_database", return_value=fake_db), \
         patch.object(real_settings, "GROK_KEY", "test-key"):
        client_mock = MagicMock()
        client_mock.stream = MagicMock(return_value=fake_response)

        with patch.object(llm_router, "_get_client", return_value=client_mock):
            chunks = []
            async for chunk in llm_router.call_grok_stream("test prompt"):
                chunks.append(chunk)

            assert chunks == ["Hello", " World"]


@pytest.mark.asyncio
async def test_generate_stream_nvidia(fake_db):
    """Test that generate_stream routes to NVIDIA and yields chunks."""
    from app.core import llm_router
    from app.core.llm_router import settings as real_settings

    lines = [
        'data: {"choices":[{"delta":{"content":"NVIDIA"}}]}',
        'data: {"choices":[{"delta":{"content":" response"}}]}',
        "data: [DONE]",
    ]
    fake_response = FakeStreamResponse(lines)

    with patch("app.core.mongodb.get_database", return_value=fake_db), \
         patch.object(real_settings, "NVIDIA_KEY", "test-key"):
        client_mock = MagicMock()
        client_mock.stream = MagicMock(return_value=fake_response)

        with patch.object(llm_router, "_get_client", return_value=client_mock):
            chunks = []
            async for chunk in llm_router.call_nvidia_stream("test prompt"):
                chunks.append(chunk)

            assert chunks == ["NVIDIA", " response"]


@pytest.mark.asyncio
async def test_count_tokens():
    """Test the rough token counter."""
    from app.core.llm_router import count_tokens

    assert count_tokens("") == 1  # min 1
    assert count_tokens("hello world") == 2  # ~11 chars / 4
    assert count_tokens("a" * 100) == 25


@pytest.mark.asyncio
async def test_fallback_chain(fake_db):
    """Test that generate_stream falls through to next provider on failure."""
    from app.core import llm_router

    local_lines = [
        '{"response":"fallback","done":false}',
        '{"response":" works","done":true}',
    ]

    class FakeLocalStream:
        async def __aenter__(self):
            resp = MagicMock()
            resp.raise_for_status = MagicMock()
            resp.aiter_lines = lambda: FakeAsyncLineIterator(local_lines)
            return resp

        async def __aexit__(self, *args):
            pass

    call_count = {"n": 0}

    def fake_stream(method, url, **kwargs):
        call_count["n"] += 1
        if "x.ai" in url:
            raise Exception("Grok unavailable")
        if "nvidia" in url:
            raise Exception("NVIDIA unavailable")
        return FakeLocalStream()

    with patch("app.core.mongodb.get_database", return_value=fake_db), \
         patch.object(llm_router.settings, "GROK_KEY", "key"), \
         patch.object(llm_router.settings, "NVIDIA_KEY", "key"):

        client_mock = MagicMock()
        client_mock.stream = MagicMock(side_effect=fake_stream)

        with patch.object(llm_router, "_get_client", return_value=client_mock):
            chunks = []
            async for chunk in llm_router.generate_stream("test", prefer="grok", user_id="u1"):
                chunks.append(chunk)

            assert "fallback" in chunks
            assert " works" in chunks
