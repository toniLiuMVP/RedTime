// lm402-parallel.html page boot — 抽自 inline `<script>` IIFE chunks(round 26 CSP 收斂)
// 對應 § 安全紀律補強 #2:CSP 'unsafe-inline' 收斂

(function () {
      const _OriginalAudio = window.Audio;
      const _trackedAudios = new Set();
      // Hook Audio constructor — 自動追蹤所有 new Audio()（即使 audio element 沒 attach 到 DOM 也能找到）
      window.Audio = function (...args) {
        const a = new _OriginalAudio(...args);
        _trackedAudios.add(a);
        return a;
      };
      window.Audio.prototype = _OriginalAudio.prototype;

      function stopAllAudio() {
        // 1. 透過 hook 追蹤的所有 new Audio() 實例
        _trackedAudios.forEach((a) => {
          try { a.pause(); } catch (e) {}
        });
        // 2. DOM 內的 <audio> / <video> 元素（保險網）
        document.querySelectorAll("audio, video").forEach((el) => {
          try { el.pause(); } catch (e) {}
        });
        // 3. Web Audio API path：suspend AudioContext（如果有 expose）
        if (window.__AUDIO_CONTEXT__ && typeof window.__AUDIO_CONTEXT__.suspend === "function") {
          try { window.__AUDIO_CONTEXT__.suspend(); } catch (e) {}
        }
      }

      // visibilitychange：分頁切走 / 視窗最小化 → 停
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stopAllAudio();
      });
      // pagehide：頁面卸載（關分頁、關視窗、退瀏覽器）→ 停
      window.addEventListener("pagehide", stopAllAudio);
      // beforeunload：再保險一道
      window.addEventListener("beforeunload", stopAllAudio);
    })();

// ───────────────── chunk break ─────────────────

// Loading tips — cycle through game hints while loading
      (function () {
        const tips = [
          "轉動視角，每一個角落都藏著 2005 年的痕跡",
          "靠近發光的物件——那些光記得你還沒聽見的事",
          "這裡藏著四種結局，取決於你站在哪裡、記住了什麼",
          "每一個選擇，都會影響女兒最後看見的那一秒",
          "留意紅線——它從來不會帶你走錯路",
          "光源的方向在暗示你：時間正在往前推"
        ];
        const tipEl = document.getElementById("loader-tip");
        if (!tipEl) return;
        let idx = 0;
        tipEl.textContent = tips[0];
        const tipTimer = setInterval(function () {
          tipEl.style.opacity = "0";
          setTimeout(function () {
            idx = (idx + 1) % tips.length;
            tipEl.textContent = tips[idx];
            tipEl.style.opacity = "1";
          }, 500);
        }, 4000);
        // 暴露給 app.js — 場景進入、loader 消失後 clearInterval，避免 timer 與 DOM refs 洩漏
        window.__lm402LoaderTipTimer = tipTimer;
      })();

      // Fallback: if ES module fails to load (e.g. file:// protocol), show help after 6s
      // C9: only kick in AFTER the cinematic gate has been entered; before that, nothing is loading yet.
      window.__lm402Ready = false;
      window.__lm402GateEntered = false;
      setTimeout(function () {
        if (window.__lm402Ready) return;
        if (!window.__lm402GateEntered) return;
        var loader = document.getElementById("lm402-loader");
        if (!loader) return;
        var inner = loader.querySelector(".loader-inner");
        if (!inner) return;
        var hint = document.createElement("div");
        hint.style.cssText =
          "margin-top:24px;padding:16px 20px;border:1px solid rgba(217,179,106,.3);border-radius:12px;background:rgba(217,179,106,.06);max-width:360px;text-align:center";

        var msg = document.createElement("div");
        msg.style.cssText = "font:300 13px/1.8 'Noto Sans TC',sans-serif;color:rgba(238,232,222,.7)";
        msg.textContent = "場景載入似乎卡住了。";
        hint.appendChild(msg);

        var detail = document.createElement("div");
        detail.style.cssText = "font:300 12px/1.7 'Noto Sans TC',sans-serif;color:rgba(238,232,222,.5);margin-top:8px;text-align:left";
        detail.textContent = "直接從檔案開啟（file://）不支援 3D 場景。請用本機伺服器（npx serve .）或部署到網頁空間。";
        hint.appendChild(detail);

        var link = document.createElement("a");
        link.href = "index.html";
        link.textContent = "返回首頁";
        link.style.cssText = "display:inline-block;margin-top:14px;padding:8px 20px;border:1px solid rgba(115,208,165,.4);border-radius:4px;color:#73d0a5;text-decoration:none;font:400 11px 'DM Mono',monospace;letter-spacing:.12em";
        hint.appendChild(link);

        inner.appendChild(hint);
      }, 6000);

// ───────────────── chunk break ─────────────────

