// رفتار مشترک فرم‌ها.
//   فرم‌های method="get" (جستجو و فیلتر) → مرورگر خودش با query string می‌فرستد؛ اینجا کاری نداریم.
//   فرم‌های method="post"               → اول اعتبارسنجی سمت کاربر، بعد ارسال به action.
// بک‌اند: کافی است action هر فرم را پر کنید؛ تا وقتی خالی است فرم ارسال نمی‌شود و پیام «وصل نشده» می‌آید.
(function () {
  "use strict";

  document.addEventListener("submit", (e) => {
    const form = e.target;
    if (form.method !== "post") return;

    const invalid = form.querySelector(":invalid");
    if (invalid) {
      e.preventDefault();
      SalonUI.formError(form, "لطفاً بخش‌های لازم را کامل و درست پر کنید.");
      invalid.focus();
      return;
    }
    SalonUI.formError(form, "");

    if (!form.getAttribute("action")) {
      e.preventDefault();
      SalonUI.notConnected();
    }
  });
})();

// برای مرورگرهای قدیمی که :has() ندارند: برچسبِ گزینه انتخاب‌شده کلاس is-checked می‌گیرد
// و بدنه صفحه‌هایی که منوی پایین دارند کلاس has-tabbar.
(function () {
  "use strict";
  var LABELS = ".option, .tag-pick, .icon-picker__item";
  function sync() {
    Array.prototype.forEach.call(document.querySelectorAll(LABELS), function (label) {
      var input = label.querySelector("input");
      if (input) {
        label.classList.toggle("is-checked", input.checked);
        label.classList.toggle("is-disabled", input.disabled);
      }
    });
  }
  document.addEventListener("change", function (e) { if (e.target.closest && e.target.closest(LABELS)) sync(); });
  sync();
  if (document.querySelector(".tabbar")) document.body.classList.add("has-tabbar");
})();
