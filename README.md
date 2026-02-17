# Cabo

**Cabo** is an encrypted trading strategy marketplace on NEAR. Creators list and sell private strategies; buyers get access via NOVA groups and can pay with a NEAR wallet or with card (PingPay). An agent can execute encrypted strategies on your behalf. Built on Near

---

## Getting Started

```bash
npm install
npm run dev
```

Set the required env vars (see below) for NOVA, PingPay.

---

## Integrations

### NOVA - **[NOVA SDK Integration in Cabo](https://docs.google.com/document/d/1NpwHDtYyKjrLASo6PozgqfAt7Y9IgL9wqTrerXvrIXE/edit?usp=sharing)**

**What it is:** [NOVA](https://nova-sdk.com) provides encrypted storage and access control on NEAR. Files are encrypted and stored off-chain (e.g. IPFS); on-chain groups define who can decrypt.

**Why we use it:** Strategies are sensitive. We use NOVA so that (1) only the seller and paying buyers can ever see the strategy content, and (2) access is enforced by the NOVA contract, not our backend.

**Where it’s used in the project:**

| Area | Purpose |
|------|--------|
| **Upload strategy** | `app/api/marketplace/upload-strategy/route.ts` — Uses `nova-sdk-js` to `registerGroup`, then `upload` the strategy file. The file is encrypted and stored; the listing’s `groupId` and IPFS `cid` are saved in Supabase. |
| **Wallet purchase** | `app/api/marketplace/purchase/route.ts` — After the buyer sends NEAR to the seller, we call `sdk.addGroupMember(groupId, buyerAccountId)` so the buyer can decrypt and use the strategy. |
| **PingPay purchase** | `app/api/marketplace/pingpay-complete/route.ts` — After PingPay confirms payment, we add the buyer to the same NOVA group via `addGroupMember`, so card payers get the same access as wallet payers. |
| **Retrieve strategy** | `app/api/marketplace/retrieve/route.ts` — Fetches the encrypted file from IPFS and returns decrypted content. Only callable by the NOVA account that owns the group or is a member (i.e. the seller or a buyer). |
| **Recover listing** | `app/api/marketplace/recover-listing/route.ts` — If upload to NOVA succeeded but our DB write failed, this re-inserts the listing into Supabase so it appears on Discover. |

**Env:** `NOVA_ACCOUNT_ID`, `NOVA_API_KEY` (from [nova-sdk.com](https://nova-sdk.com)). Optional: `NOVA_CONTRACT_ID`, `NOVA_RPC_URL`, `NOVA_MCP_URL`.

---

### Intents (One-Click / Chain Defuser)

**What it is:** [Intents](https://explorer.near-intents.org) (via Defuse One-Click / Chain Defuser) let users describe a swap or transfer; a solver executes it. The app uses the One-Click API for quotes and deposit submission.

**Why we use it:** So users can swap or move assets from the **Trade** page without signing multiple NEAR transactions or connecting to a DEX UI. One flow: user picks token in/out and amount, gets a quote, submits a deposit; the solver executes the intent.

**Where it’s used in the project:**

| Area | Purpose |
|------|--------|
| **Trade page** | `app/trade/page.tsx` — Renders `SwapWidget`, which drives the full swap flow. |
| **SwapWidget** | `components/SwapWidget.tsx` — Calls `/api/intents/tokens` for the token list, `/api/intents/quote` for the swap quote, `/api/intents/submit-deposit` to submit the user’s deposit, and `/api/intents/status` to poll until the intent is executed. |
| **Intents API routes** | `app/api/intents/` — `tokens`, `quote`, `submit-deposit`, and `status` route requests to `lib/intents/server.ts`, which uses `@defuse-protocol/one-click-sdk-typescript` and the One-Click backend (e.g. `https://1click.chaindefuser.com`). |
| **Server/client libs** | `lib/intents/server.ts` — Configures the One-Click API, fetches tokens, gets quotes, submits deposit tx, fetches execution status. `lib/intents/client.ts` — Browser-facing helpers that call the app’s intents API. `lib/intents/amount.ts` — Decimal/units and balance checks. `lib/intents/types.ts` — Shared types. |

**Env:** Optional. `ONE_CLICK_BASE_URL`, `ONE_CLICK_JWT` for the One-Click API.

---

### PingPay

**What it is:** [PingPay](https://pingpay.io) provides hosted checkout (pay with card) and onramp (buy crypto) for NEAR. We use checkout so buyers can purchase a strategy without a wallet; we use onramp so users can buy wNEAR/crypto from the app.

**Why we use it:** Not everyone has NEAR in a wallet. PingPay lets them pay with card and still receive NOVA access once they connect a NEAR account (e.g. after onboarding). Onramp supports the “Buy crypto” path from the marketplace.

**Where it’s used in the project:**

| Area | Purpose |
|------|--------|
| **Strategy checkout** | **Marketplace** → Strategy detail modal has “Pay with Pingpay”. That calls `POST /api/marketplace/pingpay-checkout-session` with `groupId`, `seller`, `amountInNear`. The API creates a PingPay session and returns `sessionUrl`; the user is redirected to PingPay to pay. |
| **Return from PingPay** | After payment, PingPay redirects to `/marketplace?pingpay=success&token=...`. The marketplace page (`app/marketplace/page.tsx`) reads the token, then calls `POST /api/marketplace/pingpay-complete` with `token` and the connected `buyerAccountId`. |
| **PingPay complete** | `app/api/marketplace/pingpay-complete/route.ts` — Looks up the session by token (from Supabase `pingpay_checkout_returns`), verifies the session is COMPLETED with PingPay, then adds the buyer to the NOVA group (same as wallet purchase) and records the purchase. |
| **Checkout session API** | `app/api/marketplace/pingpay-checkout-session/route.ts` — Builds the PingPay request (amount in yoctoNEAR, success/cancel URLs with token), stores `token → sessionId, groupId` in Supabase for the return flow, returns `sessionUrl`. |
| **Buy crypto (onramp)** | **Marketplace** Discover tab “Buy crypto” and `/pingpay` page (`app/pingpay/page.tsx`) use `@pingpay/onramp-sdk` to open the PingPay onramp (e.g. buy wNEAR on NEAR). |
| **PingPay helpers** | `lib/pingpay-checkout.ts` — `saveCheckoutReturn` and `getCheckoutReturnByToken` for storing and looking up the token/session/groupId around checkout. |

**Env:** `PINGPAY_API_KEY` or `PINGPAY_PUBLISHABLE_KEY` for checkout. Optional: `NEXT_PUBLIC_PINGPAY_POPUP_URL` for onramp. Supabase table `pingpay_checkout_returns` (see migrations).

---

## Environment

- **NOVA:** `NOVA_ACCOUNT_ID`, `NOVA_API_KEY`
- **PingPay (checkout):** `PINGPAY_API_KEY` or `PINGPAY_PUBLISHABLE_KEY`
- **Intents (optional):** `ONE_CLICK_BASE_URL`, `ONE_CLICK_JWT`
- **App URL (for PingPay redirects):** `NEXT_PUBLIC_APP_URL` or rely on `VERCEL_URL` in production
