#!/usr/bin/env node
/**
 * generate-build-info.js
 * Schreibt build-info.json mit aktuellem Git-Commit-Hash, Datum und Message.
 * Wird vor dem electron-builder-Packaging ausgeführt.
 */
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'build-info.json');

let sha = 'unknown';
let date = 'unknown';
let message = '';

try {
  sha     = execSync('git rev-parse HEAD').toString().trim();
  date    = execSync('git log -1 --format=%ci').toString().trim();
  message = execSync('git log -1 --format=%s').toString().trim();
} catch {
  console.warn('[build-info] Not a git repo – using defaults');
}

const info = { sha, date, message, builtAt: new Date().toISOString() };
writeFileSync(OUT, JSON.stringify(info, null, 2));
console.log('[build-info] Written:', OUT);
console.log('[build-info]', info);
