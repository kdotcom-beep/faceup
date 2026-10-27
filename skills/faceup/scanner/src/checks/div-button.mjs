import { walk, jsxName } from '../ast.mjs';

const RULE = 'faceup-div-as-button';
const STATIC = new Set([
  'div', 'span', 'p', 'li', 'ul', 'ol', 'dl', 'dt', 'dd', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav',
  'figure', 'figcaption', 'table', 'tbody', 'thead', 'tr', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'i', 'b', 'strong', 'em', 'small', 'img', 'svg', 'path', 'g', 'circle', 'rect',
]);
const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'checkbox', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'radio', 'switch', 'tab',
  'treeitem', 'combobox', 'slider', 'spinbutton', 'textbox', 'searchbox', 'gridcell', 'row',
]);
const REAL_CONTROLS = new Set(['button', 'a', 'input', 'select', 'textarea', 'label', 'summary']);
const CONTROL_COMPONENT = /(^|\.)(Button|Link|NavLink|Input|Checkbox|Radio|Switch|Select|Toggle)$/;
const BACKDROP = /overlay|backdrop|scrim|dimmer|underlay|modal-bg|mask/i;
const MESSAGES = {
  plain: 'This can be clicked but is a plain element, so keyboard users cannot reach it and screen readers do not announce it as a button.',
  noFocus: 'Screen readers announce this as a control, but keyboard users cannot reach it with the Tab key.',
  noRole: 'Keyboard users can reach this, but screen readers are not told it is a button, so users do not know it does anything.',
  noKeys: 'Keyboard users can reach this control, but pressing Enter or Space does nothing.',
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

function staticValue(attr) {
  if (!attr.value) return true;
  if (attr.value.type === 'StringLiteral') return attr.value.value;
  const expr = attr.value.expression;
  if (expr?.type === 'StringLiteral' || expr?.type === 'NumericLiteral') return expr.value;
  if (expr?.type === 'UnaryExpression' && expr.operator === '-' && expr.argument.type === 'NumericLiteral') return -expr.argument.value;
  return null;
}

function hasRole(map) {
  const attr = map.get('role');
  if (!attr) return false;
  const value = staticValue(attr);
  return value === null || INTERACTIVE_ROLES.has(value);
}

function isFocusable(map) {
  const attr = map.get('tabIndex');
  if (!attr) return false;
  const value = staticValue(attr);
  return value === null || Number(value) >= 0;
}

function onlyStopsPropagation(attr) {
  const fn = attr.value?.expression;
  if (fn?.type !== 'ArrowFunctionExpression' && fn?.type !== 'FunctionExpression') return false;
  const calls = fn.body.type === 'BlockStatement' ? fn.body.body.map((s) => s.type === 'ExpressionStatement' && s.expression) : [fn.body];
  return calls.length > 0 && calls.every((c) => c?.type === 'CallExpression' && ['stopPropagation', 'preventDefault'].includes(c.callee.property?.name));
}

function classText(map) {
  const attr = map.get('className') ?? map.get('class');
  if (!attr) return '';
  const parts = [];
  walk(attr, (node) => {
    if (node.type === 'StringLiteral') parts.push(node.value);
    if (node.type === 'TemplateElement') parts.push(node.value.cooked);
    if (node.type === 'Identifier') parts.push(node.name);
  });
  return parts.join(' ');
}

function wrapsControl(element) {
  let found = false;
  element.children.forEach((child) =>
    walk(child, (node) => {
      if (node.type !== 'JSXOpeningElement') return;
      const name = jsxName(node.name);
      if (REAL_CONTROLS.has(name) || CONTROL_COMPONENT.test(name)) found = true;
    }),
  );
  return found;
}

export const divButton = {
  name: 'div-button',
  rules: [RULE],
  run(project) {
    const findings = [];
    const notAssessed = [];
    for (const { path, ast } of project.files) {
      walk(ast, (node) => {
        if (node.type !== 'JSXElement') return;
        const opening = node.openingElement;
        if (!STATIC.has(jsxName(opening.name))) return;
        const { map, spread } = attributes(opening);
        const click = map.get('onClick');
        if (!click || onlyStopsPropagation(click)) return;
        const role = hasRole(map);
        const focus = isFocusable(map);
        const keys = ['onKeyDown', 'onKeyUp', 'onKeyPress'].some((k) => map.has(k));
        if (role && focus && keys) return;
        const base = { file: path, rule: RULE };
        if (spread) {
          notAssessed.push({ ...base, reason: 'props passed through to this element may make it a control' });
          return;
        }
        if (BACKDROP.test(classText(map))) {
          notAssessed.push({ ...base, reason: 'looks like a backdrop that may repeat a close button' });
          return;
        }
        if (wrapsControl(node)) {
          notAssessed.push({ ...base, reason: 'wraps a real control that may do the same job' });
          return;
        }
        let message = MESSAGES.noKeys;
        if (!role && !focus) message = MESSAGES.plain;
        else if (!focus) message = MESSAGES.noFocus;
        else if (!role) message = MESSAGES.noRole;
        findings.push({ ...base, line: opening.loc.start.line, column: opening.loc.start.column + 1, message });
      });
    }
    return { findings, notAssessed };
  },
};
