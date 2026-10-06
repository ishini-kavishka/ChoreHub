const nodemailer = require('nodemailer');
const { pool } = require('../config/db');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const appError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const categories = ['Chore Issue', 'Technical Bug', 'Account & Login', 'General Inquiry'];
const priorities = ['low', 'medium', 'high'];
const statuses = ['open', 'in_progress', 'resolved'];

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}
const ticketColumns = `
  id,
  ticket_number AS "ticketNumber",
  user_id AS "userId",
  user_name AS "userName",
  user_email AS "userEmail",
  category,
  subject,
  description,
  status,
  priority,
  created_at AS "createdAt",
  updated_at AS "updatedAt",
  admin_notes AS "adminNotes"
`;

function validateTicketFields({ category, subject, description, priority }) {
  if (!categories.includes(category)) throw appError('Select a valid support category.');
  if (typeof subject !== 'string' || !subject.trim() || subject.trim().length > 200) {
    throw appError('Ticket subject is required and must be 200 characters or fewer.');
  }
  if (typeof description !== 'string' || !description.trim() || description.trim().length > 5000) {
    throw appError('Ticket description is required and must be 5000 characters or fewer.');
  }
  if (!priorities.includes(priority)) throw appError('Select a valid ticket priority.');
}

async function getTickets(_req, res, next) {
  try {
    const result = await pool.query(`SELECT ${ticketColumns} FROM support_tickets ORDER BY created_at DESC`);
    return res.json({ tickets: result.rows });
  } catch (error) {
    return next(error);
  }
}

async function getUserTickets(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT ${ticketColumns} FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.userId]
    );
    return res.json({ tickets: result.rows });
  } catch (error) {
    return next(error);
  }
}

async function createTicket(req, res, next) {
  try {
    const body = req.body || {};
    const category = body.category;
    const priority = body.priority;
    validateTicketFields({ category, subject: body.subject, description: body.description, priority });

    const result = await pool.query(
      `INSERT INTO support_tickets (
         ticket_number, user_id, user_name, user_email, category, subject, description, priority
       )
       SELECT 'TICK-' || nextval('support_ticket_number_seq')::text,
              id, full_name, email, $2, $3, $4, $5
       FROM users
       WHERE id = $1
       RETURNING ${ticketColumns}`,
      [req.userId, category, body.subject.trim(), body.description.trim(), priority]
    );
    if (!result.rows[0]) throw appError('User not found.', 404);
    return res.status(201).json({ ticket: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

async function updateUserTicket(req, res, next) {
  try {
    const body = req.body || {};
    validateTicketFields(body);
    const result = await pool.query(
      `UPDATE support_tickets
       SET category = $1, subject = $2, description = $3, priority = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6 AND admin_notes IS NULL
       RETURNING ${ticketColumns}`,
      [body.category, body.subject.trim(), body.description.trim(), body.priority, req.params.id, req.userId]
    );
    if (!result.rows[0]) throw appError('Ticket not found or no longer editable.', 404);
    return res.json({ ticket: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

async function updateTicketStatus(req, res, next) {
  try {
    const { status, adminNotes } = req.body || {};
    if (!statuses.includes(status)) throw appError('Select a valid ticket status.');
    if (adminNotes !== undefined && (typeof adminNotes !== 'string' || adminNotes.length > 5000)) {
      throw appError('Reply must be 5000 characters or fewer.');
    }

    const result = await pool.query(
      `UPDATE support_tickets
       SET status = $1,
           admin_notes = CASE WHEN $2 THEN $3 ELSE admin_notes END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING ${ticketColumns}`,
      [status, adminNotes !== undefined, adminNotes ?? null, req.params.id]
    );
    if (!result.rows[0]) throw appError('Ticket not found.', 404);
    return res.json({ ticket: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

async function deleteTicket(req, res, next) {
  try {
    const result = await pool.query(
      `DELETE FROM support_tickets
       WHERE id = $1
         AND (user_id = $2 OR EXISTS (SELECT 1 FROM users WHERE id = $2 AND role = 'admin'))
       RETURNING id`,
      [req.params.id, req.userId]
    );
    if (!result.rows[0]) throw appError('Ticket not found.', 404);
    return res.json({ message: 'Support ticket deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function sendSupportMessage(req, res, next) {
  try {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = normalizeEmail(body.email);
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!name || name.length > 200) throw appError('Name is required and must be 200 characters or fewer.');
    if (!EMAIL_PATTERN.test(email)) throw appError('A valid email address is required.');
    if (!subject || subject.length > 200) throw appError('Subject is required and must be 200 characters or fewer.');
    if (!message || message.length > 5000) throw appError('Message is required and must be 5000 characters or fewer.');

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromAddress = process.env.EMAIL_FROM || smtpUser || 'no-reply@chorehub.local';
    const supportTo = process.env.SUPPORT_EMAIL_TO || 'supportchorehub@gmail.com';

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw appError('Support email is not configured on the server. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in backend environment variables.');
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: fromAddress,
      to: supportTo,
      replyTo: email,
      subject: `[ChoreHub Support] ${subject}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject}`,
        '',
        'Message:',
        message,
      ].join('\n'),
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br />')}</p>
      `,
    });

    return res.json({ message: 'Message sent successfully.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getTickets,
  getUserTickets,
  createTicket,
  updateUserTicket,
  updateTicketStatus,
  deleteTicket,
  sendSupportMessage,
};