import { useLoaderData } from "react-router-dom";

export const loader = () => {
  return {
    features: [
      "React",
      "TypeScript",
      "TailwindCSS",
      "React Router",
      "HMR powered",
    ],
  };
};

export default function Page() {
  const data = useLoaderData();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 w-full">
      <h1 className="text-4xl font-bold mb-4 text-blue-600">Welcome to React Standalone!</h1>
      <p className="text-lg mb-2 text-gray-700">
        Experience the power of React running directly in your browser.
      </p>
      <p className="text-lg mb-2 text-gray-700">
        No server required, just pure client-side magic!
      </p>
      <p className="text-lg mt-4 font-thin text-gray-600">
        {data.features.join(", ")}!
      </p>
    </div>
  );
}
