/**
 * Table formatting utilities for CLI output
 */

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}
