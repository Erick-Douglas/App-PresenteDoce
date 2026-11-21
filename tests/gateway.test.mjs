import test from "node:test";
import assert from "node:assert/strict";
import { handleGateway } from "../server/storeGateway.ts";
const env = {
    url: "https://fixture.supabase.co",
    publicKey: "sb_publishable_fixture",
  },
  host = "https://presente-doce.vercel.app";
const request = (body, headers = {}) =>
  new Request(host + "/api/store", {
    method: "POST",
    headers: { origin: host, "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
test("gateway refuses excessive body before contacting the upstream", async () => {
  let calls = 0;
  const never = async () => {
    calls++;
    throw Error("not reached");
  };
  assert.equal(
    (await handleGateway(request("x".repeat(66000)), env, never)).status,
    413,
  );
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new Uint8Array(66000));
    },
    cancel() {
      return new Promise(() => {});
    },
  });
  const req = new Request(host + "/api/store", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: stream,
    duplex: "half",
  });
  assert.equal((await handleGateway(req, env, never)).status, 413);
  assert.equal(calls, 0);
});
test("gateway rejects foreign origins, wrong types, invalid JSON and missing environment", async () => {
  const never = async () => {
    throw Error("not reached");
  };
  assert.equal(
    (
      await handleGateway(
        request({}, { origin: "https://invalid.example.test" }),
        env,
        never,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleGateway(
        request({}, { "Content-Type": "text/plain" }),
        env,
        never,
      )
    ).status,
    415,
  );
  assert.equal((await handleGateway(request("bad"), env, never)).status, 400);
  assert.equal((await handleGateway(request({}), {}, never)).status, 503);
});
test("gateway preserves the verified user token, trusted source IP and Retry-After", async () => {
  let saved;
  const response = await handleGateway(
    request(
      { action: "checkout" },
      {
        Authorization: "Bearer fixture",
        "x-vercel-forwarded-for": "192.0.2.1",
        "x-forwarded-for": "spoof",
      },
    ),
    env,
    async (url, init) => {
      saved = { url, init };
      return Response.json(
        { error: "Limite" },
        { status: 429, headers: { "Retry-After": "600" } },
      );
    },
  );
  assert.equal(saved.url, env.url + "/functions/v1/store-api");
  assert.equal(saved.init.headers.Authorization, "Bearer fixture");
  assert.equal(saved.init.headers["x-forwarded-for"], "192.0.2.1");
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "600");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});
test("gateway returns a safe error on an upstream failure", async () => {
  const response = await handleGateway(request({}), env, async () => {
    throw Error("private upstream detail");
  });
  assert.equal(response.status, 504);
  assert.equal(
    (await response.text()).includes("private upstream detail"),
    false,
  );
});
test("gateway bounds a stalled request body", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const stream = new ReadableStream({
    cancel() {
      return new Promise(() => {});
    },
  });
  const req = new Request(host + "/api/store", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: stream,
    duplex: "half",
  });
  const pending = handleGateway(req, env, async () => {
    throw Error("not reached");
  });
  t.mock.timers.tick(10001);
  assert.equal((await pending).status, 408);
});
