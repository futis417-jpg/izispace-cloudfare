var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

var ANNOUNCEMENT_KEY = "izispace:announcement";
var MAX_AGE_SECONDS = 60 * 60 * 24;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization"
    }
  });
}
__name(json, "json");

function isAuthorized(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return Boolean(env.ADMIN_TOKEN && token && token === env.ADMIN_TOKEN);
}
__name(isAuthorized, "isAuthorized");

var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return json({ ok: true });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "izispace-cloudflare", time: (new Date()).toISOString() });
    }

    // RUTA QUE RESPONDE CON IA GRATIS:
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const prompt = body?.message || "";
        const system = body?.system || "Eres un asistente inteligente de IZISPACE.";

        if (!prompt) {
          return json({ error: "mensaje_vacio" }, 400);
        }

        const aiResponse = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt }
          ]
        });

        return json({ response: aiResponse.response });
      } catch (err) {
        return json({ error: "Error en la IA", details: err.message }, 500);
      }
    }

    if (url.pathname === "/api/announcement") {
      if (request.method === "GET") {
        const raw = await env.ANNOUNCEMENTS.get(ANNOUNCEMENT_KEY);
        return raw ? json(JSON.parse(raw)) : json({ text: "", updatedAt: null });
      }
      if (!isAuthorized(request, env)) return json({ error: "unauthorized" }, 401);
      if (request.method === "POST") {
        let body;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid_json" }, 400);
        }
        const text = String(body?.text || "").trim();
        if (!text || text.length > 180) return json({ error: "text_must_be_1_to_180_chars" }, 422);
        const payload = { text, updatedAt: (new Date()).toISOString() };
        await env.ANNOUNCEMENTS.put(ANNOUNCEMENT_KEY, JSON.stringify(payload), { expirationTtl: MAX_AGE_SECONDS });
        return json({ ok: true, ...payload });
      }
      if (request.method === "DELETE") {
        await env.ANNOUNCEMENTS.delete(ANNOUNCEMENT_KEY);
        return json({ ok: true });
      }
      return json({ error: "method_not_allowed" }, 405);
    }

    return env.ASSETS.fetch(request);
  }
};

export {
  worker_default as default
};
