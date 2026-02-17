import { NextRequest, NextResponse } from "next/server";
import { NovaSdk } from "nova-sdk-js";
import { appendListing } from "@/lib/marketplace-listings";

// Allow long-running upload (register_group + encrypt + IPFS + record on NEAR can take 60s+)
export const maxDuration = 120;

/**
 * NOVA upload (mainnet): uses nova-sdk-js.
 * Docs: https://nova-25.gitbook.io/nova-docs/nova-sdk-js
 *
 * Uses NEAR mainnet (real NEAR). Env: NOVA_ACCOUNT_ID, NOVA_API_KEY from nova-sdk.com.
 *
 * Operation costs (mainnet): Docs say ~0.05 NEAR for register_group, but the live contract
 * often requires more (e.g. ~0.67 NEAR) because of storage deposit: NEAR charges for on-chain
 * storage, and creating a group reserves state. Use sdk.estimateFee('register_group') for the
 * exact amount. With 1 NEAR you should have enough for register + upload.
 */
export async function POST(request: NextRequest) {
  const accountId = process.env.NOVA_ACCOUNT_ID;
  const apiKey = process.env.NOVA_API_KEY;

  if (!accountId || !apiKey) {
    return NextResponse.json(
      {
        error: "NOVA not configured",
        detail: "Set NOVA_ACCOUNT_ID and NOVA_API_KEY in .env (get key at nova-sdk.com)",
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const name = (formData.get("name") as string) || "";
  const description = (formData.get("description") as string) || "";
  const price = (formData.get("price") as string) || "";
  const priceType = (formData.get("priceType") as string) || "one-time";
  const listerAccountId = (formData.get("listerAccountId") as string)?.trim() || undefined;

  if (!file || file.size === 0) {
    return NextResponse.json(
      { error: "Strategy file is required" },
      { status: 400 }
    );
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const groupId = `strategy.${slug}.${Date.now()}`;

  const config: { apiKey: string; rpcUrl: string; contractId: string; mcpUrl?: string } = {
    apiKey,
    rpcUrl: process.env.NOVA_RPC_URL ?? "https://rpc.mainnet.near.org",
    contractId: process.env.NOVA_CONTRACT_ID ?? "nova-sdk.near",
  };
  if (process.env.NOVA_MCP_URL) config.mcpUrl = process.env.NOVA_MCP_URL;

  try {
    const sdk = new NovaSdk(accountId, config);

    // Pre-check: contract's register_group can require much more than docs (~0.05 NEAR)
    // due to storage deposit; 1 NEAR is typically enough for register + upload.
    const [balanceStr, registerFeeY] = await Promise.all([
      sdk.getBalance(accountId),
      sdk.estimateFee("register_group").catch(() => BigInt(0)),
    ]);
    const balance = Number(BigInt(balanceStr)) / 1e24;
    const registerFee = Number(registerFeeY) / 1e24;
    const uploadBuffer = 0.02; // rough buffer for upload
    if (registerFee > 0 && balance < registerFee + uploadBuffer) {
      return NextResponse.json(
        {
          error: "Insufficient NEAR",
          detail: `Your NOVA account has ${balance.toFixed(4)} NEAR. This listing needs ~${registerFee.toFixed(4)} NEAR for register_group plus ~${uploadBuffer} NEAR for upload. Add more NEAR to ${accountId} (e.g. at nova-sdk.com).`,
          required_near: Math.ceil((registerFee + uploadBuffer) * 100) / 100,
        },
        { status: 402 }
      );
    }

    try {
      await sdk.registerGroup(groupId);
    } catch (regErr) {
      const msg = regErr instanceof Error ? regErr.message : "";
      const alreadyExists = /already.?exist|duplicate|registered/i.test(msg);
      if (!alreadyExists) throw regErr;
      console.warn("Group already registered, continuing with upload:", groupId);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await sdk.upload(groupId, buffer, file.name);

    const priceDisplay =
      priceType === "subscription"
        ? `${price || "0"} NEAR/mo`
        : `${price || "0"} NEAR`;

    try {
      await appendListing({
        groupId,
        name: name || "Unnamed",
        description: description || "",
        price: price || "0",
        priceType: (priceType as "one-time" | "subscription") || "one-time",
        seller: accountId,
        createdAt: new Date().toISOString(),
        cid: result.cid,
        listerAccountId,
      });
    } catch (e) {
      console.error("Could not persist listing metadata:", e);
      return NextResponse.json(
        {
          error: "Listing saved to NOVA but failed to save to database",
          detail: e instanceof Error ? e.message : "appendListing failed",
          groupId,
          recoverHint: "Use POST /api/marketplace/recover-listing with this groupId, name, and price to add it to Discover.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      groupId,
      cid: result.cid,
      trans_id: result.trans_id,
      file_hash: result.file_hash,
      price: priceDisplay,
      priceInNear: price ? parseFloat(price) : undefined,
      message: "Strategy uploaded securely to NOVA. Buyers get encrypted access only.",
    });
  } catch (err) {
    let detail = err instanceof Error ? err.message : "Upload failed";
    const cause = err instanceof Error && "cause" in err ? (err as { cause?: unknown }).cause : null;
    if (cause && typeof cause === "object" && "response" in cause) {
      const res = (cause as { response?: { status?: number; data?: unknown } }).response;
      const data = res?.data;
      if (data != null && typeof data === "object") {
        const d = data as Record<string, unknown>;
        if ("balance" in d && "cost" in d && typeof d.balance === "string" && typeof d.cost === "string") {
          const balY = BigInt(d.balance);
          const costY = BigInt(d.cost);
          const signer = typeof d.signer_id === "string" ? d.signer_id : "your NOVA account";
          detail = `Insufficient NEAR: ${signer} has ${Number(balY) / 1e24} NEAR but this operation needs ~${Number(costY) / 1e24} NEAR. Add more NEAR at nova-sdk.com or fund the account.`;
        } else if (typeof d.error === "string") {
          detail = d.error;
        } else if (typeof d.message === "string") {
          detail = d.message;
        } else {
          detail = JSON.stringify(data);
        }
        console.error("NOVA MCP response body:", data);
      }
    }
    if (detail === "Internal Server Error") {
      detail =
        "NOVA MCP server returned 500. This can be temporary. Ensure your NOVA account has enough NEAR (~0.7 NEAR for first upload); try again in a moment.";
    }
    console.error("NOVA upload error:", err);
    return NextResponse.json(
      { error: "NOVA upload failed", detail },
      { status: 500 }
    );
  }
}
