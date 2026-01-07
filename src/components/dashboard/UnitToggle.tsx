"use client";

export type DisplayUnit = "tokens" | "usd";

interface UnitToggleProps {
  value: DisplayUnit;
  onChange: (unit: DisplayUnit) => void;
}

export function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-[#EEF0F2] rounded-full p-1 border border-[#232323]/10">
      <button
        onClick={() => onChange("tokens")}
        className={`px-3 py-1 text-sm font-medium rounded-full transition-all ${
          value === "tokens"
            ? "bg-white text-[#232323] shadow-sm"
            : "text-[#232323]/60 hover:text-[#232323]"
        }`}
      >
        Tokens
      </button>
      <button
        onClick={() => onChange("usd")}
        className={`px-3 py-1 text-sm font-medium rounded-full transition-all ${
          value === "usd"
            ? "bg-white text-[#232323] shadow-sm"
            : "text-[#232323]/60 hover:text-[#232323]"
        }`}
      >
        USD
      </button>
    </div>
  );
}
