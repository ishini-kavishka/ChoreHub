const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module'),ts=require('typescript');
const React=require('react'),{create,act}=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;
require.extensions['.ts']=require.extensions['.tsx']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,filename);
const {translations}=require('../src/i18n/translations.ts');
const original=Module._load,storage=new Map(),listeners=new Set(),foreground=new Set(),remote=new Map();
let user={id:'a'},offline=false,delay;
remote.set('a',{theme:'light',language:'en',brightness:70,auto_brightness:false});remote.set('b',{theme:'light',language:'ta',brightness:80,auto_brightness:false});
const langs=['en','si','ta'].map(code=>({code,is_enabled:true,translation_supported:true}));
Module._load=function(name,...args){
  if(name==='react-native')return{View:'view',useColorScheme:()=> 'light',AppState:{addEventListener:(_,cb)=>{foreground.add(cb);return{remove:()=>foreground.delete(cb)};}}};
  if(name==='@react-native-async-storage/async-storage')return{getItem:async key=>storage.get(key)??null,setItem:async(key,value)=>storage.set(key,value)};
  if(name==='@/i18n/translations')return{translations};
  if(name==='@/services/authStorage')return{getUser:async()=>user,subscribeSession:cb=>{listeners.add(cb);return()=>listeners.delete(cb);}};
  if(name==='@/services/settingsService')return{DEFAULT_SUPPORTED_LANGUAGES:langs,settingsService:{getSupportedLanguages:async()=>{if(offline)throw Error('offline');return langs;},getPreferences:async()=>{if(offline)throw Error('offline');const value={...remote.get(user.id)};if(delay)await delay;return value;},savePreferences:async patch=>{if(offline)throw Error('offline');const next={...remote.get(user.id),...patch};remote.set(user.id,next);return next;}}};
  return original.call(this,name,...args);
};
const {ThemeProvider,useAppTheme}=require('../src/context/ThemeContext.tsx'),{LanguageProvider,useLanguage}=require('../src/context/LanguageContext.tsx');Module._load=original;
let theme,language;
function Consumer(){theme=useAppTheme();language=useLanguage();return theme.ready&&language.ready?React.createElement('ready',{background:theme.colors.background},language.t('tab_home')):React.createElement('loading');}
const mount=async()=>{let r;await act(async()=>{r=create(React.createElement(ThemeProvider,null,React.createElement(LanguageProvider,null,React.createElement(Consumer))));});return r;};
test('all six combinations update immediately, stay independent and restore across restart/account changes',async()=>{
  let r=await mount();
  try{
    for(const code of ['en','si','ta'])for(const mode of ['light','dark']){
      await act(async()=>{await theme.setTheme(mode);await language.setLanguage(code);});
      assert.equal(theme.theme,mode);assert.equal(language.language,code);assert.equal(remote.get('a').theme,mode);assert.equal(remote.get('a').language,code);
      assert.equal(r.root.findByType('ready').children[0],translations[code].tab_home);
      assert.equal(theme.colors.isDark,mode==='dark');assert.equal(storage.get('chorehub.theme.a'),mode);
    }
    await act(async()=>{await theme.setTheme('dark');await language.setLanguage('si');});
    await act(async()=>r.unmount());r=await mount();assert.equal(theme.theme,'dark');assert.equal(language.language,'si');
    await act(async()=>{user={id:'b'};listeners.forEach(fn=>fn());});assert.equal(theme.theme,'light');assert.equal(language.language,'ta');
    await act(async()=>{user=null;listeners.forEach(fn=>fn());});assert.equal(theme.preference,'system');assert.equal(language.language,'en');
    await act(async()=>{user={id:'a'};listeners.forEach(fn=>fn());});assert.equal(theme.theme,'dark');assert.equal(language.language,'si');
    await act(async()=>{await theme.setBrightness(40);await theme.setAutoBrightness(true);});assert.equal(theme.brightness,60);assert.equal(language.language,'si');
    await act(async()=>{await theme.setAutoBrightness(false);});assert.equal(theme.brightness,40);
    offline=true;await act(async()=>{await theme.setTheme('light');});assert.equal(theme.theme,'light');
    await act(async()=>r.unmount());r=await mount();assert.equal(theme.theme,'light');assert.equal(language.language,'si');
    offline=false;await act(async()=>foreground.forEach(fn=>fn('active')));assert.equal(theme.theme,'light');assert.equal(remote.get('a').theme,'light');assert.equal(remote.get('a').language,'si');
  }finally{if(r)await act(async()=>r.unmount());}
});
test('late restore cannot overwrite a newer user selection',async()=>{
  let resolve;delay=new Promise(done=>resolve=done);let r;
  try{
    r=await mount();assert.equal(theme.ready,true,'account cache is ready before delayed server sync');
    await act(async()=>{await theme.setTheme('dark');await language.setLanguage('en');});
    await act(async()=>{resolve();await delay;});assert.equal(theme.theme,'dark');assert.equal(language.language,'en');
  }finally{delay=undefined;if(r)await act(async()=>r.unmount());}
});
test('startup waits for uncached account preferences instead of exposing the wrong theme or language',async()=>{
  user={id:'uncached'};remote.set(user.id,{theme:'dark',language:'si',brightness:70,auto_brightness:false});
  let resolve;delay=new Promise(done=>resolve=done);let r;
  try{
    r=await mount();assert.equal(theme.ready,false);assert.equal(language.ready,false);assert.equal(r.root.findAllByType('ready').length,0);
    await act(async()=>{resolve();await delay;});assert.equal(theme.ready,true);assert.equal(language.ready,true);assert.equal(theme.theme,'dark');assert.equal(language.language,'si');
  }finally{delay=undefined;if(r)await act(async()=>r.unmount());}
});
