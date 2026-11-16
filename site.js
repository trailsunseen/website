// Put your WhatsApp number here: country code + number, digits only (e.g. "919876543210").
var WHATSAPP_NUMBER = "";
var CONTACT_EMAIL = "hello@trailsunseen.com";

(function () {
  var shown = document.querySelectorAll('[data-wa]');
  for (var i = 0; i < shown.length; i++) {
    shown[i].textContent = WHATSAPP_NUMBER ? '+' + WHATSAPP_NUMBER : '[your WhatsApp number]';
  }

  var form = document.getElementById('enquiry');
  if (!form) return;
  var out = document.getElementById('result');

  // Pre-select the trip if the link said which one (plan.html#coorg)
  var trip = document.getElementById('f-trip');
  if (trip && location.hash === '#coorg') trip.value = 'Coorg, 3 nights';

  function v(id) { var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    out.className = 'result show';
    out.textContent = '';
    if (!v('f-name')) {
      out.textContent = 'Please add your name so we know who to reply to.';
      document.getElementById('f-name').focus();
      return;
    }
    var lines = [
      'Hi Trails Unseen! I would like to plan a trip.',
      'Name: ' + v('f-name'),
      v('f-phone') ? 'Phone: ' + v('f-phone') : '',
      'From: ' + v('f-city'),
      v('f-trip') ? 'Trip: ' + v('f-trip') : '',
      v('f-dog') ? 'Dog: ' + v('f-dog') + (v('f-breed') ? ' (' + v('f-breed') + ')' : '') : '',
      v('f-when') ? 'When: ' + v('f-when') : '',
      v('f-who') ? 'Travelling: ' + v('f-who') : '',
      v('f-note') ? 'Notes: ' + v('f-note') : ''
    ].filter(Boolean).join('\n');

    if (WHATSAPP_NUMBER) {
      var a = document.createElement('a');
      a.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines);
      a.textContent = 'Open WhatsApp to send your message';
      out.appendChild(document.createTextNode('Your message is ready. '));
      out.appendChild(a);
    } else {
      out.appendChild(document.createTextNode('Your message is ready. Our WhatsApp line isn’t live yet, so please email it to ' + CONTACT_EMAIL + ':'));
      var pre = document.createElement('pre');
      pre.style.cssText = 'white-space:pre-wrap;margin:10px 0 0;font:inherit;color:#14532d';
      pre.textContent = lines;
      out.appendChild(pre);
    }
  });
})();
