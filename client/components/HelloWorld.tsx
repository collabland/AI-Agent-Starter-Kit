"use client";

import { useState } from "react";

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export default function HelloWorld() {
  const [user, setUser] = useState<TelegramUser | null>(null);

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      <div className="text-green-500">Hello World!</div>
    </div>
  );
}
