importScripts("https://unpkg.com/@babel/standalone@7.25.8/babel.min.js");

self.addEventListener("install", (_event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(route(event.request));
});

/**
 * Adds a querystring to all imports in the code so we can bust the cache
 */
function addQuerystringToImportsBabelPlugin() {
  return {
    visitor: {
      ImportDeclaration(path) {
        const source = path.node.source.value;

        if (typeof source !== "string") {
          return;
        }

        const isRelative = source.startsWith("./") ||
          source.startsWith("../") ||
          source.startsWith("/");

        if (isRelative) {
          path.node.source = Babel.packages.types.stringLiteral(
            `${source}?ts=${Date.now()}`,
          );
        }
      },
      CallExpression(path) {
        if (
          path.node.callee.type === "Import" &&
          path.node.arguments.length === 1 &&
          path.node.arguments[0].type === "StringLiteral"
        ) {
          const source = path.node.arguments[0].value;
          const isRelative = source.startsWith("./") ||
            source.startsWith("../") ||
            source.startsWith("/");

          if (isRelative) {
            path.node.arguments[0].value = `${source}?ts=${Date.now()}`;
          }
        }
      },
    },
  };
}

const transpile = (code, path) =>
  Babel.transform(code, {
    code: true,
    ast: false,
    filename: new URL(path).pathname,
    presets: [["react", { runtime: "automatic" }], "typescript"],
    plugins: [addQuerystringToImportsBabelPlugin],
  }).code;

/** If the request is a Typescript file, transpile it and change to text/javascript */
async function maybeTranspileResponse(request, response) {
  const shouldTranspile = new URL(request.url).pathname.match(/\.tsx?$/);

  if (!shouldTranspile) {
    return response;
  }

  const headers = new Headers(response.headers);

  const text = transpile(await response.text(), request.url);

  headers.set("content-type", "text/javascript");
  headers.set("cache-control", "no-store, no-cache");

  return new Response(text, { ...response, headers });
}

async function route(request) {
  const cache = await caches.open("v1");

  const url = new URL(request.url);
  url.searchParams.delete("ts");

  const response = await cache.match(url) || await fetch(request);

  return maybeTranspileResponse(request, response);
}
