/* Projects page: filter the card grid, and open a card's full write-up in a dialog.
   Without this file every write-up still shows under its card. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var grid = document.getElementById("pj-grid");
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".pj"));

  /* ---------------- filter ---------------- */
  var filter = document.querySelector(".pj-filter");
  var status = document.getElementById("pj-status");
  var labels = { all: "all", cloud: "cloud and AWS", web: "website and app", automation: "automation" };
  if (filter) {
    filter.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var cat = btn.getAttribute("data-cat");
      filter.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      var n = 0;
      cards.forEach(function (c) {
        var on = cat === "all" || c.getAttribute("data-cat").split(" ").indexOf(cat) > -1;
        if (on) n++;
        if (on === !c.hidden) return;
        if (on) {
          c.hidden = false;
          if (!reduce) { c.classList.add("is-entering"); requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.remove("is-entering"); }); }); }
        } else {
          c.hidden = true;
        }
      });
      if (status) status.textContent = cat === "all" ? "Showing all " + n + " projects" : "Showing " + n + " " + labels[cat] + " project" + (n === 1 ? "" : "s");
    });
  }

  /* ---------------- dialog ---------------- */
  var dlg = document.getElementById("pjd");
  if (!dlg || typeof dlg.showModal !== "function") return;
  document.documentElement.classList.add("pj-dialogs");

  var panel = dlg.querySelector(".pjd-panel");
  var hero = document.getElementById("pjd-hero");
  var kicker = document.getElementById("pjd-kicker");
  var title = document.getElementById("pjd-title");
  var line = document.getElementById("pjd-line");
  var body = document.getElementById("pjd-body");
  var steps = dlg.querySelectorAll(".pjd-step");
  var current = null, detail = null, opener = null;

  function visibleCards() { return cards.filter(function (c) { return !c.hidden; }); }

  function fill(card) {
    // put the previous write-up back where it came from
    if (detail && current) current.appendChild(detail);
    current = card;
    detail = card.querySelector(".pj-detail");

    kicker.textContent = Array.prototype.map.call(card.querySelectorAll(".pj-kicker span"), function (s) { return s.textContent; }).join(" · ");
    title.textContent = card.querySelector(".pj-open").textContent;
    line.textContent = card.querySelector(".pj-line").textContent;

    hero.innerHTML = "";
    var v = card.getAttribute("data-video");
    if (v) {
      var vid = document.createElement("video");
      vid.muted = true; vid.loop = true; vid.playsInline = true; vid.controls = true;
      vid.setAttribute("playsinline", ""); vid.setAttribute("preload", "auto");
      vid.poster = card.getAttribute("data-poster") || "";
      vid.width = 1920; vid.height = 1080;
      vid.setAttribute("aria-label", "Showcase video for " + title.textContent);
      vid.src = v;
      hero.appendChild(vid);
      if (!reduce) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
    } else {
      var img = document.createElement("img");
      img.src = card.getAttribute("data-image");
      img.alt = card.getAttribute("data-alt") || "";
      img.decoding = "async";
      hero.appendChild(img);
    }
    hero.classList.toggle("is-image", !v);

    body.appendChild(detail);
    panel.scrollTop = 0;

    var list = visibleCards(), i = list.indexOf(card);
    steps.forEach(function (b) {
      var t = list[(i + Number(b.getAttribute("data-step")) + list.length) % list.length];
      b.hidden = list.length < 2;
      b.querySelector(".pjd-step-name").textContent = t.querySelector(".pj-open").textContent;
      b.__target = t;
    });
    history.replaceState(null, "", "#" + card.id);
  }

  // Grow the hero out of the card's media, then let the rest of the panel rise in.
  function animateFrom(card) {
    if (reduce || !hero.animate) return;
    var from = card.querySelector(".pj-media").getBoundingClientRect();
    var to = hero.getBoundingClientRect();
    if (!to.width) return;
    var sx = from.width / to.width, sy = from.height / to.height;
    hero.animate([
      { transformOrigin: "0 0", transform: "translate(" + (from.left - to.left) + "px," + (from.top - to.top) + "px) scale(" + sx + "," + sy + ")" },
      { transformOrigin: "0 0", transform: "none" }
    ], { duration: 620, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
    dlg.querySelectorAll(".pjd-top, .pjd-head, .pjd-body, .pjd-nav").forEach(function (el, k) {
      el.animate([{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "none" }],
        { duration: 700, delay: 180 + k * 70, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" });
    });
  }

  function open(card, fromCard) {
    opener = card.querySelector(".pj-open");
    fill(card);
    dlg.showModal();
    document.documentElement.classList.add("pjd-lock");
    if (fromCard) animateFrom(card);
    dlg.querySelector(".pjd-close").focus({ preventScroll: true });
  }

  function step(card) {
    fill(card);
    if (reduce) return;
    dlg.querySelectorAll(".pjd-hero, .pjd-head, .pjd-body").forEach(function (el, k) {
      el.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }],
        { duration: 500, delay: k * 60, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" });
    });
  }

  function close() {
    if (!dlg.open) return;
    if (reduce || !panel.animate) { dlg.close(); return; }
    var a = panel.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(20px) scale(0.99)" }],
      { duration: 220, easing: "ease-in" });
    a.onfinish = function () { dlg.close(); };
  }

  dlg.addEventListener("close", function () {
    document.documentElement.classList.remove("pjd-lock");
    var v = hero.querySelector("video");
    if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
    hero.innerHTML = "";
    if (detail && current) current.appendChild(detail);
    detail = null;
    history.replaceState(null, "", location.pathname + location.search);
    if (opener) opener.focus({ preventScroll: true });
    current = null;
  });
  dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
  dlg.querySelector(".pjd-close").addEventListener("click", close);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
  steps.forEach(function (b) { b.addEventListener("click", function () { if (b.__target) step(b.__target); }); });

  cards.forEach(function (card) {
    card.querySelector(".pj-open").addEventListener("click", function () { open(card, true); });
  });

  /* ---------------- deep links: projects#p-ticketing opens that project ---------------- */
  function fromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var card = document.getElementById(id);
    if (card && card.classList.contains("pj")) {
      card.scrollIntoView({ block: "center" });
      open(card, false);
    }
  }
  fromHash();
  window.addEventListener("hashchange", function () { if (!dlg.open) fromHash(); });
})();
