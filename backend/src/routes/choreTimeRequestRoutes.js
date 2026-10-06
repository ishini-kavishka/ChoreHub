const router = require('express').Router();
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');
const { uuid, text, schedule, fail } = require('../utils/component04Validation');
const { eligibleChore, responsibleOwner, notifyRequest } = require('../services/choreTimeRequestService');
router.use(requireAuth);
const read = `SELECT r.*, (r.recipient_id=$1) AS can_review, c.title AS chore_title, c.due_date AS current_due_date,
  u.full_name AS requester_name, a.full_name AS recipient_name
  FROM chore_time_requests r JOIN chores c ON c.id=r.chore_id
  JOIN users u ON u.id=r.requester_id JOIN users a ON a.id=r.recipient_id`;
const privateWhere = '(r.requester_id=$1 OR r.recipient_id=$1)';
router.get('/context/:choreId', async (req,res,next) => {
  try {
    uuid(req.params.choreId);
    const { chore } = await eligibleChore(pool, req.params.choreId, req.userId);
    const existing = (await pool.query(`${read} WHERE r.chore_id=$2 AND r.requester_id=$1 AND r.status='PENDING'`, [req.userId,chore.id])).rows[0];
    res.json({ chore: { id:chore.id,title:chore.title,due_date:chore.due_date }, request:existing || null });
  } catch(e){ next(e); }
});
router.get('/', async (req,res,next) => {
  try {
    const admin = req.query.inbox==='admin';
    res.json({ requests:(await pool.query(`${read} WHERE ${admin ? 'r.recipient_id=$1 AND r.admin_dismissed_at IS NULL' : 'r.requester_id=$1'} ORDER BY r.created_at DESC`,[req.userId])).rows });
  } catch(e){next(e);}
});
router.get('/:id', async (req,res,next) => {
  try {
    uuid(req.params.id);
    const row=(await pool.query(`${read} WHERE r.id=$2 AND ${privateWhere}`,[req.userId,req.params.id])).rows[0];
    if(!row)throw fail('Request not found.',404);
    res.json({request:row});
  } catch(e){next(e);}
});