// C9: side-panel 收合／展開切換 — 讓玩家可手動隱藏右側關卡進度欄
      (function () {
        var STORAGE_KEY = "lm402.sidePanelCollapsed";
        var panel = document.getElementById("side-panel");
        var collapseBtn = document.getElementById("side-panel-collapse-btn");
        var revealBtn = document.getElementById("side-panel-reveal");
        if (!panel || !collapseBtn || !revealBtn) return;

        function setCollapsed(collapsed, persist) {
          if (collapsed) {
            panel.classList.add("is-collapsed");
            document.body.classList.add("side-panel-collapsed");
            panel.setAttribute("aria-hidden", "true");
            collapseBtn.setAttribute("aria-expanded", "false");
            revealBtn.classList.add("is-visible");
          } else {
            panel.classList.remove("is-collapsed");
            document.body.classList.remove("side-panel-collapsed");
            panel.removeAttribute("aria-hidden");
            collapseBtn.setAttribute("aria-expanded", "true");
            revealBtn.classList.remove("is-visible");
          }
          if (persist !== false) {
            try { localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0"); } catch (e) { /* noop */ }
          }
          // 告訴 Three.js renderer 重新計算 canvas 尺寸（stage 剛剛改變寬度）
          // 立刻打一次讓 canvas backing store 立刻同步，避免拉伸；
          // 再在 CSS transition 結束後補一次，確保最終尺寸正確
          window.dispatchEvent(new Event("resize"));
          setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 400);
        }

        // 還原先前狀態
        try {
          if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true, false);
        } catch (e) { /* noop */ }

        collapseBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          setCollapsed(true, true);
          revealBtn.focus();
        });

        revealBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          setCollapsed(false, true);
          collapseBtn.focus();
        });

        // 快捷鍵：Tab 旁邊的反引號 ` 或 T 鍵切換（不攔截 WASD/F/R/G 等遊戲鍵）
        document.addEventListener("keydown", function (e) {
          if (e.key !== "`" && e.key !== "~") return;
          var target = e.target;
          if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
          e.preventDefault();
          setCollapsed(!panel.classList.contains("is-collapsed"), true);
        });
      })();

// ───────────────── chunk break ─────────────────

// Cinematic letterbox observer — watches intro/ending state to toggle bars
      (function () {
        var body = document.body;
        var introFx = document.getElementById("intro-fx");
        var endingOverlay = document.getElementById("ending-overlay");

        function updateCinematic() {
          var introActive = introFx && introFx.classList.contains("intro-fx-active");
          var endingVisible = endingOverlay && !endingOverlay.hidden;
          if (introActive || endingVisible) {
            body.classList.add("cinematic-mode");
          } else {
            body.classList.remove("cinematic-mode");
          }
        }

        // Observe intro-fx class changes
        if (introFx) {
          new MutationObserver(updateCinematic).observe(introFx, { attributes: true, attributeFilter: ["class"] });
        }
        // Observe ending-overlay hidden attribute
        if (endingOverlay) {
          new MutationObserver(updateCinematic).observe(endingOverlay, { attributes: true, attributeFilter: ["hidden"] });
        }

        updateCinematic();
      })();

// ───────────────── chunk break ─────────────────

// Ultimate safety net: force-kill intro overlay after 25s no matter what
      // This catches cases where JS errors kill the tick loop before finishIntro runs
      // C9: 只在使用者已進入玄關後才啟動，避免使用者停留在 gate 畫面時被誤觸發
      setTimeout(function () {
        if (!window.__lm402GateEntered) return;
        var fx = document.getElementById("intro-fx");
        if (fx && fx.classList.contains("intro-fx-active")) {
          console.warn("[safety] intro-fx still active after 25s — force removing");
          fx.classList.remove("intro-fx-active");
          fx.classList.add("intro-fx-done");
          fx.style.opacity = "0";
          fx.style.display = "none";
          document.body.classList.remove("cinematic-mode");
        }
      }, 25000);

// ───────────────── chunk break ─────────────────

(function () {
        const btn = document.getElementById("lm402-polaroid-btn");
        const flash = document.getElementById("lm402-polaroid-flash");
        let busy = false;
        btn.addEventListener("click", async () => {
          if (busy) return;
          busy = true;
          // 拍照閃光特效（白屏 100ms）
          flash.classList.add("flash");
          setTimeout(() => flash.classList.remove("flash"), 120);
          try {
            const mod = await import("./assets/lm402-parallel/polaroid.js");
            const cam = mod.createPolaroidCapture({
              getCanvas: () => document.querySelector("canvas"),
              getYear: () => (window.__LM402_YEAR__ ?? "2005"),
              subtitle: "LM402 · 一眼瞬間",
            });
            const ok = cam.snapAndDownload();
            if (!ok) console.warn("[polaroid] 拍照失敗，請進入場景後再試");
          } catch (e) {
            console.error("[polaroid] error:", e);
          }
          setTimeout(() => { busy = false; }, 600);
        });
      })();
