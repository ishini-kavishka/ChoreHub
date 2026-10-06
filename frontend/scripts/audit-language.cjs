const fs = require('fs');
const path = require('path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, filename);
const { translations } = require('../src/i18n/translations.ts');
const lookup = new Map(Object.entries(translations.en).map(([key, value]) => [value, key]));
// Stored API category identifiers are translated at render time, never in payloads.
for (const value of ['General', 'Cleaning', 'Kitchen', 'Laundry', 'Yard', 'Pets', 'Chore Issue', 'Technical Bug', 'Account & Login', 'General Inquiry']) lookup.delete(value);
const root = path.resolve(__dirname, '../src');
const directories = ['app', 'screens/home', 'screens/profile', 'screens/auth', 'screens/support', 'components', 'components/auth', 'components/chores', 'components/profile', 'components/support', 'components/navigation', 'components/notifications'];
const report = [];
for (const directory of directories) for (const filename of fs.readdirSync(path.join(root, directory))) {
  if (!filename.endsWith('.tsx') || filename.startsWith('Admin')) continue;
  const relative = directory + '/' + filename;
  const full = path.join(root, relative);
  let text = fs.readFileSync(full, 'utf8');
  const parse = () => ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let source = parse();
  if (process.argv.includes('--fix')) {
    // Static interface lists must be rebuilt inside their component on locale change.
    const component = source.statements.find(n => ts.isFunctionDeclaration(n) && n.name && /^[A-Z]/.test(n.name.text));
    const blocks = source.statements.filter(n => ts.isVariableStatement(n) && n.declarationList.declarations.some(d =>
      ['FAQS', 'CATEGORIES', 'TOPICS', 'POPULAR_TOPICS', 'DEFAULT_ARTICLES', 'CUSTOMER_TABS', 'ADMIN_TABS'].includes(d.name.getText(source))));
    if (component && blocks.length) {
      const edits = blocks.map(n => [n.getStart(source), n.end, '']);
      const hook = component.body.statements.find(n => n.getText(source).includes('useLanguage()'));
      const at = hook ? hook.end : component.body.getStart(source) + 1;
      edits.push([at, at, '\n' + blocks.map(n => n.getText(source)).join('\n')]);
      edits.sort((a, b) => b[0] - a[0]);
      for (const [start, end, value] of edits) text = text.slice(0, start) + value + text.slice(end);
      source = parse();
    }
  }
  const edits = [], functions = new Set(), remaining = [];
  function enclosingComponent(node) {
    let result;
    while (node.parent) { node = node.parent; if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) result = node; }
    return result;
  }
  function visit(node) {
    if (!node.parent) { ts.forEachChild(node, visit); return; }
    let value, jsx = false;
    if (ts.isJsxText(node)) { value = node.text.trim().replace(/\s+/g, ' '); jsx = true; }
    else if (ts.isStringLiteral(node)) value = node.text;
    const key = lookup.get(value);
    const component = enclosingComponent(node);
    const inTranslation = ts.isCallExpression(node.parent) && node.parent.expression.getText(source) === 't';
    if (key && component && !inTranslation && !['Chore', 'Hub', 'ChoreHub', 'ChoreSync'].includes(value)) {
      const translated = `t('${key}')`;
      edits.push([jsx ? node.pos : node.getStart(source), node.end, jsx || ts.isJsxAttribute(node.parent) ? `{${translated}}` : translated]);
      functions.add(component);
    }
    const visible = jsx || (ts.isJsxAttribute(node.parent) && ['placeholder', 'title', 'label', 'accessibilityLabel'].includes(node.parent.name.getText(source))) ||
      (ts.isPropertyAssignment(node.parent) && ['label', 'question', 'answer', 'subtitle'].includes(node.parent.name.getText(source)));
    if (visible && value && /[A-Za-z]/.test(value) && !key && !/^#|@/.test(value)) remaining.push(value);
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (process.argv.includes('--fix') && edits.length) {
    for (const component of functions) {
      const body = component.body.getText(source);
      if (!body.includes('useLanguage()')) edits.push([component.body.getStart(source) + 1, component.body.getStart(source) + 1, '\n  const { t } = useLanguage();']);
      else {
        const match = /const\s*\{([^}]+)\}\s*=\s*useLanguage\(\)/.exec(body);
        if (match && !/\bt\b/.test(match[1])) {
          const start = component.body.getStart(source) + match.index + match[0].indexOf('{') + 1;
          edits.push([start, start, ' t,']);
        }
      }
    }
    if (!text.includes("from '@/context/LanguageContext'")) edits.push([0, 0, "import { useLanguage } from '@/context/LanguageContext';\n"]);
    edits.sort((a, b) => b[0] - a[0]);
    for (const [start, end, value] of edits) text = text.slice(0, start) + value + text.slice(end);
    fs.writeFileSync(full, text);
  }
  report.push({ file: relative, remaining: [...new Set(remaining)] });
}
console.log(JSON.stringify(report, null, 2));
