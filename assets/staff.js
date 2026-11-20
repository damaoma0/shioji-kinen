/* 職員ポータル: login and password reset. Player input is only ever shown with textContent. */
(function () {
  var S = window.Shioji;
  var LANG = function () { return (window.ShiojiLang && window.ShiojiLang.get()) || 'ja'; };
  var T = {
    ja: { checking: '確認中…', in: 'ログインしました。', bad: '職員IDまたはパスワードが正しくありません。', noid: '該当する職員IDが見つかりません。',
          temp: '仮パスワードを発行しました：', change: '　ログイン後、速やかに変更してください。', mismatch: '回答が登録内容と一致しません。' },
    en: { checking: 'Checking…', in: 'Logged in.', bad: 'Incorrect staff ID or password.', noid: 'No matching staff ID was found.',
          temp: 'A temporary password has been issued: ', change: '  Please change it as soon as you log in.', mismatch: 'Your answers do not match our records.' },
    zh: { checking: '确认中…', in: '已登录。', bad: '职员ID或密码不正确。', noid: '找不到该职员ID。',
          temp: '已发放临时密码：', change: '　登录后请尽快修改。', mismatch: '回答与登记内容不符。' }
  };
  function t(k) { return (T[LANG()] || T.ja)[k]; }
  function pick(obj, field) { var l = LANG(); return (l !== 'ja' && obj[field + '_' + l]) || obj[field]; }
  function $(id) { return document.getElementById(id); }

  var notesPayload = null, staff = null, tempPw = null;

  function showNotes() {
    var n = $('notes');
    n.hidden = false;
    n.innerHTML = pick(notesPayload, 'html'); /* our own encrypted content, never player input */
  }
  function showQuestions() {
    var qs = pick(staff, 'questions');
    $('q1').textContent = qs[0];
    $('q2').textContent = qs[1];
  }
  function showTemp() {
    var m = $('qmsg');
    m.textContent = '';
    m.appendChild(document.createTextNode(t('temp')));
    var c = document.createElement('code');
    c.textContent = tempPw;
    m.appendChild(c);
    m.appendChild(document.createTextNode(t('change')));
  }

  var login = $('login');
  if (login) {
    login.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      $('lmsg').textContent = t('checking');
      var p = await S.open('login|' + S.norm($('uid').value) + '|' + S.norm($('pw').value));
      if (p && p.type === 'notes') {
        $('lmsg').textContent = t('in');
        login.hidden = true;
        notesPayload = p;
        showNotes();
      } else {
        $('lmsg').textContent = t('bad');
      }
    });
  }

  var rid = $('rid');
  if (rid) {
    var staffP = S.data('staff.json');
    rid.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      staff = await staffP;
      if (S.norm($('ruid').value) === staff.id) {
        $('rmsg').textContent = '';
        showQuestions();
        $('rq').hidden = false;
        rid.hidden = true;
      } else {
        $('rmsg').textContent = t('noid');
      }
    });
    $('rq').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      $('qmsg').textContent = t('checking');
      var p = await S.open('reset|' + S.norm($('a1').value) + '|' + S.norm($('a2').value));
      if (p && p.type === 'temp') {
        tempPw = p.pw;
        showTemp();
        $('rq').hidden = true;
      } else {
        $('qmsg').textContent = t('mismatch');
      }
    });
  }

  window.addEventListener('shioji:lang', function () {
    if (notesPayload) { $('lmsg').textContent = t('in'); showNotes(); }
    if (staff && !$('rq').hidden) showQuestions();
    if (tempPw) showTemp();
  });
})();
