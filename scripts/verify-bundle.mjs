#!/usr/bin/env node
// Scan dist/client for private-secret patterns. Exits non-zero on match.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = "dist/client";
const PATTERNS = [
  { name: "supabase service role (sb_secret_*)", re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { name: "supabase service_role JWT claim", re: /"role"\s*:\s*"service_role"/ },
  { name: "supabase SERVICE_ROLE_KEY env leak", re: /SUPABASE_SERVICE_ROLE_KEY/ },
  { name: "database URL (postgres://)", re: /postgres(?:ql)?:\/\/[^"'\s]+/ },
  { name: "AWS access key id", re: /AKIA[0-9A-Z]{16}/ },
  { name: "generic private key block", re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if ([".js", ".mjs", ".cjs", ".html", ".css", ".json", ".map", ".txt"].includes(extname(p)))
      out.push(p);
  }
  return out;
}

let failed = false;
let files;
try {
  files = walk(ROOT);
} catch (err) {
  console.error(`verify:bundle — cannot read ${ROOT}. Run \`bun run build\` first.`);
  console.error(err.message);
  process.exit(2);
}

for (const file of files) {
  const contents = readFileSync(file, "utf8");
  for (const { name, re } of PATTERNS) {
    const m = contents.match(re);
    if (m) {
      failed = true;
      console.error(`✗ ${file}: matched ${name} → ${m[0].slice(0, 80)}`);
    }
  }
}

if (failed) {
  console.error("\nverify:bundle FAILED — private secret patterns present in client bundle.");
  process.exit(1);
}
console.log(`verify:bundle OK — scanned ${files.length} files under ${ROOT}, no private-secret matches.`);
