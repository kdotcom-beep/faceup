import { walk } from '../ast.mjs';

const RULE = 'faceup-aria-references-missing-id';
const MESSAGES = {
  'aria-labelledby': 'This takes its name from text that does not exist on the page, so a screen reader may announce it with no name.',
  'aria-describedby': 'This points to a hint that does not exist on the page, so screen reader users never hear it.',
  'aria-controls': 'This claims to control a part of the page that does not exist, so screen readers describe a connection that is not there.',
};
const ID_ATTR = /^id$|Id$/;

function attrName(attr) {
  return attr.name.type === 'JSXIdentifier' ? attr.name.name : '';
}

function literalTokens(expr) {
  if (!expr) return [];
  if (expr.type === 'StringLiteral') return expr.value.split(/\s+/).filter(Boolean);
  if (expr.type === 'TemplateLiteral' && !expr.expressions.length) return expr.quasis[0].value.cooked.split(/\s+/).filter(Boolean);
  if (expr.type === 'NullLiteral' || expr.type === 'BooleanLiteral' || (expr.type === 'Identifier' && expr.name === 'undefined')) return [];
  if (expr.type === 'ConditionalExpression') {
    const [a, b] = [literalTokens(expr.consequent), literalTokens(expr.alternate)];
    return a && b ? [...a, ...b] : null;
  }
  if (expr.type === 'LogicalExpression') {
    if (expr.operator === '&&') return literalTokens(expr.right);
    const [a, b] = [literalTokens(expr.left), literalTokens(expr.right)];
    return a && b ? [...a, ...b] : null;
  }
  return null;
}

function attrTokens(attr) {
  if (!attr.value) return [];
  if (attr.value.type === 'StringLiteral') return literalTokens(attr.value);
  if (attr.value.type === 'JSXExpressionContainer') return literalTokens(attr.value.expression);
  return null;
}

function templatePattern(template) {
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${template.quasis.map((q) => escape(q.value.cooked)).join('.+')}$`);
}

function indexFile(ast) {
  const references = [];
  const ids = new Set();
  const idPatterns = [];
  const strings = new Set();
  const referenceValues = new Set();
  walk(ast, (node) => {
    if (node.type === 'JSXAttribute' && MESSAGES[attrName(node)]) {
      references.push(node);
      if (node.value) referenceValues.add(node.value.type === 'JSXExpressionContainer' ? node.value.expression : node.value);
    }
    if (node.type === 'JSXAttribute' && ID_ATTR.test(attrName(node)) && node.value) {
      const tokens = attrTokens(node);
      if (tokens) tokens.forEach((t) => ids.add(t));
      const expr = node.value.type === 'JSXExpressionContainer' ? node.value.expression : null;
      if (expr?.type === 'TemplateLiteral' && expr.expressions.length) idPatterns.push(templatePattern(expr));
    }
    if (node.type === 'ObjectProperty' && ID_ATTR.test(node.key.name ?? node.key.value ?? '') && node.value.type === 'StringLiteral') ids.add(node.value.value);
  });
  walk(ast, (node) => {
    if (referenceValues.has(node)) return false;
    if (node.type === 'StringLiteral') node.value.split(/\s+/).forEach((t) => t && strings.add(t));
    if (node.type === 'TemplateLiteral') node.quasis.forEach((q) => strings.add(q.value.cooked.trim()));
    return true;
  });
  return { references, ids, idPatterns, strings };
}

export const ariaReferences = {
  name: 'aria-references',
  rules: [RULE],
  run(project) {
    const indexed = project.files.map((file) => ({ file, ...indexFile(file.ast) }));
    const projectIds = new Set();
    const projectStrings = new Set();
    for (const { ids, strings } of indexed) {
      ids.forEach((id) => projectIds.add(id));
      strings.forEach((s) => projectStrings.add(s));
    }
    const findings = [];
    const notAssessed = [];
    for (const { file, references, ids, idPatterns, strings } of indexed) {
      for (const attr of references) {
        const name = attrName(attr);
        const tokens = attrTokens(attr);
        if (!tokens) {
          notAssessed.push({ file: file.path, rule: RULE, reason: `${name} is built at run time, so its target cannot be read from the code` });
          continue;
        }
        const missing = tokens.filter((t) => !ids.has(t));
        if (!missing.length) continue;
        const elsewhere = missing.filter((t) => strings.has(t) || idPatterns.some((p) => p.test(t)) || projectIds.has(t) || projectStrings.has(t));
        if (elsewhere.length) {
          notAssessed.push({ file: file.path, rule: RULE, reason: `${name} target "${elsewhere.join(' ')}" may be set up elsewhere in the code` });
          continue;
        }
        findings.push({ file: file.path, line: attr.loc.start.line, column: attr.loc.start.column + 1, rule: RULE, message: MESSAGES[name] });
      }
    }
    return { findings, notAssessed };
  },
};
