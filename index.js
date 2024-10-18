import { getSDK } from "http://localhost:5173/webdraw-sdk.js";

const cache = await caches.open("v1");

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
  const request = new URL(`./${filepath}`, location.origin);

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

const main = async () => {
  const sdk = await getSDK();

  if (sdk) {
    for (const filepath of await sdk.fs.list()) {
      const { content } = await sdk.fs.read(filepath);

      await updateFileCache(filepath, content).catch(console.error);
    }

    sdk.fs.onChange(async (event) => {
      const filepath = event.filepath;

      const { content } = await sdk.fs.read(filepath);

      await updateFileCache(filepath, content).catch(console.error);

      rerender();
    });
  }

  rerender();
};

let unmount = () => {};
const rerender = async () => {
  unmount();
  const entry = await import(`./app/entry.client.tsx?ts=${Date.now()}`);
  unmount = entry.render();
};

if ("serviceWorker" in navigator) {
  try {
    const registration = await navigator.serviceWorker.register("sw.js");

    if (registration.active) {
      main();
    } else if (registration.waiting || registration.installing) {
      const worker = registration.waiting || registration.installing;

      worker.addEventListener("statechange", (event) => {
        if (event.target.state === "activated") {
          main();
        }
      });
    }
  } catch (error) {
    console.log("ServiceWorker is required to run this app: ", error);
  }
}
