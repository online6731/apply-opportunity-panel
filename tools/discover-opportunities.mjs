#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_FILE = resolve(ROOT, "data/discovery-sources.json");
const OPPORTUNITIES_FILE = resolve(ROOT, "data/opportunities.js");
const REPORT_JSON = resolve(ROOT, "reports/discovery-radar.json");
const REPORT_MD = resolve(ROOT, "reports/discovery-radar.md");
const USER_AGENT = "apply-opportunity-panel-discovery/1.0 (+https://github.com/online6731/apply-opportunity-panel)";

const day = () => process.env.DISCOVERY_DATE || new Date().toISOString().slice(0, 10);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const clean = (value) => String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, " ").trim();
const normalized = (value) => clean(value).toLocaleLowerCase("en-US");

function privateIPv4(address) {
  const p = address.split(".").map(Number); if (p.length !== 4) return true;
  const [a,b,c] = p;
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113) || a >= 224;
}

function privateIPv6(address) {
  const a = address.toLowerCase();
  return a === "::" || a === "::1" || /^(?:f[cd]|fe[89ab]|ff)/.test(a) || a.startsWith("2001:db8:") || a.startsWith("::ffff:");
}

function safeURL(value) {
  const url = new URL(value);
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || !host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("unsafe URL");
  if ((isIP(host) === 4 && privateIPv4(host)) || (isIP(host) === 6 && privateIPv6(host))) throw new Error("private address");
  return url;
}

async function publicDNS(url) {
  if (isIP(url.hostname)) return;
  const records = await Promise.race([lookup(url.hostname, { all: true, verbatim: true }), new Promise((_, reject) => setTimeout(() => reject(new Error("DNS timeout")), 5000))]);
  if (!records.length || records.some((r) => r.family === 4 ? privateIPv4(r.address) : privateIPv6(r.address))) throw new Error("non-public DNS target");
}

async function boundedFetch(input, limits, maxBytes = limits.maxResponseBytes) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), limits.timeoutMs);
  try {
    let url = safeURL(input); const redirects = [];
    for (let hop = 0; hop <= 5; hop += 1) {
      await publicDNS(url);
      const response = await fetch(url, { redirect: "manual", signal: controller.signal, headers: { "User-Agent": USER_AGENT, "Accept": "application/json, application/rss+xml, application/xml, text/html;q=0.8, */*;q=0.1" } });
      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        if (hop === 5) throw new Error("too many redirects");
        url = safeURL(new URL(location, url).href); redirects.push(url.href); await response.body?.cancel(); continue;
      }
      if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP ${response.status}`); }
      const declared = Number(response.headers.get("content-length") || 0);
      if (declared > maxBytes) { await response.body?.cancel(); throw new Error(`response exceeds ${maxBytes} bytes`); }
      const chunks = []; let size = 0;
      for await (const chunk of response.body || []) { size += chunk.length; if (size > maxBytes) { controller.abort(); throw new Error(`response exceeds ${maxBytes} bytes`); } chunks.push(chunk); }
      return { text: Buffer.concat(chunks).toString("utf8"), status: response.status, finalUrl: url.href, contentType: response.headers.get("content-type") || "", redirects };
    }
    throw new Error("redirect loop");
  } finally { clearTimeout(timer); }
}

function extractArray(source) {
  const marker = /(?:^|\n)\s*window\.OPPORTUNITIES\s*=\s*/g.exec(source); if (!marker) throw new Error("OPPORTUNITIES assignment missing");
  const start = marker.index + marker[0].length; let depth = 0, string = false, escaped = false;
  for (let i = start; i < source.length; i += 1) { const c = source[i]; if (string) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === '"') string = false; continue; } if (c === '"') string = true; else if (c === "[") depth += 1; else if (c === "]" && --depth === 0) return JSON.parse(source.slice(start, i + 1)); }
  throw new Error("OPPORTUNITIES array invalid");
}

function fingerprint(value) {
  const url = safeURL(value); url.hash = "";
  for (const key of [...url.searchParams.keys()]) if (/^(utm_|gh_src|source|ref)/i.test(key)) url.searchParams.delete(key);
  const ashby = url.pathname.match(/\/([0-9a-f]{8}-[0-9a-f-]{27,})/i); if (/ashbyhq\.com$/.test(url.hostname) && ashby) return `ashby:${ashby[1].toLowerCase()}`;
  const gh = url.pathname.match(/\/jobs\/(\d+)/); if (/greenhouse\.io$/.test(url.hostname) && gh) return `greenhouse:${gh[1]}`;
  return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}${url.search}`.toLowerCase();
}

