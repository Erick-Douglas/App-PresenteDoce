import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createDatabase, scope } from "./helpers/database.mjs";
test("account avatars: dedicated bucket, owner isolation, permanent user and no store elevation", async () => {
  const db = await createDatabase();
  try {
    const uid = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
      other = "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb",
      file = uid + "/" + crypto.randomUUID() + ".webp";
    const bucket = (
      await db.query("select * from storage.buckets where id='account-avatars'")
    ).rows[0];
    assert.equal(bucket.public, true);
    assert.equal(bucket.file_size_limit, 2097152);
    assert.deepEqual(bucket.allowed_mime_types, [
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
    await scope(db);
    await db.query(
      "insert into storage.objects(bucket_id,name) values('account-avatars',$1)",
      [file],
    );
    assert.equal(
      (
        await db.query(
          "select name from storage.objects where bucket_id='account-avatars'",
        )
      ).rows.length,
      1,
    );
    await scope(db, other);
    assert.equal(
      (
        await db.query(
          "select name from storage.objects where bucket_id='account-avatars'",
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "delete from storage.objects where bucket_id='account-avatars' returning name",
        )
      ).rows.length,
      0,
    );
    await assert.rejects(() =>
      db.query(
        "insert into storage.objects(bucket_id,name) values('account-avatars',$1)",
        [file],
      ),
    );
    await db.query(
      "insert into storage.objects(bucket_id,name) values('account-avatars',$1)",
      [other + "/" + crypto.randomUUID() + ".jpg"],
    );
    assert.equal(
      (
        await db.query(
          "update public.catalog_products set published=false where id='bc-1' returning id",
        )
      ).rows.length,
      0,
    );
    await scope(db, "", "", "anon");
    await assert.rejects(() =>
      db.query(
        "insert into storage.objects(bucket_id,name) values('account-avatars',$1)",
        [file],
      ),
    );
    await scope(db);
    await db.exec(`set request.jwt.claims='{"is_anonymous":true}'`);
    await assert.rejects(() =>
      db.query(
        "insert into storage.objects(bucket_id,name) values('account-avatars',$1)",
        [uid + "/" + crypto.randomUUID() + ".jpg"],
      ),
    );
    await db.exec("set request.jwt.claims='{}'");
    await assert.rejects(() =>
      db.query(
        "insert into storage.objects(bucket_id,name) values('account-avatars',$1)",
        [uid + "/bad.svg"],
      ),
    );
    assert.equal(
      (
        await db.query(
          "delete from storage.objects where bucket_id='account-avatars' returning name",
        )
      ).rows.length,
      1,
    );
  } finally {
    await db.close();
  }
});
