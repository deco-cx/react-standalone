importScripts("https://unpkg.com/@babel/standalone@7.25.8/babel.min.js");

self.addEventListener("install", (_event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clearOldCaches());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(route(event.request));
});

const NETWORK_CACHE_NAME = "react-standalone::v5";
const TRANSPILATION_CACHE_NAME = `react-standalone::transpiled::v5`;

/**
 * Clear old caches because browser performs caches.match
 * instead of a match in a given cache
 */
const clearOldCaches = async () => {
  for (const key of await caches.keys()) {
    if (key !== NETWORK_CACHE_NAME && key !== TRANSPILATION_CACHE_NAME) {
      await caches.delete(key);
    }
  }
  await clients.claim();
};

const getFromCache = async (href) => {
  const cache = await caches.open(NETWORK_CACHE_NAME);

  const url = new URL(href);
  const noTs = new URL(url);
  noTs.searchParams.delete("ts");

  return await cache.match(noTs) || await cache.match(url);
};

/**
 * Get importmap from local cache, or fetch
 */
const getImportMapJSON = async (ts) => {
  try {
    const url = new URL(`/deno.json?ts=${ts}`, location.origin);
    const response = await getFromCache(url) || await fetch(url);

    const networkCache = await caches.open(NETWORK_CACHE_NAME);
    await networkCache.put(url, response.clone());

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

const transpile = async (tsCode, href) => {
  const url = new URL(href);
  const ts = url.searchParams.get("ts") || Math.floor(Math.random() * 1e3);

  const isCrossOrigin = !url.origin.includes(location.hostname);
  const importMap = await getImportMapJSON(ts);

  const plugins = [];

  // Do not add ?ts to cross origin imports to improve caching
  // This is ok because we are not changing cross origin code
  if (!isCrossOrigin) {
    plugins.push(appendTstoImportsBabelPlugin(ts));
  }

  plugins.push(transformImportMapBabelPlugin(importMap));

  try {
    const { code } = Babel.transform(tsCode, {
      code: true,
      ast: false,
      filename: url.pathname,
      presets: [["react", { runtime: "automatic" }], "typescript"],
      plugins,
    });

    return code;
  } catch (error) {
    console.error(error);
    return `throw { stack: ${JSON.stringify(error.message || error.stack)} }`;
  }
};

/** If the request is a Typescript file, transpile it and change to text/javascript */
async function maybeTranspileResponse(request, response) {
  const url = new URL(request.url);
  const isJSLike = /\.(tsx?|m?js)$/.test(url.pathname);
  const isBlacklisted = url.origin === location.origin &&
    url.pathname === "/index.js";
  const shouldTranspile = isJSLike && !isBlacklisted;

  if (!shouldTranspile) {
    return { transpiled: false, response };
  }

  const headers = new Headers(response.headers);

  const tsCode = await response.text();

  const start = performance.now();
  const text = await transpile(tsCode, request.url);

  headers.set("content-type", "text/javascript");
  headers.set("cache-control", "no-store, no-cache");
  headers.set(
    "server-timing",
    `transpilation;dur=${performance.now() - start}`,
  );

  return {
    transpiled: true,
    response: new Response(text, { ...response, headers }),
  };
}

async function route(request) {
  const is3p = !request.url.startsWith(location.origin);

  const transpilationCache = await caches.open(TRANSPILATION_CACHE_NAME);
  const match = await transpilationCache.match(request);

  if (match) {
    return match;
  }

  const networkResponse = await getFromCache(request.url) ||
    await fetch(request);

  // Only use network cache for 3p resources
  if (is3p) {
    const networkCache = await caches.open(NETWORK_CACHE_NAME);
    await networkCache.put(request, networkResponse.clone());
  }

  const {
    transpiled,
    response: transpilationResponse,
  } = await maybeTranspileResponse(request, networkResponse);

  if (transpiled) {
    await transpilationCache.put(request, transpilationResponse.clone());
  }

  return transpilationResponse;
}
