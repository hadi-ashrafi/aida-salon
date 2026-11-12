// اسلایدر نظرات صفحه اصلی: هر بار یک نظر نمایش داده می‌شود و خودکار نظر بعدی می‌آید.
//   [data-review-slider]      ظرف اصلی؛ data-interval فاصله عوض شدن به میلی‌ثانیه
//   .review-slide             هر نظر (بک‌اند به تعداد نظرات تکرارش می‌کند)
//   [data-review-prev/next]   دکمه‌های قبلی و بعدی، [data-review-dots] نشانگرها
// روی اسلایدر که موس یا فوکوس باشد، چرخش متوقف می‌شود.
(function () {
  "use strict";

  const slider = document.querySelector("[data-review-slider]");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll(".review-slide"));
  const dotsBox = slider.querySelector("[data-review-dots]");
  const interval = Number(slider.dataset.interval) || 5500;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  let timer = null;

  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "review-slider__dot";
    dot.setAttribute("aria-label", "نظر " + (i + 1).toLocaleString("fa-IR"));
    dot.addEventListener("click", () => go(i));
    dotsBox.append(dot);
    return dot;
  });

  function go(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle("is-active", active);
      if (active) slide.removeAttribute("aria-hidden");
      else slide.setAttribute("aria-hidden", "true");
    });
    dots.forEach((dot, i) => dot.setAttribute("aria-current", String(i === index)));
    restart();
  }

  function restart() {
    clearTimeout(timer);
    if (reduced || slider.matches(":hover, :focus-within") || document.hidden) return;
    timer = setTimeout(() => go(index + 1), interval);
  }

  slider.querySelector("[data-review-prev]").addEventListener("click", () => go(index - 1));
  slider.querySelector("[data-review-next]").addEventListener("click", () => go(index + 1));
  slider.addEventListener("mouseenter", () => clearTimeout(timer));
  slider.addEventListener("mouseleave", restart);
  slider.addEventListener("focusin", () => clearTimeout(timer));
  slider.addEventListener("focusout", restart);
  document.addEventListener("visibilitychange", restart);

  // کشیدن انگشت در موبایل
  let startX = null;
  slider.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(index + (dx > 0 ? 1 : -1)); // راست‌به‌چپ: کشیدن به راست یعنی بعدی
    startX = null;
  });

  go(0);
})();
