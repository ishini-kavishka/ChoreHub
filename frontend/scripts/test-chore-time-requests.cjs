const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module'),ts=require('typescript');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
require.extensions['.ts']=require.extensions['.tsx']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,f);
const {translations}=require('../src/i18n/translations.ts');
const t=key=>translations.en[key];
let records=[],dark=false,fail=false,unavailable=false;const calls=[],routes=[];
const future=new Date();future.setDate(future.getDate()+3);future.setHours(18,0,0,0);
const originalDue=future.toISOString();future.setHours(20);const requested=future.toISOString();future.setMinutes(30);const edited=future.toISOString();
const chore={id:'chore',title:'Clean Kitchen',due_date:originalDue};
const row=()=>({id:'request',chore_id:'chore',requester_id:'client',recipient_id:'admin',chore_title:'Clean Kitchen',requester_name:'Chamara',recipient_name:'Admin',original_due_date:originalDue,requested_due_date:requested,current_due_date:originalDue,message:'Class at 6 PM',status:'PENDING',created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
const service={
  list:async admin=>({requests:records.filter(r=>!admin || !r.dismissed)}),
  context:async id=>{if(unavailable)throw new Error('Not assigned to this user');calls.push(['context',id]);return {chore,request:records.find(r=>r.status==='PENDING') || null};},
  get:async id=>({request:{...records.find(r=>r.id===id)}}),
  create:async(id,time,message)=>{calls.push(['create',id,time,message]);if(fail)throw new Error('Offline');records=[{...row(),requested_due_date:time,message}];return {request:records[0]};},
  edit:async(id,time,message)=>{calls.push(['edit',id,time,message]);records=records.map(r=>({...r,requested_due_date:time,message}));return {request:records[0]};},
  cancel:async id=>{calls.push(['cancel',id]);records=records.map(r=>({...r,status:'CANCELLED'}));return {request:records[0]};},
  review:async(id,status,response)=>{calls.push(['review',id,status,response]);records=records.map(r=>({...r,status,admin_response:response}));return {request:records[0]};},
  dismiss:async id=>{calls.push(['dismiss',id]);records=records.map(r=>({...r,dismissed:true}));return {id};},
};
const original=Module._load;
Module._load=function(name,...args){
  if(name==='react-native')return {ActivityIndicator:'loading',Pressable:'button',ScrollView:'scroll',Text:'text',TextInput:'input',View:'view',Modal:({visible,children,onRequestClose})=>visible?React.createElement('dialog',{onRequestClose},children):null};
  if(name==='@expo/vector-icons')return {Ionicons:'icon'};
  if(name==='expo-router')return {useFocusEffect:fn=>React.useEffect(fn,[fn]),router:{push:value=>routes.push(value)}};
  if(name==='@/context/ThemeContext')return {useAppTheme:()=>({colors:{isDark:dark,primary:'#6940E2',textPrimary:dark?'#fff':'#211C35',textSecondary:'#655E78',surface:dark?'#342C4C':'#EFEAFF',card:dark?'#211D30':'#fff',border:'#E7E0F2'}})};
  if(name==='@/context/LanguageContext')return {useLanguage:()=>({t,language:'en'})};
  if(name==='@/services/choreTimeRequestService')return {choreTimeRequestService:service};
  if(name==='@/services/api')return {ApiError:class extends Error{}};
  return original.call(this,name,...args);
};
const {default:Inbox,ChoreTimeRequestButton,parseRequestTime,requestLocalInput}=require('../src/components/notifications/ChoreTimeRequests.tsx');Module._load=original;
const buttons=(r,key)=>r.root.findAllByType('button').filter(n=>n.props.accessibilityLabel===t(key));
const press=async(r,key)=>{const b=buttons(r,key).at(-1);assert.ok(b,key);await act(async()=>b.props.onPress({stopPropagation(){}}));};
const fill=async(r,key,value)=>act(async()=>r.root.findAllByType('input').find(n=>n.props.accessibilityLabel===t(key)).props.onChangeText(value));
const text=r=>r.root.findAllByType('text').map(n=>n.children.filter(x=>typeof x==='string').join('')).join(' ');
test('client creates, edits existing pending request and confirms cancellation in the existing modal flow',async()=>{
  records=[];calls.length=0;fail=false;dark=false;let r,closed=0,changed=0;
  const props={target:{choreId:'chore'},onClose:()=>closed++,onChanged:()=>changed++};
  try{
    await act(async()=>{r=create(React.createElement(Inbox,props));});
    assert.match(text(r),/Clean Kitchen/);assert.match(text(r),/until approval/);
    await press(r,'tr_send');assert.equal(calls.filter(c=>c[0]==='create').length,0);
    const local=requestLocalInput(requested);await fill(r,'tr_date',local.date);await fill(r,'tr_time',local.time);await fill(r,'tr_reason','I have a class at 6 PM.');
    fail=true;await press(r,'tr_send');assert.match(text(r),/Could not load or save/);assert.equal(r.root.findAllByType('dialog').length,1);
    fail=false;await press(r,'tr_send');assert.equal(records.length,1);assert.equal(records[0].status,'PENDING');assert.equal(Date.parse(records[0].requested_due_date),Date.parse(requested));assert.equal(chore.due_date,originalDue);assert.equal(closed,1);
    await act(async()=>r.update(React.createElement(Inbox,{...props,target:{choreId:'chore'}})));
    assert.equal(buttons(r,'tr_send').length,0,'Existing pending request opens details rather than duplicate creation.');
    await press(r,'tr_edit');const localEdit=requestLocalInput(edited);await fill(r,'tr_time',localEdit.time);await fill(r,'tr_reason','Can I do 8:30 PM instead?');await press(r,'tr_save');
    assert.equal(records.length,1);assert.equal(Date.parse(records[0].requested_due_date),Date.parse(edited));assert.equal(calls.filter(c=>c[0]==='edit').length,1);
    await act(async()=>r.update(React.createElement(Inbox,{...props,target:{requestId:'request'}})));
    await press(r,'tr_cancel');assert.match(text(r),/Cancel time change request\?/);await press(r,'cancel');assert.equal(records[0].status,'PENDING');
    await press(r,'tr_cancel');await press(r,'tr_confirm');assert.equal(records[0].status,'CANCELLED');assert.equal(changed,3);
    await act(async()=>r.update(React.createElement(Inbox,{...props,target:{requestId:'request'}})));
    assert.equal(buttons(r,'tr_edit').length,0);assert.equal(buttons(r,'tr_cancel').length,0);
    await press(r,'tr_chore');assert.equal(routes.at(-1).pathname,'/home/chore-details');assert.equal(routes.at(-1).params.id,'chore');
  }finally{if(r)await act(async()=>r.unmount());}
});
test('admin sees member, schedule and reason; confirms review and safely clears processed inbox history',async()=>{
  records=[{...row(),can_review:true}];calls.length=0;dark=true;let r;
  const props={admin:true,target:{requestId:'request'},onClose(){},onChanged(){}};
  try{
    await act(async()=>{r=create(React.createElement(Inbox,props));});
    assert.match(text(r),/Chamara/);assert.match(text(r),/Class at 6 PM/);assert.match(text(r),/Original due time/);assert.match(text(r),/Sent/);
    assert.equal(buttons(r,'tr_remove').length,0);
    await press(r,'tr_approve');assert.match(text(r),/Approve time change\?/);assert.equal(calls.filter(c=>c[0]==='review').length,0);
    await fill(r,'tr_response','8 PM works.');await press(r,'tr_approve');assert.equal(records[0].status,'APPROVED');assert.equal(records[0].admin_response,'8 PM works.');
    await act(async()=>r.update(React.createElement(Inbox,{...props,target:{requestId:'request'}})));
    await press(r,'tr_remove');assert.match(text(r),/request history and Chore stay saved/);
    assert.ok(r.root.findAllByType('view').some(n=>n.props.style?.backgroundColor==='#211D30'));
    await press(r,'notification_remove');assert.equal(records.length,1);assert.equal(records[0].dismissed,true);assert.equal(records[0].status,'APPROVED');
    records=[{...row(),can_review:true}];await act(async()=>r.update(React.createElement(Inbox,{...props,target:{requestId:'request'},refreshKey:1})));
    await press(r,'tr_reject');await fill(r,'tr_response','Keep the original time.');await press(r,'tr_reject');assert.equal(records[0].status,'REJECTED');
  }finally{if(r)await act(async()=>r.unmount());}
});
test('requested local time rejects impossible, invalid, and past schedules',()=>{
  assert.equal(parseRequestTime('2030-02-30','20:00'),null);assert.equal(parseRequestTime('2030-01-01','25:00'),null);assert.equal(parseRequestTime('2000-01-01','20:00'),null);
  const local=requestLocalInput(edited);assert.equal(parseRequestTime(local.date,local.time),edited);
});

test('Chore Details entry uses backend eligibility and opens an existing pending request',async()=>{
  records=[row()];unavailable=false;let r;
  try{
    await act(async()=>{r=create(React.createElement(ChoreTimeRequestButton,{choreId:'chore',onChanged(){}}));});
    assert.equal(buttons(r,'tr_request').length,0);await press(r,'tr_view');assert.match(text(r),/Class at 6 PM/);
    await act(async()=>r.unmount());r=null;unavailable=true;
    await act(async()=>{r=create(React.createElement(ChoreTimeRequestButton,{choreId:'someone-elses-chore',onChanged(){}}));});
    assert.equal(buttons(r,'tr_request').length,0);assert.equal(buttons(r,'tr_view').length,0);
  }finally{if(r)await act(async()=>r.unmount());unavailable=false;}
});

test('a responsible household owner can review from client Notifications using server permission metadata',async()=>{
  records=[{...row(),can_review:true}];let r;
  try{
    await act(async()=>{r=create(React.createElement(Inbox,{target:{requestId:'request'},onClose(){},onChanged(){}}));});
    assert.ok(buttons(r,'tr_approve').length);assert.equal(buttons(r,'tr_edit').length,0);
    await press(r,'tr_reject');await press(r,'tr_reject');assert.equal(records[0].status,'REJECTED');
  }finally{if(r)await act(async()=>r.unmount());}
});
