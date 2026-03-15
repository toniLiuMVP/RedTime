#!/usr/bin/env python3
import argparse
import atexit
import base64
import json
import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


class WebDriverError(RuntimeError):
    def __init__(self, status, body):
        super().__init__(f"HTTP {status}: {body}")
        self.status = status
        self.body = body


def request_json(url, method="GET", body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Content-Type", "application/json;charset=UTF-8")
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        payload = exc.read().decode("utf-8", errors="replace")
        raise WebDriverError(exc.code, payload) from exc
    return json.loads(payload) if payload else {}


def wait_for(predicate, timeout=12, interval=0.12, message="condition"):
    deadline = time.time() + timeout
    last_value = None
    while time.time() < deadline:
        last_value = predicate()
        if last_value:
            return last_value
        time.sleep(interval)
    raise RuntimeError(f"Timed out waiting for {message}: {last_value!r}")


def rects_overlap(a, b):
    if not a or not b:
        return False
    return not (
        a["right"] <= b["left"]
        or a["left"] >= b["right"]
        or a["bottom"] <= b["top"]
        or a["top"] >= b["bottom"]
    )


def ensure_directory(path):
    os.makedirs(path, exist_ok=True)


def port_is_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.4)
        return sock.connect_ex(("127.0.0.1", port)) == 0


