/* Homepage hero: AWS service icons orbiting the cloud.
   One requestAnimationFrame loop moves the icons with transform and opacity only.
   It runs only while the hero is on screen and the tab is visible, and never under reduced motion
   (the icons then keep the static positions set in the HTML). */
(function () {
  "use strict";
  var stage = document.querySelector(".cloud-stage");
  if (!stage) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Every service here is documented in at least one project README.
  var SERVICES = [
    ["AWSLambda", "Lambda"], ["AmazonSimpleStorageService", "S3"], ["AmazonDynamoDB", "DynamoDB"],
    ["AmazonEC2", "EC2"], ["AmazonAPIGateway", "API Gateway"], ["AmazonCognito", "Cognito"],
    ["AWSAmplify", "Amplify"], ["AmazonCloudWatch", "CloudWatch"], ["AWSIdentityandAccessManagement", "IAM"],
    ["AmazonVirtualPrivateCloud", "VPC"], ["AmazonSimpleNotificationService", "SNS"]
  ];

  var orbs = Array.prototype.slice.call(stage.querySelectorAll(".orb"));
  var shown = orbs.map(function (o) { return o.querySelector("span").textContent; });
  var queue = SERVICES.filter(function (s) { return shown.indexOf(s[1]) === -1; });
  var cloud = stage.querySelector(".cloud-tilt");
  var hero = stage.closest(".hero") || stage;

  var TAU = Math.PI * 2;
  var SPEED = TAU / 80;                  // one lap in 80 seconds
  var n = orbs.length;
  var state = orbs.map(function (el, i) {
    return {
      el: el, img: el.querySelector("img"), label: el.querySelector("span"),
      slot: i,                            // position around the ring
      r: 0.97 + (i % 3) * 0.03,           // slightly different ring radius per icon
      lift: ((i * 37) % 5 - 2) * 0.012,   // slightly different height per icon
      bob: 5 + (i % 4) * 2.5, bobSpeed: 0.45 + (i % 5) * 0.09, phase: i * 1.7,
      front: null, swapped: false
    };
  });

  var W = 0, H = 0, visibleCount = n;
  function measure() {
    W = stage.clientWidth; H = stage.clientHeight;
    visibleCount = W < 520 ? 6 : n;
    orbs.forEach(function (o, i) { o.style.display = i < visibleCount ? "" : "none"; });
  }
  measure();
  if ("ResizeObserver" in window) new ResizeObserver(measure).observe(stage);
  else window.addEventListener("resize", measure);

  // the inline left/top are the static fallback layout; the orbit measures from the stage centre
  orbs.forEach(function (o) { o.style.left = ""; o.style.top = ""; });
  stage.classList.add("is-live");

  // cursor parallax, eased toward the target every frame
  var tx = 0, ty = 0, mx = 0, my = 0;
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    hero.addEventListener("pointermove", function (e) {
      var b = stage.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (b.left + b.width / 2)) / (b.width / 2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (b.top + b.height / 2)) / (b.height / 2)));
    });
    hero.addEventListener("pointerleave", function () { tx = 0; ty = 0; });
  }

  function ease(x) { return 1 - Math.pow(1 - x, 3); }

  var rot = 0.35;                         // shared rotation; icons are spaced evenly over however many are shown

  // click (or touch) and drag to spin the ring; it keeps some momentum, then settles back to the slow orbit
  var dragging = false, lastX = 0, lastY = 0, lastMove = 0, vel = 0, tilt = 0;
  var MAX_VEL = 7, MAX_TILT = 0.16;
  stage.addEventListener("pointerdown", function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true; vel = 0;
    lastX = e.clientX; lastY = e.clientY; lastMove = performance.now();
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("is-dragging");
  });
  stage.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var now = performance.now(), dt = Math.max(1, now - lastMove) / 1000;
    var dRot = -(e.clientX - lastX) / Math.max(120, W * 0.42);   // drag right, the front of the ring follows right
    rot = (rot + dRot + TAU) % TAU;
    vel = Math.max(-MAX_VEL, Math.min(MAX_VEL, vel * 0.3 + (dRot / dt) * 0.7));
    tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, tilt + (e.clientY - lastY) / Math.max(200, H) * 0.6));
    lastX = e.clientX; lastY = e.clientY; lastMove = now;
  });
  function release(e) {
    if (!dragging) return;
    dragging = false;
    if (performance.now() - lastMove > 90) vel = 0;              // held still before letting go: no fling
    if (stage.hasPointerCapture && stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    stage.classList.remove("is-dragging");
  }
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("lostpointercapture", release);
  var start = 0, last = 0, running = false, raf = 0;
  function frame(t) {
    if (!start) { start = t; last = t; }
    var dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;

    if (!dragging) {
      rot = (rot + (SPEED + vel) * dt + TAU) % TAU;
      vel *= Math.exp(-dt * 1.8);                     // momentum fades back into the normal orbit
      if (Math.abs(vel) < 0.002) vel = 0;
      tilt += (0 - tilt) * Math.min(1, dt * 1.5);     // ring eases back to its resting angle
    }
    var rx = W * 0.42, ry = H * (0.27 + tilt), cy = H * 0.02;
    for (var i = 0; i < visibleCount; i++) {
      var s = state[i];
      s.a = (rot + (s.slot / visibleCount) * TAU) % TAU;
      var z = Math.sin(s.a);                       // -1 behind the cloud, 1 in front
      var depth = (z + 1) / 2;
      var e = ease(Math.max(0, Math.min(1, (t - start - 250 - i * 110) / 1500)));
      var spread = 0.25 + 0.75 * e;                 // icons emerge from the cloud on load
      var x = Math.cos(s.a) * rx * s.r * spread + mx * 22 * (0.35 + depth);
      var y = (z * ry + s.lift * H) * spread + cy + Math.sin(t / 1000 * s.bobSpeed + s.phase) * s.bob + my * 14 * (0.35 + depth);
      var scale = (0.62 + 0.4 * depth) * (0.6 + 0.4 * e);
      s.el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0) scale(" + scale.toFixed(3) + ")";
      s.el.style.opacity = (e * (0.42 + 0.58 * depth)).toFixed(3);
      s.label.style.opacity = Math.max(0, Math.min(1, (z - 0.3) / 0.5)).toFixed(2);

      var front = z > 0;
      if (front !== s.front) { s.el.style.zIndex = front ? 4 : 1; s.front = front; }

      // deep behind the cloud, the icon quietly becomes another service the projects used
      if (z < -0.93 && !s.swapped && queue.length && e === 1) {
        var next = queue.shift();
        queue.push([s.img.getAttribute("data-file"), s.label.textContent]);
        s.img.src = "img/aws/" + next[0] + ".svg";
        s.img.setAttribute("data-file", next[0]);
        s.label.textContent = next[1];
        s.swapped = true;
      } else if (z > 0) {
        s.swapped = false;
      }
    }
    if (cloud) cloud.style.transform = "rotateY(" + (mx * 6).toFixed(2) + "deg) rotateX(" + (-my * 5).toFixed(2) + "deg) translate3d(" + (-mx * 8).toFixed(1) + "px," + (-my * 6).toFixed(1) + "px,0)";
    raf = requestAnimationFrame(frame);
  }

  function setRunning(on) {
    if (on === running) return;
    running = on;
    if (on) { last = performance.now(); raf = requestAnimationFrame(frame); }
    else cancelAnimationFrame(raf);
  }
  var inView = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { inView = es[0].isIntersecting; setRunning(inView && !document.hidden); }).observe(stage);
  }
  document.addEventListener("visibilitychange", function () { setRunning(inView && !document.hidden); });
  setRunning(true);
})();
