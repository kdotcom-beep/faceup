import { walk, jsxName, isComponentName } from '../ast.mjs';
import { indexProject } from '../project.mjs';

const RULES = {
  autocomplete: 'faceup-autocomplete-missing',
  placeholder: 'faceup-placeholder-as-label',
  paste: 'faceup-paste-blocked-password',
};
const HOST_FIELDS = new Set(['input', 'textarea', 'select']);
const NO_TEXT_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image', 'checkbox', 'radio', 'file', 'range', 'color']);
const FIELD_COMPONENT = /(Input|Field|TextArea|Textarea|Select)$/;
const LABEL_ELEMENT = /^(label|legend)$|Label$/;
const NAMING_ATTRS = ['aria-label', 'aria-labelledby', 'title'];
const COMPONENT_LABEL_PROPS = ['label', 'labeltext', 'aria-label', 'aria-labelledby', 'title'];
const AUTOFILL_OFF = new Set(['off', 'false', 'nope', 'none', 'disabled']);
const PURPOSES = {
  name: 'name',
  email: 'email',
  address: 'address',
  tel: 'phone number',
  card: 'card',
};
const OTHER_PERSON = /\b(invite|invitee|invitees|guest|recipient|client|customer|member|patient|candidate|lead|referee|reference|emergency|parent|guardian|friend|colleague|teammate|manager|supervisor|spouse|beneficiary|employer|company|business|organization|organisation|team|workspace|org|vendor|supplier|landlord|agent|owner|doctor|physician|insurance|kin|sender|attendee|student|employee)\b/;
const NOT_PERSONAL = /\b(search|filter|query|template|subject|body|message|content|signature|domain|provider|campaign|notification|notifications|settings|frequency|ip|wallet|web|url|website|site|server|mac|contract|crypto|file|gift|id card|loyalty|membership|display|project|product|event|group|channel|room|tag|category|title)\b/;
const FULL_NAME = /^(your |full |legal |first |last |given |family |middle )?name$|^(first|last|given|family|middle|full|legal|sur|fore)name$|^(fname|lname|surname|forename|given name|family name)$/;
const PERSON_EXAMPLE = /^(e g |eg |ex |for example )?(john|jane) (doe|smith)$/;
const EMAIL_EXAMPLE = /^\S+@\S+\.\S+$/;

function words(text) {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function staticText(node) {
  if (!node) return null;
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'TemplateLiteral') return node.quasis.map((q) => q.value.cooked).join(' ');
  if (node.type === 'JSXExpressionContainer') return staticText(node.expression);
  return null;
}

function textsIn(node) {
  const out = [];
  if (!node) return out;
  const direct = staticText(node);
  if (direct !== null) return [direct];
  walk(node, (n) => {
    if (n.type === 'StringLiteral') out.push(n.value.split('.').pop());
    if (n.type === 'TemplateLiteral') out.push(n.quasis.map((q) => q.value.cooked).join(' '));
  });
  return out;
}

function attrMap(opening) {
  const attrs = new Map();
  const spreads = [];
  for (const attr of opening.attributes) {
    if (attr.type === 'JSXSpreadAttribute') spreads.push(attr.argument);
    else if (attr.name.type === 'JSXIdentifier') attrs.set(attr.name.name.toLowerCase(), attr);
  }
  return { attrs, spreads };
}

function valueOf(attr) {
  if (!attr) return { kind: 'missing' };
  if (!attr.value) return { kind: 'true' };
  const text = staticText(attr.value);
  if (text !== null) return { kind: 'string', text };
  const expr = attr.value.expression;
  if (expr?.type === 'BooleanLiteral') return expr.value ? { kind: 'true' } : { kind: 'missing' };
  if (!expr || expr.type === 'JSXEmptyExpression' || (expr.type === 'Identifier' && expr.name === 'undefined') || expr.type === 'NullLiteral') return { kind: 'missing' };
  return { kind: 'expr', node: expr };
}

const present = (attrs, name) => {
  const value = valueOf(attrs.get(name));
  return value.kind === 'true' || value.kind === 'expr' || (value.kind === 'string' && value.text.trim() !== '');
};

function propsParam(fn) {
  const param = fn?.params?.[0];
  if (!param) return { names: new Set(), keys: new Set() };
  if (param.type === 'Identifier') return { names: new Set([param.name]), keys: new Set() };
  const target = param.type === 'AssignmentPattern' ? param.left : param;
  const names = new Set();
  const keys = new Set();
  if (target.type === 'ObjectPattern') {
    for (const prop of target.properties) {
      if (prop.type === 'RestElement' && prop.argument.type === 'Identifier') names.add(prop.argument.name);
      if (prop.type === 'ObjectProperty') {
        const local = prop.value.type === 'Identifier' ? prop.value.name : prop.value.left?.name;
        if (local) keys.add(local);
      }
    }
  }
  return { names, keys };
}

