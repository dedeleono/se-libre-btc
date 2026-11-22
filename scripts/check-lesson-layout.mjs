// Rendered checks for the lesson page: reading layout, notes autosave, tabs, resources,
// sidebar and the admin preview. Runs against the dev-only fixture routes in app/(dev).
//
//   yarn dev                     # in another terminal
//   yarn check:lesson-layout     # prints FAILURES: 0 on success
//
// Environment:
//   BASE_URL           dev server (default http://localhost:3000)
//   SHOTS_DIR          where screenshots go (default <tmp>/se-libre-lesson-check/shots)
//   PLAYWRIGHT_MODULE  path to an existing playwright or playwright-core entry (index.mjs).
//                      Without it, playwright is installed once into <tmp>/se-libre-lesson-check
//                      with npm, outside this repo's dependencies.
//   BROWSER_PATH       Chromium-based browser executable (optional; default: playwright's chromium)
//   ONLY               comma-separated sections to run: reading,notes,admin (default: all)
//   NAV_TIMEOUT        page navigation timeout in ms (default 180000; first loads compile the route)
//   READY_TIMEOUT      wait for the editor and lesson content in ms (default 60000)
//   STATUS_TIMEOUT     wait for each notes save status in ms (default 8000)
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SCRATCH = join(tmpdir(), "se-libre-lesson-check");
const SHOTS = process.env.SHOTS_DIR ?? join(SCRATCH, "shots");
const NAV_TIMEOUT = Number(process.env.NAV_TIMEOUT ?? 180000);
const READY_TIMEOUT = Number(process.env.READY_TIMEOUT ?? 60000);
const STATUS_TIMEOUT = Number(process.env.STATUS_TIMEOUT ?? 8000);
const ONLY = new Set((process.env.ONLY ?? "reading,notes,admin").split(","));
mkdirSync(SHOTS, { recursive: true });

async function loadChromium() {
  if (process.env.PLAYWRIGHT_MODULE) return (await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)).chromium;
  const entry = join(SCRATCH, "node_modules", "playwright", "index.mjs");
  if (!existsSync(entry)) {
    mkdirSync(SCRATCH, { recursive: true });
    execSync("npm init -y >/dev/null && npm i --no-audit --no-fund playwright@1.49.1 && npx playwright install chromium", { cwd: SCRATCH, stdio: "inherit", shell: true });
  }
  return (await import(pathToFileURL(entry).href)).chromium;
}

const chromium = await loadChromium();
const browser = await chromium.launch(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {});
const failures = [];
const fail = (id, what) => failures.push(`${id}: ${what}`);
const shot = (name) => join(SHOTS, `${name}.png`);

