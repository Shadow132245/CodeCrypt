"use client";

import { DetectionResult } from "@/lib/detectors";
import { getLanguageById } from "@/lib/languages";

interface DetectionCardProps {
  detection: DetectionResult | null;
  isRtl?: boolean;
}

export default function DetectionCard({ detection, isRtl }: DetectionCardProps) {
  if (!detection || detection.languageId === "unknown") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/30 border border-gray-700/30">
        <span className="text-2xl">🤔</span>
        <div>
          <div className="text-sm text-gray-400">
            {isRtl ? "في انتظار الكود..." : "Waiting for code..."}
          </div>
          <div className="text-xs text-gray-500">
            {isRtl ? "اكتب أو الصق الكود للكشف التلقائي" : "Type or paste code for auto-detection"}
          </div>
        </div>
      </div>
    );
  }

  const langInfo = getLanguageById(detection.languageId);
  const confidence = detection.confidence;

  const getConfidenceColor = () => {
    if (confidence >= 80) return "text-green-400";
    if (confidence >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getConfidenceBg = () => {
    if (confidence >= 80) return "bg-green-500/10 border-green-500/20";
    if (confidence >= 50) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${getConfidenceBg()}`}
    >
      <span className="text-2xl">{langInfo?.icon || "📄"}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{langInfo?.name || detection.languageId}</span>
          <span className={`text-xs font-bold ${getConfidenceColor()}`}>
            {confidence}%
          </span>
        </div>
        <div className="text-xs text-gray-400">
          {isRtl ? "تم الكشف التلقائي" : "Auto-detected"}
        </div>
      </div>
      <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500`}
          style={{
            width: `${confidence}%`,
            backgroundColor: langInfo?.color || "#666",
          }}
        />
      </div>
    </div>
  );
}
