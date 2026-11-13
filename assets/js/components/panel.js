// رفتارهای مشترک پنل‌ها (فقط رابط کاربری، بدون سرور):
//   تب‌ها:      <div class="tabs" role="tablist"><button role="tab" aria-controls="panel-id">…  + <section role="tabpanel" id="panel-id">
//               تب فعال در آدرس (#panel-id) می‌ماند تا با رفرش یا لینک مستقیم همان تب باز شود.
//   دیالوگ:     <button data-open="dialog-id"> باز می‌کند، [data-close] داخل دیالوگ می‌بندد؛
//               data-title عنوان را عوض می‌کند، data-fill فیلدها را پر می‌کند و data-icon آیکن دسته را علامت می‌زند.
//   جستجوی جدول: <input data-table-search="table-id"> ردیف‌های همان جدول را فیلتر می‌کند.
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
  const filters = new Map(); // table → { q, status }

  function apply(table) {
    const f = filters.get(table) || {};
    let shown = 0;
    // جدول: ردیف‌ها؛ هر ظرف دیگر: فرزندهای دارای data-status (مثل کارت نظرها)
    const items = table.tagName === "TABLE" ? table.querySelectorAll("tbody tr") : table.querySelectorAll(":scope > [data-status]");
    items.forEach((tr) => {
      if (tr.classList.contains("table-empty-row")) return;
      const okQ = !f.q || tr.textContent.includes(f.q);
      const okS = !f.status || tr.dataset.status === f.status;
      tr.hidden = !(okQ && okS);
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
    input.addEventListener("input", () => {
      filters.set(table, Object.assign(filters.get(table) || {}, { q: input.value.trim() }));
      apply(table);
    });
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
