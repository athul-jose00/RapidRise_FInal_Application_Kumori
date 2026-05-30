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

export const sendBulkShareEmail = async (to, sharedFiles, message) => {
  const linksText = sharedFiles.map(f => `${f.originalFileName}: ${f.shareUrl}`).join("\n");
  const linksHtml = sharedFiles.map(f => `
    <li style="margin-bottom: 12px; list-style-type: none; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 15px;">
      <span style="font-size: 13.5px; font-weight: 600; color: #334155; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 280px; font-family: sans-serif;" title="${f.originalFileName}">${f.originalFileName}</span>
      <a href="${f.shareUrl}" target="_blank" rel="noreferrer" style="font-size: 12px; font-weight: 700; color: white; background-color: #c62828; text-decoration: none; border-radius: 8px; padding: 6px 12px; display: inline-block; font-family: sans-serif;">Download</a>
    </li>
  `).join("");

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: "Multiple files were shared with you",
    text: `${message || ""}\n\nFiles shared:\n${linksText}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #f3f4f6; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #c62828; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 8px; font-family: sans-serif;">Files Shared with You</h2>
        <p style="font-size: 13px; color: #6b7280; margin-bottom: 20px; margin-top: 0; font-family: sans-serif;">You've received multiple files. Click the links below to access them.</p>
        ${message ? `<p style="background-color: #fef2f2; padding: 12px 16px; border-radius: 12px; border-left: 4px solid #c62828; font-size: 13px; color: #7f1d1d; margin-bottom: 20px; margin-top: 0; font-family: sans-serif;">${message}</p>` : ""}
        <ul style="padding-left: 0; margin: 0 0 20px 0;">
          ${linksHtml}
        </ul>
        <div style="border-top: 1px solid #f3f4f6; padding-top: 15px; text-align: center;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0; font-family: sans-serif;">Shared via Kumori.</p>
        </div>
      </div>
    `,
  });
  return info;
};

export default transporter;
