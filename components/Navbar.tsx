"use client";
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
          <span className="text-2xl font-serif italic font-normal md:text-3xl tracking-tight text-white group-hover:opacity-80 transition-opacity">
            Cabo
          </span>
        </div>

        {/* Right: connect wallet / connected wallet menu */}
        <div ref={walletMenuRef} className="relative">
          <button
            onClick={handleWalletClick}
            className="hidden md:flex px-6 py-2.5 text-sm font-medium border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-300 items-center gap-2"
            title={signedAccountId ? "Wallet menu" : "Connect wallet"}
          >
            {loading ? (
              "Loading..."
            ) : walletLabel ? (
              <span className="font-mono">{walletLabel}</span>
            ) : (
              "connect wallet"
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
    </nav>
  );
};

export default Navbar;
