import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

export type StoredListing = {
  groupId: string;
  name: string;
  description: string;
  price: string;
  priceType: "one-time" | "subscription";
  seller: string;
  createdAt: string;
};

function getStorePath(): string {
  return join(process.cwd(), "data", "marketplace-listings.json");
}

export async function readListings(): Promise<StoredListing[]> {
  try {
    const path = getStorePath();
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function appendListing(entry: StoredListing): Promise<void> {
  const path = getStorePath();
  const dir = join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  const list = await readListings();
  list.push(entry);
  await writeFile(path, JSON.stringify(list, null, 2), "utf-8");
}
