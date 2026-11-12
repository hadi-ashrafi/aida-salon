// پیش از اولین رنگ‌آمیزی صفحه اجرا می‌شود (در <head> و بدون defer) تا تم ذخیره‌شده بدون پرش اعمال شود.
(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem("aida-theme"); } catch (e) { /* دسترسی به حافظه مرورگر بسته است */ }
  var prefersDark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));
  root.classList.add("js"); // انیمیشن‌های ورود فقط وقتی جاوااسکریپت روشن است فعال می‌شوند
})();
