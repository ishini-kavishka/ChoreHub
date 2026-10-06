const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
require.extensions['.ts'] = require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText, filename);
const { translations } = require('../src/i18n/translations.ts');
const { notificationDisplay } = require('../src/i18n/clientTranslations.ts');
const original = Module._load;
class ApiError extends Error { constructor(message, status) { super(message); this.status = status; } }
let failStatus, failBadgeOnly = false, realApiHandler, realAuthToken = 'isolated-token';
Module._load = function(name, ...args) {
  if(name==='@/components/notifications/NotificationBell')return require('../src/components/notifications/NotificationBell.tsx');
  if(name==='@/i18n/translations')return require('../src/i18n/translations.ts');
  if(name==='@/components/ui/AppDialog')return {useAppAlert:()=>()=>{}};
  if (name === './authService') return { authService: { getAuthToken: async () => realAuthToken } };
  if (name === './api') return { ApiError, apiRequest: async path => {
    if (realApiHandler) return realApiHandler(path);
    if (failBadgeOnly && !path.endsWith('unread-count')) return {};
    throw new ApiError('Injected API failure', failStatus);
  } };
  return original.call(this, name, ...args);
};
const { notificationService: realService } = require('../src/services/notificationService.ts');
Module._load = original;
test('live deletion never falls back to fake success; badge refresh failure cannot undo a committed delete', async () => {
  for (failStatus of [undefined, 400, 401, 403, 404, 500]) await assert.rejects(realService.deleteNotification('own-id', true), ApiError);
  failBadgeOnly = true; await realService.deleteNotification('own-id', true); failBadgeOnly = false;
});
test('time counts combine with unread and persisted read refresh',async()=>{
  records=[
    {id:'due',title:'Due reminder',message:'My own chore name',type:'reminder_due',is_read:false,created_at:new Date().toISOString()},
    {id:'assigned',title:'Assigned update',message:'My new chore',type:'chore_assigned',is_read:false,created_at:new Date(new Date().setDate(new Date().getDate() - (new Date().getDay()+6)%7)).toISOString()},
    {id:'info',title:'Information',message:'Other update',type:'info',is_read:true,created_at:new Date(2000,0,1).toISOString()},
  ];
  let r;
  try{
    await act(async()=>{r=create(React.createElement(Screen,{kind:'notifications'}));});
    assert.ok(has(r,'All (3)'));assert.ok(has(r,'This Week (2)'));assert.ok(!button(r,'Updates'));assert.ok(has(r,'Today ('));
    await press(r,'Today');assert.ok(button(r,'Due reminder. Unread.'));
    await act(async()=>r.root.findByType('switch').props.onValueChange(true));
    await press(r,'Due reminder. Unread.');assert.ok(!button(r,'Due reminder. Unread.'));
    assert.ok(calls.some(c=>c[0]==='read'&&c[1]==='due'&&c[2]===true));
    await press(r,'This Week');assert.ok(button(r,'Assigned update. Unread.'));assert.ok(!button(r,'Information. Read.'));
    await act(async()=>r.root.findByType('switch').props.onValueChange(false));assert.ok(button(r,'Due reminder. Read.'));assert.ok(!button(r,'Information. Read.'));
    await press(r,'All');await press(r,'Refresh');assert.ok(has(r,'All (3)'));assert.ok(button(r,'Due reminder. Read.'));
    await act(async()=>r.unmount());r=null;
    await act(async()=>{r=create(React.createElement(Screen,{kind:'notifications'}));});assert.ok(button(r,'Due reminder. Read.'));
  }finally{if(r)await act(async()=>r.unmount());}
});
test('logout emits POP_TO_TOP only when a dismissible stack exists, then replaces with welcome',async()=>{
  for(canDismiss of [false,true]){
    routes.length=0;let r;
    const logoutButton=scope=>scope.findAllByType('button').find(n=>n.findAllByType('text').some(child=>child.children.includes(translate('btn_logout'))));
    try{
      await act(async()=>{r=create(React.createElement(Profile));});
      await act(async()=>logoutButton(r.root).props.onPress());
      await act(async()=>logoutButton(r.root.findByType('dialog')).props.onPress());
      assert.deepEqual(routes,canDismiss?['SIGN_OUT','POP_TO_TOP','/auth/welcome']:['SIGN_OUT','/auth/welcome']);
    }finally{if(r)await act(async()=>r.unmount());}
  }
});

