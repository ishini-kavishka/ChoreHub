const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
require('dotenv').config({quiet:true});
const {pool}=require('../src/config/db');
const {createReminder}=require('../src/controllers/notificationController');

test('existing manual inbox reminder API cannot bypass the authenticated account reminder switch',{
  skip:process.env.RUN_DATABASE_TESTS!=='1',timeout:30000,
},async()=>{
  let id;
  try{
    id=(await pool.query("INSERT INTO users(full_name,email,password_hash,role) VALUES('Reminder preference fixture',$1,'unused-test-hash','member') RETURNING id",[randomUUID()+'@example.invalid'])).rows[0].id;
    await pool.query('INSERT INTO notification_settings(user_id,chore_reminders) VALUES($1,FALSE)',[id]);
    const invoke=async()=>{let code=200,value;const res={status(c){code=c;return this;},json(v){value=v;return this;}};
      await createReminder({userId:id,body:{title:'Original reminder',message:'Original content'}},res,e=>{throw e;});return{code,value};};
    assert.equal((await invoke()).code,409);
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM notifications WHERE user_id=$1',[id])).rows[0].count,0);
    await pool.query('UPDATE notification_settings SET chore_reminders=TRUE WHERE user_id=$1',[id]);assert.equal((await invoke()).code,201);
    await pool.query('UPDATE notification_settings SET chore_reminders=FALSE WHERE user_id=$1',[id]);
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM notifications WHERE user_id=$1',[id])).rows[0].count,1,'existing history remains');
  }finally{if(id)await pool.query('DELETE FROM users WHERE id=$1',[id]);await pool.end();}
});
