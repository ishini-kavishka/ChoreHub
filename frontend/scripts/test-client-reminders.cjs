const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
global.requestAnimationFrame = fn => fn();
require.extensions['.ts'] = require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText, filename);
const { translations } = require('../src/i18n/translations.ts');
const translate = key => translations.en[key];
const original = Module._load;
const choreId = process.env.REAL_REMINDER_CHORE || 'own-chore';
const choreName = process.env.REAL_REMINDER_BASE ? 'Own assigned test chore' : 'My assigned chore';
let liveService;
if (process.env.REAL_REMINDER_BASE) {
  Module._load = function(name, ...args) {
    if(name==='react-native')return {Platform:{OS:'web'}};
    if(name==='@/config/api')return {API_BASE_URL:process.env.REAL_REMINDER_BASE};
  if(name==='@/i18n/translations')return require('../src/i18n/translations.ts');
  if(name==='@/i18n/translations')return require('../src/i18n/translations.ts');
    if (name === './authService') return { authService: { getAuthToken: async () => process.env.REAL_REMINDER_TOKEN } };
    if (name === './api') return { ApiError: class ApiError extends Error {}, apiRequest: async (path, options, token) => {
      const response = await fetch(process.env.REAL_REMINDER_BASE + path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || data.error || 'API request failed'); return data;
    } };
    return original.call(this, name, ...args);
  };
  liveService = require('../src/services/component04CrudService.ts').reminderService;
  Module._load = original;
}
let records = [], calls = [], routes = [], failSave = false;
const colors = { background: '#14121F', card: '#211D30', surface: '#342C4C', textPrimary: '#F9F7FF', textSecondary: '#C0B9D2', primary: '#7C5CFC', border: '#494059', inputBackground: '#211D30' };
const service = {
  list: async () => { if (liveService) { const result = await liveService.list(); records = result.reminders; return result; } return { reminders: records.map(r => ({ ...r })) }; },
  chores: async () => liveService ? liveService.chores() : ({ chores: [{ id: choreId, title: choreName, due_date: '2099-10-10T20:00:00' }] }),
  get: async id => liveService ? liveService.get(id) : ({ reminder: { ...records.find(r => r.id === id) } }),
  save: async (id, body) => {
    calls.push([id ? 'PATCH' : 'POST', id, body]); if (failSave) throw new Error('Save failed');
    if (liveService) { await liveService.save(id, body); return; }
    if (id) records = records.map(r => r.id === id ? { ...r, ...body } : r);
    else records.push({ ...body, id: 'saved-reminder', chore_name: 'My assigned chore', status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  },
  delete: async id => { calls.push(['DELETE', id]); if (liveService) await liveService.delete(id); else records = records.filter(r => r.id !== id); },
};
Module._load = function(name, ...args) {
  if(name==='@/i18n/translations')return require('../src/i18n/translations.ts');
  if (name === 'react-native') return { Platform:{OS:'web'}, Switch:'switch', ActivityIndicator: 'loading', Pressable: 'button', ScrollView: 'scroll', Text: 'text', TextInput: 'input', View: 'view', Modal: ({ visible, children }) => visible ? React.createElement('dialog', null, children) : null, BackHandler: { addEventListener: () => ({ remove() {} }) } };
  if (name === '@/services/reminderDeviceService') return {reminderDeviceService:{supported:()=>false}};
  if (name === 'react-native-safe-area-context') return { SafeAreaView: 'safe' };
  if (name === '@expo/vector-icons') return { Ionicons: 'icon' };
  if (name === 'expo-router') return { useFocusEffect: callback => React.useEffect(callback, [callback]), router: { navigate: value => routes.push(value) } };
  if (name === '@/context/LanguageContext') return { useLanguage: () => ({ t: translate, language: 'en' }) };
  if (name === '@/context/ThemeContext') return { useAppTheme: () => ({ colors }) };
  if (name === '../admin/AdminComponent04Shared') return { useAdminColors: () => ({ error: '#FFAAA8' }), s: {} };
  if (name === '@/services/api') return { ApiError: class ApiError extends Error {} };
  if (name === '@/services/familyService') return { familyService: {} };
  if (name === '@/services/component04CrudService') return { reminderService: service };
  return original.call(this, name, ...args);
};
const { default: Screen, parseLocalTime } = require('../src/screens/home/Component04CrudScreen.tsx');
Module._load = original;
const button = (r, label) => r.root.findAllByType('button').find(n => n.props.accessibilityLabel === label);
const press = async (r, label) => { assert.ok(button(r, label), label); await act(async () => { await button(r, label).props.onPress(); }); };
const enter = async (r, label, value) => {
  if (label === 'Reminder Date *') {
    const input = r.root.findAllByType('input').find(n => n.props['aria-label'] === label);
    assert.equal(input.props.type, 'date');
    let opened = false;
    input.props.onClick({ currentTarget: { showPicker: () => { opened = true; } } });
    assert.ok(opened, 'Click opens the browser calendar.');
    const previousTime = button(r, 'Reminder Time *').findByType('text').props.children;
    await act(async () => input.props.onChange({ target: { value, validity: { valid: !!value } } }));
    assert.equal(button(r, 'Reminder Time *').findByType('text').props.children, previousTime, 'Date selection preserves the time.');
    return;
  }
  if (label === 'Reminder Time *') {
    await press(r, label);
    const selectors = r.root.findAllByType('select');
    assert.equal(selectors.length, 2, 'Time field opens hour/minute picker.');
    const previous = button(r, label).findByType('text').props.children;
    for (const [index, part] of value.split(':').entries()) await act(async () => selectors[index].props.onChange({ target: { value: part } }));
    assert.equal(button(r, label).findByType('text').props.children, previous, 'Selection is pending until confirmed.');
    await press(r, 'Save');
    assert.equal(r.root.findAllByType('select').length, 0);
    assert.ok(button(r, label).findByType('text').props.children.includes(value), 'Confirmed time appears in field.');
    return;
  }
  await act(async () => r.root.findAllByType('input').find(n => n.props.accessibilityLabel === label).props.onChangeText(value));
};

test('client forms, persisted-service refresh, details/edit/back and confirmed deletion use existing CRUD handlers', async () => {
  let r;
  try {
    await act(async () => { r = create(React.createElement(Screen, { kind: 'reminders' })); });
    assert.ok(JSON.stringify(r.toJSON()).includes('No reminders yet'));
    assert.equal(r.root.findByType('safe').props.style[1].backgroundColor, colors.background);
    await press(r, '+ Add Reminder');
    await press(r, 'Create Reminder'); assert.equal(calls.length, 0, 'Invalid form never calls API.');
    await enter(r, 'Reminder Title *', 'Take bins outside'); await enter(r, 'Note (optional)', 'User text stays unchanged');
    assert.ok(!JSON.stringify(r.toJSON()).includes('Assigned Chore'));
    assert.ok(!JSON.stringify(r.toJSON()).includes('No linked chore'));
    const dateInput = r.root.findAllByType('input').find(n => n.props['aria-label'] === 'Reminder Date *');
    const initialDate = dateInput.props.value;
    await enter(r, 'Reminder Date *', ''); assert.equal(dateInput.props.value, initialDate, 'Empty dates do not replace the selection.');
    await act(async () => dateInput.props.onChange({ target: { value: '2099-02-30', validity: { valid: false } } }));
    assert.equal(dateInput.props.value, initialDate, 'Invalid dates do not replace the selection.');
    assert.ok(dateInput.props.min, 'New reminders prevent past date selection.');
    await enter(r, 'Reminder Date *', '2099-10-10'); await enter(r, 'Reminder Time *', '18:30');
    failSave = true; await press(r, 'Create Reminder'); assert.ok(button(r, 'Create Reminder'), 'Failure preserves form.'); failSave = false;
    await press(r, 'Create Reminder'); assert.equal(records.length, 1); assert.equal(calls.at(-1)[0], 'POST'); assert.equal(new Date(calls.at(-1)[2].remind_at).getHours(), 18); assert.equal(new Date(calls.at(-1)[2].remind_at).getMinutes(), 30); assert.ok(!Object.hasOwn(calls.at(-1)[2], 'chore_id'));
    assert.ok(button(r, 'View')); await press(r, 'View'); assert.ok(button(r, 'Edit Reminder')); assert.ok(!button(r, '+ Add Reminder'));
    await press(r, 'Go back'); assert.ok(button(r, '+ Add Reminder')); assert.equal(routes.length, 0, 'Details back stays in list.');
    await enter(r, 'Search', 'Take bins');
    await press(r, 'Edit'); assert.equal(r.root.findAllByType('input').find(n => n.props.accessibilityLabel === 'Reminder Title *').props.value, 'Take bins outside');
    assert.equal(r.root.findAllByType('input').find(n => n.props['aria-label'] === 'Reminder Date *').props.value, '2099-10-10', 'Edit restores the saved local date.');
    await enter(r, 'Reminder Title *', 'Edited bins'); await enter(r, 'Note (optional)', 'Updated note'); await enter(r, 'Reminder Date *', '2099-10-11'); await enter(r, 'Reminder Time *', '19:45');
    await press(r, 'Save Changes'); assert.equal(calls.at(-1)[0], 'PATCH'); assert.equal(records[0].title, 'Edited bins'); assert.equal(records[0].note, 'Updated note'); assert.equal(new Date(records[0].remind_at).getDate(), 11);
    assert.equal(r.root.findAllByType('input').find(n => n.props.accessibilityLabel === 'Search').props.value, '', 'An old search cannot hide the newly saved reminder.');
    await press(r, 'Refresh'); assert.ok(JSON.stringify(r.toJSON()).includes('Edited bins'));
    await press(r, 'Delete'); assert.equal(records.length, 1); await press(r, 'Cancel'); assert.equal(records.length, 1);
    await press(r, 'Delete'); const confirmation = r.root.findByType('dialog');
    await act(async () => { await confirmation.findAllByType('button').find(n => n.props.accessibilityLabel === 'Delete').props.onPress(); });
    assert.equal(calls.at(-1)[0], 'DELETE'); await press(r, 'Refresh'); assert.equal(records.length, 0); assert.ok(JSON.stringify(r.toJSON()).includes('No reminders yet'));
    await press(r, 'Go back'); assert.equal(routes.at(-1), '/home/notifications');
  } finally { if (r) await act(async () => r.unmount()); }
});
test('local schedule rejects impossible and past dates and preserves timezone conversion', () => {
  assert.equal(parseLocalTime('2099-02-30 18:30'), null); assert.equal(parseLocalTime('2000-01-01 12:00'), null); assert.equal(parseLocalTime('2099-10-10 25:00'), null);
  const iso = parseLocalTime('2099-10-10 18:30'); assert.ok(iso); assert.equal(new Date(iso).getHours(), 18); assert.equal(new Date(iso).getMinutes(), 30);
});

test('personal reminder saves without a chore and persists sound selection',async()=>{
 if(liveService)return;let r;let choreLoads=0;const old=service.chores;service.chores=async()=>{choreLoads++;throw new Error('Client reminders must not load chores');};records=[];calls=[];
 try{await act(async()=>{r=create(React.createElement(Screen,{kind:'reminders'}));});await press(r,'+ Add Reminder');
 assert.equal(choreLoads,0);assert.ok(!JSON.stringify(r.toJSON()).includes('Assigned Chore'));assert.ok(!JSON.stringify(r.toJSON()).includes('No linked chore'));
 assert.deepEqual(r.root.findAllByType('input').map(n=>n.props.accessibilityLabel || n.props['aria-label']).slice(0,4),['Reminder Title *','Note (optional)','Reminder Date *']);
 await enter(r,'Reminder Title *','Private task');await enter(r,'Note (optional)','Owner note');await enter(r,'Reminder Date *','2099-10-10');await enter(r,'Reminder Time *','21:50');
 await act(async()=>r.root.findAllByType('switch').find(n=>n.props.accessibilityLabel==='Sound').props.onValueChange(false));await press(r,'Create Reminder');
 assert.ok(!Object.hasOwn(calls.at(-1)[2], 'chore_id'));assert.equal(calls.at(-1)[2].sound,false);assert.equal(records.length,1);
 await press(r,'Edit');assert.ok(!JSON.stringify(r.toJSON()).includes('Assigned Chore'));assert.ok(!JSON.stringify(r.toJSON()).includes('No linked chore'));
 await enter(r,'Reminder Title *','Updated private task');await act(async()=>r.root.findAllByType('switch').find(n=>n.props.accessibilityLabel==='Vibrate when reminder arrives').props.onValueChange(false));await press(r,'Save Changes');
 assert.ok(!Object.hasOwn(calls.at(-1)[2],'chore_id'));assert.equal(calls.at(-1)[2].vibrate,false);assert.equal(records[0].title,'Updated private task');assert.equal(choreLoads,0);
 }finally{service.chores=old;if(r)await act(async()=>r.unmount());}
});

test('date field and browser calendar follow the global light and dark theme', async () => {
  for (const isDark of [false, true]) {
    colors.isDark = isDark;
    let r;
    try {
      await act(async () => { r = create(React.createElement(Screen, { kind: 'reminders' })); });
      await press(r, '+ Add Reminder');
      const input = r.root.findAllByType('input').find(n => n.props['aria-label'] === 'Reminder Date *');
      assert.equal(input.props.style.colorScheme, isDark ? 'dark' : 'light');
      const fieldStyle = input.parent.props.style[1];
      assert.equal(fieldStyle.backgroundColor, colors.inputBackground);
      assert.equal(fieldStyle.borderColor, colors.border);
      const icon = input.parent.findByType('icon');
      assert.equal(icon.props.name, 'calendar-outline');
      assert.equal(icon.props.color, colors.primary);
      assert.equal(icon.props.size, 20);
    } finally { if (r) await act(async () => r.unmount()); }
  }
});
