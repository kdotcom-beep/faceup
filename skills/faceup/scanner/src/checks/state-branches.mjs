import { walk, jsxName, isComponentName, unwrapComponent } from '../ast.mjs';
import { indexProject } from '../project.mjs';

const RULES = {
  loading: 'faceup-missing-loading-state',
  error: 'faceup-missing-error-branch',
  empty: 'faceup-missing-empty-state',
};
const QUERY_HOOKS = new Set(['useQuery', 'useSWR', 'useInfiniteQuery', 'useLazyQuery', 'useQueries', 'useSWRInfinite']);
const SUSPENSE_HOOKS = new Set(['useSuspenseQuery', 'useSuspenseInfiniteQuery', 'useSuspenseQueries']);
const HTTP_ROOTS = new Set(['axios', 'supabase', 'ky', 'got']);
const LOADING_NAME = /load|pending|fetching|busy/i;
const ERROR_NAME = /^(e|err|error|errors)$|Error$|^isError$/;
const LOADING_MEMBER = new Set(['isLoading', 'isPending', 'isFetching', 'loading', 'status', 'isInitialLoading', 'fetching']);
const ERROR_MEMBER = new Set(['error', 'isError', 'errors']);
const LOADING_ELEMENT = /Skeleton|Spinner|Loader|Loading|CircularProgress|Shimmer|Progress/;
const EMPTY_ELEMENT = /Empty|NoResults|NoData|Placeholder/;
const LOADING_TEXT = /loading/i;
const EMPTY_TEXT = /\bno\s+[\w\s]{0,30}\b(yet|found|results?|items?|data|available|to show|match)\b|\bnothing\b|\bempty\b|there are no|you have no|you don't have|haven't/i;

function calleeName(call) {
  const callee = call.callee;
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression' || callee.type === 'OptionalMemberExpression') return callee.property.name;
  return '';
}

function memberRoot(node) {
  let root = node;
  while (root && (root.type === 'MemberExpression' || root.type === 'OptionalMemberExpression' || root.type === 'CallExpression' || root.type === 'OptionalCallExpression')) {
    root = root.type.endsWith('CallExpression') ? root.callee : root.object;
  }
  return root?.type === 'Identifier' ? root.name : null;
}

function isHttpCall(node) {
  if (node.type !== 'CallExpression' && node.type !== 'OptionalCallExpression') return false;
  if (node.callee.type === 'Identifier' && node.callee.name === 'fetch') return true;
  return HTTP_ROOTS.has(memberRoot(node.callee));
}

function isConsoleOnly(fnOrBlock) {
  let other = false;
  walk(fnOrBlock, (node) => {
    if (node.type === 'CallExpression' && memberRoot(node.callee) !== 'console') other = true;
    if (node.type === 'ThrowStatement') other = true;
  });
  return !other;
}

function moduleConstants(ast) {
  const names = new Set();
  for (const statement of ast.program.body) {
    if (statement.type === 'ImportDeclaration') statement.specifiers.forEach((s) => names.add(s.local.name));
    const decl = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (decl?.type === 'VariableDeclaration') decl.declarations.forEach((d) => d.id.type === 'Identifier' && names.add(d.id.name));
  }
  return names;
}

function localFunctionNames(body) {
  const names = new Map();
  walk(body, (node) => {
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && unwrapComponent(node.init)) names.set(node.id.name, node.init);
    if (node.type === 'FunctionDeclaration' && node.id) names.set(node.id.name, node);
  });
  return names;
}

function containsHttp(node) {
  let found = false;
  walk(node, (n) => {
    if (isHttpCall(n)) found = true;
  });
  return found;
}

function fetchingEffect(body) {
  const locals = localFunctionNames(body);
  const fetchingLocals = new Set([...locals].filter(([, fn]) => containsHttp(fn)).map(([name]) => name));
  let found = null;
  walk(body, (node) => {
    if (found || node.type !== 'CallExpression' || calleeName(node) !== 'useEffect') return;
    walk(node.arguments[0], (n) => {
      if (isHttpCall(n) || (n.type === 'CallExpression' && n.callee.type === 'Identifier' && fetchingLocals.has(n.callee.name))) found = node;
    });
  });
  return found;
}

function hookBindings(declarator) {
  const names = [];
  let object = null;
  if (declarator.id.type === 'Identifier') object = declarator.id.name;
  if (declarator.id.type === 'ObjectPattern') {
    for (const prop of declarator.id.properties) {
      if (prop.type !== 'ObjectProperty') continue;
      const key = prop.key.name ?? prop.key.value;
      const local = prop.value.type === 'Identifier' ? prop.value.name : prop.value.left?.name;
      if (local) names.push({ key, local });
    }
  }
  if (declarator.id.type === 'ArrayPattern') {
    declarator.id.elements.forEach((el) => el?.type === 'Identifier' && names.push({ key: el.name, local: el.name }));
  }
  return { names, object };
}

