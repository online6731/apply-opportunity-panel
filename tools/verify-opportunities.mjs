#!/usr/bin/env node

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(SCRIPT_DIR, "..");
const DATA_FILE = process.env.OPPORTUNITY_DATA_FILE ? resolve(process.cwd(), process.env.OPPORTUNITY_DATA_FILE) : resolve(ROOT_DIR, "data/opportunities.js");
const REPORT_DIR = process.env.OPPORTUNITY_REPORT_DIR ? resolve(process.cwd(), process.env.OPPORTUNITY_REPORT_DIR) : resolve(ROOT_DIR, "reports");
const JSON_REPORT = resolve(REPORT_DIR, "opportunity-health.json");
const MARKDOWN_REPORT = resolve(REPORT_DIR, "opportunity-health.md");

const REQUEST_TIMEOUT_MS = boundedInteger(process.env.OPPORTUNITY_TIMEOUT_MS, 10_000, 1_000, 30_000);
const CONCURRENCY = boundedInteger(process.env.OPPORTUNITY_CONCURRENCY, 5, 1, 10);
const USER_AGENT = "apply-opportunity-panel-link-check/1.0 (+https://github.com/online6731/apply-opportunity-panel)";
const REQUIRED_STRING_FIELDS = [
  "id", "person", "type", "title", "organization", "country", "location",
  "status", "deadlineLabel", "funding", "fundingLabel", "languageVisa",
  "summary", "fitReason", "nextStep", "url", "verified"
];
const REQUIRED_ARRAY_FIELDS = ["skills", "requirements", "strengths", "gaps"];
const VALID_PERSONS = new Set(["mohammad", "arzoo"]);
const VALID_STATUSES = new Set(["open", "rolling", "upcoming"]);
const VALID_TYPES = new Set(["job", "phd", "fellowship", "masters", "residency", "competition", "modeling", "business"]);
const VALID_FUNDING = new Set(["funded", "salary", "self-funded"]);
const VALID_URGENCY = new Set(["normal", "high"]);
const PERSIAN_MONTHS = new Map([
  ["ژانویه", 1], ["فوریه", 2], ["مارس", 3], ["آوریل", 4],
  ["مه", 5], ["می", 5], ["ژوئن", 6], ["ژوئیه", 7], ["اوت", 8],
  ["سپتامبر", 9], ["اکتبر", 10], ["نوامبر", 11], ["دسامبر", 12]
]);

function boundedInteger(raw, fallback, minimum, maximum) {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isInteger(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

function isPrivateIPv4(address) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b, c] = parts;
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) || a >= 224;
}

function isPrivateIPv6(address) {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (/^(?:f[cd]|fe[89ab]|ff)/.test(normalized) || normalized.startsWith("2001:db8:")) return true;
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice(7);
    return isIP(mapped) !== 4 || isPrivateIPv4(mapped);
  }
  return false;
}

function assertSafeNetworkURL(value) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error(`unsafe URL protocol: ${url.protocol}`);
  if (url.username || url.password) throw new Error("URL credentials are not allowed");

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error(`unsafe URL hostname: ${hostname || "empty"}`);
  }
  if (isIP(hostname) === 4 && isPrivateIPv4(hostname)) throw new Error(`private IPv4 target is not allowed: ${hostname}`);
  if (isIP(hostname) === 6 && isPrivateIPv6(hostname)) {
    throw new Error(`private IPv6 target is not allowed: ${hostname}`);
  }
  return url;
}

async function assertPublicResolution(url) {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(hostname)) return;

  const records = await Promise.race([
    lookup(hostname, { all: true, verbatim: true }),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`DNS lookup timeout for ${hostname}`)), Math.min(5_000, REQUEST_TIMEOUT_MS)))
  ]);
  if (!records.length) throw new Error(`DNS returned no addresses for ${hostname}`);
  for (const record of records) {
    if ((record.family === 4 && isPrivateIPv4(record.address)) || (record.family === 6 && isPrivateIPv6(record.address))) {
      throw new Error(`private DNS target is not allowed for ${hostname}`);
    }
  }
}

