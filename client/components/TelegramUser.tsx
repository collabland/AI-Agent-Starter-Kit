"use client";

import { useState } from "react";
import TelegramLoginButton from "./TelegramLogin";

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export default function TelegramUser() {
  const [user, setUser] = useState<TelegramUser | null>(null);

  const handleTelegramAuth = (telegramUser: TelegramUser) => {
    console.log("Telegram auth successful:", telegramUser);
    setUser(telegramUser);
  };

  return (
    <div className="flex flex-col items-center w-full space-y-4 my-4">
      {!user ? (
        <TelegramLoginButton
          botName={
            process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || "CollabathonBot"
          }
          onAuth={handleTelegramAuth}
        />
      ) : (
        <div className="text-green-500">
          Welcome, Telegram User {user.first_name}!
        </div>
      )}
    </div>
  );
}
