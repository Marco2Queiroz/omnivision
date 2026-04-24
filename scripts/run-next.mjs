/**
 * Lança o Next sem herdar `NODE_OPTIONS` (ex.: --disallow-code-generation-from-strings
 * a nível de sistema) — isso provoca EvalError no middleware / Edge.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

if (!existsSync(nextBin)) {
  console.error("Next.js não encontrado. Execute: npm install");
  process.exit(1);
}

const argv = process.argv.slice(2);
const mode = argv[0] ?? "dev";
const passThrough = argv.slice(1);

const env = { ...process.env };
/*
 * O Next lê `.env` e, se `NODE_ENV` estiver em produção, `next dev` continua a pensar
 * que está em produção — o PostCSS/Tailwind deixa de expandir `@tailwind` e o webpack
 * quebra com "Unexpected character '@' (1:0)" em globals.css.
 * Forçamos o modo alinhado com o subcomando.
 */
if (mode === "dev") {
  env.NODE_ENV = "development";
} else if (mode === "build" || mode === "start") {
  env.NODE_ENV = "production";
}
/* Flags que quebram o sandbox do middleware (Edge) ao bloquear eval interno do webpack */
const rawOpt = env.NODE_OPTIONS;
if (typeof rawOpt === "string" && rawOpt.trim()) {
  const filtered = rawOpt
    .split(/\s+/)
    .filter((f) => f && !f.includes("disallow-code-generation-from-strings"))
    .join(" ")
    .trim();
  if (filtered) env.NODE_OPTIONS = filtered;
  else delete env.NODE_OPTIONS;
} else {
  delete env.NODE_OPTIONS;
}

const child = spawn(
  process.execPath,
  [nextBin, mode, ...passThrough],
  {
    stdio: "inherit",
    cwd: root,
    env,
    windowsHide: true,
  },
);

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(typeof code === "number" ? code : 0);
});