function spreadsProps(spreads, param) {
  return spreads.some((s) => (s.type === 'Identifier' && param.names.has(s.name)) || (s.type === 'MemberExpression' && s.object.type === 'Identifier' && param.names.has(s.object.name) && s.property.name === 'props'));
}

function isSafeSpread(node) {
  if (node.type === 'CallExpression') {
    const callee = node.callee.type === 'MemberExpression' ? node.callee.property.name : node.callee.name;
    return callee === 'register';
  }
  return node.type === 'Identifier' && node.name === 'field';
}

function parentsOf(ast) {
  const parents = new Map();
  walk(ast, (node, parent) => {
    parents.set(node, parent);
  });
  return parents;
}

const isFunction = (node) => node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression';

function enclosing(node, parents) {
  let current = parents.get(node);
  while (current) {
    if (isFunction(current)) {
      let name = current.id?.name;
      let up = parents.get(current);
      while (!name && up && (up.type === 'CallExpression' || up.type === 'TSAsExpression')) up = parents.get(up);
      if (!name && up?.type === 'VariableDeclarator' && up.id.type === 'Identifier') name = up.id.name;
      if (name && isComponentName(name)) return { name, fn: current };
    }
    current = parents.get(current);
  }
  return { name: '', fn: null };
}

function jsxAncestors(node, parents) {
  const out = [];
  let current = parents.get(node);
  while (current && !isFunction(current)) {
    if (current.type === 'JSXElement') out.push(current);
    current = parents.get(current);
  }
  return out;
}

function containsElement(node, test) {
  let found = null;
  walk(node, (n) => {
    if (found) return false;
    if (n.type === 'JSXElement' && test(jsxName(n.openingElement.name))) found = n;
    return undefined;
  });
  return found;
}

const isFieldName = (name) => HOST_FIELDS.has(name) || FIELD_COMPONENT.test(name);

function whatIsBefore(element, parents) {
  let child = element;
  for (const ancestor of jsxAncestors(element, parents).slice(0, 2)) {
    let branch = child;
    while (parents.get(branch) !== ancestor) branch = parents.get(branch);
    const before = ancestor.children.slice(0, ancestor.children.indexOf(branch)).filter((c) => !(c.type === 'JSXText' && !c.value.trim()) && !(c.type === 'JSXExpressionContainer' && c.expression.type === 'JSXEmptyExpression'));
    const sibling = before[before.length - 1];
    if (sibling) {
      if (sibling.type === 'JSXText') return /\p{L}/u.test(sibling.value) ? 'text' : null;
      if (sibling.type !== 'JSXElement' || containsElement(sibling, isFieldName)) return null;
      const name = jsxName(sibling.openingElement.name);
      if (LABEL_ELEMENT.test(name) && !sibling.openingElement.attributes.some((a) => a.type === 'JSXAttribute' && /^(htmlFor|for)$/.test(a.name.name))) return 'label';
      let text = false;
      walk(sibling, (n, p) => {
        if (n.type === 'JSXText' && /\p{L}/u.test(n.value)) text = true;
        if (n.type === 'JSXExpressionContainer' && p?.type === 'JSXElement' && n.expression.type !== 'JSXEmptyExpression') text = true;
      });
      return text ? 'text' : null;
    }
    child = ancestor;
  }
  return null;
}

function fieldCategory(attrs, tag) {
  const type = valueOf(attrs.get('type'));
  const signals = ['name', 'id', 'aria-label', 'placeholder'].flatMap((key) => {
    const value = valueOf(attrs.get(key));
    if (value.kind === 'string') return [{ key, raw: value.text.trim(), text: words(value.text) }];
    if (value.kind === 'expr') return textsIn(value.node).map((t) => ({ key, raw: t.trim(), text: words(t) }));
    return [];
  });
  if (signals.some((s) => OTHER_PERSON.test(s.text))) return { other: true };
  const found = [];
  if (type.kind === 'string' && type.text === 'email') found.push('email');
  if (type.kind === 'string' && type.text === 'tel') found.push('tel');
  let weakName = false;
  for (const { key, raw, text } of signals) {
    if (NOT_PERSONAL.test(text)) continue;
    if (/\be ?mail\b/.test(text) || (key === 'placeholder' && EMAIL_EXAMPLE.test(raw))) found.push('email');
    else if (/\b(phone|telephone|mobile|cell|tel|whatsapp)\b/.test(text)) found.push('tel');
    else if (/\b(cc|cvc|cvv|csc|cardnumber|cardholder)\b|\bcredit card\b|\bcard (number|holder|expiry|expiration|exp)\b|\bname on card\b/.test(text)) found.push('card');
    else if (/\b(address|street|addr|city|postcode|postal|zip|zipcode)\b/.test(text) && !/\b(email|e mail)\b/.test(text)) found.push('address');
    else if (text === 'name' && key !== 'placeholder') weakName = true;
    else if (FULL_NAME.test(text) || (key === 'placeholder' && PERSON_EXAMPLE.test(text))) found.push('name');
  }
  if (tag === 'select' && found.includes('tel')) return { category: null };
  if (found.length) return { category: found[0] };
  const placeholder = signals.some((s) => s.key === 'placeholder');
  return { category: null, weakName: weakName && !placeholder };
}

