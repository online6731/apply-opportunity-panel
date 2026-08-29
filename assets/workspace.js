(function () {
  "use strict";

  const STORAGE_KEY = "apply-compass-workspace-v2";
  const THEME_KEY = "apply-compass-workspace-theme-v1";
  const VERSION = 2;
  const seedOpportunities = Array.isArray(window.OPPORTUNITIES) ? window.OPPORTUNITIES : [];
  const typeLabels = window.TYPE_LABELS || {};
  const numberFa = new Intl.NumberFormat("fa-IR");
  const dateFa = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { year: "numeric", month: "long", day: "numeric" });
  const monthFa = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { year: "numeric", month: "long" });
  const shortMonthFa = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { month: "short" });
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const STAGES = [
    { id: "saved", label: "ذخیره‌شده", short: "ذخیره" },
    { id: "preparing", label: "در حال آماده‌سازی", short: "آماده‌سازی" },
    { id: "applied", label: "ارسال‌شده", short: "ارسال" },
    { id: "interview", label: "مصاحبه", short: "مصاحبه" },
    { id: "offer", label: "پیشنهاد", short: "آفر" },
    { id: "rejected", label: "ردشده", short: "رد" },
    { id: "archived", label: "بایگانی", short: "بایگانی" }
  ];

  const PRIORITIES = {
    high: "بالا",
    medium: "متوسط",
    low: "پایین"
  };

  const FALLBACK_PEOPLE = [
    {
      id: "mohammad",
      label: "محمد پارسیان",
      shortLabel: "محمد",
      kicker: "ACADEMIC + TECH PROFILE",
      profile: "کارشناس مهندسی کامپیوتر و دانش‌آموخته/دانشجوی ارشد علوم شناختی با تجربه Python، یادگیری ماشین، EEG/fNIRS، پردازش سیگنال، NeuroAI، توسعه وب، محصول AI و بنیان‌گذاری فنی.",
      documents: [
        { id: "academic-cv", label: "رزومه آکادمیک انگلیسی", description: "نسخه اصلی پژوهش و دکتری", required: true },
        { id: "industry-cv", label: "رزومه صنعتی یک‌صفحه‌ای", description: "Applied AI / ML / Product", required: false },
        { id: "passport", label: "پاسپورت معتبر", description: "اسکن صفحه اطلاعات", required: true },
        { id: "bsc-degree", label: "مدرک و ریزنمرات کارشناسی", description: "نسخه فارسی + ترجمه رسمی", required: true },
        { id: "msc-degree", label: "مدرک/گواهی ارشد و ریزنمرات", description: "وضعیت دفاع و تاریخ فراغت روشن", required: true },
        { id: "motivation", label: "قالب انگیزه‌نامه / SOP", description: "نسخه پایه قابل شخصی‌سازی", required: true },
        { id: "research-summary", label: "خلاصه پایان‌نامه و علایق پژوهشی", description: "حداکثر دو صفحه", required: true },
        { id: "portfolio", label: "پورتفولیو GitHub و پروژه‌ها", description: "۶ پروژه منتخب و README کامل", required: true },
        { id: "references", label: "اطلاعات دو معرف", description: "ایمیل سازمانی و رضایت قبلی", required: true },
        { id: "english", label: "مدرک زبان یا برنامه آزمون", description: "IELTS/TOEFL یا معافیت", required: false },
        { id: "awards", label: "مدرک جوایز و رتبه‌ها", description: "لینک نتیجه یا گواهی", required: false },
        { id: "publications", label: "فهرست مقاله / preprint / ارائه", description: "ORCID و Google Scholar در صورت وجود", required: false }
      ]
    },
    {
      id: "arzoo",
      label: "آرزو براویی",
      shortLabel: "آرزو",
      kicker: "ART + FASHION PROFILE",
      profile: "هنرمند و بنیان‌گذار برند آریدُچ با تمرکز بر زیور و قاب سوزن‌دوزی بلوچ، بازیافت منسوجات میراثی، مدلینگ، روایت فرهنگی، فروش بین‌المللی و علاقه به مد پایدار.",
      documents: [
        { id: "artist-cv", label: "رزومه هنری انگلیسی", description: "نمایشگاه، برند، همکاری و فروش", required: true },
        { id: "passport", label: "پاسپورت معتبر", description: "اسکن صفحه اطلاعات", required: true },
        { id: "artist-bio", label: "Artist Bio کوتاه و بلند", description: "۸۰ و ۲۵۰ واژه", required: true },
        { id: "artist-statement", label: "Artist Statement", description: "میراث بلوچ، بازیافت و هویت", required: true },
        { id: "portfolio-pdf", label: "پورتفولیوی PDF", description: "۱۲ تا ۲۰ اثر با چیدمان حرفه‌ای", required: true },
        { id: "work-images", label: "عکس باکیفیت آثار", description: "بدون واترمارک و مناسب چاپ", required: true },
        { id: "captions", label: "فهرست مشخصات آثار", description: "عنوان، سال، متریال، ابعاد و قیمت", required: true },
        { id: "degree", label: "مدرک و ریزنمرات دانشگاه", description: "فارسی + ترجمه رسمی", required: false },
        { id: "references", label: "دو معرف حرفه‌ای", description: "برند، استاد یا همکار هنری", required: false },
        { id: "model-digitals", label: "Digitals / Polaroids مدلینگ", description: "نور طبیعی، بدون ادیت سنگین", required: false },
        { id: "measurements", label: "اندازه‌ها و اطلاعات مدلینگ", description: "قد، دورها، کفش، مو و چشم", required: false },
        { id: "intro-video", label: "ویدیوی معرفی کوتاه", description: "۳۰ تا ۶۰ ثانیه انگلیسی", required: false },
        { id: "english", label: "مدرک زبان یا برنامه آزمون", description: "برای دوره‌های تحصیلی", required: false },
        { id: "brand-proof", label: "مدارک فروش و ارسال بین‌المللی", description: "فاکتور، مطبوعات و رضایت مشتری", required: false }
      ]
    }
  ];

  let state;
  let opportunitiesById = new Map();
  let people = [];
  let activeDocumentPerson = "mohammad";
  let pendingConfirmation = null;
  let savePulseTimer = null;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function normalize(value) {
    return String(value || "")
      .toLocaleLowerCase("fa")
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[\u200c\u200f]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function latinDigits(value) {
    const fa = "۰۱۲۳۴۵۶۷۸۹";
    const ar = "٠١٢٣٤٥٦٧٨٩";
    return String(value || "").replace(/[۰-۹]/g, (x) => fa.indexOf(x)).replace(/[٠-٩]/g, (x) => ar.indexOf(x));
  }

  function localIsoDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dateFromIso(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function addDaysIso(value, days) {
    const date = dateFromIso(value);
    if (!date) return "";
    date.setDate(date.getDate() + days);
    return localIsoDate(date);
  }

  function daysBetween(from, to) {
    const fromDate = typeof from === "string" ? dateFromIso(from) : new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12);
    const toDate = typeof to === "string" ? dateFromIso(to) : new Date(to.getFullYear(), to.getMonth(), to.getDate(), 12);
    if (!fromDate || !toDate) return null;
    return Math.round((toDate - fromDate) / 86400000);
  }

  function parseDeadlineLabel(label) {
    const raw = latinDigits(label);
    if (!raw || /(بدون ددلاین|پذیرش مستمر|اعلام نشده|هنوز باز نشده|احتمالاً|ددلاین دقیق هنوز)/.test(raw)) return "";
    const months = {
      "ژانویه": 1, "فوریه": 2, "مارس": 3, "آوریل": 4, "مه": 5, "می": 5, "ژوئن": 6,
      "ژوئیه": 7, "جولای": 7, "اوت": 8, "آگوست": 8, "سپتامبر": 9, "اکتبر": 10, "نوامبر": 11, "دسامبر": 12
    };
    const match = raw.match(/(\d{1,2})\s+(ژانویه|فوریه|مارس|آوریل|مه|می|ژوئن|ژوئیه|جولای|اوت|آگوست|سپتامبر|اکتبر|نوامبر|دسامبر)\s+(20\d{2})/);
    if (!match) return "";
    return `${match[3]}-${String(months[match[2]]).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}`;
  }

  function formatDate(value) {
    const date = dateFromIso(value);
    return date ? dateFa.format(date) : "بدون تاریخ";
  }

  function stageLabel(stage) {
    return STAGES.find((item) => item.id === stage)?.label || stage;
  }

  function personConfig(id) {
    return people.find((person) => person.id === id) || FALLBACK_PEOPLE.find((person) => person.id === id) || { id, label: id, shortLabel: id, profile: "", documents: [] };
  }

  function personLabel(id) {
    return personConfig(id).shortLabel || personConfig(id).label || id;
  }

  function derivePriority(item) {
    if (item.urgency === "high" || Number(item.fit || 0) >= 90) return "high";
    if (Number(item.fit || 0) >= 70) return "medium";
    return "low";
  }

  function uid(prefix = "manual") {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function safeUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      const url = new URL(raw, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_error) {
      return "";
    }
  }

  function fallbackState() {
    return {
      version: VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tracker: {},
      manual: {},
      documents: {},
      ui: {
        view: "kanban",
        compare: [],
        privacyDismissed: false,
        filters: { query: "", person: "all", stage: "all", priority: "all", type: "all" },
        timelineRange: "90",
        documentPerson: "mohammad"
      },
      lastBackupAt: ""
    };
  }

  function seedTrackerRecord(item) {
    const now = new Date().toISOString();
    const structuredDeadline = window.OPPORTUNITY_DEADLINES?.[item.id];
    const officialDate = item.deadlineDate || (structuredDeadline ? String(structuredDeadline).slice(0, 10) : "") || parseDeadlineLabel(item.deadlineLabel);
    return {
      stage: "saved",
      priority: derivePriority(item),
      nextAction: item.nextStep || "صفحه رسمی را دوباره بررسی و مدارک موردنیاز را مشخص کن.",
      dueDate: officialDate,
      notes: "",
      appliedDate: "",
      overrides: {},
      createdAt: now,
      updatedAt: now
    };
  }

  function officialDeadlineDate(item) {
    if (!item) return "";
    const configured = window.OPPORTUNITY_DEADLINES?.[item.id];
    return String(item.deadlineDate || (configured ? String(configured).slice(0, 10) : "") || parseDeadlineLabel(item.deadlineLabel) || "");
  }

  function ensureState(candidate) {
    const base = fallbackState();
    const input = isPlainObject(candidate) ? candidate : {};
    const output = {
      ...base,
      ...input,
      version: VERSION,
      tracker: isPlainObject(input.tracker) ? input.tracker : {},
      manual: isPlainObject(input.manual) ? input.manual : {},
      documents: isPlainObject(input.documents) ? input.documents : {},
      ui: {
        ...base.ui,
        ...(isPlainObject(input.ui) ? input.ui : {}),
        filters: { ...base.ui.filters, ...(isPlainObject(input.ui?.filters) ? input.ui.filters : {}) },
        compare: Array.isArray(input.ui?.compare) ? input.ui.compare.slice(0, 3).map(String) : []
      }
    };

    seedOpportunities.forEach((item) => {
      if (!isPlainObject(output.tracker[item.id])) output.tracker[item.id] = seedTrackerRecord(item);
      else {
        const seeded = seedTrackerRecord(item);
        output.tracker[item.id] = { ...seeded, ...output.tracker[item.id], overrides: isPlainObject(output.tracker[item.id].overrides) ? output.tracker[item.id].overrides : {} };
        if (!output.tracker[item.id].dueDate && seeded.dueDate) output.tracker[item.id].dueDate = seeded.dueDate;
      }
    });

    Object.entries(output.manual).forEach(([id, item]) => {
      if (!isPlainObject(item) || !item.title) delete output.manual[id];
      else if (!isPlainObject(output.tracker[id])) output.tracker[id] = seedTrackerRecord(item);
    });

    output.ui.compare = output.ui.compare.filter((id) => output.tracker[id] && (seedOpportunities.some((item) => item.id === id) || output.manual[id]));
    output.updatedAt = new Date().toISOString();
    return output;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return ensureState(raw ? JSON.parse(raw) : null);
    } catch (_error) {
      return ensureState(null);
    }
  }

  function saveState(message = "ذخیره شد") {
    state.updatedAt = new Date().toISOString();
    const status = $("#save-status");
    if (status) {
      status.classList.remove("error");
      status.classList.add("saving");
      status.lastChild.textContent = "در حال ذخیره…";
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      clearTimeout(savePulseTimer);
      savePulseTimer = setTimeout(() => {
        if (!status) return;
        status.classList.remove("saving");
        status.lastChild.textContent = message;
      }, 280);
    } catch (_error) {
      if (status) {
        status.classList.remove("saving");
        status.classList.add("error");
        status.lastChild.textContent = "ذخیره ناموفق";
      }
      toast("مرورگر نتوانست داده را ذخیره کند؛ یک پشتیبان JSON بگیرید.", "error");
    }
  }

  function resolvePeopleConfig() {
    const config = isPlainObject(window.APPLICATION_CONFIG) ? window.APPLICATION_CONFIG : {};
    const supplied = config.people || config.persons;
    const fallbackMap = new Map(FALLBACK_PEOPLE.map((person) => [person.id, structuredCloneSafe(person)]));
    let entries = [];

    if (Array.isArray(supplied)) entries = supplied;
    else if (isPlainObject(supplied)) entries = Object.entries(supplied).map(([id, value]) => ({ id, ...(isPlainObject(value) ? value : {}) }));

    entries.forEach((entry) => {
      if (entry?.id === "all") return;
      if (!entry?.id) return;
      const previous = fallbackMap.get(entry.id) || { id: entry.id, label: entry.label || entry.name || entry.id, shortLabel: entry.shortLabel || entry.label || entry.name || entry.id, profile: "", documents: [] };
      const configuredDocuments = entry.documents || entry.checklist || config.documents?.[entry.id] || checklistDocumentsForPerson(config, entry.id);
      fallbackMap.set(entry.id, {
        ...previous,
        ...entry,
        label: entry.label || entry.name || previous.label,
        shortLabel: entry.shortLabel || entry.short || previous.shortLabel,
        profile: entry.profile || entry.summary || previous.profile,
        documents: normalizeDocuments(configuredDocuments || previous.documents, entry.id)
      });
    });

    return Array.from(fallbackMap.values()).map((person) => ({ ...person, documents: normalizeDocuments(person.documents, person.id) }));
  }

  function checklistDocumentsForPerson(config, personId) {
    if (!Array.isArray(config.checklistGroups)) return null;
    const documents = [];
    config.checklistGroups.forEach((group) => {
      (Array.isArray(group.items) ? group.items : []).forEach((item) => {
        const persons = Array.isArray(item.persons) ? item.persons : [];
        if (!persons.includes(personId)) return;
        documents.push({
          id: String(item.id || `${group.id || "group"}-${documents.length}`),
          label: String(item.title || item.label || `مدرک ${documents.length + 1}`),
          description: String(item.detail || item.description || group.title || ""),
          required: ["critical", "high"].includes(item.priority)
        });
      });
    });
    return documents.length ? documents : null;
  }

  function normalizeDocuments(documents, personId) {
    if (!Array.isArray(documents)) return [];
    return documents.map((documentItem, index) => {
      if (typeof documentItem === "string") return { id: `${personId}-doc-${index}`, label: documentItem, description: "", required: false };
      const item = isPlainObject(documentItem) ? documentItem : {};
      return {
        id: String(item.id || `${personId}-doc-${index}`),
        label: String(item.label || item.title || item.name || `مدرک ${index + 1}`),
        description: String(item.description || item.note || ""),
        required: Boolean(item.required)
      };
    });
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function rebuildOpportunityIndex() {
    opportunitiesById = new Map();
    seedOpportunities.forEach((item) => opportunitiesById.set(String(item.id), item));
    Object.entries(state.manual).forEach(([id, item]) => opportunitiesById.set(id, item));
  }

  function composedItem(id) {
    const base = opportunitiesById.get(String(id));
    const tracker = state.tracker[String(id)];
    if (!base || !tracker) return null;
    const mergedBase = { ...base, ...(isPlainObject(tracker.overrides) ? tracker.overrides : {}) };
    return {
      ...mergedBase,
      id: String(id),
      deadlineDate: officialDeadlineDate(mergedBase),
      stage: STAGES.some((stage) => stage.id === tracker.stage) ? tracker.stage : "saved",
      priority: PRIORITIES[tracker.priority] ? tracker.priority : "medium",
      nextAction: String(tracker.nextAction || ""),
      dueDate: String(tracker.dueDate || ""),
      notes: String(tracker.notes || ""),
      appliedDate: String(tracker.appliedDate || ""),
      createdAt: tracker.createdAt,
      updatedAt: tracker.updatedAt,
      manual: Boolean(base.manual)
    };
  }

  function effectiveDate(item) {
    return String(item?.dueDate || item?.deadlineDate || "");
  }

  function allItems() {
    return Array.from(opportunitiesById.keys()).map(composedItem).filter(Boolean);
  }

  function updateTracker(id, changes, message) {
    if (!state.tracker[id]) return;
    const previousStage = state.tracker[id].stage;
    state.tracker[id] = { ...state.tracker[id], ...changes, updatedAt: new Date().toISOString() };
    const nextStage = state.tracker[id].stage;
    if (["applied", "interview", "offer"].includes(nextStage) && !state.tracker[id].appliedDate) state.tracker[id].appliedDate = localIsoDate();
    if (previousStage !== nextStage && nextStage === "saved" && changes.appliedDate === undefined) state.tracker[id].appliedDate = state.tracker[id].appliedDate || "";
    saveState(message || "تغییرات ذخیره شد");
    renderAll();
  }

  function toast(message, kind = "success") {
    const region = $("#toast-region");
    if (!region) return;
    const node = document.createElement("div");
    node.className = `toast ${kind === "error" ? "error" : ""}`;
    node.textContent = message;
    region.appendChild(node);
    setTimeout(() => node.remove(), 3400);
  }

  function setTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem(THEME_KEY, theme); } catch (_error) { /* no-op */ }
  }

  function initialTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "dark" || stored === "light") return stored;
    } catch (_error) { /* no-op */ }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function populateStaticControls() {
    const stageSelects = [$("#filter-stage"), $("#opportunity-stage")].filter(Boolean);
    stageSelects.forEach((select) => {
      const keepFirst = select.id === "filter-stage";
      if (!keepFirst) select.innerHTML = "";
      STAGES.forEach((stage) => select.insertAdjacentHTML("beforeend", `<option value="${stage.id}">${stage.label}</option>`));
    });

    const types = [...new Set([...seedOpportunities.map((item) => item.type), "job", "phd", "fellowship", "masters", "residency", "competition", "modeling", "business", "other"])].sort();
    [$("#filter-type"), $("#opportunity-type")].filter(Boolean).forEach((select) => {
      const keepFirst = select.id === "filter-type";
      if (!keepFirst) select.innerHTML = "";
      types.forEach((type) => select.insertAdjacentHTML("beforeend", `<option value="${escapeAttribute(type)}">${escapeHtml(typeLabels[type] || type)}</option>`));
    });

    const kitPerson = $("#kit-person");
    if (kitPerson) kitPerson.innerHTML = people.map((person) => `<option value="${escapeAttribute(person.id)}">${escapeHtml(person.label)}</option>`).join("");

    const tabs = $("#document-person-tabs");
    if (tabs) tabs.innerHTML = people.map((person) => `<button type="button" data-person="${escapeAttribute(person.id)}" aria-pressed="false">${escapeHtml(person.shortLabel || person.label)}</button>`).join("");
  }

  function syncFilterControls() {
    const filters = state.ui.filters;
    $("#tracker-search").value = filters.query || "";
    $("#filter-person").value = filters.person || "all";
    $("#filter-stage").value = filters.stage || "all";
    $("#filter-priority").value = filters.priority || "all";
    $("#filter-type").value = filters.type || "all";
    $("#timeline-range").value = state.ui.timelineRange || "90";
    setView(state.ui.view || "kanban", false);
  }

  function readFilters() {
    state.ui.filters = {
      query: $("#tracker-search")?.value || "",
      person: $("#filter-person")?.value || "all",
      stage: $("#filter-stage")?.value || "all",
      priority: $("#filter-priority")?.value || "all",
      type: $("#filter-type")?.value || "all"
    };
    saveState("فیلترها ذخیره شد");
  }

  function filteredItems() {
    const filters = state.ui.filters;
    const query = normalize(filters.query);
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return allItems().filter((item) => {
      const text = normalize([
        item.title, item.organization, item.country, item.location, item.summary, item.nextAction, item.notes,
        ...(Array.isArray(item.skills) ? item.skills : []), ...(Array.isArray(item.requirements) ? item.requirements : [])
      ].join(" "));
      return (!query || text.includes(query)) &&
        (filters.person === "all" || item.person === filters.person) &&
        (filters.stage === "all" || item.stage === filters.stage) &&
        (filters.priority === "all" || item.priority === filters.priority) &&
        (filters.type === "all" || item.type === filters.type);
    }).sort((a, b) => {
      const aDate = effectiveDate(a) || "9999-12-31";
      const bDate = effectiveDate(b) || "9999-12-31";
      return priorityOrder[a.priority] - priorityOrder[b.priority] || aDate.localeCompare(bDate) || Number(b.fit || 0) - Number(a.fit || 0);
    });
  }

  function deadlineStatus(item) {
    const dateValue = effectiveDate(item);
    if (!dateValue) return { text: item.deadlineLabel || "بدون تاریخ", className: "", days: null };
    const days = daysBetween(new Date(), dateValue);
    if (days === null) return { text: formatDate(dateValue), className: "", days: null };
    if (days < 0) return { text: `${numberFa.format(Math.abs(days))} روز گذشته`, className: "overdue", days };
    if (days === 0) return { text: "امروز", className: "overdue", days };
    if (days === 1) return { text: "فردا", className: "overdue", days };
    return { text: `${numberFa.format(days)} روز دیگر`, className: days <= 14 ? "overdue" : "", days };
  }

  function renderMetrics() {
    const items = allItems();
    const active = items.filter((item) => !["rejected", "archived"].includes(item.stage));
    const urgent = active.filter((item) => effectiveDate(item) && (() => { const days = daysBetween(new Date(), effectiveDate(item)); return days !== null && days >= 0 && days <= 14; })());
    const preparing = items.filter((item) => item.stage === "preparing");
    const applied = items.filter((item) => ["applied", "interview", "offer"].includes(item.stage));
    const interviews = items.filter((item) => item.stage === "interview").length;
    const offers = items.filter((item) => item.stage === "offer").length;
    $("#metric-total").textContent = numberFa.format(items.length);
    $("#metric-total-sub").textContent = `${numberFa.format(seedOpportunities.length)} مورد تحقیق‌شده · ${numberFa.format(Object.keys(state.manual).length)} دستی`;
    $("#metric-urgent").textContent = numberFa.format(urgent.length);
    $("#metric-urgent-sub").textContent = urgent.length ? "موعدهای باز و نزدیک" : "ددلاین نزدیک ندارید";
    $("#metric-preparing").textContent = numberFa.format(preparing.length);
    $("#metric-applied").textContent = numberFa.format(applied.length);
    $("#metric-success-sub").textContent = `${numberFa.format(interviews)} مصاحبه · ${numberFa.format(offers)} آفر`;

    const dated = active.filter((item) => effectiveDate(item)).sort((a, b) => effectiveDate(a).localeCompare(effectiveDate(b)));
    const next = dated.find((item) => (daysBetween(new Date(), effectiveDate(item)) ?? -1) >= 0);
    $("#next-deadline-label").textContent = next ? `نزدیک‌ترین موعد: ${next.title} · ${formatDate(effectiveDate(next))}` : "موعد آینده‌ای ثبت نشده است";
    $("#today-label").textContent = dateFa.format(new Date());
  }

  function renderPipeline() {
    const items = allItems();
    const counts = Object.fromEntries(STAGES.map((stage) => [stage.id, items.filter((item) => item.stage === stage.id).length]));
    const max = Math.max(1, ...Object.values(counts));
    $("#pipeline-caption").textContent = `${numberFa.format(items.filter((item) => !["rejected", "archived"].includes(item.stage)).length)} پرونده فعال`;
    $("#pipeline-chart").innerHTML = STAGES.map((stage) => {
      const height = Math.max(3, Math.round((counts[stage.id] / max) * 100));
      return `<div class="pipeline-item" data-stage="${stage.id}"><div class="pipeline-bar-wrap"><div class="pipeline-bar" style="height:${height}%"><b>${numberFa.format(counts[stage.id])}</b></div></div><span>${stage.label}</span></div>`;
    }).join("");
  }

  function actionRank(item) {
    const priority = { high: 300, medium: 200, low: 100 }[item.priority] || 0;
    const stage = { interview: 80, preparing: 70, applied: 40, saved: 20, offer: 10 }[item.stage] || 0;
    const days = effectiveDate(item) ? daysBetween(new Date(), effectiveDate(item)) : null;
    const deadline = days === null ? 0 : days < 0 ? -100 : Math.max(0, 90 - days * 3);
    return priority + stage + deadline + Number(item.fit || 0) / 10;
  }

  function renderActionQueue() {
    const queue = allItems().filter((item) => ["saved", "preparing", "applied", "interview"].includes(item.stage)).sort((a, b) => actionRank(b) - actionRank(a)).slice(0, 5);
    $("#action-queue").innerHTML = queue.length ? queue.map((item, index) => {
      const status = deadlineStatus(item);
      return `<button class="action-row" type="button" data-open-id="${escapeAttribute(item.id)}"><span class="action-rank">${numberFa.format(index + 1)}</span><span><strong>${escapeHtml(item.nextAction || item.title)}</strong><small>${escapeHtml(item.title)} · ${personLabel(item.person)}</small></span><time>${escapeHtml(status.text)}</time></button>`;
    }).join("") : `<div class="empty-compact">اقدام فعالی ثبت نشده است.</div>`;
  }

  function renderTracker() {
    const items = filteredItems();
    $("#tracker-result-count").textContent = `${numberFa.format(items.length)} فرصت`;
    $("#tracker-empty").hidden = items.length !== 0;
    renderKanban(items);
    renderTable(items);
  }

  function cardHtml(item) {
    const deadline = deadlineStatus(item);
    const compared = state.ui.compare.includes(item.id);
    return `<article class="kanban-card priority-${item.priority}" draggable="true" data-id="${escapeAttribute(item.id)}">
      <div class="card-topline"><span><span class="person-pill ${item.person === "arzoo" ? "arzoo" : ""}">${escapeHtml(personLabel(item.person))}</span> <span class="type-pill">${escapeHtml(typeLabels[item.type] || item.type)}</span>${item.manual ? ` <span class="local-pill">دستی</span>` : ""}</span><span class="priority-pill ${item.priority}">${PRIORITIES[item.priority]}</span></div>
      <h3>${escapeHtml(item.title)}</h3><p class="card-org">${escapeHtml(item.organization || "بدون سازمان")}</p>
      <div class="card-meta"><span>◷ ${escapeHtml(effectiveDate(item) ? formatDate(effectiveDate(item)) : item.deadlineLabel || "بدون ددلاین")}</span><span>◎ ${numberFa.format(Number(item.fit || 0))}٪</span></div>
      <div class="card-action ${deadline.className}">${escapeHtml(item.nextAction || "اقدام بعدی ثبت نشده است")}</div>
      <div class="card-footer"><span class="fit-mini">${escapeHtml(deadline.text)}</span><span class="card-buttons"><button class="mini-button ${compared ? "active" : ""}" type="button" data-action="compare" aria-pressed="${compared}">مقایسه</button><button class="mini-button" type="button" data-action="edit">ویرایش</button></span></div>
    </article>`;
  }

  function renderKanban(items) {
    const board = $("#kanban-view");
    const visibleStages = state.ui.filters.stage === "all" ? STAGES : STAGES.filter((stage) => stage.id === state.ui.filters.stage);
    board.innerHTML = visibleStages.map((stage) => {
      const stageItems = items.filter((item) => item.stage === stage.id);
      return `<section class="kanban-column" data-stage="${stage.id}"><header class="kanban-column-head"><div><i class="stage-dot"></i><strong>${stage.label}</strong></div><span>${numberFa.format(stageItems.length)}</span></header><div class="kanban-cards">${stageItems.length ? stageItems.map(cardHtml).join("") : `<div class="column-empty">برای این مرحله موردی نیست</div>`}</div></section>`;
    }).join("");

    $$(".kanban-card", board).forEach((card) => {
      card.addEventListener("dragstart", (event) => {
        card.classList.add("dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", card.dataset.id);
      });
      card.addEventListener("dragend", () => card.classList.remove("dragging"));
    });

    $$(".kanban-column", board).forEach((column) => {
      column.addEventListener("dragover", (event) => { event.preventDefault(); column.classList.add("drag-over"); });
      column.addEventListener("dragleave", () => column.classList.remove("drag-over"));
      column.addEventListener("drop", (event) => {
        event.preventDefault();
        column.classList.remove("drag-over");
        const id = event.dataTransfer.getData("text/plain");
        if (state.tracker[id] && state.tracker[id].stage !== column.dataset.stage) updateTracker(id, { stage: column.dataset.stage }, `مرحله به «${stageLabel(column.dataset.stage)}» تغییر کرد`);
      });
    });
  }

  function optionsHtml(options, selected) {
    return options.map((option) => `<option value="${escapeAttribute(option.id)}" ${option.id === selected ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("");
  }

  function renderTable(items) {
    const tbody = $("#tracker-table-body");
    tbody.innerHTML = items.map((item) => {
      const compared = state.ui.compare.includes(item.id);
      return `<tr data-id="${escapeAttribute(item.id)}"><td class="table-title"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.organization || "بدون سازمان")}</small></td><td><span class="person-pill ${item.person === "arzoo" ? "arzoo" : ""}">${escapeHtml(personLabel(item.person))}</span></td><td><select class="inline-stage" data-inline="stage" aria-label="مرحله ${escapeAttribute(item.title)}">${optionsHtml(STAGES, item.stage)}</select></td><td><select class="inline-priority" data-inline="priority" aria-label="اولویت ${escapeAttribute(item.title)}">${Object.entries(PRIORITIES).map(([id, label]) => `<option value="${id}" ${id === item.priority ? "selected" : ""}>${label}</option>`).join("")}</select></td><td>${escapeHtml(effectiveDate(item) ? formatDate(effectiveDate(item)) : item.deadlineLabel || "—")}</td><td>${numberFa.format(Number(item.fit || 0))}٪</td><td><button class="mini-button ${compared ? "active" : ""}" type="button" data-action="compare">مقایسه</button> <button class="mini-button" type="button" data-action="edit">ویرایش</button></td></tr>`;
    }).join("");
  }

  function setView(view, persist = true) {
    const validView = view === "table" ? "table" : "kanban";
    state.ui.view = validView;
    $("#kanban-view").hidden = validView !== "kanban";
    $("#table-view").hidden = validView !== "table";
    $$('[data-view]').forEach((button) => {
      const active = button.dataset.view === validView;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (persist) saveState("نمایش ذخیره شد");
  }

  function renderCompareTray() {
    const selected = state.ui.compare.map(composedItem).filter(Boolean).slice(0, 3);
    state.ui.compare = selected.map((item) => item.id);
    const tray = $("#compare-tray");
    tray.hidden = selected.length === 0;
    $("#compare-summary").textContent = `${numberFa.format(selected.length)} از ۳ انتخاب شده`;
    $("#compare-chips").innerHTML = selected.map((item) => `<span class="compare-chip"><span>${escapeHtml(item.title)}</span><button type="button" data-remove-compare="${escapeAttribute(item.id)}" aria-label="حذف ${escapeAttribute(item.title)} از مقایسه">×</button></span>`).join("");
    $("#open-compare").disabled = selected.length < 2;
  }

  function toggleCompare(id) {
    const selected = state.ui.compare;
    if (selected.includes(id)) state.ui.compare = selected.filter((itemId) => itemId !== id);
    else if (selected.length >= 3) {
      toast("برای مقایسه حداکثر سه فرصت انتخاب کنید.", "error");
      return;
    } else state.ui.compare = [...selected, id];
    saveState("انتخاب مقایسه ذخیره شد");
    renderTracker();
    renderCompareTray();
  }

  function openCompareDialog() {
    const items = state.ui.compare.map(composedItem).filter(Boolean).slice(0, 3);
    if (items.length < 2) return;
    $("#compare-grid").innerHTML = items.map((item) => {
      const source = safeUrl(item.url);
      return `<article class="compare-card"><div><span class="person-pill ${item.person === "arzoo" ? "arzoo" : ""}">${escapeHtml(personLabel(item.person))}</span> <span class="priority-pill ${item.priority}">${PRIORITIES[item.priority]}</span></div><h3>${escapeHtml(item.title)}</h3><p class="compare-org">${escapeHtml(item.organization || "—")}</p><div class="compare-score">${numberFa.format(Number(item.fit || 0))}٪</div><div class="compare-facts"><div class="compare-fact"><small>مرحله</small><strong>${stageLabel(item.stage)}</strong></div><div class="compare-fact"><small>ددلاین / موعد</small><strong>${escapeHtml(effectiveDate(item) ? formatDate(effectiveDate(item)) : item.deadlineLabel || "بدون تاریخ")}</strong></div><div class="compare-fact"><small>نوع و مکان</small><strong>${escapeHtml(`${typeLabels[item.type] || item.type} · ${[item.country, item.location].filter(Boolean).join(" / ") || "بین‌المللی"}`)}</strong></div><div class="compare-fact"><small>حمایت مالی</small><strong>${escapeHtml(item.fundingLabel || item.funding || "نامشخص")}</strong></div><div class="compare-fact"><small>اقدام بعدی</small><strong>${escapeHtml(item.nextAction || "ثبت نشده")}</strong></div></div>${item.notes ? `<p class="compare-notes">${escapeHtml(item.notes)}</p>` : ""}${source ? `<a class="secondary-button" href="${escapeAttribute(source)}" target="_blank" rel="noreferrer">منبع رسمی ↗</a>` : ""}</article>`;
    }).join("");
    openDialog("compare-dialog");
  }

  function renderTimeline() {
    const range = state.ui.timelineRange || "90";
    const maxDays = range === "all" ? Infinity : Number(range);
    const items = allItems();
    const dated = items.filter((item) => effectiveDate(item)).map((item) => ({ item, date: dateFromIso(effectiveDate(item)), days: daysBetween(new Date(), effectiveDate(item)) })).filter((entry) => entry.date && (maxDays === Infinity || (entry.days !== null && entry.days <= maxDays))).sort((a, b) => a.date - b.date);
    const undated = items.filter((item) => !effectiveDate(item) && !["rejected", "archived"].includes(item.stage));
    const groups = new Map();
    dated.forEach((entry) => {
      const key = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, "0")}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    });

    $("#deadline-timeline").innerHTML = groups.size ? Array.from(groups.entries()).map(([, entries]) => {
      const date = entries[0].date;
      return `<section class="timeline-month"><h3 class="timeline-month-title">${monthFa.format(date)}</h3><div class="timeline-items">${entries.map(({ item, date: dueDate, days }) => {
        const stateClass = days !== null && days < 0 ? "past" : days !== null && days <= 14 ? "urgent" : "";
        const daysText = days === null ? "—" : days < 0 ? `${numberFa.format(Math.abs(days))} روز گذشته` : days === 0 ? "امروز" : `${numberFa.format(days)} روز مانده`;
        return `<button class="timeline-item ${stateClass}" type="button" data-open-id="${escapeAttribute(item.id)}"><span class="timeline-date"><strong>${numberFa.format(dueDate.getDate())}</strong><small>${shortMonthFa.format(dueDate)}</small></span><span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.organization)} · ${personLabel(item.person)} · ${stageLabel(item.stage)}</p></span><span class="days-left">${daysText}</span></button>`;
      }).join("")}</div></section>`;
    }).join("") : `<div class="empty-panel"><span>◷</span><h3>در این بازه ددلاینی ثبت نشده است</h3></div>`;

    $("#no-deadline-count").textContent = numberFa.format(undated.length);
    $("#no-deadline-list").innerHTML = undated.slice(0, 10).map((item) => `<button class="mini-list-item" type="button" data-open-id="${escapeAttribute(item.id)}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.deadlineLabel || "پذیرش مستمر")} · ${personLabel(item.person)}</span></button>`).join("") || `<div class="empty-compact">همه فرصت‌های فعال تاریخ دارند.</div>`;
  }

  function ensureDocumentState(person) {
    if (!isPlainObject(state.documents[person.id])) state.documents[person.id] = {};
    person.documents.forEach((documentItem) => {
      if (typeof state.documents[person.id][documentItem.id] !== "boolean") state.documents[person.id][documentItem.id] = false;
    });
  }

  function renderDocuments() {
    if (!people.some((person) => person.id === activeDocumentPerson)) activeDocumentPerson = people[0]?.id || "mohammad";
    const person = personConfig(activeDocumentPerson);
    ensureDocumentState(person);
    $$('[data-person]', $("#document-person-tabs")).forEach((button) => {
      const active = button.dataset.person === activeDocumentPerson;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const done = person.documents.filter((item) => state.documents[person.id][item.id]).length;
    const total = person.documents.length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    $("#document-person-kicker").textContent = person.kicker || "DOCUMENT CHECKLIST";
    $("#document-person-name").textContent = person.label;
    $("#document-progress-percent").textContent = `${numberFa.format(percent)}٪`;
    $("#document-progress-bar").style.width = `${percent}%`;
    $(".progress-track").setAttribute("aria-valuenow", String(percent));
    $("#document-progress-note").textContent = `${numberFa.format(done)} مورد از ${numberFa.format(total)} آماده است. وضعیت فایل واقعی در دستگاه خودتان باقی می‌ماند.`;
    $("#document-checklist").innerHTML = person.documents.map((documentItem) => `<label class="document-row"><input type="checkbox" data-document-id="${escapeAttribute(documentItem.id)}" ${state.documents[person.id][documentItem.id] ? "checked" : ""}><span><strong>${escapeHtml(documentItem.label)}</strong><small>${escapeHtml(documentItem.description)}</small></span>${documentItem.required ? `<span class="document-required">ضروری</span>` : ""}</label>`).join("");
  }

  function renderKitOptions() {
    const personId = $("#kit-person").value || people[0]?.id || "mohammad";
    const select = $("#kit-opportunity");
    const previous = select.value;
    const relevant = allItems().filter((item) => item.person === personId && item.stage !== "archived").sort((a, b) => Number(b.fit || 0) - Number(a.fit || 0));
    select.innerHTML = relevant.map((item) => `<option value="${escapeAttribute(item.id)}">${escapeHtml(item.title)} — ${numberFa.format(Number(item.fit || 0))}٪</option>`).join("");
    if (relevant.some((item) => item.id === previous)) select.value = previous;
  }

  function renderBackupStatus() {
    $("#last-backup").textContent = state.lastBackupAt ? `آخرین پشتیبان: ${dateFa.format(new Date(state.lastBackupAt))}` : "هنوز پشتیبان نگرفته‌اید";
  }

  function renderAll() {
    rebuildOpportunityIndex();
    renderMetrics();
    renderPipeline();
    renderActionQueue();
    renderTracker();
    renderCompareTray();
    renderTimeline();
    renderDocuments();
    renderKitOptions();
    renderBackupStatus();
  }

  function clearFilters() {
    state.ui.filters = { query: "", person: "all", stage: "all", priority: "all", type: "all" };
    syncFilterControls();
    saveState("فیلترها پاک شد");
    renderTracker();
  }

  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    document.body.classList.add("dialog-open");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    if (!$$('dialog[open]').length) document.body.classList.remove("dialog-open");
  }

  function fillOpportunityForm(item) {
    const isNew = !item;
    $("#opportunity-dialog-kicker").textContent = isNew ? "MANUAL OPPORTUNITY" : item.manual ? "EDIT MANUAL OPPORTUNITY" : "EDIT TRACKER DETAILS";
    $("#opportunity-dialog-title").textContent = isNew ? "افزودن فرصت دستی" : "ویرایش فرصت";
    $("#opportunity-id").value = item?.id || "";
    $("#opportunity-person").value = item?.person || "mohammad";
    $("#opportunity-stage").value = item?.stage || "saved";
    $("#opportunity-title").value = item?.title || "";
    $("#opportunity-organization").value = item?.organization || "";
    $("#opportunity-type").value = item?.type || "job";
    $("#opportunity-priority").value = item?.priority || "medium";
    $("#opportunity-country").value = item?.country || "";
    $("#opportunity-location").value = item?.location || "";
    $("#opportunity-deadline-date").value = item?.deadlineDate || "";
    $("#opportunity-deadline-label").value = item?.deadlineLabel || "";
    $("#opportunity-due-date").value = item?.dueDate || "";
    $("#opportunity-applied-date").value = item?.appliedDate || "";
    $("#opportunity-fit").value = item?.fit ?? 50;
    $("#opportunity-url").value = item?.url || "";
    $("#opportunity-next-action").value = item?.nextAction || "";
    $("#opportunity-notes").value = item?.notes || "";
    $("#delete-manual-opportunity").hidden = !item?.manual;
    openDialog("opportunity-dialog");
    setTimeout(() => $("#opportunity-title")?.focus(), 60);
  }

  function openOpportunity(id) {
    const item = composedItem(String(id));
    if (!item) {
      toast("این شناسه فرصت در داده‌های فعلی پیدا نشد.", "error");
      return false;
    }
    fillOpportunityForm(item);
    return true;
  }

  function saveOpportunityForm(event) {
    event.preventDefault();
    const existingId = $("#opportunity-id").value;
    const deadlineDate = $("#opportunity-deadline-date").value;
    const data = {
      person: $("#opportunity-person").value,
      title: $("#opportunity-title").value.trim(),
      organization: $("#opportunity-organization").value.trim(),
      type: $("#opportunity-type").value,
      country: $("#opportunity-country").value.trim(),
      location: $("#opportunity-location").value.trim(),
      deadlineDate,
      deadlineLabel: $("#opportunity-deadline-label").value.trim() || (deadlineDate ? formatDate(deadlineDate) : "بدون ددلاین اعلام‌شده"),
      fit: Math.max(0, Math.min(100, Number($("#opportunity-fit").value || 0))),
      url: safeUrl($("#opportunity-url").value)
    };
    const trackerChanges = {
      stage: $("#opportunity-stage").value,
      priority: $("#opportunity-priority").value,
      dueDate: $("#opportunity-due-date").value,
      appliedDate: $("#opportunity-applied-date").value,
      nextAction: $("#opportunity-next-action").value.trim(),
      notes: $("#opportunity-notes").value.trim()
    };
    if (!data.title || !data.organization) {
      toast("عنوان و سازمان را وارد کنید.", "error");
      return;
    }

    if (existingId) {
      const current = composedItem(existingId);
      if (!current) return;
      if (current.manual) state.manual[existingId] = { ...state.manual[existingId], ...data, manual: true };
      else state.tracker[existingId].overrides = { ...(state.tracker[existingId].overrides || {}), ...data };
      state.tracker[existingId] = { ...state.tracker[existingId], ...trackerChanges, updatedAt: new Date().toISOString() };
      if (["applied", "interview", "offer"].includes(trackerChanges.stage) && !state.tracker[existingId].appliedDate) state.tracker[existingId].appliedDate = localIsoDate();
      toast("تغییرات فرصت ذخیره شد.");
    } else {
      const id = uid("manual");
      state.manual[id] = { id, ...data, manual: true, status: "local", funding: "", fundingLabel: "", skills: [], summary: "فرصت ثبت‌شده به‌صورت دستی در فضای کاری خصوصی.", requirements: [], strengths: [], gaps: [], fitReason: "امتیاز و ارزیابی دستی" };
      state.tracker[id] = { ...seedTrackerRecord(state.manual[id]), ...trackerChanges, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      if (["applied", "interview", "offer"].includes(trackerChanges.stage) && !state.tracker[id].appliedDate) state.tracker[id].appliedDate = localIsoDate();
      toast("فرصت دستی اضافه شد.");
    }
    saveState();
    closeDialog("opportunity-dialog");
    renderAll();
  }

  function deleteManualOpportunity() {
    const id = $("#opportunity-id").value;
    const item = composedItem(id);
    if (!item?.manual) return;
    askConfirm("حذف فرصت دستی", `«${item.title}» و تمام یادداشت‌های آن حذف می‌شود.`, () => {
      delete state.manual[id];
      delete state.tracker[id];
      state.ui.compare = state.ui.compare.filter((itemId) => itemId !== id);
      saveState("فرصت دستی حذف شد");
      closeDialog("opportunity-dialog");
      renderAll();
      toast("فرصت دستی حذف شد.");
    });
  }

  function askConfirm(title, message, callback) {
    pendingConfirmation = callback;
    $("#confirm-title").textContent = title;
    $("#confirm-message").textContent = message;
    openDialog("confirm-dialog");
  }

  function kitContext(item, person) {
    const requirements = Array.isArray(item.requirements) ? item.requirements.join("; ") : "Not listed";
    const strengths = Array.isArray(item.strengths) ? item.strengths.join("; ") : "Use only verified profile evidence";
    const gaps = Array.isArray(item.gaps) ? item.gaps.join("; ") : "No explicit gap analysis";
    return [
      `CANDIDATE: ${person.label}`,
      `CANDIDATE PROFILE: ${person.profile}`,
      `TARGET OPPORTUNITY: ${item.title}`,
      `ORGANIZATION: ${item.organization}`,
      `TYPE / LOCATION: ${typeLabels[item.type] || item.type} / ${[item.country, item.location].filter(Boolean).join(" / ") || "Not specified"}`,
      `FIT SCORE: ${item.fit || 0}/100`,
      `DEADLINE: ${item.deadlineLabel || effectiveDate(item) || "Not announced"}`,
      `OFFICIAL SUMMARY: ${item.summary || "Not available"}`,
      `KEY REQUIREMENTS: ${requirements}`,
      `VERIFIED STRENGTHS: ${strengths}`,
      `KNOWN GAPS: ${gaps}`,
      `PRIVATE TRACKER NOTES: ${item.notes || "None"}`,
      `NEXT ACTION: ${item.nextAction || "Not set"}`,
      `SOURCE URL: ${item.url || "Not provided"}`
    ].join("\n");
  }

  function generatePrompt(event) {
    event.preventDefault();
    const item = composedItem($("#kit-opportunity").value);
    const person = personConfig($("#kit-person").value);
    if (!item) {
      toast("ابتدا یک فرصت هدف انتخاب کنید.", "error");
      return;
    }
    const type = $("#kit-type").value;
    const language = $("#kit-language").value;
    const tone = $("#kit-tone").value;
    const extra = $("#kit-extra").value.trim();
    const context = kitContext(item, person);
    const sharedRules = `Write the final deliverable in ${language}. Use a ${tone} tone. Never invent degrees, publications, metrics, employment, awards, language scores, visa status, or technical experience. Mark any missing fact with [NEEDS INPUT]. Prioritize evidence and language from the supplied context. Make the result specific to the organization and role, not a generic template.`;
    const prompts = {
      cv: `Act as an expert international CV editor and applicant-tracking-system reviewer. Tailor the candidate's CV strategy to the target opportunity.\n\n${sharedRules}\n\nDeliver:\n1) a 2-3 line targeted professional summary;\n2) a prioritized keyword map from the requirements;\n3) rewritten bullet suggestions using action + method + outcome, without fabricating outcomes;\n4) recommended project order and what evidence to link;\n5) a gap/risk section;\n6) a final ATS checklist;\n7) questions needed before producing a final CV.\n\nCONTEXT\n${context}`,
      letter: `Act as a senior admissions and hiring writer. Draft a highly tailored ${item.type === "phd" || item.type === "masters" ? "statement of purpose / motivation letter" : "cover letter"} for this opportunity.\n\n${sharedRules}\n\nUse a clear narrative: opening fit thesis, 2-3 evidence paragraphs, explicit connection to the project/organization, honest treatment of gaps, and a concise closing. Avoid clichés, exaggerated passion, and unsupported claims. Keep the main draft between 600-900 words for academic applications or 350-500 words for jobs unless the source imposes another limit. After the draft, provide a 5-item verification checklist and list every placeholder.\n\nCONTEXT\n${context}`,
      email: `Act as an expert in concise professional outreach. Draft an email to the relevant professor, principal investigator, recruiter, residency director, gallery, or agency for this opportunity.\n\n${sharedRules}\n\nProvide three subject-line options and one email of 130-190 words. The email must establish relevance in the first two sentences, mention 2-3 verified matching facts, ask one clear question or make one clear request, and close with a compact attachment list. Do not repeat the full CV. Also provide a 70-word follow-up email to send after 7-10 days.\n\nCONTEXT\n${context}`,
      interview: `Act as an interview coach for a selective international ${item.type === "phd" || item.type === "masters" ? "academic" : "professional"} application.\n\n${sharedRules}\n\nCreate:\n1) the 12 most probable interview questions;\n2) answer frameworks grounded only in the context;\n3) four technical/research deep-dive questions;\n4) three difficult gap or credibility questions and honest ways to answer;\n5) a 90-second introduction;\n6) five intelligent questions for the panel;\n7) a 48-hour preparation plan;\n8) a red-team section explaining why the application could be rejected.\n\nCONTEXT\n${context}`
    };
    const output = `${prompts[type]}${extra ? `\n\nADDITIONAL USER INSTRUCTION\n${extra}` : ""}`;
    $("#prompt-output").value = output;
    $("#prompt-title").textContent = `${$("#kit-type").selectedOptions[0].textContent} · ${item.title}`;
    $("#prompt-word-count").textContent = `${numberFa.format(output.trim().split(/\s+/).filter(Boolean).length)} واژه`;
    $("#copy-prompt").disabled = false;
    $("#download-prompt").disabled = false;
    toast("پرامپت محلی ساخته شد؛ پیش از استفاده اطلاعات را بازبینی کنید.");
  }

  async function copyPrompt() {
    const output = $("#prompt-output");
    if (!output.value) return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(output.value);
      else {
        output.focus(); output.select(); document.execCommand("copy"); output.setSelectionRange(0, 0);
      }
      toast("پرامپت کپی شد.");
    } catch (_error) {
      output.focus(); output.select();
      toast("کپی خودکار ممکن نبود؛ متن انتخاب شد.", "error");
    }
  }

  function downloadBlob(content, filename, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function safeFilename(value) {
    return latinDigits(normalize(value)).replace(/[^a-z0-9\u0600-\u06ff]+/gi, "-").replace(/^-|-$/g, "").slice(0, 70) || "application";
  }

  function downloadPrompt() {
    const output = $("#prompt-output").value;
    if (!output) return;
    const item = composedItem($("#kit-opportunity").value);
    downloadBlob(`\ufeff${output}`, `apply-prompt-${safeFilename(item?.title)}.txt`, "text/plain;charset=utf-8");
    toast("فایل پرامپت دانلود شد.");
  }

  function exportJson() {
    state.lastBackupAt = new Date().toISOString();
    saveState("پشتیبان ساخته شد");
    const payload = {
      app: "apply-compass-workspace",
      storageKey: STORAGE_KEY,
      version: VERSION,
      exportedAt: state.lastBackupAt,
      seededOpportunityCount: seedOpportunities.length,
      state
    };
    downloadBlob(`\ufeff${JSON.stringify(payload, null, 2)}`, `apply-compass-backup-${localIsoDate()}.json`, "application/json;charset=utf-8");
    renderBackupStatus();
    toast("پشتیبان کامل JSON دانلود شد.");
  }

  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function exportCsv() {
    const headers = ["id", "person", "title", "organization", "type", "country", "location", "stage", "priority", "fit", "official_deadline", "due_date", "applied_date", "next_action", "notes", "url"];
    const rows = allItems().map((item) => [item.id, personLabel(item.person), item.title, item.organization, typeLabels[item.type] || item.type, item.country || "", item.location || "", stageLabel(item.stage), PRIORITIES[item.priority], item.fit || 0, item.deadlineLabel || "", effectiveDate(item), item.appliedDate || "", item.nextAction || "", item.notes || "", item.url || ""]);
    const csv = `\ufeff${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    downloadBlob(csv, `apply-compass-tracker-${localIsoDate()}.csv`, "text/csv;charset=utf-8");
    toast("خروجی CSV دانلود شد.");
  }

  function icsEscape(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }

  function exportIcs() {
    const dated = allItems().filter((item) => effectiveDate(item));
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const events = dated.map((item) => {
      const eventDate = effectiveDate(item);
      const start = eventDate.replace(/-/g, "");
      const end = addDaysIso(eventDate, 1).replace(/-/g, "");
      const description = `${personLabel(item.person)} | ${stageLabel(item.stage)} | ${item.nextAction || ""}${item.notes ? `\nNotes: ${item.notes}` : ""}`;
      return ["BEGIN:VEVENT", `UID:${icsEscape(item.id)}@apply-compass.local`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`, `SUMMARY:${icsEscape(`اپلای: ${item.title}`)}`, `DESCRIPTION:${icsEscape(description)}`, item.url ? `URL:${icsEscape(item.url)}` : "", "END:VEVENT"].filter(Boolean).join("\r\n");
    });
    const calendar = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Apply Compass//Private Workspace//FA", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:ددلاین‌های اپلای", ...events, "END:VCALENDAR"].join("\r\n");
    downloadBlob(calendar, `apply-compass-deadlines-${localIsoDate()}.ics`, "text/calendar;charset=utf-8");
    toast(`${numberFa.format(dated.length)} موعد به تقویم صادر شد.`);
  }

  async function importJsonFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text.replace(/^\ufeff/, ""));
      const candidate = payload?.state || payload;
      if (!isPlainObject(candidate) || !isPlainObject(candidate.tracker)) throw new Error("invalid");
      askConfirm("ورود فایل پشتیبان", "داده فعلی این فضای کاری با محتوای فایل جایگزین می‌شود. سایر localStorageهای سایت پاک نمی‌شوند.", () => {
        state = ensureState(candidate);
        activeDocumentPerson = state.ui.documentPerson || "mohammad";
        saveState("پشتیبان وارد شد");
        syncFilterControls();
        renderAll();
        toast("پشتیبان با موفقیت وارد شد.");
      });
    } catch (_error) {
      toast("فایل JSON معتبرِ فضای کاری نیست.", "error");
    } finally {
      $("#import-json").value = "";
    }
  }

  function resetWorkspace() {
    askConfirm("بازنشانی داده Tracker", "تمام مراحل، یادداشت‌ها، موارد دستی و چک‌لیست این فضای کاری پاک می‌شود. داده پنل اصلی و تنظیم پوسته دست‌نخورده می‌ماند.", () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_error) { /* no-op */ }
      state = ensureState(null);
      activeDocumentPerson = "mohammad";
      syncFilterControls();
      renderAll();
      toast("فضای کاری به ۳۸ فرصت اولیه بازنشانی شد.");
    });
  }

  function handleQueryParameters() {
    const params = new URLSearchParams(window.location.search);
    const compareParam = params.get("compare");
    if (compareParam) {
      const ids = compareParam.split(",").map((id) => id.trim()).filter((id) => opportunitiesById.has(id)).slice(0, 3);
      if (ids.length) {
        state.ui.compare = ids;
        saveState("مقایسه از لینک بارگذاری شد");
        renderTracker();
        renderCompareTray();
        if (ids.length >= 2) setTimeout(openCompareDialog, 80);
      }
    }
    const addParam = params.get("add");
    if (addParam) {
      const id = addParam.trim();
      if (opportunitiesById.has(id)) {
        if (!state.tracker[id]) state.tracker[id] = seedTrackerRecord(opportunitiesById.get(id));
        saveState("فرصت به Tracker افزوده شد");
        setTimeout(() => openOpportunity(id), 120);
      } else toast("فرصت معرفی‌شده در لینک پیدا نشد.", "error");
    }
  }

  function setupNavigation() {
    const links = $$(".workspace-nav a");
    const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`));
      }, { rootMargin: "-20% 0px -65% 0px", threshold: [0, .1, .5] });
      sections.forEach((section) => observer.observe(section));
    }
    links.forEach((link) => link.addEventListener("click", closeMobileMenu));
  }

  function openMobileMenu() {
    $("#workspace-sidebar").classList.add("open");
    $("#mobile-overlay").hidden = false;
    $("#mobile-menu").setAttribute("aria-expanded", "true");
  }

  function closeMobileMenu() {
    $("#workspace-sidebar").classList.remove("open");
    $("#mobile-overlay").hidden = true;
    $("#mobile-menu").setAttribute("aria-expanded", "false");
  }

  function setupEvents() {
    $("#theme-toggle").addEventListener("click", () => setTheme(document.body.classList.contains("dark") ? "light" : "dark"));
    $("#mobile-menu").addEventListener("click", () => $("#workspace-sidebar").classList.contains("open") ? closeMobileMenu() : openMobileMenu());
    $("#mobile-overlay").addEventListener("click", closeMobileMenu);
    $("#dismiss-privacy").addEventListener("click", () => { state.ui.privacyDismissed = true; $(".privacy-notice").hidden = true; saveState("تنظیم حریم خصوصی ذخیره شد"); });
    $("#new-opportunity").addEventListener("click", () => fillOpportunityForm(null));
    $("#new-opportunity-top").addEventListener("click", () => fillOpportunityForm(null));
    $("#opportunity-form").addEventListener("submit", saveOpportunityForm);
    $("#delete-manual-opportunity").addEventListener("click", deleteManualOpportunity);
    $$('[data-close-dialog]').forEach((button) => button.addEventListener("click", () => closeDialog(button.dataset.closeDialog)));
    $$('dialog').forEach((dialog) => dialog.addEventListener("close", () => { if (!$$('dialog[open]').length) document.body.classList.remove("dialog-open"); }));
    $("#confirm-action").addEventListener("click", (event) => {
      event.preventDefault();
      const callback = pendingConfirmation;
      pendingConfirmation = null;
      closeDialog("confirm-dialog");
      if (typeof callback === "function") callback();
    });

    let filterTimer;
    $("#tracker-search").addEventListener("input", () => {
      clearTimeout(filterTimer);
      filterTimer = setTimeout(() => { readFilters(); renderTracker(); }, 180);
    });
    ["#filter-person", "#filter-stage", "#filter-priority", "#filter-type"].forEach((selector) => $(selector).addEventListener("change", () => { readFilters(); renderTracker(); }));
    $("#clear-filters").addEventListener("click", clearFilters);
    $("#tracker-empty").addEventListener("click", (event) => { if (event.target.closest('[data-action="clear-filters"]')) clearFilters(); });
    $$('[data-view]').forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));

    $("#kanban-view").addEventListener("click", (event) => {
      const card = event.target.closest(".kanban-card");
      if (!card) return;
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action === "compare") toggleCompare(card.dataset.id);
      else if (action === "edit") openOpportunity(card.dataset.id);
      else if (!event.target.closest("button")) openOpportunity(card.dataset.id);
    });
    $("#tracker-table-body").addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-id]");
      if (!row) return;
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action === "compare") toggleCompare(row.dataset.id);
      else if (action === "edit") openOpportunity(row.dataset.id);
    });
    $("#tracker-table-body").addEventListener("change", (event) => {
      const row = event.target.closest("tr[data-id]");
      if (!row || !event.target.dataset.inline) return;
      updateTracker(row.dataset.id, { [event.target.dataset.inline]: event.target.value });
    });
    $("#action-queue").addEventListener("click", (event) => { const button = event.target.closest("[data-open-id]"); if (button) openOpportunity(button.dataset.openId); });
    $("#deadline-timeline").addEventListener("click", (event) => { const button = event.target.closest("[data-open-id]"); if (button) openOpportunity(button.dataset.openId); });
    $("#no-deadline-list").addEventListener("click", (event) => { const button = event.target.closest("[data-open-id]"); if (button) openOpportunity(button.dataset.openId); });

    $("#compare-chips").addEventListener("click", (event) => { const button = event.target.closest("[data-remove-compare]"); if (button) toggleCompare(button.dataset.removeCompare); });
    $("#clear-compare").addEventListener("click", () => { state.ui.compare = []; saveState("مقایسه پاک شد"); renderTracker(); renderCompareTray(); });
    $("#open-compare").addEventListener("click", openCompareDialog);

    $("#timeline-range").addEventListener("change", (event) => { state.ui.timelineRange = event.target.value; saveState("بازه زمانی ذخیره شد"); renderTimeline(); });
    $("#document-person-tabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-person]");
      if (!button) return;
      activeDocumentPerson = button.dataset.person;
      state.ui.documentPerson = activeDocumentPerson;
      saveState("پروفایل مدارک ذخیره شد");
      renderDocuments();
    });
    $("#document-checklist").addEventListener("change", (event) => {
      const input = event.target.closest("[data-document-id]");
      if (!input) return;
      const person = personConfig(activeDocumentPerson);
      ensureDocumentState(person);
      state.documents[person.id][input.dataset.documentId] = input.checked;
      saveState("چک‌لیست مدارک ذخیره شد");
      renderDocuments();
    });

    $("#kit-person").addEventListener("change", renderKitOptions);
    $("#kit-form").addEventListener("submit", generatePrompt);
    $("#copy-prompt").addEventListener("click", copyPrompt);
    $("#download-prompt").addEventListener("click", downloadPrompt);
    $("#export-json").addEventListener("click", exportJson);
    $("#export-csv").addEventListener("click", exportCsv);
    $("#export-ics").addEventListener("click", exportIcs);
    $("#import-json").addEventListener("change", (event) => importJsonFile(event.target.files?.[0]));
    $("#reset-workspace").addEventListener("click", resetWorkspace);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && $("#workspace-sidebar").classList.contains("open")) closeMobileMenu(); });
  }

  function exposeApi() {
    window.ApplyCompassWorkspace = Object.freeze({
      version: VERSION,
      storageKey: STORAGE_KEY,
      addOpportunity(id) {
        const key = String(id || "");
        const source = opportunitiesById.get(key);
        if (!source) return false;
        if (!state.tracker[key]) state.tracker[key] = seedTrackerRecord(source);
        saveState("فرصت به Tracker افزوده شد");
        renderAll();
        return true;
      },
      openOpportunity(id) { return openOpportunity(String(id || "")); },
      compare(ids) {
        const valid = (Array.isArray(ids) ? ids : String(ids || "").split(",")).map(String).filter((id) => opportunitiesById.has(id)).slice(0, 3);
        state.ui.compare = valid;
        saveState("مقایسه تنظیم شد");
        renderTracker(); renderCompareTray();
        if (valid.length >= 2) openCompareDialog();
        return valid;
      },
      exportState() { return structuredCloneSafe(state); },
      getState() { return structuredCloneSafe(state); }
    });
  }

  function initialize() {
    state = loadState();
    people = resolvePeopleConfig();
    activeDocumentPerson = state.ui.documentPerson || people[0]?.id || "mohammad";
    setTheme(initialTheme());
    rebuildOpportunityIndex();
    populateStaticControls();
    syncFilterControls();
    if (state.ui.privacyDismissed) $(".privacy-notice").hidden = true;
    setupEvents();
    setupNavigation();
    renderAll();
    exposeApi();
    saveState("ذخیره خودکار فعال");
    handleQueryParameters();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
