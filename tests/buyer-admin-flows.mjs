import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { browserPlatform } from "./helpers/browser-platform.mjs";
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require(
    path.join(
      path.dirname(path.dirname(process.execPath)),
      "node_modules/playwright",
    ),
  ));
}
const origin = process.env.PD_BASE_URL || "http://127.0.0.1:4173",
  out = path.resolve("node_modules/.cache/pd-review");
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined,
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
  permissions: ["clipboard-read", "clipboard-write"],
});
const platform = await browserPlatform(context, origin),
  page = await context.newPage(),
  evidence = [];
page.setDefaultTimeout(12000);
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));
const pass = (s) => {
  console.log("PASS " + s);
  evidence.push(s);
};
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
const choose = async (label, value) => {
  const native = page
    .locator("select")
    .and(page.getByLabel(label, { exact: true }));
  const text = await native.locator("option").evaluateAll(
    (items, v) =>
      items
        .find((i) => i.value === v)
        ?.textContent.trim()
        .replace(/\s+/g, " "),
    value,
  );
  assert.ok(text, "Option " + label + " " + value);
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: text, exact: true }).click();
};
const hit = async (locator) => {
  await locator.scrollIntoViewIfNeeded();
  assert.ok(
    await locator.evaluate((el) => {
      const r = el.getBoundingClientRect(),
        top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return (
        r.y >= 0 &&
        r.bottom <= innerHeight &&
        !!top &&
        (el === top || el.contains(top))
      );
    }),
    "action is visible and reachable",
  );
};
const value = async (sql) =>
  platform.query(async () => {
    await platform.db.exec("reset role");
    return (await platform.db.query(sql)).rows;
  });
