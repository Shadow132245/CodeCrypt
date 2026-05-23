export interface DeobfuscationResult {
  success: boolean;
  output: string;
  error?: string;
  transformations: string[];
}

const hexRegex = /\\x([0-9a-fA-F]{2})/g;
const unicodeRegex = /\\u([0-9a-fA-F]{4})/g;
const base64Regex = /^['"]([A-Za-z0-9+/=]+)['"]$/;

function decodeHex(str: string): string {
  return str.replace(hexRegex, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function decodeUnicode(str: string): string {
  return str.replace(unicodeRegex, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function isBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str && str.length > 4;
  } catch {
    return false;
  }
}

function decodeBase64EncodedStrings(code: string): string {
  return code.replace(/['"]([A-Za-z0-9+/=]{10,})['"]/g, (match, str) => {
    try {
      if (isBase64(str)) {
        const decoded = atob(str);
        if (/^[\x20-\x7E]+$/.test(decoded)) {
          return `"${decoded}"`;
        }
      }
    } catch {}
    return match;
  });
}

function detectEvalUsage(code: string): string[] {
  const transformations: string[] = [];
  const evalMatches = code.match(/eval\s*\(/g);
  if (evalMatches) {
    transformations.push(`Found ${evalMatches.length} eval() calls (potential obfuscation)`);
  }
  return transformations;
}

function detectStringConcat(code: string): string {
  let result = code;
  result = result.replace(/['"]\s*\+\s*['"]/g, "");
  return result;
}

function tryParseJsonStrings(code: string): { output: string; count: number } {
  const largeStringMatch = code.match(/['"]([^'"]{100,})['"]/);
  if (largeStringMatch) {
    try {
      const parsed = JSON.parse(largeStringMatch[1]);
      if (typeof parsed === "string") {
        return { output: parsed, count: 1 };
      }
    } catch {}
  }
  return { output: code, count: 0 };
}

export function deobfuscateJavaScript(code: string): DeobfuscationResult {
  const transformations: string[] = [];
  let result = code;

  const evalInfo = detectEvalUsage(result);
  transformations.push(...evalInfo);

  if (hexRegex.test(result)) {
    result = decodeHex(result);
    transformations.push("Decoded hex escape sequences (\\xNN)");
  }

  if (unicodeRegex.test(result)) {
    result = decodeUnicode(result);
    transformations.push("Decoded unicode escape sequences (\\uNNNN)");
  }

  const base64Result = decodeBase64EncodedStrings(result);
  if (base64Result !== result) {
    result = base64Result;
    transformations.push("Decoded Base64 encoded strings");
  }

  result = detectStringConcat(result);

  const jsonResult = tryParseJsonStrings(result);
  if (jsonResult.count > 0) {
    result = jsonResult.output;
    transformations.push("Extracted JSON-encoded string");
  }

  return {
    success: true,
    output: result,
    transformations,
  };
}

export function detectAndDeobfuscate(code: string, languageId: string): DeobfuscationResult {
  switch (languageId) {
    case "javascript":
    case "typescript":
      return deobfuscateJavaScript(code);
    default:
      return {
        success: true,
        output: code,
        transformations: ["No deobfuscation available for this language"],
      };
  }
}