function ashby(source, data) {
  return (data.jobs || []).filter((j) => j.isListed !== false).map((j) => ({ externalId: j.id, title: j.title, organization: source.label, location: j.location, description: j.descriptionPlain, url: j.jobUrl, applyUrl: j.applyUrl, publishedAt: j.publishedAt, sourceType: "job-board-api" }));
}

function greenhouse(source, data) {
  return (data.jobs || []).map((j) => ({ externalId: String(j.id), title: j.title, organization: j.company_name || source.label, location: j.location?.name, description: "", url: j.absolute_url, applyUrl: j.absolute_url, publishedAt: j.first_published || j.updated_at, sourceType: "job-board-api" }));
}

function rss(source, text) {
  return [...text.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match, index) => {
    const part = match[1]; const tag = (name) => part.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1] || "";
    const description = clean(tag("description")); const rawDescription = tag("description");
    const official = rawDescription.match(/More info and apply:[\s\S]{0,500}?href=&quot;(https:[^&]+)&quot;/i)?.[1] || rawDescription.match(/More info and apply:[\s\S]{0,500}?href="(https:[^"]+)"/i)?.[1];
    const itemUrl = clean(tag("link"));
    return { externalId: clean(tag("guid")) || itemUrl || String(index), title: clean(tag("title")), organization: source.label, location: "", description, url: official || itemUrl, applyUrl: official || itemUrl, discoveryUrl: itemUrl, publishedAt: clean(tag("pubDate")), sourceType: "curated-rss" };
  }).filter((item) => item.url);
}

function score(item, profile) {
  const title = normalized(item.title); const details = normalized([item.organization, item.location, item.description].join(" "));
  const evidence = profile.keywords.filter((k) => title.includes(k.term.toLowerCase()) || details.includes(k.term.toLowerCase())).map((k) => ({ keyword: k.term, weight: k.weight, field: title.includes(k.term.toLowerCase()) ? "title" : "details" }));
  return { score: evidence.reduce((sum, e) => sum + e.weight, 0), evidence };
}

async function concurrent(items, limit, worker) {
  const results = new Array(items.length); let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => { while (true) { const i = cursor++; if (i >= items.length) return; results[i] = await worker(items[i], i); } }));
  return results;
}

function markdown(report) {
  const esc = (v) => String(v ?? "—").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  const candidates = report.candidates.map((c) => `| ${esc(c.personLabel)} | ${c.score} | ${esc(c.title)} | ${esc(c.organization)} | ${esc(c.evidence.map((e) => `${e.keyword} (+${e.weight})`).join(", "))} | [official](${c.url}) |`).join("\n");
  const sources = report.sources.map((s) => `| ${esc(s.label)} | ${esc(s.kind)} | ${esc(s.status)} | ${s.itemCount} | ${s.lastChangedDate || "—"} | ${esc(s.error)} |`).join("\n");
  return `# Discovery radar\n\nGenerated after a semantic change: **${report.generatedDate}**  \n**Unverified leads only.** A human must verify eligibility, deadline, funding, visa rules, fees and the real official application destination before adding anything to the main dashboard.\n\n## Summary\n\n- Candidates: ${report.summary.candidates}\n- Mohammad: ${report.summary.mohammad}\n- Arzoo: ${report.summary.arzoo}\n- Source errors: ${report.summary.sourceErrors}\n- Existing opportunities excluded: ${report.summary.excludedExisting}\n\n## New candidate leads\n\n| Person | Score | Title | Organization | Keyword evidence | Link |\n|---|---:|---|---|---|---|\n${candidates || "| — | — | No new scored leads | — | — | — |"}\n\n## Source watch\n\n| Source | Kind | Status | Items | Last change | Error |\n|---|---|---|---:|---|---|\n${sources}\n`;
}

