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

function hexEncode(str: string): string {
  return [...str].map((c) => "\\x" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
}

function unicodeEncode(str: string): string {
  return [...str].map((c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
}

function splitString(str: string): string {
  if (str.length < 4) return str;
  const parts: string[] = [];
  let i = 0;
  while (i < str.length) {
    const len = Math.min(Math.max(1, Math.floor(Math.random() * 5) + 1), str.length - i);
    parts.push(str.slice(i, i + len));
    i += len;
  }
  return parts.map((p) => JSON.stringify(p)).join(" + ");
}

function randomHex(min: number, max: number): string {
  return "0x" + (Math.floor(Math.random() * (max - min + 1)) + min).toString(16);
}

const stringLiteral = /(['"`])(?:(?!\1|\\)[\s\S])*?\1/g;
const doubleString = /(["'])(?:(?!\1|\\)[\s\S])*?\1/g;

function transformStrings(code: string, fn: (s: string) => string): string {
  return code.replace(stringLiteral, (m, q, content) => q + fn(content) + q);
}

function encodeNumbersAsHex(code: string): string {
  return code.replace(/\b(\d+)\b/g, (m) => {
    const n = parseInt(m, 10);
    if (n > 9 && n < 100000) return "0x" + n.toString(16);
    return m;
  });
}

function decodeHexNumbers(code: string): string {
  return code.replace(/0x([0-9a-fA-F]+)\b/g, (_, h) => parseInt(h, 16).toString());
}

// ============== JavaScript / TypeScript ==============

export const javascriptEncryptors: EncryptorMode[] = [
  {
    id: "hex-strings",
    name: "Hex String Encoding",
    nameAr: "ترميز النصوص الست عشري",
    description: "Encodes all string contents as hex escape sequences (\\xNN)",
    descriptionAr: "يشفر كل محتويات النصوص إلى تسلسلات هكس (\\xNN)",
    icon: "🔢",
    encrypt: (code) => transformStrings(code, hexEncode),
    decrypt: (code) =>
      code.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  },
  {
    id: "unicode-strings",
    name: "Unicode String Encoding",
    nameAr: "ترميز النصوص اليونيكود",
    description: "Encodes all string contents as unicode escape sequences (\\uNNNN)",
    descriptionAr: "يشفر كل محتويات النصوص إلى تسلسلات يونيكود (\\uNNNN)",
    icon: "🌐",
    encrypt: (code) => transformStrings(code, unicodeEncode),
    decrypt: (code) =>
      code.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  },
  {
    id: "base64-strings",
    name: "Base64 String Encoding",
    nameAr: "ترميز النصوص بـ Base64",
    description: "Encodes string literals as Base64 with atob() decoder",
    descriptionAr: "يشفر النصوص النصية إلى Base64 مع مفكك atob()",
    icon: "🔐",
    encrypt: (code) =>
      code.replace(doubleString, (m, q, content) => {
        const encoded = btoa(unescape(encodeURIComponent(content)));
        return `atob(${q}${encoded}${q})`;
      }),
    decrypt: (code) =>
      code.replace(/atob\s*\(\s*(["'])([A-Za-z0-9+/=]+)\1\s*\)/g, (_, q, b64) => {
        try {
          return q + decodeURIComponent(escape(atob(b64))) + q;
        } catch {
          return _;
        }
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
      code.replace(doubleString, (m, q, content) => q + splitString(content) + q),
    decrypt: (code) =>
      code.replace(/(["'])\s*\+\s*(["'])/g, (_) => ""),
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
  {
    id: "array-shuffle",
    name: "Array Shuffle Obfuscation",
    nameAr: "تشفير خلط المصفوفة",
    description: "Extracts strings into a shuffled array with index-based access",
    descriptionAr: "يستخرج النصوص إلى مصفوفة مخلوطة مع وصول بالمؤشر",
    icon: "🔀",
    encrypt: (code) => {
      const strings: string[] = [];
      let firstQuote = "'";
      const cleaned = code.replace(doubleString, (m, q, content) => {
        strings.push(content);
        firstQuote = q;
        return "__S" + (strings.length - 1) + "__";
      });
      if (strings.length === 0) return code;
      const q = firstQuote;
      const arrContent = strings
        .map((s) => q + s + q)
        .join(", ");
      const arrVar = "_0x" + Math.random().toString(36).slice(2, 8);
      const idxVar = "_0x" + Math.random().toString(36).slice(2, 8);
      const shiftVar = "_0x" + Math.random().toString(36).slice(2, 8);
      const shuffleCode =
        "(function(" + arrVar + ", " + idxVar + ") {\n" +
        "  var " + shiftVar + " = function(" + idxVar + ") {\n" +
        "    while (--" + idxVar + ") " + arrVar + ".push(" + arrVar + ".shift());\n" +
        "  };\n" +
        "  " + shiftVar + "(++" + idxVar + ");\n" +
        "}([" + arrContent + "], " + randomHex(1, 50) + "));\n" +
        "var " + idxVar + " = function(" + arrVar + ", " + shiftVar + ") {\n" +
        "  " + arrVar + " = " + arrVar + " - 0;\n" +
        "  return " + arrVar + "[" + arrVar + "];\n" +
        "};";
      return shuffleCode + "\n" + cleaned.replace(/__S(\d+)__/g, function(_, n) {
        return idxVar + "(" + q + "0x" + parseInt(n).toString(16) + q + ")";
      });
    },
    decrypt: (code) => {
      let result = code;
      result = result.replace(/\(function\(.*?\)\s*\{[\s\S]*?\}\s*\]\(.*?\)\s*\);\s*/g, "");
      result = result.replace(/var\s+\w+\s*=\s*function\(.*?\)\s*\{[\s\S]*?\}\s*;\s*/g, "");
      result = result.replace(/\w+\(['"]0x([0-9a-f]+)['"]\)/g, function(_, h) {
        return "/* arr[" + parseInt(h, 16) + "] */";
      });
      return result;
    },
  },
];

// ============== Python ==============

export const pythonEncryptors: EncryptorMode[] = [
  {
    id: "hex-strings",
    name: "Hex String Encoding",
    nameAr: "ترميز النصوص الست عشري",
    description: "Encodes all string contents as hex escape sequences (\\xNN)",
    descriptionAr: "يشفر كل محتويات النصوص إلى تسلسلات هكس (\\xNN)",
    icon: "🔢",
    encrypt: (code) => transformStrings(code, hexEncode),
    decrypt: (code) =>
      code.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  },
  {
    id: "unicode-strings",
    name: "Unicode String Encoding",
    nameAr: "ترميز النصوص اليونيكود",
    description: "Encodes string contents as unicode escape sequences (\\uNNNN)",
    descriptionAr: "يشفر محتويات النصوص إلى تسلسلات يونيكود (\\uNNNN)",
    icon: "🌐",
    encrypt: (code) => transformStrings(code, unicodeEncode),
    decrypt: (code) =>
      code.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  },
  {
    id: "base64-strings",
    name: "Base64 String Encoding",
    nameAr: "ترميز النصوص بـ Base64",
    description: "Encodes string literals as Base64 with b64decode() wrapper",
    descriptionAr: "يشفر النصوص النصية إلى Base64 مع غلاف b64decode()",
    icon: "🔐",
    encrypt: (code) =>
      code.replace(doubleString, (m, q, content) => {
        const encoded = btoa(unescape(encodeURIComponent(content)));
        return `__import__('base64').b64decode('${encoded}').decode()`;
      }),
    decrypt: (code) =>
      code.replace(
        /__import__\('base64'\)\.b64decode\('([A-Za-z0-9+/=]+)'\)\.decode\(\)/g,
        (_, b64) => {
          try {
            const decoded = decodeURIComponent(escape(atob(b64)));
            return `'${decoded}'`;
          } catch {
            return _;
          }
        }
      ),
  },
  {
    id: "string-split",
    name: "String Concatenation Split",
    nameAr: "تقسيم النصوص بالتسلسل",
    description: "Splits string literals into concatenated chunks",
    descriptionAr: "يقسم النصوص النصية إلى أجزاء متسلسلة",
    icon: "✂️",
    encrypt: (code) =>
      code.replace(doubleString, (m, q, content) => q + splitString(content) + q),
    decrypt: (code) =>
      code.replace(/(["'])\s*\+\s*(["'])/g, ""),
  },
  {
    id: "xor-cipher",
    name: "XOR Byte Cipher",
    nameAr: "تشفير XOR",
    description: "XOR-encodes byte strings with a random key (reversible)",
    descriptionAr: "يشفر سلاسل البايت بـ XOR مع مفتاح عشوائي (قابل للعكس)",
    icon: "🔑",
    encrypt: (code) => {
      const key = Math.floor(Math.random() * 255) + 1;
      const encoded = [...code].map((c) => "\\x" + (c.charCodeAt(0) ^ key).toString(16).padStart(2, "0")).join("");
      const header = "# XOR key: " + key + "\n";
      const wrapper = "(lambda _: ''.join(chr(ord(c) ^ " + key + ") for c in _))('" + encoded + "')";
      return header + wrapper;
    },
    decrypt: (code) => {
      const keyMatch = code.match(/XOR key:\s*(\d+)/);
      if (!keyMatch) return code;
      const key = parseInt(keyMatch[1], 10);
      const strMatch = code.match(/chr\(ord\(c\)\s*\^\s*\d+\)\s*for\s+c\s+in\s+_\s*\)\s*\(\s*'((?:\\x[0-9a-fA-F]{2}|[^'])*)'\s*\)/);
      if (strMatch) {
        const decoded = strMatch[1].replace(/\\x([0-9a-fA-F]{2})/g, (_, h) =>
          String.fromCharCode(parseInt(h, 16) ^ key)
        );
        return decoded;
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
    encrypt: (code) => transformStrings(code, unicodeEncode),
    decrypt: (code) =>
      code.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  },
  {
    id: "string-split",
    name: "String Concatenation Split",
    nameAr: "تقسيم النصوص بالتسلسل",
    description: "Splits string literals into concatenated chunks",
    descriptionAr: "يقسم النصوص النصية إلى أجزاء متسلسلة",
    icon: "✂️",
    encrypt: (code) =>
      code.replace(doubleString, (m, q, content) => q + splitString(content) + q),
    decrypt: (code) =>
      code.replace(/(["'])\s*\+\s*(["'])/g, ""),
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
    encrypt: (code) => transformStrings(code, unicodeEncode),
    decrypt: (code) =>
      code.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  },
  {
    id: "string-split",
    name: "String Concatenation Split",
    nameAr: "تقسيم النصوص بالتسلسل",
    description: "Splits string literals into concatenated chunks",
    descriptionAr: "يقسم النصوص النصية إلى أجزاء متسلسلة",
    icon: "✂️",
    encrypt: (code) =>
      code.replace(doubleString, (m, q, content) => q + splitString(content) + q),
    decrypt: (code) =>
      code.replace(/(["'])\s*\+\s*(["'])/g, ""),
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
    encrypt: (code) => transformStrings(code, hexEncode),
    decrypt: (code) =>
      code.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  },
  {
    id: "unicode-strings",
    name: "Unicode String Encoding",
    nameAr: "ترميز النصوص اليونيكود",
    description: "Encodes string contents as unicode escape sequences (\\uNNNN)",
    descriptionAr: "يشفر محتويات النصوص إلى تسلسلات يونيكود (\\uNNNN)",
    icon: "🌐",
    encrypt: (code) => transformStrings(code, unicodeEncode),
    decrypt: (code) =>
      code.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  },
  {
    id: "string-split",
    name: "String Concatenation Split",
    nameAr: "تقسيم النصوص بالتسلسل",
    description: "Splits string literals into concatenated chunks",
    descriptionAr: "يقسم النصوص النصية إلى أجزاء متسلسلة",
    icon: "✂️",
    encrypt: (code) =>
      code.replace(doubleString, (m, q, content) => q + splitString(content) + q),
    decrypt: (code) =>
      code.replace(/(["'])\s*\+\s*(["'])/g, ""),
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
    encrypt: (code) => transformStrings(code, hexEncode),
    decrypt: (code) =>
      code.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  },
  {
    id: "string-split",
    name: "String Concatenation Split",
    nameAr: "تقسيم النصوص بالتسلسل",
    description: "Splits string literals into concatenated chunks",
    descriptionAr: "يقسم النصوص النصية إلى أجزاء متسلسلة",
    icon: "✂️",
    encrypt: (code) =>
      code.replace(doubleString, (m, q, content) => q + splitString(content) + q),
    decrypt: (code) =>
      code.replace(/(["'])\s*\.\s*(["'])/g, ""),
  },
  {
    id: "base64-strings",
    name: "Base64 String Encoding",
    nameAr: "ترميز النصوص بـ Base64",
    description: "Encodes string literals as Base64 with base64_decode() wrapper",
    descriptionAr: "يشفر النصوص النصية إلى Base64 مع غلاف base64_decode()",
    icon: "🔐",
    encrypt: (code) =>
      code.replace(doubleString, (m, q, content) => {
        const encoded = btoa(unescape(encodeURIComponent(content)));
        return `base64_decode('${encoded}')`;
      }),
    decrypt: (code) =>
      code.replace(/base64_decode\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/g, (_, b64) => {
        try {
          const decoded = decodeURIComponent(escape(atob(b64)));
          return `'${decoded}'`;
        } catch {
          return _;
        }
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
    encrypt: (code) => transformStrings(code, unicodeEncode),
    decrypt: (code) =>
      code.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  },
  {
    id: "string-split",
    name: "String Concatenation Split",
    nameAr: "تقسيم النصوص بالتسلسل",
    description: "Splits string literals into concatenated chunks",
    descriptionAr: "يقسم النصوص النصية إلى أجزاء متسلسلة",
    icon: "✂️",
    encrypt: (code) =>
      code.replace(doubleString, (m, q, content) => q + splitString(content) + q),
    decrypt: (code) =>
      code.replace(/(["'])\s*\+\s*(["'])/g, ""),
  },
  {
    id: "base64-strings",
    name: "Base64 String Encoding",
    nameAr: "ترميز النصوص بـ Base64",
    description: "Encodes string literals as Base64 with Base64.decode64() wrapper",
    descriptionAr: "يشفر النصوص النصية إلى Base64 مع غلاف Base64.decode64()",
    icon: "🔐",
    encrypt: (code) =>
      code.replace(doubleString, (m, q, content) => {
        const encoded = btoa(unescape(encodeURIComponent(content)));
        return `Base64.decode64('${encoded}')`;
      }),
    decrypt: (code) =>
      code.replace(/Base64\.decode64\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/g, (_, b64) => {
        try {
          const decoded = decodeURIComponent(escape(atob(b64)));
          return `'${decoded}'`;
        } catch {
          return _;
        }
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
          "<": "&lt;",
          ">": "&gt;",
          "&": "&amp;",
          '"': "&quot;",
          "'": "&#39;",
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
        red: "#ff0000",
        blue: "#0000ff",
        green: "#008000",
        yellow: "#ffff00",
        white: "#ffffff",
        black: "#000000",
        purple: "#800080",
        orange: "#ffa500",
        pink: "#ffc0cb",
        brown: "#a52a2a",
        gray: "#808080",
        grey: "#808080",
        navy: "#000080",
        teal: "#008080",
        aqua: "#00ffff",
        lime: "#00ff00",
        fuchsia: "#ff00ff",
        silver: "#c0c0c0",
        maroon: "#800000",
        olive: "#808000",
      };
      return code.replace(/\b(color|background-color|border-color|background)\s*:\s*([a-z]+)\b/gi, (m, prop, color) => {
        const lower = color.toLowerCase();
        if (colorMap[lower]) return `${prop}: ${colorMap[lower]}`;
        return m;
      });
    },
    decrypt: (code) => {
      const reverseMap: Record<string, string> = {
        "#ff0000": "red",
        "#0000ff": "blue",
        "#008000": "green",
        "#ffff00": "yellow",
        "#ffffff": "white",
        "#000000": "black",
        "#800080": "purple",
        "#ffa500": "orange",
        "#ffc0cb": "pink",
        "#a52a2a": "brown",
        "#808080": "gray",
        "#000080": "navy",
        "#008080": "teal",
        "#00ffff": "aqua",
        "#00ff00": "lime",
        "#ff00ff": "fuchsia",
        "#c0c0c0": "silver",
        "#800000": "maroon",
        "#808000": "olive",
      };
      return code.replace(/(color|background-color|border-color|background)\s*:\s*(#[0-9a-fA-F]{6})\b/gi, (m, prop, hex) => {
        const lower = hex.toLowerCase();
        if (reverseMap[lower]) return `${prop}: ${reverseMap[lower]}`;
        return m;
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
