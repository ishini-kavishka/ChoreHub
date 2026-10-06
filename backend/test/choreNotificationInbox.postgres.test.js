const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config({ quiet:true });
const { pool } = require('../src/config/db');
const app = require('../src/server');

test('existing Chores events reach the correct normal-user inbox and respect completion preferences', {
  skip:process.env.RUN_DATABASE_TESTS!=='1',timeout:180000,
},async()=>{
  const accounts=[];let server;
  try{
    const password='Isolated-chore-inbox-test',hash=await bcrypt.hash(password,4);
    const account=async role=>{
      const row=(await pool.query('INSERT INTO users(full_name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,email',['Isolated chore inbox test',`chore-inbox-${randomUUID()}@example.invalid`,hash,role])).rows[0];accounts.push(row.id);return row;
    };
    const owner=await account('admin'),a=await account('member'),b=await account('member');
    const family=(await pool.query('INSERT INTO families(name,invite_code,created_by) VALUES($1,$2,$3) RETURNING id',['Isolated chore inbox household',randomUUID(),owner.id])).rows[0].id;
    await pool.query("INSERT INTO family_members(family_id,user_id,role) VALUES($1,$2,'admin'),($1,$3,'member'),($1,$4,'member')",[family,owner.id,a.id,b.id]);
    server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    const base=`http://127.0.0.1:${server.address().port}/api`;
    const login=async user=>{const r=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password})});assert.equal(r.status,200);return(await r.json()).token;};
    let aToken=await login(a);const bToken=await login(b);
    const request=async(path,method='GET',body,token=aToken,expected=200)=>{
      const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},...(body?{body:JSON.stringify(body)}:{})});const value=await r.json();assert.equal(r.status,expected,`${method} ${path}: ${JSON.stringify(value)}`);return value;
    };
    const create=async(title,assigned_to,token)=>(await request('/chores','POST',{title,assigned_to},token,201)).chore;
    const choreA=await create('Kitchen assigned to A',a.id,bToken),choreB=await create('Bins assigned to B',b.id,aToken);
    const inboxA=(await request('/notifications')).notifications,inboxB=(await request('/notifications','GET',undefined,bToken)).notifications;
    assert.equal(inboxA.length,1);assert.equal(inboxB.length,1);assert.equal(inboxA[0].type,'chore_assigned');assert.ok(inboxA[0].message.includes(choreA.title));assert.ok(inboxB[0].message.includes(choreB.title));
    assert.equal(inboxA[0].user_id,a.id);assert.equal(inboxB[0].user_id,b.id);
    await request(`/notifications/${inboxB[0].id}/read`,'PATCH',undefined,aToken,404);
    await request(`/notifications/${inboxB[0].id}`,'DELETE',undefined,aToken,404);
    await request(`/notifications/${inboxA[0].id}/read`,'PATCH');aToken=await login(a);
    assert.equal((await request('/notifications')).notifications[0].is_read,true);
    assert.equal((await pool.query('SELECT is_read FROM notifications WHERE id=$1',[inboxA[0].id])).rows[0].is_read,true);
    const before=(await pool.query('SELECT * FROM chores WHERE id=$1',[choreA.id])).rows[0];
    await request(`/notifications/${inboxA[0].id}`,'DELETE');aToken=await login(a);
    assert.equal((await request('/notifications')).notifications.length,0);
    assert.deepEqual((await pool.query('SELECT * FROM chores WHERE id=$1',[choreA.id])).rows[0],before);
    assert.equal((await request('/notifications','GET',undefined,bToken)).notifications[0].id,inboxB[0].id);
    await request(`/chores/${choreA.id}/complete`,'PATCH');
    const completedNotice=(await request('/notifications','GET',undefined,bToken)).notifications.find(n=>n.type==='chore_completed');assert.ok(completedNotice,'The creator receives completion through the existing event handler.');
    const completedSnapshot=(await pool.query('SELECT * FROM chores WHERE id=$1',[choreA.id])).rows[0];assert.equal(completedSnapshot.status,'completed');assert.equal(completedSnapshot.completed_by,a.id);
    await request(`/notifications/${completedNotice.id}`,'DELETE',undefined,bToken);
    assert.deepEqual((await pool.query('SELECT * FROM chores WHERE id=$1',[choreA.id])).rows[0],completedSnapshot,'Removing completion notice preserves status, assignee and completion history fields.');
    const prefs=(await request('/settings/notifications','GET',undefined,bToken)).settings;
    await request('/settings/notifications','PUT',{...prefs,chore_completions:false},bToken);
    assert.equal((await request('/settings/notifications','GET',undefined,bToken)).settings.chore_completions,false);
    const choreC=await create('Preference test chore',a.id,bToken);
    await request(`/chores/${choreC.id}`,'PUT',{status:'completed'});
    await request(`/chores/${choreC.id}`,'PUT',{status:'pending'});
    await request(`/chores/${choreC.id}/complete`,'PATCH');
    assert.equal((await request('/notifications','GET',undefined,bToken)).notifications.filter(n=>n.type==='chore_completed').length,0,'Both completion paths respect OFF.');
    await request('/settings/notifications','PUT',{...prefs,chore_completions:true},bToken);
    await request(`/chores/${choreC.id}`,'PUT',{status:'pending'});await request(`/chores/${choreC.id}`,'PUT',{status:'completed'});
    assert.equal((await request('/notifications','GET',undefined,bToken)).notifications.filter(n=>n.type==='chore_completed').length,1,'ON restores future completion notifications.');
    const unassigned=await create('Assigned by edit',null,bToken);
    await request(`/chores/${unassigned.id}`,'PUT',{assigned_to:a.id},bToken);
    const afterEdit=(await request('/notifications')).notifications.filter(n=>n.type==='chore_assigned'&&n.message.includes('Assigned by edit'));assert.equal(afterEdit.length,1);
    await request(`/chores/${unassigned.id}`,'PUT',{assigned_to:a.id},bToken);
    assert.equal((await request('/notifications')).notifications.filter(n=>n.message.includes('Assigned by edit')).length,1,'Repeat refresh/update does not duplicate assignment events.');
    console.log('Verified real Chore POST/PUT/complete → recipient inbox, persistent read/remove, two-user privacy, unchanged chore/completion data, and completion preferences OFF/ON.');
  }finally{
    if(server)await new Promise(resolve=>server.close(resolve));
    if(accounts.length)await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[accounts]);
    await pool.end();
  }
});
