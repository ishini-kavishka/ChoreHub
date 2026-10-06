const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
require.extensions['.ts'] = require.extensions['.tsx'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true,
  } }).outputText, filename);
const { translations } = require('../src/i18n/translations.ts');
const { notificationDisplay } = require('../src/i18n/clientTranslations.ts');
const defaults = ['en', 'si', 'ta'].map(code => ({ code, is_enabled: true, translation_supported: true }));
let user = { id: 'member-a' }, selected = 'en', languages = defaults, failure = false, offline = false;
const storage = new Map(), sessionListeners = new Set(), foregroundListeners = new Set();
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === 'react-native') return { View: 'layout', AppState: { addEventListener: (_, cb) => {
    foregroundListeners.add(cb); return { remove: () => foregroundListeners.delete(cb) };
  } } };
  if (name === '@react-native-async-storage/async-storage') return {
    getItem: async key => storage.get(key) ?? null, setItem: async (key, value) => storage.set(key, value),
  };
  if (name === '@/i18n/translations') return { translations };
  if (name === '@/services/authStorage') return { getUser: async () => user, subscribeSession: cb => {
    sessionListeners.add(cb); return () => sessionListeners.delete(cb);
  } };
  if (name === '@/services/settingsService') return { DEFAULT_SUPPORTED_LANGUAGES: defaults, settingsService: {
    getSupportedLanguages: async () => { if (offline) throw Error('offline'); return languages; },
    getPreferences: async () => { if (offline) throw Error('offline'); return { language: selected }; },
    savePreferences: async prefs => { if (failure) throw Error('save rejected'); selected = prefs.language; return prefs; },
  } };
  return originalLoad.call(this, name, ...args);
};
const { LanguageProvider, useLanguage } = require('../src/context/LanguageContext.tsx');
Module._load = originalLoad;
let context;
function ClientInterface() {
  context = useLanguage();
  return React.createElement('interface', null, ['tab_home', 'tab_chores', 'tab_progress', 'tab_profile',
    'settings_title', 'save', 'cancel', 'ui_email_address', 'ui_delete_chore', 'no_notifications', 'ui_help_center']
    .map(key => context.t(key)).join('|'));
}
const mount = async () => {
  let renderer;
  await act(async () => { renderer = create(React.createElement(LanguageProvider, null, React.createElement(ClientInterface))); });
  return renderer;
};
test('supported catalog entries have complete dictionaries covering every literal client translation key', () => {
  const keys = Object.keys(translations.en).sort();
  const catalog = require('../../shared/languages.json');
  assert.equal(new Set(catalog.map(item => item.code)).size, catalog.length);
  assert.deepEqual(catalog.filter(item => item.translation_supported).map(item => item.code).sort(), Object.keys(translations).sort());
  for (const code of Object.keys(translations)) {
    assert.deepEqual(Object.keys(translations[code]).sort(), keys);
    for (const key of keys) {
      assert.equal(typeof translations[code][key], 'string');
      assert.ok(translations[code][key].trim(), code + ': ' + key);
      assert.deepEqual((translations[code][key].match(/\{\w+\}/g) || []).sort(),
        (translations.en[key].match(/\{\w+\}/g) || []).sort(), code + ': ' + key);
    }
  }
  for (const prefix of ['priority_', 'repeat_', 'status_']) {
    const values = prefix === 'priority_' ? ['low', 'medium', 'high'] : prefix === 'repeat_' ? ['none', 'daily', 'weekly', 'monthly'] : ['pending', 'completed', 'overdue'];
    for (const value of values) assert.ok(translations.en[prefix + value], prefix + value);
  }
  const root = path.resolve(__dirname, '../src');
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx$/.test(entry.name) && !entry.name.startsWith('Admin')) {
        const text = fs.readFileSync(full, 'utf8');
        for (const match of text.matchAll(/\bt\('([^']+)'\)/g)) {
          assert.ok(Object.hasOwn(translations.en, match[1]), full + ': ' + match[1]);
        }
      }
    }
  }
  walk(path.join(root, 'screens')); walk(path.join(root, 'components'));
});
test('system notifications translate templates while preserving user-entered content', () => {
  for (const language of ['en', 'si', 'ta']) {
    const t = key => translations[language][key];
    const title = 'My custom chore with {count} and "quotes"';
    const notification = { type: 'chore_completed', title: 'Chore Completed', message: `"${title}" has been marked as completed` };
    const rendered = notificationDisplay(notification, t);
    assert.ok(rendered.message.includes(title));
    assert.equal(rendered.title, translations[language].ui_chore_completed);
    const personal = { type: 'personal_reminder', title: 'My reminder', message: 'Leave my own text unchanged' };
    assert.deepEqual(notificationDisplay(personal, t), { title: personal.title, message: personal.message });
  }
});
test('provider rerenders, saves, restores after restart/login, rejects unavailable locales and rolls back failures', async () => {
  let renderer = await mount();
  for (const code of ['si', 'ta', 'en']) {
    await act(async () => { await context.setLanguage(code); });
    assert.equal(context.language, code);
    assert.equal(selected, code);
    assert.equal(storage.get('chorehub.language.member-a'), code);
    assert.ok(renderer.root.findByType('interface').children[0].includes(translations[code].tab_home));
  }
  await act(async () => { await context.setLanguage('si'); renderer.unmount(); });
  renderer = await mount();
  assert.equal(context.language, 'si', 'restart restores saved preference');
  await act(async () => { user = { id: 'member-b' }; selected = 'ta'; sessionListeners.forEach(cb => cb()); });
  assert.equal(context.language, 'ta', 'login restores the new account preference');
  assert.equal(storage.get('chorehub.language.member-b'), 'ta');
  languages = defaults.map(l => ({ ...l, is_enabled: l.code !== 'ta' }));
  await act(async () => { await context.refreshAvailableLanguages(); });
  assert.equal(context.language, 'en', 'disabled active language falls back');
  assert.equal(selected, 'en');
  await act(async () => { await assert.rejects(context.setLanguage('ta')); await assert.rejects(context.setLanguage('zz')); });
  failure = true;
  await act(async () => { await assert.rejects(context.setLanguage('si')); });
  assert.equal(context.language, 'en', 'failed save rolls back');
  failure = false;
  await act(async () => { await context.setLanguage('si'); renderer.unmount(); });
  offline = true; renderer = await mount();
  assert.equal(context.language, 'si', 'offline startup uses account-specific cache');
  offline = false;
  await act(async () => { selected = 'zz'; foregroundListeners.forEach(cb => cb('active')); });
  assert.equal(context.language, 'en', 'invalid server locale falls back');
  const missing = translations.si.tab_home; delete translations.si.tab_home;
  await act(async () => { await context.setLanguage('si'); });
  assert.equal(context.t('tab_home'), translations.en.tab_home, 'missing key uses English');
  translations.si.tab_home = missing;
  assert.equal(context.t('unknown_key'), translations.en.error, 'unknown key never leaks to UI');
  await act(async () => { renderer.unmount(); });
});
