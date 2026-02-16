NOVA for Finance: : Secure DCA Memory with Self-Learning Loops and Confidential Portfolio Analysis
Users securely store their Dollar-Cost Averaging (DCA) trading history in a personal, decentralized vault powered by NOVA. By connecting their NEAR wallet, they create a group (e.g., "dca-history"), upload encrypted JSON memos of weekly trades, and dynamically retrieve/update the history. This data is made available to Shade Agents (TEE-based) for confidential portfolio analysis, risk modeling, and self-learning loops (e.g., fine-tuning AI models on historical trades for optimized asset allocation suggestions—without ever exposing plaintext data).

Use Case
Personal Crypto Portfolio Management (e.g., Weekly $100 DCA)

In a self-managed DCA strategy, users upload a JSON array of trade memos weekly to their personal NOVA vault (e.g., "dca-history.{user_account_id}" for uniqueness). Each entry includes date, operation, provider, portfolio snapshot, and rationale.

When performing a weekly update (e.g., on December 31, 2025):

The app retrieves the latest encrypted data from IPFS via NOVA's SDK.
Decrypts it locally using the group key from Shade Agents (TEEs).
Appends a new entry (e.g., {"date": "31-12-2025", "operation": "Swapped 50-worth-usd of NEAR for ETH.", "provider": "https://dex.example.com", "portfolio": "4.5 NEAR, 1,800 stNEAR, 0.8 SOL, 0.001 BTC, 0.05 ETH", "rationale": "Diversifying into ETH ahead of expected market recovery."}).
Re-uploads the updated JSON as a new encrypted version to IPFS, logging metadata on NEAR for versioning.
For analysis: The app invokes a Shade Agent to process the full history confidentially—e.g., compute risk metrics, simulate scenarios, or fine-tune a lightweight model for future recommendations—outputting verifiable attestations (e.g., "Portfolio risk: Low; Suggested next DCA: 60% NEAR, 40% SOL") without data leaks.
This enables automated, privacy-preserving portfolio management, with self-learning loops where agents iteratively improve based on user history, all under user sovereignty.

How NOVA matches the needs of a personal trading assistant
User Sovereignty & Privacy: Personal groups ensure only the user (and temporarily granted agents) access data. Encryption is client-side, with keys in TEEs (Shade Agents) for zero-trust analysis.
Versioned History with One-Way Updates: Retrieve and append to JSON without re-encrypting old data; new uploads create immutable versions on IPFS, tracked on NEAR.
Confidential Analysis via TEEs: Shade Agents process decrypted data in secure enclaves for portfolio metrics, risk assessment, or AI fine-tuning—e.g., self-learning loops that adapt models to user patterns without exposing history.
Verifiable & Auditable: All uploads/logs on NEAR blockchain for tamper-proof auditing; agents provide attestations for transparency.
Scalability for Weekly Ops: Low-cost NEAR transactions (~0.01 NEAR/tx) suit frequent updates; IPFS ensures efficient storage/retrieval.
AI Agent Integration: Use NOVA's MCP (Model Context Protocol) to invoke agents for natural language queries like "Analyze my DCA history for Q4 2025" or self-learning (e.g., "Fine-tune allocation model on my trades").
Extensible for DeFi Automation: Integrate with NEAR wallets for seamless wallet connects; extend to trigger DCA ops via intents while logging securely.
Self-Learning Loops: Agents can iteratively refine models (e.g., via federated learning proxies) on encrypted history, improving suggestions over time without central servers.
This turns NOVA into a backbone for privacy-first personal finance apps, empowering users with confidential AI-driven insights.

Running the Demos
Set .env file
Rust: cargo run --bin dca-history.
JS: ts-node dca-history.ts.
Expected output:

Citizen Account: user.testnet
=== Step 1: Create or load personal DCA group ===
Personal group created/loaded: dca-history.user.testnet
=== Step 2: Retrieve latest DCA history ===
Latest history retrieved from IPFS: CID = bafybeih... (Decrypted length: 1024 bytes)
Current portfolio snapshot: 6.19 NEAR, 1,819 stNEAR, 0.79 SOL, 0.001141 BTC
=== Step 3: Append new weekly DCA operation ===
New entry added: {"date": "31-12-2025", "operation": "Swapped 50-worth-usd of NEAR for ETH.", ...}
Updated history re-uploaded to IPFS: New CID = bafybeig...
=== Step 4: Invoke Shade Agent for confidential analysis ===
Agent attestation: Portfolio risk: Medium; Diversification score: 75%; Suggested next: Increase BTC exposure by 20%.
Self-learning loop initiated: Model fine-tuned on 4 weeks of data.
=== DCA Use Case Demo Complete ===
Secure, versioned history with privacy-preserving AI analysis.



code 


import { NovaSdk } from 'nova-sdk-js';
import * as dotenv from 'dotenv';
import { setTimeout } from 'timers/promises';

dotenv.config();