function extractJsonArray(source) {
  const assignment = /(?:^|\n)\s*window\.OPPORTUNITIES\s*=\s*/g;
  const match = assignment.exec(source);
  if (!match) throw new Error("Could not find the window.OPPORTUNITIES assignment.");

  const start = match.index + match[0].length;
  if (source[start] !== "[") throw new Error("window.OPPORTUNITIES must be assigned a JSON array literal.");

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        const remainder = source.slice(index + 1).trim();
        if (!/^;?(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*(?:\n|$))*$/.test(remainder)) {
          throw new Error("Unexpected executable content follows the opportunity array.");
        }
        return source.slice(start, index + 1);
      }
    }
  }
  throw new Error("The opportunity JSON array is not closed.");
}

function validateStructure(opportunities) {
  const errors = [];
  if (!Array.isArray(opportunities)) return ["OPPORTUNITIES is not an array."];
  if (opportunities.length === 0) errors.push("OPPORTUNITIES must contain at least one item.");

  const ids = new Map();
  opportunities.forEach((item, index) => {
    const label = `item ${index + 1}${item?.id ? ` (${item.id})` : ""}`;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push(`${label}: must be an object.`);
      return;
    }

    for (const field of REQUIRED_STRING_FIELDS) {
      if (typeof item[field] !== "string" || item[field].trim() === "") {
        errors.push(`${label}: ${field} must be a non-empty string.`);
      }
    }
    for (const field of REQUIRED_ARRAY_FIELDS) {
      if (!Array.isArray(item[field]) || item[field].length === 0 || item[field].some((value) => typeof value !== "string" || value.trim() === "")) {
        errors.push(`${label}: ${field} must be a non-empty array of non-empty strings.`);
      }
    }

    if (typeof item.id === "string") {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) errors.push(`${label}: id must be lowercase kebab-case.`);
      if (ids.has(item.id)) errors.push(`${label}: duplicate id also used by item ${ids.get(item.id) + 1}.`);
      else ids.set(item.id, index);
    }
    if (!VALID_PERSONS.has(item.person)) errors.push(`${label}: unsupported person ${JSON.stringify(item.person)}.`);
    if (!VALID_STATUSES.has(item.status)) errors.push(`${label}: unsupported status ${JSON.stringify(item.status)}.`);
    if (!VALID_TYPES.has(item.type)) errors.push(`${label}: unsupported type ${JSON.stringify(item.type)}.`);
    if (!VALID_FUNDING.has(item.funding)) errors.push(`${label}: unsupported funding ${JSON.stringify(item.funding)}.`);
    if (item.urgency !== undefined && !VALID_URGENCY.has(item.urgency)) errors.push(`${label}: unsupported urgency ${JSON.stringify(item.urgency)}.`);
    if (!Number.isFinite(item.fit) || item.fit < 0 || item.fit > 100) errors.push(`${label}: fit must be a number from 0 to 100.`);

    if (typeof item.url === "string") {
      try {
        assertSafeNetworkURL(item.url);
      } catch (error) {
        errors.push(`${label}: url is invalid or unsafe (${String(error?.message || error)}).`);
      }
    }
    if (typeof item.verified === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(item.verified)) {
      errors.push(`${label}: verified must use YYYY-MM-DD.`);
    } else if (typeof item.verified === "string" && Number.isNaN(Date.parse(`${item.verified}T00:00:00Z`))) {
      errors.push(`${label}: verified is not a real calendar date.`);
    }

    const deadline = item.deadline;
    if (deadline !== undefined && deadline !== null && deadline !== "") {
      if (typeof deadline !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(deadline) || Number.isNaN(Date.parse(`${deadline}T23:59:59Z`))) {
        errors.push(`${label}: deadline, when present, must be a real YYYY-MM-DD date.`);
      }
    }
    if (item.status === "rolling" && /\d{4}-\d{2}-\d{2}/.test(String(deadline ?? ""))) {
      errors.push(`${label}: rolling opportunities must not have a fixed machine deadline.`);
    }
  });
  return errors;
}

function normalizeDigits(value) {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return String(value).replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persian.indexOf(digit);
    return String(persianIndex >= 0 ? persianIndex : arabic.indexOf(digit));
  });
}

function isoDate(year, month, day) {
  const value = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const date = new Date(`${value}T23:59:59Z`);
  return Number.isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day ? null : value;
}

