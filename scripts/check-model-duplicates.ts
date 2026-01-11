#!/usr/bin/env bun
/**
 * Check for duplicate model names in token_usage table
 * Run: bun run scripts/check-model-duplicates.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("Run with: dotenvx run -f .env.vibetracking -- bun run scripts/check-model-duplicates.ts");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const username = process.argv[2] || "fricoben";

  console.log(`\n🔍 Checking model duplicates for user: ${username}\n`);

  // Get user ID
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, username")
    .eq("username", username)
    .single();

  if (userError || !user) {
    console.error(`User not found: ${username}`);
    process.exit(1);
  }

  console.log(`User ID: ${user.id}\n`);

  // Get all distinct models for this user with their token counts
  const { data: models, error: modelsError } = await supabase
    .from("token_usage")
    .select("model, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, reasoning_tokens, cost")
    .eq("user_id", user.id);

  if (modelsError) {
    console.error("Error fetching models:", modelsError);
    process.exit(1);
  }

  // Aggregate by model
  const modelStats = new Map<string, {
    totalTokens: number;
    totalCost: number;
    count: number;
  }>();

  for (const row of models || []) {
    const existing = modelStats.get(row.model) || { totalTokens: 0, totalCost: 0, count: 0 };
    const tokens = (row.input_tokens || 0) + (row.output_tokens || 0) +
                   (row.cache_read_tokens || 0) + (row.cache_creation_tokens || 0) +
                   (row.reasoning_tokens || 0);
    existing.totalTokens += tokens;
    existing.totalCost += row.cost || 0;
    existing.count += 1;
    modelStats.set(row.model, existing);
  }

  // Sort by total tokens
  const sortedModels = Array.from(modelStats.entries())
    .sort((a, b) => b[1].totalTokens - a[1].totalTokens);

  console.log("📊 Models by total tokens:\n");
  console.log("| Model | Total Tokens | Cost | Records |");
  console.log("|-------|--------------|------|---------|");

  for (const [model, stats] of sortedModels) {
    const tokens = stats.totalTokens.toLocaleString().padStart(15);
    const cost = `$${stats.totalCost.toFixed(2)}`.padStart(8);
    const count = stats.count.toString().padStart(5);
    console.log(`| ${model.padEnd(50)} | ${tokens} | ${cost} | ${count} |`);
  }

  // Find potential duplicates (models containing similar keywords)
  console.log("\n\n🔄 Potential duplicates (similar model names):\n");

  const modelNames = sortedModels.map(([name]) => name);
  const keywords = ["opus", "sonnet", "haiku", "claude", "gpt", "gemini"];

  for (const keyword of keywords) {
    const matching = modelNames.filter(m => m.toLowerCase().includes(keyword));
    if (matching.length > 1) {
      console.log(`\n${keyword.toUpperCase()} variants (${matching.length}):`);
      for (const model of matching) {
        const stats = modelStats.get(model)!;
        console.log(`  - "${model}" (${stats.totalTokens.toLocaleString()} tokens, $${stats.totalCost.toFixed(2)})`);
      }
    }
  }

  // Show global model distribution (all users)
  console.log("\n\n📈 Global model distribution (all users):\n");

  const { data: globalModels, error: globalError } = await supabase
    .from("token_usage")
    .select("model");

  if (!globalError && globalModels) {
    const globalCounts = new Map<string, number>();
    for (const row of globalModels) {
      globalCounts.set(row.model, (globalCounts.get(row.model) || 0) + 1);
    }

    const sortedGlobal = Array.from(globalCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    console.log("| Model | Record Count |");
    console.log("|-------|--------------|");
    for (const [model, count] of sortedGlobal) {
      console.log(`| ${model.padEnd(50)} | ${count.toString().padStart(12)} |`);
    }
  }
}

main().catch(console.error);
