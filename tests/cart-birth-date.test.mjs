import test from "node:test";
import assert from "node:assert/strict";
import { createDatabase, scope } from "./helpers/database.mjs";
import { handleRequest } from "../supabase/functions/store-api/handler.ts";
const sid = "11111111-1111-4111-a111-111111111111";
test("birth date is optional, validated and retained privately without rewriting old contacts", async () => {
  const db = await createDatabase();
  try {
    await db.exec(
      'update public.store_settings set settings=settings||\'{"daily_capacity":100,"preorder_only":true}\'::jsonb',
    );
    const day = (await db.query("select (current_date+4)::text d")).rows[0].d;
    const payload = (birth) => ({
      idempotency_key: crypto.randomUUID(),
      delivery_date: day,
      delivery_time: "16:00",
      fulfillment: "pickup",
      customer: {
        name: "Cliente QA nascimento",
        phone: "+351000000000",
        email: "",
        address: "",
        ...(birth !== undefined ? { birth_date: birth } : {}),
      },
      items: [
        {
          product_id: "bc-1",
          quantity: 1,
          mode: "preorder",
          configuration: {},
        },
      ],
    });
    await scope(db);
    const create = async (p) =>
      (
        await db.query("select public.create_order_admin($1::jsonb) d", [
          JSON.stringify(p),
        ])
      ).rows[0].d;
    const p = payload("1993-04-21"),
      order = await create(p);
    assert.equal((await create(p)).id, order.id);
    let rows = (
      await db.query("select birth_date::text d from public.customers")
    ).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].d, "1993-04-21");
    assert.equal(
      (
        await db.query(
          "select customer_snapshot from public.orders where id=$1",
          [order.id],
        )
      ).rows[0].customer_snapshot.birth_date,
      "1993-04-21",
    );
    for (const invalid of ["2999-01-01", "1993-02-30", "21/04/1993"]) {
      await assert.rejects(() => create(payload(invalid)));
    }
    assert.equal(
      (await db.query("select count(*)::int n from public.orders")).rows[0].n,
      1,
    );
    await create(payload(undefined));
    await create(payload(""));
    rows = (
      await db.query(
        "select birth_date::text d from public.customers order by birth_date nulls last",
      )
    ).rows;
    assert.deepEqual(
      rows.map((r) => r.d),
      ["1993-04-21", null, null],
    );
    await scope(db, "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbc");
    assert.equal(
      (await db.query("select * from public.customers")).rows.length,
      0,
    );
    await scope(db, "", sid, "anon");
    await assert.rejects(() => db.query("select * from public.customers"));
  } finally {
    await db.close();
  }
});
test("checkout rejects invalid or future birth dates before sending data to the provider", async () => {
  const env = { url: "https://fixture.supabase.co", serviceKey: "test-key" };
  for (const birth of ["2999-01-01", "1993-02-30", "21/04/1993"]) {
    let called = false;
    const response = await handleRequest(
      new Request("https://fixture/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: sid,
          action: "checkout",
          payload: {
            idempotency_key: crypto.randomUUID(),
            delivery_date: "2026-12-20",
            delivery_time: "16:00",
            fulfillment: "pickup",
            customer: { name: "QA", phone: "+351000000000", birth_date: birth },
            items: [{ product_id: "bc-1", quantity: 1, mode: "preorder" }],
          },
        }),
      }),
      env,
      async () => {
        called = true;
        throw Error("unexpected provider request");
      },
    );
    assert.equal(response.status, 400);
    assert.equal(called, false);
  }
});