const translate = key => translations.en[key];
const calls = [], routes = [];
let inboxParams = {};
let canGoBack = false, canDismiss = false;
let records = [
  { id: 'a1', title: 'My announcement', message: 'Original user message', type: 'announcement', is_read: false },
  { id: 'a2', title: 'Completed chore', message: 'A real completed chore', type: 'chore_completed', is_read: true },
];
let failDelete = false, releaseDelete, deferDelete = false, dark = false;
const unreadListeners=new Set(), sessionListeners=new Set();
let unreadRequests=0;
const publishUnread=()=>unreadListeners.forEach(listener=>listener(records.filter(n=>!n.is_read).length));
const service = {
  subscribeUnreadCount:listener=>{unreadListeners.add(listener);return()=>unreadListeners.delete(listener);},
  getUnreadCount:async strict=>{unreadRequests++;assert.equal(strict,true);return records.filter(n=>!n.is_read).length;},
  getNotifications: async (...args) => { calls.push(['load', ...args]); return records.map(n => ({ ...n })); },
  deleteNotification: async (...args) => {
    calls.push(['delete', ...args]); if (failDelete) throw new Error('Injected offline failure');
    if (deferDelete) await new Promise(resolve => { releaseDelete = resolve; });
    records = records.filter(n => n.id !== args[0]);
  },
  markRead: async (...args) => { calls.push(['read', ...args]); records = records.map(n => n.id === args[0] ? { ...n, is_read:true } : n);publishUnread(); },
  markAllRead: async () => { records = records.map(n => ({ ...n, is_read:true }));publishUnread(); },
};
Module._load = function(name, ...args) {
  if(name==='@/i18n/translations')return require('../src/i18n/translations.ts');
  if(name==='@/components/ui/AppDialog')return {useAppAlert:()=>()=>{}};
  if(name==='@/components/notifications/NotificationBell')return require('../src/components/notifications/NotificationBell.tsx');
  if (name === 'react-native') return { BackHandler:{addEventListener:()=>({remove(){}})}, ActivityIndicator:'loading', Pressable:'button', RefreshControl:'refresh', ScrollView:'scroll', StyleSheet:{ create:value=>value }, Switch:'switch', Text:'text', TextInput:'input', View:'view', Alert:{alert(){}}, Modal:({visible,children})=>visible ? React.createElement('dialog',null,children) : null };
  if (name === 'react-native-safe-area-context') return { SafeAreaView:'safe' };
  if (name === 'react-native-svg')return {__esModule:true,default:'svg',Circle:'circle',Line:'line',Polyline:'polyline'};
  if (name === '@expo/vector-icons') return { Ionicons:'icon' };
  if (name === 'expo-router') return { useLocalSearchParams:()=>inboxParams, useSegments:()=>['home','profile'], useFocusEffect:callback=>React.useEffect(callback,[callback]), router:{push:value=>routes.push(value),back:()=>routes.push('BACK'),canGoBack:()=>canGoBack,navigate:value=>routes.push(value),canDismiss:()=>canDismiss,dismissAll:()=>routes.push('POP_TO_TOP'),replace:value=>routes.push(value)} };
  if (name === '@/context/LanguageContext') return { useLanguage:()=>({t:translate,language:'en'}) };
  if (name === '@/context/ThemeContext') return { useThemedStyles:factory=>factory({isDark:dark,background:dark?'#14121F':'#F8F7FC',card:dark?'#211D30':'#fff',surface:dark?'#342C4C':'#EFEAFF',textPrimary:dark?'#fff':'#211C35',textSecondary:'#655E78',border:'#E7E0F2'}), useAppTheme:()=>({theme:dark?'dark':'light',colors:{isDark:dark,background:dark?'#14121F':'#F8F7FC',card:dark?'#211D30':'#fff',textPrimary:dark?'#fff':'#211C35',textSecondary:dark?'#C0B9D2':'#655E78',surface:dark?'#342C4C':'#EFEAFF',border:dark?'#494059':'#E7E0F2'}}) };
  if (name === '@/i18n/clientTranslations') return {notificationDisplay};
  if (name === '@/services/notificationService') return {notificationService:service,isDemoNotificationMode:()=>false};
  if (name === '@/services/completedChoresService') return {completedChoresService:{get:async(...args)=>{calls.push(['completed',...args]);return [];}}};
  if (name === '@/services/settingsService') return {settingsService:{}};
  if (name === '@/components/profile/Avatar') return {Avatar:'avatar'};
  if (name === '@/services/profileService') return {profileService:{getProfile:async()=>({full_name:'Test member',email:'isolated@example.invalid'})}};
  if (name === '@/services/authService') return {authService:{getCurrentMember:async()=>({id:'member',name:'Chamara'}),signOut:async()=>routes.push('SIGN_OUT')}};
  if (name === '@/services/authStorage') return {subscribeSession:listener=>{sessionListeners.add(listener);return()=>sessionListeners.delete(listener);}};
  if (name === '@/services/choreService') return {choreService:{getMemberChores:async()=>({stats:{total:0,completed:0,pending:0,overdue:0,completionPercentage:0},chores:[]})}};
  return original.call(this,name,...args);
};
const { Component04Screen: Screen } = require('../src/screens/home/Component04Screens.tsx');
const { default: Profile } = require('../src/screens/profile/ProfileScreen.tsx');
const { default: Progress } = require('../src/screens/home/ProgressDashboardScreen.tsx');
const { default: Home } = require('../src/screens/home/MemberHomeScreen.tsx');
Module._load = original;
const button = (r,label)=>r.root.findAllByType('button').find(n=>n.props.accessibilityLabel===label);
const press = async (r,label)=>{assert.ok(button(r,label),label);await act(async()=>button(r,label).props.onPress({stopPropagation(){calls.push(['stopPropagation']);}}));};
const has = (r,text)=>text.startsWith('#')
  ? r.root.findAllByType('view').some(n=>JSON.stringify(n.props.style).includes(text))
  : r.root.findAllByType('text').map(n=>n.children.filter(c=>typeof c==='string'||typeof c==='number').join('')).join(' ').includes(text);
