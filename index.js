import { getSDK } from "https://webdraw.com/webdraw-sdk";

const cache = await caches.open("react-standalone::v6");

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

const updateFileCache = async (filepath, content) => {
  const request = new URL(filepath, location.origin);

  if (content == null) {
    await cache.delete(request);
    return;
  }

  const response = new Response(`${content}`, {
    status: 200,
    headers: {
      "content-length": content.length,
      "content-type": filepathToMimeType(filepath),
      "cache-control": "no-store, no-cache",
    },
  });

  await cache.put(request, response);
};

let unmount = () => {};

const rerender = async () => {
  unmount();

  try {
    const entry = await import(
      `./app/entry.client.tsx?ts=${Math.floor(Math.random() * 1e3)}`
    );

    unmount = typeof entry.render === "function"
      ? await entry.render()
      : () => {};
  } catch (error) {
    console.error("Error during rerender:", error);
    unmount = () => {};
  }
};

const registerServiceWorker = async () => {
  const waiting = Promise.withResolvers();

  if (!("serviceWorker" in navigator)) {
    throw new Error("ServiceWorker is required to run this app");
  }

  try {
    const registration = await navigator.serviceWorker.register("sw.js");

    if (registration.active) {
      waiting.resolve();
    } else if (registration.waiting || registration.installing) {
      const worker = registration.waiting || registration.installing;

      worker.addEventListener("statechange", (event) => {
        if (event.target.state === "activated") {
          waiting.resolve();
        }
      });
    }
  } catch (error) {
    console.error(error);

    throw new Error("ServiceWorker is required to run this app");
  }

  return waiting.promise;
};

const main = async () => {
  await registerServiceWorker().catch(console.error);

  const sdk = await getSDK();

  if (sdk) {
    const filepaths = await sdk.fs.list();
    await Promise.all(filepaths.map(async (filepath) => {
      const { content } = await sdk.fs.read(filepath);

      await updateFileCache(filepath, content).catch(console.error);
    }));

    sdk.fs.onChange(async (event) => {
      const filepath = event.filename;

      const { content } = await sdk.fs.read(filepath);

      await updateFileCache(filepath, content).catch(console.error);

      rerender();
    });
  }

  rerender();
};

main();
