import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import YAML from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const theme = process.argv[2];
if (!theme || theme === "--help") {
  console.log("Uso: node tools/set-theme.mjs <nome-tema>\nInstalla un tema Quartz compatibile e aggiorna solo la configurazione del sito.\nPoi rigenera con: npm run preview");
  process.exit(theme ? 0 : 1);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(theme)) {
  throw new Error("Usa il nome del pacchetto Quartz, per esempio primary o minimal.");
}
const candidate = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
const npmCli = process.env.npm_execpath && fs.existsSync(process.env.npm_execpath)
  ? process.env.npm_execpath
  : candidate;
if (!fs.existsSync(npmCli)) {
  throw new Error("Client npm non trovato. Esegui questo script usando l'installazione Node.js completa.");
}
const installed = spawnSync(process.execPath, [npmCli, "install", `@quartz-themes/${theme}`, "--no-audit", "--no-fund"], {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
});
if (installed.error) throw installed.error;
if (installed.status !== 0) process.exit(installed.status ?? 1);
const configPath = path.join(root, "quartz.config.yaml");
const config = YAML.parse(fs.readFileSync(configPath, "utf8"));
const plugin = config.plugins.find((entry) => entry.source === "@quartz-themes/core");
if (!plugin) throw new Error("Plugin Quartz Themes assente: configurazione lasciata invariata.");
plugin.enabled = true;
plugin.options = { ...plugin.options, theme, mode: "both" };
fs.writeFileSync(configPath, YAML.stringify(config));
console.log(`Tema selezionato: ${theme}. Rigenera il sito con npm run preview.`);
