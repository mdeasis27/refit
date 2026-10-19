var $ = function (id) { return document.getElementById(id); };
var state = { plan: '' };
var prices = { Free: '0', Pro: '19', Team: '49' };

function show(n) {
  for (var i = 1; i <= 5; i++) $('s' + i).hidden = i !== n;
  for (var j = 1; j <= 3; j++) $('b' + j).className = 'st' + (j <= n ? ' on' : '');
}

function mark(id, ok) {
  var el = $(id);
  el.className = ok ? '' : 'bad';
  return ok;
}

$('go1').onclick = function () {
  var ok = true;
  var pw = $('pw').value;
  var email = $('email').value;
  ok = mark('name', $('name').value.trim().length > 1) && ok;
  ok = mark('email', /^\S+@\S+\.\S+$/.test(email)) && ok;
  ok = mark('email2', $('email2').value === email && email !== '') && ok;
  var pwOk = pw.length >= 12 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
  ok = mark('pw', pwOk) && ok;
  $('pwrule').textContent = pwOk ? '' : 'Password needs 12+ characters with an uppercase letter, a number and a symbol.';
  ok = mark('phone', $('phone').value.replace(/\D/g, '').length >= 7) && ok;
  ok = mark('dob', /^\d{2}\/\d{2}\/\d{4}$/.test($('dob').value)) && ok;
  ok = mark('company', $('company').value.trim() !== '') && ok;
  ok = mark('role', $('role').value.trim() !== '') && ok;
  ok = mark('address', $('address').value.trim().length > 4) && ok;
  ok = mark('country', $('country').value.trim() !== '') && ok;
  ok = mark('heard', $('heard').value !== '') && ok;
  var n = $('news').checked, t = $('terms').checked;
  $('news').parentNode.className = 'chk' + (n ? '' : ' bad');
  $('terms').parentNode.className = 'chk' + (t ? '' : ' bad');
  if (ok && n && t) show(2);
};

var plans = document.querySelectorAll('.plan');
for (var i = 0; i < plans.length; i++) {
  plans[i].onclick = function () {
    state.plan = this.getAttribute('data-plan');
    for (var k = 0; k < plans.length; k++) plans[k].className = 'plan';
    this.className = 'plan sel';
  };
}

$('go2').onclick = function () {
  if (!state.plan) return;
  $('sum').textContent = 'Plan: ' + state.plan + ' - ' + prices[state.plan] + ' EUR / month';
  show(3);
};

$('go3').onclick = function () {
  var ok = true;
  ok = mark('card', $('card').value.replace(/\s/g, '').length === 16) && ok;
  ok = mark('exp', /^\d{2}\/\d{2}$/.test($('exp').value)) && ok;
  ok = mark('cvc', /^\d{3}$/.test($('cvc').value)) && ok;
  if (!ok) return;
  $('sent').textContent = 'We sent a link to ' + $('email').value + '.';
  show(4);
};

$('go4').onclick = function () {
  $('done').textContent = 'Welcome, ' + $('name').value + '. Your ' + state.plan + ' plan is active.';
  show(5);
};

var modal = $('terms-modal');
$('openterms').onclick = function () {
  modal.hidden = false;
  $('modal').setAttribute('tabindex', '-1');
  $('modal').focus();
};
function closeTerms() { modal.hidden = true; $('terms').checked = true; }
$('closeterms').onclick = closeTerms;
$('okterms').onclick = closeTerms;
document.addEventListener('keydown', function (e) {
  if (!modal.hidden && e.key === 'Tab') { e.preventDefault(); $('modal').focus(); }
});

var slides = document.querySelectorAll('.slide');
var si = 0;
setInterval(function () {
  slides[si].className = 'slide';
  si = (si + 1) % slides.length;
  slides[si].className = 'slide on';
}, 2500);
