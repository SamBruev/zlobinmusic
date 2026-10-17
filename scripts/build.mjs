import { mkdir, copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const out = resolve(root, 'docs');
const pages = ['index.html', 'course-harmony.html', 'course-jazz.html', 'course-bossa.html'];
await mkdir(resolve(out, 'assets'), { recursive: true });
for (const name of [...pages, 'styles.css', 'site.js', 'app.js', '.nojekyll']) await copyFile(resolve(root, name), resolve(out, name));
for (const name of await readdir(resolve(root, 'assets'))) await copyFile(resolve(root, 'assets', name), resolve(out, 'assets', name));
for (const page of pages) {
 const html = await readFile(resolve(out, page), 'utf8');
 for (const match of html.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)) {
  if (/^(https?:|mailto:|tel:)/.test(match[1])) continue;
  await readFile(resolve(out, match[1]));
 }
}
await writeFile(resolve(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log('Four static pages built; local assets and page links verified.');
