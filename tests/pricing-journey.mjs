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
  const out = "node_modules/.cache/pd-pricing-journey";
  fs.mkdirSync(out, { recursive: true });
  await page.goto(origin);
  await page
    .getByRole("heading", { name: "Seja bem-vindo!", exact: true })
    .waitFor();
  await menu("Entrar");
  await page.getByLabel("E-mail", { exact: true }).fill("fixture@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("isolated-password");
  await page
    .getByRole("button", { name: "Entrar com e-mail", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  const choose = async (label, value) => {
    await page.waitForFunction(
      ({ label, value }) =>
        Array.from(document.querySelectorAll("select")).some(
          (s) =>
            s.getAttribute("aria-label") === label &&
            Array.from(s.options).some((o) => o.value === value),
        ),
      { label, value },
    );
    const text = await page
      .locator("select")
      .and(page.getByLabel(label, { exact: true }))
      .locator("option")
      .evaluateAll(
        (o, v) => o.find((x) => x.value === v).textContent.trim(),
        value,
      );
    await page.getByRole("combobox", { name: label, exact: true }).click();
    await page.getByRole("option", { name: text, exact: true }).click();
  };
  await menu("Precificação");
  await choose("Produto do catálogo", "bc-1");
  await page
    .getByLabel("Nome da receita (opcional)", { exact: true })
    .fill("Ficha QA");
  await page.getByLabel("Rendimento da receita", { exact: true }).fill("4");
  await page
    .getByLabel("Preço de venda por unidade (€)", { exact: true })
    .fill("15");
  await page
    .getByLabel("Ingrediente ou despesa", { exact: true })
    .fill("Farinha QA");
  await page.getByLabel("Quantidade comprada", { exact: true }).fill("1000");
  await page.getByLabel("Preço da compra (€)", { exact: true }).fill("8");
  await page.getByLabel("Quantidade utilizada", { exact: true }).fill("250");
  await page
    .getByRole("button", { name: "Calcular receita", exact: true })
    .click();
  const result = page.locator(".pricing-results");
  assert.ok((await result.innerText()).includes("0,50"));
  await page
    .getByRole("button", { name: "Guardar ficha", exact: true })
    .click();
  await page
    .getByText("Ficha guardada na conta da confeitaria.", { exact: true })
    .waitFor();
  const saved = (
    await query("select id,recipe from public.pricing_recipes")
  )[0];
  assert.equal(saved.recipe.yieldCount, "4");
  assert.equal(
    (
      await query("select details from public.catalog_products where id='bc-1'")
    )[0].details.price,
    12,
  );
  await page
    .getByRole("button", { name: "Aplicar preço ao produto", exact: true })
    .click();
  assert.equal(
    (
      await query("select details from public.catalog_products where id='bc-1'")
    )[0].details.price,
    12,
  );
  await page
    .getByRole("button", { name: "Confirmar preço", exact: true })
    .click();
  await page
    .getByText("Preço atualizado no catálogo.", { exact: true })
    .waitFor();
  assert.equal(
    (
      await query("select details from public.catalog_products where id='bc-1'")
    )[0].details.price,
    15,
  );
  console.log(
    "PASS pricing calculation 2.00/0.50, persisted recipe and explicit product price confirmation",
  );
  await page
    .getByRole("button", { name: "Limpar rascunho local", exact: true })
    .click();
  assert.equal(
    (await query("select id from public.pricing_recipes")).length,
    1,
  );
  await choose("Ficha guardada", saved.id);
  assert.equal(
    await page
      .getByLabel("Rendimento da receita", { exact: true })
      .inputValue(),
    "4",
  );
  await page.getByLabel("Quantidade utilizada", { exact: true }).fill("500");
  await page
    .getByRole("button", { name: "Guardar ficha", exact: true })
    .click();
  await page
    .getByText("Ficha guardada na conta da confeitaria.", { exact: true })
    .waitFor();
  assert.equal(
    (await query("select recipe from public.pricing_recipes"))[0].recipe
      .ingredients[0].usedQuantity,
    "500",
  );
  await page.screenshot({ path: out + "/pricing-390.png", fullPage: true });
  console.log(
    "PASS pricing reopen/edit/recalculate keeps original when clearing local draft",
  );
} catch (e) {
  console.log("DB/API errors", platform.errors);
  await page.screenshot({
    path: "node_modules/.cache/pd-pricing-journey/failure.png",
    fullPage: true,
  });
  throw e;
} finally {
  await context.close();
  await platform.close();
  await browser.close();
}
