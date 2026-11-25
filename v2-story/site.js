// Trails Unseen — home page v2.
// The page reads as a plain document without this file. It sends the enquiry form,
// changes the pinned picture in the dog's day, and walks the map route in paw prints.

// ---- Where a "Plan my trip" lead goes ----
// 1. LEADS_ENDPOINT: the Google Apps Script web app (".../exec" URL) that adds a row to the
//    "Trails Unseen leads" Google Sheet. While it is empty, nothing is logged to the sheet.
// 2. WHATSAPP_NUMBER: Trails Unseen's WhatsApp Business number, country code first, digits only
//    (for example "919876543210"). After the lead is saved, the visitor's WhatsApp opens with the
//    details typed out to this number, and they press send.
// While both are empty, the form falls back to the visitor's email app.
var LEADS_ENDPOINT = "";
var WHATSAPP_NUMBER = "";
var CONTACT_EMAIL = "hello@trailsunseen.com";

// ---- The "Plan my trip" form ----
(function () {
  var form = document.getElementById('enquiry');
  if (!form) return;
  var out = document.getElementById('result');
  var nameEl = document.getElementById('f-name');
  var phoneEl = document.getElementById('f-phone');
  var fromEl = document.getElementById('f-from');
  var toEl = document.getElementById('f-to');
  var phoneHint = document.getElementById('f-phone-hint');
  var phoneHintText = phoneHint.textContent;
  var datesHint = document.getElementById('f-dates-hint');
  var datesHintText = datesHint ? datesHint.textContent : '';

  // No dates in the past; "To" can't be before "From".
  var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  var iso = today.toISOString().slice(0, 10);
  if (fromEl) fromEl.min = iso;
  if (toEl) toEl.min = iso;
  if (fromEl && toEl) fromEl.addEventListener('change', function () {
    toEl.min = fromEl.value || iso;
    if (toEl.value && toEl.value < fromEl.value) toEl.value = '';
  });

  function val(id) { var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; }
  function markInvalid(el, bad) { if (bad) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
  function nice(d) {
    if (!d) return '';
    var p = d.split('-');
    var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+p[1] - 1];
    return (+p[2]) + ' ' + m + ' ' + p[0];
  }

  function check() {
    var nameBad = !val('f-name');
    var phoneBad = val('f-phone').replace(/\D/g, '').length < 10;
    var fromBad = !val('f-from');
    var toBad = !val('f-to') || (val('f-from') && val('f-to') < val('f-from'));
    markInvalid(nameEl, nameBad); markInvalid(phoneEl, phoneBad);
    markInvalid(fromEl, fromBad); markInvalid(toEl, toBad);
    phoneHint.textContent = phoneBad ? 'Please add a phone number so we can call you.' : phoneHintText;
    phoneHint.classList.toggle('is-error', phoneBad);
    if (datesHint) {
      datesHint.textContent = (fromBad || toBad) ? 'Please pick your travel dates (rough dates are fine).' : datesHintText;
      datesHint.classList.toggle('is-error', fromBad || toBad);
    }
    if (nameBad) { out.textContent = 'Please add your name.'; nameEl.focus(); return false; }
    out.textContent = '';
    if (phoneBad) { phoneEl.focus(); return false; }
    if (fromBad) { fromEl.focus(); return false; }
    if (toBad) { toEl.focus(); return false; }
    return true;
  }

  function lead() {
    var q = new URLSearchParams(location.search);
    return {
      name: val('f-name'), phone: val('f-phone'),
      destination: val('f-dest') || 'Coorg',
      from: val('f-from'), to: val('f-to'),
      page: location.href.split('#')[0],
      source: q.get('utm_source') || document.referrer || 'direct'
    };
  }

  function message(l) {
    return 'Hi Trails Unseen! I\'d like to plan a trip.\n' +
      'Name: ' + l.name + '\n' +
      'Phone: ' + l.phone + '\n' +
      'Destination: ' + l.destination + '\n' +
      'Dates: ' + nice(l.from) + ' to ' + nice(l.to);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!check()) return;
    if (val('f-site')) return; // a bot filled the hidden field

    var l = lead();
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    out.textContent = 'Saving your details…';

    // Log the lead to the Google Sheet. Apps Script doesn't send CORS headers, so this is a
    // fire-and-forget "no-cors" post; keepalive lets it finish even if WhatsApp opens next.
    var saved = LEADS_ENDPOINT
      ? fetch(LEADS_ENDPOINT, { method: 'POST', mode: 'no-cors', keepalive: true, body: new URLSearchParams(l) })
          .catch(function () { return null; })
      : Promise.resolve(null);

    saved.then(function () {
      if (WHATSAPP_NUMBER) {
        out.textContent = 'Thanks, ' + l.name + '. WhatsApp is opening with your details. Press send and we\'ll call you within a day.';
        location.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message(l));
      } else if (LEADS_ENDPOINT) {
        out.textContent = 'Thanks, ' + l.name + '. We\'ve got your details and will call you within a day.';
        form.reset();
      } else {
        location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Trip plan request from ' + l.name) +
          '&body=' + encodeURIComponent(message(l));
        out.textContent = 'Your email app should open with your details. Press send and we\'ll call you within a day.';
      }
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
        rail.classList.toggle('on-dark', en.target.id === 'whiskey'); // Whiskey's band is dark: the list turns light over it
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    for (var id in links) { var sec = document.getElementById(id); if (sec) here.observe(sec); }
  }
})();

// ---- The hero video ----
// It plays silently on a loop. Anyone who has asked for reduced motion gets the still poster instead.
(function () {
  var v = document.querySelector('.hero-video');
  if (!v || !window.matchMedia) return;
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function apply() {
    if (mq.matches) { v.removeAttribute('autoplay'); v.pause(); v.currentTime = 0; }
    else { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  }
  apply();
  if (mq.addEventListener) mq.addEventListener('change', apply);
})();

// ---- Sections rise into view ----
// Headings, lines and cards fade up as they are reached; items in a list follow one after another.
// Only this script hides them, so without it, or with reduced motion, everything simply shows.
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var picks = [
    'section:not(.hero) h2', 'section:not(.hero) h2 + p', '.lede', '.whiskey-why', '.follow',
    '.painting', '.checks > li', '.trips-photo', '.trip-list > li',
    '.whiskey-grid > :not(:first-child)', '.quotes > li', '.next > li', '#enquiry',
    '.day', '.plan-note', '.stay-list > li', '.ticks', '.know-list > div', '.trip-cta .btn'
  ].join(', ');
  var els = [].slice.call(document.querySelectorAll(picks)).filter(function (el, i, all) {
    return all.indexOf(el) === i && !el.closest('.hero, .trip-hero, .beats, .stage');
  });
  els.forEach(function (el) {
    el.classList.add('rise');
    if (el.matches('li')) el.style.transitionDelay = Math.min([].indexOf.call(el.parentNode.children, el), 5) * 90 + 'ms';
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('risen'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  els.forEach(function (el) { io.observe(el); });
})();
