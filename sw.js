importScripts("https://unpkg.com/@babel/standalone@7.25.8/babel.min.js");

const cachePromise = caches.open("v1");

self.addEventListener("install", (_event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(route(event.request));
});

self.addEventListener("message", async (event) => {
  const { data } = event;

  if (data.type !== "file") {
    return;
  }

  const cache = await cachePromise;

  const { content, filepath } = data;

  const mimeType = filepathToMimeType(filepath);

  const shouldTranspile = mimeType === "text/javascript";

  const request = new Request(filepath);
  const reponse = new Response(
    shouldTranspile ? transpile(content, filepath) : content,
    {
      status: 200,
      headers: {
        "content-length": content.length,
        "content-type": mimeType,
      },
    },
  );

  cache.put(request, reponse);
});

function filepathToMimeType(filepath) {
  if (/\.(tsx?|jsx?)$/.test(filepath)) {
    return "text/javascript";
  } else if (/\.css$/.test(filepath)) {
    return "text/css";
  } else if (/\.svg$/.test(filepath)) {
    return "image/svg+xml";
  } else if (/\.woff2?$/.test(filepath)) {
    return "font/woff2";
  } else if (/\.ttf$/.test(filepath)) {
    return "font/ttf";
  } else if (/\.eot$/.test(filepath)) {
    return "application/vnd.ms-fontobject";
  } else if (/\.otf$/.test(filepath)) {
    return "font/otf";
  } else if (/\.jpeg$/.test(filepath)) {
    return "image/jpeg";
  } else if (/\.png$/.test(filepath)) {
    return "image/png";
  } else if (/\.gif$/.test(filepath)) {
    return "image/gif";
  } else {
    return "text/plain";
  }
}

function transpile(code, path) {
  return Babel.transform(code, {
    filename: path,
    presets: ["react", "typescript"],
  }).code;
}

/** If the request is a Typescript file, transpile it and change to text/javascript */
async function maybeTranspileResponse(request, response) {
  const headers = new Headers(response.headers);

  const shouldTranspile = new URL(request.url).pathname.match(/\.tsx?$/);
  let text = await response.text();

  if (shouldTranspile) {
    headers.set("content-type", "text/javascript");
    text = transpile(text, request.url);
  }

  return new Response(text, {
    ...response,
    headers,
  });
}

async function route(request) {
  const url = new URL(request.url);
  const isSameOrigin = url.origin === location.origin;

  const cache = await cachePromise;

  /** We may still need to transpile some code and fix content-type */
  if (isSameOrigin) {
    const response = await fetch(request).then((response) =>
      maybeTranspileResponse(request, response)
    );
    await cache.put(request, response);
  }

  const matched = await cache.match(request);

  if (matched) {
    return matched;
  }

  const response = await fetch(request);

  cache.put(request, response.clone());

  return response;
}