// Every state transition and its notifications commit together, under row locks.
function transaction(handler) {
  return async(req,res,next)=>{
    let db;
    try{db=await pool.connect();await db.query('BEGIN');const result=await handler(req,db);await db.query('COMMIT');res.status(result.created?201:200).json(result.body);}
    catch(e){if(db)await db.query('ROLLBACK');if(e.code==='23505')e=fail('A pending request already exists. View or edit it instead.',409);next(e);}
    finally{db?.release();}
  };
}
router.post('/',transaction(async(req,db)=>{
  const b=req.body || {};uuid(b.chore_id);
  const message=text(b.message,'Message',2000), requested=schedule(b.requested_due_date);
  const {chore,recipientId}=await eligibleChore(db,b.chore_id,req.userId,true);
  if(new Date(chore.due_date).getTime()===Date.parse(requested))throw fail('Choose a different due time.');
  const existing=(await db.query("SELECT id FROM chore_time_requests WHERE chore_id=$1 AND requester_id=$2 AND status='PENDING'",[chore.id,req.userId])).rows[0];
  if(existing)throw fail('A pending request already exists. View or edit it instead.',409);
  const row=(await db.query(`INSERT INTO chore_time_requests(chore_id,requester_id,recipient_id,message,original_due_date,requested_due_date)
    VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[chore.id,req.userId,recipientId,message,chore.due_date,requested])).rows[0];
  await notifyRequest(db,row,chore,recipientId,'Time Change Request');
  await notifyRequest(db,row,chore,req.userId,'Time Change Pending');
  return {created:true,body:{request:row}};
}));
async function ownedPending(req,db,recipient=false){
  uuid(req.params.id);
  const row=(await db.query(`SELECT * FROM chore_time_requests WHERE id=$1 AND ${recipient?'recipient_id':'requester_id'}=$2 FOR UPDATE`,[req.params.id,req.userId])).rows[0];
  if(!row)throw fail('Request not found.',404);
  if(row.status!=='PENDING')throw fail('Only pending requests can be changed.',409);
  return row;
}
router.patch('/:id',transaction(async(req,db)=>{
  const row=await ownedPending(req,db);
  const {chore,recipientId}=await eligibleChore(db,row.chore_id,req.userId,true);
  if(recipientId!==row.recipient_id || new Date(chore.due_date).getTime()!==new Date(row.original_due_date).getTime())throw fail('The chore schedule or responsible owner has changed. Cancel this request and send a new one.',409);
  const b=req.body || {}, requested=schedule(b.requested_due_date), message=text(b.message,'Message',2000);
  if(Date.parse(requested)===new Date(chore.due_date).getTime())throw fail('Choose a different due time.');
  const updated=(await db.query('UPDATE chore_time_requests SET message=$2,requested_due_date=$3,updated_at=now() WHERE id=$1 RETURNING *',[row.id,message,requested])).rows[0];
  await db.query("UPDATE notifications SET is_read=FALSE WHERE time_request_id=$1 AND user_id=$2 AND type='time_change_request'",[row.id,row.recipient_id]);
  return {body:{request:updated}};
}));
router.post('/:id/cancel',transaction(async(req,db)=>{
  const row=await ownedPending(req,db);
  const updated=(await db.query("UPDATE chore_time_requests SET status='CANCELLED',updated_at=now() WHERE id=$1 RETURNING *",[row.id])).rows[0];
  return {body:{request:updated}};
}));
router.post('/:id/review',transaction(async(req,db)=>{
  const row=await ownedPending(req,db,true), b=req.body || {};
  if(!['APPROVED','REJECTED'].includes(b.status))throw fail('Choose approve or reject.');
  const response=text(b.admin_response || '', 'Admin response',1000,true);
  const chore=(await db.query('SELECT * FROM chores WHERE id=$1 FOR UPDATE',[row.chore_id])).rows[0];
  if(!chore || await responsibleOwner(db,chore)!==req.userId || req.userId===row.requester_id)throw fail('You are not the responsible admin or household owner.',403);
  if(b.status==='APPROVED'){
    await eligibleChore(db,chore.id,row.requester_id);
    if(new Date(chore.due_date).getTime()!==new Date(row.original_due_date).getTime())throw fail('The chore due time changed after this request. Reject this stale request instead.',409);
    schedule(new Date(row.requested_due_date).toISOString());
    // Only scheduling fields change: progress, completion and assignment stay intact.
    await db.query('UPDATE chores SET due_date=$2,updated_at=now() WHERE id=$1',[chore.id,row.requested_due_date]);
  }
  const updated=(await db.query('UPDATE chore_time_requests SET status=$2,admin_response=$3,reviewed_at=now(),updated_at=now() WHERE id=$1 RETURNING *',[row.id,b.status,response])).rows[0];
  await notifyRequest(db,updated,chore,row.requester_id,b.status==='APPROVED'?'Time Change Approved':'Time Change Rejected',b.status==='APPROVED'?'time_change_approved':'time_change_rejected');
  return {body:{request:updated}};
}));
router.post('/:id/dismiss',transaction(async(req,db)=>{
  uuid(req.params.id);
  const row=(await db.query('SELECT * FROM chore_time_requests WHERE id=$1 AND recipient_id=$2 FOR UPDATE',[req.params.id,req.userId])).rows[0];
  if(!row)throw fail('Request not found.',404);
  if(!['APPROVED','REJECTED'].includes(row.status))throw fail('Only approved or rejected requests can be cleared.',409);
  await db.query('UPDATE chore_time_requests SET admin_dismissed_at=now() WHERE id=$1',[row.id]);
  await db.query('DELETE FROM notifications WHERE time_request_id=$1 AND user_id=$2',[row.id,req.userId]);
  return {body:{id:row.id}};
}));
module.exports=router;
