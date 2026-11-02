/**
 * Minimal static server for ./out that mimics Cloudflare static assets:
 * - auto trailing slash (308 to "/dir/" when "/dir/index.html" exists)
 * - 404.html with status 404 for unknown paths
 * - headers from public/_headers (copied to out/_headers)
 * Used by Playwright so E2E runs against the real export, CSP included.
 *
 * Usage: node scripts/serve-out.ts [--port 4173]
 */
import { createServer } from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'out');
const portArgIndex = process.argv.indexOf('--port');
const PORT = Number(portArgIndex > -1 ? process.argv[portArgIndex + 1] : (process.env.PORT ?? 4173));

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

type HeaderRule = { pattern: RegExp; headers: [string, string][] };

function parseHeadersFile(path: string): HeaderRule[] {
  if (!existsSync(path)) return [];
  const rules: HeaderRule[] = [];
  let current: HeaderRule | null = null;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const source = line.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      current = { pattern: new RegExp(`^${source}$`), headers: [] };
      rules.push(current);
    } else if (current) {
      const index = line.indexOf(':');
      current.headers.push([line.slice(0, index).trim(), line.slice(index + 1).trim()]);
    }
  }
  return rules;
}

const headerRules = parseHeadersFile(join(ROOT, '_headers'));

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function resolveRequest(pathname: string): { file: string; status: number } | { redirect: string } {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const target = join(ROOT, safe);
  if (!target.startsWith(ROOT)) return { file: join(ROOT, '404.html'), status: 404 };
  if (pathname.endsWith('/') && isFile(join(target, 'index.html'))) {
    return { file: join(target, 'index.html'), status: 200 };
  }
  if (!pathname.endsWith('/') && isFile(join(target, 'index.html'))) {
    return { redirect: `${pathname}/` };
  }
  if (isFile(target) && !safe.endsWith('_headers')) return { file: target, status: 200 };
  return { file: join(ROOT, '404.html'), status: 404 };
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const result = resolveRequest(url.pathname);
  if ('redirect' in result) {
    res.writeHead(308, { Location: result.redirect + url.search });
    res.end();
    return;
  }
  for (const rule of headerRules) {
    if (rule.pattern.test(url.pathname)) {
      for (const [name, value] of rule.headers) res.setHeader(name, value);
    }
  }
  // upgrade-insecure-requests would break plain-http localhost; drop it locally only.
  const csp = res.getHeader('Content-Security-Policy');
  if (typeof csp === 'string') {
    res.setHeader('Content-Security-Policy', csp.replace(/;\s*upgrade-insecure-requests/, ''));
  }
  res.setHeader('Content-Type', TYPES[extname(result.file)] ?? 'application/octet-stream');
  res.writeHead(result.status);
  res.end(readFileSync(result.file));
}).listen(PORT, () => {
  console.log(`Serving ${ROOT} at http://localhost:${PORT}`);
});
