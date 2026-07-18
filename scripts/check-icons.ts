/**
 * Icon manifest guard — run as part of `prelint`.
 *
 * ERROR (fails the build):
 *   A static `<Icon name="literal">` references a key that isn't in
 *   `icons.config.ts`. The `Icon` component's `name` prop is a plain `string`
 *   (tag icons are intentionally loose — see entities/tag.ts), so TypeScript
 *   can't catch these; they blow up at runtime ("Icon … not found in any
 *   pack"). This guard makes them fail at lint time instead.
 *
 * WARN (never fails):
 *   Manifest keys with no string-literal reference anywhere in `src`. This is
 *   a heuristic for pruning dead entries — it can't see data-driven usage
 *   (tag/currency/bank icons chosen at runtime), so it only informs, never
 *   blocks.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { manifest } from '../icons.config';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(appRoot, 'src');

const registered = new Set<string>();
for (const pack of Object.values(manifest.packs)) {
  for (const icon of pack.icons) registered.add(icon.key);
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'generated' || entry.name === 'node_modules') continue;
      out.push(...walk(p));
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

const isKey = (s: string): boolean => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
const rel = (f: string): string => relative(appRoot, f).replace(/\\/g, '/');
const lineOf = (text: string, index: number): number => text.slice(0, index).split('\n').length;

const missing = new Map<string, string[]>(); // key -> ["file:line", …]
const referencedLiterals = new Set<string>(); // any quoted literal seen in src

for (const file of walk(srcDir)) {
  const text = readFileSync(file, 'utf8');

  // Broad pass: every quoted string literal, for the unused heuristic.
  for (const lit of text.matchAll(/["'`]([a-z0-9][a-z0-9-]*)["'`]/g)) {
    referencedLiterals.add(lit[1]);
  }

  // Precise pass: literal names passed to the <Icon> component.
  for (const tag of text.matchAll(/<Icon\b([\s\S]*?)\/?>/g)) {
    const attr = tag[1].match(/\bname=(?:"([^"]*)"|'([^']*)'|\{([\s\S]*?)\})/);
    if (!attr) continue;
    const literals: string[] = [];
    if (attr[1] !== undefined) literals.push(attr[1]);
    else if (attr[2] !== undefined) literals.push(attr[2]);
    else if (attr[3] !== undefined) {
      // name={expr} — pull any string literals out of the expression
      for (const lit of attr[3].matchAll(/["'`]([^"'`]+)["'`]/g)) literals.push(lit[1]);
    }
    for (const name of literals) {
      if (!isKey(name) || registered.has(name)) continue;
      const loc = `${rel(file)}:${lineOf(text, tag.index)}`;
      const list = missing.get(name) ?? [];
      list.push(loc);
      missing.set(name, list);
    }
  }
}

const unused = [...registered].filter((k) => !referencedLiterals.has(k)).sort();

if (unused.length > 0) {
  console.warn(`\n[icons] ${unused.length} registered icon(s) with no literal reference in src (dynamic/data-driven usage is not detected — review before pruning):`);
  console.warn('  ' + unused.join(', '));
}

if (missing.size > 0) {
  console.error(`\n[icons] ${missing.size} icon(s) used via <Icon name="…"> but not registered in icons.config.ts:`);
  for (const [name, locs] of [...missing].sort()) {
    console.error(`  "${name}"`);
    for (const loc of locs) console.error(`      ${loc}`);
  }
  console.error('\nAdd them to icons.config.ts and run `npm run gen:icons`.');
  process.exit(1);
}

console.log(`[icons] ok — ${registered.size} registered, all <Icon name="…"> literals resolve.`);
