// Browser → real Edge handler → isolated PostgreSQL. Only Auth identity is simulated.
import assert from "node:assert/strict";
import { createDatabase, scope } from "./database.mjs";
import { handleGateway } from "../../server/storeGateway.ts";
import { handleRequest } from "../../supabase/functions/store-api/handler.ts";
export async function browserPlatform(context, origin) {
  const db = await createDatabase(),
    sid = "11111111-1111-4111-a111-111111111111",
    uid = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
  const token = "isolated-admin-identity",
    service = "isolated-service-identity";
  await db.exec(
    "update public.store_settings set settings=jsonb_set(settings,'{whatsapp}',to_jsonb('+351000000000'::text))",
  );
  const productRows = (
    await db.query(
      "select to_jsonb(p) d from public.catalog_products p order by display_order nulls last,created_at,id",
    )
  ).rows.map((r) => r.d);
  const config = (await db.query("select public.storefront_config() d")).rows[0]
    .d;
  const errors = [];
  let account = { id: uid, email: "fixture@example.test", user_metadata: {} };
  const images = new Map();
  let queue = Promise.resolve();
  function serial(fn) {
    const next = queue.then(fn);
    queue = next.catch(() => {});
    return next;
  }
  async function provider(url, init = {}) {
    const u = new URL(url),
      p = u.pathname,
      h = new Headers(init.headers),
      auth = (h.get("Authorization") || "").replace("Bearer ", "");
    if (p === "/auth/v1/user")
      return Response.json(
        auth === token ? account : { message: "Unauthorized" },
        { status: auth === token ? 200 : 401 },
      );
    return serial(async () => {
      try {
        const role =
          auth === service
            ? "service_role"
            : auth === token
              ? "authenticated"
              : "anon";
        await scope(
          db,
          auth === token ? uid : "",
          h.get("x-store-id") || sid,
          role,
        );
        const body = init.body ? JSON.parse(init.body) : {};
        if (p.startsWith("/rest/v1/rpc/")) {
          const fn = p.split("/").at(-1);
          const allowed = [
            "is_catalog_admin",
            "catalog_category_details",
            "storefront_config",
            "storefront_availability",
            "operations_snapshot",
            "consume_checkout_limit",
            "checkout_order",
            "create_order_admin",
            "record_finance",
            "correct_finance",
            "save_store_settings",
            "change_order_status",
            "set_delivery_fee",
            "adjust_stock",
            "save_catalog_category",
            "save_catalog_configuration",
            "delete_catalog_category",
          ];
          assert.ok(allowed.includes(fn), "Unexpected RPC " + fn);
          const args = Object.keys(body),
            values = args.map((k) =>
              /p_(expected_)?(product|category)_ids/.test(k)
                ? body[k]
                : typeof body[k] === "object" && body[k] !== null
                  ? JSON.stringify(body[k])
                  : body[k],
            );
          const params = args
            .map(
              (k, i) =>
                k +
                " => $" +
                (i + 1) +
                (/p_(expected_)?product_ids/.test(k)
                  ? "::text[]"
                  : /p_(expected_)?category_ids/.test(k)
                    ? "::uuid[]"
                    : typeof body[k] === "object" && body[k] !== null
                      ? "::jsonb"
                      : ""),
            )
            .join(",");
          const value = (
            await db.query("select public." + fn + "(" + params + ") d", values)
          ).rows[0].d;
          return Response.json(value);
        }
        const table = p.split("/").at(-1);
        assert.ok(
          [
            "catalog_products",
            "catalog_categories",
            "store_presentation",
            "pricing_recipes",
            "stores",
            "customers",
            "ingredients",
            "order_items",
          ].includes(table),
          "Unexpected table " + table,
        );
        const conditions = [],
          values = [];
        for (const name of [
          "id",
          "version",
          "slug",
          "store_id",
          "order_id",
          "revision",
        ])
          if (u.searchParams.has(name)) {
            values.push(u.searchParams.get(name).slice(3));
            conditions.push(name + "=$" + values.length);
          }
        const where = conditions.length
          ? " where " + conditions.join(" and ")
          : "";
        const order = u.searchParams
          .get("order")
          ?.split(",")
          .map((part) => {
            const [key, dir, nulls] = part.split(".");
            assert.match(key, /^[a-z_]+$/);
            assert.ok(!dir || ["asc", "desc"].includes(dir));
            return (
              key +
              " " +
              (dir || "asc") +
              (nulls === "nullslast" ? " nulls last" : "")
            );
          })
          .join(",");
        let rows;
        if (!init.method || init.method === "GET") {
          const columns = u.searchParams.get("select") || "*";
          assert.match(columns, /^[a-z_,*]+$/);
          rows = (
            await db.query(
              "select to_jsonb(t) d from (select " +
                columns +
                " from public." +
                table +
                where +
                (order ? " order by " + order : "") +
                ") t",
              values,
            )
          ).rows.map((r) => r.d);
        } else {
          const allowedFields = [
            "id",
            "details",
            "published",
            "name",
            "phone",
            "email",
            "birth_date",
            "address",
            "notes",
            "archived",
            "brand",
            "unit",
            "pack_quantity",
            "pack_price_cents",
            "stock_quantity",
            "product_id",
            "recipe",
            "home_title",
            "home_description",
            "admin_name",
            "about_text",
            "topics",
            "option_groups",
            "order_mode",
          ];
          const cols = Object.keys(body);
          assert.ok(cols.every((c) => allowedFields.includes(c)));
          const params = cols.map((c) => {
            values.push(
              body[c] !== null && typeof body[c] === "object" ? JSON.stringify(body[c]) : body[c],
            );
            return (
              "$" +
              values.length +
              (body[c] !== null && typeof body[c] === "object" ? "::jsonb" : "")
            );
          });
          const sql =
            init.method === "DELETE"
              ? "delete from public." +
                table +
                where +
                " returning to_jsonb(" +
                table +
                ".*) d"
              : init.method === "POST"
                ? "insert into public." +
                  table +
                  "(" +
                  cols.join(",") +
                  ") values(" +
                  params.join(",") +
                  ") returning to_jsonb(" +
                  table +
                  ".*) d"
                : "update public." +
                  table +
                  " set " +
                  cols.map((c, i) => c + "=" + params[i]).join(",") +
                  where +
                  " returning to_jsonb(" +
                  table +
                  ".*) d";
          rows = (await db.query(sql, values)).rows.map((r) => r.d);
        }
        return Response.json(rows);
      } catch (e) {
        errors.push(p + ": " + e.message);
        return Response.json(
          { code: e.code || "P0001", message: e.message },
          { status: e.code === "42501" ? 403 : 400 },
        );
      }
    });
  }
  await context.route("**/*", async (route) => {
    const req = route.request(),
      u = new URL(req.url()),
      p = u.pathname;
    if (
      !u.hostname.endsWith(".supabase.co") &&
      !(u.origin === origin && p === "/api/store")
    ) {
      if (u.origin === origin || ["data:", "blob:"].includes(u.protocol))
        return route.continue();
      if (req.resourceType() === "image" && req.method() === "GET")
        return route.continue();
      return route.abort();
    }
    if (
      /^\/storage\/v1\/object\/(catalog-images|account-avatars)\//.test(p) &&
      req.method() === "POST"
    ) {
      const bucket = p.split("/")[4],
        name = p.split("/" + bucket + "/")[1],
        bytes = req.postDataBuffer();
      try {
        await serial(async () => {
          await scope(
            db,
            uid,
            req.headers()["x-store-id"] || sid,
            "authenticated",
          );
          await db.query(
            "insert into storage.objects(bucket_id,name,metadata) values($1,$2,$3::jsonb)",
            [
              bucket,
              name,
              JSON.stringify({
                mimetype: req.headers()["content-type"],
                size: bytes.length,
              }),
            ],
          );
        });
        images.set(bucket + "/" + name, {
          bytes,
          type: req.headers()["content-type"],
        });
        return route.fulfill({ status: 200, json: { Key: name } });
      } catch (e) {
        errors.push(e.message);
        return route.fulfill({ status: 403, json: { message: e.message } });
      }
    }
    if (req.resourceType() === "image" && req.method() === "GET") {
      const stored = images.get(p.split("/object/public/")[1]);
      if (stored)
        return route.fulfill({
          status: 200,
          body: stored.bytes,
          contentType: stored.type,
        });
      return route.continue();
    }
    if (
      p.startsWith("/storage/v1/object/account-avatars/") &&
      req.method() === "DELETE"
    ) {
      const name = p.split("/account-avatars/")[1];
      await serial(async () => {
        await scope(db, uid, sid, "authenticated");
        await db.query(
          "delete from storage.objects where bucket_id='account-avatars' and name=$1",
          [name],
        );
      });
      images.delete("account-avatars/" + name);
      return route.fulfill({ status: 200, json: {} });
    }
    if (p === "/auth/v1/user" && req.method() === "PUT") {
      const body = JSON.parse(req.postData());
      assert.deepEqual(Object.keys(body), ["data"]);
      assert.ok(
        Object.keys(body.data).every((k) =>
          ["avatar_path", "display_name"].includes(k),
        ),
      );
      assert.equal(req.headers().authorization, "Bearer " + token);
      account = {
        ...account,
        user_metadata: { ...account.user_metadata, ...body.data },
      };
      return route.fulfill({ status: 200, json: account });
    }
    let response;
    if (p === "/auth/v1/token")
      response = Response.json({
        access_token: token,
        refresh_token: "isolated-refresh",
        expires_in: 3600,
      });
    else if (p === "/auth/v1/logout") response = Response.json({});
    else if (p === "/functions/v1/store-api" || p === "/api/store") {
      const request = new Request(origin + "/api/store", {
        method: req.method(),
        headers: { ...req.headers(), origin },
        body: req.postData(),
      });
      response = await handleGateway(
        request,
        {
          url: "https://fixture.supabase.co",
          publicKey: "sb_publishable_fixture",
        },
        async (url, init) =>
          handleRequest(
            new Request(url, init),
            { url: "https://fixture.supabase.co", serviceKey: service },
            provider,
          ),
      );
    } else
      response = await provider(req.url(), {
        method: req.method(),
        headers: req.headers(),
        body: req.postData(),
      });
    const body = await response.text();
    if (response.status >= 400) errors.push(body);
    return route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body,
    });
  });
  return {
    db,
    productRows,
    config,
    errors,
    close: () => db.close(),
    query: (fn) => serial(fn),
  };
}
