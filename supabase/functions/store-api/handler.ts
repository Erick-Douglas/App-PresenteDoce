import { z } from "zod";

const uuid = z.string().uuid();
const text = (max: number) => z.string().trim().max(max);
const money = z
  .number()
  .finite()
  .min(0)
  .max(99999.99)
  .refine(
    (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.000001,
    "Use duas casas decimais.",
  );
const customer = z
  .object({
    name: text(100).min(1),
    phone: text(30).regex(/^[+0-9 ()-]{6,30}$/),
    email: z.string().email().or(z.literal("")).optional().default(""),
    address: text(500).optional().default(""),
  })
  .strict();
const configuration = z
  .object({
    massa: text(80).optional(),
    recheio1: text(80).optional(),
    recheio2: text(80).optional(),
    tema: text(300).optional(),
    selectedFlavors: z.array(text(80)).max(50).optional(),
    observations: text(2000).optional(),
  })
  .strict();
const order = z
  .object({
    idempotency_key: uuid,
    delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    fulfillment: z.enum(["pickup", "delivery"]),
    customer,
    customer_id: uuid.optional(),
    kind: z.enum(["order", "quote"]).optional(),
    notes: text(2000).optional(),
    items: z
      .array(
        z
          .object({
            product_id: text(64).min(1),
            variant: text(100).optional().default(""),
            quantity: z.number().int().min(1).max(1000),
            mode: z.enum(["ready", "preorder"]),
            configuration: configuration.optional().default({}),
          })
          .strict(),
      )
      .min(1)
      .max(50),
  })
  .strict();
const variant = z
  .object({
    label: text(80).min(1),
    price: money,
    maxFlavors: z.number().int().min(1).max(100).optional(),
  })
  .strict();
const product = z
  .object({
    name: text(100).min(1),
    description: text(3000).min(1),
    category: text(60).min(1),
    price: money,
    image: text(600),
    tags: z.array(text(80)).max(20).optional(),
    topicIds: z.array(uuid).max(20).optional(),
    orderMode: z.enum(["simple", "cake", "brigadeiros", "salgados"]).optional(),
    configuravel: z.boolean().optional(),
    simples: z.boolean().optional(),
    variants: z.array(variant).max(20).optional(),
    flavors: z.array(text(80)).max(50).optional(),
    rating: z.number().optional(),
    reviewsCount: z.number().optional(),
    isNew: z.boolean().optional(),
    topSeller: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    saleModes: z
      .array(z.enum(["ready", "preorder"]))
      .min(1)
      .max(2)
      .optional(),
    capacityUnits: z.number().int().min(0).max(100).optional(),
  })
  .strict();
const option = z.union([
  text(80).min(1),
  z
    .object({
      label: text(80).min(1),
      extra_cents: z.number().int().min(0).max(999999),
    })
    .strict(),
]);
const settings = z
  .object({
    whatsapp: text(30).min(6),
    email: z.string().email().or(z.literal("")),
    address: text(500),
    hours: text(300),
    lead_days: z.number().int().min(0).max(99),
    daily_capacity: z.number().int().min(0).max(9999),
    deposit_percent: z.number().int().min(0).max(100),
    delivery_fee_cents: z.number().int().min(0).max(999999).nullable(),
    delivery_enabled: z.boolean(),
    cake_masses: z.array(option).max(50),
    cake_fillings: z.array(option).max(50),
    gallery: z
      .array(
        z
          .object({ image: text(300), title: text(100), category_id: uuid })
          .strict(),
      )
      .max(100),
  })
  .strict();

export type Environment = { url: string; serviceKey: string; origin?: string };
type Fetcher = typeof fetch;
class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
const schemas = {
  "order.create": order,
  "order.status": z
    .object({
      id: uuid,
      version: z.number().int().positive(),
      status: z.enum([
        "confirmed",
        "production",
        "ready",
        "completed",
        "canceled",
      ]),
    })
    .strict(),
  "order.delivery_fee": z
    .object({
      id: uuid,
      version: z.number().int().positive(),
      amount_cents: z.number().int().min(0).max(999999),
    })
    .strict(),
  "customer.merge": z.object({ source: uuid, target: uuid }).strict(),
  "stock.adjust": z
    .object({
      product_id: text(64).min(1),
      option: text(100),
      delta: z
        .number()
        .int()
        .min(-100000)
        .max(100000)
        .refine((n) => n !== 0),
      reason: text(200).min(1),
      idempotency_key: uuid,
    })
    .strict(),
  "finance.correct": z
    .object({
      id: uuid,
      version: z.number().int().positive(),
      idempotency_key: uuid,
      replacement: z
        .object({
          amount_cents: z.number().int().positive().max(999999999),
          description: text(200).min(1),
          method: text(40),
          day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        })
        .strict()
        .nullable(),
    })
    .strict(),
  "finance.record": z
    .object({
      order_id: uuid.optional(),
      type: z.enum(["receipt", "refund", "expense"]),
      amount_cents: z.number().int().positive().max(999999999),
      description: text(200).min(1),
      method: text(40).optional(),
      day: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      idempotency_key: uuid,
    })
    .strict(),
  "product.save": z
    .object({
      id: text(64).min(1),
      version: z.number().int().positive().nullable(),
      published: z.boolean(),
      details: product,
    })
    .strict(),
  "customer.save": z
    .object({
      id: uuid.optional(),
      version: z.number().int().positive().optional(),
      data: customer.extend({
        notes: text(2000).default(""),
        archived: z.boolean().optional(),
      }),
    })
    .strict(),
  "ingredient.save": z
    .object({
      id: uuid.optional(),
      version: z.number().int().positive().optional(),
      data: z
        .object({
          name: text(100).min(1),
          brand: text(100),
          unit: z.enum(["g", "ml", "un"]),
          pack_quantity: z.number().finite().positive().max(999999999),
          pack_price_cents: z.number().int().min(0).max(999999999),
          stock_quantity: z.number().finite().min(0).max(999999999),
        })
        .strict(),
    })
    .strict(),
  "calendar.save": z
    .object({
      day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      blocked: z.boolean(),
      capacity: z.number().int().min(0).max(10000).nullable(),
      reason: text(200),
    })
    .strict(),
  "settings.save": z
    .object({
      version: z.number().int().positive(),
      store: z
        .object({
          name: text(100).min(1),
          logo_url: text(300),
          primary_color: z.string().regex(/^#[a-f0-9]{6}$/i),
          currency: z.enum(["EUR", "BRL", "USD", "GBP"]),
          timezone: text(80),
        })
        .strict(),
      settings,
    })
    .strict(),
  "report.daily": z
    .object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
    .strict(),
};
function originAllowed(origin: string) {
  return (
    !origin ||
    origin === "https://presente-doce.vercel.app" ||
    origin === "capacitor://localhost" ||
    /^https?:\/\/(localhost|127[.]0[.]0[.]1)(:[0-9]+)?$/.test(origin) ||
    /^https:\/\/app-presente-doce[-a-z0-9]*-erick-douglas-projects-c8717cab[.]vercel[.]app$/.test(
      origin,
    )
  );
}
async function readBoundedBody(req: Request): Promise<string> {
  if (Number(req.headers.get("content-length") || 0) > 65536) {
    void req.body?.cancel().catch(() => {});
    throw new ApiError(413, "Pedido demasiado grande.");
  }
  const reader = req.body?.getReader();
  if (!reader) return "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  const consume = async () => {
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.length;
      if (bytes > 65536) throw new ApiError(413, "Pedido demasiado grande.");
      chunks.push(part.value);
    }
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.length;
    }
    return new TextDecoder().decode(body);
  };
  try {
    return await Promise.race([
      consume(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new ApiError(408, "O envio demorou demasiado. Tente novamente."),
            ),
          10000,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    // Some runtimes leave cancellation pending while the sender is still uploading.
    // Response/size limits must never wait for that remote cooperation.
    void reader.cancel().catch(() => {});
  }
}
export async function handleRequest(
  req: Request,
  env: Environment,
  fetcher: Fetcher = fetch,
): Promise<Response> {
  const origin = req.headers.get("origin") || "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Vary: "Origin",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (originAllowed(origin) && origin)
    headers["Access-Control-Allow-Origin"] = origin;
  headers["Access-Control-Allow-Headers"] =
    "authorization,apikey,content-type,x-store-id,x-client-info";
  headers["Access-Control-Allow-Methods"] = "POST,OPTIONS";
  const reply = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers });
  if (!originAllowed(origin))
    return reply({ error: "Origem não autorizada." }, 403);
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return reply({ error: "Método inválido." }, 405);
  if (!env.url || !env.serviceKey)
    return reply({ error: "Serviço em configuração." }, 503);
  try {
    const raw = await readBoundedBody(req);
    let input: any;
    try {
      input = JSON.parse(raw);
    } catch {
      throw new ApiError(400, "JSON inválido.");
    }
    input = z
      .object({
        store_id: uuid,
        action: z.string().min(1).max(50),
        payload: z.unknown(),
      })
      .strict()
      .parse(input);
    const store = input.store_id,
      action = input.action;
    const token =
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
    const rest = async (
      path: string,
      options: RequestInit = {},
      userToken?: string,
    ) => {
      const response = await fetcher(env.url + path, {
        ...options,
        headers: {
          apikey: env.serviceKey,
          Authorization: "Bearer " + (userToken || env.serviceKey),
          "x-store-id": store,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          ...options.headers,
        },
        signal: AbortSignal.timeout(15000),
      });
      const value = await response.json().catch(() => null);
      if (!response.ok) {
        const safe =
          value && ["P0001", "PT409", "PT429"].includes(value.code)
            ? String(value.message).slice(0, 250)
            : response.status === 401
              ? "A sessão terminou. Entre novamente."
              : response.status === 403
                ? "Sem permissão para esta ação."
                : value?.code === "23503"
                  ? "Este registro tem histórico associado. Preserve-o ou arquive-o."
                  : value?.code === "23505"
                    ? "Este registro já existe. Atualize a lista."
                    : "Não foi possível guardar. Confira os campos e tente novamente.";
        throw new ApiError(
          response.status >= 500 ? 502 : response.status,
          safe,
        );
      }
      return value;
    };
    const rpc = (name: string, body: unknown, userToken?: string) =>
      rest(
        "/rest/v1/rpc/" + name,
        { method: "POST", body: JSON.stringify(body) },
        userToken,
      );
    if (action === "checkout") {
      const payload = order
        .omit({ customer_id: true, kind: true })
        .parse(input.payload);
      const ip = (
        req.headers.get("x-forwarded-for") ||
        req.headers.get("cf-connecting-ip") ||
        "unknown"
      )
        .split(",")
        .at(-1)!
        .trim();
      const hash = Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip)),
        ),
      )
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (
        !(await rpc("consume_checkout_limit", {
          p_store: store,
          p_client: hash,
        }))
      )
        return new Response(
          JSON.stringify({
            error: "Muitas tentativas. Aguarde alguns minutos.",
          }),
          { status: 429, headers: { ...headers, "Retry-After": "600" } },
        );
      const saved = await rpc("checkout_order", {
        p_store: store,
        p_payload: payload,
        p_client: hash,
      });
      const config = await rpc("storefront_config", {});
      const items = await rest(
        "/rest/v1/order_items?store_id=eq." +
          store +
          "&order_id=eq." +
          saved.id +
          "&select=snapshot,quantity,unit_cents,option_key,mode,configuration",
      );
      const fmt = (c: number) =>
        new Intl.NumberFormat("pt-PT", {
          style: "currency",
          currency: saved.currency,
        }).format(c / 100);
      const lines = items.map(
        (item: any) =>
          item.quantity +
          " × " +
          item.snapshot.name +
          (item.option_key ? " · " + item.option_key : "") +
          " — " +
          fmt(item.quantity * item.unit_cents) +
          "\n" +
          Object.entries(item.configuration || {})
            .map(([k, v]) => k + ": " + (Array.isArray(v) ? v.join(", ") : v))
            .join(" · "),
      );
      const message = [
        "*" + config.store.name + "*",
        "Solicitação #" + saved.reference,
        ...lines,
        "Data: " + payload.delivery_date,
        "Receção: " +
          (payload.fulfillment === "pickup" ? "Recolha" : "Entrega"),
        "Cliente: " + payload.customer.name,
        "Telefone: " + payload.customer.phone,
        payload.customer.address ? "Morada: " + payload.customer.address : "",
        (saved.delivery_pending
          ? "Subtotal (entrega a confirmar): "
          : "Total validado: ") + fmt(saved.total_cents),
        "Sinal previsto: " + fmt(saved.deposit_cents),
        "Aguardo confirmação da confeitaria.",
      ]
        .filter(Boolean)
        .join("\n");
      return reply({
        order: saved,
        message,
        whatsapp_url:
          "https://wa.me/" +
          String(config.settings.whatsapp).replace(/\D/g, "") +
          "?text=" +
          encodeURIComponent(message),
      });
    }
    if (!token) throw new ApiError(401, "Entre com a conta da loja.");
    const user = await fetcher(env.url + "/auth/v1/user", {
      headers: { apikey: env.serviceKey, Authorization: "Bearer " + token },
      signal: AbortSignal.timeout(10000),
    });
    if (!user.ok)
      throw new ApiError(401, "A sessão terminou. Entre novamente.");
    if (!(await rpc("is_catalog_admin", {}, token)))
      throw new ApiError(403, "Esta conta não gere esta loja.");
    if (!Object.hasOwn(schemas, action))
      throw new ApiError(400, "Ação desconhecida.");
    const data: any = schemas[action as keyof typeof schemas].parse(
      input.payload,
    );
    if (action === "order.create")
      return reply(await rpc("create_order_admin", { p_payload: data }, token));
    if (action === "order.status")
      return reply(
        await rpc(
          "change_order_status",
          { p_id: data.id, p_version: data.version, p_status: data.status },
          token,
        ),
      );
    if (action === "order.delivery_fee")
      return reply(
        await rpc(
          "set_delivery_fee",
          {
            p_id: data.id,
            p_version: data.version,
            p_cents: data.amount_cents,
          },
          token,
        ),
      );
    if (action === "customer.merge") {
      await rpc(
        "merge_customers",
        { p_source: data.source, p_target: data.target },
        token,
      );
      return reply({ ok: true });
    }
    if (action === "stock.adjust")
      return reply(
        await rpc(
          "adjust_stock",
          {
            p_product: data.product_id,
            p_option: data.option,
            p_delta: data.delta,
            p_reason: data.reason,
            p_key: data.idempotency_key,
          },
          token,
        ),
      );
    if (action === "finance.correct")
      return reply(
        await rpc(
          "correct_finance",
          {
            p_id: data.id,
            p_version: data.version,
            p_key: data.idempotency_key,
            p_replacement: data.replacement,
          },
          token,
        ),
      );
    if (action === "finance.record")
      return reply(await rpc("record_finance", { p_payload: data }, token));
    if (action === "settings.save")
      return reply(
        await rpc(
          "save_store_settings",
          {
            p_version: data.version,
            p_store: data.store,
            p_settings: data.settings,
          },
          token,
        ),
      );
    if (action === "product.save") {
      const rows = await rest(
        "/rest/v1/catalog_products" +
          (data.version === null
            ? ""
            : "?id=eq." +
              encodeURIComponent(data.id) +
              "&version=eq." +
              data.version),
        {
          method: data.version === null ? "POST" : "PATCH",
          body: JSON.stringify(
            data.version === null
              ? {
                  id: data.id,
                  details: data.details,
                  published: data.published,
                }
              : { details: data.details, published: data.published },
          ),
        },
        token,
      );
      if (!rows.length)
        throw new ApiError(409, "O produto mudou. Reabra a versão atual.");
      return reply(rows[0]);
    }
    if (action === "customer.save" || action === "ingredient.save") {
      const table = action === "customer.save" ? "customers" : "ingredients";
      const rows = await rest(
        "/rest/v1/" +
          table +
          (data.id ? "?id=eq." + data.id + "&version=eq." + data.version : ""),
        { method: data.id ? "PATCH" : "POST", body: JSON.stringify(data.data) },
        token,
      );
      if (!rows.length)
        throw new ApiError(409, "O registro mudou. Reabra a versão atual.");
      return reply(rows[0]);
    }
    if (action === "calendar.save") {
      const existing = await rest(
        "/rest/v1/calendar_blocks?day=eq." + data.day + "&select=day",
        {},
        token,
      );
      return reply(
        await rest(
          "/rest/v1/calendar_blocks" +
            (existing.length ? "?day=eq." + data.day : ""),
          {
            method: existing.length ? "PATCH" : "POST",
            body: JSON.stringify(data),
          },
          token,
        ),
      );
    }
    if (action === "report.daily") {
      const state = await rpc("operations_snapshot", {}, token);
      const orders = state.orders.filter(
        (o: any) =>
          o.delivery_date === data.day &&
          !["draft", "canceled", "expired"].includes(o.status),
      );
      const net = (id: string) =>
        state.finance
          .filter((f: any) => !f.voided_at && f.order_id === id)
          .reduce(
            (sum: number, f: any) =>
              sum +
              (f.type === "receipt"
                ? f.amount_cents
                : f.type === "refund"
                  ? -f.amount_cents
                  : 0),
            0,
          );
      return reply({
        day: data.day,
        orders: orders.length,
        deliveries: orders.map((o: any) => ({
          reference: o.reference,
          status: o.status,
          fulfillment: o.fulfillment,
        })),
        deposit_due_cents: orders.reduce(
          (sum: number, o: any) =>
            sum + Math.max(0, o.deposit_cents - net(o.id)),
          0,
        ),
        production: state.items
          .filter((i: any) => orders.some((o: any) => o.id === i.order_id))
          .map((i: any) => ({
            name: i.snapshot.name,
            option: i.option_key,
            quantity: i.quantity,
          })),
      });
    }
    throw new ApiError(400, "Ação não disponível.");
  } catch (error) {
    if (error instanceof z.ZodError)
      return reply(
        {
          error: "Confira os campos indicados.",
          fields: error.issues
            .slice(0, 8)
            .map((i) => ({ path: i.path.join("."), message: i.message })),
        },
        400,
      );
    if (error instanceof ApiError)
      return reply({ error: error.message }, error.status);
    return reply(
      {
        error:
          "A ligação ao serviço falhou. Tente novamente sem alterar os dados.",
      },
      502,
    );
  }
}
