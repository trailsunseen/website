// Trails Unseen — home page v2.
// The page reads as a plain document without this file. It sends the enquiry form,
// changes the pinned picture in the dog's day, and walks the map route in paw prints.

// Where enquiries are posted. Paste the form service's endpoint here
// (for example a Formspree or FormSubmit URL that emails hello@trailsunseen.com).
// While it is empty, the form opens the visitor's email app with the details filled in.
var FORM_ENDPOINT = "";
var CONTACT_EMAIL = "hello@trailsunseen.com";

// ---- The enquiry form ----
(function () {
  var form = document.getElementById('enquiry');
  if (!form) return;
  var out = document.getElementById('result');
  var nameEl = document.getElementById('f-name');
  var phoneEl = document.getElementById('f-phone');
  var phoneHint = document.getElementById('f-phone-hint');
  var phoneHintText = phoneHint.textContent;

  function val(id) { return (document.getElementById(id).value || '').trim(); }

  function markInvalid(el, bad) {
    if (bad) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  }

  function check() {
    var nameBad = !val('f-name');
    var digits = val('f-phone').replace(/\D/g, '');
    var phoneBad = digits.length < 10;
    markInvalid(nameEl, nameBad);
    markInvalid(phoneEl, phoneBad);
    phoneHint.textContent = phoneBad ? 'Please add a phone number so we can call you.' : phoneHintText;
    phoneHint.classList.toggle('is-error', phoneBad);
    if (nameBad) { out.textContent = 'Please add your name.'; nameEl.focus(); return false; }
    if (phoneBad) { out.textContent = ''; phoneEl.focus(); return false; }
    return true;
  }

  function summary() {
    return [
      'Name: ' + val('f-name'),
      'Phone: ' + val('f-phone'),
      val('f-dog') ? 'Dog: ' + val('f-dog') : '',
      val('f-when') ? 'When: ' + val('f-when') : '',
      val('f-note') ? 'Notes: ' + val('f-note') : ''
    ].filter(Boolean).join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!check()) return;
    if (val('f-site')) return; // a bot filled the hidden field

    var name = val('f-name');

    if (!FORM_ENDPOINT) {
      // No form service yet: open the visitor's email app with everything filled in.
      location.href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent('Trip enquiry from ' + name) +
        '&body=' + encodeURIComponent(summary());
      out.textContent = 'Your email app should open with your details. Press send there and we\'ll call you within a day.';
      return;
    }

    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    out.textContent = 'Sending…';

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    }).then(function (res) {
      if (!res.ok) throw new Error('send failed');
      form.reset();
      out.textContent = 'Thanks, ' + name + '. We\'ll call you within a day.';
    }).catch(function () {
      out.textContent = 'That didn\'t send. Email ' + CONTACT_EMAIL + ' and we\'ll call you.';
    }).then(function () {
      button.disabled = false;
    });
  });
})();

// ---- The dog's day (one pinned picture), the map's paw prints and the side list ----
// One IntersectionObserver each; no scroll listener.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var root = document.documentElement;
  var canWatch = 'IntersectionObserver' in window;

  // Places paw prints along a path: left, right, left, right, toes pointing the way it runs.
  function pawsAlong(svg, path, o) {
    var len = path.getTotalLength();
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'paws');
    var n = 0;
    function put(x, y, deg) {
      var u = document.createElementNS(NS, 'use');
      u.setAttribute('href', '#paw');
      u.setAttribute('class', 'paw');
      u.setAttribute('width', o.size);
      u.setAttribute('height', o.size * 1.1);
      u.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + deg.toFixed(1) + ') translate(' + (-o.size / 2) + ' ' + (-o.size * 0.55) + ')');
      u.style.transitionDelay = (n * 90) + 'ms';
      g.appendChild(u);
    }
    function at(d) {
      var p = path.getPointAtLength(d);
      // the heading at d: look a step ahead, or a step back at the very end of the path
      var f = d + 1 <= len ? p : path.getPointAtLength(d - 1), t = d + 1 <= len ? path.getPointAtLength(d + 1) : p;
      var a = Math.atan2(t.y - f.y, t.x - f.x);
      return { x: p.x, y: p.y, a: a, nx: -Math.sin(a), ny: Math.cos(a) };
    }
    for (var d = o.startPad; d <= len - o.endPad; d += o.step) {
      var t = at(d), side = (n % 2 ? 1 : -1) * o.spread;
      put(t.x + t.nx * side, t.y + t.ny * side, t.a * 180 / Math.PI + 90);
      n++;
    }
    svg.appendChild(g);
    return g;
  }

  // The route to Coorg on the map is walked in paw prints.
  var route = document.getElementById('route-coorg');
  var map = route && route.ownerSVGElement;
  if (route) pawsAlong(map, route, { size: 14, step: 16, spread: 5, startPad: 32, endPad: 20 });

  // The map's prints appear when the map is reached. Without an observer, they simply show.
  if (canWatch) {
    root.classList.add('reveal-on');
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); seen.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    [].slice.call(document.querySelectorAll('.map')).forEach(function (el) { seen.observe(el); });
  }

  // The dog's day: the pinned picture shows the line that is being read.
  var beats = [].slice.call(document.querySelectorAll('.beats li'));
  var frames = [].slice.call(document.querySelectorAll('.stage img'));
  var count = document.querySelector('.stage-count');
  if (canWatch && beats.length) {
    var showBeat = function (i) {
      frames.forEach(function (im, n) { im.classList.toggle('is-on', n === i); });
      beats.forEach(function (b, n) { b.classList.toggle('is-on', n === i); });
      if (count) count.textContent = (i + 1) + ' of ' + beats.length;
    };
    // The line being read sits beside the middle of the picture, or, when the picture is above it,
    // in the middle of the space under the picture.
    var stage = document.querySelector('.stage');
    var beside = window.matchMedia('(min-width: 900px)').matches;
    var at = beside ? 50 : (stage.offsetHeight + (window.innerHeight - stage.offsetHeight) / 2) / window.innerHeight * 100;
    var day = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) showBeat(beats.indexOf(en.target)); });
    }, { rootMargin: '-' + (at - 2).toFixed(1) + '% 0px -' + (98 - at).toFixed(1) + '% 0px' });
    beats.forEach(function (b) { day.observe(b); });
  }

  // Side list: show it after the hero, and mark the section being read.
  var rail = document.querySelector('.rail');
  var hero = document.querySelector('.hero');
  if (rail && hero && canWatch) {
    new IntersectionObserver(function (entries) {
      rail.classList.toggle('is-on', !entries[0].isIntersecting);
    }, { threshold: 0.05 }).observe(hero);

    var links = {};
    [].slice.call(rail.querySelectorAll('a')).forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var here = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        for (var id in links) links[id].classList.toggle('is-here', id === en.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    for (var id in links) { var sec = document.getElementById(id); if (sec) here.observe(sec); }
  }
})();
