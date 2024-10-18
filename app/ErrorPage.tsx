import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  if (error.status === 404) {
    return (
      <div id="error-page" className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h1 className="text-4xl font-bold text-red-600">404 - Page Not Found</h1>
        <p className="mt-4 text-lg text-gray-700">Sorry, the page you are looking for does not exist.</p>
        <p className="mt-2 text-gray-600">
          To add new routes, create a new file in <code className="bg-gray-200 p-1 rounded">app/routes</code> and register it in <code className="bg-gray-200 p-1 rounded">app.tsx</code>.
        </p>
        <a href="https://reactrouter.com/docs/en/v6/getting-started/overview" className="mt-4 text-blue-500 underline">
          React Router Documentation
        </a>
      </div>
    );
  }

  return (
    <div id="error-page" className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-red-600">Oops!</h1>
      <p className="mt-4 text-lg text-gray-700">Sorry, an unexpected error has occurred.</p>
      <p className="mt-2 text-gray-600">
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  );
}