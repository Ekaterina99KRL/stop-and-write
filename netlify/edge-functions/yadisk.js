// Улучшенный помощник (edge): берёт у Яндекса прямую ссылку,
// скачивает видео на стороне сервера и отдаёт его плееру ПРАВИЛЬНО —
// как видео (video/mp4), а не как файл "на скачивание".
// Поддерживает перемотку (Range) и работает в России без VPN.
export default async (request) => {
  const url = new URL(request.url);
  const link = url.searchParams.get("link") || "";
  if (!link) return new Response("missing link", { status: 400 });
  try {
    const api =
      "https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=" +
      encodeURIComponent(link);
    const meta = await fetch(api, { headers: { Accept: "application/json" } });
    if (!meta.ok) return new Response("yandex api error", { status: meta.status });
    const j = await meta.json();
    if (!j || !j.href) return new Response("no href", { status: 404 });

    const fwd = {};
    const range = request.headers.get("range");
    if (range) fwd["Range"] = range;

    const fileRes = await fetch(j.href, { headers: fwd });
    const h = new Headers(fileRes.headers);
    h.set("Content-Type", "video/mp4");
    h.delete("Content-Disposition");
    h.set("Accept-Ranges", "bytes");
    h.set("Cache-Control", "no-store");
    return new Response(fileRes.body, { status: fileRes.status, headers: h });
  } catch (e) {
    return new Response("error: " + e, { status: 500 });
  }
};
