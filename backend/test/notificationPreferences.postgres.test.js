const {test}=require('node:test'), assert=require('node:assert/strict'), {randomUUID}=require('node:crypto');
require('dotenv').config({quiet:true});
const jwt=require('jsonwebtoken'), bcrypt=require('bcryptjs');
const {pool}=require('../src/config/db'), app=require('../src/server');
const {ensureReminderDeliverySchema,processDueReminders,reminderTrigger,notifyFamilyUpdate}=require('../src/services/notificationDeliveryService');

test('all reminder offsets calculate absolute timestamps across timezone offsets',()=>{
  const due='2031-04-10T18:00:00+05:30';
  for(const [option,minutes] of [['10min',10],['30min',30],['1hour',60],['1day',1440]])
    assert.equal(new Date(due)-reminderTrigger(due,option),minutes*60000);
  assert.throws(()=>reminderTrigger('invalid'));assert.throws(()=>reminderTrigger(due,'translated label'));
});

test('real notification preferences, independent users, scheduling, cancellation, history and delivery deduplication',{
  skip:process.env.RUN_DATABASE_TESTS!=='1',timeout:360000,
},async()=>{
  const accounts=[];let server,family;
  try{
    await ensureReminderDeliverySchema();
    const hash=await bcrypt.hash('Isolated-preference-test',4);
    for(const [name,role]of [['Preference Admin','admin'],['Preference Chamara','member'],['Preference Kasun','member']]){
      const row=(await pool.query('INSERT INTO users(full_name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id',[name,randomUUID()+'@example.invalid',hash,role])).rows[0];accounts.push(row.id);
    }
    const [admin,a,b]=accounts;
    family=(await pool.query('INSERT INTO families(name,invite_code,created_by) VALUES($1,$2,$3) RETURNING id',['Preference fixture',randomUUID().slice(0,8),admin])).rows[0].id;
    await pool.query("INSERT INTO family_members(family_id,user_id,role,relationship) VALUES($1,$2,'admin','Parent'),($1,$3,'member','Other'),($1,$4,'member','Other')",[family,admin,a,b]);
    server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    const base='http://127.0.0.1:'+server.address().port;
    const call=async(user,path,method='GET',body,expected=200)=>{
      const token=jwt.sign({sub:user},process.env.JWT_SECRET,{expiresIn:'10m'});
      const response=await fetch(base+'/api'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
      const value=await response.json();assert.equal(response.status,expected,JSON.stringify(value));return value;
    };
    assert.equal((await call(a,'/settings/notifications')).settings.reminder_time,'10min');
    await call(a,'/settings/notifications','PUT',{chore_reminders:true,chore_completions:false,family_updates:true,reminder_time:'30min'});
    await call(b,'/settings/notifications','PUT',{chore_reminders:false,reminder_time:'1hour',family_updates:false});
    await call(a,'/settings/notifications','PUT',{user_id:b,chore_reminders:true},400);
    await call(a,'/settings/notifications','PUT',{reminder_time:'30 minutes'},400);
    await call(a,'/settings/notifications','PUT',{chore_reminders:'false'},400);
    await call(a,'/settings/preferences','PUT',{theme:'dark'});
    let settings=(await call(a,'/settings/notifications')).settings;
    assert.equal(settings.reminder_time,'30min');assert.equal(settings.chore_completions,false);
    assert.equal((await call(b,'/settings/notifications')).settings.reminder_time,'1hour');
    assert.equal((await call(b,'/settings/notifications')).settings.chore_reminders,false);
    const due=new Date(Date.now()+3*86400000);
    const create=async(assigned=a,date=due)=> (await call(admin,'/chores','POST',{title:'Original Clean Room',assigned_to:assigned,due_date:date.toISOString()},201)).chore;
    const notices=async(user,type)=>(await pool.query('SELECT * FROM notifications WHERE user_id=$1 AND type=$2 ORDER BY created_at',[user,type])).rows;
    for(const option of ['10min','30min','1hour','1day']){
      const c=await create();await call(a,'/settings/notifications','PUT',{reminder_time:option});
      const trigger=reminderTrigger(c.due_date,option);
      await processDueReminders({userId:a,now:new Date(trigger-1)});
      assert.equal((await notices(a,'chore_reminder')).filter(n=>n.chore_id===c.id).length,0);
      await Promise.all([processDueReminders({userId:a,now:trigger}),processDueReminders({userId:a,now:trigger})]);
      const list=(await notices(a,'chore_reminder')).filter(n=>n.chore_id===c.id);assert.equal(list.length,1);
      assert.equal(new Date(list[0].reminder_at).getTime(),trigger.getTime());
      await call(a,'/notifications/'+list[0].id,'DELETE');
      await processDueReminders({userId:a,now:trigger});
      assert.equal((await notices(a,'chore_reminder')).filter(n=>n.chore_id===c.id).length,0,'deleted reminders stay deleted');
      await call(admin,'/chores/'+c.id,'DELETE');
    }
    await call(a,'/settings/notifications','PUT',{reminder_time:'30min'});
    const changed=await create(),later=new Date(due.getTime()+2*3600000);
    await call(admin,'/chores/'+changed.id,'PUT',{due_date:later.toISOString()});
    await processDueReminders({userId:a,now:reminderTrigger(due,'30min')});
    assert.equal((await notices(a,'chore_reminder')).filter(n=>n.chore_id===changed.id).length,0);
    await processDueReminders({userId:a,now:reminderTrigger(later,'30min')});
    assert.equal((await notices(a,'chore_reminder')).filter(n=>n.chore_id===changed.id).length,1);
    await call(a,'/settings/notifications','PUT',{chore_reminders:false});
    const off=await create();await processDueReminders({userId:a,now:reminderTrigger(due,'30min')});
    assert.equal((await notices(a,'chore_reminder')).filter(n=>n.chore_id===off.id).length,0);
    assert.equal((await call(a,'/chores/'+off.id)).chore.assigned_to,a);
    assert.equal((await notices(a,'chore_reminder')).filter(n=>n.chore_id===changed.id).length,1,'history survives preference OFF');
    await call(a,'/settings/notifications','PUT',{chore_reminders:true});
    await processDueReminders({userId:a,now:reminderTrigger(due,'30min')});
    assert.equal((await notices(a,'chore_reminder')).filter(n=>n.chore_id===off.id).length,1);
    const done=await create();await call(admin,'/settings/notifications','PUT',{chore_completions:false});
    await call(a,'/chores/'+done.id+'/complete','PATCH');await processDueReminders({userId:a,now:reminderTrigger(due,'30min')});
    assert.equal((await notices(a,'chore_reminder')).filter(n=>n.chore_id===done.id).length,0);
    assert.equal((await notices(admin,'chore_completed')).length,0);
    await call(admin,'/settings/notifications','PUT',{chore_completions:true});
    const done2=await create();await call(a,'/chores/'+done2.id+'/complete','PATCH');
    assert.equal((await notices(admin,'chore_completed')).length,1);
    await call(admin,'/settings/notifications','PUT',{chore_completions:false});assert.equal((await notices(admin,'chore_completed')).length,1);
    const removed=await create();await call(admin,'/chores/'+removed.id,'DELETE');await processDueReminders({userId:a,now:reminderTrigger(due,'30min')});
    assert.equal((await notices(a,'chore_reminder')).filter(n=>n.chore_id===removed.id).length,0);
    const reassigned=await create();await call(admin,'/chores/'+reassigned.id,'PUT',{assigned_to:b});
    await processDueReminders({userId:a,now:reminderTrigger(due,'30min')});await processDueReminders({userId:b,now:reminderTrigger(due,'1hour')});
    assert.equal((await notices(a,'chore_reminder')).filter(n=>n.chore_id===reassigned.id).length,0);assert.equal((await notices(b,'chore_reminder')).length,0);
    const manualChore=await create();
    const manualAt=new Date(due.getTime()-3600000);
    const manual=(await call(a,'/reminders','POST',{chore_id:manualChore.id,title:'Original manual title',note:'Original note',remind_at:manualAt.toISOString()},201)).reminder;
    await processDueReminders({userId:a,now:manualAt});
    assert.equal((await notices(a,'personal_reminder')).filter(n=>n.chore_id===manualChore.id).length,1);
    await call(a,'/settings/notifications','PUT',{reminder_time:'1hour'});
    await processDueReminders({userId:a,now:manualAt});
    assert.equal((await notices(a,'personal_reminder')).filter(n=>n.chore_id===manualChore.id).length,1,'manual schedule keeps its explicit time');
    await call(a,'/settings/notifications','PUT',{reminder_time:'30min'});
    await call(a,'/reminders/'+manual.id,'DELETE');
    const db=await pool.connect();try{await db.query('BEGIN');await notifyFamilyUpdate(db,family,admin,'Family Update','Original household event');await db.query('COMMIT');}finally{db.release();}
    assert.equal((await notices(a,'family_update')).length,1);assert.equal((await notices(b,'family_update')).length,0);
    await call(admin,'/admin/component04/household?family_id='+family,'PATCH',{name:'Original renamed household'});
    assert.equal((await notices(a,'family_update')).length,2);assert.equal((await notices(b,'family_update')).length,0);
    await call(admin,'/families/add-member','POST',{user_id:b,relationship:'Son'},201);
    assert.equal((await notices(a,'family_update')).length,3);
    const newcomer=(await pool.query('INSERT INTO users(full_name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id',['Preference Newcomer',randomUUID()+'@example.invalid',hash,'member'])).rows[0].id;accounts.push(newcomer);
    const invite=(await pool.query('SELECT invite_code FROM families WHERE id=$1',[family])).rows[0].invite_code;
    await call(newcomer,'/families/join','POST',{invite_code:invite});
    assert.equal((await notices(a,'family_update')).length,4);assert.equal((await notices(b,'family_update')).length,0);
    await call(newcomer,'/families/join','POST',{invite_code:invite});assert.equal((await notices(a,'family_update')).length,4,'repeated join does not notify twice');
    await call(admin,'/settings/notifications','PUT',{chore_reminders:false,chore_completions:false,family_updates:false,announcements:false});
    const privateChore=await create();const privateMessage=(await call(a,'/notifications/chore-messages','POST',{chore_id:privateChore.id,message:'Original private message'},201)).notification;
    assert.ok(privateMessage.id);assert.ok((await call(admin,'/notifications')).notifications.some(n=>n.message==='Original private message'));
    settings=(await call(a,'/settings/notifications')).settings;assert.equal(settings.reminder_time,'30min');assert.equal(settings.chore_completions,false);
    assert.equal((await call(a,'/settings/preferences')).preferences.theme,'dark');
    console.log('Verified real preference gates, all offsets, independent accounts, edits/completion/deletion/reassignment, restart/concurrent deduplication, preserved history and private messages.');
  }finally{
    if(server)await new Promise(resolve=>server.close(resolve));
    if(accounts.length){await pool.query('DELETE FROM chores WHERE created_by=ANY($1::uuid[])',[accounts]);if(family)await pool.query('DELETE FROM families WHERE id=$1',[family]);await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[accounts]);}
    await pool.end();
  }
});
