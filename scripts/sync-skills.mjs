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

// The skill states its own version so a copy in the wild can be identified.
// Every manifest that declares a version must agree with it, or a channel can
// ship content from one release under the version number of another.
const declared = source.match(/^\*\*Skill version:\*\*\s*(\S+)/m)?.[1];
const manifests = [
  ['plugins/confluence-mermaid/.claude-plugin/plugin.json', (j) => j.version],
  ['plugins/confluence-mermaid/.cursor-plugin/plugin.json', (j) => j.version],
  ['.claude-plugin/marketplace.json', (j) => j.version],
  ['.claude-plugin/marketplace.json', (j) => j.plugins[0].version],
  ['.cursor-plugin/marketplace.json', (j) => j.metadata?.version],
];

if (!declared) {
  console.error(`version: ${SOURCE} has no "**Skill version:** X.Y.Z" line`);
  drifted += 1;
} else {
  for (const [file, pick] of manifests) {
    const found = pick(JSON.parse(readFileSync(file, 'utf8')));
    if (found !== declared) {
      console.error(`version: ${file} says ${found}, skill says ${declared}`);
      drifted += 1;
    }
  }
}

if (drifted) {
  console.error('Run `npm run sync:skills` and align the version numbers.');
  process.exit(1);
}
