const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config({quiet:true});
const { pool, ensureNotificationMessageSchema } = require('../src/config/db');
const app = require('../src/server');

test('private Chore messages: authenticated ownership, real inbox/read/delete and unchanged Chores', {
  skip:process.env.RUN_DATABASE_TESTS!=='1',timeout:240000,
},async()=>{
  const accounts=[];let server;
  try {
    await ensureNotificationMessageSchema();
    const password='Isolated-private-message-test',hash=await bcrypt.hash(password,4);
    const account=async(name,role)=>{
      const row=(await pool.query('INSERT INTO users(full_name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,email',[name,`private-message-${randomUUID()}@example.invalid`,hash,role])).rows[0];accounts.push(row.id);return row;
    };
    const admin=await account('Responsible Admin','admin'),chamara=await account('Chamara','member'),kasun=await account('Kasun','member'),outsider=await account('Unrelated Admin','admin');
    const family=(await pool.query('INSERT INTO families(name,invite_code,created_by) VALUES($1,$2,$3) RETURNING id',['Isolated private message household',randomUUID(),admin.id])).rows[0].id;
    await pool.query("INSERT INTO family_members(family_id,user_id,role) VALUES($1,$2,'admin'),($1,$3,'member'),($1,$4,'member')",[family,admin.id,chamara.id,kasun.id]);
    server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    const base=`http://127.0.0.1:${server.address().port}/api`;
    const login=async user=>{const r=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password})});assert.equal(r.status,200);return(await r.json()).token;};
    const at=await login(admin),ct=await login(chamara),kt=await login(kasun),ot=await login(outsider);
    const request=async(path,method='GET',body,token=ct,expected=200)=>{
      const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},...(body?{body:JSON.stringify(body)}:{})});const value=await r.json();assert.equal(r.status,expected,`${method} ${path}: ${JSON.stringify(value)}`);return value;
    };
    const day=new Date();day.setDate(day.getDate()+3);day.setHours(18,0,0,0);
    const chore=(await request('/chores','POST',{title:'Clean Room',assigned_to:chamara.id,due_date:day.toISOString()},at,201)).chore;
    const other=(await request('/chores','POST',{title:'Kasun task',assigned_to:kasun.id},at,201)).chore;
    const snapshot=async()=> (await pool.query('SELECT * FROM chores WHERE id=$1',[chore.id])).rows[0];
    const before=await snapshot();
    const payload={chore_id:chore.id,message:"I can't do this chore at the assigned time."};
    await request('/notifications/chore-messages','POST',payload,kt,404);
    await request('/notifications/chore-messages','POST',{...payload,chore_id:other.id},ct,404);
    for(const message of ['', ' ', 'x'.repeat(501)])await request('/notifications/chore-messages','POST',{...payload,message},ct,400);
    await request('/notifications/chore-messages','POST',{...payload,chore_id:'invalid'},ct,400);
    await request('/notifications/chore-messages','POST',{...payload,chore_id:randomUUID()},ct,404);
    await request('/notifications/chore-messages','POST',payload,'',401);
    const baseline=(await request('/notifications/unread-count','GET',undefined,at)).count;
    const sent=(await request('/notifications/chore-messages','POST',{...payload,sender_id:kasun.id,user_id:outsider.id,recipient_id:outsider.id},ct,201)).notification;
    assert.ok(Number.isFinite(Date.parse(sent.created_at)));
    assert.deepEqual(await snapshot(),before,'Sending does not mutate any Chore field');
    const inbox=(await request('/notifications','GET',undefined,at)).notifications;
    const received=inbox.find(n=>n.id===sent.id);
    assert.equal(received.user_id,admin.id);assert.equal(received.sender_id,chamara.id);assert.equal(received.sender_name,'Chamara');assert.equal(received.chore_id,chore.id);assert.equal(received.chore_title,'Clean Room');assert.equal(Date.parse(received.chore_due_date),day.getTime());assert.equal(received.message,payload.message);assert.equal(received.is_read,false);assert.equal(received.type,'client_chore_message');assert.equal(received.time_request_id,null);
    assert.equal((await request('/notifications/unread-count','GET',undefined,at)).count,baseline+1);
    for(const token of [ct,kt,ot]) {
      assert.equal((await request('/notifications','GET',undefined,token)).notifications.some(n=>n.id===sent.id),false);
      await request('/notifications/'+sent.id+'/read','PATCH',undefined,token,404);
      await request('/notifications/'+sent.id,'DELETE',undefined,token,404);
    }
    await request('/notifications/'+sent.id+'/read','PATCH',undefined,at);
    const fresh=await login(admin);
    assert.equal((await request('/notifications','GET',undefined,fresh)).notifications.find(n=>n.id===sent.id).is_read,true);
    assert.equal((await request('/notifications/unread-count','GET',undefined,fresh)).count,baseline);
    const keep=(await request('/notifications/reminders','POST',{title:'Keep this',message:'Independent reminder'},at,201)).notification;
    await request('/notifications/'+sent.id,'DELETE',undefined,fresh);
    const reloaded=(await request('/notifications','GET',undefined,await login(admin))).notifications;
    assert.equal(reloaded.some(n=>n.id===sent.id),false);assert.ok(reloaded.some(n=>n.id===keep.id));
    assert.deepEqual(await snapshot(),before,'Deleting does not mutate any Chore field');
    assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM chore_time_requests WHERE chore_id=$1',[chore.id])).rows[0].count,0,'No approval request created');
    // Reproduce the user's actual self-assigned, self-owned Clean Room data shape.
    const self=(await request('/chores','POST',{title:'Self-owned Clean Room',assigned_to:admin.id},at,201)).chore;
    const unavailable=await request('/notifications/chore-messages','POST',{...payload,chore_id:self.id},at,409);
    assert.equal(unavailable.code,'ADMIN_UNAVAILABLE');
    // Legacy Chore with no family_id and a normal member creator: real membership
    // still identifies the separate household owner; never pick an arbitrary Admin.
    const legacy=(await request('/chores','POST',{title:'Legacy Clean Room',assigned_to:chamara.id},ct,201)).chore;
    await pool.query('UPDATE chores SET family_id=NULL WHERE id=$1',[legacy.id]);
    const legacySent=(await request('/notifications/chore-messages','POST',{...payload,chore_id:legacy.id},ct,201)).notification;
    assert.ok((await request('/notifications','GET',undefined,at)).notifications.some(n=>n.id===legacySent.id));
    assert.equal((await request('/notifications','GET',undefined,ot)).notifications.some(n=>n.id===legacySent.id),false);
    await request('/notifications/'+legacySent.id,'DELETE',undefined,at);
    // Current household membership is checked even when an old assignment remains.
    await pool.query('DELETE FROM family_members WHERE family_id=$1 AND user_id=$2',[family,chamara.id]);
    await request('/notifications/chore-messages','POST',payload,ct,404);
    console.log('Verified Chamara -> responsible Admin; Kasun/unrelated Admin denied; read/delete persist and every Chore field stays unchanged.');
  }finally{
    if(server)await new Promise(resolve=>server.close(resolve));
    if(accounts.length)await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[accounts]);
    await pool.end();
  }
});
