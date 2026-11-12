// ابزارهای مشترک رابط کاربری: پیام شناور، پنجره تأیید و خطای فرم.
// بقیه فایل‌ها از window.SalonUI استفاده می‌کنند.
(function () {
  "use strict";

  // ---------- پیام شناور ----------
  let toastEl = null;
  let toastTimer = null;

  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("is-open");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-open"), 3200);
  }

  // این فرانت هیچ بک‌اندی ندارد؛ هر جا کاری به سرور نیاز دارد همین پیام نشان داده می‌شود.
  // هنگام نوشتن بک‌اند، فراخوانی‌های notConnected را با درخواست واقعی جایگزین کنید.
  const notConnected = () => toast("این بخش هنوز به سرور وصل نشده است.");

  // ---------- پنجره تأیید ----------
  // Promise برمی‌گرداند: true یعنی کاربر تأیید کرد.
  function confirmDialog(message, okLabel) {
    let dialog = document.getElementById("confirm-dialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "confirm-dialog";
      dialog.setAttribute("aria-labelledby", "confirm-title");
      dialog.innerHTML =
        '<form method="dialog" class="stack">' +
        '<h2 id="confirm-title" class="h3">مطمئن هستید؟</h2>' +
        "<p data-message></p>" +
        '<div class="cluster">' +
        '<button class="btn btn-primary" value="ok"></button>' +
        '<button class="btn btn-ghost" value="cancel">انصراف</button>' +
        "</div></form>";
      document.body.appendChild(dialog);
    }
    dialog.querySelector("[data-message]").textContent = message;
    dialog.querySelector("button[value=ok]").textContent = okLabel || "بله، انجام شود";

    return new Promise((resolve) => {
      dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"), { once: true });
      dialog.returnValue = "cancel";
      dialog.showModal();
      dialog.querySelector("button[value=cancel]").focus();
    });
  }

  // ---------- خطای بالای فرم ----------
  function formError(form, message) {
    let box = form.querySelector("[data-form-error]");
    if (!box) {
      box = document.createElement("div");
      box.setAttribute("data-form-error", "");
      box.className = "flash flash--err";
      box.setAttribute("role", "alert");
      form.prepend(box);
    }
    box.textContent = message;
    box.hidden = !message;
    if (message) box.scrollIntoView({ block: "nearest" });
  }

  // ---------- دکمه‌هایی که کارشان با سرور است ----------
  // data-confirm="متن" → اول از کاربر تأیید می‌گیرد.
  // data-act / data-id و بقیه → قلاب‌هایی برای بک‌اند (حذف، فعال/غیرفعال، لغو نوبت، خروجی اکسل، پرداخت، کد تخفیف).
  const SERVER_ACTIONS = "[data-act], [data-cancel], [data-export], [data-start], [data-apply-code]";

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(SERVER_ACTIONS);
    if (!btn) return;
    if (btn.dataset.confirm && !(await confirmDialog(btn.dataset.confirm))) return;
    notConnected();
  });

  window.SalonUI = { toast, notConnected, confirmDialog, formError };
})();