test('client trash confirms, cancels, preserves failed deletes, prevents repeats and updates filters without marking read', async()=>{
  records=[{id:'a1',title:'My announcement',message:'Original user message',type:'announcement',is_read:false,created_at:new Date().toISOString()},{id:'a2',title:'Completed chore',message:'A real completed chore',type:'chore_completed',is_read:true,created_at:new Date(2000,0,1).toISOString()}];
  calls.length=0;routes.length=0;canGoBack=false;dark=false;
  let r;
  try {
    await act(async()=>{r=create(React.createElement(Screen,{kind:'notifications'}));});
    assert.ok(calls.some(c=>c[0]==='load'&&c[1]==='all'&&c[2]===true));
    assert.ok(has(r,'All (2)')); assert.ok(has(r,'Unread (1)'));
    assert.ok(!has(r,'Manage Announcements')); assert.ok(!has(r,'Add Notification'));
    assert.ok(has(r,'Today (1)')); assert.ok(has(r,'This Week (1)')); await press(r,'Today');
    await press(r,'This Week'); assert.ok(button(r,'Remove notification: My announcement'));
    await press(r,'Remove notification: My announcement'); assert.ok(has(r,'Remove notification?')); assert.equal(calls.filter(c=>c[0]==='delete').length,0);
    await press(r,'Cancel'); assert.equal(records.length,2); assert.equal(r.root.findAllByType('dialog').length,0);
    await press(r,'Remove notification: My announcement'); failDelete=true;
    await press(r,'Remove'); assert.ok(has(r,'Unable to delete this notification')); assert.ok(button(r,'Remove notification: My announcement')); failDelete=false;
    deferDelete=true; await press(r,'Remove'); assert.equal(button(r,'Remove').props.disabled,true);
    const started=calls.filter(c=>c[0]==='delete').length;
    await press(r,'Remove'); assert.equal(calls.filter(c=>c[0]==='delete').length,started,'A second tap cannot repeat the request.');
    await act(async()=>releaseDelete()); deferDelete=false;
    assert.equal(records.length,1); assert.ok(!button(r,'Remove notification: My announcement')); assert.ok(has(r,'All (1)')); assert.ok(has(r,'Unread (0)')); assert.ok(has(r,'Today (0)')); assert.ok(has(r,'This Week (0)'));
    assert.ok(!calls.some(c=>c[0]==='read'),'Trash taps never mark the notification read.');
    assert.ok(calls.filter(c=>c[0]==='delete').every(c=>c[2]===true));
    await press(r,'All'); await act(async()=>r.root.findByType('switch').props.onValueChange(true)); assert.ok(has(r,'No matching notifications'));
    await act(async()=>r.root.findByType('switch').props.onValueChange(false)); assert.ok(button(r,'Remove notification: Completed chore'));
    await press(r,'Go back'); assert.equal(routes.at(-1),'/home');
    canGoBack=true; await press(r,'Go back'); assert.equal(routes.at(-1),'BACK');
    await press(r,'My Reminders'); assert.equal(routes.at(-1),'/home/reminders');
    await act(async()=>r.unmount()); r=null; dark=true;
    await act(async()=>{r=create(React.createElement(Screen,{kind:'notifications'}));});
    assert.ok(!button(r,'Remove notification: My announcement'),'Removed notification stays absent after remount.');
    await press(r,'Remove notification: Completed chore'); assert.ok(has(r,'#211D30'),'Confirmation uses dark theme card color.');
    await press(r,'Remove'); assert.ok(has(r,'No notifications yet')); assert.equal(records.length,0);
  } finally {if(r)await act(async()=>r.unmount());}
});


