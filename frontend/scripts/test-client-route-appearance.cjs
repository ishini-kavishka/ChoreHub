const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const React=require('react'),{create,act}=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;global.requestAnimationFrame=fn=>fn();
require.extensions['.ts']=require.extensions['.tsx']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
require.extensions['.png']=(module)=>{module.exports='image';};
const {translations}=require('../src/i18n/translations.ts');
let mode='light',language='en';
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
  if(name==='react-native-svg')return{__esModule:true,default:'svg',Circle:'circle',Line:'line',Polyline:'polyline'};
  if(name==='expo-image-picker')return{};
  if(name==='expo-splash-screen')return{hideAsync:async()=>{}};
  if(name==='expo-router')return{router:{push(){},replace(){},back(){},canGoBack:()=>true},useFocusEffect:callback=>React.useEffect(callback,[callback]),useLocalSearchParams:()=>({id:'own-chore',title:'Clean Room'}),useSegments:()=>['home']};
  if(name==='@/context/ThemeContext')return{useAppTheme:()=>({colors:tokens[mode],theme:mode,brightness:70,autoBrightness:false,ready:true,setTheme:async value=>{mode=value;},setBrightness:async()=>{},setAutoBrightness:async()=>{}}),useThemedStyles:factory=>factory(tokens[mode])};
  if(name==='@/context/LanguageContext')return{useLanguage:()=>({language,t:translators[language],availableLanguages:langs,setLanguage:async value=>{language=value;},refreshAvailableLanguages:async()=>langs,isLanguageEnabled:()=>true})};
  if(name==='@/services/api')return{ApiError:class ApiError extends Error{}};
  if(name==='@/services/authStorage')return{subscribeSession:()=>()=>{}};
  if(name.startsWith('@/services/'))return{...services,isDemoNotificationMode:()=>false,settingsDemoMode:false,DEFAULT_SUPPORTED_LANGUAGES:langs};
  if(name.startsWith('@/'))return original.call(this,path.resolve(__dirname,'../src',name.slice(2)),...args);
  return original.call(this,name,...args);
};
const routes=[];
for(const group of ['home','profile','support','auth'])for(const filename of fs.readdirSync(path.resolve(__dirname,'../src/app',group))){if(filename.endsWith('.tsx')&&!filename.startsWith('_')&&!filename.startsWith('admin'))routes.push({route:group+'/'+filename.slice(0,-4),Component:require('../src/app/'+group+'/'+filename).default});}
// Alias interception stays active for imports inside nested rendering helpers.
const appearance=[];
for(const {route,Component}of routes)test(route+' updates through all six global combinations',async()=>{
  let r;const texts={};
  try{
    for(const code of ['en','si','ta'])for(const theme of ['light','dark']){
      language=code;mode=theme;await act(async()=>{const element=React.createElement(Component);if(r)r.update(element);else r=create(element);});
      const text=r.root.findAllByType('text').map(n=>n.children.filter(child=>typeof child==='string'||typeof child==='number').join('')).join('|');texts[code]=text;
      assert.ok(text.length,route+' renders content');
      if(route==='home/notifications')assert.ok(!text.includes(translations[code].mark_all_read),'Member inbox hides bulk-read in every theme and language');
      if(route.startsWith('home/'))for(const button of r.root.findAllByType('button'))assert.equal(button.findAllByType('button').length,1,route+' has no nested Pressables');
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
    assert.notEqual(texts.en,texts.si,route+' interface responds to Sinhala');assert.notEqual(texts.en,texts.ta,route+' interface responds to Tamil');
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
    for(const code of ['en','si','ta'])for(const theme of ['light','dark']){
      language=code;mode=theme;await act(async()=>{const element=React.createElement(Component,props);if(r)r.update(element);else r=create(element);});
      assert.equal(r.root.findAllByType('dialog').length,1);
      texts[code]=r.root.findAllByType('text').map(n=>n.children.filter(c=>typeof c==='string').join('')).join('|');
      if(theme==='dark')for(const node of r.root.findAll(n=>typeof n.type==='string')){const style=native.StyleSheet.flatten(node.props.style);assert.ok(!/^#fff(?:fff)?$/i.test(style.backgroundColor||''),name+' must not have white dark-mode surfaces');}
      if(name==='Notification panel')assert.ok(!texts[code].includes(translations[code].mark_all_read),'Legacy member panel hides bulk-read');
      if(name==='Message Admin'){assert.ok(texts[code].includes('Clean Room'));assert.equal(r.root.findByType('input').props.maxLength,500);}
      if(name==='Edit Chore')assert.ok(r.root.findAllByType('input').some(n=>n.props.value==='Clean Room'));
    }
    assert.notEqual(texts.en,texts.si);assert.notEqual(texts.en,texts.ta);
  }finally{if(r)await act(async()=>r.unmount());}
});
test('member bottom navigation uses global colors and translated labels without changing routes',async()=>{
  const {MemberTabBar}=require('../src/components/navigation/MemberTabBar.tsx');let r;
  const props={state:{index:0,routes:['index','chores','calendar','profile'].map(name=>({key:name,name}))},descriptors:Object.fromEntries(['index','chores','calendar','profile'].map(key=>[key,{options:{}}])),navigation:{emit:()=>({}),navigate(){}}};
  try{for(const code of ['en','si','ta'])for(const theme of ['light','dark']){language=code;mode=theme;await act(async()=>{if(r)r.update(React.createElement(MemberTabBar,props));else r=create(React.createElement(MemberTabBar,props));});assert.equal(r.root.findAllByType('button').length,4);assert.equal(r.root.findAllByType('text')[0].children[0],translations[code].tab_home);assert.equal(native.StyleSheet.flatten(r.root.findAllByType('view')[0].props.style).backgroundColor,tokens[mode].card);}}
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
test.after(()=>{Module._load=original;fs.writeFileSync(path.resolve(__dirname,'../.expo/client-route-appearance-results.json'),JSON.stringify(appearance,null,2));});

// Exercise the redesigned charts against loaded records, rather than fixed sample values.
test('member progress charts and filters use actual chores and retain compact responsive bounds',async()=>{
  mode='light';language='en';const originalGet=services.choreService.getMemberChores;
  const now=new Date().toISOString();
  services.choreService.getMemberChores=async()=>({chores:[
    {...chore,id:'a',category:'Kitchen',status:'completed',completed_at:now},
    {...chore,id:'b',category:'Kitchen',status:'pending'},
    {...chore,id:'c',category:'Bathroom',status:'overdue'}
  ]});
  let r;
  try{
    const Component=require('../src/screens/home/ProgressDashboardScreen.tsx').default;
    await act(async()=>{r=create(React.createElement(Component));});
    const labels=()=>r.root.findAllByType('text').map(n=>n.children.join(''));
    assert.ok(labels().includes('33%'));assert.ok(labels().includes('Kitchen'));assert.ok(labels().includes('Bathroom'));
    assert.equal(r.root.findByProps({accessibilityRole:'progressbar'}).props.accessibilityValue.now,33);
    const chart=r.root.findByType('polyline');assert.equal(chart.props.points.split(' ').length,7);
    assert.equal(chart.props.points.split(' ').filter(point=>point.endsWith(',20')).length,1);
    const segments=r.root.findAllByType('circle').filter(n=>n.props.strokeDasharray);
    assert.equal(segments.length,2);
    const totalArc=segments.reduce((sum,n)=>sum+Number(n.props.strokeDasharray.split(' ')[0]),0);
    assert.ok(Math.abs(totalArc-2*Math.PI*49)<.001);
    for(const label of ['This Month','All Time','This Week']){
      const button=r.root.findAllByType('button').find(n=>n.findAllByType('text').some(text=>text.children.includes(label)));
      await act(async()=>button.props.onPress());assert.equal(button.props.accessibilityState.selected,true);
      assert.ok(labels().includes('33%'));
    }
    const layout=native.StyleSheet.flatten(r.root.findByType('scroll').props.contentContainerStyle);
    assert.equal(layout.width,'100%');assert.equal(layout.maxWidth,560);assert.equal(layout.padding,16);
    for(const button of r.root.findAllByType('button'))assert.equal(button.findAllByType('button').length,1);
  }finally{services.choreService.getMemberChores=originalGet;if(r)await act(async()=>r.unmount());}
});
