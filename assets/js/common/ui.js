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

  // بدون بک‌اند (نسخه استاتیک) هر جا کاری به سرور نیاز دارد همین پیام نشان داده می‌شود.
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
  // data-act / data-id و بقیه → عملیات سرور (حذف، فعال/غیرفعال، لغو نوبت، خروجی، پرداخت).
  //
  // وقتی صفحه از بک‌اند می‌آید، سرور <meta name="aida-backend"> می‌گذارد؛ آن وقت دکمه با POST به همین صفحه
  // فرستاده می‌شود (_act و id و بقیه data-ها) و سرور JSON برمی‌گرداند: {ok, message, redirect, reload}.
  // بدون بک‌اند (مثلاً روی GitHub Pages) همان پیام «وصل نشده» نشان داده می‌شود.
  const SERVER_ACTIONS = "[data-act], [data-cancel], [data-export], [data-start]";
  const backend = Boolean(document.querySelector('meta[name="aida-backend"]'));

  function actionOf(btn) {
    const d = btn.dataset;
    if (d.cancel !== undefined) return { _act: "cancel", id: d.cancel };
    if (d.start !== undefined) return { _act: "pay", id: d.start || d.id || "" };
    const out = { _act: d.act };
    Object.keys(d).forEach((k) => { if (k !== "act" && k !== "confirm") out[k] = d[k]; });
    return out;
  }

  async function send(fields) {
    const body = new URLSearchParams(fields);
    const res = await fetch(location.pathname + location.search, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Requested-With": "fetch" },
      body: body,
      credentials: "same-origin",
    });
    let data = {};
    try { data = await res.json(); } catch (e) { data = { ok: false, message: "پاسخ سرور نامعتبر بود؛ دوباره امتحان کنید." }; }
    if (!res.ok && data.ok === undefined) data.ok = false;
    return data;
  }

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(SERVER_ACTIONS);
    if (!btn) return;
    if (btn.dataset.confirm && !(await confirmDialog(btn.dataset.confirm))) return;
    if (!backend) return notConnected();
    if (btn.dataset.export !== undefined) {
      const url = new URL(location.href);
      url.searchParams.set("export", btn.dataset.export || "csv");
      location.href = url.toString();
      return;
    }
    btn.disabled = true;
    try {
      const data = await send(actionOf(btn));
      if (data.redirect) { location.href = data.redirect; return; }
      if (data.ok && data.reload !== false) { location.reload(); return; }
      toast(data.message || (data.ok ? "انجام شد." : "انجام نشد؛ دوباره امتحان کنید."));
    } catch (err) {
      toast("ارتباط با سرور برقرار نشد؛ اینترنت را بررسی کنید.");
    } finally {
      btn.disabled = false;
    }
  });

  window.SalonUI = { toast, notConnected, confirmDialog, formError, backend, send };
})();
