/* 潮路アーカイブ: search. Player input is only ever shown with textContent. */
(function () {
  var S = window.Shioji;
  var LANG = function () { return (window.ShiojiLang && window.ShiojiLang.get()) || 'ja'; };
  var T = {
    ja: { found: ' 件見つかりました。', none: '該当する資料は見つかりませんでした。', empty: 'キーワードを入力してください。',
          rcount: ' 件', rhead: '閲覧制限資料（restricted = 1）　閲覧キーが必要です', hint: 'ヒント：', key: '閲覧キー',
          open: '開く', checking: '照合中…', wrong: '閲覧キーが正しくありません',
          all: function (n, r) { return '公開資料 ' + n + ' 件を表示しています。※ 閲覧制限 ' + r + ' 件は表示ポリシーにより除外されました（restricted = 1）'; },
          sqlhint: 'HINT:  閲覧制限資料（restricted = 1）は、この検索条件から除外されています。' },
    en: { found: ' records found.', none: 'No matching records were found.', empty: 'Please enter a keyword.',
          rcount: ' records', rhead: 'Restricted records (restricted = 1): an access key is required', hint: 'Hint: ', key: 'Access key',
          open: 'Open', checking: 'Checking…', wrong: 'Incorrect access key',
          all: function (n, r) { return 'Showing ' + n + ' public records. * ' + r + ' restricted records were excluded by the display policy (restricted = 1)'; },
          sqlhint: 'HINT:  restricted records (restricted = 1) are excluded by this search condition.' },
    zh: { found: ' 件资料符合条件。', none: '没有找到符合条件的资料。', empty: '请输入关键词。',
          rcount: ' 件', rhead: '限制阅览资料（restricted = 1）　需要阅览密钥', hint: '提示：', key: '阅览密钥',
          open: '打开', checking: '核对中…', wrong: '阅览密钥不正确',
          all: function (n, r) { return '显示公开资料 ' + n + ' 件。※ 限制阅览资料 ' + r + ' 件已按显示规则排除（restricted = 1）'; },
          sqlhint: 'HINT:  限制阅览资料（restricted = 1）已被此检索条件排除。' }
  };
  function t(k) { return (T[LANG()] || T.ja)[k]; }
  function pick(obj, field) {
    var l = LANG();
    return (l !== 'ja' && obj[field + '_' + l]) || obj[field];
  }

  var form = document.getElementById('search');
  var q = document.getElementById('q');
  var status = document.getElementById('status');
  var sqlerr = document.getElementById('sqlerr');
  var results = document.getElementById('results');
  var restricted = document.getElementById('restricted');
  var viewer = document.getElementById('viewer');
  var indexP = S.data('index.json');
  S.data('photos.json').catch(function () {}); /* 写真管理表（表示には未使用） */

  var last = null;        /* what the results area is showing, so a language change can redraw it */
  var lastDoc = null;     /* the record in the viewer */

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function reset() {
    status.textContent = '';
    sqlerr.hidden = true; sqlerr.textContent = '';
    results.textContent = '';
    restricted.hidden = true; restricted.textContent = '';
  }
  function listPublic(rows) {
    rows.forEach(function (r) {
      var li = el('li');
      var a = el('a', null, r.id + '　' + pick(r, 'title'));
      a.href = new URL(r.url, S.root).href;
      li.appendChild(a);
      li.appendChild(el('span', 'meta', pick(r, 'date_label') + '　' + pick(r, 'type')));
      results.appendChild(li);
    });
  }
  function showDoc(p) {
    lastDoc = p;
    viewer.hidden = false;
    viewer.textContent = '';
    viewer.appendChild(el('h2', null, (p.type === 'record' ? p.id + '　' : '') + pick(p, 'title')));
    var body = el('div');
    body.innerHTML = pick(p, 'html'); /* our own encrypted content, never player input */
    viewer.appendChild(body);
  }

  var RESTRICTED = /'\s*\)?\s*or\s+restricted\s*(=\s*'?1'?|=\s*true|<>\s*'?0'?|!=\s*'?0'?)\s*\)?\s*(--|#|;|$)/;
  var ALL = /'\s*\)?\s*or\s+('?1'?\s*=\s*'?1'?|true)\s*\)?\s*(--|#|;|$)/;

  async function showRestricted() {
    var rows = await S.data('restricted.json');
    status.textContent = rows.length + t('rcount');
    restricted.hidden = false;
    restricted.appendChild(el('p', 'rhead', t('rhead')));
    rows.forEach(function (r) {
      var box = el('div', 'rrow');
      box.appendChild(el('span', 'rid', r.id));
      box.appendChild(el('span', 'rdate', '████'));
      box.appendChild(el('span', 'rtitle', pick(r, 'title_redacted')));
      box.appendChild(el('span', 'rhint', t('hint') + pick(r, 'hint')));
      var f = el('form', 'rkey');
      f.autocomplete = 'off';
      var inp = el('input');
      inp.type = 'text'; inp.placeholder = t('key'); inp.id = 'key-' + r.id;
      inp.setAttribute('aria-label', r.id + ' ' + t('key'));
      var b = el('button', null, t('open')); b.type = 'submit';
      var msg = el('span', 'rmsg');
      f.appendChild(inp); f.appendChild(b); f.appendChild(msg);
      f.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        msg.textContent = t('checking');
        var p = await S.open('key|' + S.norm(inp.value));
        if (p && p.type === 'record') {
          msg.textContent = '';
          showDoc(p);
          viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          msg.textContent = t('wrong');
        }
      });
      box.appendChild(f);
      restricted.appendChild(box);
    });
  }

  async function run(raw) {
    reset();
    var index = await indexP;

    if (raw.indexOf("'") !== -1) {
      var s = raw.toLowerCase().replace(/\s+/g, ' ').trim();
      if (RESTRICTED.test(s)) { last = { mode: 'restricted' }; await showRestricted(); return; }
      if (ALL.test(s)) {
        last = { mode: 'all' };
        var nr = (await S.data('restricted.json')).length;
        status.textContent = t('all')(index.length, nr);
        listPublic(index);
        return;
      }
      last = { mode: 'error', raw: raw };
      var at = raw.slice(raw.indexOf("'"), raw.indexOf("'") + 12);
      sqlerr.hidden = false;
      sqlerr.textContent =
        'ERROR:  syntax error at or near "' + at + '"\n' +
        'LINE 1: SELECT id, title, date FROM records WHERE restricted = 0 AND (title LIKE \'%' + raw + '%\' OR body LIKE \'%' + raw + '%\') ORDER BY date;\n' +
        t('sqlhint');
      return;
    }

    var nq = S.norm(raw);
    if (!nq) { last = null; status.textContent = t('empty'); return; }
    var hits = index.filter(function (r) { return r.haystack.indexOf(nq) !== -1; });
    if (!hits.length) {
      var h = await S.open('search|' + nq);
      if (h && h.type === 'hidden') { last = null; showDoc(h); return; }
    }
    last = { mode: 'search', hits: hits };
    status.textContent = hits.length ? hits.length + t('found') : t('none');
    listPublic(hits);
  }

  form.addEventListener('submit', function (ev) { ev.preventDefault(); run(q.value); });

  window.addEventListener('shioji:lang', function () {
    if (last && last.mode === 'search') {
      reset();
      status.textContent = last.hits.length ? last.hits.length + t('found') : t('none');
      listPublic(last.hits);
    } else if (last && last.mode === 'error') {
      run(last.raw);
    } else if (last) {
      run(last.mode === 'restricted' ? "' or restricted = 1 --" : "' or 1=1 --");
    }
    if (lastDoc) showDoc(lastDoc);
  });
})();
