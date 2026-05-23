"use client";

import { LanguageInfo } from "@/lib/languages";

interface LanguageBadgeProps {
  language: LanguageInfo;
  confidence?: number;
  onClick?: () => void;
  selected?: boolean;
}

export default function LanguageBadge({
  language,
  confidence,
  onClick,
  selected,
}: LanguageBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        selected
          ? "bg-opacity-20 text-white ring-2 ring-white/20"
          : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white"
      }`}
      style={
        selected
          ? {
              backgroundColor: `${language.color}33`,
              borderColor: `${language.color}66`,
            }
          : {}
      }
    >
      <span>{language.icon}</span>
      <span>{language.name}</span>
      {confidence !== undefined && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: `${language.color}22`,
            color: language.color,
          }}
        >
          {confidence}%
        </span>
      )}
    </button>
  );
}
