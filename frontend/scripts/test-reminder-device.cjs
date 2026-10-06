const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module'),ts=require('typescript');
require.extensions['.ts']=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,file);
const platform={OS:'android'},scheduled=new Map(),events=[],channels=new Map();
let permission={granted:true,status:'granted',canAskAgain:true},requests=0,failSchedule=false,handler;
const notifications={AndroidNotificationVisibility:{PRIVATE:0},AndroidImportance:{HIGH:4},IosAuthorizationStatus:{PROVISIONAL:3},SchedulableTriggerInputTypes:{DATE:'date'},
  setNotificationHandler:value=>{handler=value;},getAllScheduledNotificationsAsync:async()=>[...scheduled.values()],
  setNotificationChannelAsync:async(id,value)=>channels.set(id,value),getPermissionsAsync:async()=>permission,
  requestPermissionsAsync:async()=>{requests++;return permission={granted:false,status:'denied',canAskAgain:false};},
  cancelScheduledNotificationAsync:async id=>{events.push(['cancel',id]);scheduled.delete(id);},
  scheduleNotificationAsync:async request=>{if(failSchedule)throw Error('Exact alarm denied');events.push(['schedule',request.identifier]);scheduled.set(request.identifier,request);return request.identifier;},
};
const original=Module._load;
Module._load=function(name,...args){if(name==='react-native')return{Platform:platform};if(name==='expo-notifications')return notifications;return original.call(this,name,...args);};
const {reminderDeviceService:device}=require('../src/services/reminderDeviceService.ts');
let records=[],userId='member',enabled=true;
const load=async()=>({userId,enabled,reminders:records});
const reminder=()=>({id:'own-reminder',title:'Get ready to clean the room',note:'Take cleaning supplies',chore_name:'Clean Room',chore_due_date:'2099-10-10T20:00:00',remind_at:new Date(2099,9,10,19,50).toISOString(),vibrate:true,status:'pending'});

test('real scheduler persists OS identifiers, uses due time/note and correct channels; edit/delete cancel old schedules',async()=>{
  records=[reminder()];await device.reconcile(load);assert.equal(scheduled.size,1);
  const first=[...scheduled.values()][0];assert.equal(first.trigger.type,'date');assert.ok(first.trigger.date instanceof Date);assert.equal(first.trigger.date.getHours(),19);assert.equal(first.trigger.date.getMinutes(),50);
  assert.ok(first.content.body.includes('Clean Room'));assert.ok(first.content.body.includes('Take cleaning supplies'));assert.equal(first.trigger.channelId,'personal-reminders-vibrate-v1');
  assert.equal(channels.get('personal-reminders-vibrate-v1').enableVibrate,true);assert.equal(channels.get('personal-reminders-quiet-v1').enableVibrate,false);
  assert.equal((await handler.handleNotification({request:{content:{data:{}}}})).shouldShowBanner,true);
  events.length=0;await device.reconcile(load);assert.equal(events.length,0,'Reconciliation never duplicates unchanged schedules');
  await device.mutate(records[0].id,load,async()=>{assert.equal(scheduled.size,0,'Cancelled before update');records=[{...records[0],vibrate:false,remind_at:new Date(2099,9,10,19,45).toISOString()}];return{reminder:records[0]};});
  const edited=[...scheduled.values()][0];assert.equal(edited.identifier,first.identifier);assert.equal(edited.trigger.date.getMinutes(),45);assert.equal(edited.trigger.channelId,'personal-reminders-quiet-v1');assert.equal(edited.content.vibrationPattern,undefined);
  await device.mutate(records[0].id,load,async()=>{assert.equal(scheduled.size,0);records=[];return{id:'own-reminder'};});assert.equal(scheduled.size,0);
});
test('failed edits restore the saved schedule; scheduling failure is distinguished from database save failure',async()=>{
  records=[reminder()];await device.reconcile(load);
  await assert.rejects(device.mutate(records[0].id,load,async()=>{throw Error('Database save failed');}),/Database save failed/);assert.equal(scheduled.size,1);
  failSchedule=true;const result=await device.mutate(records[0].id,load,async()=>{records=[{...records[0],title:'Persisted edit'}];return{reminder:records[0]};});assert.equal(result.device_status,'failed');assert.equal(result.reminder.title,'Persisted edit');failSchedule=false;
  await device.reconcile(load);assert.equal([...scheduled.values()][0].content.title,'Persisted edit');
});
test('disabled preference, completed chores and logout cancel only personal reminders, leaving unrelated schedules intact',async()=>{
  scheduled.set('unrelated',{identifier:'unrelated',content:{data:{source:'other-feature'}}});enabled=false;await device.reconcile(load);assert.equal(scheduled.size,1);assert.ok(scheduled.has('unrelated'));
  enabled=true;await device.reconcile(load);assert.equal(scheduled.size,2);records=[{...records[0],status:'unavailable'}];await device.reconcile(load);assert.equal(scheduled.size,1);
  records=[reminder()];await device.reconcile(load);await device.clear();assert.equal(scheduled.size,1);assert.ok(scheduled.has('unrelated'));
});
test('permission denial still saves without repeat prompts; web saves with an explicit unsupported result',async()=>{
  permission={granted:false,status:'undetermined',canAskAgain:true};requests=0;records=[];
  await device.mutate('deleted',load,async()=>({id:'deleted'}),false);assert.equal(requests,0,'Delete does not request notification permission');
  const create=async()=>{records=[reminder()];return{reminder:records[0]};};
  assert.equal((await device.mutate(undefined,load,create)).device_status,'denied');assert.equal(records.length,1);assert.equal(requests,1);
  assert.equal((await device.mutate(undefined,load,create)).device_status,'denied');assert.equal(requests,1);
  platform.OS='web';assert.equal((await device.mutate(undefined,load,create)).device_status,'unsupported');assert.equal(requests,1);
});
test('standalone silent reminder preserves privacy and uses silent vibration channel',async()=>{
  permission={granted:true,status:'granted'};platform.OS='android';enabled=true;userId='member';
  records=[{...reminder(),chore_name:null,chore_due_date:null,sound:false}];await device.reconcile(load);
  const request=[...scheduled.values()].find(n=>n.content.data?.userId==='member');assert.equal(request.content.body,'Take cleaning supplies');assert.equal(request.content.sound,false);assert.equal(request.trigger.channelId,'personal-reminders-silent-vibrate-v1');
  assert.equal((await handler.handleNotification({request})).shouldPlaySound,false);
  assert.equal(channels.get(request.trigger.channelId).sound,null);
});
test.after(()=>{Module._load=original;});