async function main() {
  const config = JSON.parse(await readFile(CONFIG_FILE, "utf8"));
  const existing = extractArray(await readFile(OPPORTUNITIES_FILE, "utf8"));
  const existingFingerprints = new Set(existing.map((o) => { try { return fingerprint(o.url); } catch { return null; } }).filter(Boolean));
  let previous = null; try { previous = JSON.parse(await readFile(REPORT_JSON, "utf8")); } catch {}
  const previousSources = new Map((previous?.sources || []).map((s) => [s.id, s]));
  const previousCandidates = new Map((previous?.candidates || []).map((c) => [c.candidateId, c]));

  const fetched = await concurrent(config.sources, config.limits.concurrency, async (source) => {
    try {
      const endpoint = source.kind === "ashby" ? `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(source.board)}` : source.kind === "greenhouse" ? `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.board)}/jobs` : source.url;
      const response = await boundedFetch(endpoint, config.limits, source.maxBytes || config.limits.maxResponseBytes);
      const hashInput = source.kind === "watch"
        ? clean(response.text.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(/<!--([\s\S]*?)-->/g, " "))
        : response.text;
      const contentHash = hash(hashInput); const old = previousSources.get(source.id);
      let items = [];
      if (source.kind === "ashby") items = ashby(source, JSON.parse(response.text));
      else if (source.kind === "greenhouse") items = greenhouse(source, JSON.parse(response.text));
      else if (source.kind === "rss") items = rss(source, response.text);
      return { source, items: items.slice(0, config.limits.maxItemsPerSource), state: { id: source.id, label: source.label, kind: source.kind, url: endpoint, status: "ok", httpStatus: response.status, itemCount: items.length, contentHash, lastChangedDate: old?.contentHash && old.contentHash !== contentHash ? day() : old?.lastChangedDate || null, error: null } };
    } catch (error) {
      const old = previousSources.get(source.id);
      return { source, items: [], state: { id: source.id, label: source.label, kind: source.kind, url: source.url || source.board, status: "error", httpStatus: null, itemCount: 0, contentHash: old?.contentHash || null, lastChangedDate: old?.lastChangedDate || null, error: String(error?.name === "AbortError" ? `timeout after ${config.limits.timeoutMs}ms` : error?.message || error) } };
    }
  });

  let excludedExisting = 0; const candidates = []; const seen = new Set(); const uniqueItems = new Set();
  for (const result of fetched) for (const item of result.items) {
    let fp; try { fp = fingerprint(item.url); } catch { continue; }
    if (uniqueItems.has(fp)) continue; uniqueItems.add(fp);
    if (existingFingerprints.has(fp)) { excludedExisting += 1; continue; }
    for (const person of result.source.persons) {
      const profile = config.profiles[person]; const scored = score(item, profile); if (scored.score < profile.minScore) continue;
      const key = `${person}:${fp}`; if (seen.has(key)) continue; seen.add(key);
      const candidateId = hash(`${result.source.id}:${key}`).slice(0, 20); const old = previousCandidates.get(candidateId);
      candidates.push({ candidateId, person, personLabel: profile.label, score: scored.score, evidence: scored.evidence, title: clean(item.title), organization: clean(item.organization), location: clean(item.location), url: safeURL(item.url).href, applyUrl: safeURL(item.applyUrl || item.url).href, discoveryUrl: item.discoveryUrl ? safeURL(item.discoveryUrl).href : null, sourceId: result.source.id, sourceLabel: result.source.label, sourceType: item.sourceType, publishedAt: item.publishedAt || null, discoveredDate: old?.discoveredDate || day(), status: "unverified-lead" });
    }
  }
  candidates.sort((a,b) => b.score - a.score || String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")) || a.title.localeCompare(b.title)).splice(config.limits.maxCandidates);
  const sources = fetched.map((r) => r.state);
  const semantic = { schemaVersion: 1, disclaimer: "Unverified discovery leads only; manual verification is required before application or promotion to the main dashboard.", summary: { candidates: candidates.length, mohammad: candidates.filter((c) => c.person === "mohammad").length, arzoo: candidates.filter((c) => c.person === "arzoo").length, sourceErrors: sources.filter((s) => s.status === "error").length, excludedExisting }, profiles: Object.fromEntries(Object.entries(config.profiles).map(([id,p]) => [id,{ label:p.label, minScore:p.minScore }])), candidates, sources };
  const priorSemantic = previous ? { ...previous } : null; if (priorSemantic) delete priorSemantic.generatedDate;
  if (priorSemantic && JSON.stringify(priorSemantic) === JSON.stringify(semantic)) { console.log("Discovery radar unchanged; reports preserved."); return; }
  const report = { generatedDate: day(), ...semantic };
  await mkdir(dirname(REPORT_JSON), { recursive: true });
  await Promise.all([writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8"), writeFile(REPORT_MD, markdown(report), "utf8")]);
  console.log(`Discovery radar updated: ${candidates.length} candidates, ${semantic.summary.sourceErrors} source errors, ${excludedExisting} existing URLs excluded.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
