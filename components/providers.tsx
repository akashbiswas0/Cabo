"use client";
import React from 'react';
import { NearProvider } from 'near-connect-hooks';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NearProvider>
      {children}
    </NearProvider>
  );
}
