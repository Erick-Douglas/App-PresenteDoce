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
  }),
  platform = await browserPlatform(context, origin),
  page = await context.newPage();
page.setDefaultTimeout(12000);
const out = "node_modules/.cache/pd-admin-journey";
fs.mkdirSync(out, { recursive: true });
const query = (sql) =>
  platform.query(async () => {
    await platform.db.exec("reset role");
    return (await platform.db.query(sql)).rows;
  });
const click = (name) => page.getByRole("button", { name, exact: true }).click(),
  fill = (name, v) => page.getByLabel(name, { exact: true }).fill(v),
  menu = async (name) => {
    await click("Abrir menu");
    await page
      .getByRole("dialog", { name: "Menu", exact: true })
      .getByRole("button", { name, exact: true })
      .click();
  };
try {
  await query(
    `update public.store_settings set settings=settings||'{"preorder_only":true,"min_notice_hours":48,"lead_days":2}'::jsonb`,
  );
  await page.goto(origin);
  await menu("Entrar");
  await fill("E-mail", "fixture@example.test");
  await fill("Senha", "isolated-password");
  await click("Entrar com e-mail");
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  await page.reload();
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  console.log(
    "PASS remembered administrative session survives reload (provider identity simulated)",
  );
  await menu("Novo produto");
  await fill("Nome", "QA fotografia");
  await fill("Descrição", "Produto fictício");
  await fill("Preço base", "5");
  await page.locator("input[type=file]").setInputFiles({
    name: "valida.jpg",
    mimeType: "image/jpeg",
    buffer: fs.readFileSync("public/products/bc-1.jpg"),
  });
  await page.locator("input[type=file]").setInputFiles({
    name: "grande.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(21 * 1024 * 1024),
  });
  await page.getByText(/A fotografia anterior foi mantida/).waitFor();
  assert.match(await page.getByText(/Selecionada:/).innerText(), /valida.jpg/);
  await page.locator("input[type=file]").setInputFiles([]);
  assert.equal(
    await page.getByLabel("Nome", { exact: true }).inputValue(),
    "QA fotografia",
  );
  let fail = true;
  await context.route(
    "**/storage/v1/object/catalog-images/**",
    async (route) => {
      if (fail && route.request().method() === "POST")
        return route.fulfill({
          status: 503,
          json: { message: "Falha de envio QA" },
        });
      return route.fallback();
    },
  );
  await click("Guardar produto");
  await page
    .getByRole("alert")
    .filter({ hasText: /Falha|enviar|guardar/i })
    .waitFor();
  assert.equal(
    (
      await query(
        `select * from public.catalog_products where details->>'name'='QA fotografia'`,
      )
    ).length,
    0,
  );
  assert.equal(
    await page.getByLabel("Nome", { exact: true }).inputValue(),
    "QA fotografia",
  );
  fail = false;
  await click("Guardar produto");
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  const [saved] = await query(
    `select * from public.catalog_products where details->>'name'='QA fotografia'`,
  );
  assert.equal(saved.published, false);
  assert.match(
    saved.details.image,
    /^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(webp|jpg)$/,
  );
  console.log(
    "PASS oversized file and cancelled chooser preserve the valid image; upload failure keeps form and retry saves one draft",
  );
  await menu("Gerir catálogo");
  await click("Editar produto QA fotografia");
  await fill("Descrição", "Rascunho com conflito");
  await query(
    `update public.catalog_products set details=jsonb_set(details,'{description}','"Outra sessão"') where id='${saved.id}'`,
  );
  await click("Guardar produto");
  await page
    .getByRole("alert")
    .filter({ hasText: /alterad|versão|reabra/i })
    .waitFor();
  assert.equal(
    (
      await query(
        `select details from public.catalog_products where id='${saved.id}'`,
      )
    )[0].details.description,
    "Outra sessão",
  );
  assert.equal(
    await page.getByLabel("Descrição", { exact: true }).inputValue(),
    "Rascunho com conflito",
  );
  console.log(
    "PASS concurrent product change is refused without overwriting another session or discarding the draft",
  );
  await click("Cancelar edição");
  await page
    .getByRole("heading", { name: "Gerir catálogo", exact: true })
    .waitFor();
  for (const label of [
    "Novo produto",
    "Gerir catálogo",
    "Precificação",
    "Encomendas",
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
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
        label + " overflow " + width,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Abrir menu", exact: true })
          .count(),
        1,
      );
      if (width === 390)
        await page.screenshot({
          path: out + "/" + label.replaceAll(" ", "-") + ".png",
          fullPage: true,
        });
    }
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await click("Abrir menu");
  assert.equal(
    await page
      .getByRole("dialog", { name: "Menu", exact: true })
      .getByRole("button", { name: /^Pronta entrega/ })
      .isDisabled(),
    true,
  );
  await click("Fechar menu");
  console.log(
    "PASS nine admin module headers and layouts at four widths; original top menu unique, ready-stock entry disabled",
  );
  await menu("Sair da conta");
  await page
    .getByRole("heading", { name: "Seja bem-vindo!", exact: true })
    .waitFor();
  await page.reload();
  await page
    .getByRole("heading", { name: "Seja bem-vindo!", exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: /Editar produto/ }).count(),
    0,
  );
  console.log(
    "PASS logout removes administrative controls and remembered session",
  );
} catch (e) {
  console.log("ERRORS", platform.errors);
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
