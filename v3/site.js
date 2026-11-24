/* Trails Unseen v3
   Put the Trails Unseen WhatsApp Business number here: digits only, with country code, e.g. "919876543210".
   While it is empty, "Plan my trip" opens an email to CONTACT_EMAIL instead. */
var WHATSAPP_NUMBER = "";
var CONTACT_EMAIL = "hello@trailsunseen.com";

function tuLink(message, subject) {
  if (WHATSAPP_NUMBER) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  }
  return "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject || "Trip enquiry") +
    "&body=" + encodeURIComponent(message);
}

function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

document.addEventListener("DOMContentLoaded", function () {
  // Waitlist and "somewhere else" links: <a data-msg="..." data-subject="...">
  document.querySelectorAll("a[data-msg]").forEach(function (a) {
    a.href = tuLink(a.getAttribute("data-msg"), a.getAttribute("data-subject"));
    if (WHATSAPP_NUMBER) { a.target = "_blank"; a.rel = "noopener"; }
  });

  document.querySelectorAll("form.planner").forEach(function (form) {
    var count = { adults: 2, children: 0, dogs: 1 };
    var limits = { adults: [1, 8], children: [0, 6], dogs: [1, 3] };
    var summary = form.querySelector(".who-summary");

    function render() {
      var bits = [plural(count.adults, "adult", "adults")];
      if (count.children) bits.push(plural(count.children, "child", "children"));
      bits.push(plural(count.dogs, "dog", "dogs"));
      summary.textContent = bits.join(" · ");
      form.querySelectorAll("output[data-k]").forEach(function (o) { o.textContent = count[o.getAttribute("data-k")]; });
      return bits.join(", ");
    }
    form.querySelectorAll("button[data-k]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-k"), d = +b.getAttribute("data-d");
        count[k] = Math.max(limits[k][0], Math.min(limits[k][1], count[k] + d));
        render();
      });
    });
    render();

    // Dates: nothing in the past; end after start (suggest 3 nights)
    var start = form.elements.start, end = form.elements.end;
    function iso(d) { return d.toISOString().slice(0, 10); }
    var today = new Date();
    start.min = iso(today);
    end.min = iso(new Date(today.getTime() + 864e5));
    start.addEventListener("change", function () {
      if (!start.value) return;
      var next = new Date(start.value); next.setDate(next.getDate() + 1); end.min = iso(next);
      if (!end.value || end.value <= start.value) {
        var three = new Date(start.value); three.setDate(three.getDate() + 3); end.value = iso(three);
      }
    });

    function fmt(v) {
      return new Date(v + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = form.querySelector(".error");
      var problem = "";
      if (!start.value || !end.value) problem = "Please pick your start and end dates.";
      else if (end.value <= start.value) problem = "The end date needs to be after the start date.";
      if (problem) { err.textContent = problem; err.classList.add("show"); return; }
      err.classList.remove("show");
      var trip = form.elements.trip.value;
      var msg = "Hi Trails Unseen! I'd like a free plan for my trip.\n\n" +
        "Trip: " + trip + "\n" +
        "Dates: " + fmt(start.value) + " to " + fmt(end.value) + "\n" +
        "Travellers: " + render();
      var url = tuLink(msg, "Trip enquiry: " + trip);
      if (WHATSAPP_NUMBER) window.open(url, "_blank", "noopener"); else window.location.href = url;
    });
  });
});
