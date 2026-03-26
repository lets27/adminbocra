const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatDateCompact(date: Date): string {
  const year = date.getUTCFullYear().toString();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");

  return `${year}${month}${day}`;
}

export function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? null;
  return normalized && normalized.length > 0 ? normalized : null;
}

export function hasNonEmptyText(value: string | null | undefined): boolean {
  return normalizeOptionalText(value) !== null;
}

function randomIndex(max: number): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] % max;
  }

  return Math.floor(Math.random() * max);
}

export function generateRandomTokenSegment(length: number): string {
  return Array.from({ length }, () => TOKEN_ALPHABET[randomIndex(TOKEN_ALPHABET.length)]).join(
    "",
  );
}

export function generateTrackingToken(prefix = "BOCRA"): string {
  return `${prefix}-${generateRandomTokenSegment(6)}-${generateRandomTokenSegment(6)}`;
}

export function generateReferenceNumber(prefix = "BOCRA", date = new Date()): string {
  return `${prefix}-${formatDateCompact(date)}-${generateRandomTokenSegment(6)}`;
}