test('time filters respect local midnight and Monday week boundaries',async()=>{
  const NativeDate=Date,now=new NativeDate(2026,9,6,12).getTime();
  global.Date=class extends NativeDate { constructor(...args){super(...(args.length?args:[now]));} static now(){return now;} };
  records=[[6,0,0,0],[5,23,59,59],[5,0,0,0],[4,23,59,59],[7,0,0,0],[12,0,0,0]].map(([day,hour,minute,second],i)=>({id:String(i),title:'Boundary '+i,message:'',type:'info',is_read:false,created_at:new NativeDate(2026,9,day,hour,minute,second).toISOString()}));
  let r;
  try{
    await act(async()=>{r=create(React.createElement(Screen,{kind:'notifications'}));});
    assert.ok(has(r,'All (6)'));assert.ok(has(r,'Today (1)'));assert.ok(has(r,'This Week (4)'));
    await press(r,'Today');assert.ok(button(r,'Boundary 0. Unread.'));assert.ok(!button(r,'Boundary 4. Unread.'));
    await press(r,'This Week');assert.ok(button(r,'Boundary 2. Unread.'));assert.ok(!button(r,'Boundary 3. Unread.'));assert.ok(!button(r,'Boundary 5. Unread.'));
  }finally{if(r)await act(async()=>r.unmount());global.Date=NativeDate;}
});

test('linked assignment keeps Chore navigation without any Message Admin actions',async()=>{
  records=[{id:'linked',title:'New Chore Assigned',message:'Clean Kitchen',type:'chore_assigned',is_read:false,created_at:new Date().toISOString(),chore_id:'actual-chore',chore_title:'Clean Kitchen',chore_due_date:new Date(Date.now()+86400000).toISOString(),assigned_by:'Admin',can_request_time:true},{id:'other',title:'Information',message:'Unrelated notice',type:'info',is_read:false,created_at:new Date().toISOString()}];
  let r;
  try{
    await act(async()=>{r=create(React.createElement(Screen,{kind:'notifications'}));});
    assert.equal(button(r,'Message Admin'),undefined);
    assert.equal(button(r,'Message Admin: Clean Kitchen'),undefined);
    assert.equal(button(r,'Request Time Change'),undefined);
    await press(r,'View Chore');assert.equal(routes.at(-1).pathname,'/home/chore-details');assert.equal(routes.at(-1).params.id,'actual-chore');
    records=records.map(n=>({...n,can_request_time:false}));await press(r,'Refresh');assert.equal(button(r,'Request Time Change'),undefined);
  }finally{if(r)await act(async()=>r.unmount());}
});

