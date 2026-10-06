import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { ApiError } from '@/services/api';
import { choreTimeRequestService as service, ChoreTimeRequest, RequestChore, RequestTarget } from '@/services/choreTimeRequestService';

export function requestLocalInput(value: string) {
  const d = new Date(value), pad = (n:number) => String(n).padStart(2,'0');
  return { date:`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`, time:`${pad(d.getHours())}:${pad(d.getMinutes())}` };
}
export function parseRequestTime(date:string,time:string) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [y,m,d]=date.split('-').map(Number), [h,min]=time.split(':').map(Number);
  const value=new Date(y,m-1,d,h,min);
  if(!Number.isFinite(value.getTime()) || value.getTime()<=Date.now())return null;
  const local=requestLocalInput(value.toISOString());
  return local.date===date && local.time===time ? value.toISOString() : null;
}

// An embedded inbox and modal flow, reused inside the two existing Notifications screens.
export default function ChoreTimeRequests({admin=false,target,onClose,onChanged,refreshKey=0,showInbox=true}: {
  admin?:boolean; target:RequestTarget|null; onClose:()=>void; onChanged:()=>void; refreshKey?:number; showInbox?:boolean;
}) {
  const {colors:c}=useAppTheme(),{t,language}=useLanguage();
  const [items,setItems]=useState<ChoreTimeRequest[]>([]),[expanded,setExpanded]=useState(admin);
  const [detail,setDetail]=useState<ChoreTimeRequest|null>(null),[chore,setChore]=useState<RequestChore|null>(null);
  const [visible,setVisible]=useState(false),[editing,setEditing]=useState(false),[loading,setLoading]=useState(false);
  const [date,setDate]=useState(''),[time,setTime]=useState(''),[reason,setReason]=useState(''),[response,setResponse]=useState('');
  const [confirm,setConfirm]=useState<'cancel'|'approve'|'reject'|'dismiss'|null>(null);
  const [error,setError]=useState(''),[listError,setListError]=useState(false),[saving,setSaving]=useState(false);
  const lock=useRef(false),generation=useRef(0),mounted=useRef(true), listGeneration=useRef(0);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;generation.current++;};},[]);
  const load=useCallback(async()=>{
    if(!showInbox)return;
    const version=++listGeneration.current;
    try{const result=await service.list(admin);if(mounted.current && version===listGeneration.current){setItems(result.requests);setListError(false);}}
    catch{if(mounted.current && version===listGeneration.current)setListError(true);}
  },[admin,showInbox]);
  useFocusEffect(useCallback(()=>{void load();const timer=setInterval(()=>void load(),30000);return()=>clearInterval(timer);},[load]));
  useEffect(()=>{void load();},[refreshKey,load]);
  const fill=(value:string,message:string)=>{const local=requestLocalInput(value);setDate(local.date);setTime(local.time);setReason(message);};
  const open=useCallback(async(value:RequestTarget)=>{
    const version=++generation.current;setVisible(true);setLoading(true);setError('');setConfirm(null);setEditing(false);setDetail(null);setChore(null);setResponse('');
    try{
      if('requestId' in value){
        const {request}=await service.get(value.requestId);
        if(version!==generation.current)return;
        setDetail(request);setChore({id:request.chore_id,title:request.chore_title,due_date:request.current_due_date || ''});fill(request.requested_due_date,request.message);
      }else{
        const result=await service.context(value.choreId);
        if(version!==generation.current)return;
        setChore(result.chore);setDetail(result.request);setEditing(!result.request);
        fill(result.request?.requested_due_date || result.chore.due_date,result.request?.message || '');
      }
    }catch{if(version===generation.current)setError(t('tr_error'));}
    finally{if(version===generation.current)setLoading(false);}
  },[t]);
  useEffect(()=>{if(target)void open(target);},[target,open]);
  const close=()=>{if(lock.current)return;generation.current++;setVisible(false);setConfirm(null);onClose();};
  const act=async(fn:()=>Promise<unknown>,finish=true)=>{
    if(lock.current)return;lock.current=true;setSaving(true);setError('');
    try{await fn();if(finish)closeAfterSave();void load();onChanged();}
    catch(e){setError(e instanceof ApiError && e.status===409?t('tr_conflict'):e instanceof ApiError && [401,403,404].includes(e.status || 0)?t('admin_denied'):t('tr_error'));}
    finally{lock.current=false;setSaving(false);}
  };
  const closeAfterSave=()=>{generation.current++;setVisible(false);setConfirm(null);onClose();};
  const save=()=>{
    const requested=parseRequestTime(date,time);
    if(!requested || (chore && Date.parse(requested)===Date.parse(chore.due_date)) || !reason.trim() || reason.trim().length>2000 || !chore){setError(t('tr_valid'));return;}
    void act(()=>detail?service.edit(detail.id,requested,reason.trim()):service.create(chore.id,requested,reason.trim()));
  };
  const execute=()=>{if(!detail || !confirm)return;void act(()=>confirm==='cancel'?service.cancel(detail.id):confirm==='dismiss'?service.dismiss(detail.id):service.review(detail.id,confirm==='approve'?'APPROVED':'REJECTED',response));};
  const reviewer=detail?.can_review === true;
  const status=(r:ChoreTimeRequest)=>t('tr_'+r.status.toLowerCase());
  const statusColor=(r:ChoreTimeRequest)=>r.status==='APPROVED'?(c.isDark?'#76DEBB':'#15803D'):r.status==='REJECTED'?(c.isDark?'#FFAAA8':'#B3261E'):r.status==='CANCELLED'?c.textSecondary:c.primary;
  const stamp=(value:string)=>value?new Date(value).toLocaleString(language):'—';
  const button=(key:string,fn:()=>void,primary=false)=><Pressable key={key} accessibilityRole="button" accessibilityLabel={t(key)} disabled={saving||loading} onPress={e=>{e.stopPropagation();fn();}} style={{paddingHorizontal:14,paddingVertical:10,borderRadius:20,backgroundColor:primary?c.primary:c.surface,opacity:saving?.5:1}}><Text style={{fontWeight:'700',color:primary?'#fff':c.primary}}>{t(key)}</Text></Pressable>;
  const line=(label:string,value:string)=><View style={{gap:3}}><Text style={{fontSize:12,color:c.textSecondary}}>{t(label)}</Text><Text style={{color:c.textPrimary}}>{value}</Text></View>;
  return <>
    {showInbox && (items.length>0 || !admin || listError) && <View style={{gap:10}}>
      <Pressable accessibilityRole="button" accessibilityLabel={t(admin?'tr_admin':'tr_my')} accessibilityState={{expanded}} onPress={()=>setExpanded(!expanded)} style={{flexDirection:'row',gap:8,alignItems:'center'}}>
        <Ionicons name="time-outline" size={20} color={c.primary}/><Text style={{color:c.primary,fontWeight:'700'}}>{t(admin?'tr_admin':'tr_my')} ({items.length})</Text><Ionicons name={expanded?'chevron-up':'chevron-down'} size={16} color={c.primary}/>
      </Pressable>
      {listError && <View style={{gap:6}}><Text style={{color:c.textSecondary}}>{t('tr_error')}</Text>{button('crud_retry',()=>void load())}</View>}
      {expanded && !listError && !items.length && <Text style={{color:c.textSecondary}}>{t('tr_empty')}</Text>}
      {expanded && items.map(r=><Pressable key={r.id} accessibilityRole="button" accessibilityLabel={`${t('tr_view')}: ${r.chore_title}`} onPress={()=>void open({requestId:r.id})} style={{padding:16,gap:6,backgroundColor:c.card,borderRadius:20,borderWidth:1,borderColor:c.border}}>
        <Text style={{color:c.textPrimary,fontWeight:'700'}}>{admin?r.requester_name:r.chore_title}</Text>
        {admin && <Text style={{color:c.textPrimary}}>{r.chore_title}</Text>}
        <Text style={{color:statusColor(r),fontWeight:'700'}}>{status(r)}</Text>
        <Text style={{color:c.textSecondary}}>{stamp(r.original_due_date)} → {stamp(r.requested_due_date)}</Text>
        <Text style={{color:c.textSecondary}}>{r.message}</Text>
        <Text style={{fontSize:12,color:c.textSecondary}}>{t('tr_sent')}: {stamp(r.created_at)}</Text>
        <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>
          {button('tr_view',()=>void open({requestId:r.id}))}
          {r.status==='PENDING' && button(admin?'tr_approve':'tr_edit',()=>{void open({requestId:r.id}).then(()=>{if(admin)setConfirm('approve');else setEditing(true);});})}
          {r.status==='PENDING' && button(admin?'tr_reject':'tr_cancel',()=>{void open({requestId:r.id}).then(()=>setConfirm(admin?'reject':'cancel'));})}
          {admin && ['APPROVED','REJECTED'].includes(r.status) && button('tr_remove',()=>{void open({requestId:r.id}).then(()=>setConfirm('dismiss'));})}
        </View>
      </Pressable>)}
    </View>}
    <Modal visible={visible} transparent animationType="fade" onRequestClose={()=>{if(saving)return;if(confirm)setConfirm(null);else if(editing&&detail)setEditing(false);else close();}}>
      <View style={{flex:1,backgroundColor:'#0008',justifyContent:'center',padding:18}}><View style={{backgroundColor:c.card,borderRadius:20,padding:18,maxHeight:'90%',width:'100%',maxWidth:540,alignSelf:'center'}}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:14}}>
          <Text style={{fontSize:20,fontWeight:'800',color:c.textPrimary}}>{t(confirm==='dismiss'?'tr_remove_title':confirm?'tr_'+confirm+'_title':'tr_title')}</Text>
          {loading && <ActivityIndicator color={c.primary}/>}
          {chore && <>
            <Text style={{fontSize:17,fontWeight:'700',color:c.textPrimary}}>{chore.title}</Text>
            {reviewer && detail && line('role_member',detail.requester_name)}
            {line('tr_current',stamp(chore.due_date))}
            {detail && <>{line('tr_original',stamp(detail.original_due_date))}{line('tr_requested',stamp(detail.requested_due_date))}<Text style={{color:statusColor(detail),fontWeight:'700'}}>{status(detail)}</Text>{line('tr_sent',stamp(detail.created_at))}{line('tr_updated',stamp(detail.updated_at))}{line('tr_reason',detail.message)}{detail.admin_response && line('tr_response_label',detail.admin_response)}</>}
            {editing && !confirm && <>
              <Text style={{color:c.textSecondary}}>{t('tr_local')}</Text>
              {([['tr_date',date,setDate,10],['tr_time',time,setTime,5],['tr_reason',reason,setReason,2000]] as const).map(([label,value,setValue,max])=><View key={label} style={{gap:6}}><Text style={{color:c.textPrimary,fontWeight:'600'}}>{t(label)} *</Text><TextInput accessibilityLabel={t(label)} value={value} onChangeText={setValue} maxLength={max} multiline={label==='tr_reason'} placeholder={label==='tr_date'?'YYYY-MM-DD':label==='tr_time'?'HH:mm':undefined} placeholderTextColor={c.textSecondary} style={{color:c.textPrimary,backgroundColor:c.surface,borderColor:c.border,borderWidth:1,borderRadius:12,padding:12,minHeight:label==='tr_reason'?90:44}}/></View>)}
            </>}
            {confirm==='cancel' && <Text style={{color:c.textSecondary}}>{t('tr_cancel_body')}</Text>}
            {confirm==='dismiss' && <Text style={{color:c.textSecondary}}>{t('tr_remove_body')}</Text>}
            {(confirm==='approve'||confirm==='reject') && <TextInput accessibilityLabel={t('tr_response')} placeholder={t('tr_response')} placeholderTextColor={c.textSecondary} value={response} onChangeText={setResponse} maxLength={1000} multiline style={{padding:12,borderRadius:12,color:c.textPrimary,backgroundColor:c.surface}}/>}
            <Text style={{color:c.textSecondary,fontSize:12}}>{t('tr_private')}</Text>
          </>}
          {!!error && <Text accessibilityRole="alert" style={{color:c.isDark?'#FFAAA8':'#B3261E'}}>{error}</Text>}
          {saving && <ActivityIndicator color={c.primary}/>}
          <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>
            {confirm?<>{button('cancel',()=>setConfirm(null))}{button(confirm==='cancel'?'tr_confirm':confirm==='dismiss'?'notification_remove':'tr_'+confirm,execute,true)}</>:editing?<>{button('cancel',()=>detail?setEditing(false):close())}{button(detail?'tr_save':'tr_send',save,true)}</>:<>
              {button('tr_close',close)}
              {chore && button('tr_chore',()=>{close();router.push({pathname:admin?'/admin/chore-details':'/home/chore-details',params:{id:chore.id}});})}
              {detail?.status==='PENDING' && (reviewer?<>{button('tr_approve',()=>setConfirm('approve'),true)}{button('tr_reject',()=>setConfirm('reject'))}</>:<>{button('tr_edit',()=>setEditing(true))}{button('tr_cancel',()=>setConfirm('cancel'))}</>)}
              {reviewer && detail && ['APPROVED','REJECTED'].includes(detail.status) && button('tr_remove',()=>setConfirm('dismiss'))}
            </>}
          </View>
        </ScrollView>
      </View></View>
    </Modal>
  </>;
}

