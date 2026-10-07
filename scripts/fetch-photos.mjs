// Downloads openly licensed photos of Monrovia from Wikimedia Commons into src/photos/,
// and writes src/photos/photos.json with the credit and licence for each one.
//
//   npm run photos
//
// Only free licences that allow reuse in a game are accepted (CC0, public domain, CC BY, CC BY-SA);
// non-commercial and no-derivatives licences are skipped. Uses curl so it follows HTTPS_PROXY.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('src/photos');
const UA = 'MonroviaCityGame/1.0 (https://github.com/amadoucss1998-cell/tradersworld; photo credits shown in game)';

// id, Commons search, landmark id the billboard stands next to (null: roadside billboard)
const TARGETS = [
  ['ducor', 'Ducor Hotel Monrovia', 'ducor'],
  ['lighthouse', 'Cape Mesurado lighthouse', 'lighthouse'],
  ['westpoint', 'West Point Monrovia', 'westpoint'],
  ['waterside', 'Waterside market Monrovia', 'waterside'],
  ['masonic', 'Masonic Temple Monrovia', 'masonic'],
  ['cityhall', 'Monrovia City Hall', 'cityhall'],
  ['capitol', 'Capitol Building Monrovia Liberia', 'capitol'],
  ['mansion', 'Executive Mansion Monrovia', 'mansion'],
  ['jfk', 'JFK Medical Center Monrovia', 'jfk'],
  ['stadium', 'Samuel Kanyon Doe Sports Complex', 'stadium'],
  ['redlight', 'Red Light market Paynesville', 'redlight'],
  ['providence', 'Providence Island Liberia', 'providence'],
  ['freeport', 'Freeport of Monrovia', 'freeport'],
  ['bridge', 'Gabriel Tucker Bridge Monrovia', null],
  ['broad', 'Broad Street Monrovia', null],
  ['skyline', 'Monrovia skyline', null],
  ['mamba', 'Mamba Point Monrovia', null],
  ['sinkor', 'Sinkor Monrovia', null],
  ['street', 'street Monrovia Liberia', null],
  ['beach', 'beach Monrovia Liberia', null],
];

const curl = (args) => execFileSync('curl', ['-sSfL', '--max-time', '60', '-A', UA, ...args], { maxBuffer: 64 << 20 });
const strip = (html = '') => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const FREE = /^(cc0|public domain|pd|cc[ -]by(-sa)?[ -]?\d)/i;
const NOT_FREE = /\b(nc|nd)\b/i;

fs.mkdirSync(OUT, { recursive: true });
const manifest = [];
const used = new Set();

for (const [id, search, landmark] of TARGETS) {
  const q = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '20',
    gsrsearch: `${search} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1024',
  });
  let pages;
  try {
    pages = Object.values(JSON.parse(curl([`https://commons.wikimedia.org/w/api.php?${q}`]).toString()).query?.pages || {});
  } catch (e) {
    console.error(`! ${id}: search failed (${e.message.split('\n')[0]})`);
    continue;
  }
  pages.sort((a, b) => a.index - b.index);
  const pick = pages.find((p) => {
    const ii = p.imageinfo?.[0];
    const lic = ii?.extmetadata?.LicenseShortName?.value || '';
    return ii && /jpeg|png/.test(ii.mime) && ii.width >= 800 && ii.width >= ii.height * 0.9
      && FREE.test(lic) && !NOT_FREE.test(lic) && !used.has(p.title);
  });
  if (!pick) {
    console.error(`! ${id}: no freely licensed landscape photo found for "${search}"`);
    continue;
  }
  const ii = pick.imageinfo[0];
  const meta = ii.extmetadata;
  const ext = ii.mime === 'image/png' ? 'png' : 'jpg';
  const file = `${id}.${ext}`;
  fs.writeFileSync(path.join(OUT, file), curl([ii.thumburl]));
  used.add(pick.title);
  manifest.push({
    id,
    file,
    landmark,
    title: strip(meta.ObjectName?.value) || pick.title.replace(/^File:/, '').replace(/\.\w+$/, ''),
    artist: strip(meta.Artist?.value) || 'Unknown',
    license: meta.LicenseShortName?.value,
    licenseUrl: meta.LicenseUrl?.value || null,
    source: ii.descriptionurl,
  });
  console.log(`✓ ${id}: ${pick.title} (${meta.LicenseShortName?.value}, ${strip(meta.Artist?.value)})`);
}

if (!manifest.length) {
  console.error('\nNo photos downloaded (is commons.wikimedia.org reachable?). Existing photos were left alone.');
  process.exit(1);
}
fs.writeFileSync(path.join(OUT, 'photos.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\n${manifest.length} photos saved to src/photos/`);
