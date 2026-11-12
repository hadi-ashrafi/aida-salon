// صفحه رزرو نوبت: چهار قدم (خدمت ← آرایشگر ← زمان ← تأیید) با خلاصه زنده.
// فقط رابط کاربری است: جمع مبلغ از data-price و data-duration گزینه‌ها و ضریب قیمت آرایشگر (data-factor) حساب می‌شود.
// بک‌اند: مبلغ نهایی، تخفیف و آزاد بودن ساعت را حتماً سمت سرور دوباره حساب و بررسی کنید.
(function () {
  "use strict";

  var form = document.querySelector("[data-booking]");
  if (!form) return;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var panels = $$("[data-panel]", form);
  var steps = $$("[data-stepper] li");
  var prevBtn = $("[data-prev]", form);
  var nextBtn = $("[data-next]", form);
  var nextLabel = $("[data-next-label]", form);
  var summary = $("[data-summary]", form);
  var backdrop = $(".summary-backdrop", form);
  var depositPercent = Number(form.getAttribute("data-deposit-percent")) || 0;
  var NEXT_LABELS = ["انتخاب آرایشگر", "انتخاب زمان", "مرور نوبت", "ثبت و پرداخت بیعانه"];
  var current = 0;
  var pick = { date: "", time: "", dayLabel: "", timeLabel: "" };

  // ---------- قالب‌بندی فارسی ----------
  function number(n) { return n.toLocaleString("fa-IR"); }
  function price(n) { return number(n) + " تومان"; }
  function duration(m) {
    var h = Math.floor(m / 60), r = m % 60;
    if (!h) return number(r) + " دقیقه";
    return number(h) + " ساعت" + (r ? " و " + number(r) + " دقیقه" : "");
  }

  // ---------- وضعیت انتخاب‌ها ----------
  function chosen() { return $$("input[name=serviceIds]:checked", form); }
  function staffInput() { return $("input[name=staffId]:checked", form); }
  function factor() {
    var s = staffInput();
    var opt = s && s.closest("[data-factor]");
    return opt ? Number(opt.getAttribute("data-factor")) : 1;
  }
  function totals() {
    var list = chosen();
    var base = list.reduce(function (s, i) { return s + Number(i.getAttribute("data-price")); }, 0);
    var total = Math.round((base * factor()) / 10000) * 10000;
    return {
      list: list,
      total: total,
      minutes: list.reduce(function (s, i) { return s + Number(i.getAttribute("data-duration")); }, 0),
      deposit: Math.ceil((total * depositPercent) / 100 / 1000) * 1000
    };
  }

  // کلاس is-checked برای مرورگرهای قدیمی که :has() ندارند
  function syncChecked() {
    $$(".option input", form).forEach(function (i) { i.closest(".option").classList.toggle("is-checked", i.checked); });
  }

  // ---------- قدم ۱: خدمت‌ها ----------
  function renderPicked(list) {
    var box = $("[data-picked-chips]", form);
    box.innerHTML = "";
    list.forEach(function (input) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "picked-chip";
      chip.textContent = input.getAttribute("data-name");
      chip.setAttribute("aria-label", "حذف " + input.getAttribute("data-name"));
      chip.addEventListener("click", function () { input.checked = false; changed(); });
      box.appendChild(chip);
    });
    $$(".svc-pick", form).forEach(function (g) {
      var n = $$("input:checked", g).length;
      var badge = $("[data-cat-count]", g);
      badge.hidden = !n;
      badge.textContent = number(n);
    });
  }

  var search = $("[data-svc-search]", form);
  search.addEventListener("input", function () {
    var q = search.value.trim();
    var any = false;
    $$(".svc-pick", form).forEach(function (g) {
      var hits = 0;
      $$(".svc-option", g).forEach(function (o) {
        var ok = !q || o.getAttribute("data-search").indexOf(q) !== -1;
        o.hidden = !ok;
        if (ok) hits++;
      });
      g.hidden = !hits;
      if (q && hits) g.open = true;
      if (hits) any = true;
    });
    $("[data-search-empty]", form).hidden = any;
  });

  $$("[data-jump]", form).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var g = $("#pick-" + btn.getAttribute("data-jump"), form);
      search.value = "";
      search.dispatchEvent(new Event("input"));
      g.open = true;
      g.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // ---------- قدم ۲: فقط آرایشگرهایی که همه خدمات را انجام می‌دهند ----------
  function refreshStaff(list) {
    var ids = list.map(function (i) { return i.value; });
    var eligible = 0;
    $$("[data-staff-option]", form).forEach(function (opt) {
      var offers = opt.getAttribute("data-services").split(",");
      var ok = ids.every(function (id) { return offers.indexOf(id) !== -1; });
      var input = $("input", opt);
      input.disabled = !ok;
      opt.classList.toggle("is-disabled", !ok);
      $("[data-staff-note]", opt).textContent = ok ? "" : "این خدمت را ندارد";
      if (!ok && input.checked) $("input[name=staffId][value='']", form).checked = true;
      if (ok) eligible++;
    });
    $("[data-no-staff]", form).hidden = eligible > 0 || !ids.length;
  }

  // ---------- خلاصه ----------
  function setSum(key, text) { $$('[data-sum="' + key + '"]', form).forEach(function (el) { el.textContent = text; }); }

  function update() {
    var t = totals();
    var any = t.list.length > 0;
    syncChecked();
    renderPicked(t.list);
    setSum("services", any ? t.list.map(function (i) { return i.getAttribute("data-name"); }).join("، ") : "انتخاب نشده");
    setSum("staff", staffInput() ? staffInput().getAttribute("data-name") : "فرقی نمی‌کند");
    setSum("time", pick.date ? pick.dayLabel + "، ساعت " + (pick.timeLabel || "انتخاب نشده") : "انتخاب نشده");
    setSum("duration", any ? duration(t.minutes) : "-");
    setSum("final", any ? price(t.total) : "-");
    setSum("deposit", any ? (t.deposit ? price(t.deposit) : "ندارد") : "-");

    $("[data-bar-time]", form).textContent = !any ? "هنوز خدمتی انتخاب نشده"
      : pick.time ? pick.dayLabel + "، " + pick.timeLabel
      : number(t.list.length) + " خدمت، " + duration(t.minutes);
    $("[data-bar-final]", form).textContent = any ? price(t.total) : "";
    validate();
  }

  // ---------- مراحل ----------
  var canLeave = [
    function () { return chosen().length > 0; },
    function () { return true; },
    function () { return Boolean(pick.date && pick.time); },
    function () { return true; }
  ];
  var hints = ["دست‌کم یک خدمت انتخاب کنید", "", "روز و ساعت را انتخاب کنید", ""];

  function validate() {
    var ok = canLeave[current]();
    nextBtn.disabled = !ok;
    nextBtn.title = ok ? "" : hints[current];
  }

  function show(step, focus) {
    current = Math.max(0, Math.min(step, panels.length - 1));
    panels.forEach(function (p, i) { p.hidden = i !== current; });
    steps.forEach(function (li, i) {
      li.classList.toggle("is-done", i < current);
      if (i === current) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
    prevBtn.hidden = current === 0;
    nextLabel.textContent = NEXT_LABELS[current];
    nextBtn.classList.toggle("is-final", current === panels.length - 1);
    validate();
    if (focus) {
      var top = $(".booking-head").getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo(0, Math.max(0, top));
      var h = $("h2", panels[current]);
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }
  }

  // فقط به مرحله‌هایی می‌شود پرید که قدم‌های قبلشان کامل است
  function reachable(step) { for (var i = 0; i < step; i++) if (!canLeave[i]()) return false; return true; }

  nextBtn.addEventListener("click", function () {
    if (!canLeave[current]()) return;
    if (current === panels.length - 1) {
      if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    } else show(current + 1, true);
  });
  prevBtn.addEventListener("click", function () { show(current - 1, true); });
  $$("[data-goto]", form).forEach(function (b) { b.addEventListener("click", function () { show(Number(b.getAttribute("data-goto")), true); }); });
  steps.forEach(function (li) {
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    function go() { var s = Number(li.getAttribute("data-step")); if (reachable(s)) show(s, true); }
    li.addEventListener("click", go);
    li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });

  // ---------- خلاصه بازشونده در موبایل ----------
  function toggleSummary(open) {
    var isOpen = open === undefined ? !summary.classList.contains("is-open") : open;
    summary.classList.toggle("is-open", isOpen);
    backdrop.hidden = !isOpen;
    $$("[aria-controls=booking-summary]", form).forEach(function (b) { b.setAttribute("aria-expanded", String(isOpen)); });
  }
  $$("[data-summary-toggle]", form).forEach(function (b) { b.addEventListener("click", function () { toggleSummary(); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") toggleSummary(false); });

  // ---------- رویدادها ----------
  var picker = window.SalonSlotPicker.mount(form, function (p) { pick = p; update(); });
  function changed() { refreshStaff(chosen()); picker.reset(); update(); }

  $$("input[name=serviceIds]", form).forEach(function (i) { i.addEventListener("change", changed); });
  $$("input[name=staffId]", form).forEach(function (i) { i.addEventListener("change", function () { picker.reset(); update(); }); });

  // پیش‌انتخاب از آدرس: booking.html?service=2,5&staff=1
  var params = new URLSearchParams(location.search);
  (params.get("service") || "").split(",").filter(Boolean).forEach(function (id) {
    var input = $('input[name=serviceIds][value="' + id + '"]', form);
    if (input) { input.checked = true; var g = input.closest("details"); if (g) g.open = true; }
  });
  refreshStaff(chosen());
  var st = params.get("staff") && $('input[name=staffId][value="' + params.get("staff") + '"]', form);
  if (st && !st.disabled) st.checked = true;

  update();
  show(chosen().length ? 1 : 0, false);
  document.body.classList.add("has-booking-bar");
})();