function analyzeDeadline(item, today = utcDay()) {
  if (item.status === "rolling") return { result: "rolling", date: null, label: item.deadlineLabel };

  let date = typeof item.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.deadline) ? item.deadline : null;
  if (!date) {
    const normalized = normalizeDigits(item.deadlineLabel);
    const monthPattern = [...PERSIAN_MONTHS.keys()].join("|");
    const match = normalized.match(new RegExp(`(?:^|\\D)(\\d{1,2})\\s+(${monthPattern})\\s+(\\d{4})(?:\\D|$)`));
    if (match) date = isoDate(Number(match[3]), PERSIAN_MONTHS.get(match[2]), Number(match[1]));
  }

  if (!date) return { result: item.status === "upcoming" ? "upcoming" : "unknown", date: null, label: item.deadlineLabel };
  if (item.status === "upcoming") return { result: "upcoming", date, label: item.deadlineLabel };
  return { result: date < today ? "expired" : "active", date, label: item.deadlineLabel };
}

async function fetchWithTimeout(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let current = assertSafeNetworkURL(url);
    const redirects = [];
    for (let hop = 0; hop <= 5; hop += 1) {
      await assertPublicResolution(current);
      const response = await fetch(current, {
        method,
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": method === "HEAD" ? "*/*" : "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
          ...(method === "GET" ? { "Range": "bytes=0-1023" } : {})
        }
      });
      if (response.status < 300 || response.status >= 400 || !response.headers.get("location")) {
        return { response, redirects };
      }
      if (hop === 5) throw new Error("too many redirects");
      current = assertSafeNetworkURL(new URL(response.headers.get("location"), current).href);
      redirects.push(current.href);
      await response.body?.cancel();
    }
    throw new Error("redirect loop");
  } finally {
    clearTimeout(timer);
  }
}

function classify(status) {
  if (status >= 200 && status < 400) return "ok";
  if (status === 401 || status === 403 || status === 405 || status === 406 || status === 429) return "restricted";
  if (status === 404 || status === 410) return "broken";
  return status >= 500 ? "transient" : "warning";
}

async function checkURL(item) {
  const started = Date.now();
  const base = { id: item.id, title: item.title, sourceUrl: item.url };
  try {
    let method = "HEAD";
    let attempt = await fetchWithTimeout(item.url, method);
    let response = attempt.response;
    let redirects = attempt.redirects;
    if (response.status >= 400) {
      await response.body?.cancel();
      method = "GET";
      attempt = await fetchWithTimeout(item.url, method);
      response = attempt.response;
      redirects = attempt.redirects;
    }
    // Discard any bounded response body. We never execute or parse third-party content.
    await response.body?.cancel();
    return {
      ...base,
      result: classify(response.status),
      method,
      status: response.status,
      finalUrl: response.url || item.url,
      redirects,
      durationMs: Date.now() - started,
      error: null
    };
  } catch (error) {
    const timedOut = error?.name === "AbortError" || error?.name === "TimeoutError";
    const message = timedOut ? `timeout after ${REQUEST_TIMEOUT_MS}ms` : String(error?.message || error);
    return {
      ...base,
      result: /unsafe|private|credentials|redirect/i.test(message) ? "warning" : "transient",
      method: null,
      status: null,
      finalUrl: null,
      redirects: [],
      durationMs: Date.now() - started,
      error: message
    };
  }
}

async function mapConcurrent(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runner() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return results;
}

function utcDay() {
  return process.env.OPPORTUNITY_CHECK_DATE || new Date().toISOString().slice(0, 10);
}

function reportMarkdown(report) {
  const escapeCell = (value) => String(value ?? "—").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  const summary = report.summary;
  const rows = report.checks.map((check) =>
    `| ${escapeCell(check.result)} | ${check.status ?? "—"} | ${escapeCell(check.deadline?.result)}${check.deadline?.date ? ` (${check.deadline.date})` : ""} | ${escapeCell(check.id)} | ${escapeCell(check.title)} | ${check.durationMs} | [source](${check.sourceUrl})${check.finalUrl && check.finalUrl !== check.sourceUrl ? ` → [final](${check.finalUrl})` : ""} | ${escapeCell(check.error)} |`
  ).join("\n");

  const structuralDetails = report.structural.errors.length
    ? `\n## Structural errors\n\n${report.structural.errors.map((error) => `- ${escapeCell(error)}`).join("\n")}\n`
    : "";

  return `# Opportunity link health\n\n` +
    `Generated: **${report.generatedDate}** (UTC)  \n` +
    `Dataset SHA-256: \`${report.datasetSha256}\`  \n` +
    `Structural validation: **${report.structural.valid ? "passed" : "failed"}**\n\n` +
    `> Third-party HTTP failures are informational and do not fail the workflow. Always verify deadlines and eligibility on the official source before applying.\n\n` +
    `## Summary\n\n` +
    `- Total: ${summary.total}\n- OK: ${summary.ok}\n- Restricted: ${summary.restricted}\n- Broken (404/410): ${summary.broken}\n- Transient: ${summary.transient}\n- Other warnings: ${summary.warning}\n` +
    `- Deadline active: ${summary.deadlines.active}\n- Deadline expired: ${summary.deadlines.expired}\n- Deadline unknown: ${summary.deadlines.unknown}\n- Rolling/upcoming: ${summary.deadlines.rolling + summary.deadlines.upcoming}\n` +
    structuralDetails + `\n` +
    `## Checks\n\n` +
    `| Result | HTTP | Deadline | ID | Opportunity | ms | URL | Error |\n|---|---:|---|---|---|---:|---|---|\n${rows}\n`;
}

async function sha256(text) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(text).digest("hex");
}

async function main() {
  const source = await readFile(DATA_FILE, "utf8");
  let opportunities;
  let parseError = null;
  try {
    opportunities = JSON.parse(extractJsonArray(source));
  } catch (error) {
    parseError = String(error?.message || error);
    opportunities = [];
  }

  const structuralErrors = parseError ? [parseError] : validateStructure(opportunities);
  if (structuralErrors.length > 0) {
    const report = {
      schemaVersion: 1,
      generatedDate: utcDay(),
      datasetSha256: await sha256(source),
      policy: { timeoutMs: REQUEST_TIMEOUT_MS, concurrency: CONCURRENCY, thirdPartyFailuresAreFatal: false },
      structural: { valid: false, errors: structuralErrors },
      summary: {
        total: 0, ok: 0, restricted: 0, broken: 0, transient: 0, warning: 0,
        deadlines: { active: 0, expired: 0, unknown: 0, rolling: 0, upcoming: 0 }
      },
      checks: []
    };
    await mkdir(REPORT_DIR, { recursive: true });
    await Promise.all([
      writeFile(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
      writeFile(MARKDOWN_REPORT, reportMarkdown(report), "utf8")
    ]);
    console.error("Structural opportunity data errors:");
    structuralErrors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${opportunities.length} opportunity records. Checking ${opportunities.length} official URLs with concurrency ${CONCURRENCY} and ${REQUEST_TIMEOUT_MS}ms timeout.`);
  const checks = await mapConcurrent(opportunities, CONCURRENCY, checkURL);
  checks.forEach((check, index) => { check.deadline = analyzeDeadline(opportunities[index]); });
  const counts = Object.fromEntries(["ok", "restricted", "broken", "transient", "warning"].map((key) => [key, checks.filter((check) => check.result === key).length]));
  const deadlineCounts = Object.fromEntries(["active", "expired", "unknown", "rolling", "upcoming"].map((key) => [key, checks.filter((check) => check.deadline.result === key).length]));
  const report = {
    schemaVersion: 1,
    generatedDate: utcDay(),
    datasetSha256: await sha256(source),
    policy: {
      timeoutMs: REQUEST_TIMEOUT_MS,
      concurrency: CONCURRENCY,
      thirdPartyFailuresAreFatal: false
    },
    structural: { valid: true, errors: [] },
    summary: { total: checks.length, ...counts, deadlines: deadlineCounts },
    checks
  };

  await mkdir(REPORT_DIR, { recursive: true });
  await Promise.all([
    writeFile(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
    writeFile(MARKDOWN_REPORT, reportMarkdown(report), "utf8")
  ]);
  console.log(`Reports written to ${JSON_REPORT} and ${MARKDOWN_REPORT}.`);
  if (counts.broken || counts.transient || counts.warning || counts.restricted) {
    console.warn(`Non-fatal link results: ${counts.broken} broken, ${counts.transient} transient, ${counts.restricted} restricted, ${counts.warning} warning.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
