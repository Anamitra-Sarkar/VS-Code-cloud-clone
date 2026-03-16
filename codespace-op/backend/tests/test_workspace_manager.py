"""Tests for workspace manager – mocking Docker SDK."""

from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime, timezone

import pytest
import pytest_asyncio

from tests.conftest import FakeDatabase


@pytest.fixture
def fake_db():
    return FakeDatabase()


@pytest.fixture
def mock_docker_client():
    client = MagicMock()
    container = MagicMock()
    container.name = "codeop-ws-testuser-abc123"
    container.status = "running"
    container.short_id = "abc123"
    container.image = "codespace-op-workspace:latest"
    container.labels = {"user_id": "testuser123", "workspace_id": "abc123"}
    client.containers.run.return_value = container
    client.containers.get.return_value = container
    client.containers.list.return_value = [container]
    return client


@pytest_asyncio.fixture
async def setup_workspace_manager(fake_db, mock_docker_client):
    with patch("app.core.workspace_manager.get_database", return_value=fake_db), \
         patch("app.core.workspace_manager._get_docker", return_value=mock_docker_client):
        yield fake_db, mock_docker_client


@pytest.mark.asyncio
async def test_create_workspace(setup_workspace_manager):
    from app.core.workspace_manager import create_workspace

    fake_db, mock_docker = setup_workspace_manager
    result = await create_workspace("testuser123", name="my-workspace")

    assert result["user_id"] == "testuser123"
    assert result["name"] == "my-workspace"
    assert result["status"] == "running"
    mock_docker.containers.run.assert_called_once()


@pytest.mark.asyncio
async def test_list_workspaces(setup_workspace_manager):
    from app.core.workspace_manager import create_workspace, list_workspaces

    fake_db, _ = setup_workspace_manager

    await create_workspace("user1", name="ws1")
    await create_workspace("user2", name="ws2")

    user1_ws = await list_workspaces("user1")
    user2_ws = await list_workspaces("user2")

    assert len(user1_ws) == 1
    assert user1_ws[0]["user_id"] == "user1"
    assert len(user2_ws) == 1
    assert user2_ws[0]["user_id"] == "user2"


@pytest.mark.asyncio
async def test_stop_workspace(setup_workspace_manager):
    from app.core.workspace_manager import create_workspace, stop_workspace

    fake_db, mock_docker = setup_workspace_manager

    ws = await create_workspace("testuser123", name="ws-to-stop")
    result = await stop_workspace("testuser123", ws["workspace_id"])

    assert result["status"] == "stopped"
    mock_docker.containers.get.return_value.stop.assert_called_once()


@pytest.mark.asyncio
async def test_start_workspace(setup_workspace_manager):
    from app.core.workspace_manager import create_workspace, stop_workspace, start_workspace

    fake_db, mock_docker = setup_workspace_manager

    ws = await create_workspace("testuser123", name="ws-to-start")
    await stop_workspace("testuser123", ws["workspace_id"])
    result = await start_workspace("testuser123", ws["workspace_id"])

    assert result["status"] == "running"
    mock_docker.containers.get.return_value.start.assert_called_once()


@pytest.mark.asyncio
async def test_delete_workspace(setup_workspace_manager):
    from app.core.workspace_manager import create_workspace, delete_workspace, list_workspaces

    fake_db, mock_docker = setup_workspace_manager

    ws = await create_workspace("testuser123", name="ws-to-delete")
    result = await delete_workspace("testuser123", ws["workspace_id"])

    assert result["status"] == "deleted"
    remaining = await list_workspaces("testuser123")
    assert len(remaining) == 0


@pytest.mark.asyncio
async def test_workspace_isolation(setup_workspace_manager):
    """Ensure a user cannot access another user's workspace."""
    from app.core.workspace_manager import create_workspace, stop_workspace

    fake_db, _ = setup_workspace_manager

    ws = await create_workspace("user_a", name="private-ws")

    with pytest.raises(ValueError, match="Workspace not found"):
        await stop_workspace("user_b", ws["workspace_id"])
