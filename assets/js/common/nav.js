// منوی اصلی در موبایل و تبلت: کشویی از سمت چپ.
//   <button data-nav-toggle> باز و بسته می‌کند؛ <button data-nav-close>، Esc و لمس هر جای صفحه بیرون از کشو آن را می‌بندد.
(function () {
  "use strict";

  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  // پس‌زمینه تیره پشت کشو
  const backdrop = document.createElement("div");
  backdrop.className = "nav-backdrop";
  document.body.appendChild(backdrop);

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) (nav.querySelector("[aria-current]") || nav.querySelector("a")).focus({ preventScroll: true });
    else toggle.focus({ preventScroll: true });
  }

  const isOpen = () => nav.classList.contains("is-open");

  toggle.addEventListener("click", () => setOpen(!isOpen()));
  // لمس هر جایی بیرون از کشو (پس‌زمینه، سربرگ، منوی پایین) منو را می‌بندد.
  // در مرحله capture گرفته می‌شود تا همان لمس، لینک یا دکمه زیرش را اجرا نکند.
  function closeOnOutside(e) {
    if (!isOpen() || nav.contains(e.target) || toggle.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  }
  document.addEventListener("click", closeOnOutside, true);
  nav.querySelectorAll("[data-nav-close]").forEach((btn) => btn.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) setOpen(false); });

  // اگر صفحه بزرگ شد و منو دیگر کشویی نیست، حالت باز را پاک کن.
  matchMedia("(min-width: 1181px)").addEventListener("change", (e) => { if (e.matches && isOpen()) setOpen(false); });
})();
