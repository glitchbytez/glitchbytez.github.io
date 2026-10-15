/* ==========================================================================
   main.js — theme toggle (content rendering and motion arrive in later phases)
   ========================================================================== */

(function () {
  "use strict";

  const root = document.documentElement;
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  /* ---------- Theme ---------- */

  function currentTheme() {
    const explicit = root.getAttribute("data-theme");
    if (explicit === "light" || explicit === "dark") return explicit;
    return darkQuery.matches ? "dark" : "light";
  }

  function syncToggle(button) {
    button.setAttribute("aria-pressed", String(currentTheme() === "dark"));
  }

  function initTheme() {
    const button = document.querySelector(".theme-toggle");
    if (!button) return;

    syncToggle(button);

    button.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        /* storage unavailable: the choice lasts for this visit only */
      }
      syncToggle(button);
    });

    darkQuery.addEventListener("change", () => syncToggle(button));
  }

  initTheme();
})();
