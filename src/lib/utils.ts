export function formatCode(code: string, languageId: string): string {
  try {
    switch (languageId) {
      case "javascript":
      case "typescript":
        return formatJSOrTS(code);
      case "html":
        return formatHTML(code);
      case "css":
        return formatCSS(code);
      case "python":
        return formatPython(code);
      case "java":
      case "csharp":
      case "cpp":
      case "php":
      case "ruby":
        return formatGeneric(code);
      default:
        return code;
    }
  } catch {
    return code;
  }
}

function formatJSOrTS(code: string): string {
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  const lines = code.split("\n");
  const result: string[] = [];
  let indentLevel = 0;
  const indentStr = "  ";

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimRight();
    if (!trimmed.trim()) {
      result.push("");
      continue;
    }

    const stripped = trimmed.trimLeft();
    const closes = (stripped.match(/\}/g) || []).length;
    const opens = (stripped.match(/\{/g) || []).length;

    if (closes > opens) {
      indentLevel = Math.max(0, indentLevel - (closes - opens));
    }

    result.push(indentStr.repeat(indentLevel) + stripped);

    if (opens > closes) {
      indentLevel += opens - closes;
    }
  }

  return result.join("\n");
}

function formatHTML(code: string): string {
  const lines = code.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: string[] = [];
  let indentLevel = 0;
  const indentStr = "  ";
  const selfClosing = ["br", "hr", "img", "input", "meta", "link"];

  for (const line of lines) {
    const match = line.match(/<\/?(\w+)/);
    const tag = match ? match[1] : null;

    if (line.startsWith("</")) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    result.push(indentStr.repeat(indentLevel) + line);

    if (tag && !line.startsWith("</") && !line.endsWith("/>") && !selfClosing.includes(tag)) {
      indentLevel++;
    }
  }

  return result.join("\n");
}

function formatCSS(code: string): string {
  const lines = code.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: string[] = [];
  let indentLevel = 0;
  const indentStr = "  ";

  for (const line of lines) {
    if (line.startsWith("}")) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    result.push(indentStr.repeat(indentLevel) + line);

    if (line.includes("{") && !line.includes("}")) {
      indentLevel++;
    }
  }

  return result.join("\n");
}

function formatPython(code: string): string {
  const lines = code.split("\n");
  const result: string[] = [];
  let indentLevel = 0;
  const indentStr = "    ";

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      result.push("");
      continue;
    }

    const dedentWords = ["return", "break", "continue", "pass", "raise", "yield", "elif", "else", "finally", "except"];

    if (dedentWords.some((w) => trimmed.startsWith(w) && (trimmed.length === w.length || !/[a-zA-Z]/.test(trimmed[w.length])))) {
      const effective = Math.max(0, indentLevel - 1);
      result.push(indentStr.repeat(effective) + trimmed);
    } else if (trimmed === ")" || trimmed === "]" || trimmed === "}") {
      indentLevel = Math.max(0, indentLevel - 1);
      result.push(indentStr.repeat(indentLevel) + trimmed);
    } else {
      result.push(indentStr.repeat(indentLevel) + trimmed);
    }

    if (trimmed.endsWith(":") && !trimmed.includes("lambda")) {
      indentLevel++;
    }

    const openers = (trimmed.match(/[\(\[\{]/g) || []).length;
    const closers = (trimmed.match(/[\)\]\}]/g) || []).length;
    indentLevel += openers - closers;
  }

  return result.join("\n");
}

function formatGeneric(code: string): string {
  const lines = code.split("\n");
  const result: string[] = [];
  let indentLevel = 0;
  const indentStr = "  ";

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      result.push("");
      continue;
    }

    const openBraces = (trimmed.match(/\{/g) || []).length;
    const closeBraces = (trimmed.match(/\}/g) || []).length;

    if (closeBraces > openBraces) {
      indentLevel = Math.max(0, indentLevel - closeBraces);
    }

    result.push(indentStr.repeat(indentLevel) + trimmed);

    if (openBraces > closeBraces) {
      indentLevel += openBraces - closeBraces;
    }
  }

  return result.join("\n");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function countLines(code: string): number {
  return code.split("\n").length;
}

export function estimateComplexity(code: string, _languageId: string): number {
  const operators = (code.match(/[+\-*/%&|^~<>]=?/g) || []).length;
  const conditionals = (code.match(/\b(if|else|switch|case|for|while|do)\b/g) || []).length;
  const functions = (code.match(/\b(function|def)\b/g) || []).length;
  const ternaries = (code.match(/\?[^:]*:/g) || []).length;
  const loops = (code.match(/\b(for|while|do)\b/g) || []).length;

  let complexity = 1;
  complexity += operators * 0.5;
  complexity += conditionals * 2;
  complexity += functions * 3;
  complexity += ternaries * 1.5;
  complexity += loops * 2;

  return Math.round(complexity);
}
