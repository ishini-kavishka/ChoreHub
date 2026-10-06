const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
require.extensions['.ts'] = require.extensions['.tsx'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText, filename);
const { translations } = require('../src/i18n/translations.ts');
const { notificationDisplay } = require('../src/i18n/clientTranslations.ts');
const original = Module._load;
class ApiError extends Error { constructor(message, status) { super(message); this.status = status; } }
let status;
Module._load = function(name, ...args) {
  if (name === './api') return { ApiError, apiRequest: async () => { throw new ApiError('Network or API failure', status); } };
  if (name === './authService') return { authService: { getAuthToken: async () => 'isolated-test-token' } };
  return original.call(this, name, ...args);
};
const { notificationService: realService } = require('../src/services/notificationService.ts');
Module._load = original;
test('admin live requests never substitute demo records or pretend mutations succeeded', async () => {
  for (status of [undefined, 400, 401, 403, 404, 409, 500]) {
    await assert.rejects(realService.getNotifications('all', true), ApiError);
    await assert.rejects(realService.getUnreadCount(true), ApiError);
    await assert.rejects(realService.markRead('test', true), ApiError);
    await assert.rejects(realService.markAllRead(true), ApiError);
  }
});

let failLoad = false,failDelete=false;
const calls = [], routes = [];
let records = [
  { id: 'personal', title: 'Own reminder', message: 'Do not translate my message', type: 'personal_reminder', is_read: false, created_at: new Date().toISOString() },
  { id: 'update', title: 'My announcement', message: 'My content', type: 'announcement', is_read: true, created_at: new Date().toISOString() },
];
const colors = { bg: '#F8F7FC', card: '#fff', text: '#211C35', muted: '#655E78', soft: '#EFEAFF', accent: '#6340D4', border: '#E7E0F2' };
const translate = key => translations.en[key];
Module._load = function(name, ...args) {
  if (name === '@/components/notifications/ChoreTimeRequests') return {__esModule:true,default:'time-request-inbox'};
  if (name === 'react-native') return { ActivityIndicator: 'loading', Modal: ({visible,children})=>visible?React.createElement('dialog',null,children):null, Pressable: 'button', RefreshControl: 'refresh', ScrollView: 'scroll', Switch: 'switch', Text: 'text', View: 'view', StyleSheet: { create: value => value } };
  if (name === 'react-native-safe-area-context') return { SafeAreaView: 'safe' };
  if (name === '@expo/vector-icons') return { Ionicons: 'icon' };
  if (name === 'expo-router') return { useLocalSearchParams: () => ({}), useFocusEffect: callback => React.useEffect(callback, [callback]), router: { push: route => routes.push(route), canGoBack: () => false, replace: route => routes.push(route) } };
  if (name === '@/context/ThemeContext') return {useThemedStyles: factory => factory({isDark:false}),useAppTheme:()=>({colors:{isDark:false}})};
  if (name === '@/i18n/translations') return {translations,translateFeedback:message=>message};
  if (name === '@/context/LanguageContext') return { useLanguage: () => ({ t: translate, language: 'en' }) };
  if (name === './AdminComponent04Shared') return { useAdminColors: () => colors };
  if (name === '@/services/api') return { ApiError };
  if (name === '@/i18n/clientTranslations') return { notificationDisplay };
  if (name === '@/services/familyService') return { familyService: { getMyFamily: async () => ({}) } };
  if (name === '@/services/adminComponent04Service') return { adminComponent04Service: { context: async () => ({ households: [{ id: 'family', name: 'Test household' }] }) } };
  if (name === '@/services/notificationService') return { notificationService: {
    getNotifications: async (...args) => { calls.push(['load', ...args]); if (failLoad) throw new ApiError('offline'); return records; },
    markRead: async (...args) => {calls.push(['read', ...args]);records=records.map(n=>n.id===args[0]?{...n,is_read:true}:n);},
    deleteNotification:async (...args)=>{calls.push(['delete',...args]);if(failDelete)throw new ApiError('offline');records=records.filter(n=>n.id!==args[0]);},
    markAllRead: async (...args) => calls.push(['allRead', ...args]),
  } };
  return original.call(this, name, ...args);
};
const { default: Screen, isReminder } = require('../src/screens/admin/AdminNotificationsScreen.tsx');
Module._load = original;
const button = (r, label) => r.root.findAllByType('button').find(node => node.props.accessibilityLabel === label);
test('existing admin screen classifies personal reminders, marks read with live API, navigates and retains data on refresh failure', async () => {
  assert.equal(isReminder(records[0]), true);
  let r;
  // A stable translator matches the real provider, avoiding synthetic focus loops in the test.
  try {
    await act(async () => { r = create(React.createElement(Screen)); });
    assert.ok(calls.some(call => call[0] === 'load' && call[2] === true));
    assert.ok(button(r, 'Mark all as read'), 'Admin bulk-read action remains available');
    assert.ok(button(r, 'Own reminder. Unread.'));
    await act(async () => { await button(r, 'Own reminder. Unread.').props.onPress(); });
    assert.ok(calls.some(call => call[0] === 'read' && call[1] === 'personal' && call[2] === true));
    assert.equal(routes.at(-1), '/admin/reminders');
    assert.equal(button(r, 'Manage Announcements'), undefined);
    assert.equal(button(r, 'My Reminders'), undefined);
    failLoad = true;
    await act(async () => { await button(r, 'Refresh').props.onPress(); });
    assert.ok(button(r, 'My announcement. Read.'), 'Existing list remains visible on network failure.');
  } finally { if (r) await act(async () => r.unmount()); }
});

