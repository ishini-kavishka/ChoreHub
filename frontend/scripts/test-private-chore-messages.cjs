const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module');
const ts=require('typescript'),React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
require.extensions['.ts']=require.extensions['.tsx']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,filename);
const {translations}=require('../src/i18n/translations.ts');
let language='en',failLoad=false,failSend=false,deferred,failStatus;
const colors={card:'#211D30',surface:'#342C4C',primary:'#7C5CFC',textPrimary:'#fff',textSecondary:'#C0B9D2',border:'#494059',isDark:true};
const calls=[],chores=[{id:'own',title:'Clean Kitchen',due_date:'2030-10-06T12:30:00Z'},{id:'second',title:'Other assigned Chore'}];
const original=Module._load;
class ApiError extends Error { constructor(message,status) { super(message);this.status=status; } }
Module._load=function(name,...args){
  if(name==='@/i18n/translations')return require('../src/i18n/translations.ts');
  if(name==='@/services/api')return{ApiError};
  if(name==='react-native')return {ActivityIndicator:'loading',Pressable:'button',ScrollView:'scroll',Text:'text',TextInput:'input',View:'view',Modal:({visible,children})=>visible?React.createElement('dialog',null,children):null};
  if(name==='@/context/ThemeContext')return{useAppTheme:()=>({colors})};
  if(name==='@/context/LanguageContext')return{useLanguage:()=>({language,t:key=>translations[language][key]})};
  if(name==='@/services/choreService')return{choreService:{getMemberChores:async()=>{calls.push(['ownChores']);if(failLoad)throw Error('offline');return{chores};}}};
  if(name==='@/services/notificationService')return{notificationService:{sendChoreMessage:async(id,message)=>{calls.push(['send',id,message]);if(failStatus)throw new ApiError('Expected failure',failStatus);if(failSend)throw Error('offline');if(deferred)await deferred;return{notification:{id:'persisted'}};}}};
  return original.call(this,name,...args);
};
const Form=require('../src/components/notifications/PrivateChoreMessageForm.tsx').default;Module._load=original;
const button=(r,key)=>r.root.findAllByType('button').find(n=>n.props.accessibilityLabel===translations[language][key]);
const press=async(r,key)=>act(async()=>{await button(r,key).props.onPress();});
test('simple form uses own Chores, validates, retains failed input, prevents double sends and closes after success',async()=>{
  let r,closed=0,sent=0;
  try{
    await act(async()=>{r=create(React.createElement(Form,{visible:true,initialChoreId:'own',onClose:()=>closed++,onSent:()=>sent++}));});
    assert.ok(calls.some(c=>c[0]==='ownChores'));
    assert.equal(r.root.findByType('input').props.maxLength,500);
    assert.equal(r.root.findByType('scroll').props.style.backgroundColor,colors.card);
    await press(r,'pm_send');assert.equal(calls.filter(c=>c[0]==='send').length,0);
    await act(async()=>r.root.findByType('input').props.onChangeText(' I cannot do 6 PM. Can I do 8 PM? '));
    failSend=true;await press(r,'pm_send');assert.equal(closed,0);assert.equal(sent,0);assert.ok(r.root.findByType('input').props.value.includes('6 PM'));
    assert.ok(r.root.findAllByType('text').some(n=>n.children.join('').includes(translations.en.pm_send_error)));
    failSend=false;
    for(const [status,key]of [[409,'pm_no_admin'],[404,'pm_not_assigned'],[401,'pm_session_error']]){
      failStatus=status;await press(r,'pm_send');assert.equal(closed,0);
      assert.ok(r.root.findAllByType('text').some(n=>n.children.join('').includes(translations.en[key])));
    }
    failStatus=undefined;
    failSend=false;let resolve;deferred=new Promise(done=>resolve=done);
    await act(async()=>{button(r,'pm_send').props.onPress();});const count=calls.filter(c=>c[0]==='send').length;
    await act(async()=>{button(r,'pm_send').props.onPress();});assert.equal(calls.filter(c=>c[0]==='send').length,count);
    await act(async()=>{resolve();await deferred;});assert.equal(closed,1);assert.equal(sent,1);assert.deepEqual(calls.at(-1),['send','own','I cannot do 6 PM. Can I do 8 PM?']);
  }finally{deferred=undefined;failStatus=undefined;if(r)await act(async()=>r.unmount());}
});
test('empty selection, load retry, cancellation and all supported translations preserve simple form',async()=>{
  for(language of ['en','si','ta']){
    for(const [key,value]of Object.entries(translations[language]).filter(([key])=>key.startsWith('pm_')))assert.ok(value&&!/^\?+$/.test(value),key);
    let r,closed=0;
    try{
      failLoad=true;await act(async()=>{r=create(React.createElement(Form,{visible:true,initialChoreId:'foreign',onClose:()=>closed++,onSent:()=>assert.fail('Must not send')}));});
      assert.ok(button(r,'crud_retry'));failLoad=false;await press(r,'crud_retry');
      assert.ok(button(r,'pm_select_chore'));await press(r,'pm_select_chore');
      assert.equal(r.root.findAllByType('button').filter(n=>n.children.some(child=>typeof child!=='string'&&child.type==='text'&&child.children.includes('Clean Kitchen'))).length,1);
      await press(r,'cancel');assert.equal(closed,1);
      assert.equal(r.root.findAllByType('input').length,1,'No requested-date/time or approval fields');
    }finally{if(r)await act(async()=>r.unmount());}
  }
});
