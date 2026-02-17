import Link from "next/link";
import { Lock, HelpCircle } from "lucide-react";

type Props = { variant?: "banner" | "footer" };

export default function TrustPrivacyBanner({ variant = "banner" }: Props) {
  const isFooter = variant === "footer";
  return (
    <div> </div>
  );
}
