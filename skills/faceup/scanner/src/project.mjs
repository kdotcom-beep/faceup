import { basename, dirname, join, resolve } from 'node:path';
import { walk, isComponentName, unwrapComponent } from './ast.mjs';

const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

const isNamed = (name) => Boolean(name) && (isComponentName(name) || /^use[A-Z]/.test(name));
const isLazyImport = (fn) => fn.body?.type === 'ImportExpression' || (fn.body?.type === 'CallExpression' && fn.body.callee.type === 'Import');

function nearestSrc(file) {
  let dir = dirname(file);
  while (dir !== dirname(dir)) {
    if (basename(dir) === 'src') return dir;
    dir = dirname(dir);
  }
  return null;
}

function resolveSpecifier(from, specifier, known) {
  let base = null;
  if (specifier.startsWith('.')) base = resolve(dirname(from), specifier);
  else if (/^[@~]\//.test(specifier)) {
    const src = nearestSrc(from);
    if (src) base = join(src, specifier.slice(2));
  }
  if (!base) return null;
  const candidates = [base, ...EXTENSIONS.map((ext) => base + ext), ...EXTENSIONS.map((ext) => join(base, `index${ext}`))];
  return candidates.find((c) => known.has(c)) ?? null;
}

// Indexes every component and hook by file, and resolves a name used in one file to the
// function it refers to: same file first, then that file's imports, then a project-wide
// name only when exactly one function has it.
export function indexProject(files) {
  const known = new Set(files.map((f) => f.path));
  const entries = new Map();
  const byName = new Map();
  const defaults = new Map();
  const imports = new Map();

  for (const { path, ast } of files) {
    const add = (name, fn) => {
      const key = `${path}#${name}`;
      if (!isNamed(name) || !fn || isLazyImport(fn) || entries.has(key)) return;
      const entry = { key, name, fn, file: path };
      entries.set(key, entry);
      byName.set(name, [...(byName.get(name) ?? []), entry]);
    };
    walk(ast, (node) => {
      if (node.type === 'FunctionDeclaration') add(node.id?.name, node);
      if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') add(node.id.name, unwrapComponent(node.init));
    });

    const fileImports = new Map();
    for (const statement of ast.program.body) {
      if (statement.type === 'ImportDeclaration') {
        const target = resolveSpecifier(path, statement.source.value, known);
        for (const s of statement.specifiers) {
          const imported = s.type === 'ImportDefaultSpecifier' ? 'default' : s.imported?.name ?? s.imported?.value;
          fileImports.set(s.local.name, { target, imported });
        }
      }
      if (statement.type === 'ExportDefaultDeclaration') {
        const decl = statement.declaration;
        const name = decl.id?.name ?? (decl.type === 'Identifier' ? decl.name : null);
        if (name) defaults.set(path, name);
      }
    }
    imports.set(path, fileImports);
  }

  function resolveName(fromFile, name) {
    const local = entries.get(`${fromFile}#${name}`);
    if (local) return local;
    const imported = imports.get(fromFile)?.get(name);
    if (imported?.target) {
      const targetName = imported.imported === 'default' ? defaults.get(imported.target) : imported.imported;
      const entry = entries.get(`${imported.target}#${targetName}`);
      if (entry) return entry;
    }
    const candidates = byName.get(name) ?? [];
    return candidates.length === 1 ? candidates[0] : null;
  }

  return { entries: [...entries.values()], resolveName };
}
