const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config({ quiet:true });
const { pool } = require('../src/config/db');
const app = require('../src/server');

test('two normal users delete only their own inbox rows; shared business data and preferences survive', {
  skip:process.env.RUN_DATABASE_TESTS!=='1',timeout:180000,
},async()=>{
  const accounts=[]; let server;
  try {
    const password='Isolated-inbox-delete-test',hash=await bcrypt.hash(password,4);
    const account=async role=>{
      const row=(await pool.query('INSERT INTO users(full_name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,email', ['Isolated inbox delete test',`inbox-${randomUUID()}@example.invalid`,hash,role])).rows[0];
      accounts.push(row.id);return row;
    };
    const admin=await account('admin'),a=await account('member'),b=await account('member');
    const family=(await pool.query('INSERT INTO families(name,invite_code,created_by) VALUES($1,$2,$3) RETURNING id',['Isolated inbox household',randomUUID(),admin.id])).rows[0].id;
    await pool.query("INSERT INTO family_members(family_id,user_id,role) VALUES($1,$2,'admin'),($1,$3,'member'),($1,$4,'member')",[family,admin.id,a.id,b.id]);
    await pool.query('INSERT INTO notification_settings(user_id,announcements) VALUES($1,TRUE),($2,TRUE)',[a.id,b.id]);
    const chore=(await pool.query("INSERT INTO chores(family_id,created_by,assigned_to,title,status) VALUES($1,$2,$3,'Inbox safety chore','pending') RETURNING id",[family,admin.id,a.id])).rows[0].id;
    const start=async()=>{server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});return `http://127.0.0.1:${server.address().port}/api`;};
    let base=await start();
    const login=async user=>{const r=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password})});assert.equal(r.status,200);return(await r.json()).token;};
    let aToken=await login(a);const bToken=await login(b),adminToken=await login(admin);
    const request=async(path,method='GET',body,token=aToken,expected=200)=>{
      const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
      const value=await r.json();assert.equal(r.status,expected,`${method} ${path}: ${JSON.stringify(value)}`);return value;
    };
    const reminder=(await request('/reminders','POST',{title:'Keep actual reminder',note:'Must survive inbox cleanup',chore_id:chore,remind_at:new Date(Date.now()+86400000).toISOString()},aToken,201)).reminder;
    const announcement=(await request(`/announcements?family_id=${family}`,'POST',{title:'Shared announcement',message:'Message for both users',status:'published'},adminToken,201)).announcement;
    for(const owner of [a.id,b.id]) await pool.query("INSERT INTO notifications(user_id,title,message,type,is_read) VALUES($1,'Chore Completed','Original chore survives','chore_completed',FALSE)",[owner]);
    const beforeA=(await request('/notifications')).notifications,beforeB=(await request('/notifications','GET',undefined,bToken)).notifications;
    assert.equal(beforeA.length,2);assert.equal(beforeB.length,2);
    const a1=beforeA.find(n=>n.announcement_id===announcement.id),a2=beforeA.find(n=>n.type==='chore_completed');
    const b1=beforeB.find(n=>n.announcement_id===announcement.id);
    const settingsBefore=(await pool.query('SELECT * FROM notification_settings WHERE user_id=ANY($1::uuid[]) ORDER BY user_id',[[a.id,b.id]])).rows;
    await request(`/notifications/${a1.id}`,'DELETE',undefined,'',401);
    for(const n of beforeB) await request(`/notifications/${n.id}`,'DELETE',{userId:b.id},aToken,404);
    await request(`/notifications/${a1.id}`,'DELETE',{userId:b.id});
    assert.equal((await pool.query('SELECT id FROM notifications WHERE id=$1',[a1.id])).rowCount,0);
    assert.deepEqual((await request('/notifications')).notifications.map(n=>n.id),[a2.id]);
    assert.equal((await request('/notifications/unread-count')).count,1);
    assert.equal((await request('/notifications?filter=unread')).notifications.length,1);
    assert.equal((await request('/notifications?filter=read')).notifications.length,0);
    assert.deepEqual((await request('/notifications','GET',undefined,bToken)).notifications.map(n=>n.id),beforeB.map(n=>n.id));
    assert.ok((await request('/notifications','GET',undefined,bToken)).notifications.some(n=>n.id===b1.id));
    assert.equal((await pool.query('SELECT id FROM household_announcements WHERE id=$1',[announcement.id])).rowCount,1);
    assert.equal((await request(`/announcements/${announcement.id}`,'GET',undefined,bToken)).announcement.id,announcement.id);
    await request(`/notifications/${a2.id}/read`,'PATCH');
    assert.equal((await request('/notifications/unread-count')).count,0);assert.equal((await request('/notifications?filter=read')).notifications.length,1);
    await request(`/notifications/${a2.id}`,'DELETE');
    assert.equal((await request('/notifications')).notifications.length,0);
    await new Promise(resolve=>server.close(resolve));server=null;base=await start();
    aToken=await login(a); // Restart the HTTP server and establish a fresh login/session.
    for(let i=0;i<3;i++) assert.equal((await request('/notifications')).notifications.length,0,'Refresh/return/fresh login cannot recreate deleted rows.');
    await request(`/notifications/${a1.id}`,'DELETE',undefined,aToken,404);
    assert.equal((await pool.query('SELECT id FROM chores WHERE id=$1',[chore])).rowCount,1);
    assert.equal((await request(`/reminders/${reminder.id}`)).reminder.id,reminder.id);
    assert.equal((await pool.query('SELECT id FROM families WHERE id=$1',[family])).rowCount,1);
    assert.deepEqual((await pool.query('SELECT * FROM notification_settings WHERE user_id=ANY($1::uuid[]) ORDER BY user_id',[[a.id,b.id]])).rows,settingsBefore);
    assert.equal((await request('/notifications','GET',undefined,bToken)).notifications.length,2);
    console.log('Verified two normal-user logins, owner-only persistent deletion, counts/read state, shared announcement isolation, original chore/reminder preservation and unchanged notification settings.');
  }finally{
    if(server)await new Promise(resolve=>server.close(resolve));
    if(accounts.length)await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[accounts]);
    await pool.end();
  }
});
