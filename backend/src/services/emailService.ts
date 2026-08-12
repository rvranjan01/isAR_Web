// import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || 'smtp.gmail.com',
//   port: parseInt(process.env.SMTP_PORT || '587'),
//   secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// export const sendEmail = async (to: string, subject: string, html: string) => {
//   try {
//     const info = await transporter.sendMail({
//       from: process.env.SMTP_FROM || '"Immverse AR" <noreply@immversestudios.com>',
//       to,
//       subject,
//       html,
//     });
//     console.log('Message sent: %s', info.messageId);
//     return info;
//   } catch (error) {
//     console.error('Error sending email: ', error);
//     // Returning error instead of throwing to prevent crashing the flow if email fails
//     return error;
//   }
// };



import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM =
  process.env.SMTP_FROM;

console.log("========================================");
console.log("SMTP Configuration");
console.log("SMTP_HOST:", SMTP_HOST);
console.log("SMTP_PORT:", SMTP_PORT);
console.log("SMTP_SECURE:", SMTP_SECURE);
console.log("SMTP_USER:", SMTP_USER ? "SET" : "MISSING");
console.log("SMTP_PASS:", SMTP_PASS ? "SET" : "MISSING");
console.log("SMTP_FROM:", SMTP_FROM);
console.log("========================================");

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,

  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },

  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

export const verifySMTP = async (): Promise<void> => {
  try {
    await transporter.verify();

    console.log("========================================");
    console.log("SMTP connection successful");
    console.log("========================================");
  } catch (error) {
    console.error("========================================");
    console.error("SMTP connection failed:", error);
    console.error("========================================");
  }
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
) => {
  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully:", info.messageId);

    return info;
  } catch (error) {
    console.error("Error sending email:", error);

    // Don't crash the main application if email fails.
    return error;
  }
};