// Source migration for existing Admin styles. Brand, chart/status accents,
// button foregrounds and shadows are deliberately retained.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'../src');
const dirs=['screens/admin','screens/support','components/chores','components/navigation'];
const report=[];
function rgb(hex){const value=hex.slice(1);if(![3,6].includes(value.length))return null;return(value.length===3?[...value].map(c=>c+c):value.match(/../g)).map(c=>parseInt(c,16));}
function token(value,property,styleName){
  if(['bg','bgColor','iconBg'].includes(property))property='backgroundColor';
  if(property==='text')property='color';
  const channels=rgb(value);if(!channels)return null;
  const max=Math.max(...channels),min=Math.min(...channels),[r,g,b]=channels;
  if(property==='shadowColor')return null;
  const pale=min>=190,neutral=max-min<48;
  if(/border.*Color/i.test(property)&&pale)return'border';
  if(property==='backgroundColor'){
    if(pale)return min>=245?'card':/safe|root|screen|container|background/i.test(styleName)&&neutral?'background':'surface';
    if(neutral&&max<65)return'background';
  }
  if(property==='color'||property==='placeholderTextColor'||property==='stroke'){
    if(/error|danger/i.test(styleName))return 'error';
    if(/success|resolved/i.test(styleName))return 'success';
    if(min>=240){if(!styleName||/button|btn|primary|selected|active|badge|mark|avatar|white|check/i.test(styleName))return null;return'textPrimary';}
    if(pale&&property==='stroke')return'border';
    // Neutral greys and dark purple/blue neutral text, not colored brand icons.
    if(neutral || (max<160&&r<=b&&g<=b&&b-g<80))return max<85?'textPrimary':'textSecondary';
  }
  return null;
}
for(const dir of dirs)for(const filename of fs.readdirSync(path.join(root,dir))){
  if(!filename.endsWith('.tsx')||(dir!=='screens/admin'&&!filename.startsWith('Admin')))continue;
  const file=path.join(root,dir,filename),sourceText=fs.readFileSync(file,'utf8');
  const source=ts.createSourceFile(file,sourceText,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const styleDeclarations=[];
  function collect(n){if(ts.isVariableDeclaration(n)&&n.initializer&&ts.isCallExpression(n.initializer)&&n.initializer.expression.getText(source)==='StyleSheet.create')styleDeclarations.push(n);ts.forEachChild(n,collect);}
  collect(source);
  const edits=[],changes=[];
  for(const declaration of styleDeclarations){
    // Only module-level styles; existing component-local dynamic styles stay intact.
    if(declaration.parent.parent.parent!==source)continue;
    const name=declaration.name.getText(source),factory='create'+name[0].toUpperCase()+name.slice(1);
    const init=declaration.initializer,functions=[];
    for(const statement of source.statements){if(ts.isFunctionDeclaration(statement)&&statement.body&&statement.name&&/^[A-Z]/.test(statement.name.text)){
      let used=false;function find(n){if(ts.isIdentifier(n)&&n.text===name)used=true;ts.forEachChild(n,find);}find(statement.body);if(used)functions.push(statement);
    }}
    if(!functions.length)continue;
    const colorEdits=[];
    function colors(n){if(ts.isStringLiteral(n)&&/^#[0-9a-f]{3,8}$/i.test(n.text)){
      let property='',styleName='';let parent=n.parent;
      if(ts.isPropertyAssignment(parent))property=parent.name.getText(source);
      while(parent&&parent!==init){if(ts.isPropertyAssignment(parent)&&parent.name.getText(source)!==property)styleName=parent.name.getText(source);parent=parent.parent;}
      const key=token(n.text,property,styleName);
      if(key){colorEdits.push([n.getStart(source),n.end,`(themeColors.isDark ? themeColors.${key} : ${n.getText(source)})`]);changes.push({style:styleName,property,light:n.text,dark:key});}
    }ts.forEachChild(n,colors);}colors(init);
    if(!colorEdits.length)continue;
    edits.push([declaration.name.getStart(source),declaration.name.end,factory]);
    edits.push([init.getStart(source),init.getStart(source),'(themeColors: ThemeColors) => '],...colorEdits);
    for(const fn of functions)edits.push([fn.body.getStart(source)+1,fn.body.getStart(source)+1,`\n  const ${name} = useThemedStyles(${factory});`]);
  }
  // Inline neutral colors also need the provider (e.g. input placeholders/icons).
  const inlineFunctions=new Set();
  function inline(n){
    if(ts.isStringLiteral(n)&&/^#[0-9a-f]{3,8}$/i.test(n.text)){
      let parent=n.parent,property='',styleName='',fn,inFactory=false,alreadyThemed=false;
      while(parent){
        if(ts.isPropertyAssignment(parent)){if(!property)property=parent.name.getText(source);else styleName=parent.name.getText(source);}
        if(ts.isJsxAttribute(parent)&&!property)property=parent.name.getText(source);
        if(ts.isFunctionDeclaration(parent)&&parent.name&&/^[A-Z]/.test(parent.name.text))fn=parent;
        if(ts.isArrowFunction(parent)&&parent.parameters.some(p=>p.name.getText(source)==='themeColors'))inFactory=true;
        if(ts.isConditionalExpression(parent)&&parent.condition.getText(source).includes('themeColors.isDark'))alreadyThemed=true;
        parent=parent.parent;
      }
      const key=token(n.text,property,styleName);
      if(!alreadyThemed&&key&&(fn||(inFactory&&['error','success'].includes(key)))){edits.push([n.getStart(source),n.end,ts.isJsxAttribute(n.parent)?`{themeColors.isDark ? themeColors.${key} : ${n.getText(source)}}`:`(themeColors.isDark ? themeColors.${key} : ${n.getText(source)})`]);if(fn)inlineFunctions.add(fn);changes.push({style:'inline',property,light:n.text,dark:key});}
    }
    ts.forEachChild(n,inline);
  }
  inline(source);
  for(const fn of inlineFunctions)if(!fn.body.getText(source).includes('const themeColors = useClientTheme().colors'))edits.push([fn.body.getStart(source)+1,fn.body.getStart(source)+1,'\n  const themeColors = useClientTheme().colors;']);
  if(!edits.length)continue;
  if(sourceText.includes("import { useThemedStyles, type ThemeColors }")){
    const at=sourceText.indexOf('useThemedStyles, type ThemeColors');edits.push([at,at+'useThemedStyles, type ThemeColors'.length,'useThemedStyles, useAppTheme as useClientTheme, type ThemeColors']);
  }else if(!sourceText.includes('useAppTheme as useClientTheme'))edits.push([0,0,"import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';\n"]);
  edits.sort((a,b)=>b[0]-a[0]);let text=sourceText;for(const [a,b,value]of edits)text=text.slice(0,a)+value+text.slice(b);
  if(process.argv.includes('--write'))fs.writeFileSync(file,text);
  report.push({file:path.relative(root,file).replaceAll('\\','/'),changes});
}
fs.writeFileSync(path.resolve(__dirname,'../.expo/admin-theme-audit.json'),JSON.stringify(report,null,2));
console.log(`${report.length} existing Admin files; ${report.reduce((n,r)=>n+r.changes.length,0)} theme-dependent style colors audited.`);
