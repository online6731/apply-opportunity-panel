(function () {
  "use strict";

  const config = window.APPLICATION_CONFIG;
  if (!config) {
    document.body.innerHTML = '<p style="padding:2rem;font-family:sans-serif">فایل تنظیمات آمادگی بارگذاری نشد.</p>';
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const numberFa = new Intl.NumberFormat("fa-IR");
  const els = {
    personButtons: $("#person-buttons"),
    pathFilter: $("#path-filter"),
    searchInput: $("#search-input"),
    criticalOnly: $("#critical-only"),
    checklistGroups: $("#checklist-groups"),
    checklistEmpty: $("#checklist-empty"),
    gapList: $("#gap-list"),
    projectList: $("#project-list"),
    templateList: $("#template-list"),
    deadlineList: $("#deadline-list"),
    questionList: $("#question-list"),
    redFlagList: $("#red-flag-list"),
    progressRing: $("#progress-ring"),
    readinessPercent: $("#readiness-percent"),
    readinessLabel: $("#readiness-label"),
    completedCount: $("#completed-count"),
    remainingCount: $("#remaining-count"),
    criticalCount: $("#critical-count"),
    printButton: $("#print-button"),
    resetButton: $("#reset-button"),
    toast: $("#toast")
  };

  const defaultState = {
    completed: {},
    filters: { person: "all", path: "all", criticalOnly: false }
  };

  let state = loadState();
  let query = "";
  let toastTimer;

  initControls();
  bindEvents();
  renderAll();

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(config.storageKey));
      if (!parsed || typeof parsed !== "object") return structuredCloneSafe(defaultState);
      return {
        completed: parsed.completed && typeof parsed.completed === "object" ? parsed.completed : {},
        filters: {
          person: config.people[parsed.filters?.person] ? parsed.filters.person : "all",
          path: config.paths[parsed.filters?.path] ? parsed.filters.path : "all",
          criticalOnly: Boolean(parsed.filters?.criticalOnly)
        }
      };
    } catch (_) {
      return structuredCloneSafe(defaultState);
    }
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function saveState() {
    try {
      localStorage.setItem(config.storageKey, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent("apply-readiness-change", {
        detail: window.APPLICATION_READINESS?.calculatePeople() || null
      }));
    } catch (_) {
      showToast("مرورگر اجازه ذخیره محلی نداد؛ تیک‌ها فقط تا بستن صفحه می‌مانند.");
    }
  }

  function initControls() {
    els.personButtons.innerHTML = Object.entries(config.people)
      .map(([key, person]) => `<button type="button" data-value="${escapeHtml(key)}">${escapeHtml(person.shortLabel)}</button>`)
      .join("");

    els.pathFilter.innerHTML = Object.entries(config.paths)
      .map(([key, path]) => `<option value="${escapeHtml(key)}">${escapeHtml(path.icon)} ${escapeHtml(path.label)}</option>`)
      .join("");

    els.pathFilter.value = state.filters.path;
    els.criticalOnly.checked = state.filters.criticalOnly;
    syncPersonButtons();
  }

  function bindEvents() {
    els.personButtons.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-value]");
      if (!button) return;
      state.filters.person = button.dataset.value;
      saveState();
      syncPersonButtons();
      renderAll();
    });

    els.pathFilter.addEventListener("change", () => {
      state.filters.path = els.pathFilter.value;
      saveState();
      renderAll();
    });

    els.criticalOnly.addEventListener("change", () => {
      state.filters.criticalOnly = els.criticalOnly.checked;
      saveState();
      renderAll();
    });

    els.searchInput.addEventListener("input", () => {
      query = normalizeText(els.searchInput.value);
      renderContent();
    });

    document.addEventListener("change", (event) => {
      const input = event.target.closest("input[data-check-id]");
      if (!input) return;
      setCompleted(input.dataset.checkId, input.checked);
    });

    document.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-track-id]");
      if (!button) return;
      const id = button.dataset.trackId;
      setCompleted(id, !isCompleted(id));
    });

    els.printButton.addEventListener("click", () => window.print());

    els.resetButton.addEventListener("click", () => {
      const confirmed = window.confirm("همه تیک‌های ذخیره‌شده برای هر دو نفر و همه مسیرها پاک شود؟");
      if (!confirmed) return;
      state.completed = {};
      saveState();
      renderAll();
      showToast("همه تیک‌ها پاک شد.");
    });
  }

  function syncPersonButtons() {
    els.personButtons.querySelectorAll("button[data-value]").forEach((button) => {
      const active = button.dataset.value === state.filters.person;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setCompleted(id, completed) {
    if (completed) state.completed[id] = true;
    else delete state.completed[id];
    saveState();
    renderAll();
  }

  function isCompleted(id) {
    return Boolean(state.completed[id]);
  }

  function renderAll() {
    renderContent();
    renderDeadlinePlan();
    updateProgress();
  }

  function renderContent() {
    renderChecklistGroups();
    renderGaps();
    renderProjects();
    renderTemplates();
    renderQuestions();
    renderRedFlags();
    updateProgress();
  }

  function renderChecklistGroups() {
    const groups = config.checklistGroups.map((group) => {
      const visibleItems = group.items.filter(matchesVisible);
      return { ...group, visibleItems };
    }).filter((group) => group.visibleItems.length);

    els.checklistGroups.innerHTML = groups.map((group) => {
      const done = group.visibleItems.filter((item) => isCompleted(item.id)).length;
      return `
        <article class="checklist-group">
          <header class="group-heading">
            <div><h3>${escapeHtml(group.title)}</h3><p>${escapeHtml(group.description || "")}</p></div>
            <span class="group-count">${numberFa.format(done)} / ${numberFa.format(group.visibleItems.length)}</span>
          </header>
          <div class="checklist-items">
            ${group.visibleItems.map(renderCheckItem).join("")}
          </div>
        </article>`;
    }).join("");

    const empty = groups.length === 0;
    els.checklistEmpty.hidden = !empty;
  }

  function renderCheckItem(item) {
    const checked = isCompleted(item.id);
    const note = selectedPersonNote(item);
    const safeId = `check-${item.id}`;
    return `
      <label class="check-item${checked ? " checked" : ""}" for="${escapeHtml(safeId)}">
        <input id="${escapeHtml(safeId)}" type="checkbox" data-check-id="${escapeHtml(item.id)}" ${checked ? "checked" : ""}>
        <span class="checkmark" aria-hidden="true"></span>
        <span class="check-copy">
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.detail || "")}</p>
          ${note ? `<p class="item-note">${escapeHtml(note)}</p>` : ""}
          ${item.outputName ? `<span class="item-output">${escapeHtml(item.outputName)}</span>` : ""}
          ${item.safetySource ? `<a class="source-inline" href="${safeUrl(item.safetySource)}" target="_blank" rel="noreferrer" onclick="event.stopPropagation()">منبع ایمنی رسمی ↗</a>` : ""}
        </span>
        ${priorityBadge(item.priority)}
      </label>`;
  }

  function renderGaps() {
    const items = config.gaps.filter(matchesVisible);
    els.gapList.innerHTML = items.length ? items.map((gap) => `
      <article class="gap-card${isCompleted(gap.id) ? " is-complete" : ""}" data-priority="${escapeHtml(gap.priority)}">
        <div class="card-top">
          ${personBadge(gap.persons)}
          ${trackButton(gap.id, "شکاف بسته شد")}
        </div>
        <h3>${escapeHtml(gap.title)}</h3>
        <p class="gap-impact"><strong>اثر:</strong> ${escapeHtml(gap.impact)}</p>
        <p class="gap-action"><strong>اقدام پیشنهادی</strong>${escapeHtml(gap.action)}</p>
      </article>`).join("") : emptyMessage("شکافی با فیلتر فعلی نمایش داده نمی‌شود.");
  }

  function renderProjects() {
    const items = config.portfolioProjects.filter(matchesVisible);
    els.projectList.innerHTML = items.length ? items.map((project, index) => `
      <article class="project-card${isCompleted(project.id) ? " is-complete" : ""}">
        <div class="project-no"><span>${String(index + 1).padStart(2, "0")}</span>${trackButton(project.id, "پروژه آماده شد")}</div>
        ${personBadge(project.persons)}
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.outcome)}</p>
        <div class="proof-box"><strong>خروجی قابل اثبات</strong><span>${escapeHtml(project.proof)}</span></div>
        <div class="role-tags">${(project.targetRoles || []).map((role) => `<span>${escapeHtml(role)}</span>`).join("")}</div>
      </article>`).join("") : emptyMessage("پروژه پیشنهادی برای این فیلتر وجود ندارد.");
  }

  function renderTemplates() {
    const items = config.templates.filter(matchesVisible);
    els.templateList.innerHTML = items.length ? items.map((template) => `
      <article class="template-card${isCompleted(template.id) ? " is-complete" : ""}">
        <div class="template-head"><h3>${escapeHtml(template.title)}</h3><span class="template-format">${escapeHtml(template.format)}</span></div>
        ${personBadge(template.persons, true)}
        <code class="file-name">${escapeHtml(template.suggestedFile)}</code>
        <p>${escapeHtml(template.note)}</p>
        <div class="input-chips">${(template.inputs || []).map((input) => `<span>${escapeHtml(input)}</span>`).join("")}</div>
        ${trackButton(template.id, "فایل آماده است", true)}
      </article>`).join("") : emptyMessage("الگوی مرتبطی با فیلتر فعلی وجود ندارد.", true);
  }

  function renderDeadlinePlan() {
    els.deadlineList.innerHTML = config.deadlinePreparation.map((phase) => `
      <article class="deadline-card" data-tone="${escapeHtml(phase.tone)}">
        <h3>${escapeHtml(phase.label)}</h3>
        <ul>${phase.actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ul>
      </article>`).join("");
  }

  function renderQuestions() {
    const items = config.questionBank.filter(matchesVisible);
    els.questionList.innerHTML = items.length ? items.map((item) => `
      <article class="question-card${isCompleted(item.id) ? " is-complete" : ""}">
        <div><span class="question-category">${escapeHtml(questionCategoryLabel(item.category))}</span>${trackButton(item.id, "پاسخ گرفته شد")}</div>
        <div><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.why)}</p></div>
        <div class="ask-who"><strong>از چه کسی؟</strong><span>${escapeHtml(item.askWho)}</span></div>
      </article>`).join("") : emptyMessage("سؤال مرتبطی با فیلتر فعلی وجود ندارد.");
  }

  function renderRedFlags() {
    const items = config.redFlags.filter(matchesVisible);
    els.redFlagList.innerHTML = items.length ? items.map((flag) => `
      <article class="red-flag-card" data-severity="${escapeHtml(flag.severity)}">
        ${personBadge(flag.persons, true)}
        <h3>${escapeHtml(flag.title)}</h3>
        <p>${escapeHtml(flag.detail)}</p>
        ${flag.sourceUrl ? `<a class="source-mini" href="${safeUrl(flag.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(flag.sourceLabel || "منبع رسمی")} ↗</a>` : ""}
      </article>`).join("") : emptyMessage("خط قرمز اختصاصی برای فیلتر فعلی وجود ندارد.", true);
  }

  function updateProgress() {
    const snapshot = window.APPLICATION_READINESS.calculate({
      person: state.filters.person,
      path: state.filters.path,
      criticalOnly: state.filters.criticalOnly
    }, state);
    const completed = snapshot.completed;
    const total = snapshot.total;
    const percent = snapshot.percent;
    const criticalOpen = snapshot.criticalOpen;

    els.progressRing.style.setProperty("--progress", String(percent));
    els.progressRing.setAttribute("aria-valuenow", String(percent));
    els.readinessPercent.textContent = `${numberFa.format(percent)}٪`;
    els.completedCount.textContent = numberFa.format(completed);
    els.remainingCount.textContent = numberFa.format(Math.max(0, total - completed));
    els.criticalCount.textContent = numberFa.format(criticalOpen);

    const personLabel = config.people[state.filters.person].label;
    const pathLabel = config.paths[state.filters.path].label;
    if (!total) {
      els.readinessLabel.textContent = "برای این ترکیب، مورد قابل‌پیگیری تعریف نشده است.";
    } else if (percent === 100) {
      els.readinessLabel.textContent = `${personLabel} · ${pathLabel}: همه ${numberFa.format(total)} مورد آماده‌اند؛ پیش از ارسال دوباره منبع رسمی را کنترل کنید.`;
    } else {
      els.readinessLabel.textContent = `${personLabel} · ${pathLabel}: ${numberFa.format(total)} مورد در محاسبه آمادگی است؛ ${numberFa.format(criticalOpen)} مورد بحرانی هنوز باز است.`;
    }
  }

  function matchesVisible(item) {
    return matchesBase(item) && matchesSearch(item);
  }

  function matchesBase(item) {
    const personMatch = state.filters.person === "all" || (item.persons || []).includes(state.filters.person);
    const pathMatch = state.filters.path === "all" || (item.paths || []).includes(state.filters.path);
    const priorityMatch = !state.filters.criticalOnly || item.priority === "critical" || item.priority === "high";
    return personMatch && pathMatch && priorityMatch;
  }

  function matchesSearch(item) {
    if (!query) return true;
    const personNotes = item.personNotes ? Object.values(item.personNotes).join(" ") : "";
    const haystack = normalizeText([
      item.title,
      item.detail,
      item.action,
      item.impact,
      item.outcome,
      item.proof,
      item.note,
      item.question,
      item.why,
      item.askWho,
      item.outputName,
      item.suggestedFile,
      personNotes,
      ...(item.inputs || []),
      ...(item.targetRoles || [])
    ].filter(Boolean).join(" "));
    return haystack.includes(query);
  }

  function selectedPersonNote(item) {
    if (!item.personNotes || state.filters.person === "all") return "";
    return item.personNotes[state.filters.person] || "";
  }

  function priorityBadge(priority) {
    const label = config.priorityLabels[priority] || priority || "";
    return `<span class="priority-badge priority-${escapeHtml(priority || "medium")}">${escapeHtml(label)}</span>`;
  }

  function personBadge(persons, dark = false) {
    if (!persons || persons.length === 0 || persons.length === 2) {
      return `<span class="person-label${dark ? " light" : ""}">مشترک</span>`;
    }
    const person = persons[0];
    return `<span class="person-label ${escapeHtml(person)}${dark ? " light" : ""}">${escapeHtml(config.people[person]?.shortLabel || person)}</span>`;
  }

  function trackButton(id, label, dark = false) {
    const complete = isCompleted(id);
    return `<button class="complete-toggle${complete ? " active" : ""}${dark ? " on-dark" : ""}" type="button" data-track-id="${escapeHtml(id)}" aria-pressed="${String(complete)}"><span aria-hidden="true">${complete ? "✓" : "○"}</span>${escapeHtml(complete ? "آماده" : label)}</button>`;
  }

  function questionCategoryLabel(category) {
    return {
      eligibility: "احراز شرایط",
      payment: "پرداخت",
      visa: "ویزا و کار",
      shipping: "حمل و گمرک",
      contract: "قرارداد"
    }[category] || category;
  }

  function normalizeText(value) {
    return String(value || "")
      .toLocaleLowerCase("fa")
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? escapeHtml(url.href) : "#";
    } catch (_) {
      return "#";
    }
  }

  function emptyMessage(message, dark = false) {
    return `<div class="inline-empty${dark ? " on-dark" : ""}">${escapeHtml(message)}</div>`;
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      els.toast.hidden = true;
    }, 2600);
  }
})();
