import Link from "next/link";
import { Lock, HelpCircle } from "lucide-react";

type Props = { variant?: "banner" | "footer" };

export default function TrustPrivacyBanner({ variant = "banner" }: Props) {
  const isFooter = variant === "footer";
  return (
    <div
      className={
        isFooter
          ? "flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400"
          : "flex flex-wrap items-center gap-4 py-4 px-5 rounded-2xl border border-white/10 bg-white/[0.03]"
      }
    >
      <div className="flex items-center gap-2.5 text-gray-300 text-sm">
        <Lock className="w-4 h-4 text-white/60 flex-shrink-0" aria-hidden />
        <span className="font-serif italic">Strategies stay encrypted — no raw data shared.</span>
      </div>
      <Link
        href="#faq"
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors font-serif italic"
      >
        <HelpCircle className="w-4 h-4 flex-shrink-0" aria-hidden />
        How access works / revocation
      </Link>
    </div>
  );
}
