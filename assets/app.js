(function () {
  "use strict";

  const opportunities = Array.isArray(window.OPPORTUNITIES) ? window.OPPORTUNITIES : [];
  const typeLabels = window.TYPE_LABELS || {};
  const statusLabels = window.STATUS_LABELS || {};
  const deadlineMap = window.OPPORTUNITY_DEADLINES || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const savedKey = "apply-compass-saved-v1";
  const themeKey = "apply-compass-theme";
  let saved = new Set(JSON.parse(localStorage.getItem(savedKey) || "[]"));
  let savedOnly = false;

  function trackerState(id) {
    try {
      const raw = JSON.parse(localStorage.getItem("apply-compass-workspace-v2") || "{}");
      const record = raw.tracker?.[id] || raw.items?.[id] || raw.records?.[id] || raw[id];
      const stage = record?.stage || record?.status || "";
      return stage === "saved" ? "" : stage;
    } catch {
      return "";
    }
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  }

  function normalize(value) {
    return String(value || "").toLocaleLowerCase("fa").replace(/ي/g, "ی").replace(/ك/g, "ک");
  }

  function initials(org) {
    const words = String(org || "OP").split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  }

  function personLabel(person) {
    return person === "arzoo" ? "آرزو" : "محمد";
  }

  function trackerLabel(stage) {
    return ({preparing:"آماده‌سازی",applied:"ارسال‌شده",interview:"مصاحبه",offer:"آفر",rejected:"ردشده",archived:"بایگانی"})[stage] || "در ترکر";
  }

  function deadlineDate(item) {
    const raw = deadlineMap[item.id];
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.valueOf()) ? null : date;
  }

  function daysUntil(item) {
    const date = deadlineDate(item);
    if (!date) return null;
    return Math.ceil((date.valueOf() - Date.now()) / 86400000);
  }

  function feasibility(item) {
    if (item.status === "upcoming") return "upcoming";
    const text = normalize([item.languageVisa, item.summary, ...(item.gaps || []), ...(item.requirements || [])].join(" "));
    const hardSignals = ["existing eu work permit", "مجوز کار", "مقیم فعلی", "واجد شرایط نیست", "ineligible", "post-relocation", "پس از مهاجرت", "اقامت ایران مشمول نیست", "ایران به احتمال زیاد"];
    return hardSignals.some((signal) => text.includes(normalize(signal))) || item.fit < 50 ? "conditional" : "now";
  }

  function populateFilters() {
    const types = [...new Set(opportunities.map((item) => item.type))].sort();
    const select = $("#type-filter");
    if (!select) return;
    types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = typeLabels[type] || type;
      select.appendChild(option);
    });
    const countries = [...new Set(opportunities.map((item) => item.country).filter(Boolean))].sort((a,b) => a.localeCompare(b,"fa"));
    const countrySelect = $("#country-filter");
    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country;
      countrySelect?.appendChild(option);
    });
  }

  function getFilters() {
    return {
      query: normalize($("#search-input")?.value),
      person: $("#person-filter")?.value || "all",
      type: $("#type-filter")?.value || "all",
      status: $("#status-filter")?.value || "all",
      minFit: Number($("#fit-filter")?.value || 0),
      funding: $("#funding-filter")?.value || "all",
      country: $("#country-filter")?.value || "all",
      deadline: $("#deadline-filter")?.value || "all",
      feasibility: $("#feasibility-filter")?.value || "all",
      sort: $("#sort-filter")?.value || "fit"
    };
  }

  function filteredOpportunities() {
    const filters = getFilters();
    const filtered = opportunities.filter((item) => {
      const haystack = normalize([item.title, item.organization, item.country, item.location, item.summary, ...(item.skills || [])].join(" "));
      const remaining = daysUntil(item);
      const deadlineMatch = filters.deadline === "all" ||
        (filters.deadline === "rolling" && item.status === "rolling") ||
        (filters.deadline === "upcoming" && item.status === "upcoming") ||
        (/^\d+$/.test(filters.deadline) && remaining !== null && remaining >= 0 && remaining <= Number(filters.deadline));
      return (!filters.query || haystack.includes(filters.query)) &&
        (filters.person === "all" || item.person === filters.person) &&
        (filters.type === "all" || item.type === filters.type) &&
        (filters.status === "all" || item.status === filters.status) &&
        Number(item.fit || 0) >= filters.minFit &&
        (filters.funding === "all" || item.funding === filters.funding) &&
        (filters.country === "all" || item.country === filters.country) &&
        deadlineMatch &&
        (filters.feasibility === "all" || feasibility(item) === filters.feasibility) &&
        (!savedOnly || saved.has(item.id));
    });
    if (filters.sort === "deadline") return filtered.sort((a,b) => (deadlineDate(a)?.valueOf() ?? Infinity) - (deadlineDate(b)?.valueOf() ?? Infinity) || b.fit-a.fit);
    if (filters.sort === "fit-asc") return filtered.sort((a,b) => a.fit-b.fit);
    return filtered.sort((a, b) => (b.fit - a.fit) || ((deadlineDate(a)?.valueOf() ?? Infinity) - (deadlineDate(b)?.valueOf() ?? Infinity)));
  }

  function renderStats() {
    const live = opportunities.filter((item) => ["open", "rolling", "upcoming"].includes(item.status));
    if ($("#active-count")) $("#active-count").textContent = new Intl.NumberFormat("fa-IR").format(live.length);
    if ($("#high-fit-count")) $("#high-fit-count").textContent = new Intl.NumberFormat("fa-IR").format(live.filter((item) => item.fit >= 80).length);
    if ($("#funded-count")) $("#funded-count").textContent = new Intl.NumberFormat("fa-IR").format(live.filter((item) => ["funded", "salary"].includes(item.funding)).length);
  }

  function countWorkspaceItems() {
    try {
      const raw = JSON.parse(localStorage.getItem("apply-compass-workspace-v2") || "{}");
      if (raw.tracker && typeof raw.tracker === "object") return Object.values(raw.tracker).filter((record) => ["preparing","applied","interview","offer"].includes(record?.stage)).length;
      if (raw.items && typeof raw.items === "object") return Object.keys(raw.items).length;
      if (raw.records && typeof raw.records === "object") return Object.keys(raw.records).length;
      return Object.keys(raw).filter((key) => opportunities.some((item) => item.id === key)).length;
    } catch { return 0; }
  }

  function readinessPercent() {
    try {
      if (window.APPLICATION_READINESS?.calculatePeople) {
        const people = window.APPLICATION_READINESS.calculatePeople("all");
        const values = Object.values(people).filter((value) => Number.isFinite(value?.percent));
        if (values.length) return Math.round(values.reduce((sum, value) => sum + value.percent, 0) / values.length);
      }
      const possibleKeys = ["apply-compass-checklists-v1", "apply-compass-readiness-v1", "application-readiness-v1"];
      for (const key of possibleKeys) {
        const data = JSON.parse(localStorage.getItem(key) || "null");
        if (!data) continue;
        if (data.completed && typeof data.completed === "object" && window.APPLICATION_CONFIG?.checklistGroups) {
          const all = window.APPLICATION_CONFIG.checklistGroups.flatMap((group) => group.items || []);
          const ids = new Set(all.map((item) => item.id));
          const done = Object.keys(data.completed).filter((id) => ids.has(id) && data.completed[id]).length;
          return all.length ? Math.round(done / all.length * 100) : 0;
        }
        const values = Array.isArray(data) ? data : Object.values(data).flatMap((value) => typeof value === "object" && value ? Object.values(value) : [value]);
        if (values.length) return Math.round(values.filter(Boolean).length / values.length * 100);
      }
    } catch {}
    return 0;
  }

  function renderIntelligence() {
    const dated = opportunities.map((item) => ({item, days:daysUntil(item)})).filter((entry) => entry.days !== null && entry.days >= 0).sort((a,b) => a.days-b.days);
    const next14 = dated.filter((entry) => entry.days <= 14);
    $("#deadline-14-count").textContent = new Intl.NumberFormat("fa-IR").format(next14.length);
    $("#top-fit-live-count").textContent = new Intl.NumberFormat("fa-IR").format(opportunities.filter((item) => item.fit >= 90 && item.status !== "upcoming").length);
    $("#tracker-count").textContent = new Intl.NumberFormat("fa-IR").format(countWorkspaceItems());
    $("#readiness-count").textContent = `${new Intl.NumberFormat("fa-IR").format(readinessPercent())}٪`;
    const urgent = dated.slice(0,8);
    $("#urgent-deadline-list").innerHTML = urgent.map(({item,days}) => `<a href="workspace/?add=${encodeURIComponent(item.id)}" class="urgent-item"><span class="urgent-days ${days <= 7 ? "critical" : ""}"><b>${new Intl.NumberFormat("fa-IR").format(days)}</b><small>روز</small></span><div><h4>${escapeHtml(item.title)}</h4><p>${personLabel(item.person)} · ${escapeHtml(item.organization)}</p></div><strong>${new Intl.NumberFormat("fa-IR").format(item.fit)}٪</strong></a>`).join("") || `<p class="intelligence-empty">ددلاین ساختاریافته فعالی پیدا نشد.</p>`;
    const best = urgent.filter(({item}) => feasibility(item)==="now").sort((a,b) => (a.days-b.days) || (b.item.fit-a.item.fit))[0] || urgent[0];
    if (best) {
      $("#next-best-title").textContent = best.item.title;
      $("#next-best-copy").textContent = `${best.days} روز تا ددلاین، تطابق ${best.item.fit}٪. ${best.item.nextStep || "مدارک را با صفحه رسمی تطبیق بده و اقدام را شروع کن."}`;
      $("#next-best-link").href = `workspace/?add=${encodeURIComponent(best.item.id)}`;
    }
  }

  function renderHealthSummary() {
    const target = $("#health-card-status");
    if (!target) return;
    target.textContent = "پایش ۳۸ منبع · گزارش هفتگی زنده ←";
  }

  function renderOpportunities() {
    const list = $("#opportunity-list");
    if (!list) return;
    const items = filteredOpportunities();
    $("#result-count").textContent = new Intl.NumberFormat("fa-IR").format(items.length);
    $("#empty-state").hidden = items.length !== 0;
    list.innerHTML = items.map((item) => {
      const deadlineClass = item.urgency === "high" ? "urgent" : "";
      const location = [item.country, item.location].filter(Boolean).join(" · ");
      const tracked = trackerState(item.id);
      const remaining = daysUntil(item);
      const countdown = remaining !== null && remaining >= 0 ? `${new Intl.NumberFormat("fa-IR").format(remaining)} روز مانده` : (item.status === "rolling" ? "پذیرش مستمر" : statusLabels[item.status] || "بررسی صفحه");
      return `<article class="opportunity-card" data-id="${escapeHtml(item.id)}">
        <span class="status-stripe ${escapeHtml(item.status)}" aria-hidden="true"></span>
        <div class="org-mark">${escapeHtml(initials(item.organization))}</div>
        <div class="opportunity-main">
          <h3>${escapeHtml(item.title)} <span class="person-label ${item.person === "arzoo" ? "arzoo" : ""}">${personLabel(item.person)}</span>${tracked ? `<span class="tracked-label">${trackerLabel(tracked)}</span>` : ""}</h3>
          <p>${escapeHtml(item.organization)} · ${escapeHtml(item.skills?.slice(0, 3).join(" / ") || typeLabels[item.type] || item.type)}</p>
        </div>
        <div class="opportunity-meta"><b>${escapeHtml(typeLabels[item.type] || item.type)}</b><span>${escapeHtml(location || "بین‌المللی")}</span></div>
        <div class="opportunity-deadline ${deadlineClass}"><b>${escapeHtml(item.deadlineLabel || statusLabels[item.status] || "بررسی صفحه")}</b><span>${escapeHtml(countdown)}</span></div>
        <div class="fit-score"><div class="fit-ring" style="--score:${Number(item.fit || 0)}"><b>${new Intl.NumberFormat("fa-IR").format(item.fit)}٪</b></div><span>تطابق</span></div>
        <button class="save-button ${saved.has(item.id) ? "saved" : ""}" type="button" aria-label="ذخیره فرصت" aria-pressed="${saved.has(item.id)}">${saved.has(item.id) ? "★" : "☆"}</button>
      </article>`;
    }).join("");

    $$(".opportunity-card", list).forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target.closest(".save-button")) return;
        openDrawer(card.dataset.id);
      });
      $(".save-button", card).addEventListener("click", () => toggleSaved(card.dataset.id));
    });
  }

  function toggleSaved(id) {
    if (saved.has(id)) saved.delete(id); else saved.add(id);
    localStorage.setItem(savedKey, JSON.stringify([...saved]));
    renderOpportunities();
  }

  function openDrawer(id) {
    const item = opportunities.find((entry) => entry.id === id);
    if (!item) return;
    const drawer = $("#detail-drawer");
    const overlay = $("#detail-overlay");
    const requirements = (item.requirements || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("");
    const strengths = (item.strengths || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("");
    const gaps = (item.gaps || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("");
    $("#drawer-content").innerHTML = `
      <span class="drawer-person">برای ${personLabel(item.person)} · ${escapeHtml(typeLabels[item.type] || item.type)}</span>
      <h2 class="drawer-title">${escapeHtml(item.title)}</h2>
      <div class="drawer-org">${escapeHtml(item.organization)} · ${escapeHtml([item.country,item.location].filter(Boolean).join(" / "))}</div>
      <div class="drawer-score"><strong>${new Intl.NumberFormat("fa-IR").format(item.fit)}٪</strong><span><b>امتیاز تطابق</b><br>${escapeHtml(item.fitReason || "بر اساس سابقه، شرایط احراز و قابلیت اقدام")}</span></div>
      <div class="drawer-grid">
        <div><b>وضعیت</b><span>${escapeHtml(statusLabels[item.status] || item.status)}</span></div>
        <div><b>ددلاین</b><span>${escapeHtml(item.deadlineLabel || "در صفحه رسمی")}</span></div>
        <div><b>حمایت مالی</b><span>${escapeHtml(item.fundingLabel || item.funding || "نامشخص")}</span></div>
        <div><b>زبان/ویزای مهم</b><span>${escapeHtml(item.languageVisa || "در صفحه رسمی بررسی شود")}</span></div>
      </div>
      <section class="drawer-section"><h3>چرا این فرصت مهم است؟</h3><p>${escapeHtml(item.summary)}</p></section>
      ${requirements ? `<section class="drawer-section"><h3>شرایط کلیدی</h3><ul>${requirements}</ul></section>` : ""}
      ${strengths ? `<section class="drawer-section"><h3>شواهد مثبت پروفایل</h3><ul>${strengths}</ul></section>` : ""}
      ${gaps ? `<section class="drawer-section"><h3>شکاف‌ها و اقدام قبل از اپلای</h3><ul>${gaps}</ul></section>` : ""}
      <section class="drawer-section"><h3>اقدام پیشنهادی</h3><p>${escapeHtml(item.nextStep || "صفحه رسمی را باز کن، شرایط را دوباره تطبیق بده و نسخه هدفمند رزومه/پورتفولیو را ارسال کن.")}</p>
      <div class="drawer-actions"><a class="button button-primary" href="workspace/?add=${encodeURIComponent(item.id)}">افزودن به فضای کاری</a><a class="button" href="workspace/?compare=${encodeURIComponent(item.id)}">مقایسه</a></div>
      <a class="button button-ghost source-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">باز کردن منبع رسمی ↗</a></section>
      <p class="drawer-org">راستی‌آزمایی: ${escapeHtml(item.verified || "2026-08-29")}</p>`;
    overlay.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => drawer.classList.add("open"));
    document.body.classList.add("drawer-open");
  }

  function closeDrawer() {
    const drawer = $("#detail-drawer");
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");
    setTimeout(() => { $("#detail-overlay").hidden = true; }, 280);
  }

  function exportCsv() {
    const rows = [["person","title","organization","type","country","status","deadline","fit","url"]];
    filteredOpportunities().forEach((item) => rows.push([personLabel(item.person),item.title,item.organization,typeLabels[item.type]||item.type,item.country||"",statusLabels[item.status]||item.status,item.deadlineLabel||"",item.fit,item.url]));
    const csv = "\ufeff" + rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"}));
    link.download = "apply-opportunities-2026-08-29.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function setupEvents() {
    ["#search-input", "#person-filter", "#type-filter", "#status-filter", "#fit-filter", "#funding-filter", "#country-filter", "#deadline-filter", "#feasibility-filter", "#sort-filter"].forEach((selector) => $(selector)?.addEventListener(selector === "#search-input" ? "input" : "change", renderOpportunities));
    $("#reset-filters")?.addEventListener("click", () => {
      $("#search-input").value = ""; $("#person-filter").value = "all"; $("#type-filter").value = "all"; $("#status-filter").value = "all"; $("#fit-filter").value = "0"; $("#funding-filter").value = "all"; $("#country-filter").value = "all"; $("#deadline-filter").value = "all"; $("#feasibility-filter").value = "all"; $("#sort-filter").value = "fit"; savedOnly = false; $("#saved-only").setAttribute("aria-pressed","false"); renderOpportunities();
    });
    $("#saved-only")?.addEventListener("click", (event) => { savedOnly = !savedOnly; event.currentTarget.setAttribute("aria-pressed", String(savedOnly)); renderOpportunities(); });
    $("#drawer-close")?.addEventListener("click", closeDrawer);
    $("#detail-overlay")?.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDrawer(); });
    $("#export-button")?.addEventListener("click", exportCsv);
    $("#theme-toggle")?.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem(themeKey, document.body.classList.contains("dark") ? "dark" : "light");
    });
    if (localStorage.getItem(themeKey) === "dark") document.body.classList.add("dark");
    $(".menu-button")?.addEventListener("click", (event) => { const nav=$(".sidebar"); nav.classList.toggle("open"); event.currentTarget.setAttribute("aria-expanded",String(nav.classList.contains("open"))); });
    $$(".side-nav a").forEach((link) => link.addEventListener("click", () => $(".sidebar")?.classList.remove("open")));
    $$("[data-roadmap]").forEach((button) => button.addEventListener("click", () => {
      $$("[data-roadmap]").forEach((x) => {x.classList.toggle("active",x===button);x.setAttribute("aria-selected",String(x===button));});
      $$(".roadmap-content").forEach((panel) => panel.classList.toggle("active", panel.id === `roadmap-${button.dataset.roadmap}`));
    }));
  }

  populateFilters();
  renderStats();
  renderIntelligence();
  renderHealthSummary();
  renderOpportunities();
  setupEvents();
  window.addEventListener("apply-readiness-change", renderIntelligence);
  window.addEventListener("storage", (event) => { if (["apply-compass-workspace-v2", "apply-compass-readiness-v1"].includes(event.key)) { renderIntelligence(); renderOpportunities(); } });
})();
