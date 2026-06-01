/**
 * initiated-interactions.js — 學妹主動發起互動（C8）
 *
 * 每隔 N 秒（預設 60-120 秒隨機）學妹主動觸發一個情緒 + 旁白文字，
 * 讓玩家感覺「她有自己的內心戲，會主動跟我溝通」。
 *
 * 依賴：
 *   - window.__JUNIOR_RIG__   （expression-rig）
 *   - window.__NARRATIVE__    （narrative-overlay）
 *
 * 公開 API：
 *   const c = createInitiatedInteractions({ rig, narrative });
 *   c.start({ minSec: 60, maxSec: 120 });
 *   c.stop();
 *   c.triggerOnce(kind);  // 'greet' | 'nervous' | 'longing' | 'shy' | 'sigh'
 *
 * 從 console 試：
 *   window.__INITIATED__.triggerOnce('greet');
 *   window.__INITIATED__.start();
 */

// 內心戲腳本（toni 原文 + narrative beat 風格短句，避免創作劇情）
const INTERACTIONS = [
  {
    kind: "greet",
    smile: 0.55,
    browRaise: 0.10,
    blush: 0.45,
    narrative: { speaker: "學妹", text: "你來了。" },
  },
  {
    kind: "nervous",
    smile: 0.20,
    browRaise: 0.45,
    blush: 0.30,
    sweat: 0.40,
    narrative: { speaker: "學妹", text: "心跳好快。" },
  },
  {
    kind: "longing",
    smile: 0.30,
    lookYOffset: 0.30,
    blush: 0.55,
    narrative: { speaker: "學妹", text: "我等了好久。" },
  },
  {
    kind: "shy",
    smile: 0.40,
    blush: 0.85,
    lookYOffset: -0.20,
    narrative: { speaker: null, text: "（她臉紅了。）" },
  },
  {
    kind: "sigh",
    smile: 0.05,
    browRaise: 0.15,
    mouthOpen: 0.18,
    narrative: { speaker: "學妹", text: "嗯......" },
  },
  {
    kind: "remember",
    smile: 0.25,
    lookYOffset: 0.20,
    narrative: { speaker: "29 歲的聲音", text: "保持微笑，看起來鎮定就好。" },
  },
];

export function createInitiatedInteractions(options = {}) {
  const getRig = options.getRig ?? (() => window.__JUNIOR_RIG__);
  const getNarrative = options.getNarrative ?? (() => window.__NARRATIVE__);

  let timer = null;
  let activeReset = null;

  function applyInteraction(interaction) {
    const rig = getRig();
    const narrative = getNarrative();

    if (rig?.state) {
      // 暫存 pre-interaction state（讓 reset 可平滑回退）
      const prev = {
        smile: rig.state.smile,
        browRaise: rig.state.browRaise,
        blush: rig.state.blush,
        sweat: rig.state.sweat,
        mouthOpen: rig.state.mouthOpen,
      };
      // 套用 interaction
      rig.state.smile = interaction.smile ?? rig.state.smile;
      rig.state.browRaise = interaction.browRaise ?? rig.state.browRaise;
      if (interaction.blush !== undefined) rig.state.blush = interaction.blush;
      if (interaction.sweat !== undefined) rig.state.sweat = interaction.sweat;
      if (interaction.mouthOpen !== undefined) rig.state.mouthOpen = interaction.mouthOpen;

      // lookYOffset 是「相對 base lookY 的 offset」（避免破壞 gaze AI）
      if (interaction.lookYOffset !== undefined) {
        rig.state.lookY = Math.max(-1, Math.min(1, rig.state.lookY + interaction.lookYOffset));
      }

      // 3 秒後 reset 到 prev（讓 gaze AI / micro 系統接管）
      if (activeReset) clearTimeout(activeReset);
      activeReset = setTimeout(() => {
        if (rig?.state) {
          rig.state.smile = prev.smile;
          rig.state.browRaise = prev.browRaise;
          rig.state.blush = prev.blush;
          rig.state.sweat = prev.sweat;
          rig.state.mouthOpen = prev.mouthOpen;
        }
        activeReset = null;
      }, 3500);
    }

    // 顯示 narrative
    if (narrative && interaction.narrative) {
      narrative.show(
        interaction.narrative.speaker,
        interaction.narrative.text,
        { typewriter: true, autoHideAfter: 4500 }
      );
    }
  }

  function triggerOnce(kind) {
    let interaction;
    if (kind) {
      interaction = INTERACTIONS.find((i) => i.kind === kind);
      if (!interaction) {
        console.warn("[initiated] unknown kind:", kind, "available:", INTERACTIONS.map((i) => i.kind));
        return;
      }
    } else {
      interaction = INTERACTIONS[Math.floor(Math.random() * INTERACTIONS.length)];
    }
    applyInteraction(interaction);
    return interaction.kind;
  }

  function scheduleNext(minSec, maxSec) {
    const delay = (minSec + Math.random() * (maxSec - minSec)) * 1000;
    timer = setTimeout(() => {
      triggerOnce();
      scheduleNext(minSec, maxSec);
    }, delay);
  }

  function start(opts = {}) {
    const minSec = opts.minSec ?? 60;
    const maxSec = opts.maxSec ?? 120;
    if (timer) return;
    scheduleNext(minSec, maxSec);
  }

  function stop() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (activeReset) { clearTimeout(activeReset); activeReset = null; }
  }

  return {
    start,
    stop,
    triggerOnce,
    inspectKinds: () => INTERACTIONS.map((i) => i.kind),
  };
}
