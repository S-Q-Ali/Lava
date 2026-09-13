"""M7 module 6: manhwa-api HTTP tests (isolated tmp storage)."""

from __future__ import annotations

from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from pathlib import Path

from lava_backend.main import app
from lava_backend.manhwa.api import (
    SOURCE_ID_RE,
    manhwa_dir,
    new_source_id,
    strip_dir,
)


@pytest.fixture()
def client(tmp_path, monkeypatch) -> TestClient:
    from dataclasses import replace

    from lava_backend import config as config_mod

    original_load = config_mod.Config.load

    def fake_load(cls) -> "config_mod.Config":
        base = original_load()
        return replace(
            base,
            cache_dir=tmp_path / "cache",
            uploads_dir=tmp_path / "cache" / "uploads",
            renders_dir=tmp_path / "cache" / "renders",
        )

    monkeypatch.setattr(config_mod.Config, "load", classmethod(fake_load))
    config_mod.reset_config()
    yield TestClient(app)
    config_mod.reset_config()


def _png_bytes(width: int, height: int, color: tuple[int, int, int] = (0, 0, 0)) -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (width, height), color).save(buffer, format="PNG")
    return buffer.getvalue()


def _upload(client: TestClient, *, body: bytes, name: str = "strip.png", content_type: str = "image/png"):
    return client.post(
        "/api/manhwa/strips",
        files={"file": (name, body, content_type)},
    )


class TestHelpers:
    def test_source_id_reject_invalid(self) -> None:
        assert SOURCE_ID_RE.fullmatch("s1a2b3") is not None
        assert SOURCE_ID_RE.fullmatch("../../etc/x") is None
        assert SOURCE_ID_RE.fullmatch("p a n e l") is None

    def test_new_source_id_safe_and_unique(self) -> None:
        first = new_source_id()
        assert SOURCE_ID_RE.fullmatch(first)
        assert first != new_source_id()

    def test_manhwa_dir_under_cache(self, tmp_path) -> None:
        from lava_backend.config import get_config

        assert manhwa_dir(get_config()) == get_config().cache_dir / "manhwa"

    def test_strip_dir_validates_and_resolves(self, tmp_path) -> None:
        from lava_backend.config import get_config

        assert strip_dir(get_config(), "s1") == get_config().cache_dir / "manhwa" / "s1"
        with pytest.raises(ValueError):
            strip_dir(get_config(), "../../escape")


class TestReadEndpoints:
    def test_empty_list(self, client) -> None:
        response = client.get("/api/manhwa/strips")
        assert response.status_code == 200
        assert response.json()["strips"] == []

    def test_upload_then_list_and_detail(self, client) -> None:
        upload = _upload(client, body=_png_bytes(400, 1200))
        assert upload.status_code == 201
        source_id = upload.json()["sourceId"]

        listed = client.get("/api/manhwa/strips").json()["strips"]
        assert len(listed) == 1
        assert listed[0]["sourceId"] == source_id
        assert listed[0]["panelCount"] > 0
        assert listed[0]["width"] == 400 and listed[0]["height"] == 1200

        detail = client.get(f"/api/manhwa/strips/{source_id}")
        assert detail.status_code == 200
        body = detail.json()
        assert body["sourceId"] == source_id
        assert body["width"] == 400
        assert len(body["panels"]) == listed[0]["panelCount"]
        first = body["panels"][0]
        assert {"id", "sourceId", "x", "y", "w", "h", "confidence", "order", "userCorrected"} <= set(first)

    def test_detail_missing_strip_404(self, client) -> None:
        assert client.get("/api/manhwa/strips/s-unknown").status_code == 404

    def test_source_served(self, client) -> None:
        source_id = _upload(client, body=_png_bytes(400, 1200)).json()["sourceId"]
        response = client.get(f"/api/manhwa/strips/{source_id}/source")
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("image/")
        image = Image.open(BytesIO(response.content))
        assert image.size == (400, 1200)


class TestUploadErrors:
    def test_landscape_rejected(self, client) -> None:
        response = _upload(client, body=_png_bytes(1200, 400))
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "MANHWA_DETECT_FAILED"

    def test_non_image_rejected(self, client) -> None:
        response = _upload(client, body=b"not an image", name="x.png")
        assert response.status_code == 422

    def test_empty_file_rejected(self, client) -> None:
        response = client.post("/api/manhwa/strips")
        assert response.status_code in (400, 422)


class TestPanelServe:
    def test_panel_regenerated_from_original(self, client) -> None:
        img = Image.new("RGB", (400, 1200), (10, 20, 30))
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        source_id = _upload(client, body=buffer.getvalue()).json()["sourceId"]
        detail = client.get(f"/api/manhwa/strips/{source_id}").json()
        panel = detail["panels"][0]
        response = client.get(f"/api/manhwa/strips/{source_id}/panels/{panel['id']}")
        assert response.status_code == 200
        served = Image.open(BytesIO(response.content)).convert("RGB")
        assert served.size == (panel["w"], panel["h"])
        assert list(served.getdata())[:1] == [(10, 20, 30)]

    def test_unknown_panel_404(self, client) -> None:
        source_id = _upload(client, body=_png_bytes(400, 1200)).json()["sourceId"]
        assert client.get(f"/api/manhwa/strips/{source_id}/panels/px").status_code == 404


