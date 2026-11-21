import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { browserPlatform } from "./helpers/browser-platform.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(
  path.join(
    path.dirname(path.dirname(process.execPath)),
    "node_modules/playwright",
  ),
);
const origin = process.env.PD_BASE_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
  permissions: ["clipboard-read", "clipboard-write"],
});
const platform = await browserPlatform(context, origin);
const page = await context.newPage();
page.setDefaultTimeout(12000);
const menu = async (label) => {
  await page
    .getByRole("button", { name: /^(Abrir menu|Mais|Mais opções)$/ })
    .and(page.locator("button:visible"))
    .first()
    .click();
  await page
    .getByRole("dialog", { name: "Menu", exact: true })
    .getByRole("button", { name: label, exact: true })
    .click();
};
const query = (sql) =>
  platform.query(async () => {
    await platform.db.exec("reset role");
    return (await platform.db.query(sql)).rows;
  });
try {
  const phase = process.env.PD_CAPTURE_PHASE || "after",
    out = "node_modules/.cache/pd-review-journey/" + phase;
  fs.mkdirSync(out, { recursive: true });
  await page.goto(origin);
  await page
    .getByRole("heading", { name: "Seja bem-vindo!", exact: true })
    .waitFor();
  await page.waitForTimeout(800);
  await page.waitForTimeout(800);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out + "/home-390.png" });
  const product = platform.productRows.find((p) => p.id === "bc-1").details;
  await page.getByRole("button", { name: product.name, exact: true }).click();
  await page
    .getByRole("heading", { name: product.name, exact: true })
    .waitFor();
  await page.waitForTimeout(800);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out + "/product-390.png" });
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Adicionar ao carrinho " + product.name,
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: /^Ver carrinho/ }).waitFor();
  await page.waitForTimeout(800);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out + "/bag-390.png" });
  await page.getByRole("button", { name: /^Ver carrinho/ }).click();
  await page
    .getByRole("heading", { name: "A sua encomenda", exact: true })
    .waitFor();
  await page.waitForTimeout(800);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out + "/checkout-390.png" });
  await page
    .getByRole("button", { name: "Voltar ao catálogo", exact: true })
    .click();
  await menu("Entrar");
  await page.getByLabel("E-mail", { exact: true }).fill("fixture@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("isolated-password");
  await page
    .getByRole("button", { name: "Entrar com e-mail", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: /^(Abrir menu|Mais|Mais opções)$/ })
    .and(page.locator("button:visible"))
    .first()
    .click();
  await page.getByRole("dialog", { name: "Menu", exact: true }).waitFor();
  await page.waitForTimeout(800);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out + "/menu-390.png" });
  await page.keyboard.press("Escape");
  for (const label of [
    "Gerir catálogo",
    "Novo produto",
    "Agenda e produção",
    "Precificação",
    "Encomendas",
    "Financeiro",
    "Clientes",
    "Ingredientes",
    "Pronta entrega",
    "Textos da loja",
    "Configurações da loja",
  ]) {
    await menu(label);
    await page.getByRole("heading", { name: label, exact: true }).waitFor();
    await page.locator(".module-panel,.ui-glass-panel").first().waitFor();
    await page.waitForTimeout(800);
    await page.waitForTimeout(800);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: out + "/" + label.replaceAll(" ", "-") + "-390.png",
    });
  }
  fs.writeFileSync(
    out + "/captured.json",
    JSON.stringify({
      origin,
      phase,
      identity: "isolated",
      actualDatabaseRules: true,
    }),
  );
  console.log(
    "PASS review screenshots: storefront, product, checkout, menu and every management module",
  );
} catch (e) {
  console.log(platform.errors);
  throw e;
} finally {
  await context.close();
  await platform.close();
  await browser.close();
}
