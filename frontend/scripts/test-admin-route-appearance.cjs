const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const React=require('react'),{create,act}=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;global.requestAnimationFrame=fn=>fn();
require.extensions['.ts']=require.extensions['.tsx']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
require.extensions['.png']=(module)=>{module.exports='image';};
const {translations}=require('../src/i18n/translations.ts');
let mode='light',language='en',realLanguageHook=null;
const hardwareSettingsBack=new Set(), settingsRemovalListeners=new Set(), rootRemovalListeners=new Set();
const rootSettingsNavigation={addListener:(event,fn)=>{rootRemovalListeners.add(fn);return()=>rootRemovalListeners.delete(fn);},getParent:()=>undefined};
const settingsNavigation={addListener:(event,fn)=>{settingsRemovalListeners.add(fn);return()=>settingsRemovalListeners.delete(fn);},getParent:()=>rootSettingsNavigation};
const navigationEvents=[];const preferenceCache=new Map();
const tokens={light:{isDark:false,background:'#F8F7FC',card:'#fff',surface:'#EFEAFF',textPrimary:'#211C35',textSecondary:'#655E78',border:'#E7E0F2',primary:'#7C5CFC',error:'#B3261E',success:'#15803D'},dark:{isDark:true,background:'#14121F',card:'#211D30',surface:'#342C4C',textPrimary:'#fff',textSecondary:'#C0B9D2',border:'#494059',primary:'#7C5CFC',error:'#FFAAA8',success:'#76DEBB'}};
const translators=Object.fromEntries(Object.keys(translations).map(code=>[code,(key,fallback)=>translations[code][key]??fallback??translations[code].error]));
const member={id:'member',name:'Chamara',full_name:'Chamara',email:'chamara@example.invalid',role:'admin',phone:'0123456789'};
const chore={id:'own-chore',title:'Clean Room',description:'Keep my original note',assigned_to:member.id,created_by:'admin',status:'pending',priority:'medium',category:'General',recurrence:'none',due_date:new Date().toISOString(),created_at:new Date().toISOString()};
const stats={completed:0,pending:1,overdue:0,total:1,completionPercentage:0};
const langs=require('../../shared/languages.json').map(item=>({...item,is_enabled:item.translation_supported}));
const native={Text:'text',View:'view',Pressable:'button',TextInput:'input',ScrollView:'scroll',ActivityIndicator:'loading',Switch:'switch',Image:'image',KeyboardAvoidingView:'keyboard',RefreshControl:'refresh',TouchableOpacity:'button',Modal:({visible,children})=>visible?React.createElement('dialog',null,children):null,FlatList:({data,renderItem,ListEmptyComponent,...props})=>React.createElement('list',props,data?.length?data.map((item,index)=>React.createElement(React.Fragment,{key:index},renderItem({item,index}))):ListEmptyComponent),StyleSheet:{create:x=>x,flatten:style=>Array.isArray(style)?Object.assign({},...style.filter(Boolean).map(native.StyleSheet.flatten)):style||{}},Platform:{OS:'web',select:values=>values.web??values.default},Alert:{alert(){}},Linking:{openURL:async()=>{}},BackHandler:{addEventListener:(event,fn)=>{hardwareSettingsBack.add(fn);return{remove:()=>hardwareSettingsBack.delete(fn)};}},Dimensions:{get:()=>({width:900,height:900})}};
const services={authService:{getCurrentMember:async()=>member,signOut:async()=>{},getAuthToken:async()=> 'test'},profileService:{getProfile:async()=>member},choreService:{getMemberChores:async()=>({chores:[chore],stats}),getStats:async()=>({todaysChores:[chore],stats}),getChoreById:async()=>({chore}),getAdminAllUsers:async()=>({users:[member]})},familyService:{getMyFamily:async()=>({family:{id:'family',name:'Original Household',invite_code:'INVITE'},members:[{...member,user_id:member.id,relationship:'mother'}]})},notificationService:{getNotifications:async()=>[{id:'notice',user_id:member.id,title:'Original announcement',message:'Keep my original message',type:'announcement',is_read:false,created_at:new Date().toISOString()}],getUnreadCount:async()=>1,subscribeUnreadCount:()=>()=>{}},completedChoresService:{get:async()=>[]},settingsService:{getPreferences:async()=>({theme:mode,language,brightness:70,auto_brightness:false}),getSupportedLanguages:async()=>langs,getNotificationSettings:async()=>({chore_reminders:true,chore_completions:true,family_updates:true,announcements:true,reminder_time:'10min'}),savePreferences:async()=>({theme:mode,language})},supportTicketService:{getUserTickets:async()=>[]},reminderService:{list:async()=>({reminders:[]}),chores:async()=>({chores:[chore]})},announcementService:{list:async()=>({announcements:[],can_manage:false})}};
services.choreService.getAdminStats=async()=>({chores:[chore],stats});
services.choreService.getChores=async()=>({chores:[chore]});
services.adminComponent04Service={context:async()=>({households:[{id:'family',name:'Original Household'}]}),progress:async()=>({household:{id:'family',name:'Original Household'},range:'today',summary:{total:1,pending:1,completed:0,overdue:0,percentage:0},members:[{id:member.id,name:member.name,total:1,completed:0,percentage:0}],categories:[{name:'General',count:1}],chores:[{...chore,bucket:'pending'}]})};
services.settingsService.isLoaded=()=>true;
services.supportTicketService.getTickets=async()=>[{id:'ticket',ticketNumber:'TEST123',userName:'Original Client',userEmail:'client@example.invalid',subject:'Original Issue',message:'Original request',description:'Original description',status:'open',category:'General Inquiry',createdAt:new Date().toISOString(),adminNotes:'Original reply'}];
const original=Module._load;
Module._load=function(name,...args){
  if(name==='react-native')return {...native,AppState:{addEventListener:()=>({remove(){}})}};
  if(name==='@react-native-async-storage/async-storage')return {getItem:async key=>preferenceCache.get(key)??null,setItem:async(key,value)=>preferenceCache.set(key,value)};
  if(name==='@/services/authStorage')return {getUser:async()=>member,subscribeSession:()=>()=>{}};
  if(name==='react-native-safe-area-context')return{SafeAreaView:'safe',useSafeAreaInsets:()=>({top:0,bottom:0,left:0,right:0})};
  if(name==='@expo/vector-icons')return{Ionicons:'icon'};
  if(name==='react-native-svg')return{__esModule:true,default:'svg',Circle:'circle'};
  if(name==='expo-image-picker')return{};
  if(name==='expo-splash-screen')return{hideAsync:async()=>{}};
  if(name==='expo-router/react-navigation')return{usePreventRemove:(enabled,callback)=>React.useEffect(()=>{if(!enabled)return;const listener=event=>{event.preventDefault();callback({data:event.data});};settingsRemovalListeners.add(listener);rootRemovalListeners.add(listener);return()=>{settingsRemovalListeners.delete(listener);rootRemovalListeners.delete(listener);};},[enabled,callback])};
  if(name==='expo-router')return{useIsFocused:()=>true,useNavigation:()=>settingsNavigation,router:{push:target=>navigationEvents.push(target),navigate:target=>navigationEvents.push(target),replace:target=>navigationEvents.push(target),back(){},canGoBack:()=>true},useFocusEffect:callback=>React.useEffect(callback,[callback]),useLocalSearchParams:()=>({id:'own-chore',title:'Clean Room'}),useSegments:()=>['admin']};
  if(name==='@/context/ThemeContext')return{useAppTheme:()=>({colors:tokens[mode],theme:mode,preference:mode,brightness:70,autoBrightness:false,ready:true,setTheme:async value=>{mode=value;},setBrightness:async()=>{},setAutoBrightness:async()=>{}}),useThemedStyles:factory=>factory(tokens[mode])};
  if(name==='@/context/LanguageContext')return{useLanguage:()=>realLanguageHook?realLanguageHook():({language,t:translators[language],availableLanguages:langs,refreshAvailableLanguages:async()=>langs,setLanguage:async value=>{language=value;},refreshAvailableLanguages:async()=>langs,isLanguageEnabled:()=>true})};
  if(name==='@/services/api')return{ApiError:class ApiError extends Error{}};
  if(name.startsWith('@/services/'))return{...services,isDemoNotificationMode:()=>false,settingsDemoMode:false,DEFAULT_SUPPORTED_LANGUAGES:langs};
  if(name.startsWith('@/'))return original.call(this,path.resolve(__dirname,'../src',name.slice(2)),...args);
  return original.call(this,name,...args);
};
const routes=[];
for(const group of ['admin','support'])for(const filename of fs.readdirSync(path.resolve(__dirname,'../src/app',group))){if(filename.endsWith('.tsx')&&!filename.startsWith('_')&&(group==='admin'||filename.startsWith('admin')))routes.push({route:group+'/'+filename.slice(0,-4),Component:require('../src/app/'+group+'/'+filename).default});}
// Alias interception stays active for imports inside nested rendering helpers.
const appearance=[];
for(const {route,Component}of routes)test(route+' updates through all forty global combinations',async()=>{
  let r;const texts={};
  try{
    for(const code of Object.keys(translations))for(const theme of ['light','dark']){
      language=code;mode=theme;await act(async()=>{const element=React.createElement(Component);if(r)r.update(element);else r=create(element);});
      const text=r.root.findAllByType('text').map(n=>n.children.filter(child=>typeof child==='string'||typeof child==='number').join('')).join('|');texts[code]=text;
      assert.ok(text.length,route+' renders content');
      if(route==='admin/progress'){
        assert.equal(r.root.findAllByType('icon').filter(n=>n.props.name==='notifications-outline').length,0,'Progress header has no bell');
        assert.ok(text.includes('Original Household'),'household header remains');
        assert.ok(text.includes(translations[code].admin_total),'Progress data still renders');
      }
      if(route==='admin/about')assert.equal(r.root.findAllByType('icon').filter(n=>n.props.name==='notifications-outline').length,0,'Admin Settings children have no Member notification bell');
      const root=r.root.findAllByType('safe')[0];
      if(root){const background=native.StyleSheet.flatten(root.props.style).backgroundColor;assert.ok(background,route+' has a surface');if(theme==='dark')assert.ok(!/^#(?:fff(?:fff)?|FAFAFD|F8F7FC)$/i.test(background),route+' dark background is not fixed white');}
      const pale=[];
      if(theme==='dark')for(const node of r.root.findAll(n=>typeof n.type==='string')){
        const style=native.StyleSheet.flatten(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style);
        if(/^#(?:fff(?:fff)?|FAFAFD|F8F7FC)$/i.test(style.backgroundColor||''))pale.push(node.type);
        if(/^#(?:000(?:000)?|1E1B2E)$/i.test(style.color||''))assert.fail(route+' has hardcoded dark text in dark mode');
      }
      assert.equal(pale.length,0,route+' has no fixed white client cards/inputs');
      appearance.push({route,theme,language:code});
    }
    for(const code of Object.keys(translations).filter(code=>code!=='en'))assert.notEqual(texts.en,texts[code],route+' interface responds to '+code);
  }finally{if(r)await act(async()=>r.unmount());}
});
const modalCases=[
  ['Message Admin',require('../src/components/notifications/PrivateChoreMessageForm.tsx').default,{visible:true,initialChoreId:'own-chore',onClose(){},onSent(){}}],
  ['Add Chore',require('../src/components/chores/AddChoreModal.tsx').AddChoreModal,{visible:true,onClose(){},onChoreCreated(){}}],
  ['Edit Chore',require('../src/components/chores/EditChoreModal.tsx').EditChoreModal,{visible:true,chore,onClose(){},onChoreUpdated(){}}],
  ['Notification panel',require('../src/components/notifications/NotificationPanel.tsx').NotificationPanel,{visible:true,onClose(){}}],
];
for(const [name,Component,props]of modalCases)test(name+' modal responds to theme/language and preserves user text',async()=>{
  let r;const texts={};
  try{
    for(const code of Object.keys(translations))for(const theme of ['light','dark']){
      language=code;mode=theme;await act(async()=>{const element=React.createElement(Component,props);if(r)r.update(element);else r=create(element);});
      assert.equal(r.root.findAllByType('dialog').length,1);
      texts[code]=r.root.findAllByType('text').map(n=>n.children.filter(c=>typeof c==='string').join('')).join('|');
      if(theme==='dark')for(const node of r.root.findAll(n=>typeof n.type==='string')){const style=native.StyleSheet.flatten(node.props.style);assert.ok(!/^#fff(?:fff)?$/i.test(style.backgroundColor||''),name+' must not have white dark-mode surfaces');}
      if(name==='Message Admin'){assert.ok(texts[code].includes('Clean Room'));assert.equal(r.root.findByType('input').props.maxLength,500);}
      if(name==='Edit Chore')assert.ok(r.root.findAllByType('input').some(n=>n.props.value==='Clean Room'));
    }
    assert.notEqual(texts.en,texts.si);assert.notEqual(texts.en,texts.ta);
  }finally{if(r)await act(async()=>r.unmount());}
});
test('merged admin bottom navigation keeps four visible tabs with global colors and translated labels',async()=>{
  const {AdminTabBar}=require('../src/components/navigation/AdminTabBar.tsx');let r;
  const props={state:{index:0,routes:['dashboard','progress','notifications','chores','members','profile'].map(name=>({key:name,name}))},descriptors:Object.fromEntries(['dashboard','progress','notifications','chores','members','profile'].map(key=>[key,{options:{}}])),navigation:{emit:()=>({}),navigate(){}}};
  try{for(const code of Object.keys(translations))for(const theme of ['light','dark']){language=code;mode=theme;await act(async()=>{if(r)r.update(React.createElement(AdminTabBar,props));else r=create(React.createElement(AdminTabBar,props));});assert.equal(r.root.findAllByType('button').length,4);assert.equal(r.root.findAllByType('text')[0].children[0],translations[code].home);assert.equal(native.StyleSheet.flatten(r.root.findAllByType('view')[0].props.style).backgroundColor,mode==='dark'?tokens[mode].card:'#FFFFFF');}}
  finally{if(r)await act(async()=>r.unmount());}
});
test('themed shared confirmations preserve callbacks, prevent duplicate actions and follow locale changes',async()=>{
  const {AppDialogProvider,useAppAlert}=require('../src/components/ui/AppDialog.tsx');let show,r,cancelled=0,deleted=0;
  function Trigger(){show=useAppAlert();return null;}
  try{
    mode='dark';language='en';await act(async()=>{r=create(React.createElement(AppDialogProvider,null,React.createElement(Trigger)));});
    await act(async()=>show(translations.en.notification_remove_title,translations.en.notification_delete_body,[{text:translations.en.cancel,onPress:()=>cancelled++},{text:translations.en.delete,style:'destructive',onPress:()=>deleted++}]));
    language='si';await act(async()=>r.update(React.createElement(AppDialogProvider,null,React.createElement(Trigger))));
    assert.ok(r.root.findAllByType('text').some(n=>n.children.includes(translations.si.notification_remove_title)));
    const button=r.root.findAllByType('button').find(n=>n.props.accessibilityLabel===translations.si.delete);assert.ok(button);
    await act(async()=>{button.props.onPress();button.props.onPress();});assert.equal(deleted,1);assert.equal(cancelled,0);assert.equal(r.root.findAllByType('dialog').length,0);
  }finally{if(r)await act(async()=>r.unmount());}
});

function textOf(node){return node.findAllByType('text').map(n=>n.children.filter(c=>typeof c==='string'||typeof c==='number').join('')).join('|');}
function buttonWithText(r,text){return r.root.findAllByType('button').find(n=>textOf(n).includes(text));}
function assertDarkDialog(r){for(const node of r.root.findAll(n=>typeof n.type==='string')){const style=native.StyleSheet.flatten(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style);assert.ok(!/^#(?:fff(?:fff)?|FAFAFD|F8F7FC)$/i.test(style.backgroundColor||''),'dark modal has no white surfaces');}}

for(const name of ['add-chore','edit-chore'])test('Admin '+name+' pickers follow all six combinations and retain stored values',async()=>{
  const Component=routes.find(r=>r.route==='admin/'+name).Component;let r;
  try{for(const code of Object.keys(translations))for(const theme of ['light','dark']){
    language=code;mode=theme;await act(async()=>{r=create(React.createElement(Component));});
    for(const picker of ['Member','Repeat','Date',...(name==='edit-chore'?['Status']:[])]){
      const button=r.root.findAllByType('button').find(n=>n.props.onPress?.toString().includes('setShow'+picker+'Picker(true)'));assert.ok(button,picker+' picker button exists');
      await act(async()=>button.props.onPress());assert.equal(r.root.findAllByType('dialog').length,1);if(theme==='dark')assertDarkDialog(r);
      const modal=r.root.findByType('dialog');assert.equal(modal.findAllByType('scroll').length,1,'picker uses one bounded scroll container');
      for(const n of modal.findAllByType('button'))assert.equal(n.findAllByType('button').length,1,'picker has no nested buttons');
      const options=modal.findByType('scroll').findAllByType('button');assert.ok(options.length);await act(async()=>options.at(-1).props.onPress());assert.equal(r.root.findAllByType('dialog').length,0);

    }
    if(name==='edit-chore')assert.ok(r.root.findAllByType('input').some(n=>n.props.value==='Clean Room'));
    await act(async()=>r.unmount());r=null;
  }}finally{if(r)await act(async()=>r.unmount());}
});

test('Admin Chore create/update/delete retain identifiers and user text in Sinhala dark mode',async()=>{
  const ops=[];services.choreService.createChore=async payload=>ops.push(['create',payload]);services.choreService.updateChore=async(id,payload)=>ops.push(['update',id,payload]);services.choreService.deleteChore=async id=>ops.push(['delete',id]);
  const {AppDialogProvider}=require('../src/components/ui/AppDialog.tsx');let r;language='si';mode='dark';
  try{for(const name of ['add-chore','edit-chore']){
    const Component=routes.find(r=>r.route==='admin/'+name).Component;await act(async()=>{r=create(React.createElement(AppDialogProvider,null,React.createElement(Component)));});
    const title=r.root.findAllByType('input').find(n=>n.props.placeholder===translations.si.ag_enter_title);
    await act(async()=>title.props.onChangeText('Clean Room'));
    await act(async()=>buttonWithText(r,translations.si[name==='add-chore'?'ui_create_chore':'ag_update_chore']).props.onPress());
    const payload=ops.at(-1).at(-1);assert.equal(payload.title,'Clean Room');assert.equal(payload.priority,'medium');assert.equal(payload.recurrence,'none');assert.equal(payload.category,'General');
    await act(async()=>r.unmount());r=null;
  }
  const Component=routes.find(r=>r.route==='admin/chore-details').Component;await act(async()=>{r=create(React.createElement(AppDialogProvider,null,React.createElement(Component)));});
  await act(async()=>buttonWithText(r,translations.si.ag_delete_chore).props.onPress());assertDarkDialog(r);assert.ok(textOf(r.root).includes('Clean Room'));
  await act(async()=>r.root.findAllByType('button').find(n=>n.props.accessibilityLabel===translations.si.delete).props.onPress());assert.deepEqual(ops.at(-1),['delete','own-chore']);
  }finally{if(r)await act(async()=>r.unmount());}
});

test('Admin add-member translates labels while submitting the original relationship identifier',async()=>{
  const ops=[];services.familyService.searchUserByEmail=async()=>({...member,is_already_member:false});services.familyService.addFamilyMember=async(id,relationship)=>ops.push({id,relationship});let r;language='si';mode='dark';
  try{const Component=routes.find(r=>r.route==='admin/add-family-member').Component;await act(async()=>{r=create(React.createElement(Component));});
    await act(async()=>r.root.findByType('input').props.onChangeText(member.email));await act(async()=>r.root.findByType('input').props.onSubmitEditing());
    const button=r.root.findAllByType('button').find(n=>n.props.onPress?.name==='handleAddMember');assert.ok(button);await act(async()=>button.props.onPress());assert.deepEqual(ops,[{id:member.id,relationship:'Mother'}]);
    assert.ok(textOf(r.root).includes(member.name));
    language='ta';await act(async()=>r.update(React.createElement(Component)));assert.ok(textOf(r.root).includes(member.name));assert.ok(textOf(r.root).includes(translations.ta.ag_mother));
  }finally{if(r)await act(async()=>r.unmount());}
});

test('Admin Settings opens the Admin Theme and Language routes; Theme changes only the selected global preference',async()=>{
  let r;language='si';mode='dark';const Component=routes.find(r=>r.route==='admin/settings').Component;
  try{await act(async()=>{r=create(React.createElement(Component));});
    await act(async()=>r.root.findAllByType('button').find(n=>n.props.accessibilityLabel?.startsWith(translations.si.theme+',')).props.onPress());
    assert.deepEqual(navigationEvents.at(-1),{pathname:'/admin/preferences',params:{family_id:'family'}});
    await act(async()=>r.unmount());r=null;
    const Preferences=routes.find(r=>r.route==='admin/preferences').Component;
    await act(async()=>{r=create(React.createElement(Preferences));});
    await act(async()=>buttonWithText(r,translations.si.light_theme).props.onPress());assert.equal(mode,'light');assert.equal(language,'si');
    await act(async()=>r.unmount());r=null;await act(async()=>{r=create(React.createElement(Component));});
    const languageRow=r.root.findAllByType('button').find(n=>n.props.accessibilityLabel?.startsWith(translations.si.language+','));assert.ok(languageRow,'Admin has Language entry');
    await act(async()=>languageRow.props.onPress());assert.deepEqual(navigationEvents.at(-1),{pathname:'/admin/language',params:{family_id:'family'}});
    assert.ok(!textOf(r.root).includes(translations.si.admin_client_languages));
    assert.equal(language,'si');assert.equal(mode,'light');
  }finally{if(r)await act(async()=>r.unmount());}
});


test('Admin private-message removal dialog follows every theme/locale and preserves the client message',async()=>{
  const originalList=services.notificationService.getNotifications;services.notificationService.getNotifications=async()=>[{id:'private',user_id:member.id,title:'Client Message',message:'I cannot do Clean Room at 6 PM.',type:'client_chore_message',sender_name:'Original Client',chore_title:'Clean Room',chore_due_date:chore.due_date,is_read:false,created_at:new Date().toISOString()}];let r;
  try{for(const code of Object.keys(translations))for(const theme of ['light','dark']){language=code;mode=theme;const Component=routes.find(r=>r.route==='admin/notifications').Component;await act(async()=>{r=create(React.createElement(Component));});
    assert.ok(textOf(r.root).includes('I cannot do Clean Room at 6 PM.'));assert.ok(textOf(r.root).includes('Clean Room'));assert.ok(textOf(r.root).includes('Original Client'));
    await act(async()=>r.root.findAllByType('button').find(n=>n.props.accessibilityLabel?.startsWith(translations[code].delete+':')).props.onPress({stopPropagation(){}}));assert.equal(r.root.findAllByType('dialog').length,1);if(theme==='dark')assertDarkDialog(r);assert.ok(textOf(r.root.findByType('dialog')).includes(translations[code].cancel));
    await act(async()=>r.unmount());r=null;
  }}finally{services.notificationService.getNotifications=originalList;if(r)await act(async()=>r.unmount());}
});
test('Admin ticket reply modal follows all six combinations without translating customer content',async()=>{
  let r;const Component=routes.find(r=>r.route==='support/admin-tickets').Component;
  try{for(const code of Object.keys(translations))for(const theme of ['light','dark']){language=code;mode=theme;await act(async()=>{r=create(React.createElement(Component));});
    await act(async()=>r.root.findAllByType('button').find(n=>textOf(n).includes('TEST123')).props.onPress());assert.equal(r.root.findAllByType('dialog').length,1);if(theme==='dark')assertDarkDialog(r);assert.ok(textOf(r.root).includes('Original Client'));assert.ok(r.root.findAllByType('input').some(n=>n.props.value==='Original reply'));assert.ok(textOf(r.root).includes(translations[code].ag_reply_request));
    await act(async()=>r.unmount());r=null;
  }}finally{if(r)await act(async()=>r.unmount());}
});

test('open interpolated Admin dialogs retranslate UI while preserving user content',async()=>{
  const {AppDialogProvider,useAppAlert}=require('../src/components/ui/AppDialog.tsx');let r,show;function Trigger(){show=useAppAlert();return null;}
  try{language='en';mode='dark';await act(async()=>{r=create(React.createElement(AppDialogProvider,null,React.createElement(Trigger)));});
    await act(async()=>show(translations.en.ag_delete_chore,{key:'ag_delete_confirm',values:{title:'Clean Room'}},[{text:translations.en.cancel}]));assert.ok(textOf(r.root).includes('Are you sure'));
    language='si';await act(async()=>r.update(React.createElement(AppDialogProvider,null,React.createElement(Trigger))));assert.ok(textOf(r.root).includes('Clean Room'));assert.ok(!textOf(r.root).includes('Are you sure'));assert.ok(textOf(r.root).includes(translations.si.ag_delete_chore));
  }finally{if(r)await act(async()=>r.unmount());}
});
test('Admin Language uses the real provider to translate every mounted Admin page instantly and persist across restart',async()=>{
  const {LanguageProvider,useLanguage}=require('../src/context/LanguageContext.tsx');
  const originalSave=services.settingsService.savePreferences;services.settingsService.savePreferences=async prefs=>{if(prefs.language)language=prefs.language;return {theme:mode,language};};
  realLanguageHook=useLanguage;language='en';mode='dark';let r;
  const pages=['language','settings','dashboard','progress','notifications','announcements','reminders'];
  const app=()=>React.createElement(LanguageProvider,null,pages.map(name=>React.createElement('page',{key:name,name},React.createElement(routes.find(r=>r.route==='admin/'+name).Component))));
  try{
    await act(async()=>{r=create(app());});
    for(const code of [...Object.keys(translations).filter(code=>code!=='en'),'en']){
      const selector=r.root.findAllByType('page').find(n=>n.props.name==='language');
      const item=langs.find(l=>l.code===code);const button=selector.findAllByType('button').find(n=>n.props.accessibilityLabel===item.name+' ('+item.native_name+')');
      await act(async()=>button.props.onPress());
      assert.equal(preferenceCache.get('chorehub.language.'+member.id),code);
      assert.equal(language,code);assert.equal(mode,'dark','language does not change theme');
      for(const [name,key] of [['settings','admin_settings'],['dashboard','ag_dashboard'],['progress','admin_progress'],['notifications','notifications'],['announcements','household_announcements'],['reminders','my_reminders']]){
        const page=r.root.findAllByType('page').find(n=>n.props.name===name);
        assert.ok(textOf(page).includes(translations[code][key]),name+' responds immediately to '+code);
      }
      assert.equal(selector.findAllByType('button').filter(n=>n.props.accessibilityRole==='radio'&&n.props.accessibilityState.selected).length,1);
    }
    const selector=r.root.findAllByType('page').find(n=>n.props.name==='language');
    for(const query of langs.filter(item=>item.translation_supported).flatMap(item=>[item.name,item.native_name])){
      await act(async()=>selector.findByType('input').props.onChangeText(query));
      assert.equal(selector.findAllByType('button').filter(n=>n.props.accessibilityRole==='radio').length,1);
    }
    await act(async()=>selector.findByType('input').props.onChangeText(''));
    await act(async()=>selector.findAllByType('button').find(n=>n.props.accessibilityLabel.startsWith('Tamil')).props.onPress());
    await act(async()=>r.unmount());await act(async()=>{r=create(app());});
    assert.ok(textOf(r.root.findAllByType('page').find(n=>n.props.name==='settings')).includes(translations.ta.admin_settings),'restart restores Tamil');
    const languagePage=r.root.findAllByType('page').find(n=>n.props.name==='language');await act(async()=>languagePage.findAllByType('button').find(n=>n.props.accessibilityLabel===translations.ta.go_back).props.onPress());
    assert.deepEqual(navigationEvents.at(-1),{pathname:'/admin/settings',params:{family_id:'family'}});
  }finally{if(r)await act(async()=>r.unmount());realLanguageHook=null;services.settingsService.savePreferences=originalSave;}
});
test('all five Admin Settings children keep header, hardware and root history back in Admin Settings, including direct-link remounts',async()=>{
  language='en';mode='light';let r;
  try{for(const name of ['reminder-time','about','language','preferences','notification-settings']){
    const Component=routes.find(item=>item.route==='admin/'+name).Component;
    for(const restart of [false,true]){
      navigationEvents.length=0;
      await act(async()=>{r=create(React.createElement(Component));});
      const buttons=r.root.findAllByType('button');assert.ok(buttons.length,name+' renders the authenticated Admin child');
      await act(async()=>buttons[0].props.onPress());
      const expected={pathname:'/admin/settings',params:{family_id:'family'}};
      assert.deepEqual(navigationEvents.at(-1),expected,name+' header back');
      assert.equal(hardwareSettingsBack.size,1,name+' has exactly one focused hardware back handler');
      await act(async()=>assert.equal([...hardwareSettingsBack][0](),true));
      assert.deepEqual(navigationEvents.at(-1),expected,name+' hardware back');
      assert.equal(rootRemovalListeners.size,1,name+' protects the root navigator');
      let prevented=false;
      await act(async()=>[...rootRemovalListeners][0]({data:{action:{type:restart?'POP':'GO_BACK'}},preventDefault(){prevented=true;}}));
      assert.equal(prevented,true,name+' prevents leaving the Admin navigator via history back');
      assert.deepEqual(navigationEvents.at(-1),expected,name+' history back');
      assert.ok(navigationEvents.every(target=>(typeof target==='string'?target:target.pathname).startsWith('/admin/')));
      for(const button of buttons)assert.equal(button.findAllByType('button').length,1,'no nested setting buttons');
      await act(async()=>r.unmount());r=null;
      assert.equal(hardwareSettingsBack.size,0);assert.equal(rootRemovalListeners.size,0);
    }
  }}finally{if(r)await act(async()=>r.unmount());}
});

test('Admin App Settings rows are full touch targets, retain household/privacy settings, and return to Admin Profile',async()=>{
  language='en';mode='light';let r;
  try{const Component=routes.find(item=>item.route==='admin/settings').Component;await act(async()=>{r=create(React.createElement(Component));});
    assert.ok(textOf(r.root).includes('Original Household'));assert.ok(textOf(r.root).includes(translations.en.admin_privacy));
    for(const [key,name]of [['notification_settings','notification-settings'],['reminder_time','reminder-time'],['theme','preferences'],['language','language'],['about_app','about']]){
      const row=r.root.findAllByType('button').find(n=>n.props.accessibilityLabel?.startsWith(translations.en[key]+','));assert.ok(row,key+' row');
      assert.equal(row.props.disabled,false);assert.equal(row.findAllByType('button').length,1);
      assert.ok(native.StyleSheet.flatten(row.props.style({pressed:false})).minHeight>=44);
      await act(async()=>row.props.onPress());assert.deepEqual(navigationEvents.at(-1),{pathname:'/admin/'+name,params:{family_id:'family'}});
    }
    const scroll=r.root.findByType('scroll');const body=native.StyleSheet.flatten(scroll.props.contentContainerStyle);
    assert.equal(body.width,'100%');assert.equal(body.maxWidth,800);assert.ok(body.paddingBottom>=36);
    await act(async()=>r.root.findAllByType('button')[0].props.onPress());assert.deepEqual(navigationEvents.at(-1),{pathname:'/admin/profile'});
  }finally{if(r)await act(async()=>r.unmount());}
});

test('Member and signed-out sessions cannot render any Admin Settings route',async()=>{
  const originalUser=services.authService.getCurrentMember,originalContext=services.adminComponent04Service.context;let r,contextCalls=0;
  services.adminComponent04Service.context=async()=>{contextCalls++;return originalContext();};
  try{for(const user of [{...member,role:'member'},null])for(const name of ['settings','reminder-time','about','language','preferences','notification-settings']){
    services.authService.getCurrentMember=async()=>user;navigationEvents.length=0;contextCalls=0;
    const Component=routes.find(item=>item.route==='admin/'+name).Component;await act(async()=>{r=create(React.createElement(Component));});
    assert.equal(navigationEvents.at(-1),user?'/home/settings':'/auth/login');assert.equal(contextCalls,0,'denied session never requests Admin household data');
    assert.equal(r.root.findAllByType('button').length,0);await act(async()=>r.unmount());r=null;
  }}finally{if(r)await act(async()=>r.unmount());services.authService.getCurrentMember=originalUser;services.adminComponent04Service.context=originalContext;}
});

test('Client Reminder Time and About retain Client header, hardware and history-back destinations',async()=>{
  language='en';mode='light';let r;
  try{for(const name of ['reminder-time','about']){
    const Component=require('../src/app/home/'+name+'.tsx').default;navigationEvents.length=0;
    await act(async()=>{r=create(React.createElement(Component));});
    await act(async()=>r.root.findAllByType('button')[0].props.onPress());assert.deepEqual(navigationEvents.at(-1),{pathname:'/home/settings'});
    await act(async()=>[...hardwareSettingsBack][0]());assert.deepEqual(navigationEvents.at(-1),{pathname:'/home/settings'});
    let prevented=false;await act(async()=>[...rootRemovalListeners][0]({data:{action:{type:'GO_BACK'}},preventDefault(){prevented=true;}}));assert.ok(prevented);
    assert.deepEqual(navigationEvents.at(-1),{pathname:'/home/settings'});assert.ok(navigationEvents.every(target=>target.pathname.startsWith('/home/')));
    await act(async()=>r.unmount());r=null;
  }}finally{if(r)await act(async()=>r.unmount());}
});

test('Admin Notification Settings retain due-date and weekly-summary API switches without changing Reminder Time',async()=>{
  language='en';mode='light';const originalGet=services.settingsService.getNotificationSettings,originalSave=services.settingsService.saveNotificationSettings;
  let stored={chore_reminders:true,chore_completions:true,family_updates:true,announcements:false,due_date_alerts:true,weekly_summary:true,reminder_time:'30min'},r;const writes=[];
  services.settingsService.getNotificationSettings=async()=>({...stored});
  services.settingsService.saveNotificationSettings=async patch=>{writes.push(patch);stored={...stored,...patch};return {...stored};};
  try{const Component=routes.find(item=>item.route==='admin/notification-settings').Component;await act(async()=>{r=create(React.createElement(Component));});
    for(const [key,label]of [['due_date_alerts','admin_due'],['weekly_summary','admin_weekly']]){
      const toggle=r.root.findAllByType('switch').find(n=>n.props.accessibilityLabel===translations.en[label]);assert.ok(toggle,key+' still exists');
      await act(async()=>toggle.props.onValueChange(false));assert.deepEqual(writes.at(-1),{[key]:false});assert.equal(stored.reminder_time,'30min');
    }
  }finally{if(r)await act(async()=>r.unmount());services.settingsService.getNotificationSettings=originalGet;services.settingsService.saveNotificationSettings=originalSave;}
});

test.after(()=>{Module._load=original;fs.writeFileSync(path.resolve(__dirname,'../.expo/admin-route-appearance-results.json'),JSON.stringify(appearance,null,2));});