test('admin completed history uses the selected household and shared headers stay on the admin routes',async()=>{
  calls.length=0;routes.length=0;canGoBack=false;let r;
  try{
    await act(async()=>{r=create(React.createElement(Screen,{kind:'completed',adminFamily:{id:'selected-household',name:'Selected household'}}));});
    assert.ok(calls.some(c=>c[0]==='completed'&&c[1]==='all'&&c[2]===''&&c[3]==='selected-household'));
    await press(r,translate('ui_open_notifications'));assert.equal(routes.at(-1),'/admin/notifications');
    await press(r,translate('admin_back'));assert.equal(routes.at(-1),'/admin/progress');
    await act(async()=>r.unmount());r=null;
    await act(async()=>{r=create(React.createElement(Screen,{kind:'about',adminFamily:{id:'selected-household',name:'Selected household'}}));});
    await press(r,translate('admin_back'));assert.equal(routes.at(-1),'/admin/settings');
  }finally{if(r)await act(async()=>r.unmount());}
});

test('one Home bell opens the existing inbox; real unread updates and Settings rows have no nested buttons',async()=>{
  let home,settings,inbox;records=[
    {id:'own-assignment',title:'Assigned chore',message:'Your chore',type:'chore_assigned',chore_id:'actual-chore',chore_title:'Clean Room',is_read:false,created_at:new Date().toISOString()},
    {id:'own-reminder',title:'Get ready',message:'Take supplies',type:'reminder_due',is_read:false,created_at:new Date().toISOString()},
  ];routes.length=0;
  const noNestedButtons=r=>{for(const b of r.root.findAllByType('button'))assert.equal(b.findAllByType('button').length,1,`Nested button in ${b.props.accessibilityLabel}`);};
  try{
    await act(async()=>{home=create(React.createElement(Home));settings=create(React.createElement(Screen,{kind:'settings'}));});
    const bell=()=>button(home,translate('ui_open_notifications'));
    assert.equal(home.root.findAllByType('button').filter(n=>n.props.accessibilityLabel===translate('ui_open_notifications')).length,1);
    assert.ok(bell().findAllByType('text').some(n=>n.children.includes("2")));
    assert.equal(button(settings,translate('ui_open_notifications')),undefined);
    noNestedButtons(settings);
    await press(settings,translate('notification_settings'));assert.equal(routes.at(-1),'/home/notification-settings');
    await press(home,translate('ui_open_notifications'));assert.deepEqual(routes.at(-1),{pathname:'/home/notifications',params:{returnTo:'/home'}});
    await act(async()=>{inbox=create(React.createElement(Screen,{kind:'notifications'}));});noNestedButtons(inbox);
    await press(inbox,'Assigned chore. Unread.');
    assert.ok(bell().findAllByType('text').some(n=>n.children.includes("1")));
    assert.equal(button(inbox,translate('mark_all_read')),undefined);
    await press(inbox,'Get ready. Unread.');
    assert.equal(bell().findAllByType('text').length,0,'Zero count has no badge or red dot');
    inboxParams={returnTo:'/home'};await act(async()=>inbox.update(React.createElement(Screen,{kind:'notifications'})));await press(inbox,translate('admin_back'));assert.equal(routes.at(-1),'/home');
    inboxParams={};
    records=Array.from({length:12},(_,i)=>({id:String(i),is_read:false}));await act(async()=>publishUnread());
    assert.ok(bell().findAllByType('text').some(n=>n.children.includes("12")),'Badge shows the actual count, not 9+');
  }finally{for(const r of [home,settings,inbox])if(r)await act(async()=>r.unmount());}
});