async function newPage({ theme = "light", width = 375, notes } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  await context.addCookies([
    { name: "better-auth.session_token", value: "lesson-fixture", domain: new URL(BASE).hostname, path: "/" },
    { name: "intro_chapter_fixture-chapter", value: "true", domain: new URL(BASE).hostname, path: "/" },
  ]);
  await context.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch {} }, theme);
  const page = await context.newPage();
  const state = { get: { status: 200, body: { content: notes ?? "<p>Mis notas</p>" } }, postStatus: 200, postDelay: 0, posts: [], errors: [] };
  page.on("pageerror", (e) => state.errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") state.errors.push(m.text().split("\n")[0]); });
  await page.route("**/api/notes**", async (route) => {
    const req = route.request();
    if (req.method() === "GET") return route.fulfill({ status: state.get.status, contentType: "application/json", body: JSON.stringify(state.get.body) });
    state.posts.push({ at: Date.now(), body: req.postDataJSON() });
    if (state.postDelay) await new Promise((r) => setTimeout(r, state.postDelay));
    return route.fulfill({ status: state.postStatus, contentType: "application/json", body: "{}" });
  });
  await page.route("**/api/chapters/*/discussions", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  return { page, context, state };
}

// Shared in-page helpers: WCAG contrast of every text node under a root.
const CONTRAST_FN = `(root, minLarge) => {
  const rgb = (s) => { const m = s.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v[3] ?? 1 }; };
  const lum = ({ r, g, b }) => [r, g, b].map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }).reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
  const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c && c.a >= 0.5) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
  const out = [];
  for (const el of root.querySelectorAll("*")) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) < 0.9) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const fg = rgb(cs.color); if (!fg) continue;
    const L1 = lum(fg), L2 = lum(bgOf(el)); const cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    if (cr < need) out.push(\`contrast \${cr.toFixed(2)} < \${need} on <\${el.tagName.toLowerCase()} class="\${el.className}"> "\${el.textContent.trim().slice(0, 30)}"\`);
  }
  return out;
}`;

// ---------------------------------------------------------------------------
// 1. Reading layout (plan 006): lesson HTML in preview and enrolled modes.
if (ONLY.has("reading")) {
  const widths = (process.env.WIDTHS ?? "320,375,768,1440").split(",").map(Number);
  const fixtures = ["long-description", "table-url", "legacy-wrapper"];
  const parity = {};
  for (const theme of ["light", "dark"]) {
    const { page, context } = await newPage({ theme, notes: "" });
    for (const mode of ["preview", "enrolled"]) for (const fixture of fixtures) for (const width of widths) {
      const id = `reading-${fixture}-${mode}-${theme}-${width}`;
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${BASE}/lesson-fixture?fixture=${fixture}&mode=${mode}`, { waitUntil: "load", timeout: NAV_TIMEOUT });
      await page.waitForSelector(".lexical-preview p", { timeout: 30000 });
      if (mode === "enrolled") await page.waitForSelector(".editor-shell", { timeout: READY_TIMEOUT });
      await page.waitForTimeout(300);
      if (width === 375 || width === 1440) await page.screenshot({ path: shot(id), fullPage: true });
      const r = await page.evaluate(([expectDark, contrastSrc]) => {
        const contrast = eval(contrastSrc);
        const out = { problems: [], sample: null };
        if (document.documentElement.classList.contains("dark") !== expectDark) out.problems.push("theme mismatch");
        const vw = document.documentElement.clientWidth;
        for (const el of document.querySelectorAll("main h1, .lexical-preview, .lexical-preview *")) {
          if (el.closest(".lesson-table-scroll") && !el.classList.contains("lesson-table-scroll")) continue;
          const rect = el.getBoundingClientRect(); if (!rect.width || !rect.height) continue;
          const card = el.closest('[data-slot="card"]'); const b = card ? card.getBoundingClientRect() : { left: 0, right: vw };
          if (rect.right > b.right + 1 || rect.left < b.left - 1) out.problems.push(`overflow <${el.tagName.toLowerCase()}> "${(el.textContent || "").trim().slice(0, 30)}"`);
        }
        const h1s = document.querySelectorAll("h1"); if (h1s.length !== 1) out.problems.push(`expected 1 <h1>, found ${h1s.length}`);
        const h1 = h1s[0];
        if (h1) {
          const cs = getComputedStyle(h1); const ratio = parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
          if (!(ratio >= 1 && ratio <= 1.2)) out.problems.push(`title line-height ratio ${ratio.toFixed(2)}`);
          const desc = document.querySelector('[data-slot="card"] .lesson-content');
          if (desc && desc.textContent.trim()) { const gap = desc.getBoundingClientRect().top - h1.getBoundingClientRect().bottom; if (gap < 12) out.problems.push(`title→description gap ${Math.round(gap)}px`); }
        }
        const preview = document.querySelector(".lexical-preview");
        if ((getComputedStyle(preview).userSelect || getComputedStyle(preview).webkitUserSelect) === "none") out.problems.push("lesson text not selectable");
        if (document.querySelector(".lexical-preview [contenteditable]")) out.problems.push("contenteditable in lesson HTML");
        const pEl = document.querySelector(".lesson-content p") || document.querySelector(".lexical-preview p");
        const pcs = getComputedStyle(pEl);
        out.sample = { fontSize: pcs.fontSize, lineHeight: pcs.lineHeight, marginBottom: pcs.marginBottom, color: pcs.color };
        if (parseFloat(pcs.fontSize) < 16) out.problems.push(`body font-size ${pcs.fontSize}`);
        if (parseFloat(pcs.lineHeight) / parseFloat(pcs.fontSize) < 1.5) out.problems.push(`body line-height ${pcs.lineHeight}`);
        for (const root of document.querySelectorAll("main h1, .lexical-preview")) out.problems.push(...contrast(root.parentElement ?? root));
        const scroller = document.querySelector(".lesson-table-scroll");
        if (document.querySelector(".lexical-preview table")) {
          if (!scroller) out.problems.push("table not wrapped in .lesson-table-scroll");
          else {
            if (scroller.tabIndex !== 0 || scroller.getAttribute("role") !== "region" || !scroller.getAttribute("aria-label")) out.problems.push("table scroller lacks tabindex/role/aria-label");
            if (vw <= 375 && !(scroller.scrollWidth > scroller.clientWidth)) out.problems.push("wide table does not scroll at phone width");
          }
        }
        return out;
      }, [theme === "dark", CONTRAST_FN]);
      [...new Set(r.problems)].forEach((p) => fail(id, p));
      (parity[`${fixture}-${theme}-${width}`] ??= {})[mode] = JSON.stringify(r.sample);
      if (fixture === "table-url" && width === 375 && theme === "light") {
        await page.locator(".lexical-preview a").first().focus();
        await page.keyboard.press("Tab");
        if (await page.evaluate(() => document.activeElement?.matches(".lexical-preview a"))) fail(id, "keyboard trap on lesson link");
      }
    }
    await context.close();
  }
  for (const [k, v] of Object.entries(parity))
    if (v.preview && v.enrolled && v.preview !== v.enrolled) fail(`reading-${k}`, `preview vs enrolled paragraph style differ: ${v.preview} vs ${v.enrolled}`);
}

// ---------------------------------------------------------------------------
// 2. Notes, tabs, discussion, resources and sidebar (plan 007).
const NOTES_URL = `${BASE}/lesson-fixture/courses/fixture-course/chapters/ch-1`;
const statusText = (page) => page.locator('section[aria-labelledby="lesson-notes-title"] [role="status"]').innerText();
const waitStatus = (page, text, timeout = STATUS_TIMEOUT) =>
  page.waitForFunction((t) => document.querySelector('section[aria-labelledby="lesson-notes-title"] [role="status"]')?.textContent?.includes(t), text, { timeout }).then(() => true, () => false);
const editor = (page) => page.locator('.lesson-notebook .editor-shell [contenteditable="true"]').first();
const notebook = (page) => page.locator('section[aria-labelledby="lesson-notes-title"]');
const selectedTab = (page, index) =>
  page.waitForFunction((i) => document.querySelectorAll('[role="tab"]')[i]?.getAttribute("aria-selected") === "true", index, { timeout: 3000 }).then(() => true, () => false);
const settle = (page) => page.waitForTimeout(500); // let 150ms color transitions finish before measuring contrast

async function openNotes(opts) {
  const s = await newPage(opts);
  await s.page.goto(NOTES_URL, { waitUntil: "load", timeout: NAV_TIMEOUT });
  return s;
}

if (ONLY.has("notes")) {
  // Behaviour at 375px light.
  {
    const id = "notes";
    const { page, state, context } = await openNotes();
    await editor(page).waitFor({ timeout: READY_TIMEOUT });
    await page.waitForTimeout(3000);
    if (state.posts.length) fail(id, `opening the lesson sent ${state.posts.length} POSTs without input`);
    if (!(await statusText(page)).includes("automáticamente")) fail(id, `idle status is "${await statusText(page)}"`);
    if (await page.getByRole("button", { name: /Guardar notas/ }).count()) fail(id, '"Guardar notas" button still present');

    await editor(page).click();
    await page.keyboard.press("End");
    const keyTimes = [];
    for (const ch of " extra") { await page.keyboard.type(ch); keyTimes.push(Date.now()); await page.waitForTimeout(300); }
    const typedAt = keyTimes.at(-1);
    const maxGap = Math.max(...keyTimes.slice(1).map((t, i) => t - keyTimes[i]));
    if (!(await waitStatus(page, "Guardado"))) fail(id, "never showed Guardado after typing");
    if (state.posts.length !== 1)
      fail(id, `expected 1 POST after a typing burst, got ${state.posts.length} (largest gap between keys ${maxGap}ms; posts ${JSON.stringify(state.posts.map((p) => ({ afterLastKeyMs: p.at - typedAt, content: p.body.content.replace(/<[^>]+>/g, "") })))})`);
    else {
      if (!state.posts[0].body.content.includes("extra")) fail(id, "POST body lacks the typed text");
      if (state.posts[0].at - typedAt < 1200) fail(id, `save fired ${state.posts[0].at - typedAt}ms after the last key`);
      if (state.posts[0].body.chapterId !== "ch-1" || state.posts[0].body.courseId !== "fixture-course") fail(id, "POST body ids wrong");
    }

    const tabs = page.getByRole("tab");
    if ((await tabs.count()) !== 2) fail("tabs", `expected 2 tabs, got ${await tabs.count()}`);
    if ((await page.getByRole("tablist").count()) !== 1) fail("tabs", "no tablist");
    for (let i = 0; i < (await tabs.count()); i++) { const b = await tabs.nth(i).boundingBox(); if (!b || b.height < 44) fail("tabs", `tab ${i} height ${b?.height}`); }
    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    if (!(await selectedTab(page, 1))) fail("tabs", "ArrowRight did not select Discussion");
    if ((await page.locator(".lesson-notebook .editor-shell").count()) !== 1) fail("tabs", "notebook unmounted while Discussion is open");
    const hiddenPanel = await page.evaluate(() => [...document.querySelectorAll('[role="tabpanel"]')].filter((p) => p.getAttribute("data-state") === "inactive").map((p) => getComputedStyle(p).display));
    if (hiddenPanel.some((d) => d !== "none")) fail("tabs", `inactive panel still rendered (display ${hiddenPanel})`);

    const write = page.getByRole("button", { name: "Escribir un comentario" });
    if (!(await write.isVisible())) fail("discussion", "inline write button missing");
    if (await page.locator("button.fixed").count()) fail("discussion", "floating button still present");
    await write.click();
    if (!(await page.evaluate(() => document.activeElement?.id === "new-comment"))) fail("discussion", "focus did not move to the textarea");
    if (!(await page.getByLabel("Tu comentario").isVisible())) fail("discussion", "textarea has no visible label");
    await page.getByRole("button", { name: "Cancelar" }).click();
    if (!(await page.evaluate(() => document.activeElement?.textContent?.includes("Escribir un comentario")))) fail("discussion", "focus did not return to the write button");
    await tabs.first().click();

    const res = page.getByRole("link", { name: /Descargar Guia-de-ahorro/ });
    if ((await res.count()) !== 1) fail("resources", "named download link missing");
    else {
      const b = await res.boundingBox(); if (b.height < 44) fail("resources", `height ${b.height}`);
      if ((await res.getAttribute("download")) === null) fail("resources", "no download attribute");
    }
    for (const h of ["Recursos", "Libreta digital"]) if ((await page.getByRole("heading", { level: 2, name: h }).count()) !== 1) fail("headings", `missing h2 "${h}"`);

    const before = state.posts.length;
    await editor(page).click();
    await page.keyboard.type("z");
    await page.waitForTimeout(400);
    await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
    await page.waitForTimeout(500);
    if (state.posts.length !== before + 1) fail("flush", `expected an immediate POST on hide, got ${state.posts.length - before}`);

    const overflow = await page.evaluate(() => [...document.querySelectorAll("main *")].filter((e) => { if (e.closest(".toolbar, .lesson-table-scroll")) return false; const r = e.getBoundingClientRect(); return r.width && r.right > document.documentElement.clientWidth + 1; }).map((e) => e.tagName + "." + e.className).slice(0, 3));
    if (overflow.length) fail("layout", `elements overflow at 375px: ${overflow.join(", ")}`);
    if (state.errors.length) fail(id, `console errors: ${state.errors.slice(0, 2).join(" | ")}`);
    await context.close();
  }

  // Load failure shows no editor; retry loads it.
  {
    const { page, state, context } = await newPage({});
    state.get = { status: 500, body: {} };
    await page.goto(NOTES_URL, { waitUntil: "load", timeout: NAV_TIMEOUT });
    await page.waitForTimeout(1500);
    if (await page.locator(".lesson-notebook .editor-shell").count()) fail("load-error", "editor rendered after a failed load");
    if (!(await page.getByText("No se pudieron cargar tus notas.").isVisible())) fail("load-error", "message missing");
    state.get = { status: 200, body: { content: "<p>Recuperadas</p>" } };
    await notebook(page).getByRole("button", { name: "Intentar de nuevo" }).click();
    await editor(page).waitFor({ timeout: READY_TIMEOUT });
    if (!(await editor(page).innerText()).includes("Recuperadas")) fail("load-error", "retry did not load notes");
    if (state.posts.length) fail("load-error", "a POST was sent during load recovery");
    await context.close();
  }

  // Legacy Lexical JSON notes show every paragraph.
  {
    const legacy = JSON.stringify({ root: { type: "root", children: [{ type: "paragraph", children: [{ type: "text", text: "Hola" }] }, { type: "paragraph", children: [{ type: "text", text: "Mundo" }] }] } });
    const { page, context } = await openNotes({ notes: legacy });
    await editor(page).waitFor({ timeout: READY_TIMEOUT });
    const txt = await editor(page).innerText();
    if (!txt.includes("Hola") || !txt.includes("Mundo")) fail("legacy", `editor shows "${txt}"`);
    await context.close();
  }

  // Sidebar (desktop width so the nav shows).
  {
    const { page, context } = await openNotes({ width: 1280, notes: "" });
    await editor(page).waitFor({ timeout: READY_TIMEOUT });
    const placeholder = await page.locator(".lesson-notebook .ContentEditable__placeholder").innerText().catch(() => "");
    if (placeholder !== "Escribe aquí…") fail("placeholder", `empty notebook placeholder is "${placeholder}"`);
    const current = page.locator('nav a[aria-current="page"]');
    if ((await current.count()) !== 1 || !(await current.getAttribute("href"))?.endsWith("/chapters/ch-1")) fail("sidebar", "aria-current link wrong");
    if ((await page.locator('nav a[href$="/chapters/ch-2"]').count()) !== 1) fail("sidebar", "accessible lesson is not a link");
    const locked = page.locator('nav button[aria-disabled="true"]');
    if ((await locked.count()) !== 1 || !(await locked.textContent()).includes("Bloqueada")) fail("sidebar", "locked lesson lacks aria-disabled/Bloqueada");
    if ((await locked.locator("svg").count()) !== 1) fail("sidebar", "locked lesson has no lock icon");
    await context.close();
  }

  // Evidence + per-theme checks: 375px and desktop, light and dark.
  for (const theme of ["light", "dark"]) for (const width of [375, 1280]) {
    const tag = `${theme}-${width}`;
    const { page, state, context } = await openNotes({ theme, width });
    await editor(page).waitFor({ timeout: READY_TIMEOUT });
    await page.waitForTimeout(800);
    await page.screenshot({ path: shot(`notes-tab-${tag}`), fullPage: true });
    await notebook(page).screenshot({ path: shot(`notes-idle-${tag}`) });

    const shell = await page.evaluate(() => {
      const bg = (s) => getComputedStyle(document.querySelector(s)).backgroundColor;
      return { container: bg(".lesson-notebook .editor-container"), toolbar: bg(".lesson-notebook .toolbar"), card: getComputedStyle(document.querySelector(".lesson-notebook").closest('[data-slot="card"]')).backgroundColor };
    });
    if (shell.container !== shell.card || shell.toolbar !== shell.card) fail(`theme-${tag}`, `editor surface ${JSON.stringify(shell)} does not match the card`);

    state.postDelay = 2500;
    await editor(page).click();
    await page.keyboard.press("End");
    await page.keyboard.type(" nota");
    if (!(await waitStatus(page, "Guardando"))) fail(`autosave-${tag}`, "never showed Guardando…");
    await notebook(page).screenshot({ path: shot(`notes-saving-${tag}`) });
    if (!(await waitStatus(page, "Guardado"))) fail(`autosave-${tag}`, "never showed Guardado");
    await notebook(page).screenshot({ path: shot(`notes-saved-${tag}`) });
    state.postDelay = 0;
    if (state.errors.length) fail(`console-${tag}`, state.errors.slice(0, 2).join(" | "));
    state.postStatus = 500; // the browser logs this forced 500; console errors are checked before it

    await page.keyboard.type(" falla");
    if (!(await waitStatus(page, "No se pudieron guardar"))) fail(`autosave-${tag}`, "no error status");
    await settle(page);
    await notebook(page).screenshot({ path: shot(`notes-error-${tag}`) });
    const notebookContrast = await notebook(page).evaluate((el, src) => eval(src)(el), CONTRAST_FN);
    notebookContrast.forEach((p) => fail(`contrast-${tag}`, p));
    state.postStatus = 200;
    await notebook(page).getByRole("button", { name: "Intentar de nuevo" }).click();
    if (!(await waitStatus(page, "Guardado"))) fail(`autosave-${tag}`, "retry did not recover");
    if (state.posts.at(-1)?.body.content.includes("falla") !== true) fail(`autosave-${tag}`, "retry POST lacks the unsaved text");

    // Keyboard pass over the tabs: Tab reaches the selected tab, arrows move, Home/End jump, Tab enters the panel.
    await page.locator("h1").click();
    let reached = false;
    for (let i = 0; i < 30 && !reached; i++) { await page.keyboard.press("Tab"); reached = await page.evaluate(() => document.activeElement?.getAttribute("role") === "tab"); }
    if (!reached) fail(`keyboard-${tag}`, "Tab never reached the tablist");
    const ring = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 1 || cs.boxShadow !== "none"; });
    if (!ring) fail(`keyboard-${tag}`, "focused tab has no visible focus indicator");
    await page.getByRole("tablist").screenshot({ path: shot(`tabs-focus-content-${tag}`) });
    await page.keyboard.press("ArrowRight");
    const rightSelected = await selectedTab(page, 1);
    const afterRight = await page.evaluate(() => document.activeElement?.textContent);
    if (!/discusi/i.test(afterRight ?? "") || !rightSelected) fail(`keyboard-${tag}`, `ArrowRight focus/selection wrong: focus "${afterRight}", selected ${rightSelected}`);
    await settle(page);
    await page.getByRole("tablist").screenshot({ path: shot(`tabs-focus-discussion-${tag}`) });
    await page.screenshot({ path: shot(`tabs-discussion-${tag}`), fullPage: false });
    await page.keyboard.press("Home");
    if (!(await selectedTab(page, 0))) fail(`keyboard-${tag}`, "Home did not select the first tab");
    await page.keyboard.press("End");
    if (!(await selectedTab(page, 1))) fail(`keyboard-${tag}`, "End did not select the last tab");
    await page.keyboard.press("ArrowLeft");
    if (!(await selectedTab(page, 0))) fail(`keyboard-${tag}`, "ArrowLeft did not select the first tab");
    await page.keyboard.press("Tab");
    if ((await page.evaluate(() => document.activeElement?.getAttribute("role"))) !== "tabpanel") fail(`keyboard-${tag}`, "Tab from the tablist did not enter the panel");
    await settle(page);
    const tabContrast = await page.getByRole("tablist").evaluate((el, src) => eval(src)(el), CONTRAST_FN);
    tabContrast.forEach((p) => fail(`contrast-${tag}`, p));
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// 3. Admin chapter preview uses the student stylesheet (owner decision 2026-11-17).
if (ONLY.has("admin")) {
  for (const theme of ["light", "dark"]) for (const width of [375, 1280]) {
    const id = `admin-${theme}-${width}`;
    const { page, context } = await newPage({ theme, width });
    await page.goto(`${BASE}/lesson-fixture/admin?fixture=table-url`, { waitUntil: "load", timeout: NAV_TIMEOUT });
    await page.waitForSelector(".lexical-preview p", { timeout: 30000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot(`admin-preview-${theme}-${width}`), fullPage: true });
    const r = await page.evaluate((src) => {
      const previews = [...document.querySelectorAll(".lexical-preview")];
      const p = document.querySelector(".lesson-content p");
      return {
        previews: previews.length,
        styled: previews.filter((el) => el.classList.contains("lesson-content") || el.closest(".lesson-content")).length,
        fontSize: p && getComputedStyle(p).fontSize,
        scroller: !!document.querySelector(".lesson-content .lesson-table-scroll"),
        contrast: previews.flatMap((el) => eval(src)(el)),
      };
    }, CONTRAST_FN);
    if (r.previews !== 2 || r.styled !== 2) fail(id, `expected 2 previews with .lesson-content, got ${r.styled}/${r.previews}`);
    if (r.fontSize !== "17px") fail(id, `admin paragraph font-size ${r.fontSize}, student is 17px`);
    if (!r.scroller) fail(id, "admin table preview is not wrapped like the student view");
    [...new Set(r.contrast)].forEach((p) => fail(id, p));
    await context.close();
  }
}

await browser.close();
console.log(`Screenshots: ${SHOTS}`);
console.log(failures.join("\n"));
console.log(`FAILURES: ${failures.length}`);
process.exit(failures.length ? 1 : 0);
