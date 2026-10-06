const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const React=require('react'),{create,act}=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;global.requestAnimationFrame=fn=>fn();
require.extensions['.ts']=require.extensions['.tsx']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
require.extensions['.png']=(module)=>{module.exports='image';};
const {translations}=require('../src/i18n/translations.ts');
let mode='light',language='en'; const navigation=[];
const tokens={light:{isDark:false,background:'#F8F7FC',card:'#fff',surface:'#EFEAFF',textPrimary:'#211C35',textSecondary:'#655E78',border:'#E7E0F2',primary:'#7C5CFC',error:'#B3261E',success:'#15803D'},dark:{isDark:true,background:'#14121F',card:'#211D30',surface:'#342C4C',textPrimary:'#fff',textSecondary:'#C0B9D2',border:'#494059',primary:'#7C5CFC',error:'#FFAAA8',success:'#76DEBB'}};
const translators=Object.fromEntries(['en','si','ta'].map(code=>[code,(key,fallback)=>translations[code][key]??fallback??translations[code].error]));
const member={id:'member',name:'Chamara',full_name:'Chamara',email:'chamara@example.invalid',role:'member',phone:'0123456789'};
const chore={id:'own-chore',title:'Clean Room',description:'Keep my original note',assigned_to:member.id,created_by:'admin',status:'pending',priority:'medium',category:'General',recurrence:'none',due_date:new Date().toISOString(),created_at:new Date().toISOString()};
const stats={completed:0,pending:1,overdue:0,total:1,completionPercentage:0};
const langs=['en','si','ta'].map(code=>({code,name:code,native_name:code,is_enabled:true,translation_supported:true}));
const native={Text:'text',View:'view',Pressable:'button',TextInput:'input',ScrollView:'scroll',ActivityIndicator:'loading',Switch:'switch',Image:'image',KeyboardAvoidingView:'keyboard',RefreshControl:'refresh',TouchableOpacity:'button',Modal:({visible,children})=>visible?React.createElement('dialog',null,children):null,FlatList:({data,renderItem,ListEmptyComponent,...props})=>React.createElement('list',props,data?.length?data.map((item,index)=>React.createElement(React.Fragment,{key:index},renderItem({item,index}))):ListEmptyComponent),StyleSheet:{create:x=>x,flatten:style=>Array.isArray(style)?Object.assign({},...style.filter(Boolean).map(native.StyleSheet.flatten)):style||{}},Platform:{OS:'web',select:values=>values.web??values.default},Alert:{alert(){}},Linking:{openURL:async()=>{}},BackHandler:{addEventListener:()=>({remove(){}})},Dimensions:{get:()=>({width:900,height:900})}};
const services={authService:{getCurrentMember:async()=>member,signOut:async()=>{},getAuthToken:async()=> 'test'},profileService:{getProfile:async()=>member},choreService:{getMemberChores:async()=>({chores:[chore],stats}),getStats:async()=>({todaysChores:[chore],stats}),getChoreById:async()=>({chore}),getAdminAllUsers:async()=>({users:[member]})},familyService:{getMyFamily:async()=>({family:{id:'family',name:'Original Household',invite_code:'INVITE'},members:[{...member,user_id:member.id,relationship:'mother'}]})},notificationService:{getNotifications:async()=>[{id:'notice',user_id:member.id,title:'Original announcement',message:'Keep my original message',type:'announcement',is_read:false,created_at:new Date().toISOString()}],getUnreadCount:async()=>1,subscribeUnreadCount:()=>()=>{}},completedChoresService:{get:async()=>[]},settingsService:{getPreferences:async()=>({theme:mode,language,brightness:70,auto_brightness:false}),getSupportedLanguages:async()=>langs,getNotificationSettings:async()=>({chore_reminders:true,chore_completions:true,family_updates:true,announcements:true,reminder_time:'10min'}),savePreferences:async()=>({theme:mode,language})},supportTicketService:{getUserTickets:async()=>[]},reminderService:{list:async()=>({reminders:[]}),chores:async()=>({chores:[chore]})},announcementService:{list:async()=>({announcements:[],can_manage:false})}};
const original=Module._load;
Module._load=function(name,...args){
  if(name==='react-native')return native;
  if(name==='react-native-safe-area-context')return{SafeAreaView:'safe',useSafeAreaInsets:()=>({top:0,bottom:0,left:0,right:0})};
  if(name==='@expo/vector-icons')return{Ionicons:'icon'};
  if(name==='react-native-svg')return{__esModule:true,default:'svg',Circle:'circle'};
  if(name==='expo-image-picker')return{};
  if(name==='expo-splash-screen')return{hideAsync:async()=>{}};
  if(name==='expo-router')return{router:{push(){},replace(){},back(){navigation.push('back');},navigate(route){navigation.push(route);},canGoBack:()=>true},useFocusEffect:callback=>React.useEffect(callback,[callback]),useLocalSearchParams:()=>({id:'own-chore',title:'Clean Room'}),useSegments:()=>['home']};
  if(name==='@/context/ThemeContext')return{useAppTheme:()=>({colors:tokens[mode],theme:mode,brightness:70,autoBrightness:false,ready:true,setTheme:async value=>{mode=value;},setBrightness:async()=>{},setAutoBrightness:async()=>{}}),useThemedStyles:factory=>factory(tokens[mode])};
  if(name==='@/context/LanguageContext')return{useLanguage:()=>({language,t:translators[language],availableLanguages:langs,setLanguage:async value=>{language=value;},refreshAvailableLanguages:async()=>langs,isLanguageEnabled:()=>true})};
  if(name==='@/services/authStorage')return{subscribeSession:()=>()=>{}};
  if(name==='@/services/api')return{ApiError:class ApiError extends Error{}};
  if(name.startsWith('@/services/'))return{...services,isDemoNotificationMode:()=>false,settingsDemoMode:false,DEFAULT_SUPPORTED_LANGUAGES:langs};
  if(name.startsWith('@/'))return original.call(this,path.resolve(__dirname,'../src',name.slice(2)),...args);
  return original.call(this,name,...args);
};

