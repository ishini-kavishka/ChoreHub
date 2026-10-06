const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config({quiet:true});
const { pool } = require('../src/config/db');
const { ensureChoreTimeRequestSchema } = require('../src/services/choreTimeRequestService');
const app = require('../src/server');

test('private Chore request CRUD, real approval/rejection, notifications and safe dismissal', {
  skip:process.env.RUN_DATABASE_TESTS!=='1',timeout:240000,
},async()=>{
  const accounts=[];let server;
  try{
    await ensureChoreTimeRequestSchema();
    const password='Isolated-time-request-test',hash=await bcrypt.hash(password,4);
    const account=async(name,role)=>{
      const row=(await pool.query('INSERT INTO users(full_name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,email',[name,`time-request-${randomUUID()}@example.invalid`,hash,role])).rows[0];accounts.push(row.id);return row;
    };
    const admin=await account('Responsible Admin','admin'),chamara=await account('Chamara','member'),kasun=await account('Kasun','member'),outsider=await account('Unrelated Admin','admin');
    const family=(await pool.query('INSERT INTO families(name,invite_code,created_by) VALUES($1,$2,$3) RETURNING id',['Isolated time requests household',randomUUID(),admin.id])).rows[0].id;
    await pool.query("INSERT INTO family_members(family_id,user_id,role) VALUES($1,$2,'admin'),($1,$3,'member'),($1,$4,'member')",[family,admin.id,chamara.id,kasun.id]);
    server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    const base=`http://127.0.0.1:${server.address().port}/api`;
    const login=async user=>{const r=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password})});assert.equal(r.status,200);return(await r.json()).token;};
    const at=await login(admin),ct=await login(chamara),kt=await login(kasun),ot=await login(outsider);
    const request=async(path,method='GET',body,token=ct,expected=200)=>{
      const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},...(body?{body:JSON.stringify(body)}:{})});const value=await r.json();assert.equal(r.status,expected,`${method} ${path}: ${JSON.stringify(value)}`);return value;
    };
    const day=new Date();day.setDate(day.getDate()+3);day.setHours(18,0,0,0);
    const original=day.toISOString();day.setHours(20);const proposed=day.toISOString();day.setMinutes(30);const edited=day.toISOString();day.setHours(21);const later=day.toISOString();
    const chore=(await request('/chores','POST',{title:'Clean Kitchen',assigned_to:chamara.id,due_date:original},at,201)).chore;
    const notice=(await request('/notifications')).notifications.find(n=>n.type==='chore_assigned');assert.equal(notice.chore_id,chore.id);assert.equal(Date.parse(notice.chore_due_date),Date.parse(original));assert.equal(notice.assigned_by,'Responsible Admin');
    await request('/chore-time-requests/context/'+chore.id,'GET',undefined,kt,404);
    await request('/chores/'+chore.id,'PUT',{due_date:proposed},ct,403);
    await request('/chores/'+chore.id,'PUT',{due_date:proposed},ot,403);
    await request('/chores/'+chore.id,'PUT',{assigned_to:kasun.id},ct,403);
    await request('/chores/'+chore.id,'PUT',{assigned_to:kasun.id},kt,403);
    await request('/chores/'+chore.id,'PUT',{status:'completed'},kt,403);
    await request('/chores/'+chore.id,'DELETE',undefined,ct,403);
    const payload={chore_id:chore.id,requested_due_date:proposed,message:'I have a class at 6 PM. Can I complete this at 8 PM?'};
    await request('/chore-time-requests','POST',payload,kt,404);
    await request('/chore-time-requests','POST',{...payload,message:''},ct,400);
    await request('/chore-time-requests','POST',{...payload,requested_due_date:'2020-01-01T12:00:00Z'},ct,400);
    await request('/chore-time-requests','POST',{...payload,requested_due_date:'2030-02-30T12:00:00Z'},ct,400);
    await request('/chore-time-requests','POST',{...payload,chore_id:randomUUID()},ct,404);
    const r=(await request('/chore-time-requests','POST',{...payload,requester_id:kasun.id,recipient_id:outsider.id},ct,201)).request;
    assert.equal(r.requester_id,chamara.id);assert.equal(r.recipient_id,admin.id);assert.equal(r.status,'PENDING');
    assert.equal((await request('/chore-time-requests/'+r.id)).request.can_review,false);
    assert.equal((await request('/chore-time-requests/'+r.id,'GET',undefined,at)).request.can_review,true);
    const path='/chore-time-requests/'+r.id;
    assert.equal((await request('/chore-time-requests/context/'+chore.id)).request.id,r.id);
    await request('/chore-time-requests','POST',payload,ct,409);
    assert.equal((await pool.query('SELECT due_date FROM chores WHERE id=$1',[chore.id])).rows[0].due_date.toISOString(),original);
    assert.equal((await request('/chore-time-requests','GET',undefined,kt)).requests.length,0);
    assert.equal((await request('/chore-time-requests?inbox=admin','GET',undefined,ot)).requests.length,0);
    for(const token of [kt,ot]){await request(path,'GET',undefined,token,404);await request(path,'PATCH',{requested_due_date:edited,message:'Intrusion'},token,404);await request(path+'/review','POST',{status:'APPROVED'},token,404);await request(path+'/cancel','POST',undefined,token,404);await request(path+'/dismiss','POST',undefined,token,404);}
    await request(path+'/review','POST',{status:'APPROVED'},ct,404);
    await request(path+'/dismiss','POST',undefined,at,409);
    const adminNotice=(await request('/notifications','GET',undefined,at)).notifications.find(n=>n.time_request_id===r.id);
    await request('/notifications/'+adminNotice.id,'DELETE',undefined,at,409);
    await request(path,'PATCH',{requested_due_date:edited,message:'Class finishes later; may I do 8:30 PM?'});
    const adminRequest=(await request('/chore-time-requests?inbox=admin','GET',undefined,at)).requests[0];assert.equal(adminRequest.requester_name,'Chamara');assert.equal(adminRequest.chore_title,'Clean Kitchen');assert.equal(Date.parse(adminRequest.requested_due_date),Date.parse(edited));assert.match(adminRequest.message,/8:30/);
    const liveNotice=(await request('/notifications','GET',undefined,at)).notifications.find(n=>n.time_request_id===r.id);assert.equal(liveNotice.time_request.message,adminRequest.message);
    const before=(await pool.query('SELECT * FROM chores WHERE id=$1',[chore.id])).rows[0];
    await request(path+'/review','POST',{status:'APPROVED',admin_response:'8:30 PM works.'},at);
    const after=(await pool.query('SELECT * FROM chores WHERE id=$1',[chore.id])).rows[0];assert.equal(after.due_date.toISOString(),edited);
    for(const key of Object.keys(before).filter(k=>!['due_date','updated_at'].includes(k)))assert.deepEqual(after[key],before[key],key+' stays unchanged');
    const freshToken=await login(chamara);
    assert.equal((await request(path,'GET',undefined,freshToken)).request.status,'APPROVED');
    assert.equal(Date.parse((await request('/chores/'+chore.id,'GET',undefined,freshToken)).chore.due_date),Date.parse(edited));
    const approved=(await request('/notifications')).notifications.find(n=>n.type==='time_change_approved');assert.ok(approved);assert.equal(approved.time_request.admin_response,'8:30 PM works.');
    await request(path,'PATCH',{requested_due_date:later,message:'Again'},ct,409);await request(path+'/cancel','POST',undefined,ct,409);await request(path+'/review','POST',{status:'APPROVED'},at,409);
    await request(path+'/dismiss','POST',undefined,at);assert.equal((await request('/chore-time-requests?inbox=admin','GET',undefined,at)).requests.length,0);assert.equal((await request(path)).request.status,'APPROVED');
    await request('/notifications/'+approved.id,'DELETE');assert.equal((await request(path)).request.status,'APPROVED');assert.equal((await pool.query('SELECT due_date FROM chores WHERE id=$1',[chore.id])).rows[0].due_date.toISOString(),edited);
    const reject=(await request('/chore-time-requests','POST',{...payload,requested_due_date:later},ct,201)).request;
    await request('/chore-time-requests/'+reject.id+'/review','POST',{status:'REJECTED',admin_response:'Please keep the approved time.'},at);
    assert.equal((await request('/chore-time-requests/'+reject.id)).request.status,'REJECTED');
    await request('/chore-time-requests/'+reject.id,'PATCH',{requested_due_date:later,message:'Again'},ct,409);
    assert.ok((await request('/notifications')).notifications.find(n=>n.type==='time_change_rejected'));
    await request('/chore-time-requests/'+reject.id+'/dismiss','POST',undefined,at);
    assert.equal((await pool.query('SELECT due_date FROM chores WHERE id=$1',[chore.id])).rows[0].due_date.toISOString(),edited);
    const cancel=(await request('/chore-time-requests','POST',{...payload,requested_due_date:later},ct,201)).request;
    await request('/chore-time-requests/'+cancel.id+'/cancel','POST');assert.equal((await request('/chore-time-requests/'+cancel.id)).request.status,'CANCELLED');await request('/chore-time-requests/'+cancel.id+'/review','POST',{status:'APPROVED'},at,409);
    // Concurrent double-tap: exactly one pending row survives.
    const concurrent=await Promise.all([0,1].map(()=>fetch(base+'/chore-time-requests',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${ct}`},body:JSON.stringify({...payload,requested_due_date:later})})));
    assert.deepEqual(concurrent.map(r=>r.status).sort(),[201,409]);
    const pending=(await request('/chore-time-requests')).requests.find(r=>r.status==='PENDING');
    // A fresh admin schedule edit makes the request stale; approval must not overwrite it.
    day.setHours(22);const newTime=day.toISOString();await request('/chores/'+chore.id,'PUT',{due_date:newTime},at);
    await request('/chore-time-requests/'+pending.id+'/review','POST',{status:'APPROVED'},at,409);
    await request('/chore-time-requests/'+pending.id+'/review','POST',{status:'REJECTED'},at);
    assert.equal((await pool.query('SELECT due_date FROM chores WHERE id=$1',[chore.id])).rows[0].due_date.toISOString(),newTime);
    assert.equal((await request('/notifications','GET',undefined,kt)).notifications.length,0);
    // The existing family owner is also authorized even without a global admin role.
    await pool.query('UPDATE families SET created_by=$2 WHERE id=$1',[family,kasun.id]);
    const ownerChore=(await request('/chores','POST',{title:'Owner-managed kitchen',assigned_to:chamara.id,due_date:original},ct,201)).chore;
    const ownerRequest=(await request('/chore-time-requests','POST',{...payload,chore_id:ownerChore.id},ct,201)).request;
    assert.equal(ownerRequest.recipient_id,kasun.id);
    assert.equal((await request('/chore-time-requests/'+ownerRequest.id,'GET',undefined,kt)).request.can_review,true);
    await request('/chore-time-requests/'+ownerRequest.id+'/review','POST',{status:'APPROVED'},kt);
    assert.equal((await pool.query('SELECT due_date FROM chores WHERE id=$1',[ownerChore.id])).rows[0].due_date.toISOString(),proposed);
    console.log('Verified assignment → private create/edit → approve/reject → client results; ownership, concurrency, persisted time, cancellation and safe cleanup.');
  }finally{
    if(server)await new Promise(resolve=>server.close(resolve));
    if(accounts.length)await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[accounts]);
    await pool.end();
  }
});
