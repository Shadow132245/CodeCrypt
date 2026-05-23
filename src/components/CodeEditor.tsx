"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  isRtl?: boolean;
}

export default function CodeEditor({ value, onChange, isRtl }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineCount, setLineCount] = useState(1);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setLineCount(value.split("\n").length);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = e.currentTarget.selectionStart;
        const end = e.currentTarget.selectionEnd;
        const newValue = value.substring(0, start) + "  " + value.substring(end);
        onChange(newValue);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 2;
            textareaRef.current.selectionEnd = start + 2;
          }
        });
      }
    },
    [value, onChange]
  );

  return (
    <div
      className={`relative rounded-xl border-2 transition-all duration-200 overflow-hidden ${
        focused
          ? "border-blue-500 shadow-lg shadow-blue-500/20"
          : "border-gray-700/50 hover:border-gray-600"
      }`}
    >
      <div className="flex bg-[#1e1e2e]">
        <div
          className="select-none py-4 px-3 text-right text-gray-500 text-sm font-mono leading-6 border-r border-gray-800/50 bg-[#1a1a2e]"
          style={{ minWidth: "3.5rem" }}
          dir="ltr"
        >
          {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent text-gray-100 font-mono text-sm leading-6 py-4 px-4 outline-none resize-none min-h-[300px]"
          spellCheck={false}
          dir={isRtl ? "rtl" : "ltr"}
          placeholder="Paste your code here..."
          style={{ tabSize: 2 }}
        />
      </div>
    </div>
  );
}
