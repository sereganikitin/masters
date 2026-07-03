// Daily construction-dynamics importer.
//
// Scrapes the МАСТЕРС "Динамика строительства" widget on cg-projects.ru and
// pushes any month we don't already have into our own admin API. Idempotent by
// (year, month): months already present — whether auto-imported earlier or
// added by hand in the admin panel — are left untouched.
//
// Runs on a GitHub Actions runner (has Chrome); talks to prod over HTTPS.
//
//   env:
//     PROD_BASE_URL   e.g. https://masters.infoseledka.ru   (required)
//     ADMIN_TOKEN     prod admin bearer token               (required)
//     DRY_RUN=1       scrape + log, but don't POST anything  (optional)
//
// Usage (local):  PROD_BASE_URL=... ADMIN_TOKEN=... node scripts/import-progress.mjs

import puppeteer from "puppeteer";

const SOURCE = "https://cg-projects.ru/projects/masters";
const BASE = (process.env.PROD_BASE_URL || "").replace(/\/+$/, "");
const TOKEN = process.env.ADMIN_TOKEN || "";
const DRY = process.env.DRY_RUN === "1";

const MONTHS_RU = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];
// Nominative labels as shown in the dropdown ("Июнь 2026").
const MONTH_INDEX = (name) => {
  const n = name.trim().toLowerCase();
  const i = MONTHS_RU.findIndex((m) => n.startsWith(m.slice(0, 4)));
  return i >= 0 ? i + 1 : null;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unwrap = (u) => {
  const m = /\/plain\/(https?:\/\/[^"@]+?)(?:@webp)?$/.exec(u);
  return (m ? m[1] : u).replace(/@webp$/, "");
};
// Progress-photo buckets seen on the МАСТЕРС widget (hero + gallery + thumbs).
const isProgressPhoto = (u) => /\/media\/p\/(p\/ci|pi\/i|pcs\/i)\//.test(u);

function log(...a) { console.log(new Date().toISOString(), ...a); }

if (!BASE || !TOKEN) {
  console.error("PROD_BASE_URL and ADMIN_TOKEN are required");
  process.exit(1);
}

// ── prod API helpers ─────────────────────────────────────────────────────────
async function existingMonths() {
  const res = await fetch(`${BASE}/api/construction`);
  if (!res.ok) throw new Error(`GET /api/construction ${res.status}`);
  const list = await res.json();
  return new Set(list.map((e) => `${e.year}-${e.month}`));
}

async function uploadPhoto(srcUrl) {
  const r = await fetch(srcUrl);
  if (!r.ok) throw new Error(`fetch photo ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const ext = /\.png(\?|$)/i.test(srcUrl) ? "png" : "jpg";
  const type = ext === "png" ? "image/png" : "image/jpeg";
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type }), `progress.${ext}`);
  const up = await fetch(`${BASE}/api/uploads`, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}` },
    body: fd,
  });
  if (!up.ok) throw new Error(`POST /api/uploads ${up.status}`);
  return (await up.json()).url;
}

async function createEntry(entry) {
  const res = await fetch(`${BASE}/api/construction`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error(`POST /api/construction ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── scraping ─────────────────────────────────────────────────────────────────
async function scrape() {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  const seen = new Set();
  page.on("response", (r) => {
    const u = r.url();
    if (/storage\.yandexcloud\.net/.test(u) && /\.(jpg|jpeg|png|webp)/i.test(u)) seen.add(unwrap(u));
  });

  await page.goto(SOURCE, { waitUntil: "domcontentloaded", timeout: 90000 });
  await sleep(4000);
  await page.evaluate(async () => {
    await new Promise((res) => { let y = 0; const t = setInterval(() => { window.scrollBy(0, 700); y += 700; if (y >= document.body.scrollHeight) { clearInterval(t); res(); } }, 120); });
  });
  await sleep(2000);
  await page.evaluate(() => {
    const inp = document.querySelector('[data-test-id="month"]');
    inp?.scrollIntoView({ block: "center" });
  });
  await sleep(1500);

  const monthInput = await page.$('[data-test-id="month"]');
  if (!monthInput) { await browser.close(); throw new Error("progress widget not found"); }

  const readCurrent = () => page.evaluate(() => {
    const inp = document.querySelector('[data-test-id="month"]');
    let root = inp;
    for (let i = 0; i < 6 && root?.parentElement; i++) root = root.parentElement;
    const ps = [...(root?.querySelectorAll("p") || [])]
      .map((p) => p.textContent.replace(/ /g, " ").replace(/\s+/g, " ").trim())
      .filter((t) => t.length > 25 && !/ипотечн/i.test(t));
    return { label: inp?.value || "", paragraphs: [...new Set(ps)] };
  });

  async function collectGalleryPhotos() {
    const before = new Set(seen);
    const clicked = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button,a,div")]
        .find((e) => /смотреть галерею/i.test((e.textContent || "").trim()) && (e.textContent || "").length < 40);
      if (!btn) return false;
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return true;
    });
    await sleep(1200);
    for (let i = 0; i < 14; i++) { await page.keyboard.press("ArrowRight").catch(() => {}); await sleep(300); }
    await sleep(600);
    await page.keyboard.press("Escape").catch(() => {});
    await sleep(400);
    let fresh = [...seen].filter((u) => !before.has(u) && isProgressPhoto(u));
    if (!fresh.length) fresh = [...seen].filter(isProgressPhoto); // fallback: hero already loaded
    // preserve discovery order, dedupe
    return [...new Set(fresh)];
  }

  const months = [];
  const pushMonth = async (tag) => {
    const cur = await readCurrent();
    const idx = MONTH_INDEX(cur.label.split(/\s+/)[0] || "");
    const year = Number((cur.label.match(/20\d\d/) || [])[0]);
    if (!idx || !year) { log(`skip ${tag}: unparsable label "${cur.label}"`); return; }
    if (months.some((m) => m.year === year && m.month === idx)) return;
    const photos = await collectGalleryPhotos();
    months.push({
      year, month: idx, label: cur.label,
      body: cur.paragraphs[0] || "",
      bullets: cur.paragraphs.slice(1),
      photos,
    });
    log(`scraped ${cur.label}: ${cur.paragraphs.length} paras, ${photos.length} photos`);
  };

  // 1) the default-shown (latest) month — always reliable
  await pushMonth("current");

  // 2) best-effort: walk the rest of the dropdown
  try {
    await monthInput.click();
    await sleep(700);
    const optionLabels = await page.evaluate(() => {
      return [...document.querySelectorAll("li,[role=option],button,div,span")]
        .filter((el) => /^[А-Яа-я]+ 20\d\d$/.test((el.textContent || "").trim()) && el.childElementCount <= 2)
        .map((el) => (el.textContent || "").trim());
    });
    const uniqueOpts = [...new Set(optionLabels)];
    await page.keyboard.press("Escape").catch(() => {});
    for (const label of uniqueOpts) {
      await monthInput.click().catch(() => {});
      await sleep(500);
      const ok = await page.evaluate((lab) => {
        const el = [...document.querySelectorAll("li,[role=option],button,div,span")]
          .find((e) => (e.textContent || "").trim() === lab && e.childElementCount <= 2);
        if (!el) return false;
        el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        return true;
      }, label);
      if (!ok) continue;
      await sleep(1500);
      await pushMonth(label);
    }
  } catch (e) {
    log("dropdown enumeration failed (non-fatal):", e.message);
  }

  await browser.close();
  return months;
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  log(`import-progress → ${BASE}${DRY ? " (DRY RUN)" : ""}`);
  const have = await existingMonths();
  log("existing months:", [...have].join(", ") || "(none)");

  const months = await scrape();
  log(`scraped ${months.length} month(s): ${months.map((m) => m.label).join(", ")}`);

  let added = 0;
  for (const m of months) {
    const key = `${m.year}-${m.month}`;
    if (have.has(key)) { log(`skip ${m.label} — already present`); continue; }
    if (!m.photos.length) { log(`skip ${m.label} — no photos found`); continue; }
    if (DRY) { log(`DRY: would add ${m.label} with ${m.photos.length} photos`); added++; continue; }

    const ourPhotos = [];
    for (const p of m.photos) {
      try { ourPhotos.push(await uploadPhoto(p)); }
      catch (e) { log(`  photo upload failed (${p}): ${e.message}`); }
    }
    if (!ourPhotos.length) { log(`skip ${m.label} — all photo uploads failed`); continue; }
    await createEntry({
      year: m.year, month: m.month,
      title: "", body: m.body, bullets: m.bullets,
      photos: ourPhotos, videoUrl: "", sortOrder: 0,
    });
    log(`ADDED ${m.label} with ${ourPhotos.length} photos`);
    added++;
  }
  log(`done. ${added} month(s) ${DRY ? "would be " : ""}added.`);
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
