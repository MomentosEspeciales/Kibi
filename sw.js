// Service worker: muestra los avisos push y permite abrir la app sin conexión.
const CACHE = "kibi-v8";
const FILES = ["./", "index.html", "styles.css?v=8", "config.js", "logica.js?v=8", "agenda.js", "cripto.js", "datos.cifrados.json", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png", "badge.png"];

self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));

// Red primero (para tener siempre los datos al día) y caché si no hay conexión.
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => { if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "KiBi", {
    body: d.body || "",
    icon: "icon-192.png",
    badge: "badge.png",
    tag: d.tag || "kibi",
    renotify: true,
    data: { url: d.url || "./" }
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const destino = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) if (w.url.startsWith(self.registration.scope) && "focus" in w) return w.focus();
    return self.clients.openWindow(destino);
  }));
});