class TestCorrectionOps:
    def _strip(self, client) -> dict:
        return _upload(client, body=_png_bytes(400, 1200)).json()

    def test_split_merge_persist(self, client) -> None:
        source_id = self._strip(client)["sourceId"]
        split = client.patch(
            f"/api/manhwa/strips/{source_id}/panels",
            json={"op": "split", "panelId": "p1", "y": 600},
        )
        assert split.status_code == 200
        ids = [p["id"] for p in split.json()["panels"]]
        assert ids == ["p1", "p2"]
        assert all(p["userCorrected"] for p in split.json()["panels"])

        merged = client.patch(
            f"/api/manhwa/strips/{source_id}/panels",
            json={"op": "merge", "ids": ["p1", "p2"]},
        )
        assert merged.status_code == 200
        assert [p["id"] for p in merged.json()["panels"]] == ["p1"]
        assert merged.json()["panels"][0]["h"] == 1200

    def test_adjust_delete(self, client) -> None:
        source_id = self._strip(client)["sourceId"]
        adjusted = client.patch(
            f"/api/manhwa/strips/{source_id}/panels",
            json={"op": "adjust", "panelId": "p1", "x": 0, "y": 60, "w": 400, "h": 900},
        )
        assert adjusted.status_code == 200
        assert adjusted.json()["panels"][0]["y"] == 60

        deleted = client.patch(
            f"/api/manhwa/strips/{source_id}/panels",
            json={"op": "delete", "panelId": "p1"},
        )
        assert deleted.status_code == 200
        assert deleted.json()["panels"] == []

    def test_reset_empties(self, client) -> None:
        source_id = self._strip(client)["sourceId"]
        reset = client.patch(
            f"/api/manhwa/strips/{source_id}/panels", json={"op": "reset"}
        )
        assert reset.status_code == 200
        assert reset.json()["panels"] == []
        # still loadable afterwards
        assert client.get(f"/api/manhwa/strips/{source_id}").status_code == 200

    def test_reorder_after_split(self, client) -> None:
        source_id = self._strip(client)["sourceId"]
        client.patch(
            f"/api/manhwa/strips/{source_id}/panels",
            json={"op": "split", "panelId": "p1", "y": 400},
        )
        reordered = client.patch(
            f"/api/manhwa/strips/{source_id}/panels",
            json={"op": "reorder", "ids": ["p2", "p1"]},
        )
        assert reordered.status_code == 200
        body = reordered.json()
        assert [p["id"] for p in body["panels"]] == ["p2", "p1"]
        assert [p["order"] for p in body["panels"]] == [1, 2]

    def test_add_overlap_rejected(self, client) -> None:
        source_id = self._strip(client)["sourceId"]
        response = client.patch(
            f"/api/manhwa/strips/{source_id}/panels",
            json={"op": "add", "x": 0, "y": 100, "w": 400, "h": 100},
        )
        assert response.status_code == 422

    def test_unknown_op_and_id_rejected(self, client) -> None:
        source_id = self._strip(client)["sourceId"]
        assert client.patch(
            f"/api/manhwa/strips/{source_id}/panels", json={"op": "nonsense"}
        ).status_code == 422
        assert client.patch(
            f"/api/manhwa/strips/{source_id}/panels",
            json={"op": "split", "panelId": "p9", "y": 100},
        ).status_code == 422

    def test_redetect_regenerates(self, client) -> None:
        source_id = self._strip(client)["sourceId"]
        client.patch(
            f"/api/manhwa/strips/{source_id}/panels",
            json={"op": "split", "panelId": "p1", "y": 600},
        )
        assert len(client.get(f"/api/manhwa/strips/{source_id}").json()["panels"]) == 2
        redetected = client.post(f"/api/manhwa/strips/{source_id}/redetect")
        assert redetected.status_code == 200
        panels = redetected.json()["panels"]
        assert len(panels) == 1 and panels[0]["id"] == "p1"
        assert client.get(f"/api/manhwa/strips/{source_id}").json()["panels"][0]["id"] == "p1"


class TestDeleteStrip:
    def test_delete_removes_strip(self, client) -> None:
        source_id = _upload(client, body=_png_bytes(400, 1200)).json()["sourceId"]
        assert client.delete(f"/api/manhwa/strips/{source_id}").status_code == 204
        assert client.get(f"/api/manhwa/strips/{source_id}").status_code == 404
        assert client.delete("/api/manhwa/strips/s-unknown").status_code == 404


class TestExport:
    def test_export_zip_manifest_and_files(self, client) -> None:
        source_id = _upload(client, body=_png_bytes(400, 1200)).json()["sourceId"]
        response = client.get(f"/api/manhwa/strips/{source_id}/export")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/zip"

        import json
        import zipfile

        with zipfile.ZipFile(BytesIO(response.content)) as archive:
            names = archive.namelist()
            assert "manifest.json" in names
            manifest = json.loads(archive.read("manifest.json"))
            panel_files = [n for n in names if n != "manifest.json"]
            assert len(panel_files) == len(manifest["panels"])
            assert sorted(panel_files) == [m["file"] for m in manifest["panels"]]
            first = manifest["panels"][0]
            panel = Image.open(BytesIO(archive.read(first["file"]))).convert("RGB")
            assert panel.size == (400, 1200)

    def test_export_jpg_suffix(self, client) -> None:
        source_id = _upload(client, body=_png_bytes(400, 1200)).json()["sourceId"]
        import zipfile

        response = client.get(f"/api/manhwa/strips/{source_id}/export", params={"format": "jpg"})
        assert response.status_code == 200
        with zipfile.ZipFile(BytesIO(response.content)) as archive:
            assert all(name.endswith(".jpg") for name in archive.namelist() if name != "manifest.json")

    def test_export_missing_strip_404(self, client) -> None:
        assert client.get("/api/manhwa/strips/s-unknown/export").status_code == 404

    def test_export_empty_after_reset_422(self, client) -> None:
        source_id = _upload(client, body=_png_bytes(400, 1200)).json()["sourceId"]
        client.patch(f"/api/manhwa/strips/{source_id}/panels", json={"op": "reset"})
        assert client.get(f"/api/manhwa/strips/{source_id}/export").status_code == 422