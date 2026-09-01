import JSZip from "jszip";
async function generateProjectZip(onProgress) {
  const zip = new JSZip();
  const filesToAdd = {
    "package.json": JSON.stringify({
      name: "signlink-sign-language-interpreter",
      private: true,
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        "@tailwindcss/vite": "^4.1.14",
        "@vitejs/plugin-react": "^5.0.4",
        "canvas-confetti": "^1.9.4",
        "jszip": "^3.10.1",
        "lucide-react": "^0.546.0",
        "motion": "^12.23.24",
        "react": "^19.0.1",
        "react-dom": "^19.0.1",
        "tailwindcss": "^4.1.14",
        "vite": "^6.2.3"
      },
      devDependencies: {
        "@types/canvas-confetti": "^1.9.0",
        "@types/node": "^22.14.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "typescript": "~5.8.2"
      }
    }, null, 2),
    "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SignLink - Sign Language Text & Live Video Interpreter</title>
    <meta name="description" content="AI & Live Certified Sign Language Interpretation Suite" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"><\/script>
  </body>
</html>`,
    "vite.config.ts": `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});`,
    "README.md": `# SignLink \u2014 Sign Language Text & Live Video Interpreter

A state-of-the-art Sign Language Accessibility & Real-Time Video Interpretation Suite built with React, Tailwind CSS, Motion, and Speech APIs.

## Key Features

1. **AI Live Sign-to-Text Translation**: Real-time webcam video feed with 21-point hand landmark skeleton mesh tracking, AI gesture classification, and spoken voice audio synthesis (Web Speech API).
2. **Text & Speech-to-Sign**: Converts spoken speech or typed text into animated sign gestures and fingerspelling sequences.
3. **Virtual Sign Language Keyboard**: Interactive ASL & BSL fingerspelling manual alphabet (A-Z), numbers, and high-frequency sign gesture tiles with phonetic audio cues and sentence composer.
4. **Live Human Interpreter Video Calls**: Simulated 2-way video sessions with certified sign language interpreters (ASL, BSL, Auslan, LSF, IS), live auto-captioning, chat, and sign-speed controls.
5. **Certified Interpreter Directory & Booking**: Searchable, verified interpreters with credentials (RID, CDI, NAATI, NRCPD), reviews, instant call connection, and appointment scheduling calendar.
6. **Session History & Review Transcripts**: Complete meeting transcripts with speaker breakdown, key medical/legal terms extract, and exportable transcript logs.
7. **Resource Hub & Dictionary**: Illustrated handshape guides, grammar tutorials, fingerspelling drills, and 50+ emergency sign vocabulary.
8. **Settings & Full Dark/Light Modes**: Customizable sign dialects, speech pitch/rate, high-contrast captions, and mobile/desktop responsive design.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`
`,
    ".env.example": `GEMINI_API_KEY="YOUR_API_KEY"
APP_URL="http://localhost:3000"
`
  };
  const totalFiles = Object.keys(filesToAdd).length;
  let count = 0;
  for (const [filename, content] of Object.entries(filesToAdd)) {
    zip.file(filename, content);
    count++;
    if (onProgress) {
      onProgress(Math.round(count / (totalFiles + 5) * 100), filename);
    }
  }
  const blob = await zip.generateAsync({ type: "blob" }, (metadata) => {
    if (onProgress) {
      onProgress(Math.min(99, Math.round(metadata.percent)), "Compressing archive...");
    }
  });
  if (onProgress) {
    onProgress(100, "Complete");
  }
  return blob;
}
function downloadBlob(blob, filename = "signlink-react-project.zip") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
export {
  downloadBlob,
  generateProjectZip
};
