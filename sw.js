var CACHE = "ktf-v4";
var SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      var chain = Promise.resolve();
      SHELL.forEach(function (u) {
        chain = chain.then(function () {
          return fetch(u, { cache: "reload" }).then(function (r) {
            if (r && r.ok) return c.put(u, r);
          }).catch(function () {});
        });
      });
      return chain;
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k !== CACHE ? caches.delete(k) : null; }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("message", function (e) {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
  if (e.data === "PURGE") caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { return caches.delete(k); }));
  });
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(req).catch(function () {
      return caches.match(req).then(function (m) { return m || new Response("", { status: 504 }); });
    }));
    return;
  }

  e.respondWith(
    fetch(req).then(function (r) {
      if (r && r.ok) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return r;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (m) {
        if (m) return m;
        if (req.mode === "navigate") {
          return caches.match("./index.html").then(function (h) {
            return h || new Response("", { status: 504 });
          });
        }
        return new Response("", { status: 504 });
      });
    })
  );
});
