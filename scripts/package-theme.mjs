// Packages the theme into a zip ready for Ghost Admin → Design → Upload theme.
// Copies only the files Ghost actually needs (theme templates, partials,
// compiled assets, package.json, license) into acta-cosmica/ and zips that —
// deliberately excludes node_modules, .git, dev scripts, and the
// still-Astro-era README/ATTRIBUTIONS/MARKETPLACE_PLAN docs, none of which
// Ghost needs to run the theme.
//
// Usage: npm run package

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const themeName = 'acta-cosmica';
const outDir = path.join(root, 'dist-theme');
const zipPath = path.join(outDir, `${themeName}.zip`);

// Staged outside the project root (in the OS temp dir) so a stray copy of
// the theme's .hbs files never lingers where `gscan .`/`npm test` would
// pick it up too — it did once, and silently confused gscan's
// notValidIn: 'author.hbs' exemption into flagging a false positive
// against the duplicate copy.
const stagingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'acta-cosmica-package-'));
const stagingDir = path.join(stagingRoot, themeName);

const rootHbsFiles = fs.readdirSync(root).filter((f) => f.endsWith('.hbs'));

const includes = [
  ...rootHbsFiles,
  'partials',
  'assets/css',
  'assets/js',
  'assets/built',
  'package.json',
  'LICENSE.md',
];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(stagingDir, { recursive: true });

try {
  for (const rel of includes) {
    const src = path.join(root, rel);
    if (!fs.existsSync(src)) {
      console.warn(`Skipping missing path: ${rel}`);
      continue;
    }
    const dest = path.join(stagingDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
  }

  execFileSync('zip', ['-r', '-q', zipPath, themeName], { cwd: stagingRoot });
} finally {
  fs.rmSync(stagingRoot, { recursive: true, force: true });
}

const { size } = fs.statSync(zipPath);
console.log(`Packaged ${themeName}.zip (${(size / 1024).toFixed(0)} KB) → ${path.relative(root, zipPath)}`);
