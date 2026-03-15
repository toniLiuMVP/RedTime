#!/usr/bin/env python3
import argparse
import atexit
import json
import os
import sys
import time
import urllib.error
import urllib.request


def request_json(url, method="GET", body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Content-Type", "application/json;charset=UTF-8")
    with urllib.request.urlopen(request, timeout=20) as response:
        payload = response.read().decode("utf-8")
    return json.loads(payload) if payload else {}


class WebDriverSession:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip("/")
        self.session_id = None

    def create(self):
        payload = {
            "capabilities": {
                "alwaysMatch": {
                    "browserName": "safari",
                    "acceptInsecureCerts": True,
                }
            }
        }
        response = request_json(f"{self.base_url}/session", method="POST", body=payload)
        self.session_id = response.get("sessionId") or response["value"].get("sessionId")

    @property
    def session_url(self):
        return f"{self.base_url}/session/{self.session_id}"

    def delete(self):
        if not self.session_id:
            return
        try:
            request_json(self.session_url, method="DELETE")
        finally:
            self.session_id = None

    def navigate(self, url):
        request_json(f"{self.session_url}/url", method="POST", body={"url": url})

    def execute(self, script, args=None):
        response = request_json(
            f"{self.session_url}/execute/sync",
            method="POST",
            body={"script": script, "args": args or []},
        )
        return response["value"]

    def screenshot(self, path):
        response = request_json(f"{self.session_url}/screenshot", method="GET")
        with open(path, "wb") as handle:
            import base64

            handle.write(base64.b64decode(response["value"]))

    def perform_actions(self, actions):
        request_json(f"{self.session_url}/actions", method="POST", body={"actions": actions})

    def release_actions(self):
        request_json(f"{self.session_url}/actions", method="DELETE")


def wait_for(predicate, timeout=10, interval=0.1, message="condition"):
    deadline = time.time() + timeout
    last_value = None
    while time.time() < deadline:
        last_value = predicate()
        if last_value:
            return last_value
        time.sleep(interval)
    raise RuntimeError(f"Timed out waiting for {message}: {last_value!r}")


def right_click_canvas(session):
    rect = session.execute(
        """
        const canvas = document.getElementById('scene-canvas');
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        return {
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
        """
    )
    if not rect:
        raise RuntimeError("Canvas not found.")
    actions = [
        {
            "type": "pointer",
            "id": "mouse",
            "parameters": {"pointerType": "mouse"},
            "actions": [
                {"type": "pointerMove", "duration": 0, "x": rect["x"], "y": rect["y"], "origin": "viewport"},
                {"type": "pointerDown", "button": 2},
                {"type": "pause", "duration": 80},
                {"type": "pointerUp", "button": 2},
            ],
        }
    ]
    session.perform_actions(actions)
    session.release_actions()
    return rect


def send_escape(session):
    actions = [
        {
            "type": "key",
            "id": "keyboard",
            "actions": [
                {"type": "keyDown", "value": "\ue00c"},
                {"type": "pause", "duration": 60},
                {"type": "keyUp", "value": "\ue00c"},
            ],
        }
    ]
    session.perform_actions(actions)
    session.release_actions()


def read_snapshot(session):
    return session.execute(
        """
        if (!window.__LM402_DEBUG__) return null;
        return window.__LM402_DEBUG__.snapshot();
        """
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--driver-url", default="http://127.0.0.1:5555")
    parser.add_argument("--page-url", default="http://127.0.0.1:8123/lm402.html?debug=1")
    parser.add_argument("--out-json", default=".shots/lm402-pointer-lock-report.json")
    parser.add_argument("--out-shot", default=".shots/lm402-pointer-lock-report.png")
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.out_json) or ".", exist_ok=True)
    os.makedirs(os.path.dirname(args.out_shot) or ".", exist_ok=True)

    session = WebDriverSession(args.driver_url)
    session.create()
    atexit.register(session.delete)

    session.navigate(args.page_url)
    wait_for(lambda: read_snapshot(session), timeout=20, message="debug snapshot")

    baseline = read_snapshot(session)
    right_click_canvas(session)
    locked = wait_for(
        lambda: (read_snapshot(session) or {}).get("pointerLockState") == "locked" and read_snapshot(session),
        timeout=8,
        message="pointer lock enter",
    )
    right_click_canvas(session)
    unlocked_by_click = wait_for(
        lambda: (read_snapshot(session) or {}).get("pointerLockState") == "free" and read_snapshot(session),
        timeout=8,
        message="pointer lock exit via right click",
    )
    right_click_canvas(session)
    wait_for(
        lambda: (read_snapshot(session) or {}).get("pointerLockState") == "locked",
        timeout=8,
        message="pointer lock re-enter",
    )
    send_escape(session)
    unlocked_by_escape = wait_for(
        lambda: (read_snapshot(session) or {}).get("pointerLockState") == "free" and read_snapshot(session),
        timeout=8,
        message="pointer lock exit via escape",
    )

    session.screenshot(args.out_shot)
    report = {
        "baseline": baseline,
        "locked": locked,
        "unlocked_by_click": unlocked_by_click,
        "unlocked_by_escape": unlocked_by_escape,
    }
    with open(args.out_json, "w", encoding="utf-8") as handle:
        json.dump(report, handle, ensure_ascii=False, indent=2)

    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except urllib.error.URLError as exc:
        print(f"WebDriver request failed: {exc}", file=sys.stderr)
        sys.exit(2)
    except Exception as exc:  # pragma: no cover
        print(str(exc), file=sys.stderr)
        sys.exit(1)
