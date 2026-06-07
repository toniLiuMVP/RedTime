// CSP style-src 收斂 shim
// 各 JS 模組常用 `document.createElement('style') + textContent + head.appendChild` 自帶 CSS。
// 撤 style-src 'unsafe-inline' 後這種動態 <style> 會被擋。此 shim 攔截 head 的 <style> append，
// 改用 constructable stylesheet（adoptedStyleSheets）— 不受 style-src 'unsafe-inline' 管轄，
// 讓所有模組的自帶 CSS 在 style-src 'self' 下仍正常生效。
//
// 必須是頁面第一個 script（在任何注入 style 的模組之前）。
// 安全性：經核實，本站所有注入模組都「只設一次 textContent 後 append」，無 append 後回讀
// .sheet / .textContent += / insertRule 的情形，故攔截不破壞任何模組。
(function () {
  if (typeof document === "undefined" || !document.head) return;
  if (
    !("adoptedStyleSheets" in Document.prototype) ||
    typeof CSSStyleSheet === "undefined" ||
    !CSSStyleSheet.prototype ||
    typeof CSSStyleSheet.prototype.replaceSync !== "function"
  ) {
    return; // 舊瀏覽器（無 constructable stylesheet）不攔截，維持原行為
  }
  var head = document.head;
  var orig = head.appendChild.bind(head);
  head.appendChild = function (node) {
    if (node && node.nodeName === "STYLE" && node.textContent) {
      try {
        var sheet = new CSSStyleSheet();
        sheet.replaceSync(node.textContent);
        document.adoptedStyleSheets = document.adoptedStyleSheets.concat(sheet);
        return node; // 視為成功（節點未真的進 DOM，但 CSS 已透過 adoptedStyleSheets 生效）
      } catch (e) {
        /* 落回原生 append（極少數情形）*/
      }
    }
    return orig(node);
  };
})();