def start_driver_if_needed(driver_url):
    port = urllib.parse.urlparse(driver_url).port or 5555
    if port_is_open(port):
        return None
    process = subprocess.Popen(
        ["safaridriver", "-p", str(port)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    wait_for(lambda: port_is_open(port), timeout=8, message="safaridriver")
    return process


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
        value = response.get("value", {})
        self.session_id = response.get("sessionId") or value.get("sessionId")
        return response

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

    def perform_actions(self, actions):
        request_json(f"{self.session_url}/actions", method="POST", body={"actions": actions})

    def release_actions(self):
        request_json(f"{self.session_url}/actions", method="DELETE")

    def screenshot(self, path):
        response = request_json(f"{self.session_url}/screenshot", method="GET")
        with open(path, "wb") as handle:
            handle.write(base64.b64decode(response["value"]))

    def set_window_rect(self, x, y, width, height):
        request_json(
            f"{self.session_url}/window/rect",
            method="POST",
            body={"x": x, "y": y, "width": width, "height": height},
        )


def wait_for_snapshot(session):
    return wait_for(
        lambda: session.execute(
            """
            if (!window.__LM402_DEBUG__) return null;
            return window.__LM402_DEBUG__.snapshot();
            """
        ),
        timeout=20,
        message="debug snapshot",
    )


def call_debug(session, expression):
    return session.execute(
        f"""
        if (!window.__LM402_DEBUG__) return null;
        return ({expression});
        """
    )


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
          height: Math.round(rect.height)
        };
        """
    )
    if not rect:
        raise RuntimeError("Canvas not found.")
    session.perform_actions(
        [
            {
                "type": "pointer",
                "id": "mouse",
                "parameters": {"pointerType": "mouse"},
                "actions": [
                    {"type": "pointerMove", "duration": 0, "x": rect["x"], "y": rect["y"], "origin": "viewport"},
                    {"type": "pointerDown", "button": 2},
                    {"type": "pause", "duration": 90},
                    {"type": "pointerUp", "button": 2},
                ],
            }
        ]
    )
    session.release_actions()
    return rect


def send_escape(session):
    session.perform_actions(
        [
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
    )
    session.release_actions()


def assert_visible(node, name):
    if not node or not node.get("visible"):
        raise RuntimeError(f"{name} is not visible in the current frame.")


def assert_mobile_layout(snapshot, width, height):
    subtitle = snapshot.get("subtitleBounds")
    controls = snapshot.get("controlBounds")
    objective = snapshot.get("objectiveBounds")
    if not subtitle:
        raise RuntimeError(f"subtitleBounds missing for mobile {width}x{height}.")
    if not controls:
        raise RuntimeError(f"controlBounds missing for mobile {width}x{height}.")
    for key, rect in controls.items():
        if rects_overlap(subtitle, rect):
            raise RuntimeError(f"subtitle overlaps {key} at {width}x{height}.")
    if objective and rects_overlap(objective, subtitle):
        raise RuntimeError(f"objective prompt overlaps subtitle rail at {width}x{height}.")


def assert_front_frame(snapshot):
    renderer = snapshot["renderer"]
    viewport = renderer["viewport"]
    width = viewport["width"]
    height = viewport["height"]
    senior = renderer["projectedNodes"]["senior"]
    front_door = renderer["projectedNodes"]["frontDoor"]
    parapet = renderer["projectedNodes"]["parapetBand"]
    assert_visible(senior, "senior")
    assert_visible(front_door, "frontDoor")
    assert_visible(parapet, "parapetBand")
    if senior["screenX"] < width * 0.18 or senior["screenX"] > width * 0.74:
        raise RuntimeError("senior is out of the front-call composition band.")
    if front_door["screenX"] < width * 0.12 or front_door["screenX"] > width * 0.7:
        raise RuntimeError("front door is out of the front-call composition band.")
    if parapet["screenX"] > width * 0.28:
        raise RuntimeError("parapet daylight band is not reading on the corridor side.")
    if senior["screenY"] < height * 0.2 or senior["screenY"] > height * 0.86:
        raise RuntimeError("senior vertical framing is off.")


def write_json(path, payload):
    ensure_directory(os.path.dirname(path) or ".")
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--driver-url", default="http://127.0.0.1:5555")
    parser.add_argument("--page-url", default="http://127.0.0.1:8123/lm402.html?debug=1")
    parser.add_argument("--out-json", default=".shots/lm402-verify-report.json")
    parser.add_argument("--out-dir", default=".shots")
    args = parser.parse_args()

    ensure_directory(args.out_dir)

    driver_process = start_driver_if_needed(args.driver_url)
    if driver_process:
        atexit.register(driver_process.terminate)

    session = WebDriverSession(args.driver_url)
    try:
        session.create()
    except WebDriverError as exc:
        body = exc.body.lower()
        if "remote automation" in body:
            print("Safari remote automation is not enabled. Run 'safaridriver --enable' and try again.", file=sys.stderr)
            sys.exit(3)
        raise

    atexit.register(session.delete)

    session.navigate(args.page_url)
    wait_for_snapshot(session)
    call_debug(session, "window.__LM402_DEBUG__.skipIntro(), true")
    wait_for(lambda: (wait_for_snapshot(session) or {}).get("mode") == "play", message="intro skip")

    session.set_window_rect(40, 80, 1440, 900)
    time.sleep(0.5)
    desktop_snapshot = wait_for_snapshot(session)
    assert_front_frame(desktop_snapshot)

    right_click_canvas(session)
    locked_snapshot = wait_for(lambda: (wait_for_snapshot(session) or {}).get("pointerLockState") == "locked" and wait_for_snapshot(session), message="pointer lock enter")
    right_click_canvas(session)
    unlocked_by_click = wait_for(lambda: (wait_for_snapshot(session) or {}).get("pointerLockState") == "free" and wait_for_snapshot(session), message="pointer lock exit via click")
    right_click_canvas(session)
    wait_for(lambda: (wait_for_snapshot(session) or {}).get("pointerLockState") == "locked", message="pointer lock re-enter")
    send_escape(session)
    unlocked_by_escape = wait_for(lambda: (wait_for_snapshot(session) or {}).get("pointerLockState") == "free" and wait_for_snapshot(session), message="pointer lock exit via escape")

    session.screenshot(os.path.join(args.out_dir, "lm402-verify-desktop.png"))

    call_debug(session, "window.__LM402_DEBUG__.reset(), window.__LM402_DEBUG__.skipIntro(), true")
    wait_for(lambda: (wait_for_snapshot(session) or {}).get("phase") == "front_call", message="reset to front_call")
    call_debug(session, "window.__LM402_DEBUG__.applyEffect('advance_front_call'), true")
    rear_wait_snapshot = wait_for(lambda: (wait_for_snapshot(session) or {}).get("phase") == "rear_wait" and wait_for_snapshot(session), message="rear_wait")
    call_debug(session, "window.__LM402_DEBUG__.applyEffect('advance_rear_wait'), true")
    call_debug(session, "window.__LM402_DEBUG__.applyEffect('anchor_backdoor'), true")
    eye_contact_snapshot = wait_for(lambda: (wait_for_snapshot(session) or {}).get("phase") == "eye_contact" and wait_for_snapshot(session), message="eye_contact")

    mobile_reports = {}
    for width, height in [(932, 430), (844, 390), (780, 360)]:
        session.set_window_rect(40, 80, width, height)
        time.sleep(0.4)
        call_debug(session, "window.__LM402_DEBUG__.reset(), window.__LM402_DEBUG__.skipIntro(), true")
        snapshot = wait_for(lambda: (wait_for_snapshot(session) or {}).get("phase") == "front_call" and wait_for_snapshot(session), message=f"mobile front_call {width}x{height}")
        assert_mobile_layout(snapshot, width, height)
        assert_visible(snapshot["renderer"]["projectedNodes"]["frontDoor"], f"frontDoor {width}x{height}")
        shot_name = f"lm402-verify-mobile-{width}x{height}.png"
        session.screenshot(os.path.join(args.out_dir, shot_name))
        mobile_reports[f"{width}x{height}"] = {
            "snapshot": snapshot,
            "screenshot": shot_name,
        }

    report = {
        "desktop": {
            "front_frame": desktop_snapshot,
            "pointer_lock_locked": locked_snapshot,
            "pointer_lock_unlocked_by_click": unlocked_by_click,
            "pointer_lock_unlocked_by_escape": unlocked_by_escape,
            "screenshot": "lm402-verify-desktop.png",
        },
        "phases": {
            "rear_wait": rear_wait_snapshot,
            "eye_contact": eye_contact_snapshot,
        },
        "mobile": mobile_reports,
    }
    write_json(args.out_json, report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except urllib.error.URLError as exc:
        print(f"WebDriver request failed: {exc}", file=sys.stderr)
        sys.exit(2)
    except WebDriverError as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(2)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
