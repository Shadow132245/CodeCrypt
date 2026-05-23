# CodeCrypt 🔐

**Universal Code Encryptor, Decryptor & Deobfuscator**

CodeCrypt is a client-side web application that allows you to **encrypt, decrypt, deobfuscate, and beautify** code from 10+ programming languages with language-specific algorithms and automatic language detection.

---

## Features

- **Encrypt** — Obfuscate your code with language-specific encryption algorithms (Hex, Unicode, Base64, String Split, XOR, and more)
- **Decrypt** — Automatically detect and reverse encryption/obfuscation for all supported languages
- **Deobfuscate** — Deep deobfuscation for JavaScript/TypeScript (hex escapes, Unicode escapes, Base64, eval-packed code)
- **Beautify** — Language-aware code formatting with proper indentation
- **Auto Detection** — Smart pattern-based language detection with confidence scoring
- **Bilingual UI** — Full English and Arabic (RTL) support

## Supported Languages

| Language  | Encryption | Decryption | Formatting |
|-----------|:----------:|:----------:|:----------:|
| JavaScript | ✅ | ✅ | ✅ |
| TypeScript | ✅ | ✅ | ✅ |
| Python     | ✅ | ✅ | ✅ |
| Java       | ✅ | ✅ | ✅ |
| C#         | ✅ | ✅ | ✅ |
| C/C++      | ✅ | ✅ | ✅ |
| PHP        | ✅ | ✅ | ✅ |
| Ruby       | ✅ | ✅ | ✅ |
| HTML       | ✅ | ✅ | ✅ |
| CSS        | ✅ | ✅ | ✅ |

## Encryption Algorithms

### JavaScript / TypeScript
- Hex String Encoding (`\xNN`)
- Unicode String Encoding (`\uNNNN`)
- Base64 String Encoding
- String Concatenation Split
- Number Base Encoding
- Array Shuffle Obfuscation

### Python
- Hex String Encoding
- Unicode String Encoding
- Base64 String Encoding
- String Concatenation Split
- XOR Byte Cipher

### Java / C#
- Unicode String Encoding
- String Concatenation Split
- Number Base Encoding

### C / C++
- Hex String Encoding
- Unicode String Encoding
- String Concatenation Split

### PHP
- Hex String Encoding
- String Concatenation Split
- Base64 String Encoding

### Ruby
- Unicode String Encoding
- String Concatenation Split
- Base64 String Encoding

### HTML
- HTML Entity Encoding
- Hex Text Encoding

### CSS
- Unicode Identifier Encoding
- Hex Color Conversion

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **Language**: TypeScript
- **Deployment**: [Vercel](https://vercel.com/)
- **Runtime**: Client-side + Server API

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Shadow132245/CodeCrypt.git

# Install dependencies
cd CodeCrypt
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment

Deploy to Vercel with zero configuration:

```bash
npm i -g vercel
vercel --prod
```

Or connect your GitHub repository directly on [vercel.com](https://vercel.com).

## License

MIT

---

### 🇪🇬 عربي

**CodeCrypt** — تطبيق ويب لتشفير وفك تشفير وتجميل الكود البرمجي. يدعم أكثر من 10 لغات برمجة مع خوارزميات خاصة بكل لغة وكشف تلقائي للغة البرمجة.
