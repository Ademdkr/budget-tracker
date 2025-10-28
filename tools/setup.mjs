import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();

function exists(p) {
  return fs.existsSync(p);
}

function read(fp) {
  return fs.readFileSync(fp, 'utf8');
}

function write(fp, content) {
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, content, 'utf8');
  console.log('✔ updated', path.relative(cwd, fp));
}

function replaceInFile(fp, replacements) {
  if (!exists(fp)) return;
  let s = read(fp);
  for (const [from, to] of Object.entries(replacements)) {
    const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    s = s.replace(re, to);
  }
  write(fp, s);
}

function copyIfMissing(src, dst) {
  if (!exists(src)) return;
  if (!exists(dst)) write(dst, read(src));
}

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, ...rest] = a.split('=');
  return [k.replace(/^--/, ''), rest.join('=')];
}));

// ---- Eingaben / Defaults
const APP_NAME = args.name || 'My App';
const APP_SLUG = (args.slug || APP_NAME)
  .toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
const PORT_WEB = String(args.portWeb || 4201);
const PORT_API = String(args.portApi || 3001);
const GITHUB_USER = args.user || 'YOUR_GITHUB_USERNAME';
const DATE = new Date().toISOString().slice(0, 10);

// ---- Ersetzungen
const replacements = {
  '__APP_NAME__': APP_NAME,
  '__APP_SLUG__': APP_SLUG,
  '__APP_TITLE__': APP_NAME,
  '__APP_SUMMARY__': 'Kurze Beschreibung…',
  '__PORT_WEB__': PORT_WEB,
  '__PORT_API__': PORT_API,
  '__GITHUB_USER__': GITHUB_USER,
  '__DATE_YYYY_MM_DD__': DATE,
  // Scope @template/* -> @<slug>/*
  '@template/frontend': `@${APP_SLUG}/frontend`,
  '@template/backend': `@${APP_SLUG}/backend`,
  '@template/worker': `@${APP_SLUG}/worker`
};

// ---- Ziel-Dateien gezielt ersetzen
const files = [
  // Root
  'package.json',
  '.env.example',
  '.env',
  'portfolio.project.json',
  // Frontend
  'apps/frontend/package.json',
  'apps/frontend/.env.example',
  'apps/frontend/proxy.conf.json',
  'apps/frontend/tsconfig.json',
  'apps/frontend/tsconfig.app.json',
  'apps/frontend/tsconfig.spec.json',
  // Backend
  'apps/backend/package.json',
  'apps/backend/.env.example',
  'apps/backend/tsconfig.json',
  'apps/backend/tsconfig.build.json',
  'apps/backend/nest-cli.json',
  'apps/backend/wrangler.toml',
  // Worker
  'apps/worker/package.json',
  'apps/worker/.env.example',
  'apps/worker/wrangler.toml',
  // (optional) Environments
  'apps/frontend/src/environments/environment.ts',
  'apps/frontend/src/environments/environment.development.ts',
  'docker-compose.yml'
].map(p => path.join(cwd, p));

for (const f of files) replaceInFile(f, replacements);

// ---- .env aus .env.example erstellen/aktualisieren
const envExample = path.join(cwd, '.env.example');
const envFile = path.join(cwd, '.env');
if (exists(envExample)) {
  // Basis holen
  let envContent = read(envExample);
  // Platzhalter nochmal hart ersetzen
  for (const [from, to] of Object.entries(replacements)) {
    const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    envContent = envContent.replace(re, to);
  }
  write(envFile, envContent);
}

// ---- Abschluss-Info
console.log(`\nDone. Values:
  APP_NAME=${APP_NAME}
  APP_SLUG=${APP_SLUG}
  PORT_WEB=${PORT_WEB}
  PORT_API=${PORT_API}
  GITHUB_USER=${GITHUB_USER}
  DATE=${DATE}
`);