test('private message card shows real metadata, marks read and confirms persistent deletion without removing other notices',async()=>{
  failLoad=false;calls.length=0;
  records=[{id:'message',title:'Client Message',message:'I cannot do 6 PM. Can I do it at 8 PM?',type:'client_chore_message',sender_name:'Chamara',chore_title:'Clean Kitchen',chore_due_date:'2030-10-06T12:30:00Z',created_at:'2030-10-06T10:00:00Z',is_read:false},{id:'other',title:'Keep this notice',message:'Unchanged',type:'announcement',is_read:true,created_at:new Date().toISOString()}];
  let r;
  try{
    await act(async()=>{r=create(React.createElement(Screen));});
    const text=()=>r.root.findAllByType('text').map(n=>n.children.join('')).join(' ');
    assert.match(text(),/Chamara/);assert.match(text(),/Clean Kitchen/);assert.ok(text().includes('Assigned date/time'));assert.match(text(),/Sent:/);
    assert.equal(r.root.findAllByType('time-request-inbox').length,0);
    await act(async()=>{await button(r,'Client Message. Unread.').props.onPress();});
    assert.equal(records[0].is_read,true);assert.ok(button(r,'Client Message. Read.'));
    const trash=()=>button(r,'Delete: Chamara');
    await act(async()=>trash().props.onPress({stopPropagation(){}}));
    assert.match(text(),/Delete message?/);
    await act(async()=>button(r,'Cancel').props.onPress());assert.equal(records.length,2);
    await act(async()=>trash().props.onPress({stopPropagation(){}}));failDelete=true;
    await act(async()=>{await button(r,'Delete').props.onPress();});assert.equal(records.length,2);assert.match(text(),/Could not delete/);
    failDelete=false;await act(async()=>{await button(r,'Delete').props.onPress();});
    assert.equal(records.length,1);assert.equal(button(r,'Client Message. Read.'),undefined);assert.ok(button(r,'Keep this notice. Read.'));
    assert.ok(calls.some(c=>c[0]==='delete'&&c[1]==='message'&&c[2]===true));
    await act(async()=>r.unmount());await act(async()=>{r=create(React.createElement(Screen));});assert.equal(button(r,'Client Message. Read.'),undefined);
  }finally{if(r)await act(async()=>r.unmount());}
});