function referenceCounts(body) {
  const counts = new Map();
  walk(body, (node, parent) => {
    if (parent?.type === 'ObjectProperty' && parent.shorthand && node === parent.value) return;
    if (node.type === 'Identifier' || node.type === 'JSXIdentifier') counts.set(node.name, (counts.get(node.name) ?? 0) + 1);
  });
  return counts;
}

function loadScopes(body) {
  const locals = localFunctionNames(body);
  const scopes = [];
  walk(body, (node) => {
    if (node.type !== 'CallExpression' || calleeName(node) !== 'useEffect') return;
    const effect = node.arguments[0];
    scopes.push(effect);
    walk(effect, (n) => {
      if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && locals.has(n.callee.name)) scopes.push(locals.get(n.callee.name));
    });
  });
  return scopes;
}

function isProviderOnly(body) {
  const returned = [];
  walk(body, (node) => {
    if (node.type === 'ReturnStatement' && node.argument?.type === 'JSXElement') returned.push(node.argument);
    if (node.type === 'ArrowFunctionExpression' && node.body.type === 'JSXElement') returned.push(node.body);
  });
  return returned.length > 0 && returned.every((el) => /Provider$|Context/.test(jsxName(el.openingElement.name)));
}

const at = (node) => ({ line: node.loc.start.line, column: node.loc.start.column + 1 });

function dataSourcesOf(entry, project, memo) {
  if (memo.has(entry.key)) return memo.get(entry.key);
  memo.set(entry.key, []);
  const sources = [];
  walk(entry.fn.body, (node) => {
    if (node.type !== 'VariableDeclarator' || !node.init) return;
    const init = node.init.type === 'AwaitExpression' ? node.init.argument : node.init;
    if (init.type !== 'CallExpression') return;
    const name = calleeName(init);
    const source = { name, ...hookBindings(node), call: init, ...at(init) };
    if (SUSPENSE_HOOKS.has(name)) sources.push({ kind: 'suspense', ...source });
    else if (QUERY_HOOKS.has(name)) sources.push({ kind: 'query-hook', ...source });
    else if (/^use[A-Z]/.test(name) && name !== entry.name && project.resolveName(entry.file, name)) {
      const inner = dataSourcesOf(project.resolveName(entry.file, name), project, memo);
      if (inner.length && inner.every((s) => s.kind !== 'suspense')) sources.push({ kind: 'custom-hook', ...source });
    }
  });
  const effect = fetchingEffect(entry.fn.body);
  if (effect) sources.push({ kind: 'effect', name: 'useEffect', names: [], object: null, ...at(effect) });
  memo.set(entry.key, sources);
  return sources;
}

