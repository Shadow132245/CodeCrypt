export interface LanguageInfo {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  color: string;
  extensions: string[];
  canDeobfuscate: boolean;
  canFormat: boolean;
  description: string;
  descriptionAr: string;
}

export const languages: LanguageInfo[] = [
  {
    id: "javascript",
    name: "JavaScript",
    nameAr: "جافا سكريبت",
    icon: "📜",
    color: "#f7df1e",
    extensions: [".js", ".jsx", ".mjs", ".cjs"],
    canDeobfuscate: true,
    canFormat: true,
    description: "Deobfuscation, beautification & variable renaming",
    descriptionAr: "فك التشفير، التجميل وإعادة تسمية المتغيرات",
  },
  {
    id: "typescript",
    name: "TypeScript",
    nameAr: "تايب سكريبت",
    icon: "🔷",
    color: "#3178c6",
    extensions: [".ts", ".tsx"],
    canDeobfuscate: true,
    canFormat: true,
    description: "Deobfuscation, beautification & type recovery",
    descriptionAr: "فك التشفير، التجميل واستعادة الأنواع",
  },
  {
    id: "python",
    name: "Python",
    nameAr: "بايثون",
    icon: "🐍",
    color: "#3776ab",
    extensions: [".py", ".pyw", ".pyx"],
    canDeobfuscate: true,
    canFormat: true,
    description: "Pycdc decompilation & bytecode analysis",
    descriptionAr: "فك ترجمة البايت كود وتحليل البايت كود",
  },
  {
    id: "java",
    name: "Java",
    nameAr: "جافا",
    icon: "☕",
    color: "#b07219",
    extensions: [".java"],
    canDeobfuscate: false,
    canFormat: true,
    description: "Bytecode decompilation & code formatting",
    descriptionAr: "فك ترجمة البايت كود وتنسيق الكود",
  },
  {
    id: "csharp",
    name: "C#",
    nameAr: "سي شارب",
    icon: "💠",
    color: "#9b4f96",
    extensions: [".cs"],
    canDeobfuscate: false,
    canFormat: true,
    description: "IL decompilation & code formatting",
    descriptionAr: "فك ترجمة IL وتنسيق الكود",
  },
  {
    id: "cpp",
    name: "C/C++",
    nameAr: "سي/سي++",
    icon: "⚙️",
    color: "#00599c",
    extensions: [".c", ".cpp", ".h", ".hpp", ".cc", ".cxx"],
    canDeobfuscate: false,
    canFormat: true,
    description: "Assembly analysis & code formatting",
    descriptionAr: "تحليل التجميع وتنسيق الكود",
  },
  {
    id: "php",
    name: "PHP",
    nameAr: "بي إتش بي",
    icon: "🐘",
    color: "#777bb4",
    extensions: [".php", ".phtml"],
    canDeobfuscate: false,
    canFormat: true,
    description: "Deobfuscation & code formatting",
    descriptionAr: "فك التشفير وتنسيق الكود",
  },
  {
    id: "ruby",
    name: "Ruby",
    nameAr: "روبي",
    icon: "💎",
    color: "#cc342d",
    extensions: [".rb", ".ruby"],
    canDeobfuscate: false,
    canFormat: true,
    description: "Decompilation & code formatting",
    descriptionAr: "فك الترجمة وتنسيق الكود",
  },
  {
    id: "html",
    name: "HTML",
    nameAr: "إتش تي إم إل",
    icon: "🌐",
    color: "#e44d26",
    extensions: [".html", ".htm", ".xhtml"],
    canDeobfuscate: false,
    canFormat: true,
    description: "Beautification & tag normalization",
    descriptionAr: "التجميل وتطبيع الوسوم",
  },
  {
    id: "css",
    name: "CSS",
    nameAr: "سي إس إس",
    icon: "🎨",
    color: "#264de4",
    extensions: [".css", ".scss", ".sass", ".less"],
    canDeobfuscate: false,
    canFormat: true,
    description: "Beautification & minification reversal",
    descriptionAr: "التجميل وعكس التصغير",
  },
];

export function getLanguageById(id: string): LanguageInfo | undefined {
  return languages.find((l) => l.id === id);
}
