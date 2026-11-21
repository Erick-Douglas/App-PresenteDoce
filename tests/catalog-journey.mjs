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
const out = "node_modules/.cache/pd-catalog-journey";
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
  },
  save = async () => {
    await click("Guardar alterações");
    await page
      .getByRole("heading", { name: "Gerir catálogo", exact: true })
      .waitFor();
  };
try {
  await page.goto(origin);
  await menu("Entrar");
  await fill("E-mail", "fixture@example.test");
  await fill("Senha", "isolated-password");
  await click("Entrar com e-mail");
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  const original = platform.productRows.find((p) => p.id === "bc-1"),
    category = original.details.category;
  await menu("Gerir catálogo");
  await click("Editar categoria " + category);
  await click("Adicionar grupo");
  await fill("Título do grupo 1", "Cobertura QA");
  await click("Adicionar opção");
  await fill("Opção 1.1", "Chocolate QA");
  await fill("Acréscimo 1.1", "1,20");
  await save();
  let [p] = await query(
    "select * from public.catalog_products where id='bc-1'",
  );
  assert.equal(p.details.optionGroups[0].options[0].extraCents, 120);
  await click("Editar categoria " + category);
  await fill("Nome da categoria", category + " QA");
  await save();
  [p] = await query("select * from public.catalog_products where id='bc-1'");
  assert.equal(p.details.category, category + " QA");
  assert.equal(p.details.optionGroups[0].title, "Cobertura QA");
  console.log(
    "PASS category group changes and renaming propagate to inherited products through real RPC/SQL",
  );
  await menu("Início");
  await click("Editar produto " + original.details.name);
  await page
    .getByRole("checkbox", { name: "Usar os grupos da categoria", exact: true })
    .uncheck();
  await fill("Título do grupo 1", "Só este produto");
  await fill("Acréscimo 1.1", "2,30");
  await click("Guardar produto");
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  await menu("Gerir catálogo");
  await click("Editar categoria " + category + " QA");
  await fill("Título do grupo 1", "Cobertura da categoria");
  await fill("Acréscimo 1.1", "1,50");
  await save();
  [p] = await query("select * from public.catalog_products where id='bc-1'");
  assert.equal(p.details.optionGroupsMode, "product");
  assert.equal(p.details.optionGroups[0].title, "Só este produto");
  assert.equal(p.details.optionGroups[0].options[0].extraCents, 230);
  console.log(
    "PASS product override stays independent when the category groups change",
  );
  await click("Editar categoria " + category + " QA");
  await click("Ordem dos produtos");
  const first = page.getByRole("button", { name: /^Descer / }).first(),
    name = (await first.getAttribute("aria-label")).slice(7);
  await first.click();
  await save();
  let ordered = await query(
    "select details->>'name' name from public.catalog_products where details->>'category'='" +
      category +
      " QA' order by display_order nulls last,created_at,id",
  );
  assert.equal(ordered[1].name, name);
  await click("Editar categoria " + category + " QA");
  await click("Ordem das categorias");
  await page
    .getByRole("button", { name: /^Descer / })
    .first()
    .click();
  await save();
  console.log("PASS category and product ordering survive saves");
  await menu("Início");
  await click("Editar produto " + original.details.name);
  await page
    .getByRole("checkbox", { name: "Mostrar no catálogo público", exact: true })
    .uncheck();
  await click("Guardar produto");
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  assert.equal(
    (
      await query(
        "select published from public.catalog_products where id='bc-1'",
      )
    )[0].published,
    false,
  );
  await menu("Gerir catálogo");
  await click("Editar categoria " + category + " QA");
  await click("Excluir categoria");
  await page.getByRole("combobox").click();
  const destination = (
    await query(
      "select name from public.catalog_categories where name<>'" +
        category +
        " QA' order by name limit 1",
    )
  )[0].name;
  await page.getByRole("option", { name: destination, exact: true }).click();
  await click("Confirmar exclusão");
  await page
    .getByRole("heading", { name: "Gerir catálogo", exact: true })
    .waitFor();
  assert.equal(
    (
      await query("select details from public.catalog_products where id='bc-1'")
    )[0].details.category,
    destination,
  );
  assert.equal(
    (
      await query(
        "select * from public.catalog_categories where name='" +
          category +
          " QA'",
      )
    ).length,
    0,
  );
  console.log(
    "PASS draft visibility and deleting a category safely moves products without deleting them",
  );
  assert.deepEqual(platform.errors, []);
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
