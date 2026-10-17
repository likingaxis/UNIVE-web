import fs from 'node:fs';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const source=path.resolve(root,'../quartz');
process.chdir(root);
function git(cwd,args,options={}) {return execFileSync('git',['-C',cwd,...args],{encoding:'utf8',maxBuffer:16*1024*1024,...options});}
function run(script) {const result=spawnSync(process.execPath,[script],{stdio:'inherit'});if(result.status!==0)throw Error('Operazione interrotta: '+script);}
function commitPaths(cwd,paths,message) {
  const changes=new Set([...git(cwd,['diff','HEAD','--name-only','-z']).split('\0'),...git(cwd,['ls-files','--others','--exclude-standard','-z']).split('\0')].filter(Boolean));
  const selected=[...new Set(paths)].filter(p=>changes.has(p));
  if(!selected.length)return false;
  const input=selected.join('\0')+'\0';
  const stagedDeleted=new Set(git(cwd,['diff','--cached','--diff-filter=D','--name-only','-z']).split('\0').filter(Boolean));
  const toStage=selected.filter(p=>!stagedDeleted.has(p));
  if(toStage.length)git(cwd,['add','--pathspec-from-file=-','--pathspec-file-nul'],{input:toStage.join('\0')+'\0'});
  if(selected.some(p=>stagedDeleted.has(p))) {
    const staged=git(cwd,['diff','--cached','--name-only','-z']).split('\0').filter(Boolean);
    if(staged.some(p=>!selected.includes(p)))throw Error('Ci sono rimozioni selezionate insieme ad altri file in staging. Completa il commit già preparato e riprova.');
    git(cwd,['commit','-m',message]);
  } else git(cwd,['commit','--only','--pathspec-from-file=-','--pathspec-file-nul','-m',message],{input});
  return true;
}
try {
  if(git(source,['branch','--show-current']).trim()!=='v4') throw Error('La cartella degli appunti deve essere sul branch v4.');
  if(git(root,['branch','--show-current']).trim()!=='codex/site') throw Error('Il sito deve essere sul branch codex/site.');
  if(!git(source,['remote','get-url','origin']).includes('likingaxis/UNIVE'))throw Error('Repository degli appunti inattesa.');
  run('tools/export-notes.mjs');
  run('tools/build-site.mjs');
  run('tools/verify-content.mjs');
  const report=JSON.parse(fs.readFileSync('publication/export-report.json','utf8'));
  commitPaths(source,report.control_files,'Aggiorna gli appunti selezionati per il sito');
  // Only the exporter-selected notes and their assets can enter the source commit.
  git(source,['push','origin','v4'],{stdio:'inherit'});
  const sitePaths=['.gitignore','.github/workflows/deploy.yml','package.json','package-lock.json','quartz.config.yaml','quartz/util/glob.ts','quartz/components/Head.tsx','quartz/static/icon.png','quartz/static/icon.svg','quartz/static/unive-social-v1.png','quartz/static/unive-social.svg','README.md','DEMO.md','GUIDA-PUBBLICAZIONE.md','pubblica.cmd',...fs.readdirSync('tools').filter(n=>n.endsWith('.mjs')).map(n=>'tools/'+n),'publication/selection.json','publication/CLASSIFICAZIONE.md',...git(root,['diff','--cached','--name-only','-z']).split('\0').filter(p=>p.startsWith('content/'))];
  const changed=commitPaths(root,sitePaths,'Pubblica la selezione degli appunti e il flusso di aggiornamento');
  git(root,['push','origin','codex/site'],{stdio:'inherit'});
  if(!changed) {
    const raw=git(root,['credential','fill'],{input:'protocol=https\nhost=github.com\n\n'});
    const credential=Object.fromEntries(raw.trim().split(/\r?\n/).map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)];}));
    const result=await fetch('https://api.github.com/repos/likingaxis/UNIVE-web/actions/workflows/deploy.yml/dispatches',{method:'POST',headers:{Authorization:'Bearer '+credential.password,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},body:JSON.stringify({ref:'codex/site'})});
    if(!result.ok)throw Error('Avvio GitHub Actions fallito: HTTP '+result.status);
  }
  console.log('\nPubblicazione avviata. Esito: https://github.com/likingaxis/UNIVE-web/actions\nSito: https://likingaxis.github.io/UNIVE-web/');
} catch(error) {console.error('\nPubblicazione interrotta: '+error.message);process.exitCode=1;}
