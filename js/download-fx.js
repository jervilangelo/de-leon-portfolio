/* Download buttons on the resume page: the page sheet flies into the button,
   the button fills, then bursts into confetti and confirms. The download itself is the plain link. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var colors = ["#8fa68e", "#a9bfa8", "#c8c5ba", "#e4e1d8", "#f1f1ef"];

  var burst = function (x, y) {
    for (var i = 0; i < 22; i++) {
      var p = document.createElement("span");
      p.className = "dl-bit";
      var size = 5 + Math.random() * 7;
      p.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + size + "px;height:" + size + "px;background:" + colors[i % colors.length];
      document.body.appendChild(p);
      var a = (i / 22) * Math.PI * 2 + Math.random() * 0.4;
      var d = 60 + Math.random() * 90;
      var anim = p.animate([
        { transform: "translate(-50%,-50%) rotate(0deg) scale(1)", opacity: 1 },
        { transform: "translate(calc(-50% + " + Math.cos(a) * d + "px), calc(-50% + " + (Math.sin(a) * d - 30) + "px)) rotate(" + (Math.random() * 540 - 270) + "deg) scale(1)", opacity: 1, offset: 0.6 },
        { transform: "translate(calc(-50% + " + Math.cos(a) * d * 1.15 + "px), calc(-50% + " + (Math.sin(a) * d + 50) + "px)) rotate(" + (Math.random() * 720 - 360) + "deg) scale(0.4)", opacity: 0 }
      ], { duration: 900 + Math.random() * 400, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      anim.onfinish = (function (n) { return function () { n.remove(); }; })(p);
    }
  };

  var fly = function (sheet, btn) {
    var a = sheet.getBoundingClientRect(), b = btn.getBoundingClientRect();
    var ghost = sheet.cloneNode(true);
    ghost.classList.add("dl-ghost");
    ghost.style.cssText = "left:" + a.left + "px;top:" + a.top + "px;width:" + a.width + "px;height:" + a.height + "px";
    document.body.appendChild(ghost);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2);
    var dy = b.top + b.height / 2 - (a.top + a.height / 2);
    var anim = ghost.animate([
      { transform: "translate(0,0) rotate(0deg) scale(1)", opacity: 1 },
      { transform: "translate(" + dx * 0.45 + "px," + (dy * 0.45 - 70) + "px) rotate(-12deg) scale(0.85)", opacity: 1, offset: 0.45 },
      { transform: "translate(" + dx + "px," + dy + "px) rotate(8deg) scale(0.12)", opacity: 0.2 }
    ], { duration: 650, easing: "cubic-bezier(0.65, 0, 0.35, 1)" });
    anim.onfinish = function () { ghost.remove(); };
  };

  document.querySelectorAll("[data-dl]").forEach(function (btn) {
    var label = btn.querySelector(".dl-label");
    var icon = btn.querySelector(".dl-icon");
    var original = label.textContent;
    var timers = [];
    btn.addEventListener("click", function () {
      if (btn.classList.contains("is-busy")) return;
      timers.forEach(clearTimeout); timers = [];
      btn.classList.add("is-busy");
      var card = btn.closest(".doc");
      var sheet = card && card.querySelector(".doc-sheet");
      if (card) card.classList.add("is-sending");

      var done = function () {
        btn.classList.remove("is-loading");
        btn.classList.add("is-done");
        label.textContent = "Downloaded";
        icon.textContent = "✓";
        if (!reduce) {
          var r = btn.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2);
        }
      };

      if (reduce || !sheet || !btn.animate) {
        done();
      } else {
        fly(sheet, btn);
        label.textContent = "Preparing…";
        timers.push(setTimeout(function () { btn.classList.add("is-loading"); }, 450));
        timers.push(setTimeout(done, 1350));
      }
      timers.push(setTimeout(function () {
        btn.classList.remove("is-busy", "is-done", "is-loading");
        if (card) card.classList.remove("is-sending");
        label.textContent = original;
        icon.textContent = "↓";
      }, 3600));
    });
  });
})();
