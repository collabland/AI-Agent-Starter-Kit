"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function HelloWorld() {
  const [isConfigured, setIsConfigured] = useState<boolean>(
    !!process.env.NEXT_PUBLIC_API_URL
  );
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setIsConfigured(!!process.env.NEXT_PUBLIC_API_URL);
  }, []);

  useEffect(() => {
    if (isConfigured) {
      axios
        .get("/api/hello/collabland")
        .then((res) => setData(res.data))
        .catch((err) => setError(err.message));
    }
  }, [isConfigured]);

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      <h1 className="text-2xl font-bold">Hello Collab-thon</h1>
      <pre className="text-blue-500">
        Get started on the client by editing /client/components/HelloWorld.tsx
      </pre>
      <br />
      <div>
        API URL configured:{" "}
        {isConfigured ? (
          <span className="text-green-500">yes</span>
        ) : (
          <span className="text-red-500 font-bold">no</span>
        )}
      </div>
      {isConfigured ? (
        error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : (
          <>
            <pre className="text-blue-500">
              Get started on the server by editing /server/src/routes/hello.ts
            </pre>
            <pre className="bg-gray-800 p-4 rounded overflow-auto w-full max-w-[50vw] whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          </>
        )
      ) : (
        <span>
          API URL not configured properly, type Ctrl+C and then type{" "}
          <span className="text-blue-500">
            <b>pnpm run dev</b>
          </span>{" "}
          in the terminal
        </span>
      )}
    </div>
  );
}