function passwordLike(attrs) {
  const type = valueOf(attrs.get('type'));
  if (type.kind === 'string' && type.text === 'password') return 'password';
  if (type.kind === 'expr' && textsIn(type.node).includes('password')) return 'password';
  const auto = valueOf(attrs.get('autocomplete'));
  if (auto.kind === 'string' && /(current|new)-password/.test(auto.text)) return 'password';
  if (auto.kind === 'string' && /\busername\b/.test(auto.text)) return 'username';
  const texts = ['name', 'id', 'placeholder', 'aria-label'].flatMap((key) => {
    const value = valueOf(attrs.get(key));
    if (value.kind === 'string') return [words(value.text)];
    if (value.kind === 'expr') return textsIn(value.node).map(words);
    return [];
  });
  if (texts.some((t) => /\b(password|passwd|pwd|passcode|pass word)\b/.test(t))) return 'password';
  if (texts.some((t) => /\b(user ?name|user id|login|login id|account id)\b/.test(t))) return 'username';
  if ((type.kind === 'string' && type.text === 'email') || texts.some((t) => /\be ?mail\b/.test(t))) return 'email';
  return texts.length || type.kind !== 'missing' ? 'other' : 'unknown';
}

function localFunction(ast, name) {
  let found = null;
  walk(ast, (node) => {
    if (found) return false;
    if (node.type === 'FunctionDeclaration' && node.id?.name === name) found = node;
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.id.name === name && node.init && isFunction(node.init)) found = node.init;
    return undefined;
  });
  return found;
}

function pasteBlocking(handler, ast) {
  let fn = handler;
  if (handler?.type === 'Identifier') fn = localFunction(ast, handler.name);
  if (!fn || !isFunction(fn)) return 'unknown';
  let prevents = false;
  let conditional = false;
  let returnsFalse = false;
  let readsClipboard = false;
  const parents = parentsOf(fn);
  walk(fn, (node) => {
    if (node.type === 'Identifier' && node.name === 'clipboardData') readsClipboard = true;
    if (node.type === 'ReturnStatement' && node.argument?.type === 'BooleanLiteral' && !node.argument.value) returnsFalse = true;
    if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && node.callee.property.name === 'preventDefault') {
      prevents = true;
      let up = parents.get(node);
      while (up && up !== fn) {
        if (up.type === 'IfStatement' || up.type === 'ConditionalExpression' || up.type === 'LogicalExpression' || up.type === 'SwitchCase') conditional = true;
        up = parents.get(up);
      }
    }
  });
  if (fn.body.type === 'BooleanLiteral' && !fn.body.value) returnsFalse = true;
  if (readsClipboard) return 'handled';
  if (conditional) return 'conditional';
  return prevents || returnsFalse ? 'blocks' : 'allows';
}

const at = (node) => ({ line: node.loc.start.line, column: node.loc.start.column + 1 });

function shapeOf(entry, index, memo) {
  if (memo.has(entry.key)) return memo.get(entry.key);
  memo.set(entry.key);
  const param = propsParam(entry.fn);
  let shape = null;
  let labelled = false;
  walk(entry.fn.body, (node) => {
    if (node.type !== 'JSXElement') return;
    const name = jsxName(node.openingElement.name);
    if (LABEL_ELEMENT.test(name)) labelled = true;
    if (shape) return;
    const { attrs, spreads } = attrMap(node.openingElement);
    if (!spreadsProps(spreads, param)) return;
    let inner = null;
    if (HOST_FIELDS.has(name)) inner = { tag: name, attrs: new Map(), spreads: [], labelled: false };
    else if (isComponentName(name) && index.resolveName(entry.file, name)) inner = shapeOf(index.resolveName(entry.file, name), index, memo);
    if (!inner) return;
    const own = new Map([...attrs].filter(([, attr]) => !(attr.value?.expression?.type === 'Identifier' && param.keys.has(attr.value.expression.name))));
    shape = { tag: inner.tag, attrs: new Map([...inner.attrs, ...own]), spreads: [...inner.spreads, ...spreads.filter((s) => !spreadsProps([s], param))], labelled: inner.labelled };
  });
  if (shape) shape.labelled = shape.labelled || labelled;
  memo.set(entry.key, shape);
  return shape;
}

