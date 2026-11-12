// انتخاب روز و ساعت؛ مشترک بین رزرو نوبت و تغییر زمان نوبت.
// نشانه‌گذاری لازم داخل فرم:
//   [data-days]  .day  (data-date="2026-11-14")     دکمه‌های روز
//   [data-slots] .slot (data-time="10:30")          دکمه‌های ساعت
//   #step-time و [data-slots-state]                 مرحله ساعت و پیام راهنمای آن
//   [data-picked-date] و [data-picked-time]         فیلدهای مخفی که با فرم ارسال می‌شوند
//
// بک‌اند: روزها و ساعت‌ها الان نمونه ثابت‌اند. با انتخاب روز (تابع pickDay) باید ساعت‌های آزاد همان روز
// از سرور گرفته و جای دکمه‌های .slot گذاشته شود.
(function () {
  "use strict";

  function mount(root, onChange) {
    const days = Array.from(root.querySelectorAll("[data-days] .day"));
    const slots = Array.from(root.querySelectorAll("[data-slots] .slot"));
    const stepTime = root.querySelector("#step-time");
    const slotsState = root.querySelector("[data-slots-state]");
    const dateInput = root.querySelector("[data-picked-date]");
    const timeInput = root.querySelector("[data-picked-time]");
    const pick = { date: "", time: "", dayLabel: "", timeLabel: "" };

    const press = (buttons, active) => buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === active)));

    function emit() {
      dateInput.value = pick.date;
      timeInput.value = pick.time;
      stepTime.setAttribute("aria-disabled", String(!pick.date));
      slotsState.hidden = Boolean(pick.date);
      onChange(Object.assign({}, pick));
    }

    function pickDay(btn) {
      press(days, btn);
      press(slots, null);
      const name = btn.querySelector(".day__name").textContent;
      const month = btn.querySelector(".day__month");
      const num = btn.querySelector(".day__num").textContent + (month ? " " + month.textContent : "");
      Object.assign(pick, { date: btn.dataset.date, dayLabel: name + " " + num, time: "", timeLabel: "" });
      emit();
    }

    function pickSlot(btn) {
      press(slots, btn);
      Object.assign(pick, { time: btn.dataset.time, timeLabel: btn.textContent.trim() });
      emit();
    }

    function reset() {
      press(days, null);
      press(slots, null);
      Object.assign(pick, { date: "", time: "", dayLabel: "", timeLabel: "" });
      emit();
    }

    days.forEach((btn) => btn.addEventListener("click", () => pickDay(btn)));
    slots.forEach((btn) => btn.addEventListener("click", () => pickSlot(btn)));
    emit();

    return { reset };
  }

  window.SalonSlotPicker = { mount };
})();
