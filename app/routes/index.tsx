import { useLoaderData } from "react-router-dom";

export const loader = () => {
  return { target: "React Router!" };
};

export default function Page() {
  const data = useLoaderData();

  return (
    <div>
      Hello {data.target}
    </div>
  );
}
