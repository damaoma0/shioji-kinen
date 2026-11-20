/* お問い合わせ: nothing is sent anywhere. Some words draw an answer that is not the office's. */
(function () {
  var S = { norm: function (s) {
    s = String(s || '').normalize('NFKC').toLowerCase().replace(/[\s　・、。，．,.\-_'"「」『』（）()!！?？]/g, '');
    var o = '';
    for (var ch of s) { var c = ch.codePointAt(0); o += (c >= 0x30a1 && c <= 0x30f6) ? String.fromCodePoint(c - 0x60) : ch; }
    return o;
  } };
  var form = document.getElementById('contact');
  var done = document.getElementById('cdone');
  var ANSWERS = [
    { words: ['にしな', '仁科', 'nishina'], text: 'かのひとは　いまだ　うみの　うへ' },
    { words: ['まだまつ', 'まだ待つ', '少女', 'むすめ', '娘', 'しょうじょ', 'girl', '女孩', '姑娘'], text: 'みてゐる' },
    { words: ['席', 'せき', 'seat', '座位'], text: 'ひとつ　あけて　おけ' }
  ];
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var text = S.norm(document.getElementById('cmsg').value + document.getElementById('ckind').value);
    form.hidden = true;
    done.hidden = false;
    done.textContent = '';
    var p = document.createElement('p');
    var l = (window.ShiojiLang && window.ShiojiLang.get()) || 'ja';
    p.textContent = { ja: 'お問い合わせを受け付けました。担当者より折り返しご連絡いたします。',
                      en: 'Your enquiry has been received. A member of staff will get back to you.',
                      zh: '您的咨询已收到。工作人员会尽快回复您。' }[l];
    done.appendChild(p);
    for (var i = 0; i < ANSWERS.length; i++) {
      if (ANSWERS[i].words.some(function (w) { return text.indexOf(S.norm(w)) !== -1; })) {
        var k = document.createElement('p');
        k.className = 'kana reply';
        k.textContent = ANSWERS[i].text;
        done.appendChild(k);
        break;
      }
    }
  });
})();
