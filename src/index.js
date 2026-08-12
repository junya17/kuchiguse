// 口ぐせ — Worker entry
// /api/gen  … Anthropic API へ中継（APIキーはここだけが持つ）
// それ以外  … public/ の静的ファイルを返す

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/gen") {
      if (request.method !== "POST") {
        return json({ error: "method not allowed" }, 405);
      }
      return handleGen(request, env);
    }

    // 静的アセット（index.html など）
    return env.ASSETS.fetch(request);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleGen(request, env) {
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: "ANTHROPIC_API_KEY is not set" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const { system, time, text } = body;
  if (typeof text !== "string" || !text.trim()) {
    return json({ error: "text required" }, 400);
  }
  if (text.length > 300) {
    return json({ error: "text too long" }, 400);
  }

  const prompt = `${system || ""}\n\n時間帯: ${time || ""}\n入力: ${text}`;

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return json({ error: "upstream error", detail }, upstream.status);
    }

    return json(await upstream.json());
  } catch (e) {
    return json({ error: String(e) }, 502);
  }
}
