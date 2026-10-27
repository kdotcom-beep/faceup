import { walk, jsxName } from '../ast.mjs';

const RULE = 'faceup-control-missing-name';
const DYNAMIC = Symbol('dynamic');
const ICON = /Icon|Svg|^(Fa|Hi|Md|Lu|Io|Ri|Tb|Bs|Fi|Bi|Gi|Pi|Si)[A-Z0-9]/;
const TEXT_COMPONENT = /^(Trans|FormattedMessage|Translate|Text|VisuallyHidden|SrOnly|ScreenReaderOnly)$/;
const ICON_PACKAGE = /icon|lucide|feather|phosphor/i;
const NAME_PROP = /^(label|title|text|tooltip)$|(Label|Title|Text|Tooltip)$/;
const MESSAGES = {
  button: 'This button has no words a screen reader can read out, so it is announced only as "button" with no purpose.',
  link: 'This link has no words a screen reader can read out, so it is announced only as "link" with no destination.',
};

function attributes(opening) {
  const map = new Map();
  let spread = false;
  for (const attr of opening.attributes) {
    if (attr.type === 'JSXSpreadAttribute') spread = true;
    else if (attr.name.type === 'JSXIdentifier') map.set(attr.name.name, attr);
  }
  return { map, spread };
}

function valueOf(attr) {
  if (!attr) return undefined;
  if (!attr.value) return true;
  if (attr.value.type === 'StringLiteral') return attr.value.value;
  const expr = attr.value.expression;
  if (expr?.type === 'StringLiteral' || expr?.type === 'BooleanLiteral') return expr.value;
  if (expr?.type === 'TemplateLiteral' && !expr.expressions.length) return expr.quasis[0].value.cooked;
  if (expr?.type === 'NullLiteral' || (expr?.type === 'Identifier' && expr.name === 'undefined')) return undefined;
  return DYNAMIC;
}

const gives = (value) => value === DYNAMIC || (typeof value === 'string' && value.trim() !== '');

function hasNameAttr(map) {
  return ['aria-label', 'aria-labelledby', 'title'].some((name) => gives(valueOf(map.get(name))));
}

function isHidden(map) {
  const value = valueOf(map.get('aria-hidden'));
  return value === true || value === 'true' || map.has('hidden');
}

function combine(results) {
  if (results.includes('named')) return 'named';
  if (results.includes('unknown')) return 'unknown';
  return 'none';
}

function either(a, b) {
  if (a === b) return a;
  return a === 'named' && b === 'named' ? 'named' : 'unknown';
}

function exprName(expr, icons) {
  if (!expr || expr.type === 'JSXEmptyExpression' || expr.type === 'NullLiteral' || expr.type === 'BooleanLiteral') return 'none';
  if (expr.type === 'Identifier' && expr.name === 'undefined') return 'none';
  if (expr.type === 'JSXElement') return elementName(expr, icons);
  if (expr.type === 'JSXFragment') return childrenName(expr.children, icons);
  if (expr.type === 'StringLiteral') return expr.value.trim() ? 'named' : 'none';
  if (expr.type === 'ConditionalExpression') return either(exprName(expr.consequent, icons), exprName(expr.alternate, icons));
  if (expr.type === 'LogicalExpression') return expr.operator === '&&' ? exprName(expr.right, icons) : either(exprName(expr.left, icons), exprName(expr.right, icons));
  if (expr.type === 'Identifier' && /icon/i.test(expr.name)) return 'unknown';
  if (expr.type === 'Identifier' && expr.name === 'children') return 'unknown';
  return 'named';
}

function childrenName(children, icons) {
  return combine(
    children.map((child) => {
      if (child.type === 'JSXText') return child.value.trim() ? 'named' : 'none';
      if (child.type === 'JSXExpressionContainer') return exprName(child.expression, icons);
      if (child.type === 'JSXSpreadChild') return 'unknown';
      return exprName(child, icons);
    }),
  );
}

function elementName(element, icons) {
  const opening = element.openingElement;
  const name = jsxName(opening.name);
  const { map, spread } = attributes(opening);
  if (isHidden(map)) return 'none';
  if (hasNameAttr(map)) return 'named';
  if (map.has('dangerouslySetInnerHTML')) return 'unknown';
  if (name === 'img' || name === 'Image') {
    if (gives(valueOf(map.get('alt')))) return 'named';
    return spread ? 'unknown' : 'none';
  }
  if (name === 'svg') {
    const titled = element.children.some((c) => c.type === 'JSXElement' && jsxName(c.openingElement.name) === 'title' && childrenName(c.children, icons) === 'named');
    return titled ? 'named' : 'none';
  }
  if (/^[a-z]/.test(name)) return childrenName(element.children, icons);
  if (TEXT_COMPONENT.test(name)) return 'named';
  if (ICON.test(name) || icons.has(name)) {
    if (gives(valueOf(map.get('alt')))) return 'named';
    return spread ? 'unknown' : 'none';
  }
  return 'unknown';
}

function iconImports(ast) {
  const names = new Set();
  for (const statement of ast.program.body) {
    if (statement.type === 'ImportDeclaration' && ICON_PACKAGE.test(statement.source.value)) statement.specifiers.forEach((s) => names.add(s.local.name));
  }
  return names;
}

function controlKind(name, map) {
  if (name === 'button') return { kind: 'button', component: false };
  if (name === 'a' && map.has('href')) return { kind: 'link', component: false };
  if (name === 'Link' || name === 'NavLink') return { kind: 'link', component: true };
  if (name === 'Button' || name.endsWith('.Button')) return { kind: 'button', component: true };
  if (/^[a-z]/.test(name)) {
    const role = valueOf(map.get('role'));
    if (role === 'button' || role === 'link') return { kind: role, component: false };
  }
  return null;
}

export const controlName = {
  name: 'control-name',
  rules: [RULE],
  run(project) {
    const findings = [];
    const notAssessed = [];
    for (const { path, ast } of project.files) {
      const icons = iconImports(ast);
      walk(ast, (node) => {
        if (node.type !== 'JSXElement') return;
        const opening = node.openingElement;
        const { map, spread } = attributes(opening);
        const control = controlKind(jsxName(opening.name), map);
        if (!control || hasNameAttr(map)) return;
        if (control.component && [...map].some(([k, attr]) => NAME_PROP.test(k) && gives(valueOf(attr)))) return;
        const content = map.has('dangerouslySetInnerHTML') ? 'unknown' : childrenName(node.children, icons);
        if (content === 'named') return;
        const base = { file: path, rule: RULE };
        if (spread) {
          notAssessed.push({ ...base, reason: 'props passed through to this control may give it a name' });
          return;
        }
        if (content === 'unknown') {
          notAssessed.push({ ...base, reason: 'its content comes from another component or value the check cannot read' });
          return;
        }
        if (control.component && !node.children.length) {
          notAssessed.push({ ...base, reason: `${jsxName(opening.name)} has no content, so its name may come from its own props` });
          return;
        }
        findings.push({ ...base, line: opening.loc.start.line, column: opening.loc.start.column + 1, message: MESSAGES[control.kind] });
      });
    }
    return { findings, notAssessed };
  },
};
