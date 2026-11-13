// رفتارهای مشترک پنل‌ها (فقط رابط کاربری، بدون سرور):
//   تب‌ها:      <div class="tabs" role="tablist"><button role="tab" aria-controls="panel-id">…  + <section role="tabpanel" id="panel-id">
//               تب فعال در آدرس (#panel-id) می‌ماند تا با رفرش یا لینک مستقیم همان تب باز شود.
//   دیالوگ:     <button data-open="dialog-id"> باز می‌کند، [data-close] داخل دیالوگ می‌بندد؛
//               data-title عنوان را عوض می‌کند، data-fill فیلدها را پر می‌کند و data-icon آیکن دسته را علامت می‌زند.
//   جستجوی جدول: <input data-table-search="table-id"> ردیف‌های همان جدول را فیلتر می‌کند؛ select و فیلد تاریخِ
//               همان .toolbar هم (با متن گزینه و «روز ماه») فیلتر می‌کنند. رقم فارسی و لاتین یکی حساب می‌شوند.
//   فیلتر وضعیت: <div class="chips-filter" data-filter-for="table-id"><button data-value="Pending"> و هر <tr data-status="Pending">
// بک‌اند: جستجو و فیلتر الان روی همین ردیف‌های نمونه است؛ با داده واقعی بهتر است سمت سرور (query string) انجام شود.
(function () {
  "use strict";

  // ---------- تب‌ها ----------
  document.querySelectorAll('[role="tablist"]').forEach((list) => {
    const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
    const select = (tab, push) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (push) history.replaceState(null, "", "#" + tab.getAttribute("aria-controls"));
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab, true));
      tab.addEventListener("keydown", (e) => {
        const step = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0; // راست‌به‌چپ
        if (!step) return;
        const next = tabs[(i + step + tabs.length) % tabs.length];
        next.focus();
        select(next, true);
      });
    });
    const fromHash = tabs.find((t) => "#" + t.getAttribute("aria-controls") === location.hash);
    select(fromHash || tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0], false);
  });

  // ---------- دیالوگ‌ها ----------
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open]");
    if (opener) {
      const dialog = document.getElementById(opener.dataset.open);
      if (dialog && dialog.showModal) {
        if (opener.dataset.title) dialog.querySelector("h2").textContent = opener.dataset.title;
        // data-fill='{"name":"value"}': فرم دیالوگ خالی و با مقدارهای همین ردیف پر می‌شود (برای «ویرایش»).
        if ("fill" in opener.dataset) {
          const form = dialog.querySelector("form");
          if (form) form.reset();
          let values = {};
          try { values = JSON.parse(opener.dataset.fill || "{}"); } catch (err) { values = {}; }
          Object.keys(values).forEach((name) => {
            const field = dialog.querySelector('[name="' + name + '"]');
            if (field) field.value = values[name];
          });
        }
        // data-icon: آیکن فعلی در انتخابگر آیکن علامت بخورد ("" یعنی دسته تازه، هیچ‌کدام).
        if ("icon" in opener.dataset) {
          dialog.querySelectorAll('input[name="catIcon"]').forEach((r) => { r.checked = r.value === opener.dataset.icon; });
        }
        dialog.showModal();
      }
      return;
    }
    const closer = e.target.closest("dialog [data-close]");
    if (closer) closer.closest("dialog").close();
  });
  // کلیک روی پس‌زمینه دیالوگ آن را می‌بندد
  document.querySelectorAll("dialog.dialog-form").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

  // ---------- جستجو و فیلتر جدول ----------
  const filters = new Map(); // table → { q, status, terms }

  // رقم فارسی/عربی → لاتین، ی و ک عربی → فارسی، نیم‌فاصله → فاصله؛
  // تا «0912» و «۰۹۱۲» یا «#38» و «#۳۸» هر دو پیدا شوند.
  const norm = (s) => (s || "")
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\u200c\s]+/g, " ").trim().toLowerCase();

  const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  // تاریخ «1405/08/21» → «21 آبان» (همان شکلی که در جدول نوشته شده)
  function dateTerm(value) {
    const m = norm(value).match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
    if (!m || +m[2] < 1 || +m[2] > 12) return value ? norm(value) : "";
    return String(+m[3]) + " " + MONTHS[+m[2] - 1];
  }

  function apply(table) {
    const f = filters.get(table) || {};
    const q = norm(f.q);
    const terms = (f.terms || []).filter(Boolean);
    let shown = 0;
    // جدول: ردیف‌ها؛ هر ظرف دیگر: فرزندهای دارای data-status (مثل کارت نظرها)
    const items = table.tagName === "TABLE" ? table.querySelectorAll("tbody tr") : table.querySelectorAll(":scope > [data-status]");
    items.forEach((tr) => {
      if (tr.classList.contains("table-empty-row")) return;
      const text = norm(tr.textContent);
      const okQ = !q || text.includes(q);
      const okS = !f.status || tr.dataset.status === f.status;
      const okT = terms.every((t) => text.includes(t));
      tr.hidden = !(okQ && okS && okT);
      if (!tr.hidden) shown++;
    });
    const empty = table.querySelector(".table-empty-row");
    if (empty) empty.hidden = shown > 0;
    const counter = document.querySelector('[data-count-for="' + table.id + '"]');
    if (counter) counter.textContent = shown.toLocaleString("fa-IR");
  }

  document.querySelectorAll("[data-table-search]").forEach((input) => {
    const table = document.getElementById(input.dataset.tableSearch);
    if (!table) return;
    const update = (patch) => { filters.set(table, Object.assign(filters.get(table) || {}, patch)); apply(table); };
    input.addEventListener("input", () => update({ q: input.value }));

    // بقیه فیلدهای همان نوار ابزار (مثل «آرایشگر» و «تاریخ») هم جدول را فیلتر می‌کنند:
    // select با متن گزینه انتخاب‌شده، فیلد تاریخ با «روز ماه».
    const bar = input.closest(".toolbar");
    if (!bar) return;
    const fields = Array.from(bar.querySelectorAll("select, input:not([data-table-search])"));
    const readTerms = () => fields.map((el) => {
      if (el.tagName === "SELECT") return el.value ? norm(el.options[el.selectedIndex].text) : "";
      return el.name === "date" ? dateTerm(el.value.trim()) : norm(el.value);
    });
    fields.forEach((el) => el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => update({ terms: readTerms() })));
    // فرم نوار ابزار با Enter به سرور نرود؛ فیلتر همین‌جا اعمال شده است.
    if (bar.tagName === "FORM") bar.addEventListener("submit", (e) => { e.preventDefault(); update({ terms: readTerms() }); });
  });

  document.querySelectorAll("[data-filter-for]").forEach((box) => {
    const table = document.getElementById(box.dataset.filterFor);
    if (!table) return;
    box.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", () => {
      box.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      filters.set(table, Object.assign(filters.get(table) || {}, { status: btn.dataset.value || "" }));
      apply(table);
    }));
  });
})();
