/* Projects page: filter the card grid, and open a card's full write-up in a dialog.
   Without this file every write-up still shows under its card. */
(function () {
  "use strict";
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var grid = document.getElementById("pj-grid");
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".pj"));

  /* ---------------- filter ---------------- */
  var filter = document.querySelector(".pj-filter");
  var status = document.getElementById("pj-status");
  var labels = { all: "all", cloud: "cloud and AWS", web: "website and app", automation: "automation" };
  if (filter) {
    document.documentElement.classList.add("pj-filters");
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
          if (!motion.matches) { c.classList.add("is-entering"); requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.remove("is-entering"); }); }); }
        } else {
          c.hidden = true;
        }
      });
      if (status) status.textContent = cat === "all" ? "Showing all " + n + " projects" : "Showing " + n + " " + labels[cat] + " project" + (n === 1 ? "" : "s");
    });
  }

  function showLoading(video, container) {
    function loading() { container.classList.add("is-loading"); }
    function ready() { container.classList.remove("is-loading"); }
    video.addEventListener("loadstart", loading);
    video.addEventListener("waiting", loading);
    ["loadeddata", "playing", "pause", "error", "abort", "emptied"].forEach(function (name) {
      video.addEventListener(name, ready);
    });
  }

  if ("IntersectionObserver" in window) {
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("pj-seen");
        reveal.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
    cards.forEach(function (card) { reveal.observe(card); });
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
  var current, detail, opener, player;

  function clearHero() {
    if (player) {
      player.pause();
      player.removeAttribute("src");
      player.load();
      player = null;
    }
    hero.replaceChildren();
    hero.classList.remove("is-loading");
  }

  function playShowcase() {
    if (!player || player.hasAttribute("src")) return;
    player.controls = true;
    player.src = current.dataset.video;
    player.play().catch(function () {});
  }

  function fill(card) {
    if (detail) current.appendChild(detail);
    clearHero();
    current = card;
    detail = card.querySelector(".pj-detail");
    kicker.textContent = card.querySelector(".pj-kicker").innerText;
    title.textContent = card.querySelector(".pj-title").textContent;
    line.textContent = card.querySelector(".pj-line").textContent;

    if (card.dataset.video) {
      var video = document.createElement("video");
      var play = document.createElement("button");
      var fallback = document.createElement("p");
      player = video;
      video.playsInline = true;
      video.controls = false;
      video.preload = "none";
      video.poster = card.dataset.poster;
      video.width = 1920;
      video.height = 1080;
      video.tabIndex = 0;
      video.setAttribute("aria-label", "Showcase video for " + title.textContent);
      play.className = "btn pjd-play";
      play.type = "button";
      play.textContent = "Play showcase";
      play.addEventListener("click", function () { playShowcase(); video.focus(); });
      video.addEventListener("play", function () { play.hidden = true; });
      fallback.className = "pjd-media-error";
      fallback.setAttribute("role", "status");
      fallback.tabIndex = -1;
      fallback.hidden = true;
      fallback.textContent = "The showcase couldn’t load. The case study is available below.";
      showLoading(video, hero);
      video.addEventListener("error", function () {
        if (player !== video) return;
        var restoreFocus = document.activeElement === video || document.activeElement === play;
        video.hidden = true;
        play.hidden = true;
        fallback.hidden = false;
        if (restoreFocus) fallback.focus({ preventScroll: true });
      });
      hero.style.backgroundImage = 'url("' + card.dataset.poster + '")';
      hero.append(video, play, fallback);
    }

    body.appendChild(detail);
    panel.scrollTop = 0;
    var list = cards.filter(function (entry) { return !entry.hidden; });
    var i = list.indexOf(card);
    steps.forEach(function (step) {
      var target = list[(i + Number(step.dataset.step) + list.length) % list.length];
      step.hidden = list.length < 2;
      step.querySelector(".pjd-step-name").textContent = target.querySelector(".pj-title").textContent;
      step.dataset.target = target.id;
    });
    history.replaceState(null, "", "#" + card.id);
  }

  function open(card, trigger, watch) {
    if (card.hidden) filter.querySelector('[data-cat="all"]').click();
    opener = trigger || card.querySelector(".pj-open");
    fill(card);
    if (!dlg.open) dlg.showModal();
    document.documentElement.classList.add("pjd-lock");
    if (watch) {
      playShowcase();
      player.focus();
    } else {
      dlg.querySelector(".pjd-close").focus({ preventScroll: true });
    }
  }

  dlg.addEventListener("close", function () {
    if (dlg.open) return;
    document.documentElement.classList.remove("pjd-lock");
    clearHero();
    current.appendChild(detail);
    detail = null;
    if (location.hash === "#" + current.id) history.replaceState(null, "", location.pathname + location.search);
    opener.focus({ preventScroll: true });
  });
  dlg.querySelector(".pjd-close").addEventListener("click", function () { dlg.close(); });
  steps.forEach(function (step) {
    step.addEventListener("click", function () {
      fill(document.getElementById(step.dataset.target));
      dlg.querySelector(".pjd-close").focus({ preventScroll: true });
    });
  });

  cards.forEach(function (card) {
    card.querySelectorAll(".pj-open, .pj-watch").forEach(function (link) {
      link.setAttribute("aria-haspopup", "dialog");
      link.addEventListener("click", function (event) {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        open(card, link, link.classList.contains("pj-watch"));
      });
    });
  });

  function fromHash() {
    var id = location.hash.slice(1);
    var card = cards.find(function (entry) { return entry.id === id || entry.id + "-case" === id; });
    if (!card || (dlg.open && card === current)) return;
    card.scrollIntoView({ block: "center" });
    open(card);
  }

  fromHash();
  window.addEventListener("hashchange", fromHash);
})();
