export interface DetectionResult {
  languageId: string;
  confidence: number;
  hints: string[];
}

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((sum, regex) => {
    const matches = text.match(regex);
    return sum + (matches ? matches.length : 0);
  }, 0);
}

const detectors: {
  id: string;
  weight: number;
  patterns: RegExp[];
  negativePatterns?: RegExp[];
}[] = [
  {
    id: "python",
    weight: 3,
    patterns: [
      /\bdef \w+\s*\(/g,
      /\bclass \w+\s*:/g,
      /\bimport \w+/g,
      /\bfrom \w+ import/g,
      /\bprint\s*\(/g,
      /\bif __name__ == ['"]__main__['"]/g,
      /\bself\b/g,
      /:\s*$/gm,
      /^\s*#(?!.*<\/)/gm,
      /\b(?:True|False|None)\b/g,
      /\belif\b/g,
      /\brainbow\b/g,
    ],
    negativePatterns: [
      /\bpublic\b/g,
      /\bprivate\b/g,
      /\bprotected\b/g,
      /\bstatic\b/g,
      /\bvoid\b/g,
      /\bvar\b/g,
      /\blet\b/g,
      /\bconst\b/g,
      /\bfunction\b/g,
      /=>/g,
      /\$\w+/g,
      /<?php/g,
    ],
  },
  {
    id: "javascript",
    weight: 2,
    patterns: [
      /\bconst\b/g,
      /\blet\b/g,
      /\bvar\b/g,
      /\bfunction\s*\(/g,
      /\bfunction\s+\w+\s*\(/g,
      /=>\s*{/g,
      /\bconsole\.(log|error|warn)\s*\(/g,
      /\bmodule\.exports\b/g,
      /\brequire\s*\(/g,
      /\bimport\s+.*\s+from\s+/g,
      /\bexport\s+(default\s+)?(function|const|class)/g,
      /\bdocument\./g,
      /\bwindow\./g,
      /\bnull\b/g,
      /\bundefined\b/g,
      /===/g,
      /!==/g,
      /\/\/.*$/gm,
      /\$\s*\(/g,
      /=>\s*$/gm,
    ],
  },
  {
    id: "typescript",
    weight: 4,
    patterns: [
      /:\s*(string|number|boolean|void|any|never)\b/g,
      /\binterface\s+\w+/g,
      /\btype\s+\w+\s*=/g,
      /\bas\s+(string|number|boolean|any)\b/g,
      /<[A-Z]\w*>/g,
      /\benum\s+\w+/g,
      /\bpublic\b.*:/g,
      /\bprivate\b.*:/g,
      /\breadonly\b/g,
      /\bArray<|Promise<|Record</g,
    ],
    negativePatterns: [
      /<?php/g,
    ],
  },
  {
    id: "java",
    weight: 3,
    patterns: [
      /\bpublic\s+(static\s+)?void\s+main\b/g,
      /\bSystem\.(out|in|err)\./g,
      /\bclass\s+\w+\s*\{/g,
      /\bextends\s+\w+/g,
      /\bimplements\s+\w+/g,
      /\b@Override\b/g,
      /\bimport\s+java\./g,
      /\b(public|private|protected)\s+(static\s+)?(void|int|String|boolean|double)\b/g,
      /@\w+/g,
      /\bnew\s+\w+\(/g,
    ],
    negativePatterns: [
      /\busing\s+System\b/g,
      /\bnamespace\b/g,
      /<?php/g,
    ],
  },
  {
    id: "csharp",
    weight: 3,
    patterns: [
      /\busing\s+System\b/g,
      /\bnamespace\s+\w+/g,
      /\bclass\s+\w+\s*\{/g,
      /\bConsole\.(Write|Read|WriteLine|ReadLine)/g,
      /\b(public|private|protected|internal)\s+(static\s+)?(void|int|string|bool|var)\b/g,
      /\bstring\s+\w+\s*=/g,
      /\bvar\s+\w+\s*=/g,
      /\basync\s+\w+/g,
      /\bawait\b/g,
      /\bget;\s*set;/g,
      /\bthis\./g,
      /=>/g,
    ],
    negativePatterns: [
      /\bextends\b/g,
      /\bimplements\b/g,
      /<?php/g,
    ],
  },
  {
    id: "cpp",
    weight: 3,
    patterns: [
      /#include\s*[<"][^>"]+[>"]/g,
      /\bint\s+main\s*\(/g,
      /\bcout\s*<</g,
      /\bcin\s*>>/g,
      /\bprintf\s*\(/g,
      /\bscanf\s*\(/g,
      /\bstd::/g,
      /->/g,
      /\b(public|private|protected)\s*:/g,
      /\bclass\s+\w+\s*:/g,
      /\bvirtual\b/g,
      /\bconst\s+int\b/g,
      /\b(int|float|double|char)\s*\*+/g,
      /\/\/.*$/gm,
      /\bNULL\b/g,
      /\bnullptr\b/g,
      /\#define\b/g,
    ],
    negativePatterns: [
      /\busing\s+System\b/g,
      /\bConsole\./g,
      /\bdef \w+\s*\(/g,
    ],
  },
  {
    id: "php",
    weight: 4,
    patterns: [
      /<?php/g,
      /\$\w+/g,
      /\becho\s+/g,
      /\bfunction\s+\w+\s*\(/g,
      /\b__construct\b/g,
      /\bnew\s+\w+\(/g,
      /->/g,
      /\b(public|private|protected)\s+function\b/g,
      /\bnamespace\s+\w+/g,
      /\buse\s+\w+\\/g,
      /\barray\s*\(/g,
      /'.*'\s*\.\s*'/g,
    ],
  },
  {
    id: "ruby",
    weight: 4,
    patterns: [
      /\bdef \w+/g,
      /\bend\b/g,
      /\bputs\s+/g,
      /\battr_accessor\b/g,
      /\battr_reader\b/g,
      /\brequire\s+['"]/g,
      /\bclass\s+\w+\s*</g,
      /\bmodule\s+\w+/g,
      /\bdo\s*\|/g,
      /\bif\b.*\bend\b/g,
      /@\w+/g,
      /@@\w+/g,
    ],
    negativePatterns: [
      /<?php/g,
      /\bdef \w+\s*\(/g,
      /\bimport\b/g,
    ],
  },
  {
    id: "html",
    weight: 2,
    patterns: [
      /<!DOCTYPE\s+html>/gi,
      /<html[\s>]/gi,
      /<head[\s>]/gi,
      /<body[\s>]/gi,
      /<div[\s>]/gi,
      /<span[\s>]/gi,
      /<[a-z]+[\s>][^>]*>/gi,
      /<\/[a-z]+>/gi,
      /<script[\s>]/gi,
      /<style[\s>]/gi,
      /class\s*=\s*["'][^"']*["']/gi,
      /id\s*=\s*["'][^"']*["']/gi,
    ],
  },
  {
    id: "css",
    weight: 3,
    patterns: [
      /\{[^}]*color\s*:/gi,
      /\{[^}]*margin\s*:/gi,
      /\{[^}]*padding\s*:/gi,
      /\{[^}]*display\s*:/gi,
      /\{[^}]*font-/gi,
      /@media\b/g,
      /\.\w+\s*\{/g,
      /#\w+\s*\{/g,
      /:\s*(none|block|inline|flex|grid)/g,
      /!\s*important\b/g,
    ],
  },
];

export function detectLanguage(code: string): DetectionResult {
  if (!code || code.trim().length === 0) {
    return { languageId: "unknown", confidence: 0, hints: [] };
  }

  const scores: { id: string; score: number; hints: string[] }[] = [];
  const lines = code.split("\n").filter((l) => l.trim()).length;
  const codeLength = code.length;

  for (const detector of detectors) {
    const positiveCount = countMatches(code, detector.patterns);
    const negativeCount = detector.negativePatterns
      ? countMatches(code, detector.negativePatterns)
      : 0;

    const score = positiveCount * detector.weight - negativeCount * 2;
    const hints: string[] = [];

    if (positiveCount > 0) {
      hints.push(`Found ${positiveCount} ${detector.id}-specific patterns`);
    }

    if (negativeCount > 0) {
      hints.push(`Found ${negativeCount} conflicting patterns`);
    }

    if (score > 0) {
      scores.push({ id: detector.id, score, hints });
    }
  }

  const maxScore = scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : 0;

  if (maxScore <= 0) {
    return { languageId: "unknown", confidence: 0, hints: ["No clear patterns detected"] };
  }

  const best = scores.sort((a, b) => b.score - a.score)[0];
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const confidence = Math.min(Math.round((best.score / (totalScore || 1)) * 100), 100);

  let adjustedConfidence = confidence;

  if (best.id === "javascript") {
    if (/^[\s\S]*$/.test(code) && codeLength > 20) {
      adjustedConfidence = Math.min(adjustedConfidence + 5, 100);
    }
  }

  if (best.id === "html" && codeLength > 50) {
    adjustedConfidence = Math.min(adjustedConfidence + 10, 100);
  }

  return {
    languageId: best.id,
    confidence: adjustedConfidence,
    hints: best.hints,
  };
}
