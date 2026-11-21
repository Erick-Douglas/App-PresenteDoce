import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createDatabase, scope } from "./helpers/database.mjs";
import {
  optionsExtra,
  selectionProblem,
  legacyGroups,
} from "../src/features/products/options.ts";
import {
  earliestSlot,
  slotInstant,
  slotProblem,
} from "../src/features/checkout/schedule.ts";
const uuid = () => crypto.randomUUID();
const g = uuid(),
  free = uuid(),
  paid = uuid(),
  h = uuid(),
  top = uuid(),
  zero = uuid();
const groups = [
  {
    id: g,
    title: "Massa",
    min: 1,
    max: 1,
    options: [
      { id: free, label: "Baunilha", extraCents: 0 },
      { id: paid, label: "Chocolate", extraCents: 200 },
    ],
  },
  {
    id: h,
    title: "Acabamento",
    min: 0,
    max: 2,
    options: [
      { id: top, label: "Fruta", extraCents: 100 },
      { id: zero, label: "Sem escrita", extraCents: 0 },
    ],
  },
];
test("modifiers: selection rules, free choices, extras and exact-hour calendar arithmetic", () => {
  assert.equal(optionsExtra(groups, { [g]: [paid], [h]: [top, zero] }), 300);
  assert.match(selectionProblem(groups, {}), /Massa/);
  assert.match(selectionProblem(groups, { [g]: [paid, free] }), /até 1/);
  assert.equal(selectionProblem(groups, { [g]: [free] }), "");
  const now = Date.parse("2026-11-21T14:07:00Z"),
    slot = earliestSlot("Europe/Lisbon", 48, now);
  assert.deepEqual(slot, { date: "2026-11-23", time: "14:15" });
  assert.match(
    slotProblem("2026-11-23", "14:06", "Europe/Lisbon", 48, now),
    /48/,
  );
  assert.equal(slotProblem(slot.date, slot.time, "Europe/Lisbon", 48, now), "");
  assert.ok(Number.isNaN(slotInstant("2027-03-28", "01:30", "Europe/Lisbon")));
});
test("modifiers and preorder: real SQL validation, inheritance, snapshots, tenant isolation and 48h", async (t) => {
  const db = await createDatabase();
  try {
    await db.exec(
      "reset role;update public.store_settings set settings=settings||'{\"daily_capacity\":100}'::jsonb",
    );
    let category = (
      await db.query(
        "insert into public.catalog_categories(name,option_groups) values($1,$2::jsonb) returning *",
        ["Grupos QA", JSON.stringify(groups)],
      )
    ).rows[0];
    let product = (
      await db.query(
        "insert into public.catalog_products(id,details,published) values('modifiers-qa',$1::jsonb,true) returning *",
        [
          JSON.stringify({
            name: "Bolo QA",
            description: "Fixture",
            price: 10,
            category: category.name,
            image: "/products/bc-1.jpg",
            optionGroupsMode: "category",
            saleModes: ["preorder"],
            capacityUnits: 1,
            orderMode: "simple",
          }),
        ],
      )
    ).rows[0];
    await scope(db);
    const day = (await db.query("select (current_date+4)::text d")).rows[0].d;
    const payload = (selections, extra = {}) => ({
      idempotency_key: uuid(),
      delivery_date: day,
      fulfillment: "pickup",
      customer: {
        name: "Modificadores QA",
        phone: "+351000000000",
        email: "",
        address: "",
      },
      items: [
        {
          product_id: product.id,
          quantity: 2,
          mode: "preorder",
          configuration: { selections },
        },
      ],
      ...extra,
    });
    const create = async (p) =>
      (
        await db.query("select public.create_order_admin($1::jsonb) d", [
          JSON.stringify(p),
        ])
      ).rows[0].d;
    await t.test(
      "inherited choices charge only selected extras for each unit and retain human labels",
      async () => {
        assert.deepEqual(product.details.optionGroups, groups);
        const o = await create(payload({ [g]: [paid], [h]: [top, zero] }));
        assert.equal(o.total_cents, 2600);
        const row = (
          await db.query("select * from public.order_items where order_id=$1", [
            o.id,
          ])
        ).rows[0];
        assert.equal(row.unit_cents, 1300);
        assert.equal(row.configuration.option_labels[0].title, "Massa");
        assert.equal(
          row.configuration.option_labels[0].options[0].label,
          "Chocolate",
        );
        const included = await create(payload({ [g]: [free] }));
        assert.equal(included.total_cents, 2000);
      },
    );
    await t.test(
      "missing, excessive, duplicate, unknown and foreign choices cannot create orders",
      async () => {
        const before = (
          await db.query("select count(*)::int n from public.orders")
        ).rows[0].n;
        for (const selected of [
          {},
          { [g]: [free, paid] },
          { [g]: [paid, paid] },
          { [g]: [uuid()] },
          { [g]: [free], [uuid()]: [top] },
        ])
          await assert.rejects(() => create(payload(selected)));
        assert.equal(
          (await db.query("select count(*)::int n from public.orders")).rows[0]
            .n,
          before,
        );
      },
    );
    await t.test(
      "category changes update inherited products; product overrides remain independent",
      async () => {
        await db.query(
          "insert into public.catalog_products(id,details,published) values('own-groups-qa',$1::jsonb,true)",
          [
            JSON.stringify({
              ...product.details,
              name: "Own QA",
              optionGroupsMode: "product",
              optionGroups: groups,
            }),
          ],
        );
        const updated = structuredClone(groups);
        updated[0].options[1].extraCents = 350;
        updated[0].title = "Escolha a massa";
        category = (
          await db.query(
            "select public.save_catalog_configuration($1::jsonb) d",
            [
              JSON.stringify({
                p_id: category.id,
                p_revision: category.revision,
                p_name: category.name,
                p_topics: [],
                p_option_groups: updated,
              }),
            ],
          )
        ).rows[0].d;
        product = (
          await db.query(
            "select * from public.catalog_products where id='modifiers-qa'",
          )
        ).rows[0];
        assert.equal(product.details.optionGroups[0].title, "Escolha a massa");
        assert.equal(
          product.details.optionGroups[0].options[1].extraCents,
          350,
        );
        assert.equal(
          (
            await db.query(
              "select details from public.catalog_products where id='own-groups-qa'",
            )
          ).rows[0].details.optionGroups[0].options[1].extraCents,
          200,
        );
        const previous = (
          await db.query(
            "select configuration from public.order_items where unit_cents=1300 limit 1",
          )
        ).rows[0].configuration;
        assert.equal(previous.option_labels[0].options[0].extraCents, 200);
      },
    );
    await t.test(
      "conditional flavor limits and legacy labels use the stored group definitions",
      async () => {
        await db.exec("reset role");
        const box = legacyGroups(
          {
            id: "qa",
            name: "Box",
            category: "QA",
            description: "",
            image: "",
            price: 5,
            orderMode: "brigadeiros",
            variants: [
              { label: "Pequena", price: 5, maxFlavors: 1 },
              { label: "Grande", price: 8, maxFlavors: 2 },
            ],
            flavors: ["A", "B"],
          },
          { cake_masses: [], cake_fillings: [] },
        );
        const picks = {
          [box[0].id]: [box[0].options[0].id],
          [box[1].id]: box[1].options.map((o) => o.id),
        };
        await assert.rejects(() =>
          db.query(
            "select presente_doce_private.resolve_product_options($1::jsonb,$2::jsonb,$3)",
            [JSON.stringify(box), JSON.stringify({ selections: picks }), ""],
          ),
        );
        await db.exec("reset role");
        const resolved = (
          await db.query(
            "select presente_doce_private.resolve_product_options($1::jsonb,$2::jsonb,$3) d",
            [
              JSON.stringify(box),
              JSON.stringify({ selectedFlavors: ["A"] }),
              "Grande",
            ],
          )
        ).rows[0].d;
        assert.equal(resolved.extra_cents, 300);
        await scope(db);
      },
    );
    await t.test(
      "ownership and anonymous visibility remain scoped to the store",
      async () => {
        await scope(db, "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb");
        await assert.rejects(() =>
          db.query("select public.save_catalog_configuration($1::jsonb)", [
            JSON.stringify({
              p_id: category.id,
              p_revision: category.revision,
              p_name: "Invasion",
              p_topics: [],
              p_option_groups: groups,
            }),
          ]),
        );
        await scope(db, "", "11111111-1111-4111-a111-111111111111", "anon");
        assert.ok(
          (
            await db.query(
              "select option_groups from public.catalog_categories where id=$1",
              [category.id],
            )
          ).rows[0],
        );
        await scope(db);
      },
    );
    await t.test(
      "only preorder is accepted and exact 48h is enforced with a stored delivery slot",
      async () => {
        await db.exec(
          'reset role;update public.store_settings set settings=settings||\'{"preorder_only":true,"min_notice_hours":48,"lead_days":2}\'::jsonb',
        );
        await scope(db);
        const near = (
          await db.query(
            "select to_char((now()+interval '47 hours 59 minutes') at time zone 'Europe/Lisbon','YYYY-MM-DD') as delivery_day,to_char((now()+interval '47 hours 59 minutes') at time zone 'Europe/Lisbon','HH24:MI') as delivery_time",
          )
        ).rows[0];
        await assert.rejects(
          () =>
            create(
              payload(
                { [g]: [free] },
                {
                  delivery_date: near.delivery_day,
                  delivery_time: near.delivery_time,
                },
              ),
            ),
          /48/,
        );
        await assert.rejects(() => create(payload({ [g]: [free] })), /horário/);
        const valid = payload({ [g]: [free] }, { delivery_time: "15:30" });
        const o = await create(valid);
        const slot = (
          await db.query(
            "select delivery_time,delivery_at from public.orders where id=$1",
            [o.id],
          )
        ).rows[0];
        assert.equal(slot.delivery_time, "15:30");
        assert.ok(slot.delivery_at);
        valid.idempotency_key = uuid();
        valid.items[0].mode = "ready";
        await assert.rejects(() => create(valid), /pronta entrega|encomenda/i);
      },
    );
  } finally {
    await db.close();
  }
});
test("migration keeps a legacy Teste topic as a free purchasable choice, preserving identifiers", async () => {
  const topic = uuid();
  const db = await createDatabase([], async (db, file) => {
    if (file.endsWith("_configurable_product_groups.sql")) {
      await db.query(
        "insert into public.catalog_categories(name,topics) values($1,$2::jsonb)",
        ["Teste", JSON.stringify([{ id: topic, name: "Teste" }])],
      );
      await db.query(
        "insert into public.catalog_products(id,details,published) values('teste-legacy',$1::jsonb,true)",
        [
          JSON.stringify({
            name: "Teste",
            description: "Fixture",
            category: "Teste",
            image: "/products/bc-1.jpg",
            price: 1,
            orderMode: "simple",
            topicIds: [topic],
            tags: ["Teste"],
          }),
        ],
      );
    }
  });
  try {
    const details = (
      await db.query(
        "select details from public.catalog_products where id='teste-legacy'",
      )
    ).rows[0].details;
    assert.equal(details.optionGroups[0].options[0].id, topic);
    assert.equal(details.optionGroups[0].options[0].extraCents, 0);
    assert.equal(details.optionGroupsMode, "category");
    assert.deepEqual(details.topicIds, [topic]);
  } finally {
    await db.close();
  }
});
