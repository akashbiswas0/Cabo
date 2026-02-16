const ZERO = BigInt(0);
const TEN = BigInt(10);

export function isDecimalInput(value: string): boolean {
  return /^\d*\.?\d*$/.test(value);
}

export function decimalToUnits(value: string, decimals: number): string | null {
  const trimmed = value.trim();
  if (!trimmed || !isDecimalInput(trimmed) || decimals < 0) {
    return null;
  }

  const [wholePart = "0", fractionPart = ""] = trimmed.split(".");
  if (fractionPart.length > decimals) {
    return null;
  }

  const normalizedWhole = wholePart.replace(/^0+(?=\d)/, "") || "0";
  const normalizedFraction = fractionPart.padEnd(decimals, "0");
  const raw = `${normalizedWhole}${normalizedFraction}`.replace(/^0+(?=\d)/, "");

  try {
    return BigInt(raw || "0").toString();
  } catch {
    return null;
  }
}

export function formatUnits(
  units: string,
  decimals: number,
  precision = 6,
): string {
  let amount: bigint;
  try {
    amount = BigInt(units);
  } catch {
    return "0";
  }

  const sign = amount < ZERO ? "-" : "";
  const absolute = amount < ZERO ? -amount : amount;

  if (decimals <= 0) {
    return `${sign}${absolute.toString()}`;
  }

  const divisor = TEN ** BigInt(decimals);
  const whole = absolute / divisor;
  const fraction = (absolute % divisor).toString().padStart(decimals, "0");
  const maxPrecision = Math.max(0, Math.min(decimals, precision));
  const clippedFraction = fraction.slice(0, maxPrecision).replace(/0+$/, "");

  if (!clippedFraction) {
    return `${sign}${whole.toString()}`;
  }

  return `${sign}${whole.toString()}.${clippedFraction}`;
}

export function isPositiveUnits(value: string): boolean {
  try {
    return BigInt(value) > ZERO;
  } catch {
    return false;
  }
}

export function isWithinBalance(amount: string, balance: string): boolean {
  try {
    return BigInt(amount) <= BigInt(balance);
  } catch {
    return false;
  }
}
