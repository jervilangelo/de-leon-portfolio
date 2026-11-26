/* Load before the stylesheets so a saved theme is applied before the first paint. */
(function () {
  "use strict";
  var root = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  var key = "portfolio-theme";
  var button;

  function apply(theme) {
    var light = theme === "light";
    var action = light ? "Switch to dark mode" : "Switch to light mode";
    root.dataset.theme = light ? "light" : "dark";
    if (meta) meta.content = light ? "#f7f7f3" : "#1c1c1c";
    if (button) {
      button.setAttribute("aria-label", action);
      button.title = action;
    }
  }

  var saved;
  try { saved = localStorage.getItem(key); } catch (error) { /* Storage can be disabled. */ }
  apply(saved);

  document.addEventListener("DOMContentLoaded", function () {
    button = document.querySelector(".theme-toggle");
    if (!button) return;
    apply(root.dataset.theme);
    button.hidden = false;
    button.addEventListener("click", function () {
      var theme = root.dataset.theme === "light" ? "dark" : "light";
      apply(theme);
      try { localStorage.setItem(key, theme); } catch (error) { /* Keep the current page usable. */ }
    });
  });

  window.addEventListener("storage", function (event) {
    if (event.key === key || event.key === null) apply(event.newValue);
  });
})();
