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
  await page.goto(origin);
  await page
    .getByRole("heading", { name: "Seja bem-vindo!", exact: true })
    .waitFor();
  const out = "node_modules/.cache/pd-catalog-journey";
  fs.mkdirSync(out, { recursive: true });
  await page.screenshot({ path: out + "/home.png", fullPage: true });
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
    .getByRole("button", {
      name:
        "Editar produto " +
        platform.productRows.find((p) => p.id === "bc-1").details.name,
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Gerir tópicos", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Adicionar tópico", exact: true })
    .click();
  await page
    .getByLabel("Nome do tópico", { exact: true })
    .fill("Artesanal teste");
  await page
    .getByRole("button", { name: "Confirmar tópico", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Guardar alterações", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Artesanal teste", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("checkbox", { name: "Artesanal teste", exact: true })
      .isChecked(),
    true,
  );
  await page
    .getByRole("button", { name: "Guardar produto", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  const [row] = await query(
    "select details from public.catalog_products where id='bc-1'",
  );
  assert.deepEqual(row.details.tags, ["Artesanal teste"]);
  assert.equal(row.details.topicIds.length, 1);
  console.log("PASS real topic create and product association");
  await page.reload();
  await page
    .getByRole("button", {
      name:
        "Editar produto " +
        platform.productRows.find((p) => p.id === "bc-1").details.name,
      exact: true,
    })
    .click();
  assert.equal(
    await page
      .getByRole("checkbox", { name: "Artesanal teste", exact: true })
      .isChecked(),
    true,
  );
  console.log("PASS product association survives reload");
  const originalId = row.details.topicIds[0];
  await page
    .getByRole("button", { name: "Adicionar tópico ao produto", exact: true })
    .click();
  await page
    .getByLabel("Novo tópico do produto", { exact: true })
    .fill("Chocolate teste");
  await page
    .getByRole("button", { name: "Confirmar e selecionar tópico", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Chocolate teste", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("checkbox", { name: "Chocolate teste", exact: true })
      .isChecked(),
    true,
  );
  await page
    .getByRole("button", { name: "Guardar produto", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  assert.equal(
    (
      await query("select details from public.catalog_products where id='bc-1'")
    )[0].details.tags.length,
    2,
  );
  console.log(
    "PASS direct topic creation is selected and linked on product save",
  );
  await page
    .getByRole("button", {
      name: "Editar produto " + row.details.name,
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Gerir tópicos", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Editar tópico Artesanal teste", exact: true })
    .click();
  await page
    .getByLabel("Nome do tópico", { exact: true })
    .fill("Artesanal renomeado");
  await page
    .getByRole("button", { name: "Confirmar tópico", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Guardar alterações", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Artesanal renomeado", exact: true })
    .waitFor();
  let details = (
    await query("select details from public.catalog_products where id='bc-1'")
  )[0].details;
  assert.ok(details.topicIds.includes(originalId));
  assert.ok(details.tags.includes("Artesanal renomeado"));
  console.log(
    "PASS rename updates linked product labels without changing the topic ID",
  );
  await page
    .getByRole("button", { name: "Gerir tópicos", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Excluir tópico Artesanal renomeado",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Guardar alterações", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Chocolate teste", exact: true })
    .waitFor();
  details = (
    await query("select details from public.catalog_products where id='bc-1'")
  )[0].details;
  assert.ok(!details.topicIds.includes(originalId));
  assert.deepEqual(details.tags, ["Chocolate teste"]);
  await page
    .getByRole("button", { name: "Guardar produto", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: row.details.name, exact: true })
    .click();
  await page
    .getByRole("list", { name: "Tópicos do produto", exact: true })
    .getByText("Chocolate teste", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  console.log(
    "PASS delete removes only the selected topic and product page shows remaining associations",
  );
  await menu("Novo produto");
  await page.getByLabel("Nome", { exact: true }).fill("Produto QA completo");
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Produto e fotografia fictícios");
  await page
    .getByRole("button", { name: "Criar categoria", exact: true })
    .click();
  await page
    .getByLabel("Nome da categoria", { exact: true })
    .fill("Categoria QA");
  await page
    .getByRole("button", { name: "Confirmar nome", exact: true })
    .click();
  await page.getByLabel("Preço", { exact: true }).fill("7,50");
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 40;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#800000";
    ctx.fillRect(0, 0, 40, 40);
    return c.toDataURL("image/png").split(",")[1];
  });
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "qa.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    });
  await page.getByLabel("Mostrar no catálogo público", { exact: true }).check();
  await page
    .getByRole("button", { name: "Adicionar tópico ao produto", exact: true })
    .click();
  await page
    .getByLabel("Novo tópico do produto", { exact: true })
    .fill("Especial QA");
  await page
    .getByRole("button", { name: "Confirmar e selecionar tópico", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Especial QA", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Guardar produto", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Novo produto", exact: true })
    .waitFor({ state: "hidden" });
  const created = (
    await query(
      "select * from public.catalog_products where details->>'name'='Produto QA completo'",
    )
  )[0];
  assert.equal(created.details.price, 7.5);
  assert.deepEqual(created.details.tags, ["Especial QA"]);
  assert.equal(created.published, true);
  assert.match(
    created.details.image,
    /^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(webp|jpg)$/,
  );
  console.log(
    "PASS new category/product/photo/topic/publication persist through browser, API and database policies",
  );
  await page.reload();
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  await menu("Gerir catálogo");
  await page
    .getByRole("button", { name: "Editar categoria Categoria QA", exact: true })
    .click();
  await page
    .getByLabel("Nome da categoria", { exact: true })
    .fill("Categoria QA renomeada");
  await page
    .getByRole("button", { name: "Guardar alterações", exact: true })
    .click();
  assert.equal(
    (
      await query(
        "select details from public.catalog_products where id='" +
          created.id +
          "'",
      )
    )[0].details.category,
    "Categoria QA renomeada",
  );
  console.log("PASS category rename propagates to products");
  await page
    .getByRole("button", {
      name: "Editar categoria " + row.details.category,
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Ordem dos produtos", exact: true })
    .click();
  const first = page.getByRole("button", { name: /^Descer / }).first(),
    firstName = (await first.getAttribute("aria-label")).replace("Descer ", "");
  await first.click();
  await page
    .getByRole("button", { name: "Guardar alterações", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Gerir catálogo", exact: true })
    .waitFor();
  const ordered = await query(
    "select details->>'name' as name from public.catalog_products where details->>'category'='" +
      row.details.category +
      "' order by display_order nulls last,created_at,id",
  );
  assert.equal(ordered[1].name, firstName);
  await page
    .getByRole("button", {
      name: "Editar categoria " + row.details.category,
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Ordem das categorias", exact: true })
    .click();
  await page
    .getByRole("button", { name: /^Descer / })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Guardar alterações", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Gerir catálogo", exact: true })
    .waitFor();
  console.log("PASS product and category ordering persist through the RPC");
  await menu("Início");
  await page
    .getByRole("button", {
      name: "Editar produto Produto QA completo",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Mostrar no catálogo público", { exact: true })
    .uncheck();
  await page
    .getByRole("button", { name: "Guardar produto", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Olá, Gabriela!", exact: true })
    .waitFor();
  assert.equal(
    (
      await query(
        "select published from public.catalog_products where id='" +
          created.id +
          "'",
      )
    )[0].published,
    false,
  );
  await menu("Gerir catálogo");
  await page
    .getByRole("button", {
      name: "Editar categoria Categoria QA renomeada",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Excluir categoria", exact: true })
    .click();
  await page.getByRole("combobox").click();
  await page
    .getByRole("option", { name: row.details.category, exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar exclusão", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Gerir catálogo", exact: true })
    .waitFor();
  assert.equal(
    (
      await query(
        "select details from public.catalog_products where id='" +
          created.id +
          "'",
      )
    )[0].details.category,
    row.details.category,
  );
  console.log(
    "PASS draft publication and deleting a category safely transfers its product",
  );
} catch (e) {
  console.log("DB/API errors", platform.errors);
  await page.screenshot({
    path: "node_modules/.cache/pd-catalog-journey/failure.png",
    fullPage: true,
  });
  throw e;
} finally {
  await context.close();
  await platform.close();
  await browser.close();
}
