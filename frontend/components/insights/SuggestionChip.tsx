"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

interface SuggestionChipProps {
  text: string;
  onClick: (text: string) => void;
  disabled?: boolean;
}

export default function SuggestionChip({ text, onClick, disabled }: SuggestionChipProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(text)}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-grey-subtle border border-grey-border hover:border-charcoal text-charcoal transition-all text-left shadow-2xs group disabled:opacity-50 disabled:pointer-events-none"
    >
      <span>{text}</span>
      <ArrowUpRight className="w-3 h-3 text-charcoal group-hover:text-charcoal group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
    </button>
  );
}
