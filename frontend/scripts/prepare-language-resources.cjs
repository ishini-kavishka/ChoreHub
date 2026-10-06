// Development-only resource preparation. The application never calls a translator at runtime.
// Sends only the English interface dictionary, never account or chore data.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, filename);
const { translations } = require('../src/i18n/translations.ts');
const catalog = require('../../shared/languages.json');
const destination = path.resolve(__dirname, '../src/i18n/locales');
fs.mkdirSync(destination, { recursive: true });
const entries = Object.entries(translations.en);
const unique = [...new Set(entries.map(([, value]) => value))];
function protect(value) {
  const tokens = [];
  return { value: value.replace(/\{\w+\}|ChoreHub|ChoreSync|YYYY-MM-DD HH:mm|YYYY-MM-DD|HH:mm|@2x|@3x/g, token => {
    tokens.push(token); return `ZXQ${tokens.length - 1}QXZ`;
  }).replace(/\n/g, ' '), tokens };
}
async function translate(values, locale) {
  const protectedValues = values.map(protect);
  const query = protectedValues.map(value => value.value).join('\n');
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  for (const [key, value] of Object.entries({ client: 'gtx', sl: 'en', tl: locale === 'zh' ? 'zh-CN' : locale, dt: 't', q: query })) url.searchParams.set(key, value);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw Error(`Translation response ${response.status}`);
      const body = await response.json();
      const text = body[0].map(segment => segment[0]).join('');
      const lines = text.trimEnd().split('\n');
      if (lines.length !== values.length) throw Error('Translation line count changed');
      return lines.map((line, index) => {
        let result = line.trim();
        for (const [tokenIndex, original] of protectedValues[index].tokens.entries()) {
          const token = `ZXQ${tokenIndex}QXZ`;
          if (!result.includes(token)) throw Error('Translation changed a protected token');
          result = result.split(token).join(original);
        }
        if (!result) throw Error('Empty translation');
        return result;
      });
    } catch (error) {
      if (attempt === 3) {
        if (values.length > 1) {
          const half = Math.ceil(values.length / 2);
          return [...await translate(values.slice(0, half), locale), ...await translate(values.slice(half), locale)];
        }
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
    }
  }
}
async function prepare(locale) {
  const file = path.join(destination, locale.code + '.json');
  const saved = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const cache = new Map(entries.filter(([key]) => saved[key]).map(([key, value]) => [value, saved[key]]));
  let batch = [], length = 0;
  const flush = async () => {
    if (!batch.length) return;
    const translated = await translate(batch, locale.code);
    batch.forEach((value, index) => cache.set(value, translated[index]));
    fs.writeFileSync(file, JSON.stringify(Object.fromEntries(entries.filter(([, value]) => cache.has(value)).map(([key, value]) => [key, cache.get(value)])), null, 2) + '\n');
    batch = []; length = 0;
  };
  for (const value of unique) {
    if (cache.has(value)) continue;
    if (length + value.length > 2600) await flush();
    batch.push(value); length += value.length + 1;
  }
  await flush();
  const dictionary = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [key, value] of entries) {
    if (!dictionary[key]) throw Error(`Missing ${locale.code}/${key}`);
    const placeholders = text => (text.match(/\{\w+\}/g) || []).sort();
    if (JSON.stringify(placeholders(value)) !== JSON.stringify(placeholders(dictionary[key]))) throw Error(`Placeholder mismatch ${locale.code}/${key}`);
  }
  const catalogPath = path.resolve(__dirname, '../../shared/languages.json');
  const currentCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  currentCatalog.find(item => item.code === locale.code).translation_supported = true;
  fs.writeFileSync(catalogPath, JSON.stringify(currentCatalog, null, 2) + '\n');
  const complete = currentCatalog.filter(item => item.translation_supported && !['en', 'si', 'ta'].includes(item.code));
  fs.writeFileSync(path.resolve(__dirname, '../src/i18n/additionalTranslations.ts'),
    '// Complete static resources; no runtime translation service.\n' +
    complete.map(item => `import ${item.code} from './locales/${item.code}.json';`).join('\n') +
    '\nexport const additionalTranslations = { ' + complete.map(item => item.code).join(', ') + ' };\n');
  console.log(locale.code + ': ' + Object.keys(JSON.parse(fs.readFileSync(file, 'utf8'))).length + ' static keys');
}
const pending = catalog.filter(item => !['en', 'si', 'ta'].includes(item.code));
async function worker() { while (pending.length) await prepare(pending.shift()); }
Promise.all([worker(), worker()]).catch(error => { console.error(error.message); process.exitCode = 1; });