// A safe entry point for older assignments whose notifications have no Chore ID.
// Eligibility is fetched from the backend; other members do not get this action.
export function ChoreTimeRequestButton({choreId,onChanged}:{choreId:string;onChanged:()=>void}) {
  const {colors}=useAppTheme(),{t}=useLanguage();
  const [eligible,setEligible]=useState(false),[pending,setPending]=useState<string|null>(null),[target,setTarget]=useState<RequestTarget|null>(null);
  const check=useCallback(async()=>{
    try{const result=await service.context(choreId);setEligible(true);setPending(result.request?.id || null);}
    catch{setEligible(false);}
  },[choreId]);
  useFocusEffect(useCallback(()=>{void check();},[check]));
  return <>
    {eligible && <Pressable accessibilityRole="button" accessibilityLabel={t(pending?'tr_view':'tr_request')} onPress={()=>setTarget(pending?{requestId:pending}:{choreId})} style={{alignSelf:'flex-start',backgroundColor:colors.surface,borderRadius:20,paddingHorizontal:14,paddingVertical:10,flexDirection:'row',gap:8}}>
      <Ionicons name="time-outline" size={18} color={colors.primary}/><Text style={{color:colors.primary,fontWeight:'700'}}>{t(pending?'tr_view':'tr_request')}</Text>
    </Pressable>}
    <ChoreTimeRequests showInbox={false} target={target} onClose={()=>setTarget(null)} onChanged={()=>{void check();onChanged();}}/>
  </>;
}