function analyseComponent(entry, sources, constants) {
  const body = entry.fn.body;
  const refs = referenceCounts(body);
  const used = (name) => (refs.get(name) ?? 0) > 1;
  const hookSources = sources.filter((s) => s.kind !== 'effect');
  const hasEffect = sources.some((s) => s.kind === 'effect');

  const texts = [];
  const elements = [];
  const members = new Set();
  const stateNames = [];
  const setters = new Map();
  const localArrays = new Set();
  const maps = [];
  let lengthCheck = false;
  let comparesError = false;
  const catches = [];
  const loadSetterCalls = new Set();
  for (const scope of loadScopes(body)) {
    walk(scope, (node) => {
      if (node.type === 'CallExpression' && calleeName(node) === 'catch' && node.callee.type === 'MemberExpression') catches.push(node.arguments[0]);
      if (node.type === 'TryStatement' && node.handler) catches.push(node.handler.body);
      if (node.type === 'CallExpression' && node.callee.type === 'Identifier') loadSetterCalls.add(node.callee.name);
    });
  }
  walk(body, (node) => {
    if (node.type === 'JSXText' || node.type === 'StringLiteral') texts.push(node.value);
    if (node.type === 'TemplateLiteral') texts.push(node.quasis.map((q) => q.value.cooked).join(' '));
    if (node.type === 'JSXOpeningElement') elements.push(jsxName(node.name));
    if ((node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression') && node.property.type === 'Identifier') members.add(node.property.name);
    const test = node.type === 'IfStatement' || node.type === 'ConditionalExpression' ? node.test : node.type === 'LogicalExpression' ? node.left : null;
    if (test) walk(test, (n) => {
      if ((n.type === 'MemberExpression' || n.type === 'OptionalMemberExpression') && n.property.name === 'length') lengthCheck = true;
    });
    if (node.type === 'BinaryExpression' && /^[!=]==?$/.test(node.operator) && [node.left, node.right].some((side) => side.type === 'StringLiteral' && side.value === 'error')) comparesError = true;
    if (node.type === 'SwitchCase' && node.test?.type === 'StringLiteral' && node.test.value === 'error') comparesError = true;
    if (node.type === 'VariableDeclarator' && node.init?.type === 'CallExpression' && calleeName(node.init) === 'useState' && node.id.type === 'ArrayPattern') {
      const [value, setter] = node.id.elements;
      if (value?.type === 'Identifier') stateNames.push(value.name);
      if (value?.type === 'Identifier' && setter?.type === 'Identifier') setters.set(value.name, setter.name);
      const seed = node.init.arguments[0];
      if (value?.type === 'Identifier' && seed?.type === 'ArrayExpression' && seed.elements.length) localArrays.add(value.name);
    }
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.init?.type === 'ArrayExpression') localArrays.add(node.id.name);
    if ((node.type === 'CallExpression' || node.type === 'OptionalCallExpression') && calleeName(node) === 'map' && node.callee.object) {
      let jsx = false;
      walk(node.arguments[0], (n) => {
        if (n.type === 'JSXElement') jsx = true;
      });
      const target = node.callee.object;
      const root = memberRoot(target);
      const staticList = target.type === 'ArrayExpression' || (root && (localArrays.has(root) || (constants.has(root) && !stateNames.includes(root))));
      if (jsx && !staticList) maps.push(at(node));
    }
  });

  const hookSaysLoading = hookSources.some(
    (s) => s.names.some((n) => (LOADING_MEMBER.has(n.key) || LOADING_NAME.test(n.local)) && used(n.local)) || (s.object && used(s.object) && [...members].some((m) => LOADING_MEMBER.has(m))),
  );
  const stateSaysLoading = stateNames.some((n) => LOADING_NAME.test(n) && used(n));
  const uiSaysLoading = elements.some((e) => LOADING_ELEMENT.test(e)) || texts.some((t) => LOADING_TEXT.test(t));
  const suspense = sources.some((s) => s.kind === 'suspense');
  const loading = suspense ? 'boundary' : hookSaysLoading || stateSaysLoading || uiSaysLoading ? 'handled' : 'missing';

  const hookSaysError = hookSources.some(
    (s) =>
      s.names.some((n) => (ERROR_MEMBER.has(n.key) || ERROR_NAME.test(n.local) || (n.key === 'status' && comparesError)) && used(n.local)) ||
      (s.object && [...members].some((m) => ERROR_MEMBER.has(m) || (m === 'status' && comparesError))) ||
      s.call?.arguments.some((a) => a.type === 'ObjectExpression' && a.properties.some((p) => p.key?.name === 'onError')),
  );
  const stateSaysError = stateNames.some((n) => ERROR_NAME.test(n) && used(n) && loadSetterCalls.has(setters.get(n)));
  const realCatch = catches.some((c) => c && !isConsoleOnly(c));
  let error = suspense ? 'boundary' : hookSaysError || stateSaysError || realCatch ? 'handled' : 'missing';
  if (error === 'missing' && hasEffect && catches.length) error = 'logs-only';
  if (error === 'missing' && !hasEffect && hookSources.every((s) => s.kind === 'custom-hook')) error = 'could-not-tell';

  const uiSaysEmpty = elements.some((e) => EMPTY_ELEMENT.test(e)) || texts.some((t) => EMPTY_TEXT.test(t));
  const empty = !maps.length ? 'n/a' : lengthCheck || uiSaysEmpty ? 'handled' : 'missing';

  return { loading, error, empty, maps };
}

function describe(source) {
  return source.kind === 'effect' ? 'a fetch in useEffect' : source.name;
}

export const stateBranches = {
  name: 'state-branches',
  rules: Object.values(RULES),
  run(project) {
    const index = indexProject(project.files);
    const constantsByFile = new Map(project.files.map(({ path, ast }) => [path, moduleConstants(ast)]));
    const memo = new Map();
    const findings = [];
    const notAssessed = [];
    for (const entry of index.entries) {
      if (!isComponentName(entry.name) || isProviderOnly(entry.fn.body)) continue;
      const sources = dataSourcesOf(entry, index, memo);
      if (!sources.length) continue;
      const result = analyseComponent(entry, sources, constantsByFile.get(entry.file));
      const loadSource = sources.find((s) => s.kind !== 'suspense');
      const base = { file: entry.file, component: entry.name };
      if (result.loading === 'missing') {
        findings.push({ ...base, rule: RULES.loading, line: loadSource.line, column: loadSource.column, message: `Loads data with ${describe(loadSource)} but shows nothing while it waits.` });
      }
      if (result.error === 'missing') {
        findings.push({ ...base, rule: RULES.error, line: loadSource.line, column: loadSource.column, message: `If ${describe(loadSource)} fails, the user is not told: nothing reads its error, catches it, or handles onError.` });
      }
      if (result.error === 'logs-only') {
        findings.push({ ...base, rule: RULES.error, line: loadSource.line, column: loadSource.column, message: 'If this load fails, the error is only logged to the console; the user is not told.' });
      }
      if (result.error === 'could-not-tell') notAssessed.push({ ...base, rule: RULES.error, reason: `error handling may live inside ${loadSource.name}` });
      if (result.empty === 'missing') {
        const [first] = result.maps;
        findings.push({ ...base, rule: RULES.empty, line: first.line, column: first.column, message: 'Renders a list of fetched data with no branch for when it is empty.' });
      }
    }
    return { findings, notAssessed };
  },
};
