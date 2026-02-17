"use client";
import Link from "next/link";
import React from "react";
import { useNearWallet } from "near-connect-hooks";

const Navbar: React.FC = () => {
  const [showDisconnectMenu, setShowDisconnectMenu] = React.useState(false);
  const walletMenuRef = React.useRef<HTMLDivElement | null>(null);
  const { signedAccountId, loading, signIn, signOut } = useNearWallet();

  React.useEffect(() => {
    if (!signedAccountId) {
      setShowDisconnectMenu(false);
    }
  }, [signedAccountId]);

  React.useEffect(() => {
    if (!showDisconnectMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        walletMenuRef.current &&
        !walletMenuRef.current.contains(event.target as Node)
      ) {
        setShowDisconnectMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDisconnectMenu]);

  const handleWalletClick = () => {
    if (loading) return;
    if (signedAccountId) {
      setShowDisconnectMenu((prev) => !prev);
    } else {
      signIn();
    }
  };

  const handleDisconnect = async () => {
    await signOut();
    setShowDisconnectMenu(false);
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
          <Link href="/">
          <span className="text-2xl font-serif italic font-normal md:text-3xl tracking-tight text-white group-hover:opacity-80 transition-opacity">
            Cabo
          </span>
          </Link>
        </div>

        {/* Right: dashboard (when connected) + wallet menu */}
        <div className="flex items-center gap-2">
          {signedAccountId && (
            <>
              <Link
                href="/dashboard"
                className="px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-300"
              >
                Dashboard
              </Link>
              <Link
                href="/marketplace"
                className="px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-300"
              >
                Marketplace
              </Link>
              <Link
                href="/trade"
                className="px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-300"
              >
                Trade Routes
              </Link>
            </>
          )}

          <div ref={walletMenuRef} className="relative">
            <button
              onClick={handleWalletClick}
              className="hidden md:flex px-6 py-2.5 text-sm font-medium border cursor-pointer   border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-300 items-center gap-2"
              title={signedAccountId ? "Wallet menu" : "Launch App"}
            >
              {loading ? (
                "Loading..."
              ) : walletLabel ? (
                <span className="font-mono">{walletLabel}</span>
              ) : (
                "Launch App"
              )}
            </button>
            <button
              onClick={handleWalletClick}
              className="md:hidden px-4 py-2 text-xs font-medium border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-300"
            >
              {loading ? "..." : walletLabel ?? "connect"}
            </button>

            {signedAccountId && showDisconnectMenu && (
              <div className="absolute right-0 mt-2 min-w-[150px] rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl p-2 shadow-lg">
                <button
                  onClick={handleDisconnect}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
