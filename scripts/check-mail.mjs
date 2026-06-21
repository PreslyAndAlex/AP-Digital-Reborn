/*
 * Verifies the contact-form email setup from .env WITHOUT sending an email.
 * Run it any time you change the SMTP settings:  npm run mail:check
 */
import 'dotenv/config'
import nodemailer from 'nodemailer'

const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
if (!hasSmtp) {
  console.log('DEV mode — SMTP_* not all set. The form works but logs to the console instead of emailing.')
  process.exit(0)
}

const port = Number(process.env.SMTP_PORT) || 587
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: String(process.env.SMTP_SECURE ?? (port === 465)) === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  // Don't hang the operator if the SMTP server is slow/unreachable.
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
})

try {
  await transporter.verify()
  console.log('OK  ✅  Connected to ' + process.env.SMTP_HOST + ' and logged in.')
  console.log('        Enquiries will be delivered to: ' + (process.env.CONTACT_TO || process.env.SMTP_USER))
  console.log('        The contact form is ready to send real email.')
} catch (e) {
  const code = e && e.responseCode ? e.responseCode + ' ' : ''
  console.log('FAIL  ❌  ' + code + (e && e.message ? e.message : String(e)))
  console.log('\nCommon fixes:')
  console.log('  • SMTP_HOST must be a mail server (e.g. smtp.gmail.com), not your email address.')
  console.log('  • For Gmail, SMTP_PASS must be a 16-char App Password (myaccount.google.com/apppasswords),')
  console.log('    not your normal Google password. 2-Step Verification must be on.')
  console.log('  • SMTP_USER / CONTACT_FROM should be your full Gmail address.')
  process.exit(1) // surface the failure to the shell / CI
}
process.exit(0)