function linkedByFor(attrs, file) {
  const id = valueOf(attrs.get('id'));
  if (id.kind === 'string') return file.forStrings.has(id.text);
  if (id.kind === 'expr') return file.forSources.has(file.src.slice(id.node.start, id.node.end));
  return false;
}

function fileLabels(ast, src) {
  const forStrings = new Set();
  const forSources = new Set();
  walk(ast, (node) => {
    if (node.type !== 'JSXAttribute' || node.name.type !== 'JSXIdentifier' || !/^(htmlFor|for)$/.test(node.name.name)) return;
    const value = valueOf(node);
    if (value.kind === 'string') forStrings.add(value.text);
    if (value.kind === 'expr') forSources.add(src.slice(value.node.start, value.node.end));
  });
  return { forStrings, forSources, src };
}

function labelState(element, field, file, parents) {
  if (NAMING_ATTRS.some((a) => present(field.attrs, a))) return 'named';
  if (field.labelled) return 'named';
  if (!field.host && COMPONENT_LABEL_PROPS.some((a) => present(field.attrs, a))) return 'named';
  if (linkedByFor(field.attrs, file)) return 'named';
  const ancestors = jsxAncestors(element, parents);
  const names = ancestors.map((a) => jsxName(a.openingElement.name));
  if (names.some((n) => n === 'label' || /Label$/.test(n))) return 'named';
  const controlIndex = names.findIndex((n) => /FormControl$/.test(n));
  if (controlIndex !== -1 && ancestors.slice(controlIndex).some((a) => containsElement(a, (n) => /FormLabel$/.test(n)))) return 'named';
  if (field.spreads.some((s) => !isSafeSpread(s))) return 'unknown-spread';
  const before = whatIsBefore(element, parents);
  if (before === 'label') return 'unlinked-label';
  if (before === 'text') return 'nearby-text';
  return 'none';
}

function fieldAt(element, file, index, memo, parents) {
  const opening = element.openingElement;
  const name = jsxName(opening.name);
  const { attrs, spreads } = attrMap(opening);
  if (HOST_FIELDS.has(name)) {
    const owner = enclosing(element, parents);
    if (owner.fn && spreadsProps(spreads, propsParam(owner.fn))) return null;
    return { tag: name, attrs, spreads, host: true, labelled: false, resolved: true };
  }
  if (!isComponentName(name) && !name.includes('.')) return null;
  const entry = name.includes('.') ? null : index.resolveName(file.path, name);
  const shape = entry ? shapeOf(entry, index, memo) : null;
  if (shape) return { tag: shape.tag, attrs: new Map([...shape.attrs, ...attrs]), spreads: [...shape.spreads, ...spreads], host: true, labelled: shape.labelled, resolved: true };
  if (!FIELD_COMPONENT.test(name)) return null;
  return { tag: 'input', attrs, spreads, host: false, labelled: false, resolved: Boolean(entry) };
}

