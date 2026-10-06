const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module'),ts=require('typescript');
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,filename);
const original=Module._load;
Module._load=function(name,...args){
  if(name==='@/config/api')return{API_BASE_URL:'http://configured-api.invalid:5000'};
  if(name==='./authService')return{authService:{getAuthToken:async()=>'isolated-test-token'}};
  return original.call(this,name,...args);
};
const {notificationService}=require('../src/services/notificationService.ts'),{ApiError}=require('../src/services/api.ts');Module._load=original;
test('real frontend API client sends configured URL, POST, real Chore UUID and Bearer authentication; propagates failures safely',async()=>{
  const oldFetch=global.fetch,oldWarn=console.warn,logs=[];global.__DEV__=true;console.warn=(...args)=>logs.push(args);
  const chore_id='11111111-1111-1111-1111-111111111111',message="I can't do this chore at the assigned time.";
  try{
    global.fetch=async(url,options)=>{
      assert.equal(url,'http://configured-api.invalid:5000/api/notifications/chore-messages');assert.equal(options.method,'POST');
      assert.equal(options.headers.Authorization,'Bearer isolated-test-token');assert.deepEqual(JSON.parse(options.body),{chore_id,message});
      return{ok:true,status:201,json:async()=>({message:'Message sent to Admin',notification:{id:'persisted',created_at:'2030-10-06T12:30:00Z'}})};
    };
    assert.equal((await notificationService.sendChoreMessage(chore_id,message)).notification.id,'persisted');
    for(const status of [401,404,409,500]){
      global.fetch=async()=>({ok:false,status,json:async()=>({message:'Safe backend error'})});
      await assert.rejects(notificationService.sendChoreMessage(chore_id,message),error=>error instanceof ApiError&&error.status===status);
    }
    assert.ok(logs.some(log=>log[1].status===409));assert.equal(JSON.stringify(logs).includes('isolated-test-token'),false);
  }finally{global.fetch=oldFetch;console.warn=oldWarn;delete global.__DEV__;}
});
