import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createDatabase, scope } from "./helpers/database.mjs";
import { readableBrand } from "../src/design-system/brand.ts";
const key = () => crypto.randomUUID();
test("finance corrections preserve audit, idempotency, balances and tenant boundaries", async (t) => {
  const db = await createDatabase();
  const rpc = async (name, payload) =>
    (
      await db.query("select public." + name + "($1::jsonb) d", [
        JSON.stringify(payload),
      ])
    ).rows[0].d;
  const correction = async (id, version, idempotency_key, replacement) =>
    (
      await db.query("select public.correct_finance($1,$2,$3,$4::jsonb) d", [
        id,
        version,
        idempotency_key,
        JSON.stringify(replacement),
      ])
    ).rows[0].d;
  const balance = async (id) =>
    (
      await db.query(
        "select coalesce(sum(case when type='receipt' then amount_cents when type='refund' then -amount_cents else 0 end),0)::int n from public.finance_entries where order_id=$1 and voided_at is null",
        [id],
      )
    ).rows[0].n;
  try {
    await scope(db);
    const day = (await db.query("select (current_date+3)::text d")).rows[0].d;
    let order = await rpc("create_order_admin", {
      idempotency_key: key(),
      delivery_date: day,
      fulfillment: "pickup",
      customer: { name: "Fixture", phone: "+351000000000" },
      items: [
        {
          product_id: "bc-1",
          quantity: 1,
          mode: "preorder",
          configuration: {},
        },
      ],
    });
    const receipt = await rpc("record_finance", {
      idempotency_key: key(),
      order_id: order.id,
      type: "receipt",
      amount_cents: 600,
      description: "Sinal original",
    });
    const change = {
      amount_cents: 500,
      description: "Sinal corrigido",
      method: "Dinheiro",
      day,
    };
    const attempt = key(),
      corrected = await correction(receipt.id, 1, attempt, change);
    assert.equal(corrected.entry.replaced_by, corrected.replacement.id);
    assert.ok(corrected.entry.voided_at);
    assert.equal(await balance(order.id), 500);
    assert.deepEqual(
      await correction(receipt.id, 1, attempt, change),
      corrected,
    );
    await assert.rejects(() => correction(receipt.id, 1, key(), change));
    await assert.rejects(() =>
      correction(corrected.replacement.id, null, key(), change),
    );
    await assert.rejects(() =>
      db.query("update public.finance_entries set amount_cents=1 where id=$1", [
        corrected.replacement.id,
      ]),
    );
    const remainder = await rpc("record_finance", {
      idempotency_key: key(),
      order_id: order.id,
      type: "receipt",
      amount_cents: 700,
      description: "Saldo",
    });
    await assert.rejects(() =>
      correction(corrected.replacement.id, 1, key(), {
        ...change,
        amount_cents: 501,
      }),
    );
    assert.equal(await balance(order.id), 1200);
    await rpc("record_finance", {
      idempotency_key: key(),
      order_id: order.id,
      type: "refund",
      amount_cents: 1000,
      description: "Devolução",
    });
    await assert.rejects(() => correction(remainder.id, 1, key(), null));
    await assert.rejects(() =>
      correction(corrected.replacement.id, 1, key(), {
        ...change,
        amount_cents: 1,
      }),
    );
    assert.equal(await balance(order.id), 200);
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from public.audit_events where action in ('finance.correct','finance.void')",
        )
      ).rows[0].n,
      1,
    );
    const expense = await rpc("record_finance", {
      idempotency_key: key(),
      type: "expense",
      amount_cents: 250,
      description: "Despesa incorreta",
    });
    const voidKey = key(),
      removed = await correction(expense.id, 1, voidKey, null);
    assert.ok(removed.entry.voided_at);
    assert.equal(removed.replacement, null);
    assert.deepEqual(await correction(expense.id, 1, voidKey, null), removed);
    await scope(db, "", "11111111-1111-4111-a111-111111111111", "anon");
    await assert.rejects(() => correction(remainder.id, 1, key(), null));
    const b = "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb",
      other = "22222222-2222-4222-a222-222222222222";
    await db.exec("reset role");
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      b,
      "b@example.test",
    ]);
    await db.query("insert into public.stores(id,slug,name) values($1,$2,$3)", [
      other,
      "fixture-b",
      "B",
    ]);
    await db.query(
      "insert into public.store_members(store_id,user_id,role) values($1,$2,'owner')",
      [other, b],
    );
    await db.query(
      "insert into public.store_entitlements(store_id,status) values($1,'internal')",
      [other],
    );
    await scope(db, b, other);
    await assert.rejects(() => correction(remainder.id, 1, key(), null));
    await scope(db);
    order = (
      await db.query("select public.change_order_status($1,$2,'completed') d", [
        order.id,
        order.version,
      ])
    ).rows[0].d;
    assert.equal(order.status, "completed");
  } finally {
    await db.close();
  }
});
test("brand choices meet the same white text contrast rule as the database", () => {
  for (const color of ["#800000", "#1d4d3c", "#193a69", "#333333"])
    assert.equal(readableBrand(color), true, color);
  for (const color of ["#ffffff", "#fbce00", "#eeeeee", "red", "#fff"])
    assert.equal(readableBrand(color), false, color);
});
