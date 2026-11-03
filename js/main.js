/* Shared behaviour. Every feature is optional: without this file the pages still show all content. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- year ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---- mobile menu ---- */
  var nav = document.getElementById("nav");
  var toggle = nav && nav.querySelector(".menu-toggle");
  if (toggle) {
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Close" : "Menu";
    };
    toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("is-open")); });
    nav.querySelectorAll(".nav-links a").forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) { if (nav.classList.contains("is-open") && !nav.contains(e.target)) setOpen(false); });
  }

  /* ---- scroll progress (one rAF per frame) ---- */
  var bar = document.getElementById("progress");
  if (bar) {
    var ticking = false;
    var update = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ")";
      ticking = false;
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---- current section in the nav ---- */
  var links = document.querySelectorAll('.nav-links a[href^="#"]');
  if (links.length && "IntersectionObserver" in window) {
    var map = {};
    links.forEach(function (a) { var t = document.querySelector(a.getAttribute("href")); if (t) map[t.id] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id]) {
          links.forEach(function (a) { a.removeAttribute("aria-current"); });
          map[e.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { spy.observe(document.getElementById(id)); });
  }

  /* ---- staggered entrances ---- */

  var targets = document.querySelectorAll("[data-reveal], [data-shutter]");
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    targets.forEach(function (el) {
      if (el.hasAttribute("data-reveal")) {
        Array.prototype.forEach.call(el.children, function (c, i) { c.style.setProperty("--i", i); });
      }
    });
    // A closed shutter is fully clipped, and observers treat clipped targets as invisible,
    // so each shutter is watched through its unclipped parent.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target.__revealTarget || e.target;
        el.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
    targets.forEach(function (el) {
      var watch = el.hasAttribute("data-shutter") && el.parentElement ? el.parentElement : el;
      watch.__revealTarget = el;
      io.observe(watch);
    });
  }

  /* ---- muted demo videos: play only while visible, never under reduced motion ---- */
  var vids = document.querySelectorAll("video.autoplay");
  if (!reduce && vids.length && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); }
      });
    }, { threshold: 0.2 });
    vids.forEach(function (v) { vio.observe(v); });
  }

  /* ---- lightbox for project screenshots ---- */
  var box = document.getElementById("lightbox");
  if (box && typeof box.showModal === "function") {
    var bImg = box.querySelector("img"), bCap = box.querySelector("figcaption");
    document.querySelectorAll("[data-full]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var img = btn.querySelector("img");
        bImg.src = btn.getAttribute("data-full");
        bImg.alt = img ? img.alt : "";
        bCap.textContent = img ? img.alt : "";
        box.showModal();
      });
    });
    box.querySelector(".lb-close").addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
    box.addEventListener("close", function () { bImg.removeAttribute("src"); });
  }

  /* ---- AWS services: filter by project ---- */
  var filter = document.querySelector(".svc-filter");
  if (filter) {
    var rows = document.querySelectorAll(".svc-list li[data-p]");
    var count = document.getElementById("svc-count");
    filter.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var p = btn.getAttribute("data-project");
      filter.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      var n = 0;
      rows.forEach(function (li) {
        var on = p === "all" || li.getAttribute("data-p").split(" ").indexOf(p) > -1;
        li.classList.toggle("is-off", !on);
        li.classList.toggle("is-on", on && p !== "all");
        if (on) n++;
      });
      if (count) count.textContent = n;
    });
  }
})();
