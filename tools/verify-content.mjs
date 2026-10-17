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
const report = JSON.parse(fs.readFileSync('publication/export-report.json', 'utf8'));
const inputFiles=walk(path.resolve('content')).map(f=>path.relative(path.resolve('content'),f).replaceAll(path.sep,'/'));
if(inputFiles.some(p=>!report.outputs.includes(p))) throw Error('File estranei alla selezione nella cartella generata.');
for(const p of report.outputs) {
  const target=p.endsWith('.md')?p.slice(0,-3)+'.html':p;
  if(!files.includes(target))throw Error('Pagina o allegato non generato: '+target);
}
const broken=[];
for(const p of files.filter(p=>p.endsWith('.html'))) {
  const html=fs.readFileSync(path.join(output,p),'utf8');
  for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let url=match[1].replaceAll('&amp;','&');
    if(!url || url.startsWith('#') || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url))continue;
    try{url=decodeURIComponent(url.split(/[?#]/)[0]);}catch{continue;}
    if(url==='/UNIVE-web')url='index.html';
    else if(url.startsWith('/UNIVE-web/'))url=url.slice('/UNIVE-web/'.length);
    else if(!url.startsWith('/'))url=path.posix.join(path.posix.dirname(p),url);
    url=url.replace(/^\//,'').replace(/\/$/,'');
    if(url==='.' || url==='')url='index.html';
    if(![url,url+'.html',url+'/index.html'].some(candidate=>files.includes(candidate)))broken.push({page:p,target:match[1]});
  }
}
if(broken.length)throw Error('Collegamenti locali non risolti: '+JSON.stringify(broken.slice(0,20))+'; totale '+broken.length);
console.log(`Verificati ${files.length} file e ${Object.keys(index).length} voci di ricerca: cartelle escluse assenti.`);