async function main() {
  // Configuration from environment
  const rpc = process.env.RPC_URL || 'https://rpc.testnet.near.org';
  const contract = process.env.CONTRACT_ID || 'nova-contract.testnet';
  const pinataKey = process.env.IPFS_API_KEY;
  const pinataSecret = process.env.IPFS_API_SECRET;
  const shadeApiUrl = process.env.SHADE_API_URL;

  const userPrivateKey = process.env.USER_PRIVATE_KEY;
  const userAccountId = process.env.USER_ACCOUNT_ID; // e.g., user.testnet

  if (!shadeApiUrl) throw new Error('Missing SHADE_API_URL');
  if (!pinataKey || !pinataSecret || !userPrivateKey || !userAccountId) {
    throw new Error('Missing required env vars');
  }

  console.log('User Account:', userAccountId);

  // Initialize SDK for the user
  const sdk = new NovaSdk(rpc, contract, pinataKey, pinataSecret, shadeApiUrl);
  await sdk.withSigner(userPrivateKey, userAccountId);

  // Unique personal group for DCA history
  const groupId = `dca-history.${userAccountId}`;
  console.log('\n=== Step 1: Create or load personal DCA history group ===');

  // Create the group if it doesn't exist (user as initial member)
  try {
    await sdk.createGroup(groupId, [userAccountId]);
    console.log(`Personal group created: ${groupId}`);
  } catch (err) {
    console.log(`Group already exists or error: ${err.message}. Continuing...`);
  }

  // Simulate initial DCA history JSON (empty or sample)
  // In a real app, this could be loaded from previous CID or initialized empty
  let initialHistory = [];
  const filename = 'dca-history.json';

  // For demo: If first upload, use sample data
  const sampleEntry = {
    date: '17-12-2025',
    operation: 'Staked 2790 NEAR for 1,909 stNEAR.',
    provider: 'https://staking.metapool.app/',
    portfolio: '5.12 NEAR, 1,909 stNEAR.',
    rationale: 'Chose metapool for its reliability + the tradeable stNEAR tokens.'
  };
  initialHistory.push(sampleEntry);

  // Upload initial encrypted history (if no previous)
  let latestCid = null; // In real app, track this in local storage or on-chain metadata
  if (!latestCid) {
    const initialData = Buffer.from(JSON.stringify(initialHistory));
    const uploadResult = await sdk.compositeUpload(groupId, userAccountId, initialData, filename);
    latestCid = uploadResult.cid;
    console.log(`Initial DCA history uploaded to IPFS: CID = ${latestCid}`);
  }

  // Wait for IPFS propagation
  console.log('Waiting 15s for IPFS pin propagation...');
  await setTimeout(15000);

  console.log('\n=== Step 2: Retrieve latest DCA history for weekly update ===');

  // Retrieve and decrypt the latest version
  const retrieved = await sdk.compositeRetrieve(groupId, latestCid);
  const historyJson = JSON.parse(retrieved.data.toString());
  console.log(`Latest history retrieved: ${historyJson.length} entries`);
  console.log(`Last portfolio: ${historyJson[historyJson.length - 1]?.portfolio || 'Empty'}`);

  console.log('\n=== Step 3: Append new weekly DCA operation and re-upload ===');

  // Simulate new weekly entry (e.g., from user input or DeFi integration)
  const newEntry = {
    date: '31-12-2025',  // Current date as per query
    operation: 'Swapped 50-worth-usd of NEAR for ETH.',
    provider: 'https://dex.example.com',
    portfolio: '4.5 NEAR, 1,800 stNEAR, 0.8 SOL, 0.001 BTC, 0.05 ETH',
    rationale: 'Diversifying into ETH ahead of expected market recovery.'
  };
  historyJson.push(newEntry);

  // Re-upload updated encrypted history
  const updatedData = Buffer.from(JSON.stringify(historyJson));
  const updateUpload = await sdk.compositeUpload(groupId, userAccountId, updatedData, filename);
  latestCid = updateUpload.cid;  // Update tracked CID
  console.log(`Updated DCA history re-uploaded to IPFS: New CID = ${latestCid}`);

  // Wait for propagation
  await setTimeout(15000);

  console.log('\n=== Step 4: Make data available to Shade Agent for confidential analysis ===');

  // Temporarily add a Shade Agent as group member for access (in real: use specific agent ID)
  const agentAccountId = 'shade-agent.testnet';  // Example; in prod, use actual TEE agent
  await sdk.addMember(groupId, agentAccountId);
  console.log(`Shade Agent added temporarily: ${agentAccountId}`);

  // Simulate agent retrieval and analysis (in real app: invoke via MCP or agent API)
  // Agent would compositeRetrieve, analyze in TEE (e.g., compute risk, fine-tune model), output attestation
  const agentRetrieved = await sdk.compositeRetrieve(groupId, latestCid);  // Simulated as user for demo
  const agentHistory = JSON.parse(agentRetrieved.data.toString());
  // Mock analysis: Compute simple metrics
  const mockRisk = 'Medium';  // In real: TEE computes confidentially
  const mockSuggestion = 'Increase BTC exposure by 20% for better diversification.';
  console.log(`Agent analysis (mock): Portfolio risk: ${mockRisk}; Suggestion: ${mockSuggestion}`);
  console.log('Self-learning loop: Agent could fine-tune model on history for future recommendations.');

  // Revoke agent access after analysis
  await sdk.removeMember(groupId, agentAccountId);
  console.log(`Agent access revoked: Keys rotated.`);

  console.log('\n=== DCA History Use Case Demo Complete ===');
  console.log('Personal trading assistant data layer: Secure, versioned DCA memos with AI-ready access.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});