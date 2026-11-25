// Full-screen photo story (preview).
// The .story-full section is N screens tall and its stage sticks to the top for that distance.
// As you scroll through it, the picture and its words change together and the bars fill.
(function () {
  function start() {
    var story = document.querySelector('.story-full');
    if (!story) return;
    var frames = [].slice.call(story.querySelectorAll('.stage img'));
    var caps = [].slice.call(story.querySelectorAll('.captions li'));
    var fills = [].slice.call(story.querySelectorAll('.bars i'));
    var n = caps.length, current = -1, ticking = false;

    function show(i) {
      if (i === current) return;
      current = i;
      frames.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
      caps.forEach(function (c, k) { c.classList.toggle('is-on', k === i); });
    }

    function update() {
      ticking = false;
      var r = story.getBoundingClientRect();
      var screen = window.innerHeight;
      // how many screens we have scrolled into the story (0 .. n)
      var pos = Math.max(0, Math.min(n - 0.001, -r.top / screen));
      var i = Math.floor(pos), frac = pos - i;
      if (r.top > 0) { i = 0; frac = 0; }
      show(i);
      fills.forEach(function (f, k) {
        f.style.width = (k < i ? 100 : k === i ? Math.round(frac * 100) : 0) + '%';
      });
    }

    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