test('Home, Progress and other member bells share live counts, one route, persisted reads and origin navigation',async()=>{
  records=[{id:'shared-a',title:'Same assignment',message:'Actual assigned chore',type:'chore_assigned',is_read:false,created_at:new Date().toISOString()},{id:'shared-b',title:'Same reminder',message:'Actual reminder',type:'reminder_due',is_read:false,created_at:new Date().toISOString()}];
  inboxParams={};canGoBack=false;unreadRequests=0;
  let home,progress,other,inbox;
  const badge=(r,value)=>assert.ok(button(r,translate('ui_open_notifications')).findAllByType('text').some(n=>n.children.includes(String(value))));
  try{
    await act(async()=>{home=create(React.createElement(Home));progress=create(React.createElement(Progress));other=create(React.createElement(Screen,{kind:'notificationSettings'}));});
    assert.equal(unreadRequests,1,'Mounted bells share a single live refresh');
    for(const r of [home,progress,other])badge(r,2);
    assert.ok(has(home,'Same assignment'));assert.ok(!has(home,'10:00 AM.'));
    await press(home,translate('ui_open_notifications'));const homeRoute=routes.at(-1);
    await press(progress,translate('ui_open_notifications'));const progressRoute=routes.at(-1);
    assert.equal(homeRoute.pathname,'/home/notifications');assert.equal(progressRoute.pathname,homeRoute.pathname);
    inboxParams=progressRoute.params;
    await act(async()=>{inbox=create(React.createElement(Screen,{kind:'notifications'}));});
    assert.equal(button(inbox,translate('mark_all_read')),undefined);
    assert.equal(button(inbox,translate('pm_message_admin')),undefined);assert.ok(button(inbox,translate('my_reminders')));
    await press(inbox,translate('my_reminders'));assert.equal(routes.at(-1),'/home/reminders');
    assert.ok(button(inbox,'Same assignment. Unread.'));assert.ok(button(inbox,'Same reminder. Unread.'));
    await press(inbox,'Same assignment. Unread.');for(const r of [home,progress,other])badge(r,1);
    await press(inbox,translate('admin_back'));assert.equal(routes.at(-1),'/home/progress');
    inboxParams=homeRoute.params;await act(async()=>inbox.update(React.createElement(Screen,{kind:'notifications'})));
    assert.equal(button(inbox,translate('pm_message_admin')),undefined);
    await press(inbox,'Refresh');assert.ok(button(inbox,'Same assignment. Read.'));assert.equal(button(inbox,translate('mark_all_read')),undefined);
    assert.equal(button(inbox,translate('mark_all_read')),undefined);await press(inbox,'Same reminder. Unread.');for(const r of [home,progress,other])assert.equal(button(r,translate('ui_open_notifications')).findAllByType('text').length,0);
    records.push({id:'new-member',title:'New incoming member update',message:'New real record',type:'family_update',is_read:false,created_at:new Date().toISOString()});
    await act(async()=>publishUnread());for(const r of [home,progress,other])badge(r,1);
    await press(inbox,'Refresh');assert.ok(button(inbox,'New incoming member update. Unread.'));
    await press(other,translate('ui_open_notifications'));assert.equal(routes.at(-1).pathname,homeRoute.pathname);
    await act(async()=>{inbox.unmount();inbox=null;});await act(async()=>{inbox=create(React.createElement(Screen,{kind:'notifications'}));});
    assert.ok(button(inbox,'Same assignment. Read.'));assert.ok(button(inbox,'New incoming member update. Unread.'));
    records=[];await act(async()=>sessionListeners.forEach(listener=>listener()));for(const r of [home,progress,other])assert.equal(button(r,translate('ui_open_notifications')).findAllByType('text').length,0);
  }finally{inboxParams={};for(const r of [home,progress,other,inbox])if(r)await act(async()=>r.unmount());}
});

test('late unread responses cannot undo mark-all-read or leak a previous account inbox',async()=>{
  let release,countRequest;const counts=[],off=realService.subscribeUnreadCount(count=>counts.push(count));
  try{
    realApiHandler=path=>path.endsWith('unread-count')?new Promise(resolve=>{release=resolve;}):Promise.resolve({});
    countRequest=realService.getUnreadCount(true);
    while(!release)await Promise.resolve();
    await realService.markAllRead(true);release({count:3});assert.equal(await countRequest,0);assert.deepEqual(counts,[0]);
    realApiHandler=()=>new Promise(resolve=>{release=resolve;});release=undefined;
    const oldInbox=realService.getNotifications('all',true);
    while(!release)await Promise.resolve();
    realAuthToken='new-account-token';release({notifications:[{id:'old-private-record'}]});
    await assert.rejects(oldInbox,/session has changed/);
  }finally{off();realApiHandler=undefined;realAuthToken='isolated-token';}
});
