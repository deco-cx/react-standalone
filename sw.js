importScripts("https://unpkg.com/@babel/standalone@7.25.8/babel.min.js");
importScripts("https://unpkg.com/idb-keyval@6.2.1/dist/umd.js")

self.addEventListener('install', _event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

function transpile(code, path) {
  return Babel.transform(code, { filename: path, presets: ['react', 'typescript'] }).code;
}

const routes = {
  'app/entry.client.tsx': `
import React from 'react';
import ReactDOM from 'react-dom/client';
import Router from './routes.tsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Router />);
`,
  "app/routes.tsx": `
import React from 'react';
  const App = () => <h1 class="w-full h-screen flex items-center justify-center">Hello, React!</h1>;
  
  export default App;
  `
}

const store = idbKeyval.createStore('webdraw', 'fs')

async function route(event) {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === location.origin;

  if (isSameOrigin) {
    const scope = self.registration.scope;
    const relativePath = url.href.replace(scope, '');
    const cached = await store.get(relativePath, store);

    if (!cached) {
      return fetch(event.request);
    }

    return new Response(transpile(cached.content, url.pathname), {
      status: 200,
      headers: {
        'content-type': 'text/javascript'
      }
    })
  } else {
    const matched = await caches.match(event.request);

    if (matched) {
      return matched;
    }

    const response = await fetch(event.request);

    const cache = await caches.open('v1');
    cache.put(event.request, response.clone());

    return response;
  }
}

self.addEventListener('fetch', event => {
  event.respondWith(route(event))
});