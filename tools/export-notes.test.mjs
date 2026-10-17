import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('selection, explicit publication, withdrawal and protected folders',()=>{
  const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'unive-export-test-'));
  const policy=JSON.parse(fs.readFileSync(new URL('../publication/selection.json',import.meta.url),'utf8'));
  const [selected,withdrawn]=policy.courses[0].notes;
  const extra=policy.courses[0].source_folder+'/Nuova nota.md';
  const thesis='content/UNI/Triennale/ANNO 3/TESI/Segreto.md';
  const master='content/UNI/Magistrale/Segreto.md';
  const draft=policy.courses[0].source_folder+'/DRAFT/Bozza.md';
  function write(p,text){fs.mkdirSync(path.dirname(path.join(fixture,p)),{recursive:true});fs.writeFileSync(path.join(fixture,p),text);}
  try {
    execFileSync('git',['init',fixture],{stdio:'pipe'});
    write(selected.source,'Una nota selezionata.');
    write(withdrawn.source,'---\npublish: false\n---\nRitirata.');
    for(const p of [extra,thesis,master,draft])write(p,'---\npublish: true\n---\nNuova nota.');
    function inspect(){return JSON.parse(execFileSync(process.execPath,[new URL('./export-notes.mjs',import.meta.url).pathname.replace(/^\/(?:([A-Z]:))/, '$1'),'--source',fixture,'--dry-run'],{encoding:'utf8'}));}
    assert.deepEqual(new Set(inspect().notes),new Set([selected.source,extra]));
    write(extra,'---\npublish: false\n---\nRitirata.');
    assert.deepEqual(inspect().notes,[selected.source]);
  } finally {
    // This unique temporary fixture is created by this test, outside the vault.
    fs.rmSync(fixture,{recursive:true,force:true});
  }
});
