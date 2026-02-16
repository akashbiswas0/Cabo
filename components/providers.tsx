"use client";
import React from "react";
import { NearProvider } from "near-connect-hooks";

export function Providers({ children }: { children: React.ReactNode }) {
  const network = "mainnet";

  return (
    <NearProvider
      config={{
        network,
      }}
    >
      {children}
    </NearProvider>
  );
}
