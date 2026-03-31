import { ChOverrides, WorksheetBlock } from "@/types/worksheet";

/**
 * Deep-clone and recursively replace ß with ss in all string values.
 */
export function replaceEszett<T>(obj: T): T {
  if (typeof obj === "string") return obj.replace(/ß/g, "ss") as unknown as T;
  if (Array.isArray(obj)) return obj.map(replaceEszett) as unknown as T;
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceEszett(value);
    }
    return result as T;
  }
  return obj;
}

/**
 * Get a value from a nested object by dot-separated path.
 */
export function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Deep-clone an object and set a value at a dot-separated path.
 */
export function setByPath<T>(obj: T, path: string, value: unknown): T {
  const clone = JSON.parse(JSON.stringify(obj));
  const parts = path.split(".");
  let current: Record<string, unknown> = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] == null || typeof current[part] !== "object") {
      // Check if part is numeric (array index)
      const nextPart = parts[i + 1];
      current[part] = /^\d+$/.test(nextPart) ? [] : {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
  return clone;
}

/**
 * Get the effective value for a field — either the CH override or the base value
 * (with ß→ss applied in CH mode).
 */
export function getEffectiveValue(
  baseValue: string,
  blockId: string,
  fieldPath: string,
  localeMode: "DE" | "CH",
  chOverrides?: ChOverrides
): string {
  if (localeMode === "DE") return baseValue;
  // Check for a manual CH override
  const override = chOverrides?.[blockId]?.[fieldPath];
  if (override !== undefined) return String(override);
  // Default: automatic ß→ss
  return baseValue.replace(/ß/g, "ss");
}

/**
 * Check whether a CH override exists for a given block+field.
 */
export function hasChOverride(
  blockId: string,
  fieldPath: string,
  chOverrides?: ChOverrides
): boolean {
  return chOverrides?.[blockId]?.[fieldPath] !== undefined;
}

/**
 * Count total CH overrides across all blocks.
 */
export function countChOverrides(chOverrides?: ChOverrides): number {
  if (!chOverrides) return 0;
  let count = 0;
  for (const block of Object.values(chOverrides)) {
    count += Object.keys(block).length;
  }
  return count;
}
