import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from lava_backend.config import reset_config  # noqa: E402
from lava_backend.main import app  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(autouse=True)
def _clean_config():
    yield
    reset_config()


@pytest.fixture
def client():
    return TestClient(app)