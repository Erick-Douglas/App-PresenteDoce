type Environment = { url?: string; publicKey?: string };
type Fetcher = typeof fetch;
class GatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
async function body(req: Request): Promise<string> {
  if (Number(req.headers.get("content-length") || 0) > 65536)
    throw new GatewayError(413, "Pedido demasiado grande.");
  const reader = req.body?.getReader();
  if (!reader) return "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  const consume = async () => {
    let count = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      count += part.value.length;
      if (count > 65536)
        throw new GatewayError(413, "Pedido demasiado grande.");
      chunks.push(part.value);
    }
    const result = new Uint8Array(count);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return new TextDecoder().decode(result);
  };
  try {
    return await Promise.race([
      consume(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new GatewayError(408, "O envio demorou demasiado.")),
          10000,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}
/** One same-origin entry point. Authorization/pricing/quotas remain in the scoped Edge API. */
export async function handleGateway(
  req: Request,
  env: Environment,
  fetcher: Fetcher = fetch,
): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const reply = (error: string, status: number) =>
    Response.json({ error }, { status, headers });
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    return reply("Origem não autorizada.", 403);
  if (req.method !== "POST") return reply("Método inválido.", 405);
  if (
    !env.url ||
    !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(env.url) ||
    !env.publicKey?.startsWith("sb_publishable_")
  )
    return reply("Serviço em configuração.", 503);
  if (
    !req.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return reply("Envie os dados em JSON.", 415);
  try {
    const raw = await body(req);
    try {
      JSON.parse(raw);
    } catch {
      return reply("JSON inválido.", 400);
    }
    const auth = req.headers.get("authorization") || "";
    if (auth.length > 8192) return reply("Sessão inválida.", 401);
    const ip = (
      req.headers.get("x-vercel-forwarded-for") ||
      req.headers.get("x-forwarded-for") ||
      "unknown"
    )
      .split(",")
      .at(-1)!
      .trim()
      .slice(0, 64);
    const response = await fetcher(
      env.url.replace(/\/$/, "") + "/functions/v1/store-api",
      {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        body: raw,
        headers: {
          apikey: env.publicKey,
          "Content-Type": "application/json",
          Origin: "https://presente-doce.vercel.app",
          "x-forwarded-for": ip,
          ...(auth ? { Authorization: auth } : {}),
        },
      },
    );
    if (!response.headers.get("content-type")?.includes("application/json"))
      return reply(
        "O serviço não respondeu como esperado. Tente novamente.",
        502,
      );
    const data = await response.text();
    if (new TextEncoder().encode(data).length > 524288)
      return reply("A resposta excedeu o limite. Atualize a página.", 502);
    const retry = response.headers.get("retry-after");
    return new Response(data, {
      status: response.status,
      headers: { ...headers, ...(retry ? { "Retry-After": retry } : {}) },
    });
  } catch (e) {
    if (e instanceof GatewayError) return reply(e.message, e.status);
    return reply(
      "A ligação ao serviço demorou demasiado ou foi interrompida. Tente novamente sem alterar os dados.",
      504,
    );
  }
}