export const formFields = {
  name: 'form-fields',
  rules: Object.values(RULES),
  run(project) {
    const index = indexProject(project.files);
    const memo = new Map();
    const findings = [];
    const notAssessed = [];
    for (const { path, src, ast } of project.files) {
      const parents = parentsOf(ast);
      const file = { path, ...fileLabels(ast, src) };
      walk(ast, (node) => {
        if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && node.callee.property.name === 'addEventListener' && staticText(node.arguments[0]) === 'paste' && pasteBlocking(node.arguments[1], ast) === 'blocks') {
          notAssessed.push({ file: path, component: enclosing(node, parents).name, rule: RULES.paste, reason: `paste is blocked by code added while the page runs (line ${node.loc.start.line}); check the live page to see which field it affects` });
        }
        if (node.type !== 'JSXElement') return;
        const field = fieldAt(node, file, index, memo, parents);
        if (!field) return;
        const component = enclosing(node, parents).name;
        const base = { file: path, component, ...at(node.openingElement) };
        const type = valueOf(field.attrs.get('type'));
        const typeText = type.kind === 'string' ? type.text.toLowerCase() : null;
        const inert = ['readonly', 'disabled'].some((a) => valueOf(field.attrs.get(a)).kind === 'true');
        const textual = !NO_TEXT_TYPES.has(typeText);

        if (textual && field.tag !== 'select' && present(field.attrs, 'placeholder')) {
          const state = labelState(node, field, file, parents);
          if (state === 'none' && field.host) findings.push({ ...base, rule: RULES.placeholder, message: 'This field is named only by its grey hint text, which disappears as soon as the person starts typing.' });
          else if (state === 'none' && !field.resolved) notAssessed.push({ file: path, component, rule: RULES.placeholder, reason: `line ${base.line}: a field component from outside the project shows hint text; could not tell whether it also shows a label` });
          else if (state === 'unknown-spread') notAssessed.push({ file: path, component, rule: RULES.placeholder, reason: `line ${base.line}: the field receives spread-in settings that may include a name` });
          else if (state === 'unlinked-label' && field.host) notAssessed.push({ file: path, component, rule: RULES.placeholder, reason: `line ${base.line}: a label sits near the field but is not linked to it` });
          else if (state === 'nearby-text' && field.host) notAssessed.push({ file: path, component, rule: RULES.placeholder, reason: `line ${base.line}: text before the field may be a visible label that is not linked to it` });
        }

        if (textual && typeText !== 'password' && typeText !== 'search' && !inert) {
          const { category, other, weakName } = fieldCategory(field.attrs, field.tag);
          const auto = valueOf(field.attrs.get('autocomplete'));
          if (other && auto.kind === 'missing') notAssessed.push({ file: path, component, rule: RULES.autocomplete, reason: `line ${base.line}: the field may ask about someone other than the person filling in the form` });
          else if (weakName && auto.kind === 'missing' && field.host) notAssessed.push({ file: path, component, rule: RULES.autocomplete, reason: `line ${base.line}: a field called "name" may not ask for a person's name` });
          else if (category && auto.kind === 'string' && AUTOFILL_OFF.has(auto.text.trim().toLowerCase())) notAssessed.push({ file: path, component, rule: RULES.autocomplete, reason: `line ${base.line}: a ${PURPOSES[category]} field turns autofill off instead of saying what it holds` });
          else if (category && auto.kind === 'missing') {
            if (!field.host) notAssessed.push({ file: path, component, rule: RULES.autocomplete, reason: `line ${base.line}: a ${PURPOSES[category]} field component may set what the field holds inside itself` });
            else if (field.spreads.some((s) => !isSafeSpread(s))) notAssessed.push({ file: path, component, rule: RULES.autocomplete, reason: `line ${base.line}: the ${PURPOSES[category]} field receives spread-in settings that may say what it holds` });
            else findings.push({ ...base, rule: RULES.autocomplete, message: `This ${PURPOSES[category]} field does not tell the browser what it holds, so autofill and password managers cannot reliably fill it in.` });
          }
        }

        const paste = field.attrs.get('onpaste');
        if (paste) {
          const blocking = pasteBlocking(valueOf(paste).node, ast);
          if (blocking === 'allows' || blocking === 'handled') return;
          const kind = passwordLike(field.attrs);
          if (blocking === 'unknown') notAssessed.push({ file: path, component, rule: RULES.paste, reason: `line ${base.line}: the paste handler is defined elsewhere and could not be read` });
          else if (blocking === 'conditional' && kind !== 'other') notAssessed.push({ file: path, component, rule: RULES.paste, reason: `line ${base.line}: paste is blocked only in some cases` });
          else if (blocking === 'conditional') return;
          else if (kind === 'password' && field.host) findings.push({ ...base, rule: RULES.paste, message: 'This password field blocks pasting, so people cannot paste from a password manager and must type the password by hand.' });
          else if (kind === 'password') notAssessed.push({ file: path, component, rule: RULES.paste, reason: `line ${base.line}: a password field component blocks paste, but it may not pass that on to the field` });
          else if (kind === 'username') notAssessed.push({ file: path, component, rule: RULES.paste, reason: `line ${base.line}: paste is blocked on a username field; a person must check whether the site made the username up` });
          else if (kind === 'email') notAssessed.push({ file: path, component, rule: RULES.paste, reason: `line ${base.line}: paste is blocked on an email field; that is a usability problem, not a failure of this rule` });
          else if (kind === 'unknown') notAssessed.push({ file: path, component, rule: RULES.paste, reason: `line ${base.line}: paste is blocked on a field whose purpose could not be read` });
        }
      });
    }
    return { findings, notAssessed };
  },
};
