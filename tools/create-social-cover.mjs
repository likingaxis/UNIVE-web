import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
process.chdir(path.resolve(import.meta.dirname,'..'));
// Use the actual homepage artwork, rather than an unrelated stock illustration.
const report=JSON.parse(fs.readFileSync('publication/export-report.json','utf8'));
const artwork=report.source_files.find(p=>p.endsWith('/tumblr_527e9e177b4cc0c2e94d2d9f98ae57ed_4ffd3b4f_500.webp'));
if(!artwork)throw Error('Animazione della homepage non presente nella selezione.');
const crypto=await import('node:crypto');
const original=fs.readFileSync(path.resolve('../quartz',artwork));
const digest=crypto.createHash('sha256').update(original).digest('hex');
const frame=await sharp('content/assets/'+digest+'.webp',{page:0,pages:1}).png().toBuffer();
const image='data:image/png;base64,'+frame.toString('base64');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><clipPath id="art"><rect x="650" y="119" width="491" height="372" rx="18"/></clipPath></defs>
<rect width="1200" height="630" fill="#f7f3e9"/>
<text x="72" y="206" font-family="Georgia,serif" font-size="112" font-weight="700" fill="#25243a">UNIVE</text>
<text x="77" y="292" font-family="Segoe UI,Arial,sans-serif" font-size="38" fill="#35334b">Sito con i miei appunti</text>
<text x="77" y="350" font-family="Segoe UI,Arial,sans-serif" font-size="43" font-weight="700" fill="#35334b">Luca</text>
<path d="M79 401h82" stroke="#9773bb" stroke-width="5" stroke-linecap="round"/>
<text x="77" y="466" font-family="Segoe UI,Arial,sans-serif" font-size="27" fill="#4d5550">Teoria, esercizi e laboratori.</text>
<image href="${image}" x="650" y="119" width="491" height="372" clip-path="url(#art)"/>
<text x="77" y="571" font-family="Segoe UI,Arial,sans-serif" font-size="22" fill="#526b5b">Informatica · Tor Vergata</text>
</svg>`;
fs.writeFileSync('quartz/static/unive-social.svg',svg);
await sharp(Buffer.from(svg)).png().toFile('quartz/static/unive-social-v2.png');
console.log('Copertina sociale generata: 1200 × 630.');
