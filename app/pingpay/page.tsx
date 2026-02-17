"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PingpayOnramp, PingpayOnrampError } from "@pingpay/onramp-sdk";
import Navbar from "@/components/Navbar";

export default function PingpayPage() {
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const launchOnramp = useCallback(async () => {
    setLaunching(true);
    setError(null);

    try {
      const onrampOptions: { popupUrl?: string } = {};
      if (typeof process.env.NEXT_PUBLIC_PINGPAY_POPUP_URL === "string") {
        onrampOptions.popupUrl = process.env.NEXT_PUBLIC_PINGPAY_POPUP_URL;
      }
      const onramp = new PingpayOnramp(onrampOptions);
      await onramp.initiateOnramp({ chain: "NEAR", asset: "wNEAR" });
    } catch (launchError) {
      if (launchError instanceof PingpayOnrampError) {
        setError(launchError.message);
      } else {
        setError("Failed to open Pingpay onramp.");
      }
    } finally {
      setLaunching(false);
    }
  }, []);

  useEffect(() => {
    void launchOnramp();
  }, [launchOnramp]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-white">
      <Navbar />
      <main className="flex-1 pt-24 pb-12 px-4 md:px-6 max-w-3xl mx-auto w-full">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            Buy Crypto with Pingpay
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            Pingpay opens from this dedicated page. If the popup is blocked, use retry.
          </p>

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => void launchOnramp()}
              disabled={launching}
              className="px-4 py-2.5 rounded-xl font-medium border border-white/20 bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {launching ? "Opening Pingpay..." : "Retry Pingpay Popup"}
            </button>
            <Link
              href="/marketplace"
              className="px-4 py-2.5 rounded-xl font-medium border border-white/20 hover:bg-white hover:text-black transition-colors text-center"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
