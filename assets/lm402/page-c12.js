// lm402.html inline classic #12 外部化（CSP 撤 unsafe-inline）
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var READER = "reader.html";
  var GUIDE = [
{ angle: "學長角度", sub: "他怎麼被那一眼點燃", first: 3, eps: [
  { ep: 3, t: "他趕到前門撲了個空，一通「你走到後門」把他推向命運的轉角，抬眼第一秒就脫口而出「也太像徐若瑄了吧」。這是整個故事被點燃的原點。" },
  { ep: 5, t: "閉上眼，浮現的永遠是那天她走出教室的一眼。一鍋咖哩雞的笨拙約會，原來早就被這一眼釘住。" },
  { ep: 28, t: "二十年後在車裡重提這一眼，他才懂當年聽不懂的「我要走了」，其實是「別離開我」。" },
  { ep: 18, t: "出意外前人生跑馬燈閃過十秒，全是她。原來那一眼之後，眼睛睜開看到的全部都是妳。" }
]},
{ angle: "學妹角度", sub: "那一秒裡她的內在全景", first: 38, eps: [
  { ep: 38, t: "一眼前的二十分鐘，她二十九歲的身體裡住著十八歲的意識。不同年紀的自己全擠進來七嘴八舌幫她站好、別逃。" },
  { ep: 12, t: "站在後門的是她。整整六十秒「你即將把我記在心裡」，原來這一眼是她跨越時間精心校準、卻又忍住不能抱的告別。" },
  { ep: 11, t: "為了不錯過那通電話、不錯過這一眼，她一次次重來時間循環，倒背如流的台詞還是會緊張到脫稿。" },
  { ep: 32, t: "她與他互為彼此的一眼瞬間。1994 年穿堂的初動心，與 2005 年後門的對視，在同一條紅線上閉合。" }
]},
{ angle: "女兒角度", sub: "她飛進這一秒去看", first: 21, eps: [
  { ep: 21, t: "她睡著就能飛進把拔和阿姨的每一條時間線，看見那個被打上五顆星的最大光點。原來那一眼是被命運標星珍藏的一天。" },
  { ep: 23, t: "她飛進那一秒兩個人的心裡：外面是「妳好像徐若瑄」，裡面是「這一次，依然再次遇見妳」。" },
  { ep: 22, t: "她追著把拔和阿姨手上那條會發光的紅線，發現不管穿越到哪條時間線，兩條線永遠會找到彼此。" },
  { ep: 41, t: "故事的收束。她終於明白，手握「知道」也救不了當下的人，於是選擇跟把拔一樣願意相信，讓這一眼在二十年後仍有回聲。" }
]}
  ];
  function ce(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  var _bd = null;
  function onKey(e) { if (e.key === "Escape") close(); }
  function close() { if (!_bd) return; var bd = _bd; _bd = null; bd.classList.remove("show"); try { document.body.style.overflow = ""; } catch (e) {} setTimeout(function () { if (bd.parentNode) bd.parentNode.removeChild(bd); }, 400); document.removeEventListener("keydown", onKey); }
  function open() {
var olds = document.querySelectorAll(".gg-backdrop"); for (var i = 0; i < olds.length; i++) { if (olds[i].parentNode) olds[i].parentNode.removeChild(olds[i]); }
var bd = ce("div", "gg-backdrop"); bd.setAttribute("role", "dialog"); bd.setAttribute("aria-modal", "true"); bd.setAttribute("aria-label", "一眼瞬間導覽");
var card = ce("div", "gg-card");
var x = ce("button", "gg-close", "×"); x.setAttribute("aria-label", "關閉"); x.addEventListener("click", close); card.appendChild(x);
card.appendChild(ce("div", "gg-kicker", "LM402 · 一眼瞬間導覽"));
card.appendChild(ce("div", "gg-title", "那一眼只有一秒。"));
card.appendChild(ce("div", "gg-intro", "從三個角度，讀懂它為什麼亮著。每一段都可以直接點進去讀。"));
GUIDE.forEach(function (g) {
  var sec = ce("div", "gg-section");
  var head = ce("div", "gg-section-head");
  head.appendChild(ce("span", "gg-angle", g.angle));
  head.appendChild(ce("span", "gg-sub", g.sub));
  sec.appendChild(head);
  g.eps.forEach(function (e) {
    var row = ce("a", "gg-ep"); row.href = READER + "#ep-" + e.ep;
    row.appendChild(ce("span", "gg-ep-num", "EP" + e.ep + (e.ep === g.first ? " · 先讀這集" : "")));
    row.appendChild(ce("span", "gg-ep-hook", e.t));
    sec.appendChild(row);
  });
  card.appendChild(sec);
});
var foot = ce("a", "gg-readall", "📖 直接閱讀全集 · EP0 到 EP41 →"); foot.href = READER; card.appendChild(foot);
bd.appendChild(card); document.body.appendChild(bd);
bd.addEventListener("click", function (e) { if (e.target === bd) close(); });
document.addEventListener("keydown", onKey);
requestAnimationFrame(function () { bd.classList.add("show"); });
try { document.body.style.overflow = "hidden"; } catch (e) {}
_bd = bd;
  }
  window.__GATE_GUIDE__ = { open: open };
})();
