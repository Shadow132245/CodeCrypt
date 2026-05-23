import { NextRequest, NextResponse } from "next/server";
import { detectLanguage } from "@/lib/detectors";
import { deobfuscateJavaScript } from "@/lib/deobfuscate";
import { getLanguageById } from "@/lib/languages";
import { getEncryptorById, getEncryptorsForLanguage } from "@/lib/encryptors";

const jsBeautify = require("js-beautify");

function beautify(code: string, language: string): string {
  try {
    switch (language) {
      case "javascript":
      case "typescript":
        return jsBeautify.js(code, {
          indent_size: 2,
          space_in_empty_paren: true,
        });
      case "html":
        return jsBeautify.html(code, {
          indent_size: 2,
          indent_inner_html: true,
        });
      case "css":
        return jsBeautify.css(code, { indent_size: 2 });
      default:
        return code;
    }
  } catch {
    return code;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, languageOverride, mode, algorithm } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    if (code.length > 500000) {
      return NextResponse.json(
        { error: "Code too large (max 500KB)" },
        { status: 413 }
      );
    }

    const detection = detectLanguage(code);
    const targetLanguage = languageOverride || detection.languageId;
    const transformations: string[] = [];
    let output = code;

    if (mode === "encrypt") {
      // Encryption mode
      const encryptor = algorithm
        ? getEncryptorById(targetLanguage, algorithm)
        : undefined;

      if (encryptor) {
        output = encryptor.encrypt(code);
        transformations.push(`Encrypted using ${encryptor.name}`);
      } else {
        transformations.push("No encryption algorithm selected");
      }
    } else {
      // Decrypt/deobfuscate mode
      if (targetLanguage === "javascript" || targetLanguage === "typescript") {
        const deobfResult = deobfuscateJavaScript(code);
        transformations.push(...deobfResult.transformations);
        output = deobfResult.output;
      }

      // Try all decrypt algorithms for the detected language
      const langAlgos = getEncryptorsForLanguage(targetLanguage);
      for (const algo of langAlgos) {
        try {
          const decrypted = algo.decrypt(output);
          if (decrypted !== output) {
            transformations.push(`Decrypted using ${algo.name}`);
            output = decrypted;
          }
        } catch {
          // skip if decrypt fails
        }
      }

      const formatted = beautify(output, targetLanguage);
      if (formatted !== output) {
        transformations.push(`Formatted code for ${targetLanguage}`);
        output = formatted;
      }
    }

    const langInfo = getLanguageById(targetLanguage);

    return NextResponse.json({
      detection,
      language: langInfo
        ? {
            id: langInfo.id,
            name: langInfo.name,
            icon: langInfo.icon,
            color: langInfo.color,
          }
        : null,
      transformations,
      output,
      mode: mode || "decrypt",
      stats: {
        originalLength: code.length,
        outputLength: output.length,
        originalLines: code.split("\n").length,
        outputLines: output.split("\n").length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Analysis failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}
