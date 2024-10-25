import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

import ErrorPage from "./ErrorPage.tsx";

import * as Index from "./routes/index.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Index.default />,
        ...Index,
      },
      // Add other routes in here
      // { path: 'blog/:id', element: <Blog.default />, ...Blog },
    ],
  },
], {
  // Make it work on GitHub Pages
  basename: "/react-standalone",
});

function Root() {
  return <Outlet />;
}

function App() {
  return <RouterProvider router={router} />;
}

export default App;