let stored={chore_reminders:true,chore_completions:true,family_updates:true,announcements:false,reminder_time:'10min'}, failSave=false, failLoad=false, saveDelay;
const writes=[];
services.settingsService.getNotificationSettings=async strict=>{assert.equal(strict,true);if(failLoad)throw Error('offline');return {...stored};};
services.settingsService.saveNotificationSettings=async patch=>{writes.push(patch);if(saveDelay)await saveDelay;if(failSave)throw Error('offline');stored={...stored,...patch};return {...stored};};
const {Component04Screen}=require('../src/screens/home/Component04Screens.tsx');const Reminder=require('../src/screens/home/ReminderTimeScreen.tsx').default;
const {AppDialogProvider}=require('../src/components/ui/AppDialog.tsx');
const element=()=>React.createElement(AppDialogProvider,null,React.createElement(Reminder));
const save=r=>r.root.findAllByType('button').find(n=>n.props.accessibilityLabel===translators[language]('ui_stay_on_track_reminders_follow_your_selected_time'));
const selected=r=>r.root.findAllByType('button').filter(n=>n.props.accessibilityRole==='radio'&&n.props.accessibilityState.selected);
function textOf(node){return node.findAllByType('text').map(n=>n.children.filter(c=>typeof c==='string').join('')).join('|');}
test('Reminder Time saves only its enum, suppresses duplicate taps and preserves category switches',async()=>{
  let r,release;language='si';mode='dark';stored={chore_reminders:true,chore_completions:false,family_updates:true,announcements:false,reminder_time:'10min'};writes.length=0;
  try{await act(async()=>{r=create(element());});const button=r.root.findAllByType('button').find(n=>textOf(n).includes(translations.si['30_min']));
    saveDelay=new Promise(resolve=>release=resolve);await act(async()=>{button.props.onPress();});assert.equal(writes.length,0);assert.equal(selected(r).length,1);assert.equal(selected(r)[0].props.accessibilityLabel,translations.si['30_min']);await act(async()=>{save(r).props.onPress();save(r).props.onPress();});assert.deepEqual(writes,[{reminder_time:'30min'}]);assert.equal(save(r).props.disabled,true);assert.equal(save(r).props.accessibilityState.busy,true);assert.equal(navigation.length,0);
    await act(async()=>{release();await saveDelay;});saveDelay=null;assert.equal(stored.reminder_time,'30min');assert.equal(stored.chore_completions,false);assert.equal(stored.family_updates,true);assert.deepEqual(navigation,['back']);assert.ok(textOf(r.root).includes(translations.si.settings_saved));
    await act(async()=>r.unmount());r=null;language='ta';await act(async()=>{r=create(element());});assert.equal(selected(r)[0].props.accessibilityLabel,translations.ta['30_min']);await act(async()=>r.root.findAllByType('button').find(n=>n.props.accessibilityLabel===translations.ta['1_hour']).props.onPress());await act(async()=>save(r).props.onPress());assert.equal(stored.reminder_time,'1hour');await act(async()=>r.unmount());r=null;await act(async()=>{r=create(element());});assert.equal(selected(r)[0].props.accessibilityLabel,translations.ta['1_hour']);
  }finally{saveDelay=null;if(r)await act(async()=>r.unmount());}
});
test('Notification Settings saves one toggle without overwriting a newer Reminder Time',async()=>{
  let r;language='en';mode='dark';writes.length=0;stored={chore_reminders:true,chore_completions:true,family_updates:true,announcements:false,reminder_time:'30min'};
  try{await act(async()=>{r=create(React.createElement(Component04Screen,{kind:'notificationSettings'}));});stored.reminder_time='1hour';
    await act(async()=>r.root.findAllByType('switch')[1].props.onValueChange(false));assert.deepEqual(writes,[{chore_completions:false}]);assert.equal(stored.reminder_time,'1hour');assert.equal(stored.family_updates,true);
    failSave=true;await act(async()=>r.root.findAllByType('switch')[0].props.onValueChange(false));assert.equal(r.root.findAllByType('switch')[0].props.value,true);assert.ok(textOf(r.root).includes(translations.en.admin_save_error));
  }finally{failSave=false;if(r)await act(async()=>r.unmount());}
});
test('settings retrieval failure displays a real error and reminder save failure keeps its draft for retry',async()=>{
  let r;language='en';mode='light';failLoad=true;navigation.length=0;
  try{await act(async()=>{r=create(element());});assert.ok(textOf(r.root).includes(translations.en.admin_error));await act(async()=>r.unmount());r=null;failLoad=false;stored.reminder_time='10min';failSave=true;
    await act(async()=>{r=create(element());});await act(async()=>r.root.findAllByType('button').find(n=>textOf(n).includes(translations.en['1_day'])).props.onPress());await act(async()=>save(r).props.onPress());assert.equal(stored.reminder_time,'10min');assert.ok(textOf(r.root).includes(translations.en.admin_save_error));assert.equal(selected(r)[0].props.accessibilityLabel,translations.en['1_day']);assert.equal(navigation.length,0);assert.equal(save(r).props.disabled,false);failSave=false;await act(async()=>save(r).props.onPress());assert.equal(stored.reminder_time,'1day');assert.deepEqual(navigation,['back']);
  }finally{failLoad=false;failSave=false;if(r)await act(async()=>r.unmount());}
});
test.after(()=>{Module._load=original;});
