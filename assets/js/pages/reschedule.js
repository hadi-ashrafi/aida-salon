// تغییر زمان نوبت (پنل مشتری و پنل مدیریت): آرایشگر → روز → ساعت.
(function () {
  "use strict";

  const form = document.querySelector("form[data-form]");
  if (!form || !form.querySelector("[data-days]")) return;

  const picked = form.querySelector("[data-picked]");
  const submit = form.querySelector("[data-submit]");

  const picker = SalonSlotPicker.mount(form, (pick) => {
    const ready = Boolean(pick.date && pick.time);
    picked.textContent = ready ? pick.dayLabel + "، ساعت " + pick.timeLabel : "انتخاب نشده";
    submit.disabled = !ready;
  });

  // با عوض شدن آرایشگر، روز و ساعت قبلی دیگر معتبر نیست.
  form.querySelectorAll("input[name=staffId]").forEach((input) => input.addEventListener("change", picker.reset));
})();
