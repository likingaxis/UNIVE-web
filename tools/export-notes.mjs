import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import YAML from 'yaml';

const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
const policy = JSON.parse(fs.readFileSync('publication/selection.json', 'utf8'));
const remote = process.argv.includes('--fetch');
const sourceArg = process.argv.indexOf('--source');
const source = path.resolve(sourceArg >= 0 ? process.argv[sourceArg + 1] : remote ? '.source-notes' : '../quartz');
const git = (args, options = {}) => execFileSync('git', ['-C', source, ...args], {encoding:'utf8', maxBuffer:64*1024*1024, ...options});
const forbidden = p => /(^|\/)(tesi|magistrale|progetti|\.obsidian|\.trash)(\/|$)/i.test(p) || /(^|\/)AGENTS\.md$|\.bak$/i.test(p);
const eligible = p => p.startsWith('content/UNI/Triennale/') && p.endsWith('.md') && !forbidden(p) && !p.split('/').some(s => /DRAFT|GPT PREMIUMS/i.test(s));
if (remote) {
  if (!fs.existsSync(source)) execFileSync('git', ['clone','--depth=1','--filter=blob:none','--no-checkout','--branch',policy.source_branch,`https://github.com/${policy.source_repository}.git`,source], {stdio:'inherit'});
  else {git(['fetch','--depth=1','origin',policy.source_branch]); git(['reset','--hard','FETCH_HEAD']);}
  git(['sparse-checkout','init','--no-cone']);
  const patterns = ['/content/UNI/Triennale/**/*.md', '!/content/UNI/Triennale/ANNO 3/TESI/', ...(policy.asset_policy?.source_allowlist ?? []).map(a=>'/'+a.source)];
  git(['sparse-checkout','set','--no-cone','--stdin'], {input:patterns.join('\n')+'\n'});
  git(['checkout',policy.source_branch]);
}
const files = [...new Set(git(['ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(Boolean))];
const fileSet = new Set(files);
function read(p) {
  const target = path.join(source,p);
  if (!fs.existsSync(target) && remote) {
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,git(['show',`HEAD:${p}`],{encoding:null}));
  }
  return fs.readFileSync(target);
}
function parse(p) {
  let text = read(p).toString('utf8').replace(/^\uFEFF/,'');
  let meta={};
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if(match) {meta=YAML.parse(match[1]) ?? {};text=text.slice(match[0].length);}
  return {meta,body:text};
}
const slug = s => s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'nota';
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const courses = structuredClone(policy.courses);
const chosen = new Map();
const controlFiles = new Set([...policy.courses.flatMap(c=>c.notes.map(n=>n.source)),...(policy.asset_policy?.source_allowlist ?? []).map(a=>a.source)]);
for(const course of courses) for(const note of course.notes) {
  if(!eligible(note.source)) throw Error('Selezione vietata: '+note.source);
  if(!fileSet.has(note.source)) continue;
  const parsed = parse(note.source);
  if(parsed.meta.publish !== false) chosen.set(note.source,{...note,...parsed,course});
}
for(const p of files.filter(eligible)) {
  if(chosen.has(p)) continue;
  const parsed = parse(p);
  if(parsed.meta.publish === true) controlFiles.add(p);
  else if(parsed.meta.publish === false && !remote) {
    // A withdrawal updates a previously published source; an unrelated private
    // note with publish:false must never be added to a public source commit.
    try {if(/^publish:\s*true\s*$/m.test(git(['show',`HEAD:${p}`],{stdio:['pipe','pipe','ignore']})))controlFiles.add(p);}catch{}
  }
  if(parsed.meta.publish !== true) continue;
  let course = courses.find(c=>p.startsWith(c.source_folder+'/'));
  if(!course) {
    const parts=p.split('/'); const end=parts[4]==='ARCHIVIO'?6:5;
    const folder=parts.slice(0,end).join('/');
    course={id:slug(parts[end-1]),title:parts[end-1],source_folder:folder,decision:'Appunti aggiunti esplicitamente con publish: true.',notes:[]};
    courses.push(course);
  }
  chosen.set(p,{source:p,title:parsed.meta.title ?? path.posix.basename(p,'.md'),role:'supporto',...parsed,course});
}
for(const c of courses) {
  const year = c.source_folder.match(/ANNO (\d)/)?.[1];
  c.output = (c.id.startsWith('hackathon')?'progetti':`triennale/${{'1':'primo-anno','2':'secondo-anno','3':'terzo-anno'}[year] ?? 'altri-corsi'}`)+'/'+c.id;
}
const used = new Set();
for(const note of chosen.values()) {
  let output = note.course.output+'/'+slug(path.posix.basename(note.source,'.md'));
  if(used.has(output) || output.endsWith('/index')) output+='-'+hash(note.source).slice(0,8);
  used.add(output);note.output=output;
}
const byName = new Map(), byStem = new Map();
for(const p of files.filter(p=>p.startsWith('content/') && !forbidden(p))) {
  for(const [map,key] of [[byName,path.posix.basename(p).toLowerCase()],[byStem,path.posix.basename(p,path.posix.extname(p)).toLowerCase()]]) {
    if(!map.has(key)) map.set(key,[]);map.get(key).push(p);
  }
}
const outputs = new Map(), assets = new Map(), issues=[];
const indexAliases = {
  'IS INDICE':'ingegneria-software','IA INDICE':'intelligenza-artificiale',
  'BIG DATA INDICE':'big-data','PROGRAMMAZIONE WEB INDICE':'programmazione-web',
  'VULNERABILITÀ INDICE':'vulnerabilita','INFORMATION RETRIEVAL INDICE':'information-retrieval',
  'CALCOLO NUMERICO INDICE':'calcolo-numerico',
};
function write(p, text) {outputs.set(p,Buffer.isBuffer(text)?text:Buffer.from(text));}
const fm = (title,body) => `---\n${YAML.stringify({title}).trim()}\n---\n\n${body}\n`;
const escapeLabel = s => s.replace(/[\[\]|]/g,'');
function resolve(target, from) {
  const base=path.posix.basename(target).toLowerCase();
  let candidates=byName.get(base) ?? byStem.get(base) ?? [];
  const exacts=[target,'content/'+target,path.posix.normalize(path.posix.dirname(from)+'/'+target)];
  const exact=candidates.filter(p=>exacts.includes(p));
  const near=candidates.filter(p=>p.startsWith(path.posix.dirname(from)+'/'));
  candidates=exact.length?exact:near.length?near:candidates;
  return candidates.length===1?candidates[0]:null;
}
function link(raw, label, embed, note) {
  if(/^(https?:|mailto:|data:)/i.test(raw)) return null;
  let target;try{target=decodeURIComponent(raw.trim().replace(/^<|>$/g,''));}catch{target=raw;}
  const anchorAt=target.indexOf('#');const anchor=anchorAt<0?'':target.slice(anchorAt);target=anchorAt<0?target:target.slice(0,anchorAt);
  if(!target) return null;
  let output;
  const indexName=path.posix.basename(target).replace(/\.md$/i,'').toUpperCase();
  if(indexAliases[indexName]) output=courses.find(c=>c.id===indexAliases[indexName])?.output+'/index';
  if(indexName==='ANNO 1 INDICE')output='triennale/primo-anno/index';
  if(indexName==='ANNO 2 INDICE')output='triennale/secondo-anno/index';
  const lower=target.toLowerCase();
  if(lower==='logica indice') output=courses.find(c=>c.id==='logica')?.output+'/index';
  else if(lower==='sistemi operativi lez.4-5-6-7') output=[...chosen.values()].find(n=>n.source.endsWith('/LISTA ARGOMENTI CRUX.md'))?.output;
  else if(lower==='ia lez.7  di logica') output=[...chosen.values()].find(n=>n.source.endsWith('/IA UNICO SECONDO ESONERO.md'))?.output;
  else if(lower==='13. grafi') output=[...chosen.values()].find(n=>n.source.endsWith('/ALGORITMI LEZ.14.md'))?.output;
  if(!output) output=[...chosen.values()].find(n=>n.course===note.course && path.posix.basename(n.output)+'.md'===target)?.output;
  const resolved=output?null:resolve(target,note.source);
  if(resolved && chosen.has(resolved)) output=chosen.get(resolved).output;
  if(resolved && !resolved.endsWith('.md') && !forbidden(resolved)) {
    if(!assets.has(resolved)) {
      const bytes=read(resolved);const out='assets/'+hash(bytes)+path.posix.extname(resolved).toLowerCase();
      assets.set(resolved,out);write(out,bytes);
    }
    output=assets.get(resolved);
  }
  const homeAlt=note.source==='content/index.md' && embed
    ? ({'tumblr_527e9e177b4cc0c2e94d2d9f98ae57ed_4ffd3b4f_500.webp':'Winnie the Pooh sotto la pioggia','Screenshot 2026-03-09 123930.png':'Orario delle lezioni e organizzazione settimanale'})[path.posix.basename(target)]
    : undefined;
  const display=escapeLabel(homeAlt || label || path.posix.basename(target).replace(/\.md$/i,''));
  if(!output) {
    issues.push({source:note.source,target,status:resolved?'escluso':'non_disponibile'});
    return embed ? `\n> Allegato non disponibile nell’archivio pubblicato: ${display}.\n` : `${display} (riferimento non disponibile)`;
  }
  const relative=output+(output.startsWith('assets/')?'':'.md')+anchor;
  // Markdown destinations in angle brackets support spaces and parentheses safely.
  return `${embed?'!':''}[${display}](<${relative}>)`;
}
function rewrite(note) {
  const protectedText=[];
  let body=note.body.replace(/(^`{3,}[^`\n]*\n[\s\S]*?^`{3,}[ \t]*\r?$|^~{3,}[^~\n]*\n[\s\S]*?^~{3,}[ \t]*\r?$|\$\$[\s\S]*?\$\$|`{3}[^`\n]+`{3}|`[^`\n]+`|(?<!\\)\$[^\n$]*?(?<!\\)\$)/gm,s=>`\u0000${protectedText.push(s)-1}\u0000`);
  // A single pass prevents converted wikilinks being interpreted a second time.
  body=body.replace(/(!?)\[\[([^\]\n]+)\]\]|(!?)\[([^\]\n]*)\]\((<[^>]+>|[^)\n]+)\)/g,(all,bang,inside,mdBang,label,target)=>{
    if(inside!==undefined) {const [dest,...alias]=inside.split('|');return link(dest,alias.join('|'),!!bang,note)??all;}
    return link(target,label,!!mdBang,note)??all;
  });
  body=body.replace(/\u0000(\d+)\u0000/g,(_,i)=>protectedText[+i]);
  return body;
}
for(const note of chosen.values()) write(note.output+'.md',fm(note.title,rewrite(note)));
const groups={principale:'Appunti e sintesi',lezioni:'Lezioni',supporto:'Materiale di supporto',esercizi:'Esercizi',laboratorio:'Laboratorio',dimostrazioni:'Dimostrazioni'};
const collator=new Intl.Collator('it',{numeric:true,sensitivity:'base'});
for(const c of courses) {
  const notes=[...chosen.values()].filter(n=>n.course===c);if(!notes.length)continue;
  let body=c.decision+'\n';
  for(const [role,title] of Object.entries(groups)) {
    const subset=notes.filter(n=>n.role===role).sort((a,b)=>collator.compare(a.title,b.title));
    if(subset.length) body+='\n## '+title+'\n\n'+subset.map(n=>`- [${escapeLabel(n.title)}](${n.output}.md)`).join('\n')+'\n';
  }
  write(c.output+'/index.md',fm(c.title,body));
}
let home='Appunti della laurea triennale in Informatica: sintesi, esercizi e laboratori, organizzati per corso.\n\nLa raccolta è una selezione degli appunti personali e può contenere errori o parti incomplete.\n';
for(const [section,title] of [['triennale/primo-anno','Primo anno'],['triennale/secondo-anno','Secondo anno'],['triennale/terzo-anno','Terzo anno'],['progetti','Progetti e laboratori']]) {
  const subset=courses.filter(c=>c.output.startsWith(section+'/') && [...chosen.values()].some(n=>n.course===c));
  const links=subset.map(c=>`- [${c.title}](${c.output}/index.md)`).join('\n');
  write(section+'/index.md',fm(title,links));
  home+=`\n## ${title}\n\n`+subset.map(c=>`- [${c.title}](${c.output}/index.md)`).join('\n')+'\n';
}
home+='\n---\n\n[Archivio degli appunti su GitHub](https://github.com/likingaxis/UNIVE/tree/v4) · Tema Primary per Quartz\n';
if(fileSet.has('content/index.md')) {
  controlFiles.add('content/index.md');
  // Keep the vault homepage as the source of truth; only public destinations
  // and heading levels change in the generated web copy.
  home=rewrite({source:'content/index.md',output:'index',body:parse('content/index.md').body}).replace(/^(#{1,5}) /gm,'#$1 ');
}
write('index.md',fm('UNIVE — appunti di Informatica',home));
write('triennale/index.md',fm('Laurea triennale','- [Primo anno](triennale/primo-anno/index.md)\n- [Secondo anno](triennale/secondo-anno/index.md)\n- [Terzo anno](triennale/terzo-anno/index.md)'));
const outDir=path.join(root,'content');fs.mkdirSync(outDir,{recursive:true});
if(process.argv.includes('--dry-run')) {
  console.log(JSON.stringify({notes:[...chosen.keys()],assets:[...assets.keys()],issues}));
  process.exit(0);
}
const stateFile=path.join(root,'.publication-state.json');
const previous=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):[];
function safeOutput(p) {const full=path.resolve(outDir,p);if(!full.startsWith(outDir+path.sep))throw Error('Output fuori cartella');return full;}
for(const old of previous) if(!outputs.has(old)) fs.rmSync(safeOutput(old),{force:true});
for(const [p,bytes] of outputs) {const full=safeOutput(p);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,bytes);}
fs.writeFileSync(stateFile,JSON.stringify([...outputs.keys()],null,2));
const report={source_commit:git(['rev-parse','HEAD']).trim(),notes:chosen.size,courses:courses.filter(c=>[...chosen.values()].some(n=>n.course===c)).length,assets:assets.size,issues,source_files:[...chosen.keys(),...assets.keys()],control_files:[...new Set([...controlFiles,...chosen.keys(),...assets.keys()])].filter(p=>!forbidden(p)),outputs:[...outputs.keys()]};
fs.writeFileSync('publication/export-report.json',JSON.stringify(report,null,2));
console.log(`Esportate ${report.notes} note, ${report.courses} sezioni e ${report.assets} allegati. Riferimenti non disponibili: ${issues.length}.`);
