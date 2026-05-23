"use client";

import { useState, useCallback, useEffect } from "react";
import CodeEditor from "@/components/CodeEditor";
import OutputPanel from "@/components/OutputPanel";
import DetectionCard from "@/components/DetectionCard";
import LanguageBadge from "@/components/LanguageBadge";
import { DetectionResult, detectLanguage } from "@/lib/detectors";
import { languages, LanguageInfo, getLanguageById } from "@/lib/languages";
import { deobfuscateJavaScript, DeobfuscationResult } from "@/lib/deobfuscate";
import { formatCode, estimateComplexity } from "@/lib/utils";
import {
  EncryptorMode,
  getEncryptorsForLanguage,
  getEncryptorById,
} from "@/lib/encryptors";

type Lang = "en" | "ar";
type Mode = "decrypt" | "encrypt";

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [mode, setMode] = useState<Mode>("decrypt");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [transformations, setTransformations] = useState<string[]>([]);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("auto");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const isRtl = lang === "ar";

  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);

  const targetLangId =
    selectedLanguage && selectedLanguage !== "auto"
      ? selectedLanguage
      : detection?.languageId || "";

  const availableAlgorithms = targetLangId
    ? getEncryptorsForLanguage(targetLangId)
    : [];

  // Reset algorithm selection when language or mode changes
  useEffect(() => {
    if (mode === "decrypt") {
      setSelectedAlgorithm("");
    } else if (availableAlgorithms.length > 0 && !selectedAlgorithm) {
      setSelectedAlgorithm(availableAlgorithms[0].id);
    }
  }, [mode, targetLangId, availableAlgorithms.length, selectedAlgorithm]);

  const processCode = useCallback(
    (codeToProcess: string, langOverride?: string, encMode?: Mode, algoId?: string) => {
      if (!codeToProcess.trim()) {
        setOutput("");
        setTransformations([]);
        setDetection(null);
        return;
      }

      const result = detectLanguage(codeToProcess);
      setDetection(result);

      const targetLang = langOverride && langOverride !== "auto" ? langOverride : result.languageId;
      const allTransformations: string[] = [];
      let finalOutput = codeToProcess;

      if (encMode === "encrypt" && algoId) {
        const algo = getEncryptorById(targetLang, algoId);
        if (algo) {
          finalOutput = algo.encrypt(codeToProcess);
          allTransformations.push(`Encrypted using ${algo.name}`);
        }
      } else {
        let deobfResult: DeobfuscationResult | null = null;

        if (targetLang === "javascript" || targetLang === "typescript") {
          deobfResult = deobfuscateJavaScript(codeToProcess);
          allTransformations.push(...deobfResult.transformations);
          finalOutput = deobfResult.output;
        }

        // Try all decrypt algorithms for the detected language
        const langAlgos = getEncryptorsForLanguage(targetLang);
        for (const algo of langAlgos) {
          try {
            const decrypted = algo.decrypt(finalOutput);
            if (decrypted !== finalOutput) {
              allTransformations.push(`Decrypted using ${algo.name}`);
              finalOutput = decrypted;
            }
          } catch {
            // skip if decrypt fails
          }
        }

        const formatted = formatCode(finalOutput, targetLang);
        if (formatted !== finalOutput) {
          allTransformations.push(`Formatted code for ${targetLang}`);
          finalOutput = formatted;
        }
      }

      setOutput(finalOutput);
      setTransformations(allTransformations);
    },
    []
  );

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      processCode(code, selectedLanguage, mode, selectedAlgorithm);
    }, 500);
    setDebounceTimer(timer);
    return () => clearTimeout(timer);
  }, [code, selectedLanguage, mode, selectedAlgorithm, processCode]);

  const handleAnalyze = async () => {
    setProcessing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          mode,
          algorithm: selectedAlgorithm || undefined,
          languageOverride: selectedLanguage !== "auto" ? selectedLanguage : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOutput(data.output);
        setTransformations(data.transformations || []);
        if (data.detection) setDetection(data.detection);
      }
    } catch {
      processCode(code, selectedLanguage, mode, selectedAlgorithm);
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setCode("");
    setOutput("");
    setTransformations([]);
    setDetection(null);
  };

  const complexity = code ? estimateComplexity(code, detection?.languageId || "unknown") : 0;

  return (
    <div className="min-h-screen" dir={isRtl ? "rtl" : "ltr"}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0f0f1a]/80 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                CC
              </div>
              <span className="text-lg font-bold text-white hidden sm:block">
                Code<span className="text-blue-400">Crypt</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://github.com/Shadow132245/CodeCrypt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <button
                onClick={() => setLang(lang === "en" ? "ar" : "en")}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all"
              >
                {lang === "en" ? "العربية" : "English"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            {t("v1.0 — 10 languages supported", "الإصدار 1.0 — يدعم 10 لغات")}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
            <span className="gradient-text">
              {t("Universal Code Encryptor & Decompiler", "مشفّر ومفكّك التشفير الشامل")}
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            {t(
              "Encrypt, decrypt, deobfuscate, and beautify code from 10+ programming languages with language-specific algorithms.",
              "تشفير، فك تشفير، فك الترجمة، وتجميل الكود من أكثر من 10 لغات برمجية مع خوارزميات خاصة بكل لغة."
            )}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold text-lg">10+</span>
              <span>{t("Languages", "لغات")}</span>
            </div>
            <div className="w-px h-8 bg-gray-800" />
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold text-lg">Auto</span>
              <span>{t("Detection", "كشف تلقائي")}</span>
            </div>
            <div className="w-px h-8 bg-gray-800" />
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold text-lg">Free</span>
              <span>{t("Open Source", "مفتوح المصدر")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Editor Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Language selector */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setSelectedLanguage("auto")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedLanguage === "auto"
                ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200"
            }`}
          >
            <span className="mr-1">🤖</span>
            {t("Auto Detect", "كشف تلقائي")}
          </button>
          {languages.map((langInfo) => (
            <LanguageBadge
              key={langInfo.id}
              language={langInfo}
              selected={selectedLanguage === langInfo.id}
              onClick={() =>
                setSelectedLanguage(
                  selectedLanguage === langInfo.id ? "auto" : langInfo.id
                )
              }
            />
          ))}
        </div>

        {/* Mode + Algorithm selector */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex rounded-lg overflow-hidden border border-gray-700/50">
            <button
              onClick={() => setMode("decrypt")}
              className={`px-4 py-1.5 text-sm font-medium transition-all ${
                mode === "decrypt"
                  ? "bg-green-600/20 text-green-400"
                  : "bg-gray-800/50 text-gray-400 hover:text-gray-200"
              }`}
            >
              {t("Decrypt", "فك تشفير")}
            </button>
            <button
              onClick={() => setMode("encrypt")}
              className={`px-4 py-1.5 text-sm font-medium transition-all ${
                mode === "encrypt"
                  ? "bg-orange-600/20 text-orange-400"
                  : "bg-gray-800/50 text-gray-400 hover:text-gray-200"
              }`}
            >
              {t("Encrypt", "تشفير")}
            </button>
          </div>

          {mode === "encrypt" && availableAlgorithms.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {t("Algorithm:", "الخوارزمية:")}
              </span>
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {availableAlgorithms.map((algo) => (
                  <option key={algo.id} value={algo.id}>
                    {algo.icon} {lang === "ar" ? algo.nameAr : algo.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "encrypt" && availableAlgorithms.length === 0 && targetLangId && (
            <span className="text-xs text-yellow-400">
              {t("No encryption algorithms for this language", "لا توجد خوارزميات تشفير لهذه اللغة")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DetectionCard detection={detection} isRtl={isRtl} />
              </div>
              <div className="flex items-center gap-2">
                {mode === "encrypt" && selectedAlgorithm && targetLangId && (
                  <span className="text-xs text-gray-500 max-w-[200px] truncate" title={t(
                    availableAlgorithms.find(a => a.id === selectedAlgorithm)?.description || "",
                    availableAlgorithms.find(a => a.id === selectedAlgorithm)?.descriptionAr || ""
                  )}>
                    {t(
                      availableAlgorithms.find(a => a.id === selectedAlgorithm)?.description || "",
                      availableAlgorithms.find(a => a.id === selectedAlgorithm)?.descriptionAr || ""
                    )}
                  </span>
                )}
                {code && (
                  <>
                    <span className="text-xs text-gray-500">
                      {code.length} {t("chars", "حرف")} · {complexity} {t("complexity", "تعقيد")}
                    </span>
                    <button
                      onClick={handleClear}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      {t("Clear", "مسح")}
                    </button>
                  </>
                )}
                <button
                  onClick={handleAnalyze}
                  disabled={processing || !code.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                >
                  {processing
                    ? t("Processing...", "جار المعالجة...")
                    : mode === "encrypt"
                    ? t("Encrypt", "تشفير")
                    : t("Decrypt", "فك تشفير")}
                </button>
              </div>
            </div>
            <CodeEditor
              value={code}
              onChange={setCode}
              language={detection?.languageId || "unknown"}
              isRtl={isRtl}
            />
          </div>

          {/* Right: Output */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-400">
                {output
                  ? t("Result", "النتيجة")
                  : t("Output will appear here", "الناتج سيظهر هنا")}
              </h3>
              {transformations.length > 0 && (
                <span className="text-xs text-green-400">
                  {transformations.length} {t("transformations", "تحويل")}
                </span>
              )}
            </div>
            <OutputPanel
              output={output}
              transformations={transformations}
              originalLength={code.length}
              languageName={
                getLanguageById(detection?.languageId || "")?.name ||
                detection?.languageId ||
                ""
              }
              mode={mode}
              algorithmName={
                mode === "encrypt" && selectedAlgorithm
                  ? lang === "ar"
                    ? availableAlgorithms.find(a => a.id === selectedAlgorithm)?.nameAr ||
                      selectedAlgorithm
                    : availableAlgorithms.find(a => a.id === selectedAlgorithm)?.name ||
                      selectedAlgorithm
                  : undefined
              }
              isRtl={isRtl}
            />
          </div>
        </div>
      </section>

      {/* Supported Languages */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">
            {t("Supported Languages", "اللغات المدعومة")}
          </h2>
          <p className="text-gray-400">
            {t(
              "Each language comes with auto-detection, formatting, encryption, and decryption algorithms",
              "كل لغة تأتي مع كشف تلقائي، تنسيق، وخوارزميات تشفير وفك تشفير"
            )}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {languages.map((langInfo) => (
            <div
              key={langInfo.id}
              className="group relative overflow-hidden rounded-xl p-5 bg-gray-800/20 border border-gray-800/50 hover:border-gray-700/50 transition-all hover:bg-gray-800/30"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                style={{ backgroundColor: langInfo.color }}
              />
              <div className="relative">
                <div className="text-3xl mb-3">{langInfo.icon}</div>
                <h3 className="text-white font-semibold mb-1">{langInfo.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {lang === "ar" ? langInfo.descriptionAr : langInfo.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {langInfo.canDeobfuscate && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                      {t("Decrypt", "فك تشفير")}
                    </span>
                  )}
                  {langInfo.canFormat && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                      Format
                    </span>
                  )}
                  {getEncryptorsForLanguage(langInfo.id).length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
                      {t("Encrypt", "تشفير")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl p-6 bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/10">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
              <span className="text-2xl">🧠</span>
            </div>
            <h3 className="text-white font-semibold mb-2">
              {t("Auto Language Detection", "كشف تلقائي للغة")}
            </h3>
            <p className="text-sm text-gray-400">
              {t(
                "Our smart detector analyzes syntax patterns, keywords, and structure to identify the programming language automatically.",
                "المحلل الذكي يحلل أنماط التركيب والكلمات المفتاحية والهيكل للتعرف على لغة البرمجة تلقائياً."
              )}
            </p>
          </div>

          <div className="rounded-xl p-6 bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/10">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h3 className="text-white font-semibold mb-2">
              {t("Encrypt & Decrypt", "تشفير وفك تشفير")}
            </h3>
            <p className="text-sm text-gray-400">
              {t(
                "Each language has its own encryption algorithms. Encrypt code to protect it, or decrypt obfuscated code back to readable form.",
                "كل لغة لها خوارزميات التشفير الخاصة بها. شفر الكود لحمايته، أو فك التشفير عن الكود المشفر لإعادته لشكل قابل للقراءة."
              )}
            </p>
          </div>

          <div className="rounded-xl p-6 bg-gradient-to-br from-green-500/5 to-transparent border border-green-500/10">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="text-white font-semibold mb-2">
              {t("Smart Formatting", "تنسيق ذكي")}
            </h3>
            <p className="text-sm text-gray-400">
              {t(
                "Language-aware code beautification with proper indentation, spacing, and structure recovery for readable output.",
                "تجميل الكود مع وعي باللغة مع مسافات بادئة صحيحة وتباعد واستعادة الهيكل لناتج قابل للقراءة."
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Examples */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">
            {t("Try It Now", "جربه الآن")}
          </h2>
          <p className="text-gray-400">
            {t(
              "Click any example to load it in the editor",
              "اضغط على أي مثال لتحميله في المحرر"
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {examples.map((example, i) => (
            <button
              key={i}
              onClick={() => setCode(example.code)}
              className="text-left group relative overflow-hidden rounded-xl p-4 bg-gray-800/20 border border-gray-800/50 hover:border-blue-500/30 transition-all hover:bg-gray-800/40"
            >
              <div className="flex items-center gap-2 mb-2">
                <span>{example.icon}</span>
                <span className="text-white font-medium text-sm">{example.name}</span>
              </div>
              <pre className="text-xs text-gray-500 line-clamp-3 font-mono overflow-hidden">
                {example.code.slice(0, 150)}
                {example.code.length > 150 ? "..." : ""}
              </pre>
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span>CodeCrypt</span>
              <span className="text-gray-600">·</span>
              <span>{t("Built with Next.js", "بُني باستخدام Next.js")}</span>
            </div>
            <div className="text-gray-500 text-xs">
              {t(
                "Open source · MIT License",
                "مفتوح المصدر · رخصة MIT"
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const examples = [
  {
    icon: "📜",
    name: "Obfuscated JavaScript",
    code: `var _0xabc1 = ['hello\\x20world','log','Hello,\\x20','!'];
(function(_0x1234, _0x5678) {
  var _0x90ab = function(_0xdef0) {
    while (--_0xdef0) {
      _0x1234['push'](_0x1234['shift']());
    }
  };
  _0x90ab(++_0x5678);
}(_0xabc1, 0x1b1));
var _0x1b2c = function(_0x2d3e, _0x4f5a) {
  _0x2d3e = _0x2d3e - 0x0;
  var _0x6789 = _0xabc1[_0x2d3e];
  return _0x6789;
};
console[_0x1b2c('0x1')](_0x1b2c('0x0'));
console[_0x1b2c('0x1')](_0x1b2c('0x2') + name + _0x1b2c('0x3'));`,
  },
  {
    icon: "🔐",
    name: "JS Hex Encrypted",
    code: `console.log("\x48\x65\x6c\x6c\x6f\x2c\x20\x57\x6f\x72\x6c\x64\x21");
let \x6d\x65\x73\x73\x61\x67\x65 = "\x54\x68\x69\x73\x20\x69\x73\x20\x61\x20\x74\x65\x73\x74";
alert(\x6d\x65\x73\x73\x61\x67\x65);`,
  },
  {
    icon: "🐍",
    name: "Python Hex Encrypted",
    code: `# XOR key: 42
(lambda _: ''.join(chr(ord(c) ^ 42) for c in _))('\x0b\x2e\x2c\x2c\x2f\x7f\x5d\x2f\x2c\x2f\x79\x2c\x31\x2f\x2c\x36\x2f\x79\x29\x0a')`,
  },
  {
    icon: "☕",
    name: "Java Snippet",
    code: `public class HelloWorld {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
    for (int i = 0; i < 10; i++) {
      if (i % 2 == 0) {
        System.out.println("Even: " + i);
      }
    }
  }
}`,
  },
  {
    icon: "💠",
    name: "C# Code",
    code: `using System;
using System.Collections.Generic;
namespace Demo {
  class Program {
    static void Main(string[] args) {
      var list = new List<string>() { "a", "b", "c" };
      list.ForEach(item => {
        Console.WriteLine($"Item: {item}");
      });
    }
  }
}`,
  },
  {
    icon: "⚙️",
    name: "C++ Example",
    code: `#include <iostream>
#include <vector>
using namespace std;
int main() {
  vector<int> nums = {1, 2, 3, 4, 5};
  for (int i = 0; i < nums.size(); i++) {
    cout << "nums[" << i << "] = " << nums[i] << endl;
  }
  return 0;
}`,
  },
];
