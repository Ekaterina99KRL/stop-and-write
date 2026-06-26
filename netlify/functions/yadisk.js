// Серверный помощник для Яндекс Диска.
// Браузер ученика обращается сюда (это твой же сайт), функция на сервере
// спрашивает у Яндекса прямую ссылку и перенаправляет плеер на неё.
// Видео качается с российских серверов Яндекса — значит, без VPN.
const https = require("https");

exports.handler = async (event) => {
  const link = (event.queryStringParameters && event.queryStringParameters.link) || "";
  if (!link) return { statusCode: 400, body: "missing link" };

  const api = "https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=" +
    encodeURIComponent(link);

  return new Promise((resolve) => {
    https.get(api, { headers: { Accept: "application/json", "User-Agent": "stop-and-write" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const j = JSON.parse(data);
          if (j && j.href) {
            resolve({ statusCode: 302, headers: { Location: j.href, "Cache-Control": "no-store" }, body: "" });
          } else {
            resolve({ statusCode: 404, body: "no href" });
          }
        } catch (e) {
          resolve({ statusCode: 502, body: "parse error" });
        }
      });
    }).on("error", (e) => resolve({ statusCode: 500, body: String(e) }));
  });
};
