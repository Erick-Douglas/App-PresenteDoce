import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { browserPlatform } from "./helpers/browser-platform.mjs";
import { plusDays } from "../src/features/checkout/schedule.ts";
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
const platform = await browserPlatform(context, origin),
  page = await context.newPage();
page.setDefaultTimeout(12000);
await page.addInitScript(() => {
  window.open = () => null;
});
const query = (sql) =>
  platform.query(async () => {
    await platform.db.exec("reset role");
    return (await platform.db.query(sql)).rows;
  });
const choose = async (label, text) => {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: text, exact: true }).click();
};
const out = "node_modules/.cache/pd-checkout-journey";
fs.mkdirSync(out, { recursive: true });
try {
  const current = (await query("select current_date::text as day"))[0].day,
    blocked = plusDays(current, 1),
    full = plusDays(current, 2),
    eligible = plusDays(current, 3);
  await query(
    "insert into public.calendar_blocks(store_id,day,blocked,capacity) values('11111111-1111-4111-a111-111111111111','" +
      blocked +
      "',true,null),('11111111-1111-4111-a111-111111111111','" +
      full +
      "',false,1)",
  );
  await query(
    "update public.catalog_products set details=jsonb_set(details,'{capacityUnits}','1') where id='bc-1'",
  );
  await page.goto(origin);
  const product = platform.productRows.find((p) => p.id === "bc-1").details;
  const add = page.getByRole("button", {
    name: "Adicionar ao carrinho " + product.name,
    exact: true,
  });
  await add.click();
  await add.click();
  assert.equal(new URL(page.url()).hash, "");
  await page.getByRole("button", { name: /^Ver carrinho/ }).click();
  assert.equal(
    await page.getByLabel("Data pretendida", { exact: true }).inputValue(),
    eligible,
  );
  await page.getByLabel("Nome", { exact: true }).fill("Cliente QA endereço");
  await page.getByLabel("WhatsApp", { exact: true }).fill("+351000000000");
  await page
    .getByLabel("E-mail (opcional)", { exact: true })
    .fill("fixture@example.test");
  await choose("Como quer receber?", "Entrega a combinar");
  const fields = {
    "Rua ou avenida": "Rua de Teste",
    "Número, andar ou porta": "12, 2º Dto",
    "Código postal": "1000-001",
    Localidade: "Lisboa",
    "Referência para a entrega (opcional)": "Campainha QA",
  };
  for (const [label, value] of Object.entries(fields))
    await page.getByLabel(label, { exact: true }).fill(value);
  await choose("Preferência de pagamento", "Dinheiro");
  await page.getByLabel("Troco para (opcional)", { exact: true }).fill("100");
  await page
    .getByRole("button", { name: "Editar " + product.name, exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aumentar quantidade", exact: true })
    .click();
  await page.locator(".product-purchase-bar button.ui-primary").click();
  assert.equal(
    await page.getByLabel("Nome", { exact: true }).inputValue(),
    "Cliente QA endereço",
  );
  assert.equal(
    await page.getByLabel("WhatsApp", { exact: true }).inputValue(),
    "+351000000000",
  );
  assert.equal(
    await page.getByLabel("Data pretendida", { exact: true }).inputValue(),
    eligible,
  );
  for (const [label, value] of Object.entries(fields))
    assert.equal(
      await page.getByLabel(label, { exact: true }).inputValue(),
      value,
    );
  assert.equal(
    await page
      .getByLabel("Troco para (opcional)", { exact: true })
      .inputValue(),
    "100",
  );
  console.log(
    "PASS checkout keeps identity, delivery address, payment, date and quantity when editing an item",
  );
  await page
    .getByRole("button", { name: "Editar " + product.name, exact: true })
    .click();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  assert.equal(
    await page.getByLabel("Nome", { exact: true }).inputValue(),
    "Cliente QA endereço",
  );
  await page
    .getByRole("button", { name: "Voltar ao catálogo", exact: true })
    .click();
  await page.getByRole("button", { name: /^Ver carrinho/ }).click();
  assert.equal(
    await page.getByLabel("Localidade", { exact: true }).inputValue(),
    "Lisboa",
  );
  console.log(
    "PASS cancel edit and return from storefront keep checkout fields",
  );
  await page.getByLabel("Data pretendida", { exact: true }).fill(blocked);
  assert.equal(
    await page
      .getByRole("button", { name: "Continuar no WhatsApp", exact: true })
      .isDisabled(),
    true,
  );
  await page.getByLabel("Data pretendida", { exact: true }).fill(full);
  assert.equal(
    await page
      .getByRole("button", { name: "Continuar no WhatsApp", exact: true })
      .isDisabled(),
    true,
  );
  await page.getByLabel("Data pretendida", { exact: true }).fill(eligible);
  console.log(
    "PASS initial date skips blocked/full days and invalid selections cannot be submitted",
  );
  await page
    .getByRole("button", { name: "Copiar mensagem", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Mensagem copiada." })
    .waitFor();
  assert.equal((await query("select id from public.orders")).length, 0);
  console.log(
    "PASS copying a draft never creates an order or reserves capacity",
  );
  await query(
    "insert into public.calendar_blocks(store_id,day,blocked) values('11111111-1111-4111-a111-111111111111','" +
      eligible +
      "',true)",
  );
  await page
    .getByRole("button", { name: "Continuar no WhatsApp", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: /bloquead|recebe/i })
    .first()
    .waitFor();
  assert.equal((await query("select id from public.orders")).length, 0);
  assert.equal(
    await page.getByLabel("Nome", { exact: true }).inputValue(),
    "Cliente QA endereço",
  );
  await page
    .getByLabel("Data pretendida", { exact: true })
    .fill(plusDays(eligible, 1));
  await page
    .getByRole("button", { name: "Continuar no WhatsApp", exact: true })
    .click();
  await page.getByRole("status").filter({ hasText: "Pedido #" }).waitFor();
  let orders = await query("select customer_snapshot from public.orders");
  assert.equal(orders.length, 1);
  assert.match(
    orders[0].customer_snapshot.address,
    /Rua de Teste, 12, 2º Dto · 1000-001 Lisboa · Campainha QA/,
  );
  await page
    .getByRole("link", { name: "Abrir mensagem no WhatsApp", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Continuar no WhatsApp", exact: true })
    .click();
  assert.equal((await query("select id from public.orders")).length, 1);
  console.log(
    "PASS stale availability is rejected by server, address persists, retry is idempotent and WhatsApp fallback is visible",
  );
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
    );
    if ([390, 1440].includes(width))
      await page.screenshot({
        path: out + "/checkout-" + width + ".png",
        fullPage: true,
      });
  }
  console.log("PASS checkout responsive at six widths");
} catch (e) {
  console.log("DB/API errors", platform.errors);
  await page.screenshot({ path: out + "/failure.png", fullPage: true });
  throw e;
} finally {
  await context.close();
  await platform.close();
  await browser.close();
}
