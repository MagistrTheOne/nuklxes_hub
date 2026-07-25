/**
 * Metro cannot resolve extensionless ESM re-exports in @anam-ai/js-sdk's
 * dist/module build. Point "module" at the CJS build and rewrite any remaining
 * relative ESM imports to include .js.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'node_modules', '@anam-ai', 'js-sdk');
const pkgPath = path.join(root, 'package.json');

if (!fs.existsSync(pkgPath)) {
  console.warn('[patch-anam-sdk] @anam-ai/js-sdk not installed — skip');
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.main = 'dist/main/index.js';
pkg.module = 'dist/main/index.js';
pkg.exports = {
  '.': {
    types: './dist/module/index.d.ts',
    import: './dist/main/index.js',
    require: './dist/main/index.js',
    default: './dist/main/index.js',
  },
};
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;

    const source = fs.readFileSync(full, 'utf8');
    const next = source.replace(
      /(from\s+|import\s*\(\s*)['"](\.[^'"]+)['"]/g,
      (match, prefix, spec) => {
        if (/\.(js|json|node|mjs|cjs)$/.test(spec)) {
          return match;
        }
        const base = path.resolve(path.dirname(full), spec);
        if (fs.existsSync(`${base}.js`)) {
          return `${prefix}'${spec}.js'`;
        }
        if (fs.existsSync(path.join(base, 'index.js'))) {
          return `${prefix}'${spec}/index.js'`;
        }
        return match;
      },
    );

    if (next !== source) {
      fs.writeFileSync(full, next);
    }
  }
}

walk(path.join(root, 'dist', 'module'));
console.log('[patch-anam-sdk] patched @anam-ai/js-sdk for Metro');
