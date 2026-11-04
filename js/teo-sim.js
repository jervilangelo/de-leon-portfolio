/* Simulated Teolohiya.site walkthrough on the home page.
   A scripted cursor searches, opens a listing, contacts the seller, lists a book and approves it.
   It plays only while on screen, and under reduced motion it stays on the still poster. */
(function () {
  "use strict";
  var root = document.getElementById("tsim");
  if (!root) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var stage = root.querySelector(".tsim-stage");
  var fig = root.closest("figure");
  var $ = function (sel, ctx) { return (ctx || stage).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || stage).querySelectorAll(sel)); };
  var el = function (name) { return $('[data-el="' + name + '"]'); };
  var cursor = el("cursor");
  var caption = fig && fig.querySelector('[data-el="caption"]');
  var steps = fig ? Array.prototype.slice.call(fig.querySelectorAll(".tsim-steps li")) : [];

  /* ---- fit the fixed 1200px stage to its frame ---- */
  var scale = 1;
  var fit = function () {
    scale = root.clientWidth / 1200;
    stage.style.setProperty("--s", scale);
  };
  fit();
  if ("ResizeObserver" in window) new ResizeObserver(fit).observe(root);
  else window.addEventListener("resize", fit);

  /* ---- decorative shelves of spines ---- */
  var spineColors = ["#7a2e2e", "#1f2f4f", "#2e4a3c", "#8a6a2a", "#4e5a2a", "#252423", "#7a5a3a", "#3e4e60"];
  $$("[data-shelf]").forEach(function (shelf) {
    var n = +shelf.getAttribute("data-shelf");
    for (var i = 0; i < n; i++) {
      var s = document.createElement("i");
      s.style.setProperty("--c", spineColors[(i * 5 + 3) % spineColors.length]);
      s.style.setProperty("--h", (shelf.classList.contains("tsim-shelf") ? 46 + ((i * 37) % 26) : 90 + ((i * 53) % 70)) + "px");
      s.style.setProperty("--n", i);
      shelf.appendChild(s);
    }
  });

  root.classList.add("is-ready");

  /* ---- a clock that stops while the demo is off screen or the tab is hidden ---- */
  var visible = false;
  var waiting = [];
  var last = performance.now();
  var tick = function (now) {
    var dt = now - last; last = now;
    if (visible && !document.hidden) {
      for (var i = waiting.length - 1; i >= 0; i--) {
        waiting[i].left -= dt;
        if (waiting[i].left <= 0) { waiting[i].done(); waiting.splice(i, 1); }
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  var wait = function (ms) { return new Promise(function (r) { waiting.push({ left: ms, done: r }); }); };

  /* ---- pointer helpers ---- */
  var pos = { x: 960, y: 560 };
  var place = function (x, y, ms) {
    cursor.style.transitionDuration = (ms || 0) + "ms";
    cursor.style.setProperty("--x", x + "px");
    cursor.style.setProperty("--y", y + "px");
    pos = { x: x, y: y };
  };
  var centerOf = function (node, ox, oy) {
    var r = node.getBoundingClientRect(), s = stage.getBoundingClientRect();
    return {
      x: (r.left - s.left) / scale + (ox == null ? r.width / scale / 2 : ox),
      y: (r.top - s.top) / scale + (oy == null ? r.height / scale / 2 : oy)
    };
  };
  var moveTo = function (node, ms, ox, oy) {
    var p = centerOf(node, ox, oy);
    var d = Math.hypot(p.x - pos.x, p.y - pos.y);
    var t = ms || Math.max(380, Math.min(950, d * 1.15));
    place(p.x, p.y, t);
    return wait(t + 60);
  };
  var click = function (node) {
    cursor.classList.add("is-down");
    if (node) node.classList.add("is-press");
    var rip = document.createElement("span");
    rip.className = "tsim-ripple";
    rip.style.left = pos.x + 3 + "px"; rip.style.top = pos.y + 3 + "px";
    stage.appendChild(rip);
    setTimeout(function () { rip.remove(); }, 600);
    return wait(140).then(function () {
      cursor.classList.remove("is-down");
      if (node) node.classList.remove("is-press");
      return wait(120);
    });
  };
  var type = function (field, text, speed) {
    field.classList.add("tsim-caret");
    var i = 0;
    var step = function () {
      if (i >= text.length) { return wait(220).then(function () { field.classList.remove("tsim-caret"); }); }
      field.textContent = text.slice(0, ++i);
      return wait((speed || 75) + ((i * 37) % 50)).then(step);
    };
    return step();
  };

  /* ---- navigation ---- */
  var urlEl = $("[data-url]");
  var load = $("[data-load]");
  var go = function (page, path) {
    urlEl.textContent = path || "";
    load.classList.remove("is-on"); void load.offsetWidth; load.classList.add("is-on");
    $$(".tsim-page").forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-page") === page); });
    $$(".tsim-nav [data-nav]").forEach(function (n) { n.classList.toggle("on", n.getAttribute("data-nav") === page && page !== "list"); });
    return wait(520);
  };
  var chapter = function (i, text) {
    if (caption) caption.textContent = text;
    steps.forEach(function (s, k) { s.classList.toggle("is-on", k <= i); });
  };
  var toast = function (text, ms) {
    var t = el("toast");
    t.textContent = text; t.classList.add("is-on");
    return wait(ms).then(function () { t.classList.remove("is-on"); });
  };
  var hot = function (node, on) { node.classList.toggle("is-hot", on); };

  /* ---- reset everything for the next loop ---- */
  var reset = function () {
    $$("[data-type]").forEach(function (f) { f.textContent = ""; f.classList.remove("tsim-caret"); });
    $$("[data-miss]").forEach(function (c) { c.classList.remove("is-out"); });
    $$(".is-hot, .is-hover, .is-focus").forEach(function (n) { n.classList.remove("is-hot", "is-hover", "is-focus"); });
    $$(".tsim-photos .th").forEach(function (t) { t.classList.remove("is-on"); });
    $('[data-swap="cat"]').textContent = "Reformed Theology";
    $('[data-swap="cond"]').textContent = "New";
    el("label").textContent = "Recently listed";
    el("done").classList.remove("is-on");
    el("qrow").classList.remove("is-gone");
    el("qrow").style.display = "";
    el("pill").textContent = "Pending"; el("pill").classList.remove("is-live");
    el("qcount").textContent = "2 listings waiting for review";
  };

  var fill = function (box, text, speed) {
    var b = $('[data-box="' + box + '"]');
    return moveTo(b, null, 40).then(function () { return click(); }).then(function () {
      $$(".is-focus").forEach(function (n) { n.classList.remove("is-focus"); });
      b.classList.add("is-focus");
      return type($('[data-type="' + box + '"]'), text, speed);
    });
  };
  var choose = function (box, text) {
    var b = $('[data-box="' + box + '"]');
    var label = $('[data-swap="' + box + '"]');
    return moveTo(b).then(function () { return click(); }).then(function () {
      $$(".is-focus").forEach(function (n) { n.classList.remove("is-focus"); });
      b.classList.add("is-focus");
      label.classList.add("is-swap");
      return wait(200);
    }).then(function () {
      label.textContent = text;
      label.classList.remove("is-swap");
      return wait(260);
    });
  };

  /* ---- the script ---- */
  var play = function () {
    reset();
    var card = el("card");
    return go("home", "")
      .then(function () { chapter(0, "Searching for a book"); place(960, 560, 0); return wait(900); })
      .then(function () { return moveTo(el("search"), null, 120); })
      .then(function () { return click(); })
      .then(function () { return type($('[data-type="q"]'), "Grudem", 95); })
      .then(function () { var g = el("go"); return moveTo(g).then(function () { hot(g, true); return click(g); }); })
      .then(function () { return go("browse", "/browse?q=grudem"); })
      .then(function () { el("label").textContent = "Searching…"; return wait(500); })
      .then(function () {
        $$("[data-miss]").forEach(function (c) { c.classList.add("is-out"); });
        el("label").textContent = "1 result for “Grudem”";
        return wait(900);
      })
      .then(function () { chapter(1, "Opening a listing"); return moveTo(card, null, null, 120); })
      .then(function () { card.classList.add("is-hover"); return wait(450); })
      .then(function () { return click(); })
      .then(function () { return go("book", "/books/christian-ethics"); })
      .then(function () { return wait(1100); })
      .then(function () { chapter(2, "Contacting the seller"); var c = el("contact"); return moveTo(c).then(function () { hot(c, true); return click(c); }); })
      .then(function () { return toast("Opening the seller’s contact link…", 1500); })
      .then(function () { hot(el("contact"), false); chapter(3, "Listing a book"); var n = $('[data-nav="list"]'); return moveTo(n).then(function () { hot(n, true); return click(n); }); })
      .then(function () { hot($('[data-nav="list"]'), false); return go("list", "/list"); })
      .then(function () { return fill("title", "Knowing God", 70); })
      .then(function () { return fill("author", "J. I. Packer", 70); })
      .then(function () { return choose("cat", "Devotional Literature"); })
      .then(function () { return choose("cond", "Good"); })
      .then(function () { return fill("price", "350", 110); })
      .then(function () { return fill("city", "Quezon City", 60); })
      .then(function () { return fill("prov", "Metro Manila", 60); })
      .then(function () {
        var ph = el("photos");
        return moveTo(ph, null, 200).then(function () { return click(); }).then(function () {
          $$(".is-focus").forEach(function (n) { n.classList.remove("is-focus"); });
          var th = $$(".th", ph);
          th[0].classList.add("is-on");
          return wait(260).then(function () { th[1].classList.add("is-on"); return wait(500); });
        });
      })
      .then(function () { var s = el("submit"); return moveTo(s).then(function () { hot(s, true); return click(s); }); })
      .then(function () { hot(el("submit"), false); el("done").classList.add("is-on"); return wait(1900); })
      .then(function () { chapter(4, "Approving it as a moderator"); var n = $('[data-nav="moderate"]'); return moveTo(n).then(function () { return click(n); }); })
      .then(function () { return go("moderate", "/moderate"); })
      .then(function () { return wait(700); })
      .then(function () { var a = el("approve"); return moveTo(a).then(function () { hot(a, true); return click(a); }); })
      .then(function () {
        var pill = el("pill");
        pill.textContent = "Approved · Live"; pill.classList.add("is-live");
        return wait(1000);
      })
      .then(function () {
        el("qrow").classList.add("is-gone");
        return wait(450);
      })
      .then(function () {
        el("qrow").style.display = "none";
        el("qcount").textContent = "1 listing waiting for review";
        return toast("Knowing God is now live on Teolohiya.site", 1800);
      })
      .then(function () { return wait(600); })
      .then(play);
  };

  /* ---- start when first seen ---- */
  var started = false;
  var start = function () { if (!started) { started = true; play(); } };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible = e.isIntersecting; if (visible) start(); });
    }, { threshold: 0.25 }).observe(fig || root); // the shutter starts clipped, so watch the figure

  } else { visible = true; start(); }
})();
