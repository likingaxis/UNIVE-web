import {spawnSync} from 'node:child_process';
import path from 'node:path';
process.chdir(path.resolve(import.meta.dirname,'..'));
const result=spawnSync(process.execPath,['quartz/bootstrap-cli.mjs','build',...process.argv.slice(2)],{stdio:'inherit',env:{...process.env,UNIVE_GENERATED_CONTENT:'1'}});
process.exit(result.status ?? 1);
