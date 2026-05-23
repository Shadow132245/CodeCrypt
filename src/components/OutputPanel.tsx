"use client";

import { useState } from "react";
import { formatBytes, countLines } from "@/lib/utils";

interface OutputPanelProps {
  output: string;
  transformations: string[];
  originalLength: number;
  languageName: string;
  mode?: "encrypt" | "decrypt";
  algorithmName?: string;
  isRtl?: boolean;
}

export default function OutputPanel({
  output,
  transformations,
  originalLength,
  languageName,
  mode,
  algorithmName,
  isRtl,
}: OutputPanelProps) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"output" | "info">("output");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const outputLines = countLines(output);
  const saved = originalLength - output.length;

  if (!output) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-700/50 p-12 text-center">
        <div className="text-5xl mb-4">🔮</div>
        <p className="text-gray-400 text-lg">
          {isRtl
            ? "الصق الكود في المحرر لبدء التحليل"
            : "Paste your code in the editor to start analysis"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-gray-700/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a2e] border-b border-gray-700/50">
        <div className="flex gap-1">
          <button
            onClick={() => setTab("output")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === "output"
                ? "bg-blue-500/20 text-blue-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {isRtl ? "الناتج" : "Output"}
          </button>
          <button
            onClick={() => setTab("info")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === "info"
                ? "bg-blue-500/20 text-blue-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {isRtl ? "معلومات" : "Info"}
          </button>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-all"
        >
          {copied ? (
            <>
              <span>✓</span>
              <span>{isRtl ? "تم النسخ" : "Copied!"}</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>{isRtl ? "نسخ" : "Copy"}</span>
            </>
          )}
        </button>
      </div>

      {tab === "output" ? (
        <pre className="p-4 text-sm font-mono leading-6 text-gray-100 overflow-x-auto max-h-[500px] overflow-y-auto whitespace-pre-wrap">
          {output}
        </pre>
      ) : (
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                {isRtl ? "اللغة" : "Language"}
              </div>
              <div className="text-white font-medium">{languageName}</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                {isRtl ? "الوضع" : "Mode"}
              </div>
              <div className="text-white font-medium">
                {mode === "encrypt"
                  ? isRtl ? "تشفير" : "Encrypt"
                  : isRtl ? "فك تشفير" : "Decrypt"}
              </div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                {isRtl ? "الحجم الأصلي" : "Original Size"}
              </div>
              <div className="text-white font-medium">{formatBytes(originalLength)}</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                {isRtl ? "الحجم النهائي" : "Output Size"}
              </div>
              <div className="text-white font-medium">{formatBytes(output.length)}</div>
            </div>
            {algorithmName && (
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                  {isRtl ? "الخوارزمية" : "Algorithm"}
                </div>
                <div className="text-white font-medium">{algorithmName}</div>
              </div>
            )}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                {isRtl ? "الأسطر" : "Lines"}
              </div>
              <div className="text-white font-medium">{outputLines}</div>
            </div>
          </div>

          {transformations.length > 0 && (
            <div>
              <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                {isRtl ? "التحويلات المطبقة" : "Transformations Applied"}
              </h4>
              <ul className="space-y-1">
                {transformations.map((t, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-green-400">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
