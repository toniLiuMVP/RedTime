/**
 * narrative-audio.js — 環境音層次 + 動態 BGM（H7 + H8）
 *
 * 跟 lm402 主 BGM（app.js AudioContext）並行不衝突。
 *
 * 公開 API：
 *   const a = createNarrativeAudio();
 *   a.startWind({ cutoff: 600, targetVolume: 0.08 });   // H7 程式生成風聲
 *   a.stopWind();
 *   a.startBell({ frequency: 440, intervalMs: 11000 }); // 偶爾遠處鐘聲
 *   a.stopBell();
 *   a.crossfadeBGM('path/to/song.mp3', { duration: 2000, targetVolume: 0.5 });
 *   a.stopBGM(2000);
 *   a.setAmbientVolume(0.5);
 *
 * 從 console 試：
 *   window.__AUDIO_LAYER__.startWind();
 *   window.__AUDIO_LAYER__.startBell();
 */

export function createNarrativeAudio() {
  let audioCtx = null;
  let masterAmbientGain = null;
  let windNode = null;
  let bellTimer = null;
  let bgmEl = null;

  function ensureCtx() {
    if (!audioCtx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) {
        console.warn("[narrative-audio] Web Audio API not supported");
        return null;
      }
      audioCtx = new Ctor();
      masterAmbientGain = audioCtx.createGain();
      masterAmbientGain.gain.value = 0.0;
      masterAmbientGain.connect(audioCtx.destination);
    }
    // 瀏覽器要求 user gesture 才能 resume
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  // ─── H7 風聲 ambient（程式生成） ───
  function startWind(opts = {}) {
    const ctx = ensureCtx();
    if (!ctx) return;
    if (windNode) return;

    const cutoff = opts.cutoff ?? 600;
    const targetVolume = opts.targetVolume ?? 0.08;
    const fadeIn = opts.fadeIn ?? 1.5;

    // 4 秒 white noise loop buffer
    const bufferSize = Math.floor(ctx.sampleRate * 4);
    const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    // 低通濾波（風聲 = 低頻 noise）
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    filter.Q.value = 1.2;

    // LFO 慢速調制 gain（風強度起伏）
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 0.3 * targetVolume;
    lfo.connect(lfoGain);

    const windGain = ctx.createGain();
    windGain.gain.value = targetVolume * 0.7;
    lfoGain.connect(windGain.gain); // LFO 加成

    src.connect(filter);
    filter.connect(windGain);
    windGain.connect(masterAmbientGain);

    src.start();
    lfo.start();

    windNode = { src, lfo, filter, windGain };

    // master fade in
    masterAmbientGain.gain.cancelScheduledValues(ctx.currentTime);
    masterAmbientGain.gain.setValueAtTime(masterAmbientGain.gain.value, ctx.currentTime);
    masterAmbientGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + fadeIn);
  }

  function stopWind(fadeOut = 1.0) {
    if (!windNode || !audioCtx) return;
    masterAmbientGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterAmbientGain.gain.setValueAtTime(masterAmbientGain.gain.value, audioCtx.currentTime);
    masterAmbientGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeOut);
    const node = windNode;
    windNode = null;
    setTimeout(() => {
      try { node.src.stop(); node.lfo.stop(); } catch (e) {}
    }, (fadeOut + 0.1) * 1000);
  }

  // ─── 偶爾遠處鐘聲（程式生成 sine wave + 衰減）───
  function ringBellOnce(opts = {}) {
    const ctx = ensureCtx();
    if (!ctx) return;
    const freq = opts.frequency ?? 440;
    const dur = opts.duration ?? 2.5;
    const volume = opts.volume ?? 0.06;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const harmonic = ctx.createOscillator();
    harmonic.type = "sine";
    harmonic.frequency.value = freq * 2.756; // 鐘的物理 harmonic 比例
    const harmonicGain = ctx.createGain();
    harmonicGain.gain.value = 0.3;

    const env = ctx.createGain();
    env.gain.value = 0;
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);  // 快速 attack
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur); // 自然衰減

    osc.connect(env);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(env);
    env.connect(masterAmbientGain);

    osc.start();
    harmonic.start();
    osc.stop(ctx.currentTime + dur + 0.1);
    harmonic.stop(ctx.currentTime + dur + 0.1);
  }

  function startBell(opts = {}) {
    const intervalMs = opts.intervalMs ?? 11000; // 11 秒一響（呼應 11:00 narrative beat）
    if (bellTimer) return;
    ringBellOnce(opts);
    bellTimer = setInterval(() => ringBellOnce(opts), intervalMs);
  }
  function stopBell() {
    if (bellTimer) { clearInterval(bellTimer); bellTimer = null; }
  }

  // ─── H8 BGM crossfade ───
  function crossfadeBGM(url, opts = {}) {
    const dur = opts.duration ?? 2000;
    const targetVol = opts.targetVolume ?? 0.5;
    const newAudio = new Audio(url);
    newAudio.loop = opts.loop !== false;
    newAudio.volume = 0;
    newAudio.crossOrigin = "anonymous";

    const playPromise = newAudio.play();
    if (playPromise) playPromise.catch((e) => console.warn("[narrative-audio] BGM play failed:", e));

    const fadeStart = performance.now();
    const oldAudio = bgmEl;
    const oldStartVol = oldAudio ? oldAudio.volume : 0;

    const fadeTimer = setInterval(() => {
      const t = Math.min(1, (performance.now() - fadeStart) / dur);
      newAudio.volume = t * targetVol;
      if (oldAudio) oldAudio.volume = oldStartVol * (1 - t);
      if (t >= 1) {
        clearInterval(fadeTimer);
        newAudio.volume = targetVol;
        if (oldAudio) {
          oldAudio.volume = 0;
          oldAudio.pause();
          oldAudio.src = "";
        }
      }
    }, 16);

    bgmEl = newAudio;
    return newAudio;
  }

  function stopBGM(fadeOut = 2000) {
    if (!bgmEl) return;
    const audio = bgmEl;
    bgmEl = null;
    const startVol = audio.volume;
    const start = performance.now();
    const fadeTimer = setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / fadeOut);
      audio.volume = startVol * (1 - t);
      if (t >= 1) {
        clearInterval(fadeTimer);
        audio.volume = 0;
        audio.pause();
        audio.src = "";
      }
    }, 16);
  }

  function setAmbientVolume(v) {
    if (!audioCtx || !masterAmbientGain) return;
    const clamped = Math.max(0, Math.min(1, v));
    masterAmbientGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterAmbientGain.gain.linearRampToValueAtTime(clamped, audioCtx.currentTime + 0.5);
  }

  function dispose() {
    stopWind(0.1);
    stopBell();
    stopBGM(200);
    if (audioCtx) {
      try { audioCtx.close(); } catch (e) {}
      audioCtx = null;
    }
  }

  return {
    startWind, stopWind,
    startBell, stopBell, ringBellOnce,
    crossfadeBGM, stopBGM,
    setAmbientVolume,
    dispose,
    getContext: () => audioCtx,
  };
}
