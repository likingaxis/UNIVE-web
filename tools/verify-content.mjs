import fs from "node:fs";
import path from "node:path";

const output = path.resolve("public");
const forbidden = /(^|\/)(magistrale|tesi|draft|\.obsidian|\.trash)(\/|$)/i;
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}
const files = walk(output).map((file) => path.relative(output, file).replaceAll(path.sep, "/"));
const invalidPaths = files.filter((file) => forbidden.test(file));
const index = JSON.parse(fs.readFileSync(path.join(output, "static", "contentIndex.json"), "utf8"));
const invalidEntries = Object.keys(index).filter((slug) => forbidden.test(slug));
if (invalidPaths.length || invalidEntries.length) {
  throw new Error(`Contenuti esclusi presenti: ${JSON.stringify([...invalidPaths, ...invalidEntries])}`);
}
if (!files.includes("index.html")) throw new Error("Pagina iniziale non generata.");
console.log(`Verificati ${files.length} file e ${Object.keys(index).length} voci di ricerca: cartelle escluse assenti.`);
