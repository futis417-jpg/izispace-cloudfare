const ANNOUNCEMENT_KEY = "izispace:announcement";
const MAX_AGE_SECONDS = 60 * 60 * 24;

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

function isAuthorized(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return Boolean(env.ADMIN_TOKEN && token && token === env.ADMIN_TOKEN);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "izispace-cloudflare", time: new Date().toISOString() });
    }

    if (url.pathname === "/api/announcement") {
      if (request.method === "OPTIONS") return json({ ok: true });

      if (request.method === "GET") {
        const raw = await env.ANNOUNCEMENTS.get(ANNOUNCEMENT_KEY);
        return raw ? json(JSON.parse(raw)) : json({ text: "", updatedAt: null });
      }

      if (!isAuthorized(request, env)) return json({ error: "unauthorized" }, 401);

      if (request.method === "POST") {
        let body;
        try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
        const text = String(body?.text || "").trim();
        if (!text || text.length > 180) return json({ error: "text_must_be_1_to_180_chars" }, 422);
        const payload = { text, updatedAt: new Date().toISOString() };
        await env.ANNOUNCEMENTS.put(ANNOUNCEMENT_KEY, JSON.stringify(payload), { expirationTtl: MAX_AGE_SECONDS });
        return json({ ok: true, ...payload });
      }

      if (request.method === "DELETE") {
        await env.ANNOUNCEMENTS.delete(ANNOUNCEMENT_KEY);
        return json({ ok: true });
      }

      return json({ error: "method_not_allowed" }, 405);
    }

    // Cloudflare serves index.html and all embedded/static assets through this binding.
    return env.ASSETS.fetch(request);
  }
};
