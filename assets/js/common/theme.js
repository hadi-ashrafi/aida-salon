// دکمه تغییر حالت روشن و تیره: <button data-theme-toggle>
// انتخاب کاربر در localStorage می‌ماند و theme-init.js در بار بعدی آن را اعمال می‌کند.
(function () {
  "use strict";

  const KEY = "aida-theme";
  const root = document.documentElement;
  const buttons = document.querySelectorAll("[data-theme-toggle]");

  const isDark = () => root.getAttribute("data-theme") === "dark";

  function sync() {
    buttons.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(isDark()));
      btn.setAttribute("aria-label", isDark() ? "تغییر به حالت روشن" : "تغییر به حالت تیره");
    });
  }

  function toggle() {
    const next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch (e) { /* دسترسی به حافظه مرورگر بسته است */ }
    sync();
  }

  buttons.forEach((btn) => btn.addEventListener("click", toggle));
  sync();
})();
