import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { browserPlatform } from "./helpers/browser-platform.mjs";
const require = createRequire(import.meta.url),
  { chromium } = require(
    path.join(
      path.dirname(path.dirname(process.execPath)),
      "node_modules/playwright",
    ),
  );
const origin = process.env.PD_BASE_URL || "http://127.0.0.1:4173",
  browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  }),
  context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    colorScheme: "light",
  }),
  platform = await browserPlatform(context, origin),
  page = await context.newPage();
page.setDefaultTimeout(12000);
const out = "node_modules/.cache/pd-appearance-journey";
fs.mkdirSync(out, { recursive: true });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const query = (sql) =>
  platform.query(async () => {
    await platform.db.exec("reset role");
    return (await platform.db.query(sql)).rows;
  });
const click = (n) => page.getByRole("button", { name: n, exact: true }).click(),
  fill = (n, v) => page.getByLabel(n, { exact: true }).fill(v);
const menu = async (n) => {
  await click("Abrir menu");
  await page
    .getByRole("dialog", { name: "Menu", exact: true })
    .getByRole("button", { name: n, exact: true })
    .click();
};
const theme = async (t) => {
  if (!(await page.getByRole("dialog", { name: /perfil|aparência/ }).count()))
    await page.locator(".account-avatar").first().click();
  await page
    .getByRole("group", { name: "Tema do aplicativo" })
    .getByRole("button", { name: t, exact: true })
    .click();
};
const checkTheme = async (mode) => {
  await page.waitForFunction(
    (m) => document.documentElement.dataset.theme === m,
    mode,
  );
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.body).colorScheme),
    mode,
  );
};
try {
  await query(
    `update public.store_settings set settings=settings||'{"preorder_only":true,"min_notice_hours":48,"lead_days":2}'::jsonb`,
  );
  await page.goto(origin);
  await page
    .getByRole("heading", { name: "Seja bem-vindo!", exact: true })
    .waitFor();
  const avatar = await page.locator(".account-avatar").boundingBox(),
    hamburger = await page
      .getByRole("button", { name: "Abrir menu", exact: true })
      .boundingBox();
  assert.equal(avatar.width, 40);
  assert.ok(avatar.x < hamburger.x);
  assert.ok(hamburger.x > 300);
  assert.equal(
    await page
      .getByRole("button", { name: "Partilhar catálogo", exact: true })
      .count(),
    0,
  );
  await click("Abrir menu");
  const drawer = page.getByRole("dialog", { name: "Menu", exact: true });
  let box = await drawer.boundingBox();
  assert.equal(box.width, 300);
  assert.equal(Math.round(box.x + box.width), 390);
  await page.screenshot({ path: out + "/guest-menu-light.png" });
  await click("Fechar menu");
  await theme("Escuro");
  await checkTheme("dark");
  await click("Fechar");
  await page.reload();
  await checkTheme("dark");
  await page
    .getByRole("heading", { name: "Seja bem-vindo!", exact: true })
    .waitFor();
  await page.waitForFunction(
    () =>
      Number(
        getComputedStyle(
          document.querySelector("main>div") || document.querySelector("main"),
        ).opacity,
      ) === 1,
  );
  await page.waitForFunction(() =>
    Array.from(document.images)
      .filter((img) => img.getBoundingClientRect().top < innerHeight)
      .every((img) => img.complete),
  );
  await page.screenshot({ path: out + "/home-dark.png" });
  console.log(
    "PASS avatar 40px left/menu right, visitor compact right drawer and persisted dark preference",
  );
  const early = await context.newPage();
  await early.route("**/assets/index-*.js", (route) => route.abort());
  await early.goto(origin);
  await early.waitForFunction(
    () => document.documentElement.dataset.theme === "dark",
  );
  assert.equal(await early.locator("#root").innerText(), "");
  assert.equal(
    await early.evaluate(() => getComputedStyle(document.body).backgroundColor),
    "rgb(21, 21, 25)",
  );
  await early.close();
  console.log(
    "PASS dark bootstrap applies before React without requiring a rendered application",
  );
  await theme("Sistema");
  await page.emulateMedia({ colorScheme: "light" });
  await checkTheme("light");
  await page.emulateMedia({ colorScheme: "dark" });
  await checkTheme("dark");
  await theme("Claro");
  await checkTheme("light");
  await click("Fechar");
  await menu("Entrar");
  await fill("E-mail", "fixture@example.test");
  await fill("Senha", "isolated-password");
  await click("Entrar com e-mail");
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "O meu perfil", exact: true })
    .waitFor();
  await click("Abrir menu");
  box = await drawer.boundingBox();
  assert.equal(box.width, 390);
  assert.equal(box.height, 844);
  assert.equal(box.x, 0);
  await page.screenshot({ path: out + "/admin-menu-light.png" });
  await click("Fechar menu");
  console.log(
    "PASS live system changes and manual override; authenticated menu fills viewport",
  );
  await click("O meu perfil");
  await fill("Nome do perfil", "Gabriela QA");
  await page.getByLabel("Fotografia de perfil", { exact: true }).setInputFiles({
    name: "avatar.jpg",
    mimeType: "image/jpeg",
    buffer: fs.readFileSync("public/products/bc-1.jpg"),
  });
  await click("Guardar perfil");
  await page
    .getByRole("status")
    .filter({ hasText: "Perfil atualizado." })
    .waitFor();
  await click("Fechar");
  await page.locator(".account-avatar img").waitFor();
  let rows = await query(
    "select name,metadata from storage.objects where bucket_id='account-avatars'",
  );
  assert.equal(rows.length, 1);
  assert.match(
    rows[0].name,
    /^aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa\/[a-f0-9-]+\.(webp|jpg)$/,
  );
  assert.ok(rows[0].metadata.size < 2097152);
  await page.reload();
  await page.locator(".account-avatar img").waitFor();
  assert.ok(
    await page.locator(".account-avatar img").evaluate(async (img) => {
      await img.decode();
      return img.naturalWidth <= 512 && img.naturalHeight <= 512;
    }),
  );
  console.log(
    "PASS profile photo optimization/upload, metadata update and reload persistence (Auth provider simulated, real storage RLS)",
  );
  await click("O meu perfil");
  assert.equal(
    await page.getByLabel("Nome do perfil", { exact: true }).inputValue(),
    "Gabriela QA",
  );
  await page.getByLabel("Fotografia de perfil", { exact: true }).setInputFiles({
    name: "another.jpg",
    mimeType: "image/jpeg",
    buffer: fs.readFileSync("public/products/bc-3.jpg"),
  });
  let reject = true;
  await context.route("**/auth/v1/user", async (route) => {
    if (reject && route.request().method() === "PUT")
      return route.fulfill({
        status: 503,
        json: { message: "Profile failure fixture" },
      });
    return route.fallback();
  });
  await click("Guardar perfil");
  await page.getByRole("alert").waitFor();
  rows = await query(
    "select name from storage.objects where bucket_id='account-avatars'",
  );
  assert.equal(rows.length, 1);
  reject = false;
  await click("Guardar perfil");
  await page
    .getByRole("status")
    .filter({ hasText: "Perfil atualizado." })
    .waitFor();
  assert.equal(
    (
      await query(
        "select name from storage.objects where bucket_id='account-avatars'",
      )
    ).length,
    1,
  );
  await click("Remover fotografia");
  await click("Guardar perfil");
  await page
    .getByRole("status")
    .filter({ hasText: "Perfil atualizado." })
    .waitFor();
  assert.equal(
    (
      await query(
        "select name from storage.objects where bucket_id='account-avatars'",
      )
    ).length,
    0,
  );
  await theme("Escuro");
  await click("Fechar");
  assert.equal(await page.locator(".account-avatar img").count(), 0);
  console.log(
    "PASS failed metadata save rolls back new photo, retry replaces one image and remove restores fallback",
  );
  await click("Abrir menu");
  await page.screenshot({ path: out + "/admin-menu-dark.png" });
  await click("Fechar menu");
  await page
    .getByRole("button", { name: "Caseirinhos", exact: true })
    .first()
    .click();
  const cat = page.getByRole("button", { name: /^Editar categoria / }).first(),
    product = page.locator(".catalog-edit-overlay").first();
  assert.ok(
    (await cat.boundingBox()).width > (await product.boundingBox()).width,
  );
  assert.ok(
    Number(await cat.locator("svg").getAttribute("width")) >
      Number(await product.locator("svg").getAttribute("width")),
  );
  console.log(
    "PASS category edit has larger touch target/icon than product edit and glass surfaces",
  );
  for (const label of [
    "Novo produto",
    "Gerir catálogo",
    "Precificação",
    "Encomendas",
    "Agenda e produção",
    "Financeiro",
    "Clientes",
    "Ingredientes",
    "Configurações da loja",
    "Textos da loja",
  ]) {
    await menu(label);
    await page.getByRole("heading", { name: label, exact: true }).waitFor();
    await page
      .locator(".module-panel:visible,.ui-glass-panel:visible")
      .first()
      .waitFor();
    for (const mode of ["dark", "light"]) {
      await page.locator(".account-avatar").first().click();
      await theme(mode === "dark" ? "Escuro" : "Claro");
      await click("Fechar");
      await checkTheme(mode);
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
          label + " overflow " + mode + "/" + width,
        );
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: out + "/" + label.replaceAll(" ", "-") + "-" + mode + ".png",
        fullPage: true,
      });
    }
  }
  for (const contrastMode of ["light", "dark"]) {
    await page.locator(".account-avatar").first().click();
    await theme(contrastMode === "dark" ? "Escuro" : "Claro");
    await click("Fechar");
    const contrasts = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement),
        canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const c = canvas.getContext("2d");
      const rgb = (value) => {
        c.clearRect(0, 0, 1, 1);
        c.fillStyle = value;
        c.fillRect(0, 0, 1, 1);
        return Array.from(c.getImageData(0, 0, 1, 1).data)
          .slice(0, 3)
          .map((x) => {
            const n = x / 255;
            return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
          });
      };
      const lum = (value) => {
        const n = rgb(value);
        return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2];
      };
      const bg = lum(root.getPropertyValue("--pd-color-surface")),
        ratios = {};
      for (const key of [
        "ink",
        "muted",
        "brand-ink",
        "success",
        "warning",
        "danger",
      ]) {
        const n = lum(root.getPropertyValue("--pd-color-" + key));
        ratios[key] = (Math.max(n, bg) + 0.05) / (Math.min(n, bg) + 0.05);
      }
      return ratios;
    });
    for (const [key, ratio] of Object.entries(contrasts))
      assert.ok(ratio >= 4.5, key + " text contrast " + ratio);
  }
  console.log(
    "PASS ten admin modules across light/dark at 320/390/768/1440, no horizontal overflow",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(platform.errors, []);
} catch (e) {
  console.log("ERRORS", platform.errors, errors);
  await page.screenshot({ path: out + "/failure.png", fullPage: true });
  fs.writeFileSync(
    out + "/failure.txt",
    await page.locator("body").innerText(),
  );
  throw e;
} finally {
  await context.close();
  await platform.close();
  await browser.close();
}
