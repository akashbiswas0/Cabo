export type TabId = "discover" | "listings" | "purchases";

export type Strategy = {
  id: string;
  name: string;
  teaser: string;
  avgMonthlyReturn: string;
  price: string;
  priceType: "one-time" | "subscription";
  rating: number | null;
  riskLevel: "low" | "medium" | "high";
  assetFocus: string[];
  seller: string;
  /** NEAR amount for purchase (enables Buy with NEAR). Optional for mocks. */
  priceInNear?: number;
  /** IPFS CID of the encrypted strategy file (from NOVA). Shown in detail, used for retrieve. */
  cid?: string;
};

export type PriceTypeFilter = "all" | "one-time" | "subscription";

export type UploadFormState = {
  name: string;
  description: string;
  price: string;
  priceType: "one-time" | "subscription";
  file: File | null;
};
