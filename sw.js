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
 * Get importmap from local cache, or fetch
 */
const getImportMapJSON = async (ts) => {
  const url = new URL(`./deno.json?ts=${ts}`, location.href);

  try {
    const response = await caches.match(url) || await fetch(url);

    const cache = await caches.open("v1");
    await cache.put(url, response.clone());

    const importMap = await response.json();

    return importMap;
  } catch (error) {
    console.error(error);
    return {};
  }
};

/**
 * Adds a querystring to all imports in the code so we can bust the cache
 */
function appendTstoImportsBabelPlugin(ts) {
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

        if (!isRelative) {
          return;
        }

        path.node.source = Babel.packages.types.stringLiteral(
          `${source}?ts=${ts}`,
        );
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

          if (!isRelative) {
            return;
          }

          path.node.arguments[0].value = Babel.packages.types.stringLiteral(
            `${source}?ts=${ts}`,
          );
        }
      },
    },
  };
}

/**
 * Replaces all imports with the correct path from the import map
 */
function transformImportMapBabelPlugin(importMap) {
  const prefixes = Object.keys(importMap.imports)
    .filter((prefix) => prefix.endsWith("/"));

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
          return;
        }

        const fullMatch = importMap.imports[source];

        if (fullMatch) {
          path.node.source = Babel.packages.types.stringLiteral(
            fullMatch,
          );

          return;
        }

        const prefix = prefixes.find((prefix) => source.startsWith(prefix));

        if (prefix) {
          const suffix = source.slice(prefix.length);
          const fullMatch = importMap.imports[prefix] + suffix;

          path.node.source = Babel.packages.types.stringLiteral(
            fullMatch,
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
            return;
          }

          const fullMatch = importMap.imports[source];

          if (fullMatch) {
            path.node.arguments[0].value = Babel.packages.types.stringLiteral(
              fullMatch,
            );

            return;
          }

          const prefix = prefixes.find((prefix) => source.startsWith(prefix));

          if (prefix) {
            const suffix = source.slice(prefix.length);
            const fullMatch = importMap.imports[prefix] + suffix;

            path.node.arguments[0].value = Babel.packages.types.stringLiteral(
              fullMatch,
            );
          }
        }
      },
    },
  };
}

const transpile = async (tsCode, path, ts) => {
  const importMap = await getImportMapJSON(ts);

  const { code } = Babel.transform(tsCode, {
    code: true,
    ast: false,
    filename: new URL(path).pathname,
    presets: [["react", { runtime: "automatic" }], "typescript"],
    plugins: [
      appendTstoImportsBabelPlugin(ts),
      transformImportMapBabelPlugin(importMap),
    ],
  });

  return code;
};

/** If the request is a Typescript file, transpile it and change to text/javascript */
async function maybeTranspileResponse(request, response, ts) {
  const shouldTranspile = new URL(request.url).pathname.match(/\.tsx?$/);

  if (!shouldTranspile) {
    return response;
  }

  const headers = new Headers(response.headers);

  const tsCode = await response.text();
  const text = await transpile(tsCode, request.url, ts);

  headers.set("content-type", "text/javascript");
  headers.set("cache-control", "no-store, no-cache");

  return new Response(text, { ...response, headers });
}

async function route(request) {
  const url = new URL(request.url);

  const ts = url.searchParams.get("ts") || Date.now();
  url.searchParams.delete("ts");

  const response = await caches.match(url) || await fetch(request);

  return maybeTranspileResponse(request, response, ts);
}
