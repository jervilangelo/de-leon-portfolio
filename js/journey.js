/* Journey page: one curved line drawn through every chapter's node as the visitor scrolls.
   Without this script (or without GSAP) the chapters are plain, fully readable content. */
(function () {
  "use strict";
  var story = document.getElementById("story");
  if (!story) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var chapters = Array.prototype.slice.call(story.querySelectorAll(".ch"));
  var nodes = chapters.map(function (c) { return c.querySelector(".ch-node"); });
  var rail = story.querySelector(".story-rail");
  var railLinks = rail ? Array.prototype.slice.call(rail.querySelectorAll("a")) : [];

  /* ---------- details and tabs work with or without GSAP ---------- */
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  story.querySelectorAll(".ch-more").forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    panel.hidden = true;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      if (!hasGsap || reduce) { panel.hidden = !open; if (hasGsap) refresh(); return; }
      if (open) {
        panel.hidden = false;
        gsap.fromTo(panel, { height: 0 }, { height: "auto", duration: 0.55, ease: "power2.out", onComplete: refresh });
      } else {
        gsap.to(panel, { height: 0, duration: 0.4, ease: "power2.inOut", onComplete: function () { panel.hidden = true; panel.style.height = ""; refresh(); } });
      }
    });
  });

  var tabs = Array.prototype.slice.call(story.querySelectorAll('.cp-tabs [role="tab"]'));
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { select(tab, false); });
    tab.addEventListener("keydown", function (e) {
      var k = e.key, n = tabs.length, to = null;
      if (k === "ArrowRight") to = tabs[(i + 1) % n];
      else if (k === "ArrowLeft") to = tabs[(i - 1 + n) % n];
      else if (k === "Home") to = tabs[0];
      else if (k === "End") to = tabs[n - 1];
      if (to) { e.preventDefault(); select(to, true); }
    });
  });

  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("story-ready");

  var svg = story.querySelector(".story-line");
  var base = svg.querySelector(".sl-base"), glow = svg.querySelector(".sl-glow"), draw = svg.querySelector(".sl-draw");
  var spark = svg.querySelector(".sl-spark");

  // line drawings inside each chapter are drawn on with a normalised dash
  story.querySelectorAll(".ch-art > *").forEach(function (el) { el.setAttribute("pathLength", "1"); });

  /* ---------- build the path through the nodes ---------- */
  var total = 0, samples = [], nodeLen = [], startY = 0, endY = 0;

  function points() {
    var sb = story.getBoundingClientRect();
    return nodes.map(function (n) {
      var r = n.getBoundingClientRect();
      return { x: r.left + r.width / 2 - sb.left, y: r.top + r.height / 2 - sb.top };
    });
  }

  var K = 7.5;                            // handle length: higher is tighter, less overshoot
  function catmullRom(p) {
    var d = "M" + p[0].x.toFixed(1) + " " + p[0].y.toFixed(1);
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      d += " C" + (p1.x + (p2.x - p0.x) / K).toFixed(1) + " " + (p1.y + (p2.y - p0.y) / K).toFixed(1) +
           " " + (p2.x - (p3.x - p1.x) / K).toFixed(1) + " " + (p2.y - (p3.y - p1.y) / K).toFixed(1) +
           " " + p2.x.toFixed(1) + " " + p2.y.toFixed(1);
    }
    return d;
  }

  function blocks() {
    var sb = story.getBoundingClientRect();
    return chapters.map(function (c) {
      var r = c.querySelector(".ch-body").getBoundingClientRect();
      return { left: r.left - sb.left, right: r.right - sb.left, top: r.top - sb.top, bottom: r.bottom - sb.top };
    });
  }

  function build() {
    var W = story.clientWidth, H = story.clientHeight;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var pts = points(), bx = blocks();
    var narrow = W < 760;
    var route = [pts[0]];
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1], bb = bx[i + 1], gap = b.y - a.y;
      if (narrow) {
        // a gentle wave down the left gutter
        route.push({ x: Math.max(6, a.x + (i % 2 ? 16 : -6)), y: a.y + gap * 0.5 }, b);
        continue;
      }
      var aRight = chapters[i].classList.contains("ch--r");
      var bRight = chapters[i + 1].classList.contains("ch--r");
      var centred = chapters[i + 1].classList.contains("ch--c");
      // from a right-hand node, carry on to the right edge and loop down (the wide sweep of the reference)
      if (aRight && !centred && gap > 300) route.push({ x: W - 36, y: a.y + gap * 0.3 });
      // then pass the next chapter on the empty side of its text and glide in beneath it
      if (!centred) {
        if (bRight) route.push({ x: Math.max(60, bb.left - 190), y: b.y - 24 });
        else route.push({ x: Math.min(W - 60, bb.right + 190), y: b.y - 24 });
      }
      route.push(b);
    }
    var d = catmullRom(route);
    base.setAttribute("d", d); glow.setAttribute("d", d); draw.setAttribute("d", d);

    total = draw.getTotalLength();
    samples = [];
    var steps = Math.max(200, Math.round(total / 6)), maxY = -Infinity;
    for (var s = 0; s <= steps; s++) {
      var L = (s / steps) * total, pt = draw.getPointAtLength(L);
      maxY = Math.max(maxY, pt.y);
      samples.push({ L: L, x: pt.x, y: pt.y, my: maxY });
    }
    nodeLen = pts.map(function (p) {
      var best = 0, bd = Infinity;
      samples.forEach(function (sm) { var dd = (sm.x - p.x) * (sm.x - p.x) + (sm.y - p.y) * (sm.y - p.y); if (dd < bd) { bd = dd; best = sm.L; } });
      return best;
    });
    startY = pts[0].y; endY = pts[pts.length - 1].y;
    [glow, draw].forEach(function (p) { p.style.strokeDasharray = total + " " + total; });
  }

  /* ---------- render at a scroll progress ---------- */
  function lengthAtY(y) {
    var lo = 0, hi = samples.length - 1;
    if (y <= samples[0].my) return 0;
    if (y >= samples[hi].my) return total;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (samples[mid].my < y) lo = mid + 1; else hi = mid; }
    return samples[lo].L;
  }
  function render(p) {
    if (!samples.length) return;
    var L = reduce ? total : lengthAtY(startY + p * (endY - startY));
    var off = total - L;
    glow.style.strokeDashoffset = off; draw.style.strokeDashoffset = off;
    var idx = Math.min(samples.length - 1, Math.round((L / total) * (samples.length - 1)));
    var sp = samples[idx];
    spark.setAttribute("cx", sp.x.toFixed(1)); spark.setAttribute("cy", sp.y.toFixed(1));
    spark.style.opacity = !reduce && L > 2 && L < total - 2 ? 1 : 0;

    var current = 0;
    chapters.forEach(function (ch, i) {
      var lit = L >= nodeLen[i] - 4;
      ch.classList.toggle("is-lit", lit);
      if (lit) { ch.classList.add("is-seen"); current = i; }
    });
    if (rail) {
      rail.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(3));
      railLinks.forEach(function (a, i) { a.classList.toggle("is-current", i === current); });
    }
  }

  var state = { p: 0 };
  var timer;
  function refresh() {
    clearTimeout(timer);
    timer = setTimeout(function () { build(); ScrollTrigger.refresh(); render(state.p); }, 60);
  }

  build();
  if (reduce) {
    chapters.forEach(function (c) { c.classList.add("is-lit", "is-seen"); });
    render(1);
  } else {
    // the tip of the line follows a point 60% down the viewport
    gsap.to(state, {
      p: 1, ease: "none",
      scrollTrigger: {
        trigger: story,
        start: function () { return "top+=" + startY + " 60%"; },
        end: function () { return "top+=" + endY + " 60%"; },
        scrub: 0.6,
        invalidateOnRefresh: true
      },
      onUpdate: function () { render(state.p); }
    });
    render(0);

    // text reveals as soon as a chapter scrolls into view; only the node waits for the line
    chapters.forEach(function (ch) {
      ScrollTrigger.create({ trigger: ch.querySelector(".ch-body"), start: "top 88%", once: true, onEnter: function () { ch.classList.add("is-seen"); } });
    });

    // a little depth on the line drawings
    story.querySelectorAll(".ch-art").forEach(function (art) {
      gsap.fromTo(art, { y: 18 }, { y: -18, ease: "none", scrollTrigger: { trigger: art, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  if (rail) {
    ScrollTrigger.create({ trigger: story, start: "top 40%", end: "bottom 60%", onToggle: function (self) { rail.classList.toggle("is-on", self.isActive); } });
  }

  if ("ResizeObserver" in window) {
    var lastW = story.clientWidth, lastH = story.clientHeight;
    new ResizeObserver(function () {
      if (story.clientWidth !== lastW || Math.abs(story.clientHeight - lastH) > 2) { lastW = story.clientWidth; lastH = story.clientHeight; refresh(); }
    }).observe(story);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener("load", refresh);
})();
