// Реальная аналитика админки (src/data/live/*.json – Метрика, места в выдаче) в публичном репозитории лежит только
// зашифрованной: src/data/sealed/*.json.enc, ключ – логин и пароль админки (admin-crypto.mjs).
//   node scripts/seal-data.mjs        – зашифровать src/data/live → src/data/sealed (зовёт real-analytics.py)
//   node scripts/seal-data.mjs --open – расшифровать перед сборкой (workflow, секреты ADMIN_LOGIN / ADMIN_PASS)
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { credentials, seal, secretOf } from './admin-crypto.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const LIVE = path.join(ROOT, 'src', 'data', 'live');
const SEALED = path.join(ROOT, 'src', 'data', 'sealed');
const secret = secretOf(credentials());

function open(box) {
  const b = (x) => Buffer.from(x, 'base64');
  const key = crypto.pbkdf2Sync(secret, b(box.salt), box.iter, 32, 'sha256');
  const raw = b(box.data);
  const d = crypto.createDecipheriv('aes-256-gcm', key, b(box.iv));
  d.setAuthTag(raw.subarray(raw.length - 16));
  return Buffer.concat([d.update(raw.subarray(0, raw.length - 16)), d.final()]).toString('utf8');
}

if (process.argv.includes('--open')) {
  fs.mkdirSync(LIVE, { recursive: true });
  for (const f of fs.readdirSync(SEALED).filter((x) => x.endsWith('.json.enc'))) {
    fs.writeFileSync(path.join(LIVE, f.replace(/\.enc$/, '')), open(JSON.parse(fs.readFileSync(path.join(SEALED, f), 'utf8'))));
    console.log('открыт', f);
  }
} else {
  fs.mkdirSync(SEALED, { recursive: true });
  for (const f of fs.readdirSync(LIVE).filter((x) => x.endsWith('.json'))) {
    const text = fs.readFileSync(path.join(LIVE, f), 'utf8');
    fs.writeFileSync(path.join(SEALED, `${f}.enc`), JSON.stringify(seal(text, secret)));
    console.log('зашифрован', f);
  }
}
