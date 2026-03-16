"""Shared pytest fixtures with mocks for Firebase and MongoDB."""

import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

# Patch firebase_admin before importing the app
_mock_firebase_app = MagicMock()

with patch("firebase_admin.initialize_app", return_value=_mock_firebase_app), \
     patch("firebase_admin.credentials.Certificate", return_value=MagicMock()), \
     patch("firebase_admin.credentials.ApplicationDefault", return_value=MagicMock()):
    pass


MOCK_USER = {
    "uid": "test-user-123",
    "email": "test@example.com",
    "name": "Test User",
    "picture": "",
    "email_verified": True,
}

MOCK_FIREBASE_DECODED = {
    "uid": "test-user-123",
    "email": "test@example.com",
    "name": "Test User",
    "picture": "",
    "email_verified": True,
}


class FakeCollection:
    """In-memory MongoDB collection mock."""

    def __init__(self):
        self._docs = []

    async def insert_one(self, doc):
        self._docs.append(doc.copy())
        return MagicMock(inserted_id="fake_id")

    async def find_one(self, query, *args, **kwargs):
        for doc in self._docs:
            if all(doc.get(k) == v for k, v in query.items()):
                return doc.copy()
        return None

    async def find_one_and_update(self, query, update, upsert=False, return_document=None):
        doc = await self.find_one(query)
        if doc is None and upsert:
            doc = {**query}
            self._docs.append(doc)
        if doc is not None:
            set_fields = update.get("$set", {})
            set_on_insert = update.get("$setOnInsert", {})
            for d in self._docs:
                if all(d.get(k) == v for k, v in query.items()):
                    d.update(set_fields)
                    if upsert:
                        for k, v in set_on_insert.items():
                            d.setdefault(k, v)
                    return d.copy()
        return doc

    async def update_one(self, query, update, upsert=False):
        doc = await self.find_one(query)
        if doc:
            set_fields = update.get("$set", {})
            for d in self._docs:
                if all(d.get(k) == v for k, v in query.items()):
                    d.update(set_fields)
        return MagicMock(modified_count=1 if doc else 0)

    async def delete_one(self, query):
        for i, doc in enumerate(self._docs):
            if all(doc.get(k) == v for k, v in query.items()):
                self._docs.pop(i)
                return MagicMock(deleted_count=1)
        return MagicMock(deleted_count=0)

    async def count_documents(self, query):
        if not query:
            return len(self._docs)
        count = 0
        for doc in self._docs:
            if all(doc.get(k) == v for k, v in query.items()):
                count += 1
        return count

    def find(self, query=None, projection=None):
        return FakeCursor(self._docs, query or {})

    async def create_index(self, *args, **kwargs):
        pass

    def aggregate(self, pipeline):
        return FakeCursor([], {})


class FakeCursor:
    """Minimal async cursor mock."""

    def __init__(self, docs, query):
        self._docs = docs
        self._query = query
        self._skip = 0
        self._limit_val = 100

    def skip(self, n):
        self._skip = n
        return self

    def limit(self, n):
        self._limit_val = n
        return self

    def sort(self, *args, **kwargs):
        return self

    async def to_list(self, length=100):
        filtered = []
        for doc in self._docs:
            if all(doc.get(k) == v for k, v in self._query.items()):
                copy = doc.copy()
                copy.pop("_id", None)
                filtered.append(copy)
        return filtered[self._skip:self._skip + min(length, self._limit_val)]


class FakeDatabase:
    """In-memory database with named collections."""

    def __init__(self):
        self._collections = {}

    def __getattr__(self, name):
        if name.startswith("_"):
            return super().__getattribute__(name)
        if name not in self._collections:
            self._collections[name] = FakeCollection()
        return self._collections[name]


@pytest.fixture
def fake_db():
    return FakeDatabase()


@pytest.fixture
def mock_firebase_verify():
    """Patch Firebase token verification to return MOCK_USER."""
    with patch("app.core.firebase_auth.firebase_auth.verify_id_token", return_value=MOCK_FIREBASE_DECODED):
        yield


@pytest.fixture
def app_client(fake_db, mock_firebase_verify):
    """Create a TestClient with mocked Firebase and MongoDB."""
    with patch("app.core.mongodb.get_database", return_value=fake_db), \
         patch("app.core.mongodb.connect_db", new_callable=AsyncMock), \
         patch("app.core.mongodb.init_db", new_callable=AsyncMock), \
         patch("app.core.mongodb.close_db", new_callable=AsyncMock), \
         patch("app.core.firebase_auth.init_firebase"), \
         patch("app.core.llm_router.init"), \
         patch("app.core.llm_router._close", new_callable=AsyncMock), \
         patch("app.core.workspace_manager.init"):
        from app.main import app
        client = TestClient(app)
        yield client


@pytest.fixture
def auth_headers():
    """Return authorization headers with a fake Firebase token."""
    return {"Authorization": "Bearer fake-firebase-token"}
