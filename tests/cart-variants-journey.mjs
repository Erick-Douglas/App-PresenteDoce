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
  colorScheme: process.env.PD_THEME === "dark" ? "dark" : "light",
  reducedMotion: "reduce",
  permissions: ["clipboard-read", "clipboard-write"],
});
const platform = await browserPlatform(context, origin),
  page = await context.newPage();
const out =
  "node_modules/.cache/pd-cart-variants" +
  (process.env.PD_THEME === "dark" ? "-dark" : "");
fs.mkdirSync(out, { recursive: true });
page.setDefaultTimeout(12000);
await page.addInitScript(() => {
  window.open = () => null;
});
const query = (sql, params = []) =>
  platform.query(async () => {
    await platform.db.exec("reset role");
    return (await platform.db.query(sql, params)).rows;
  });
const click = (name) => page.getByRole("button", { name, exact: true }).click();
const fill = (label, value) =>
  page.getByLabel(label, { exact: true }).fill(value);
const buy = async () => {
  await page.locator(".product-purchase-bar button.ui-primary").click();
  await page.locator(".product-purchase-bar").waitFor({ state: "hidden" });
};
const bag = page.getByRole("button", { name: /^Ver carrinho/ });
const groups = [
  {
    id: crypto.randomUUID(),
    title: "Massa",
    min: 1,
    max: 1,
    options: [
      { id: crypto.randomUUID(), label: "Baunilha QA", extraCents: 0 },
      { id: crypto.randomUUID(), label: "Chocolate QA", extraCents: 200 },
    ],
  },
];
const cartRows = () => page.locator(".checkout-items > li");
const currentItem = (label) => cartRows().filter({ hasText: label });
const toCart = async () => {
  await bag.click();
  await page
    .getByRole("heading", { name: "A sua encomenda", exact: true })
    .waitFor();
};
try {
  await query(
    'update public.store_settings set settings=settings||\'{"preorder_only":true,"min_notice_hours":48,"lead_days":2,"daily_capacity":100}\'::jsonb',
  );
  await query(
    "insert into public.catalog_categories(name,option_groups) values($1,$2::jsonb)",
    ["Personalizações QA", JSON.stringify(groups)],
  );
  await query(
    "insert into public.catalog_products(id,details,published) values('cart-qa',$1::jsonb,true)",
    [
      JSON.stringify({
        name: "Bolo duas escolhas QA",
        description: "Escolha cada bolo à sua maneira.",
        price: 10,
        category: "Personalizações QA",
        image: "/products/bc-1.jpg",
        optionGroupsMode: "category",
        saleModes: ["preorder"],
        capacityUnits: 1,
        orderMode: "simple",
      }),
    ],
  );
  await page.goto(origin);
  await click("Personalizações QA");
  await click("Personalizar Bolo duas escolhas QA");
  assert.equal(
    await page.getByText("Personalizável", { exact: true }).count(),
    0,
  );
  assert.equal(await page.locator(".contact-assistant").count(), 0);
  await click("Favorito");
  await page
    .getByRole("status")
    .filter({ hasText: "Guardado nos favoritos" })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Favorito", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await click("Favorito");
  await page
    .getByRole("status")
    .filter({ hasText: "Removido dos favoritos" })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Favorito", exact: true })
      .getAttribute("aria-pressed"),
    "false",
  );
  await click("Favorito");
  await page.getByRole("button", { name: /^Baunilha QA/ }).click();
  await fill("Observações do produto", "Bolo para a Ana");
  await buy();
  await bag.waitFor();
  await click("Personalizar Bolo duas escolhas QA");
  assert.equal(
    await page.getByRole("button", { name: /^Atualizar no carrinho/ }).count(),
    0,
  );
  assert.equal(
    await page
      .getByLabel("Observações do produto", { exact: true })
      .inputValue(),
    "",
  );
  await page.getByRole("button", { name: /^Chocolate QA/ }).click();
  await fill("Observações do produto", "Bolo para o João");
  await buy();
  await toCart();
  assert.equal(await cartRows().count(), 2);
  assert.match(
    await page.locator(".checkout-item-count").innerText(),
    /2 itens/,
  );
  assert.match(
    await page.locator(".checkout-products-subtotal").innerText(),
    /22,00/,
  );
  await currentItem("Bolo para a Ana")
    .getByRole("button", { name: "Editar Bolo duas escolhas QA", exact: true })
    .click();
  await click("Aumentar quantidade");
  await buy();
  assert.equal(await cartRows().count(), 2);
  assert.match(
    await page.locator(".checkout-products-subtotal").innerText(),
    /32,00/,
  );
  assert.match(
    await currentItem("Bolo para o João").innerText(),
    /Chocolate QA/,
  );
  await currentItem("Bolo para o João")
    .getByRole("button", { name: "Editar Bolo duas escolhas QA", exact: true })
    .click();
  await click("Adicionar outro com novas escolhas");
  await page.waitForFunction(
    () => document.querySelector("textarea")?.value === "",
  );
  assert.equal(
    await page
      .getByLabel("Observações do produto", { exact: true })
      .inputValue(),
    "",
  );
  await page.getByRole("button", { name: /^Baunilha QA/ }).click();
  await fill("Observações do produto", "Bolo para a Ana");
  await buy();
  assert.equal(await cartRows().count(), 2);
  assert.match(
    await page.locator(".checkout-item-count").innerText(),
    /4 itens/,
  );
  assert.match(
    await page.locator(".checkout-products-subtotal").innerText(),
    /42,00/,
  );
  console.log(
    "PASS same product + fresh choices; independent rows, edit one only, explicit add another, identical choices merge quantity",
  );
  await fill("Nome", "Cliente QA variantes");
  await fill("WhatsApp", "+351000000000");
  await fill("Data de nascimento (opcional)", "1993-04-21");
  await fill(
    "Data pretendida",
    (await query("select (current_date+4)::text d"))[0].d,
  );
  await fill("Horário pretendido", "16:30");
  await currentItem("Bolo para a Ana")
    .getByRole("button", { name: "Editar Bolo duas escolhas QA", exact: true })
    .click();
  await click("Voltar");
  assert.equal(
    await page
      .getByLabel("Data de nascimento (opcional)", { exact: true })
      .inputValue(),
    "1993-04-21",
  );
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
      "overflow " + width,
    );
    const row = currentItem("Bolo para a Ana");
    const boxes = await row.evaluate((el) => {
      const get = (s) => {
        const b = el.querySelector(s).getBoundingClientRect();
        return { x: b.x, y: b.y, right: b.right, bottom: b.bottom };
      };
      return {
        info: get(".checkout-item-info"),
        tools: get(".checkout-line-tools"),
        price: get(".checkout-line-total"),
        quantity: get(".quantity-control"),
      };
    });
    assert.ok(
      boxes.tools.x >= boxes.info.right - 1,
      "actions on right " + width,
    );
    assert.ok(
      boxes.tools.y < boxes.price.y && boxes.price.y < boxes.quantity.y,
      "tools above price above quantity " + width,
    );
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: out + "/checkout-" + width + ".png",
        fullPage: true,
      });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await click("Continuar no WhatsApp");
  await page.getByRole("status").filter({ hasText: "Pedido #" }).waitFor();
  const [order] = await query("select * from public.orders");
  assert.equal(order.total_cents, 4200);
  assert.equal(order.customer_snapshot.birth_date, "1993-04-21");
  const items = await query(
    "select * from public.order_items order by unit_cents",
  );
  assert.equal(items.length, 2);
  assert.equal(items[0].quantity, 3);
  assert.equal(items[1].quantity, 1);
  assert.equal(items[0].configuration.observations, "Bolo para a Ana");
  assert.equal(items[1].configuration.observations, "Bolo para o João");
  assert.equal(
    (await query("select birth_date::text d from public.customers"))[0].d,
    "1993-04-21",
  );
  await click("Continuar no WhatsApp");
  assert.equal((await query("select * from public.orders")).length, 1);
  await currentItem("Bolo para o João")
    .getByRole("button", { name: "Remover Bolo duas escolhas QA", exact: true })
    .click();
  assert.equal(await cartRows().count(), 1);
  console.log(
    "PASS compact checkout at six widths, persisted optional birth date, canonical two-line order, idempotency and removal of only intended row",
  );
  await click("Voltar ao catálogo");
  await page.reload();
  await click("Personalizações QA");
  await click("Bolo duas escolhas QA");
  assert.equal(
    await page
      .getByRole("button", { name: "Favorito", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page.locator('meta[name="theme-color"]').getAttribute("content"),
    "transparent",
  );
  await page.evaluate(() => scrollTo(0, 650));
  assert.equal(
    await page.locator('meta[name="theme-color"]').getAttribute("content"),
    "transparent",
  );
  assert.equal(
    await page.evaluate(
      () =>
        getComputedStyle(document.querySelector(".app-theme"), "::before")
          .content,
    ),
    "none",
  );
  await click("Voltar");
  // Legacy themed cakes also remain separate, with distinct filling choices.
  const cake = platform.productRows.find((p) => p.id === "bt-1").details;
  await click(cake.category);
  const label = (o) => (typeof o === "string" ? o : o.label);
  const masses = platform.config.settings.cake_masses,
    fillings = platform.config.settings.cake_fillings;
  for (let n = 0; n < 2; n++) {
    await click("Personalizar " + cake.name);
    const size = cake.variants[0].label;
    await page
      .getByRole("button", {
        name: new RegExp(
          "^" + size.replace(/[.*+?^\u0024{}()|[\]\\]/g, "\\$&"),
        ),
      })
      .click();
    await page
      .getByRole("button", { name: new RegExp("^" + label(masses[0])) })
      .click();
    await page
      .getByRole("button", { name: new RegExp("^" + label(fillings[n])) })
      .click();
    await page.locator("textarea").fill("Bolo temático " + n);
    await buy();
  }
  await toCart();
  assert.equal(await cartRows().count(), 2);
  assert.match(await cartRows().nth(0).innerText(), /Bolo temático 0/);
  assert.match(await cartRows().nth(1).innerText(), /Bolo temático 1/);
  await click("Voltar ao catálogo");
  await click("Todos");
  const simple = platform.productRows.find((p) => p.id === "bc-1").details;
  const add = page.getByRole("button", {
    name: "Adicionar ao carrinho " + simple.name,
    exact: true,
  });
  await add.click();
  assert.equal(await add.getAttribute("data-added"), "true");
  assert.equal(await add.locator(".product-add-feedback").innerText(), "+1");
  console.log(
    "PASS legacy themed cakes, favorite save/unsave/reload, no assistant/top overlay, transparent metadata before/after scroll and local +1 feedback",
  );
  await click("Abrir menu");
  await page
    .getByRole("dialog", { name: "Menu", exact: true })
    .getByRole("button", { name: "Entrar", exact: true })
    .click();
  await fill("E-mail", "fixture@example.test");
  await fill("Senha", "isolated-password");
  await click("Entrar com e-mail");
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  await click("Abrir menu");
  await page
    .getByRole("dialog", { name: "Menu", exact: true })
    .getByRole("button", { name: "Clientes", exact: true })
    .click();
  await page.getByRole("button", { name: /^Cliente QA variantes/ }).click();
  assert.equal(
    await page
      .getByLabel("Data de nascimento (opcional)", { exact: true })
      .inputValue(),
    "1993-04-21",
  );
  await fill("Data de nascimento (opcional)", "1993-05-22");
  let saving = page.waitForResponse(r=>r.request().postData()?.includes('"action":"customer.save"'));
  await click("Guardar");
  assert.equal((await saving).status(),200);
  await page.getByRole("button",{name:"Guardar",exact:true}).waitFor();
  await page.waitForFunction(
    () =>
      document.querySelector('input[name="birth_date"]')?.value ===
      "1993-05-22",
  );
  assert.equal(
    (await query("select birth_date::text d from public.customers"))[0].d,
    "1993-05-22",
  );
  await fill("Data de nascimento (opcional)", "");
  saving = page.waitForResponse(r=>r.request().postData()?.includes('"action":"customer.save"'));
  await click("Guardar");
  assert.equal((await saving).status(),200);
  await page.waitForFunction(
    () => document.querySelector('input[name="birth_date"]')?.value === "",
  );
  assert.equal(
    (await query("select birth_date::text d from public.customers"))[0].d,
    null,
  );
  console.log(
    "PASS private CRM reads, edits and clears the optional birth date through real gateway/Edge/SQL",
  );
} catch (e) {
  await page.screenshot({ path: out + "/failure.png", fullPage: true });
  console.log(platform.errors);
  throw e;
} finally {
  await context.close();
  await platform.close();
  await browser.close();
}