try {
  await page.addInitScript(() => {
    window.open = () => null;
  });
  await page.goto(origin);
  await page.getByRole("heading", { name: "Seja bem-vindo!" }).waitFor();
  const simple = platform.productRows.find((p) => p.id === "bc-1").details,
    cake = platform.productRows.find((p) => p.id === "bt-1").details;
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .getByRole("button", {
        name: "Adicionar ao carrinho " + simple.name,
        exact: true,
      })
      .click();
    const bag = page.getByRole("button", { name: /^Ver carrinho/ });
    await bag.waitFor();
    await hit(bag);
    assert.ok(
      await bag
        .innerText()
        .then((s) =>
          s.includes(
            String([320, 390, 768, 1024, 1440, 1920].indexOf(width) + 1),
          ),
        ),
    );
  }
  pass(
    "buyer: repeated add increases quantity; sticky cart is reachable at six widths",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: cake.name, exact: true }).click();
  await page.getByRole("heading", { name: cake.name, exact: true }).waitFor();
  assert.equal(
    await page.getByText("Como prefere encomendar?", { exact: true }).count(),
    0,
  );
  const add = page
    .locator(".product-purchase-bar")
    .getByRole("button", { name: /^Adicionar/ });
  assert.equal(await add.isDisabled(), true);
  await page
    .getByRole("button", {
      name: new RegExp(
        "^" + cake.variants[0].label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      ),
    })
    .click();
  const masses = platform.config.settings.cake_masses,
    fillings = platform.config.settings.cake_fillings;
  const label = (o) => (typeof o === "string" ? o : o.label);
  await page
    .getByRole("button", { name: new RegExp("^" + label(masses[0])) })
    .click();
  await page
    .getByRole("button", { name: new RegExp("^" + label(fillings[0])) })
    .click();
  assert.equal(await add.isEnabled(), true);
  await hit(add);
  await add.click();
  await page.getByRole("button", { name: /^Ver carrinho/ }).click();
  await page
    .getByRole("heading", { name: "A sua encomenda", exact: true })
    .waitFor();
  await page.getByLabel("Nome", { exact: true }).fill("Cliente fictício");
  await page.getByLabel("Telefone", { exact: true }).fill("+351000000000");
  const day = new Date();
  day.setDate(day.getDate() + 3);
  const future = day.toISOString().slice(0, 10);
  await page.locator("input[type=date]").fill(future);
  await page
    .getByRole("button", { name: "Continuar no WhatsApp", exact: true })
    .click();
  await page.getByRole("status").filter({ hasText: "Pedido #" }).waitFor();
  const orders = await value("select to_jsonb(o) d from public.orders o");
  assert.equal(orders.length, 1);
  const items = await value("select to_jsonb(i) d from public.order_items i");
  assert.equal(items.length, 2);
  assert.equal(items.find((i) => i.d.product_id === "bc-1").d.quantity, 6);
  assert.equal(
    items.find((i) => i.d.product_id === "bt-1").d.configuration.massa,
    label(masses[0]),
  );
  await page
    .getByRole("button", { name: "Continuar no WhatsApp", exact: true })
    .click();
  assert.equal((await value("select id from public.orders")).length, 1);
  pass(
    "buyer: custom cake options, checkout, canonical order storage and retry idempotency pass through real API handler and PostgreSQL",
  );
  await page
    .getByRole("button", { name: "Voltar ao catálogo", exact: true })
    .click();
  await menu("Entrar");
  await page.getByLabel("E-mail", { exact: true }).fill("fixture@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("isolated-password");
  await page
    .getByRole("button", { name: "Entrar com e-mail", exact: true })
    .click();
  await page.getByRole("heading", { name: "Olá, Gabriela!" }).waitFor();
  await hit(page.getByRole("button", { name: /^Ver carrinho/ }));
  await page.getByRole("button", { name: cake.name, exact: true }).click();
  const adminAdd = page
    .locator(".product-purchase-bar")
    .getByRole("button", { name: /^Adicionar/ });
  await hit(adminAdd);
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  pass(
    "management storefront: cart and custom-product action stay above the mobile navigation",
  );
  await menu("Encomendas");
  await page
    .getByRole("button", { name: "Nova encomenda", exact: true })
    .click();
  await page.getByLabel("Nome", { exact: true }).fill("Novo cliente fictício");
  await page.getByLabel("Telefone", { exact: true }).fill("+351000000000");
  await page
    .getByRole("button", { name: "Guardar encomenda", exact: true })
    .click();
  const productChoice = page.getByRole("combobox", {
    name: "Produto",
    exact: true,
  });
  assert.equal(await productChoice.getAttribute("aria-invalid"), "true");
  await productChoice.press("ArrowDown");
  await productChoice.press("ArrowDown");
  await productChoice.press("Enter");
  assert.equal(await productChoice.getAttribute("aria-expanded"), "false");
  await productChoice.click();
  await page
    .getByRole("heading", { name: "Nova encomenda ou orçamento", exact: true })
    .click();
  assert.equal(await productChoice.getAttribute("aria-expanded"), "false");
  pass(
    "selectors: required validation, keyboard selection and outside dismissal",
  );
  await choose("Produto", "bc-1");
  await page.getByLabel("Quantidade", { exact: true }).fill("1");
  await page.getByLabel("Data", { exact: true }).fill(future);
  await page
    .getByRole("button", { name: "Guardar encomenda", exact: true })
    .click();
  await page.getByRole("button", { name: /Novo cliente fictício/ }).waitFor();
  const manual = (
    await value(
      "select to_jsonb(o) d from public.orders o where status='confirmed'",
    )
  )[0].d;
  assert.equal(manual.total_cents, 1200);
  assert.equal((await value("select id from public.customers")).length, 2);
  pass(
    "management: new order with a new customer persists in the real database rules",
  );
  await menu("Financeiro");
  await page
    .getByRole("button", { name: "Novo movimento", exact: true })
    .click();
  await choose("Encomenda", manual.id);
  await page.getByLabel("Descrição", { exact: true }).fill("Sinal fictício");
  await page
    .getByRole("button", { name: "Confirmar movimento", exact: true })
    .click();
  await page.getByText("Sinal fictício", { exact: true }).waitFor();
  assert.equal(
    (await value("select amount_cents from public.finance_entries"))[0]
      .amount_cents,
    600,
  );
  await page
    .getByRole("button", {
      name: "Editar movimento Sinal fictício",
      exact: true,
    })
    .click();
  await page.getByLabel("Valor (EUR)", { exact: true }).fill("5");
  await page
    .getByRole("button", { name: "Guardar correção", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Excluir movimento Sinal fictício",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Excluir movimento", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Nenhum movimento neste mês" })
    .waitFor()
    .catch(() =>
      page.getByText("Nenhum movimento neste mês", { exact: true }).waitFor(),
    );
  const ledger = await value("select voided_at from public.finance_entries");
  assert.equal(ledger.length, 2);
  assert.ok(ledger.every((f) => f.voided_at));
  pass(
    "finance: receipt, edit and delete work from the UI with an immutable correction history",
  );
  await menu("Configurações da loja");
  await page.getByLabel("Cor de destaque", { exact: true }).fill("#1d4d3c");
  await page
    .getByRole("button", { name: "Guardar configurações", exact: true })
    .click();
  await page.getByText("Guardado.", { exact: true }).waitFor();
  assert.equal(
    (await value("select primary_color from public.stores"))[0].primary_color,
    "#1d4d3c",
  );
  assert.equal(
    await page
      .locator(".store-masthead")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
    "rgb(29, 77, 60)",
  );
  await page.getByLabel("Cor de destaque", { exact: true }).fill("#ffffff");
  await page
    .getByRole("button", { name: "Guardar configurações", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: /tom mais escuro/ })
    .waitFor();
  assert.equal(
    (await value("select primary_color from public.stores"))[0].primary_color,
    "#1d4d3c",
  );
  await menu("Início");
  assert.equal(
    await page
      .locator(".store-masthead")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
    "rgb(29, 77, 60)",
  );
  await page.screenshot({
    path: path.join(out, "refined-home-390.png"),
    fullPage: true,
  });
  pass(
    "brand: valid color persists and updates the storefront; unreadable color is explained without overwriting it",
  );
  const box = platform.productRows.find((p) => p.id === "br-1").details;
  await page.getByRole("button", { name: box.name, exact: true }).click();
  const firstVariant = box.variants[0];
  await page
    .getByRole("button")
    .filter({ hasText: firstVariant.label })
    .first()
    .click();
  const flavors = box.flavors.filter((f) => f !== "Tudo misturado");
  const max = firstVariant.maxFlavors || flavors.length;
  for (const f of flavors.slice(0, max))
    await page.getByRole("button", { name: f, exact: true }).click();
  if (flavors[max]) {
    await page.getByRole("button", { name: flavors[max], exact: true }).click();
    assert.equal(
      await page
        .getByRole("button", { name: flavors[max], exact: true })
        .getAttribute("aria-pressed"),
      "false",
    );
  }
  assert.equal(
    await page.locator(".product-purchase-bar button.ui-primary").isEnabled(),
    true,
  );
  pass(
    "product options: box quantity and maximum flavor choices remain valid before checkout",
  );

  await platform.query(async () => {
    const { scope } = await import("./helpers/database.mjs");
    await scope(platform.db);
    await platform.db.exec(
      `update public.catalog_products set details=details||'{"saleModes":["ready"]}'::jsonb where id='bc-1'`,
    );
    await platform.db.query(
      "select public.adjust_stock('bc-1','',1,'Fixture',$1)",
      [crypto.randomUUID()],
    );
  });
  await page.goto(origin);
  await page.getByRole("heading", { name: "Olá, Gabriela!" }).waitFor();
  await page.getByRole("button", { name: simple.name, exact: true }).click();
  const readyAdd = page.locator(".product-purchase-bar button.ui-primary");
  assert.equal(await readyAdd.isEnabled(), true);
  await hit(readyAdd);
  await readyAdd.click();
  await page.getByRole("button", { name: /^Ver carrinho/ }).click();
  await page
    .getByLabel("Nome", { exact: true })
    .fill("Pronta entrega fictícia");
  await page.getByLabel("Telefone", { exact: true }).fill("+351000000000");
  await page
    .getByRole("button", { name: "Continuar no WhatsApp", exact: true })
    .click();
  await page.getByRole("status").filter({ hasText: "Pedido #" }).waitFor();
  assert.equal(
    (
      await value(
        "select available from public.product_stock where product_id='bc-1'",
      )
    )[0].available,
    0,
  );
  await page
    .getByRole("button", { name: "Voltar ao catálogo", exact: true })
    .click();
  await page.getByRole("button", { name: simple.name, exact: true }).click();
  assert.equal(
    await page.locator(".product-purchase-bar button.ui-primary").isDisabled(),
    true,
  );
  pass(
    "ready stock: same-day checkout reserves the last unit and disables a subsequent purchase",
  );
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page
    .getByRole("button", { name: /^(Abrir menu|Mais|Mais opções)$/ })
    .and(page.locator("button:visible"))
    .first()
    .click();
  await page.screenshot({ path: path.join(out, "refined-menu-390.png") });
  await page.getByRole("button", { name: "Fechar menu", exact: true }).click();
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(platform.errors, []);
  fs.writeFileSync(
    path.join(out, "buyer-admin-evidence.json"),
    JSON.stringify(
      {
        environment:
          "isolated PostgreSQL + real Edge handler; Auth identity simulated; no external messages",
        checks: evidence,
      },
      null,
      2,
    ),
  );
} catch (e) {
  await page.screenshot({
    path: path.join(out, "buyer-admin-failure.png"),
    fullPage: true,
  });
  console.error("API errors", platform.errors);
  throw e;
} finally {
  await context.close();
  await platform.close();
  await browser.close();
}
