import React from "react";
import Navbar from "@/components/Navbar";
import SwapWidget from "@/components/SwapWidget";

export default function TradePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-white">
      <Navbar />

      <main className="flex-1 flex justify-center pt-24 pb-8 px-4">
        <SwapWidget />
      </main>
    </div>
  );
}
