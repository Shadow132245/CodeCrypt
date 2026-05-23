export interface EncryptorMode {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  encrypt: (code: string) => string;
  decrypt: (code: string) => string;
}

// Regexes for string literals - language-aware
const anyString = /(['"`])(?:(?!\1|\\)[\s\S])*?\1/g;
const doubleQuote = /(["'])(?:(?!\1|\\)[\s\S])*?\1/g;

function hexEncode(str: string): string {
  return [...str].map((c) => "\\x" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
}

function unicodeEncode(str: string): string {
  return [...str].map((c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
}

function hexDecode(code: string): string {
  return code.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function unicodeDecode(code: string): string {
  return code.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function splitString(str: string): string {
  if (str.length < 4) return JSON.stringify(str);
  const parts: string[] = [];
  let i = 0;
  while (i < str.length) {
    const len = Math.min(Math.max(1, Math.floor(Math.random() * 5) + 1), str.length - i);
    parts.push(JSON.stringify(str.slice(i, i + len)));
    i += len;
  }
  return parts.join(" + ");
}

function collapseConcat(code: string, op: string): string {
  const concat = new RegExp(
    '(["\'])((?:(?!\\1|\\\\)[\\s\\S])*?)\\1\\s*\\' + op + '\\s*(["\'])((?:(?!\\3|\\\\)[\\s\\S])*?)\\3',
    "g"
  );
  let prev = "";
  let result = code;
  while (result !== prev) {
    prev = result;
    result = result.replace(concat, (_, q1, s1, q2, s2) => {
      if (q1 === q2) return q1 + s1 + s2 + q1;
      return _;
    });
  }
  return result;
}

function randomHex(min: number, max: number): string {
  return "0x" + (Math.floor(Math.random() * (max - min + 1)) + min).toString(16);
}

function encodeNumbersAsHex(code: string): string {
  return code.replace(/\b(\d+)\b/g, (m) => {
    const n = parseInt(m, 10);
    if (n > 9 && n < 100000 && !code.slice(code.indexOf(m) - 2, code.indexOf(m)).startsWith("0x")) return "0x" + n.toString(16);
    return m;
  });
}

function decodeHexNumbers(code: string): string {
  return code.replace(/\b0x([0-9a-fA-F]+)\b/g, (_, h) => {
    try { return parseInt(h, 16).toString(); } catch { return _; }
  });
}

// Shared helpers for common patterns
const jsDecrypt = (code: string) => {
  let r = hexDecode(code);
  r = unicodeDecode(r);
  r = collapseConcat(r, "+");
  return r;
};

// ============== JS/TS ==============
export const javascriptEncryptors: EncryptorMode[] = [
  {
    id: "hex-strings",
    name: "Hex String Encoding",
    nameAr: "ترميز النصوص الست عشري",
    description: "Encodes string contents as hex escape sequences (\\xNN)",
    descriptionAr: "يشفر محتويات النصوص إلى تسلسلات هكس (\\xNN)",
    icon: "🔢",
    encrypt: (code) => code.replace(doubleQuote, (m, q, content) => q + hexEncode(content) + q),
    decrypt: hexDecode,
  },
  {
    id: "unicode-strings",
    name: "Unicode String Encoding",
    nameAr: "ترميز النصوص اليونيكود",
    description: "Encodes string contents as unicode escape sequences (\\uNNNN)",
    descriptionAr: "يشفر محتويات النصوص إلى تسلسلات يونيكود (\\uNNNN)",
    icon: "🌐",
    encrypt: (code) => code.replace(doubleQuote, (m, q, content) => q + unicodeEncode(content) + q),
    decrypt: unicodeDecode,
  },
  {
    id: "base64-strings",
    name: "Base64 String Encoding",
    nameAr: "ترميز النصوص بـ Base64",
    description: "Encodes string literals as Base64 with atob() decoder",
    descriptionAr: "يشفر النصوص النصية إلى Base64 مع مفكك atob()",
    icon: "🔐",
    encrypt: (code) =>
      code.replace(doubleQuote, (m, q, content) => {
        try {
          const encoded = btoa(unescape(encodeURIComponent(content)));
          return "atob(" + q + encoded + q + ")";
        } catch { return m; }
      }),
    decrypt: (code) =>
      code.replace(/atob\s*\(\s*(["'])([A-Za-z0-9+/=]+)\1\s*\)/g, (_, q, b64) => {
        try { return q + decodeURIComponent(escape(atob(b64))) + q; }
        catch { return _; }
      }),
  },
  {
    id: "string-split",
    name: "String Concatenation Split",
    nameAr: "تقسيم النصوص بالتسلسل",
    description: "Splits string literals into randomly sized concatenated chunks",
    descriptionAr: "يقسم النصوص النصية إلى أجزاء متسلسلة عشوائية الحجم",
    icon: "✂️",
    encrypt: (code) =>
      code.replace(doubleQuote, (m, q, content) => splitString(content)),
    decrypt: (code) => collapseConcat(code, "+"),
  },
  {
    id: "number-radix",
    name: "Number Base Encoding",
    nameAr: "ترميز قاعدة الأرقام",
    description: "Converts decimal numbers to hexadecimal representation",
    descriptionAr: "يحول الأرقام العشرية إلى تمثيل ست عشري",
    icon: "🔢",
    encrypt: encodeNumbersAsHex,
    decrypt: decodeHexNumbers,
  },
];

// ============== Python ==============
export const pythonEncryptors: EncryptorMode[] = [
  {
    id: "hex-strings",
    name: "Hex String Encoding",
    nameAr: "ترميز النصوص الست عشري",
    description: "Encodes string contents as hex escape sequences (\\xNN)",
    descriptionAr: "يشفر محتويات النصوص إلى تسلسلات هكس (\\xNN)",
    icon: "🔢",
    encrypt: (code) => code.replace(doubleQuote, (m, q, content) => q + hexEncode(content) + q),
    decrypt: hexDecode,
  },
  {
    id: "unicode-strings",
    name: "Unicode String Encoding",
    nameAr: "ترميز النصوص اليونيكود",
    description: "Encodes string contents as unicode escape sequences (\\uNNNN)",
    descriptionAr: "يشفر محتويات النصوص إلى تسلسلات يونيكود (\\uNNNN)",
    icon: "🌐",
    encrypt: (code) => code.replace(doubleQuote, (m, q, content) => q + unicodeEncode(content) + q),
    decrypt: unicodeDecode,
  },
  {
    id: "base64-strings",
    name: "Base64 String Encoding",
    nameAr: "ترميز النصوص بـ Base64",
    description: "Encodes string literals as Base64 with b64decode() wrapper",
    descriptionAr: "يشفر النصوص النصية إلى Base64 مع غلاف b64decode()",
    icon: "🔐",
    encrypt: (code) =>
      code.replace(doubleQuote, (m, q, content) => {
        try {
          const encoded = btoa(unescape(encodeURIComponent(content)));
          return "__import__('base64').b64decode('" + encoded + "').decode()";
        } catch { return m; }
      }),
    decrypt: (code) =>
      code.replace(/__import__\('base64'\)\.b64decode\('([A-Za-z0-9+/=]+)'\)\.decode\(\)/g, (_, b64) => {
        try { return "'" + decodeURIComponent(escape(atob(b64))) + "'"; }
        catch { return _; }
      }),
  },
  {
    id: "string-split",
    name: "String Concatenation Split",
    nameAr: "تقسيم النصوص بالتسلسل",
    description: "Splits string literals into concatenated chunks",
    descriptionAr: "يقسم النصوص النصية إلى أجزاء متسلسلة",
    icon: "✂️",
    encrypt: (code) =>
      code.replace(doubleQuote, (m, q, content) => splitString(content)),
    decrypt: (code) => collapseConcat(code, "+"),
  },
  {
    id: "xor-cipher",
    name: "XOR Byte Cipher",
    nameAr: "تشفير XOR",
    description: "XOR-encodes the entire code with a random key (reversible)",
    descriptionAr: "يشفر الكود بالكامل بـ XOR مع مفتاح عشوائي (قابل للعكس)",
    icon: "🔑",
    encrypt: (code) => {
      const key = Math.floor(Math.random() * 254) + 1;
      const encoded = [...code].map((c) => "\\x" + (c.charCodeAt(0) ^ key).toString(16).padStart(2, "0")).join("");
      const header = "# XOR key: " + key + "\n";
      const payload = "(lambda _: ''.join(chr(ord(c) ^ " + key + ") for c in _))('" + encoded + "')";
      return header + payload;
    },
    decrypt: (code) => {
      const keyMatch = code.match(/XOR key:\s*(\d+)/);
      if (!keyMatch) return code;
      const key = parseInt(keyMatch[1], 10);
      const strMatch = code.match(
        /chr\(ord\(c\)\s*\^\s*\d+\)\s*for\s+c\s+in\s+_\s*\)\)\s*\(\s*'((?:\\x[0-9a-fA-F]{2}|[^'])*)'\s*\)/
      );
      if (strMatch) {
        return strMatch[1].replace(/\\x([0-9a-fA-F]{2})/g, (_, h) =>
          String.fromCharCode(parseInt(h, 16) ^ key)
        );
      }
      // Fallback: try simpler pattern
      const simpleMatch = code.match(/\(\s*'((?:\\x[0-9a-fA-F]{2}|[^'])+)'\s*\)\s*$/);
      if (simpleMatch) {
        return simpleMatch[1].replace(/\\x([0-9a-fA-F]{2})/g, (_, h) =>
          String.fromCharCode(parseInt(h, 16) ^ key)
        );
      }
      return code;
    },
  },
];

// ============== Java ==============
export const javaEncryptors: EncryptorMode[] = [
  {
    id: "unicode-strings",
    name: "Unicode String Encoding",
    nameAr: "ترميز النصوص اليونيكود",
    description: "Encodes string contents as unicode escape sequences",
    descriptionAr: "يشفر محتويات النصوص إلى تسلسلات يونيكود",
    icon: "🌐",
    encrypt: (code) => code.replace(doubleQuote, (m, q, content) => q + unicodeEncode(content) + q),
    decrypt: unicodeDecode,
  },
  {
    id: "string-split",
    name: "String Concatenation Split",
    nameAr: "تقسيم النصوص بالتسلسل",
    description: "Splits string literals into concatenated chunks",
    descriptionAr: "يقسم النصوص النصية إلى أجزاء متسلسلة",
    icon: "✂️",
    encrypt: (code) =>
      code.replace(doubleQuote, (m, q, content) => splitString(content)),
    decrypt: (code) => collapseConcat(code, "+"),
  },
  {
    id: "number-radix",
    name: "Number Base Encoding",
    nameAr: "ترميز قاعدة الأرقام",
    description: "Converts decimal numbers to hexadecimal",
    descriptionAr: "يحول الأرقام العشرية إلى ست عشري",
    icon: "🔢",
    encrypt: encodeNumbersAsHex,
    decrypt: decodeHexNumbers,
  },
];

// ============== C# ==============
export const csharpEncryptors: EncryptorMode[] = [
  {
    id: "unicode-strings",
    name: "Unicode String Encoding",
    nameAr: "ترميز النصوص اليونيكود",
    description: "Encodes string contents as unicode escape sequences",
    descriptionAr: "يشفر محتويات النصوص إلى تسلسلات يونيكود",
    icon: "🌐",
    encrypt: (code) => code.replace(doubleQuote, (m, q, content) => q + unicodeEncode(content) + q),
    decrypt: unicodeDecode,
  },
  {
    id: "string-split",
    name: "String Concatenation Split",
    nameAr: "تقسيم النصوص بالتسلسل",
    description: "Splits string literals into concatenated chunks",
    descriptionAr: "يقسم النصوص النصية إلى أجزاء متسلسلة",
    icon: "✂️",
    encrypt: (code) =>
      code.replace(doubleQuote, (m, q, content) => splitString(content)),
    decrypt: (code) => collapseConcat(code, "+"),
  },
  {
    id: "number-radix",
    name: "Number Base Encoding",
    nameAr: "ترميز قاعدة الأرقام",
    description: "Converts decimal numbers to hexadecimal",
    descriptionAr: "يحول الأرقام العشرية إلى ست عشري",
    icon: "🔢",
    encrypt: encodeNumbersAsHex,
    decrypt: decodeHexNumbers,
  },
];

// ============== C/C++ ==============
export const cppEncryptors: EncryptorMode[] = [
  {
    id: "hex-strings",
    name: "Hex String Encoding",
    nameAr: "ترميز النصوص الست عشري",
    description: "Encodes string contents as hex escape sequences (\\xNN)",
    descriptionAr: "يشفر محتويات النصوص إلى تسلسلات هكس (\\xNN)",
    icon: "🔢",
    encrypt: (code) => code.replace(doubleQuote, (m, q, content) => q + hexEncode(content) + q),
    decrypt: hexDecode,
  },
  {
    id: "unicode-strings",
    name: "Unicode String Encoding",
    nameAr: "ترميز النصوص اليونيكود",
    description: "Encodes string contents as unicode escape sequences (\\uNNNN)",
    descriptionAr: "يشفر محتويات النصوص إلى تسلسلات يونيكود (\\uNNNN)",
    icon: "🌐",
    encrypt: (code) => code.replace(doubleQuote, (m, q, content) => q + unicodeEncode(content) + q),
    decrypt: unicodeDecode,
  },
  {
    id: "string-split",
    name: "String Concatenation Split",
    nameAr: "تقسيم النصوص بالتسلسل",
    description: "Splits string literals into concatenated chunks",
    descriptionAr: "يقسم النصوص النصية إلى أجزاء متسلسلة",
    icon: "✂️",
    encrypt: (code) =>
      code.replace(doubleQuote, (m, q, content) => splitString(content)),
    decrypt: (code) => collapseConcat(code, "+"),
  },
];

// ============== PHP ==============
export const phpEncryptors: EncryptorMode[] = [
  {
    id: "hex-strings",
    name: "Hex String Encoding",
    nameAr: "ترميز النصوص الست عشري",
    description: "Encodes string contents as hex escape sequences",
    descriptionAr: "يشفر محتويات النصوص إلى تسلسلات هكس",
    icon: "🔢",
    encrypt: (code) => code.replace(doubleQuote, (m, q, content) => q + hexEncode(content) + q),
    decrypt: hexDecode,
  },
  {
    id: "string-split",
    name: "String Concatenation Split",
    nameAr: "تقسيم النصوص بالتسلسل",
    description: "Splits string literals into concatenated chunks",
    descriptionAr: "يقسم النصوص النصية إلى أجزاء متسلسلة",
    icon: "✂️",
    encrypt: (code) =>
      code.replace(doubleQuote, (m, q, content) => splitString(content)),
    decrypt: (code) => collapseConcat(code, "."),
  },
  {
    id: "base64-strings",
    name: "Base64 String Encoding",
    nameAr: "ترميز النصوص بـ Base64",
    description: "Encodes string literals as Base64 with base64_decode() wrapper",
    descriptionAr: "يشفر النصوص النصية إلى Base64 مع غلاف base64_decode()",
    icon: "🔐",
    encrypt: (code) =>
      code.replace(doubleQuote, (m, q, content) => {
        try {
          const encoded = btoa(unescape(encodeURIComponent(content)));
          return "base64_decode('" + encoded + "')";
        } catch { return m; }
      }),
    decrypt: (code) =>
      code.replace(/base64_decode\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/g, (_, b64) => {
        try { return "'" + decodeURIComponent(escape(atob(b64))) + "'"; }
        catch { return _; }
      }),
  },
];

// ============== Ruby ==============
export const rubyEncryptors: EncryptorMode[] = [
  {
    id: "unicode-strings",
    name: "Unicode String Encoding",
    nameAr: "ترميز النصوص اليونيكود",
    description: "Encodes string contents as unicode escape sequences",
    descriptionAr: "يشفر محتويات النصوص إلى تسلسلات يونيكود",
    icon: "🌐",
    encrypt: (code) => code.replace(doubleQuote, (m, q, content) => q + unicodeEncode(content) + q),
    decrypt: unicodeDecode,
  },
  {
    id: "string-split",
    name: "String Concatenation Split",
    nameAr: "تقسيم النصوص بالتسلسل",
    description: "Splits string literals into concatenated chunks",
    descriptionAr: "يقسم النصوص النصية إلى أجزاء متسلسلة",
    icon: "✂️",
    encrypt: (code) =>
      code.replace(doubleQuote, (m, q, content) => splitString(content)),
    decrypt: (code) => collapseConcat(code, "+"),
  },
  {
    id: "base64-strings",
    name: "Base64 String Encoding",
    nameAr: "ترميز النصوص بـ Base64",
    description: "Encodes string literals as Base64 with Base64.decode64() wrapper",
    descriptionAr: "يشفر النصوص النصية إلى Base64 مع غلاف Base64.decode64()",
    icon: "🔐",
    encrypt: (code) =>
      code.replace(doubleQuote, (m, q, content) => {
        try {
          const encoded = btoa(unescape(encodeURIComponent(content)));
          return "Base64.decode64('" + encoded + "')";
        } catch { return m; }
      }),
    decrypt: (code) =>
      code.replace(/Base64\.decode64\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/g, (_, b64) => {
        try { return "'" + decodeURIComponent(escape(atob(b64))) + "'"; }
        catch { return _; }
      }),
  },
];

// ============== HTML ==============
export const htmlEncryptors: EncryptorMode[] = [
  {
    id: "entity-encode",
    name: "HTML Entity Encoding",
    nameAr: "ترميز كيانات HTML",
    description: "Encodes special HTML characters as named/hex entities",
    descriptionAr: "يشفر أحرف HTML الخاصة ككيانات مسماة/ست عشرية",
    icon: "🏷️",
    encrypt: (code) =>
      code.replace(/[<>&"']/g, (c) => {
        const entities: Record<string, string> = {
          "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;",
        };
        return entities[c] || c;
      }),
    decrypt: (code) =>
      code
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10))),
  },
  {
    id: "hex-encode-text",
    name: "Hex Text Encoding",
    nameAr: "ترميز النصوص الست عشري",
    description: "Encodes text content between tags as hex entities",
    descriptionAr: "يشفر محتوى النص بين الوسوم ككيانات ست عشرية",
    icon: "🔢",
    encrypt: (code) =>
      code.replace(/>([^<]+)</g, (m, text) => {
        const encoded = [...text]
          .map((c) => "&#x" + c.charCodeAt(0).toString(16) + ";")
          .join("");
        return ">" + encoded + "<";
      }),
    decrypt: (code) =>
      code.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  },
];

// ============== CSS ==============
export const cssEncryptors: EncryptorMode[] = [
  {
    id: "unicode-idents",
    name: "Unicode Identifier Encoding",
    nameAr: "ترميز المعرفات باليونيكود",
    description: "Encodes CSS identifier names as unicode escape sequences",
    descriptionAr: "يشفر أسماء المعرفات في CSS إلى تسلسلات يونيكود",
    icon: "🏷️",
    encrypt: (code) =>
      code.replace(/(\.|#)([a-zA-Z_][a-zA-Z0-9_-]*)/g, (m, prefix, name) => {
        const encoded = [...name]
          .map((c) => "\\" + c.charCodeAt(0).toString(16).padStart(2, "0") + " ")
          .join("");
        return prefix + encoded;
      }),
    decrypt: (code) =>
      code.replace(/\\([0-9a-fA-F]+)\s/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  },
  {
    id: "hex-colors",
    name: "Hex Color Conversion",
    nameAr: "تحويل الألوان إلى هكس",
    description: "Converts named CSS colors to their hex equivalents",
    descriptionAr: "يحول أسماء الألوان في CSS إلى ما يعادلها بالهكس",
    icon: "🎨",
    encrypt: (code) => {
      const colorMap: Record<string, string> = {
        red: "#ff0000", blue: "#0000ff", green: "#008000", yellow: "#ffff00",
        white: "#ffffff", black: "#000000", purple: "#800080", orange: "#ffa500",
        pink: "#ffc0cb", brown: "#a52a2a", gray: "#808080", navy: "#000080",
        teal: "#008080", aqua: "#00ffff", lime: "#00ff00", fuchsia: "#ff00ff",
        silver: "#c0c0c0", maroon: "#800000", olive: "#808000",
      };
      return code.replace(/\b(color|background-color|border-color|background)\s*:\s*([a-z]+)\b/gi, (m, prop, color) => {
        const lower = color.toLowerCase();
        return colorMap[lower] ? prop + ": " + colorMap[lower] : m;
      });
    },
    decrypt: (code) => {
      const reverseMap: Record<string, string> = {
        "#ff0000": "red", "#0000ff": "blue", "#008000": "green", "#ffff00": "yellow",
        "#ffffff": "white", "#000000": "black", "#800080": "purple", "#ffa500": "orange",
        "#ffc0cb": "pink", "#a52a2a": "brown", "#808080": "gray", "#000080": "navy",
        "#008080": "teal", "#00ffff": "aqua", "#00ff00": "lime", "#ff00ff": "fuchsia",
        "#c0c0c0": "silver", "#800000": "maroon", "#808000": "olive",
      };
      return code.replace(/(color|background-color|border-color|background)\s*:\s*(#[0-9a-fA-F]{6})\b/gi, (m, prop, hex) => {
        const lower = hex.toLowerCase();
        return reverseMap[lower] ? prop + ": " + reverseMap[lower] : m;
      });
    },
  },
];

// ============== Registry ==============
export const encryptorRegistry: Record<string, EncryptorMode[]> = {
  javascript: javascriptEncryptors,
  typescript: javascriptEncryptors,
  python: pythonEncryptors,
  java: javaEncryptors,
  csharp: csharpEncryptors,
  cpp: cppEncryptors,
  php: phpEncryptors,
  ruby: rubyEncryptors,
  html: htmlEncryptors,
  css: cssEncryptors,
};

export function getEncryptorsForLanguage(languageId: string): EncryptorMode[] {
  return encryptorRegistry[languageId] || [];
}

export function getEncryptorById(languageId: string, encryptorId: string): EncryptorMode | undefined {
  return getEncryptorsForLanguage(languageId).find((e) => e.id === encryptorId);
}
