import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const envPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.env",
);

dotenv.config({ path: envPath });

const isGmail =
  (process.env.EMAIL_SERVICE || "gmail").toLowerCase() === "gmail";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || (isGmail ? "smtp.gmail.com" : undefined),
  port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
  secure:
    process.env.EMAIL_SECURE === "true" ||
    (process.env.EMAIL_PORT ? process.env.EMAIL_PORT === "465" : false),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const verifyEmailTransport = async () => {
  await transporter.verify();
};

export const sendResetEmail = async (to, resetUrl) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: "Password reset",
    text: `Reset your password: ${resetUrl}`,
  });
  return info;
};

export const sendShareEmail = async (to, shareUrl, message) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: "A file was shared with you",
    text: `${message || ""}\n\nDownload: ${shareUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        ${message ? `<p>${message}</p>` : ""}
        <p>Your file is ready to download:</p>
        <p><a href="${shareUrl}" target="_blank" rel="noreferrer">${shareUrl}</a></p>
      </div>
    `,
  });
  return info;
};

export default transporter;
