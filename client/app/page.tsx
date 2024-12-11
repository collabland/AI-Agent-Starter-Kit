"use client";

import { ReactElement } from "react";
import HelloWorld from "@/components/HelloWorld";
import TelegramUser from "@/components/TelegramUser";

export default function Home(): ReactElement {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <HelloWorld />
        <TelegramUser />
      </div>
    </main>
  );
}
