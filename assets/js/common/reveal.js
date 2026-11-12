// ورود نرم عناصر هنگام اسکرول.
//   class="reveal"       → وقتی وارد دید شد کلاس is-visible می‌گیرد.
//   data-stagger         → فرزندها با فاصله زمانی کوتاه پشت سر هم ظاهر می‌شوند (متغیر --i).
// استایل‌ها در assets/css/base/motion.css است.
(function () {
  "use strict";

  document.querySelectorAll("[data-stagger]").forEach((group) => {
    Array.from(group.children).forEach((child, i) => child.style.setProperty("--i", i));
  });

  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -10% 0px" });

  items.forEach((el) => observer.observe(el));
})();
