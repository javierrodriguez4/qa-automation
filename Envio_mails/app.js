require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const {
  GMAIL_USER1,
  GMAIL_PASS1,
  GMAIL_USER2,
  GMAIL_PASS2,
  GMAIL_USER3,
  GMAIL_PASS3,
  RECIPIENTS,
  TOTAL_EMAILS,
  CONCURRENT_EMAILS,
  SEND_INTERVAL,
  SUBJECT,
  BODY,
} = process.env;

const recipients = RECIPIENTS.split(',');

const accounts = [
  { user: GMAIL_USER1, pass: GMAIL_PASS1 },
  { user: GMAIL_USER2, pass: GMAIL_PASS2 },
  { user: GMAIL_USER3, pass: GMAIL_PASS3 },
];

let accountIndex = 0;

// Función para obtener el siguiente transportador rotando entre las cuentas
function getTransporter() {
  const account = accounts[accountIndex];
  accountIndex = (accountIndex + 1) % accounts.length; // Rotación circular
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });
}

const logFilePath = path.join(__dirname, 'email_log.log');

// Función para escribir en el archivo de log y en la consola
function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage); // Log en consola
  fs.appendFileSync(logFilePath, `${logMessage}\n`, 'utf8'); // Log en archivo
}

async function sendEmail(to, emailCount) {
  const transporter = getTransporter();
  try {
    await transporter.sendMail({
      from: transporter.options.auth.user,
      to,
      subject: SUBJECT,
      text: BODY,
    });
    writeLog(`Correo enviado a ${to} desde ${transporter.options.auth.user} [Total enviados: ${emailCount}]`);
    return true;
  } catch (error) {
    writeLog(`Error al enviar a ${to}: ${error.message} [Total enviados: ${emailCount}]`);
    return false;
  }
}

async function sendBulkEmails() {
  let sentEmails = 0;
  let successfulEmails = 0;
  let interrupted = false;

  writeLog('--- Nueva ejecución de envío de correos ---');
  
  while (sentEmails < TOTAL_EMAILS) {
    const emailsToSend = Math.min(CONCURRENT_EMAILS, TOTAL_EMAILS - sentEmails);
    const currentRecipients = Array(emailsToSend)
      .fill()
      .map((_, i) => recipients[(sentEmails + i) % recipients.length]);

    try {
      const results = await Promise.all(currentRecipients.map((recipient) => sendEmail(recipient, sentEmails + 1)));
      successfulEmails += results.filter((result) => result).length;
      sentEmails += emailsToSend;

      if (sentEmails < TOTAL_EMAILS) {
        writeLog(`Esperando ${SEND_INTERVAL / 1000} segundos antes del próximo envío...`);
        await new Promise((resolve) => setTimeout(resolve, SEND_INTERVAL));
      }
    } catch (error) {
      writeLog(`Error inesperado: ${error.message}`);
      interrupted = true;
      break;
    }
  }

  if (interrupted) {
    writeLog(`Envío interrumpido. Correos enviados exitosamente: ${successfulEmails}`);
  } else {
    writeLog(`Envío masivo completado. Total de correos enviados: ${successfulEmails}`);
  }

  writeLog('--- Fin de ejecución ---');
}

sendBulkEmails();
