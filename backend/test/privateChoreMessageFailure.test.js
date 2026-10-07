const {test}=require('node:test'),assert=require('node:assert/strict');
const configPath=require.resolve('../src/config/db');
let queries=[],released=false;
const sender='11111111-1111-1111-1111-111111111111',recipient='22222222-2222-2222-2222-222222222222',choreId='33333333-3333-3333-3333-333333333333';
const db={release(){released=true;},async query(sql){
  queries.push(sql);
  if(sql.includes('SELECT * FROM chores'))return{rows:[{id:choreId,assigned_to:sender,created_by:recipient,family_id:null}],rowCount:1};
  if(sql.includes('SELECT u.id FROM users'))return{rows:[{id:recipient}],rowCount:1};
  if(sql.includes('INSERT INTO notifications'))throw Object.assign(Error('Injected database failure'),{code:'TEST_DATABASE_ERROR'});
  return{rows:[],rowCount:0};
}};
require.cache[configPath]={id:configPath,filename:configPath,loaded:true,exports:{pool:{connect:async()=>db}}};
const {createChoreMessage}=require('../src/controllers/notificationController');
test('database insert failure rolls back, releases connection and never sends success',async()=>{
  let error;
  await createChoreMessage({userId:sender,body:{chore_id:choreId,message:'Short message'}},{status(){assert.fail('Must not report success');},json(){assert.fail('Must not report success');}},e=>{error=e;});
  assert.equal(error.code,'TEST_DATABASE_ERROR');assert.ok(queries.includes('ROLLBACK'));assert.equal(queries.includes('COMMIT'),false);assert.equal(released,true);
});
