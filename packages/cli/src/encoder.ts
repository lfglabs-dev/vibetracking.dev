import pako from "pako";
import type { ImportData } from "./types.js";

export function encodeData(data: ImportData): string {
  // Convert to JSON string
  const jsonString = JSON.stringify(data);

  // Compress with gzip
  const compressed = pako.deflate(jsonString);

  // Convert to base64 (URL-safe)
  const base64 = Buffer.from(compressed).toString("base64url");

  return base64;
}

export function decodeData(encoded: string): ImportData {
  // Decode base64
  const compressed = Buffer.from(encoded, "base64url");

  // Decompress
  const jsonString = pako.inflate(compressed, { to: "string" });

  // Parse JSON
  return JSON.parse(jsonString);
}
