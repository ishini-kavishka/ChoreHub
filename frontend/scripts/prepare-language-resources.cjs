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
function protect(value, row = 0) {
  const tokens = [];
  return { value: value.replace(/\{\w+\}|ChoreHub|ChoreSync|YYYY-MM-DD HH:mm|YYYY-MM-DD|HH:mm|HH:MM|@2x|@3x|\n/g, token => {
    tokens.push(token); return `ZXQ${row}P${tokens.length - 1}QXZ`;
  }), tokens };
}
async function translate(values, locale) {
  const protectedValues = values.map(protect);
  const query = protectedValues.map((value, index) => {
    // Give short labels the household context; "chore" otherwise gets translated
    // as monotonous employment in several languages. Never alter protected data.
    const text = value.value.replace(/\bchores\b/gi, 'household tasks').replace(/\bchore\b/gi, 'household task')
      .replace(/\bhousehold\s+household\b/gi, 'household');
    return `[${index}]\n${text}`;
  }).join('\n');
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  for (const [key, value] of Object.entries({ client: 'gtx', sl: 'en', tl: locale === 'zh' ? 'zh-CN' : locale, dt: 't', q: query })) url.searchParams.set(key, value);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw Error(`Translation response ${response.status}`);
      const body = await response.json();
      const text = body[0].map(segment => segment[0]).join('');
      // Bengali/Arabic/etc. legitimately localize numbered row markers. Restore
      // only marker digits; keep localized digits in the actual UI translation.
      const normalized = text.replace(/\[([\p{Nd}]+)\]/gu, (_, digits) => '[' + [...digits].map(digit => {
        const point = digit.codePointAt(0);
        const base = [0x30,0x660,0x6f0,0x966,0x9e6,0xa66,0xae6,0xb66,0xbe6,0xc66,0xce6,0xd66,0xe50,0xff10]
          .find(start => point >= start && point <= start + 9);
        if (base === undefined) throw Error('Translation row numeral is unsupported');
        return String(point - base);
      }).join('') + ']');
      const matches = [...normalized.matchAll(/\[(\d+)\]\s*([\s\S]*?)(?=\[\d+\]|$)/g)];
      if (matches.length !== values.length) throw Error('Translation row count changed');
      const translated = Array(values.length);
      for (const match of matches) {
        const index = Number(match[1]);
        if (index >= values.length || translated[index]) throw Error('Translation row identifier changed');
        let result = match[2].trim();
        for (const [tokenIndex, original] of protectedValues[index].tokens.entries()) {
          const token = `ZXQ${index}P${tokenIndex}QXZ`;
          if (!result.includes(token)) throw Error(`Translation changed protected token ${token} in ${locale}: ${values[index]} => ${result}`);
          result = result.split(token).join(original);
        }
        if (!result) throw Error('Empty translation');
        if (/ZXQ|QXZ/.test(result)) throw Error('Unrestored translation token');
        if (result === values[index] && /[A-Za-z]/.test(result) && result.length > 30) throw Error('Untranslated interface sentence');
        translated[index] = result;
      }
      return translated;
    } catch (error) {
      const formatError = /Translation (?:changed|row)|Untranslated|Empty translation|Unrestored/.test(error.message);
      if (attempt === 3 || formatError) {
        if (formatError && values.length === 1 && values[0].includes('\n')) {
          return [(await translate(values[0].split('\n'), locale)).join('\n')];
        }
        if (values.length > 1 && formatError) {
          console.log(locale + ': retrying smaller batch after ' + error.message.slice(0, 180));
          const half = Math.ceil(values.length / 2);
          return [...await translate(values.slice(0, half), locale), ...await translate(values.slice(half), locale)];
        }
        throw error;
      }
      console.log(locale + ': retry ' + (attempt + 1) + ' after ' + error.message.slice(0, 100));
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
    console.log(locale.code + ': ' + cache.size + '/' + unique.length + ' interface strings');
    await new Promise(resolve => setTimeout(resolve, 650));
  };
  for (const value of unique) {
    if (cache.has(value)) continue;
    if (length + value.length > 1500) await flush();
    batch.push(value); length += value.length + 1;
  }
  await flush();
  const dictionary = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (Object.keys(dictionary).length !== entries.length) throw Error(`Unexpected key count ${locale.code}`);
  for (const [key, value] of entries) {
    if (!dictionary[key]) throw Error(`Missing ${locale.code}/${key}`);
    if (/\?{3,}|\uFFFD|ZXQ|QXZ/.test(dictionary[key])) throw Error(`Invalid translated text ${locale.code}/${key}`);
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
// Previously reviewed dictionaries are left intact. Pass locale codes to resume
// an interrupted preparation, otherwise prepare only unsupported catalog rows.
const requested = process.argv.slice(2);
const pending = catalog.filter(item => requested.length ? requested.includes(item.code) : !item.translation_supported);
async function worker() { while (pending.length) await prepare(pending.shift()); }
worker().catch(error => { console.error(error.message); process.exitCode = 1; });
