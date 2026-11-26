/* Homepage hero: AWS and creative tool icons orbiting the portrait.
   One requestAnimationFrame loop moves the icons with transform and opacity only.
   It runs only while the hero is on screen and the tab is visible, and never under reduced motion
   (the icons then keep the static positions set in the HTML). */
(function () {
  "use strict";
  var stage = document.querySelector(".cloud-stage");
  if (!stage) return;
  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Every service here is documented in at least one project README.
  var SERVICES = [
    ["AWSLambda", "Lambda"], ["AmazonSimpleStorageService", "S3"], ["AmazonDynamoDB", "DynamoDB"],
    ["AmazonEC2", "EC2"], ["AmazonAPIGateway", "API Gateway"], ["AmazonCognito", "Cognito"],
    ["AWSAmplify", "Amplify"], ["AmazonCloudWatch", "CloudWatch"], ["AWSIdentityandAccessManagement", "IAM"],
    ["AmazonVirtualPrivateCloud", "VPC"], ["AmazonSimpleNotificationService", "SNS"]
  ];

  var orbs = Array.prototype.slice.call(stage.querySelectorAll(".orb"));
  var CREATIVE_TOOLS = [
    ["photoshop", "Photoshop"], ["after-effects", "After Effects"], ["premiere-pro", "Premiere Pro"],
    ["davinci-resolve", "DaVinci Resolve"], ["canva", "Canva"], ["lightroom", "Lightroom"],
    ["unity", "Unity"], ["maya", "Autodesk Maya"], ["illustrator", "Illustrator"],
    ["indesign", "InDesign"], ["audition", "Audition"], ["media-encoder", "Media Encoder"]
  ];
  var toggle = stage.querySelector(".orbit-toggle");
  var status = stage.querySelector(".orbit-status");
  var creative = false, modeStart = 0, queue = SERVICES.slice(orbs.length), creativeIndex = 0;
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
      bob: 3 + (i % 4) * 1.5, bobSpeed: 0.45 + (i % 5) * 0.09, phase: i * 1.7,
      front: null, swapped: false
    };
  });

  function setIcon(slot, item, directory) {
    slot.img.src = "img/" + directory + "/" + item[0] + ".svg";
    slot.img.setAttribute("data-file", item[0]);
    slot.label.textContent = item[1];
    slot.swapped = false;
  }

  var W = 0, H = 0, visibleCount = n;
  function measure() {
    W = stage.clientWidth; H = stage.clientHeight;
    stage.classList.toggle("is-compact", W < 520);
    var previousCount = visibleCount;
    visibleCount = W < 520 ? 6 : n;
    if (creative && stage.classList.contains("is-live") && visibleCount > previousCount) {
      for (var i = previousCount; i < visibleCount; i++) {
        setIcon(state[i], nextCreativeTool(), "creative");
      }
    }
  }

  var sparkle = toggle.querySelector("svg");
  var smokePuff = stage.querySelector(".portrait-smoke-puff");
  var toggleEffects = [];

  function playToggleEffects() {
    if (motionPreference.matches || !sparkle.animate) return;
    toggleEffects.forEach(function (effect) { effect.cancel(); });
    toggleEffects = [sparkle.animate([
      { transform: "rotate(0) scale(1)" },
      { transform: "rotate(42deg) scale(1.28)", offset: 0.48 },
      { transform: "rotate(90deg) scale(1)" }
    ], { duration: 420, easing: "ease-out" })];

    toggleEffects.push(smokePuff.animate([
      { opacity: 0 },
      { opacity: 0.88, offset: 0.28 },
      { opacity: 0 }
    ], { duration: 1150, easing: "ease-out" }));
  }

  toggle.hidden = false;
  toggle.addEventListener("click", function () {
    creative = !creative;
    playToggleEffects();
    toggle.setAttribute("aria-pressed", String(creative));
    toggle.title = creative ? "Switch to AWS services" : "Switch to creative tools";
    stage.classList.toggle("is-creative", creative);
    var icons = (creative ? CREATIVE_TOOLS : SERVICES).slice(0, n);
    var directory = creative ? "creative" : "aws";
    icons.forEach(function (item, i) { setIcon(state[i], item, directory); });
    queue = SERVICES.slice(n);
    creativeIndex = visibleCount;
    modeStart = elapsed;
    measure();
    status.textContent = creative ? "Showing creative tools" : "Showing AWS services";
  });

  var elapsed = 0, last = 0, running = false, raf = 0;
  if (motionPreference.matches) return;

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
  var dragPointer = null, lastX = 0, lastY = 0, lastMove = 0, vel = 0, tilt = 0;
  var MAX_VEL = 7, MAX_TILT = 0.055;
  stage.addEventListener("pointerdown", function (e) {
    if (toggle.contains(e.target) || dragPointer !== null || e.button !== 0) return;
    dragPointer = e.pointerId; vel = 0;
    lastX = e.clientX; lastY = e.clientY; lastMove = performance.now();
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("is-dragging");
  });
  stage.addEventListener("pointermove", function (e) {
    if (e.pointerId !== dragPointer) return;
    var now = performance.now(), dt = Math.max(1, now - lastMove) / 1000;
    var dRot = -(e.clientX - lastX) / Math.max(120, W * 0.42);   // drag right, the front of the ring follows right
    rot = (rot + dRot + TAU) % TAU;
    vel = Math.max(-MAX_VEL, Math.min(MAX_VEL, vel * 0.3 + (dRot / dt) * 0.7));
    tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, tilt + (e.clientY - lastY) / Math.max(200, H) * 0.6));
    lastX = e.clientX; lastY = e.clientY; lastMove = now;
  });
  function release(e) {
    if (e.pointerId !== dragPointer) return;
    dragPointer = null;
    if (performance.now() - lastMove > 90) vel = 0;              // held still before letting go: no fling
    if (stage.hasPointerCapture && stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    stage.classList.remove("is-dragging");
  }
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("lostpointercapture", release);
  function nextCreativeTool() {
    var shown = state.slice(0, visibleCount).map(function (slot) { return slot.img.getAttribute("data-file"); });
    var next;
    do {
      next = CREATIVE_TOOLS[creativeIndex];
      creativeIndex = (creativeIndex + 1) % CREATIVE_TOOLS.length;
    } while (shown.indexOf(next[0]) !== -1);
    return next;
  }

  function frame(t) {
    var dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    elapsed += dt;
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;

    if (dragPointer === null) {
      rot = (rot + (SPEED + vel) * dt + TAU) % TAU;
      vel *= Math.exp(-dt * 1.8);                     // momentum fades back into the normal orbit
      if (Math.abs(vel) < 0.002) vel = 0;
      tilt += (0 - tilt) * Math.min(1, dt * 1.5);     // ring eases back to its resting angle
    }
    // The front arc crosses the lower edge of the photo, below the face.
    var rx = W * 0.40, ry = H * (0.275 + tilt), cy = H * 0.045;
    var parallax = Math.min(W * 0.025, 16);
    for (var i = 0; i < visibleCount; i++) {
      var s = state[i];
      s.a = (rot + (s.slot / visibleCount) * TAU) % TAU;
      var z = Math.sin(s.a);                       // -1 behind the portrait, 1 in front
      var depth = (z + 1) / 2;
      var e = ease(Math.max(0, Math.min(1, (elapsed - modeStart - i * 0.055) / 0.7)));
      var x = Math.cos(s.a) * rx * s.r + mx * parallax * (0.35 + depth);
      var y = (z * ry + s.lift * H) + cy + Math.sin(elapsed * s.bobSpeed + s.phase) * s.bob + my * parallax * 0.5 * (0.35 + depth);
      var scale = 0.64 + 0.36 * depth;
      s.el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0) scale(" + scale.toFixed(3) + ")";
      // Fade the rear midpoint so service changes stay hidden through the clear parts of the cutout.
      var rearFade = Math.max(0, Math.min(1, (z + 0.985) / 0.19));
      s.el.style.opacity = (e * rearFade * (0.42 + 0.58 * depth)).toFixed(3);
      s.label.style.opacity = Math.max(0, Math.min(1, (z - 0.3) / 0.5)).toFixed(2);

      var front = z > 0;
      if (front !== s.front) { s.el.style.zIndex = front ? 5 : 3; s.front = front; }

      // Swap once the icon has faded at the rear midpoint.
      if (z < -0.985 && !s.swapped && e === 1) {
        if (creative) {
          setIcon(s, nextCreativeTool(), "creative");
        } else {
          var next = queue.shift();
          queue.push([s.img.getAttribute("data-file"), s.label.textContent]);
          setIcon(s, next, "aws");
        }
        s.swapped = true;
      } else if (z > 0) {
        s.swapped = false;
      }
    }
    raf = requestAnimationFrame(frame);
  }

  function setRunning(on) {
    stage.classList.toggle("is-paused", !on);
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
  setRunning(!document.hidden);
})();
