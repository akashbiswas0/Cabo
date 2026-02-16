"use client";
import React from 'react';
import { useNearWallet } from 'near-connect-hooks';

const Navbar: React.FC = () => {
  const { signedAccountId, loading, signIn, signOut } = useNearWallet();

  const handleAction = () => {
    if (signedAccountId) {
      signOut();
    } else {
      signIn();
    }
  };

  const walletLabel = signedAccountId
    ? signedAccountId.length > 20
      ? `${signedAccountId.slice(0, 8)}...${signedAccountId.slice(-8)}`
      : signedAccountId
    : null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
      <div className="flex items-center justify-between w-full max-w-5xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 md:px-8 py-3 shadow-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <span className="text-2xl font-serif italic font-normal md:text-3xl tracking-tight text-white group-hover:opacity-80 transition-opacity">
            Cabo
          </span>
        </div>

        {/* Right: connected wallet (replaces bell) / connect button */}
        <div className="hidden md:block">
          <button
            onClick={handleAction}
            className="px-6 py-2.5 text-sm font-medium border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-300 flex items-center gap-2"
            title={signedAccountId ? "Click to disconnect" : "Connect wallet"}
          >
            {loading ? (
              "Loading..."
            ) : walletLabel ? (
              <span className="font-mono">{walletLabel}</span>
            ) : (
              "connect wallet"
            )}
          </button>
        </div>

        {/* Mobile: same, show wallet when connected */}
        <div className="md:hidden">
          <button
            onClick={handleAction}
            className="px-4 py-2 text-xs font-medium border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-300"
          >
            {loading ? "..." : walletLabel ?? "connect"}
          </button>
        </div>
      </div>
    </nav>
  );
};

const NavItem: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a 
    href={href} 
    className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
  >
    {children}
  </a>
);

export default Navbar;