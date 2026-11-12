// هیروی صفحه اصلی: شعارهای داخل <h1 data-slogans> یکی‌یکی با حرکتِ کلمه‌به‌کلمه عوض می‌شوند.
//
// برای تغییر شعارها فقط HTML را عوض کنید: هر <span class="hero__slogan"> یک شعار است
// و بخشی که داخل <em> باشد رنگی می‌شود. فاصله زمانی با data-interval (میلی‌ثانیه) تنظیم می‌شود.
// حرکت‌ها در assets/css/pages/home.css تعریف شده‌اند.
(function () {
  "use strict";

  const title = document.querySelector("[data-slogans]");
  if (!title) return;

  const slogans = Array.from(title.querySelectorAll(".hero__slogan"));
  const dotsBox = document.querySelector("[data-slogan-dots]");
  const interval = Number(title.dataset.interval) || 3800;
  const LEAVE_MS = 450; // هم‌اندازه با زمان خروج کلمه‌ها در CSS؛ شعار تازه بعد از آن وارد می‌شود

  let index = 0;
  let timer = null;
  let dots = [];

  // ---------- هر شعار به کلمه‌های جدا تبدیل می‌شود تا تک‌تک حرکت کنند ----------
  function splitWords(slogan) {
    let order = 0;

    function wordsOf(text) {
      const fragment = document.createDocumentFragment();
      text.trim().split(/\s+/).forEach((word, i) => {
        if (!word) return;
        if (i) fragment.append(" ");
        const span = document.createElement("span");
        span.className = "hero__word";
        span.style.setProperty("--w", order++);
        span.textContent = word;
        fragment.append(span);
      });
      return fragment;
    }

    Array.from(slogan.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent.trim()) node.replaceWith(" ", wordsOf(node.textContent), " ");
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        node.replaceChildren(wordsOf(node.textContent));
      }
    });
  }

  // ---------- نشانگرها ----------
  function buildDots() {
    if (!dotsBox) return;
    dotsBox.style.setProperty("--slogan-ms", interval + "ms");
    dots = slogans.map((slogan, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "hero__dot";
      dot.setAttribute("aria-label", "شعار " + (i + 1).toLocaleString("fa-IR") + ": " + slogan.textContent.replace(/\s+/g, " ").trim());
      dot.addEventListener("click", () => { show(i); play(); });
      dotsBox.append(dot);
      return dot;
    });
    // تا وقتی موس یا فوکوس روی نشانگرهاست، شعار عوض نمی‌شود.
    dotsBox.addEventListener("mouseenter", pause);
    dotsBox.addEventListener("mouseleave", play);
    dotsBox.addEventListener("focusin", pause);
    dotsBox.addEventListener("focusout", play);
  }

  function syncDots() {
    dots.forEach((dot, i) => {
      dot.classList.remove("is-active");
      dot.setAttribute("aria-pressed", String(i === index));
    });
    if (!dots.length) return;
    void dots[index].offsetWidth; // انیمیشن پر شدن نوار از اول شروع شود
    dots[index].classList.add("is-active");
  }

  // ---------- نمایش یک شعار ----------
  // هر شعار تایمر خروج خودش را دارد تا اگر زود دوباره انتخاب شد، تایمر قدیمی وسط نمایشش آن را پنهان نکند.
  const leaveTimers = new Map();

  function show(next) {
    if (next !== index) {
      const previous = slogans[index];
      previous.classList.remove("is-active");
      previous.classList.add("is-leaving");
      clearTimeout(leaveTimers.get(previous));
      leaveTimers.set(previous, setTimeout(() => previous.classList.remove("is-leaving"), LEAVE_MS));
    }
    index = next;
    const current = slogans[index];
    clearTimeout(leaveTimers.get(current));
    current.classList.remove("is-leaving");
    current.classList.add("is-active");
    slogans.forEach((slogan, i) => {
      if (i === index) slogan.removeAttribute("aria-hidden");
      else slogan.setAttribute("aria-hidden", "true");
    });
    syncDots();
  }

  // ---------- چرخش خودکار ----------
  function play() {
    clearTimeout(timer);
    if (document.hidden || (dotsBox && dotsBox.matches(":hover, :focus-within"))) return;
    if (dotsBox) dotsBox.classList.remove("is-paused");
    syncDots();
    timer = setTimeout(() => { show((index + 1) % slogans.length); play(); }, interval);
  }

  function pause() {
    clearTimeout(timer);
    if (dotsBox) dotsBox.classList.add("is-paused");
  }

  // ---------- شروع ----------
  slogans.forEach(splitWords);
  title.classList.add("is-split"); // از این به بعد رنگ گرادیان فقط روی کلمه‌هاست (home.css)
  buildDots();

  // شعار اول هم با حرکت وارد شود: یک لحظه بدون is-active می‌ماند.
  slogans[0].classList.remove("is-active");
  setTimeout(() => { show(0); play(); }, 60);

  document.addEventListener("visibilitychange", () => (document.hidden ? pause() : play()));
})();
