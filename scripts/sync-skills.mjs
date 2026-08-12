// Mirrors the canonical skill into the client-specific folders.
// Run `npm run sync:skills` after editing skills/confluence-mermaid/SKILL.md.
// `--check` exits non-zero if a mirror has drifted (for CI).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SOURCE = 'skills/confluence-mermaid/SKILL.md';
const MIRRORS = [
  '.claude/skills/confluence-mermaid/SKILL.md',
  '.cursor/skills/confluence-mermaid/SKILL.md',
  // Shipped to teammates by both marketplaces — keep this one honest.
  'plugins/confluence-mermaid/skills/confluence-mermaid/SKILL.md',
];

const check = process.argv.includes('--check');
const source = readFileSync(SOURCE, 'utf8');
let drifted = 0;

for (const target of MIRRORS) {
  let current = null;
  try {
    current = readFileSync(target, 'utf8');
  } catch {
    // missing mirror counts as drift
  }

  if (current === source) continue;

  if (check) {
    console.error(`drift: ${target} differs from ${SOURCE}`);
    drifted += 1;
    continue;
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, source);
  console.log(`synced: ${target}`);
}

if (drifted) {
  console.error('Run `npm run sync:skills` to update the mirrors.');
  process.exit(1);
}
