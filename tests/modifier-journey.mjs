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
    colorScheme: process.env.PD_THEME === "dark" ? "dark" : "light",
    permissions: ["clipboard-read", "clipboard-write"],
  }),
  platform = await browserPlatform(context, origin),
  page = await context.newPage();
page.setDefaultTimeout(12000);
await page.addInitScript(() => {
  window.open = () => null;
});
const out =
  "node_modules/.cache/pd-modifier-journey" +
  (process.env.PD_THEME === "dark" ? "-dark" : "");
fs.mkdirSync(out, { recursive: true });
const query = (sql) =>
  platform.query(async () => {
    await platform.db.exec("reset role");
    return (await platform.db.query(sql)).rows;
  });
const click = (name) => page.getByRole("button", { name, exact: true }).click(),
  fill = (name, v) => page.getByLabel(name, { exact: true }).fill(v);
const menu = async (name) => {
  await click("Abrir menu");
  await page
    .getByRole("dialog", { name: "Menu", exact: true })
    .getByRole("button", { name, exact: true })
    .click();
};
const choose = async (name, value) => {
  await page.getByRole("combobox", { name, exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
};
const snap = async (name) => {
  await page.screenshot({ path: out + "/" + name + ".png", fullPage: true });
};
const layout = async (name) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
      name + " overflow " + width,
    );
    if (width === 390) await snap(name);
  }
  await page.setViewportSize({ width: 390, height: 844 });
};
try {
  await query(
    `update public.store_settings set settings=settings||'{"preorder_only":true,"min_notice_hours":48,"lead_days":2,"daily_capacity":100}'::jsonb`,
  );
  await page.goto(origin);
  await menu("Entrar");
  await fill("E-mail", "fixture@example.test");
  await fill("Senha", "isolated-password");
  await click("Entrar com e-mail");
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Abrir menu", exact: true }).count(),
    1,
  );
  assert.equal(
    await page.getByRole("button", { name: "Mais", exact: true }).count(),
    0,
  );
  await menu("Novo produto");
  await page
    .getByRole("heading", { name: "Novo produto", exact: true })
    .waitFor();
  await fill("Nome", "Produto modificadores QA");
  await fill("Descrição", "Produto para testar opções de compra.");
  await click("Criar categoria");
  await fill("Nome da categoria", "Modificadores QA");
  await click("Confirmar nome");
  await fill("Preço base", "10,00");
  await click("Editar grupos da categoria");
  await page
    .getByRole("heading", { name: "Editar categoria", exact: true })
    .waitFor();
  await click("Adicionar grupo");
  await fill("Título do grupo 1", "Escolha a massa");
  await click("Adicionar opção");
  await fill("Opção 1.1", "Baunilha");
  await fill("Acréscimo 1.1", "0");
  await click("Adicionar opção");
  await fill("Opção 1.2", "Chocolate");
  await fill("Acréscimo 1.2", "2,50");
  await click("Adicionar grupo");
  await fill("Título do grupo 2", "Acabamento");
  const group = page.locator(".option-group-editor").nth(1);
  await group
    .getByRole("checkbox", { name: "Escolha obrigatória", exact: true })
    .uncheck();
  await group
    .getByRole("button", { name: "Adicionar opção", exact: true })
    .click();
  await fill("Opção 2.1", "Fruta");
  await fill("Acréscimo 2.1", "1");
  await layout("category-groups");
  await click("Guardar alterações");
  await page
    .getByRole("heading", { name: "Novo produto", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("checkbox", {
        name: "Usar os grupos da categoria",
        exact: true,
      })
      .isChecked(),
    true,
  );
  assert.equal(
    await page
      .getByRole("heading", {
        name: "Disponibilidade de produção",
        exact: true,
      })
      .isVisible()
      .catch(() => false),
    false,
  );
  // Cancelling the file chooser preserves the form and all unsaved values.
  const picker = page.waitForEvent("filechooser");
  await page.getByLabel("Fotografia do produto", { exact: true }).click();
  await (await picker).setFiles([]);
  assert.equal(
    await page.getByLabel("Nome", { exact: true }).inputValue(),
    "Produto modificadores QA",
  );
  await page
    .getByLabel("Fotografia do produto", { exact: true })
    .setInputFiles({
      name: "fixture.jpg",
      mimeType: "image/jpeg",
      buffer: fs.readFileSync("public/products/bc-1.jpg"),
    });
  await page
    .getByRole("checkbox", { name: "Mostrar no catálogo público", exact: true })
    .check();
  await layout("product-editor");
  await click("Guardar produto");
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  const [row] = await query(
    `select * from public.catalog_products where details->>'name'='Produto modificadores QA'`,
  );
  assert.equal(row.details.price, 10);
  assert.equal(row.details.optionGroups.length, 2);
  assert.equal(row.details.optionGroups[0].options[1].extraCents, 250);
  assert.match(row.details.image, /^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(webp|jpg)$/);
  assert.equal(row.published, true);
  console.log(
    "PASS browser category creation, free/paid groups, product inheritance, photo upload and file cancel persist through real API/SQL",
  );
  await page.reload();
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  await menu("Sair da conta");
  await page
    .getByRole("heading", { name: "Seja bem-vindo!", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Modificadores QA", exact: true })
    .click();
  await click("Personalizar Produto modificadores QA");
  await page
    .getByRole("heading", { name: "Produto modificadores QA", exact: true })
    .waitFor();
  assert.equal(
    await page.getByText("Feito para si", { exact: true }).count(),
    0,
  );
  assert.equal(
    await page.locator('input[type="date"],input[type="time"]').count(),
    0,
  );
  assert.equal(
    await page.locator(".product-purchase-bar .ui-primary").isDisabled(),
    true,
  );
  await page
    .getByRole("region", { name: "Escolha a massa", exact: true })
    .getByRole("button", { name: /Chocolate/ })
    .click();
  await page
    .getByRole("region", { name: "Acabamento", exact: true })
    .getByRole("button", { name: /Fruta/ })
    .click();
  await fill("Observações do produto", "Sem escrita por favor");
  await click("Aumentar quantidade");
  await layout("buyer-groups");
  await page.locator(".product-purchase-bar .ui-primary").click();
  await page
    .getByRole("heading", { name: "Seja bem-vindo!", exact: true })
    .waitFor();
  const bag = page.getByRole("button", { name: /^Ver carrinho/ });
  await bag.waitFor();
  assert.equal(
    await page.getByText("Produto adicionado!", { exact: true }).count(),
    0,
  );
  assert.match(await bag.innerText(), /27,00/);
  await click("Produto modificadores QA");
  assert.equal(
    await page
      .getByRole("button", { name: /Chocolate/ })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page
      .getByLabel("Observações do produto", { exact: true })
      .inputValue(),
    "Sem escrita por favor",
  );
  await page
    .getByRole("region", { name: "Escolha a massa", exact: true })
    .getByRole("button", { name: /Baunilha/ })
    .click();
  await page.getByRole("button", { name: /Atualizar no carrinho/ }).click();
  await bag.waitFor();
  assert.match(await bag.innerText(), /22,00/);
  await bag.click();
  await page
    .getByRole("heading", { name: "A sua encomenda", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", {
        name: "Editar Produto modificadores QA",
        exact: true,
      })
      .count(),
    1,
  );
  assert.match(await page.locator("body").innerText(), /Baunilha/);
  console.log(
    "PASS purchase groups validate, paid choices price per unit, add returns home, reopen retains data and updates one cart row",
  );
  await fill("Nome", "Cliente opções QA");
  await fill("WhatsApp", "+351000000000");
  await fill("Horário pretendido", "16:30");
  await page
    .getByLabel("Data pretendida", { exact: true })
    .fill((await query(`select (current_date+4)::text d`))[0].d);
  await choose("Como quer receber?", "Entrega a combinar");
  await fill("Rua ou avenida", "Rua de Teste");
  await fill("Número, andar ou porta", "12");
  await fill("Código postal", "1000-001");
  await fill("Localidade", "Lisboa");
  await choose("Preferência de pagamento", "MB WAY");
  await layout("checkout-modifiers");
  await click("Copiar mensagem");
  assert.equal((await query("select * from public.orders")).length, 0);
  const message = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(message, /Escolha a massa: Baunilha/);
  assert.match(message, /16:30/);
  await click("Continuar no WhatsApp");
  await page.getByRole("status").filter({ hasText: "Pedido #" }).waitFor();
  const [order] = await query("select * from public.orders");
  assert.equal(order.delivery_time, "16:30");
  assert.equal(order.total_cents, 2200);
  assert.match(order.customer_snapshot.address, /Rua de Teste/);
  const [item] = await query("select * from public.order_items");
  assert.equal(item.unit_cents, 1100);
  assert.equal(item.quantity, 2);
  assert.equal(
    item.configuration.option_labels[0].options[0].label,
    "Baunilha",
  );
  await click("Continuar no WhatsApp");
  assert.equal((await query("select * from public.orders")).length, 1);
  console.log(
    "PASS checkout delivery address/date/hour, canonical price/labels, no order on copy and idempotent WhatsApp reservation",
  );
  await click("Voltar ao catálogo");
  await menu("Entrar");
  await fill("E-mail", "fixture@example.test");
  await fill("Senha", "isolated-password");
  await click("Entrar com e-mail");
  await menu("Encomendas");
  await click("Nova encomenda");
  await page
    .getByRole("heading", { name: "Nova encomenda ou orçamento", exact: true })
    .waitFor();
  await fill("Nome", "Pedido manual QA");
  await fill("Telefone", "+351000000000");
  await choose("Produto", "Produto modificadores QA");
  await page
    .getByRole("region", { name: "Escolha a massa", exact: true })
    .getByRole("button", { name: /Chocolate/ })
    .click();
  await click("Guardar encomenda");
  await page
    .getByRole("heading", { name: "Nova encomenda ou orçamento", exact: true })
    .waitFor({ state: "hidden" });
  assert.equal((await query("select * from public.orders")).length, 2);
  console.log(
    "PASS admin manual order uses the same option groups and time validation",
  );
  assert.equal(platform.errors.length, 0, platform.errors.join("\n"));
  console.log(
    "PASS modifier journey complete, responsive 320/390/768/1440; isolated PostgreSQL, real browser/gateway/Edge handler",
  );
} catch (e) {
  console.log("ERRORS", platform.errors);
  await snap("failure");
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
