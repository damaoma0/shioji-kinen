/* 潮路記念財団 共通スクリプト: AI翻訳（日本語／English／中文） and a note for whoever opens the console. */
(function () {
  var LANGS = { ja: '日本語（原文）', en: 'English', zh: '中文' };
  var NOTICE = {
    en: 'AI translation (beta): this page was translated by machine and may be inaccurate. Some handwritten text could not be translated.',
    zh: 'AI翻译（测试版）：本页由机器翻译，可能不准确。部分手写文字无法翻译。'
  };
  function load() { try { return localStorage.getItem('shioji.lang') || 'ja'; } catch (e) { return 'ja'; } }
  function save(l) { try { localStorage.setItem('shioji.lang', l); } catch (e) {} }

  var current = 'ja';
  window.ShiojiLang = { get: function () { return current; } };

  var root, original, notice, btn, menu;

  function apply(l) {
    if (!LANGS[l]) l = 'ja';
    current = l;
    document.documentElement.setAttribute('data-tr', l);
    if (root) {
      var t = document.getElementById('tr-' + l);
      root.innerHTML = (l === 'ja' || !t) ? original : t.innerHTML;
    }
    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (!el.hasAttribute('data-ja')) el.setAttribute('data-ja', el.textContent);
      el.textContent = l === 'ja' ? el.getAttribute('data-ja') : (el.getAttribute('data-' + l) || el.getAttribute('data-ja'));
    });
    document.querySelectorAll('[data-en-ph]').forEach(function (el) {
      if (!el.hasAttribute('data-ja-ph')) el.setAttribute('data-ja-ph', el.placeholder);
      el.placeholder = l === 'ja' ? el.getAttribute('data-ja-ph') : (el.getAttribute('data-' + l + '-ph') || el.getAttribute('data-ja-ph'));
    });
    if (notice) { notice.hidden = l === 'ja'; notice.textContent = NOTICE[l] || ''; }
    if (btn) btn.lastChild.textContent = l === 'ja' ? 'AI翻訳' : (l === 'en' ? 'AI Translate' : 'AI翻译');
    if (menu) menu.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.l === l ? 'true' : 'false'); });
    window.dispatchEvent(new CustomEvent('shioji:lang', { detail: l }));
  }

  function build() {
    root = document.getElementById('tr-root');
    original = root ? root.innerHTML : null;

    var box = document.createElement('div');
    box.className = 'lang';
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-btn';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    var icon = document.createElement('span');
    icon.className = 'lang-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '文A';
    btn.appendChild(icon);
    btn.appendChild(document.createTextNode('AI翻訳'));
    menu = document.createElement('div');
    menu.className = 'lang-menu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    Object.keys(LANGS).forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'menuitemradio');
      b.dataset.l = k;
      b.textContent = LANGS[k];
      b.addEventListener('click', function () { save(k); apply(k); menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); });
      menu.appendChild(b);
    });
    btn.addEventListener('click', function () {
      menu.hidden = !menu.hidden;
      btn.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
    });
    document.addEventListener('click', function (ev) {
      if (!box.contains(ev.target)) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    });
    box.appendChild(btn);
    box.appendChild(menu);

    var host = document.querySelector('header.site .wrap');
    if (host) host.appendChild(box);
    else { box.classList.add('lang-float'); document.body.appendChild(box); }

    notice = document.createElement('div');
    notice.className = 'tr-note';
    notice.hidden = true;
    var main = document.querySelector('main') || document.querySelector('.portal') || document.querySelector('.plain');
    if (main) main.parentNode.insertBefore(notice, main);

    apply(load());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();

  try {
    console.log('%c潮路アーカイブ', 'font:700 16px serif;color:#1d3550');
    console.log(
      'ここを開いた人へ。\n' +
      '抜かれた写真は、消される前に私が別に残しました。\n' +
      '鍵は、あの子が毎年書いていく言葉と、台帳から抜かれた番号。\n' +
      '検索窓に、そのまま。\n' +
      '　　　　　　　　　　　　　　　— 仁科');
    console.log(
      '[AI translation] To whoever opens this: I saved the photographs that were taken out before they could be destroyed. ' +
      'The key is the words she writes every year, and the numbers taken out of the register. Type it into the search box as it is. — Nishina\n' +
      '[AI翻译] 给打开这里的人：被抽走的照片，我在它们被销毁之前另外保存了。密钥是那个孩子每年写下的话，加上从台账里抽走的编号。直接输入检索框。——仁科');
  } catch (e) {}
})();
