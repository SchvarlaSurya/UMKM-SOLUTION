import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Worktree Claude Code berisi salinan repo lengkap dengan `.next`-nya
    // sendiri. Tanpa ini, `npm run lint` lokal ikut memindai build output di
    // sana dan gagal dengan ribuan galat. Folder ini tidak ada di CI.
    ".claude/**",
  ]),
]);

export default eslintConfig;
