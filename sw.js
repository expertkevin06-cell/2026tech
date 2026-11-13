var CACHE = "ktf-2026-import1";
var SHELL = ["./", "./index.html", "./app.js", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    var p = Promise.resolve();
    SHELL.forEach(function (u) {
      p = p.then(function () {
        return fetch(u, { cache: "reload" }).then(function (r) { if (r && r.ok) return c.put(u, r); }).catch(function () {});
      });
    });
    return p;
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { return k !== CACHE ? caches.delete(k) : null; }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("message", function (e) {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", function (e) {
  var u;
  if (e.request.method !== "GET") return;
  try { u = new URL(e.request.url); } catch (x) { return; }

  if (u.origin !== self.location.origin) {
    e.respondWith(fetch(e.request).catch(function () { return new Response("", { status: 504 }); }));
    return;
  }

  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(function (r) {
    if (r && r.ok) {
      var c = r.clone();
      caches.open(CACHE).then(function (cc) { cc.put(e.request, c); });
    }
    return r;
  }).catch(function () {
    return caches.match(e.request, { ignoreSearch: true }).then(function (m) {
      if (m) return m;
      if (e.request.mode === "navigate") {
        return caches.match("./index.html").then(function (h) { return h || new Response("", { status: 504 }); });
      }
      return new Response("", { status: 504 });
    });
  }));
});
