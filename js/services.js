/* Services page behaviour. Every part is optional: without it the page still shows all content. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- hero reel: a slow loop of real work; a plain sideways scroll under reduced motion ---- */
  var reel = document.getElementById("reel");
  if (reel && !reduce) {
    var track = reel.querySelector(".reel-track");
    Array.prototype.slice.call(track.children).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      c.querySelectorAll("img").forEach(function (img) { img.alt = ""; });
      track.appendChild(c);
    });
    reel.classList.add("is-looping");
    reel.setAttribute("aria-label", "Recent work, moving slowly. Hover or focus to pause.");
  }

  /* ---- gallery filter ---- */
  var grid = document.getElementById("cw-grid");
  var filter = document.querySelector(".sv-filter");
  var status = document.getElementById("cw-status");
  if (grid && filter) {
    var items = Array.prototype.slice.call(grid.querySelectorAll(".cw-item"));
    filter.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var f = btn.getAttribute("data-filter");
      filter.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      var k = 0;
      items.forEach(function (li) {
        var on = f === "all" || li.getAttribute("data-cat") === f;
        li.hidden = !on;
        li.classList.remove("is-entering");
        if (on) {
          li.style.setProperty("--k", k++);
          void li.offsetWidth; // restart the entrance
          li.classList.add("is-entering");
        }
      });
      if (status) status.textContent = k + (k === 1 ? " piece" : " pieces") + " shown";
    });
    grid.addEventListener("animationend", function (e) { e.target.classList.remove("is-entering"); });
  }

  /* ---- gallery lightbox: previous / next through what the filter shows ---- */
  var box = document.getElementById("cw-box");
  if (box && grid && typeof box.showModal === "function") {
    var bImg = box.querySelector("img");
    var bTitle = box.querySelector("#cw-box-title");
    var bMeta = box.querySelector("[data-meta]");
    var bCount = box.querySelector("[data-count]");
    var list = [], at = 0, opener = null;

    var visible = function () {
      return Array.prototype.slice.call(grid.querySelectorAll(".cw-item:not([hidden]) .cw-open"));
    };
    var show = function (i, dir) {
      at = (i + list.length) % list.length;
      var b = list[at], thumb = b.querySelector("img");
      bImg.src = b.getAttribute("data-src");
      bImg.alt = thumb ? thumb.alt : "";
      bTitle.textContent = b.getAttribute("data-title");
      bMeta.textContent = b.getAttribute("data-meta");
      bCount.textContent = (at + 1) + " of " + list.length;
      if (dir) {
        bImg.style.setProperty("--dir", (dir > 0 ? 16 : -16) + "px");
        bImg.classList.remove("is-swapping"); void bImg.offsetWidth; bImg.classList.add("is-swapping");
      }
    };
    grid.addEventListener("click", function (e) {
      var b = e.target.closest(".cw-open");
      if (!b) return;
      list = visible();
      opener = b;
      show(list.indexOf(b), 0);
      box.showModal();
    });
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.closest("[data-close]")) { box.close(); return; }
      var s = e.target.closest("[data-step]");
      if (s) { var d = Number(s.getAttribute("data-step")); show(at + d, d); }
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); show(at + 1, 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); show(at - 1, -1); }
    });
    box.addEventListener("close", function () {
      bImg.removeAttribute("src");
      if (opener) opener.focus();
    });
  }

  /* ---- sample proposal: opened from the hero walkthrough and the scopes ---- */
  var prop = document.getElementById("proposal");
  if (prop && typeof prop.showModal === "function") {
    var propOpener = null;
    prop.querySelectorAll(".proposal-table tbody tr").forEach(function (tr, i) { tr.style.setProperty("--r", i); });
    var openProp = function (from) { propOpener = from || null; prop.showModal(); };
    document.querySelectorAll("[data-proposal]").forEach(function (b) {
      b.addEventListener("click", function () { openProp(b); });
    });
    var sim = document.querySelector(".sv-hero-sim .tsim");
    if (sim) sim.addEventListener("click", function () { openProp(document.querySelector(".sv-proposal-open")); });
    prop.addEventListener("click", function (e) {
      if (e.target === prop || e.target.closest("[data-proposal-close]")) prop.close();
    });
    prop.addEventListener("close", function () { if (propOpener) propOpener.focus({ preventScroll: true }); });
    var req = prop.querySelector("[data-proposal-request]");
    if (req) req.addEventListener("click", function () {
      propOpener = null;
      prop.close();
      var s = document.getElementById("inq-service"), d = document.getElementById("inq-desc");
      if (s) s.value = "Website development";
      if (d && !d.value.trim()) d.value = "I'd like a proposal like your dental clinic sample, for my ";
      document.getElementById("inquire").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      setTimeout(function () { var n = document.getElementById("inq-name"); if (n) n.focus({ preventScroll: true }); }, reduce ? 0 : 600);
    });
  }

  /* ---- accordion: index links open the row they point to ---- */
  var openFromHash = function () {
    var t = location.hash && document.getElementById(location.hash.slice(1));
    if (t && t.tagName === "DETAILS") t.open = true;
  };
  window.addEventListener("hashchange", openFromHash);
  openFromHash();

  /* ---- process: the bar fills and each step lights as it is scrolled past ---- */
  var wrap = document.getElementById("steps");
  if (wrap) {
    var fill = document.getElementById("steps-fill");
    var steps = Array.prototype.slice.call(wrap.querySelectorAll(".steps li"));
    var vertical = window.matchMedia("(max-width: 900px)");
    var ticking = false;
    var update = function () {
      ticking = false;
      var line = window.innerHeight * 0.72;
      var r = wrap.getBoundingClientRect();
      var p;
      if (vertical.matches) {
        p = (line - r.top) / r.height;
      } else {
        // horizontal: run the bar across while the row travels through the lower half of the screen
        p = (window.innerHeight - r.top) / (window.innerHeight * 0.55);
      }
      p = Math.max(0, Math.min(1, p));
      fill.style.setProperty("--p", p.toFixed(3));
      steps.forEach(function (li, i) {
        var reached = vertical.matches
          ? li.getBoundingClientRect().top < line
          : p >= (i + 0.5) / steps.length;
        li.classList.toggle("is-reached", reached);
      });
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---- inquiry block opens like a shutter as it arrives ---- */
  var field = document.querySelector(".sv-cta-field");
  if (field) {
    if (reduce || !("IntersectionObserver" in window)) {
      field.classList.add("is-in");
    } else {
      var fio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { field.classList.add("is-in"); fio.disconnect(); }
        });
      }, { rootMargin: "0px 0px -10% 0px" });
      fio.observe(field.parentElement);
    }
  }

  /* ---- inquiry: quote buttons prefill, submit writes an email ---- */
  var form = document.getElementById("inq");
  if (form) {
    var fName = form.querySelector("#inq-name");
    var fService = form.querySelector("#inq-service");
    var fDesc = form.querySelector("#inq-desc");
    var fBudget = form.querySelector("#inq-budget");
    var fTime = form.querySelector("#inq-time");
    var err = form.querySelector("#inq-error");

    document.querySelectorAll(".sv-quote").forEach(function (b) {
      b.addEventListener("click", function () {
        fService.value = b.getAttribute("data-service");
        var scope = b.getAttribute("data-scope");
        var line = "I'd like a quote for a " + scope.toLowerCase() + " (from your example scopes).";
        if (!fDesc.value.trim() || /from your example scopes\)\.$/.test(fDesc.value.trim())) fDesc.value = line + "\n\n";
        document.getElementById("inquire").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        form.classList.remove("is-flash"); void form.offsetWidth; form.classList.add("is-flash");
        setTimeout(function () { fName.focus({ preventScroll: true }); }, reduce ? 0 : 600);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = [];
      [fName, fDesc].forEach(function (f) {
        var empty = !f.value.trim();
        f.setAttribute("aria-invalid", String(empty));
        if (empty) bad.push(f);
      });
      err.hidden = !bad.length;
      if (bad.length) { bad[0].focus(); return; }

      var subject = "Project inquiry: " + fService.value;
      var body = [
        "Hi Jervil,",
        "",
        fDesc.value.trim(),
        "",
        "Service: " + fService.value,
        fBudget.value.trim() ? "Budget: " + fBudget.value.trim() : "",
        fTime.value ? "Timeline: " + fTime.value : "",
        "",
        "Thanks,",
        fName.value.trim()
      ].filter(function (l, i, a) { return l !== "" || a[i - 1] !== ""; }).join("\n");
      var url = "mailto:deleonangelojervil@gmail.com?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      form.setAttribute("data-mailto", url);
      window.location.href = url;
    });
    [fName, fDesc].forEach(function (f) {
      f.addEventListener("input", function () { if (f.value.trim()) f.removeAttribute("aria-invalid"); });
    });
  }
})();
