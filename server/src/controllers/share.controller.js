import prisma from "../config/prisma.js";
import crypto from "crypto";
import { sendShareEmail } from "../utils/email.js";

const normalizeRecipients = (value) => {
  const rawRecipients = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[;,\n]+/)
      : [];

  return [
    ...new Set(rawRecipients.map((email) => email.trim()).filter(Boolean)),
  ];
};

const createShare = async (req, res) => {
  try {
    const {
      fileId,
      recipientEmail,
      recipientEmails,
      recipients,
      expirationHours,
      message,
    } = req.body;

    const emailList = normalizeRecipients(
      recipientEmails || recipients || recipientEmail,
    );

    if (!fileId || emailList.length === 0 || !expirationHours)
      return res.status(400).json({ message: "Missing fields" });

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.userId !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    const expiresAt = new Date(
      Date.now() + parseInt(expirationHours) * 60 * 60 * 1000,
    );
    const createdShareIds = [];

    try {
      const shareRecords = await Promise.all(
        emailList.map((recipientEmail) => {
          const token = crypto.randomBytes(32).toString("hex");
          const shareUrl = `${req.protocol}://${req.get("host")}/public/share/${token}`;

          return prisma.fileShare
            .create({
              data: {
                fileId,
                ownerId: req.user.id,
                recipientEmail,
                token,
                message,
                expiresAt,
              },
            })
            .then((share) => {
              createdShareIds.push(share.id);
              return { share, shareUrl, recipientEmail };
            });
        }),
      );

      const emailResults = await Promise.allSettled(
        shareRecords.map(({ recipientEmail, shareUrl }) =>
          sendShareEmail(recipientEmail, shareUrl, message),
        ),
      );

      const failedRecipients = emailResults
        .map((result, index) => ({ result, email: emailList[index] }))
        .filter(({ result }) => result.status === "rejected")
        .map(({ email, result }) => ({
          email,
          error: result.reason?.message || String(result.reason),
        }));

      if (failedRecipients.length === emailList.length) {
        await prisma.fileShare.deleteMany({
          where: { id: { in: shareRecords.map(({ share }) => share.id) } },
        });
        return res.status(502).json({
          message:
            "Share was not sent because the email could not be delivered",
          failedRecipients,
        });
      }

      if (failedRecipients.length > 0) {
        return res.status(207).json({
          message: "Share created, but some emails could not be delivered",
          shares: shareRecords.map(({ share, shareUrl, recipientEmail }) => ({
            id: share.id,
            shareUrl,
            recipientEmail,
            expiresAt,
          })),
          failedRecipients,
        });
      }

      return res.status(201).json({
        message: "Share created",
        shares: shareRecords.map(({ share, shareUrl, recipientEmail }) => ({
          id: share.id,
          shareUrl,
          recipientEmail,
          expiresAt,
        })),
      });
    } catch (e) {
      console.error("Email send failed", e);
      await prisma.fileShare.deleteMany({
        where: { id: { in: createdShareIds } },
      });
      return res.status(502).json({
        message: "Share was not sent because the email could not be delivered",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const listShares = async (req, res) => {
  try {
    const shares = await prisma.fileShare.findMany({
      where: { ownerId: req.user.id },
      include: {
        file: {
          select: {
            id: true,
            originalFileName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      shares: shares.map((share) => ({
        id: share.id,
        fileId: share.fileId,
        fileName: share.file.originalFileName,
        recipientEmail: share.recipientEmail,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        openedAt: share.openedAt,
        status: share.openedAt ? "opened" : "pending",
        token: share.token,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "List error" });
  }
};

const publicShare = async (req, res) => {
  try {
    const { token } = req.params;
    const share = await prisma.fileShare.findUnique({ where: { token } });
    if (!share)
      return res.status(404).json({ message: "Invalid or expired link" });
    if (share.expiresAt < new Date())
      return res.status(410).json({ message: "Link expired" });

    const file = await prisma.file.findUnique({ where: { id: share.fileId } });
    if (!file) return res.status(404).json({ message: "File not found" });

    if (!share.openedAt)
      await prisma.fileShare.update({
        where: { id: share.id },
        data: { openedAt: new Date() },
      });

    return res.json({
      file: {
        id: file.id,
        originalFileName: file.originalFileName,
        fileSize: Number(file.fileSize),
        mimeType: file.mimeType,
      },
      share: {
        expiresAt: share.expiresAt,
        recipientEmail: share.recipientEmail,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export { createShare, listShares, publicShare };
