#!/usr/bin/env bun
/**
 * Convert Cursor aggregated CSV to raw events format
 *
 * The aggregated format has:
 *   Model,Request Count,Input (w/ Cache Write),Input (w/o Cache Write),Cache Read,Output Tokens,Total Tokens,Cost ($)
 *
 * The raw events format needs:
 *   Date,Kind,Model,Max Mode,Input (w/ Cache Write),Input (w/o Cache Write),Cache Read,Output Tokens,Total Tokens,Cost
 */

import * as fs from "fs";
import * as path from "path";

const INPUT_FILE = process.argv[2] || "/tmp/attachments/usage-events-aggregated-v1.csv";
const OUTPUT_FILE = process.argv[3] || "/tmp/usage-events-converted.csv";

// Read input CSV
const content = fs.readFileSync(INPUT_FILE, "utf-8");
const lines = content.trim().split("\n");

// Parse header
const header = lines[0];
console.log("Input header:", header);

// Output header (raw events format)
const outputHeader = "Date,Kind,Model,Max Mode,Input (w/ Cache Write),Input (w/o Cache Write),Cache Read,Output Tokens,Total Tokens,Cost";
const outputRows: string[] = [outputHeader];

// Generate dates spread across last 90 days
function generateDates(count: number): string[] {
  const dates: string[] = [];
  const now = Date.now();
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    // Distribute evenly across last 90 days with some randomness
    const offset = (i / count) * ninetyDays + Math.random() * (ninetyDays / count);
    const date = new Date(now - offset);
    dates.push(date.toISOString());
  }

  return dates.sort(); // Chronological order
}

// Parse each data row
let totalRowsGenerated = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || line.startsWith("TOTAL")) continue;

  // Parse CSV fields
  const fields = line.split(",");
  if (fields.length < 8) continue;

  const model = fields[0].trim();
  const requestCount = parseInt(fields[1]) || 0;
  const inputWithCache = parseInt(fields[2]) || 0;
  const inputWithoutCache = parseInt(fields[3]) || 0;
  const cacheRead = parseInt(fields[4]) || 0;
  const outputTokens = parseInt(fields[5]) || 0;
  const totalTokens = parseInt(fields[6]) || 0;
  const costStr = fields[7].trim();
  const cost = costStr === "nan" ? 0 : parseFloat(costStr) || 0;

  if (requestCount === 0) continue;

  // Calculate per-request values
  const perRequestInputWithCache = Math.round(inputWithCache / requestCount);
  const perRequestInputWithoutCache = Math.round(inputWithoutCache / requestCount);
  const perRequestCacheRead = Math.round(cacheRead / requestCount);
  const perRequestOutput = Math.round(outputTokens / requestCount);
  const perRequestTotal = Math.round(totalTokens / requestCount);
  const perRequestCost = cost / requestCount;

  // Generate dates for this model's requests
  const dates = generateDates(requestCount);

  // Create a row for each request
  for (const date of dates) {
    // Format: Date,Kind,Model,Max Mode,Input (w/ Cache Write),Input (w/o Cache Write),Cache Read,Output Tokens,Total Tokens,Cost
    const row = [
      `"${date}"`,
      `"Included"`,
      `"${model}"`,
      `"No"`,
      `"${perRequestInputWithCache}"`,
      `"${perRequestInputWithoutCache}"`,
      `"${perRequestCacheRead}"`,
      `"${perRequestOutput}"`,
      `"${perRequestTotal}"`,
      `"${perRequestCost.toFixed(2)}"`,
    ].join(",");

    outputRows.push(row);
    totalRowsGenerated++;
  }

  console.log(`  ${model}: ${requestCount} requests → ${requestCount} rows`);
}

// Write output
fs.writeFileSync(OUTPUT_FILE, outputRows.join("\n") + "\n");

console.log(`\n✅ Converted ${totalRowsGenerated} rows`);
console.log(`📄 Output: ${OUTPUT_FILE}`);
