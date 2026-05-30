import prisma from "../config/prisma.js";
import crypto from "crypto";
import { sendShareEmail, sendBulkShareEmail } from "../utils/email.js";

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
          const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
          const shareUrl = `${frontendUrl}/share/${token}`;

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

const createBulkShare = async (req, res) => {
  try {
    const {
      fileIds,
      recipientEmail,
      recipientEmails,
      recipients,
      expirationHours,
      message,
    } = req.body;

    const emailList = normalizeRecipients(
      recipientEmails || recipients || recipientEmail,
    );

    if (!Array.isArray(fileIds) || fileIds.length === 0 || emailList.length === 0 || !expirationHours)
      return res.status(400).json({ message: "Missing fields" });

    // Validate that all fileIds exist and belong to the user
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        userId: req.user.id,
      },
    });

    if (files.length !== fileIds.length) {
      return res.status(400).json({ message: "Some files were not found or access is denied" });
    }

    const expiresAt = new Date(
      Date.now() + parseInt(expirationHours) * 60 * 60 * 1000,
    );

    const createdShareIds = [];
    const shareRecordsPerEmail = {};

    try {
      for (const email of emailList) {
        shareRecordsPerEmail[email] = [];
        for (const file of files) {
          const token = crypto.randomBytes(32).toString("hex");
          const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
          const shareUrl = `${frontendUrl}/share/${token}`;

          const share = await prisma.fileShare.create({
            data: {
              fileId: file.id,
              ownerId: req.user.id,
              recipientEmail: email,
              token,
              message,
              expiresAt,
            },
          });

          createdShareIds.push(share.id);
          shareRecordsPerEmail[email].push({
            id: share.id,
            originalFileName: file.originalFileName,
            shareUrl,
          });
        }
      }

      // Send a single email to each recipient containing all their share links
      const emailResults = await Promise.allSettled(
        emailList.map((email) =>
          sendBulkShareEmail(email, shareRecordsPerEmail[email], message),
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
        // Rollback all shares if all emails failed
        await prisma.fileShare.deleteMany({
          where: { id: { in: createdShareIds } },
        });
        return res.status(502).json({
          message: "Share was not sent because the email could not be delivered",
          failedRecipients,
        });
      }

      const allCreatedShares = [];
      for (const email of emailList) {
        if (!failedRecipients.some(fr => fr.email === email)) {
          shareRecordsPerEmail[email].forEach(record => {
            allCreatedShares.push({
              id: record.id,
              recipientEmail: email,
              shareUrl: record.shareUrl,
              expiresAt,
            });
          });
        }
      }

      if (failedRecipients.length > 0) {
        return res.status(207).json({
          message: "Share created, but some emails could not be delivered",
          shares: allCreatedShares,
          failedRecipients,
        });
      }

      return res.status(201).json({
        message: "Shares created successfully",
        shares: allCreatedShares,
      });
    } catch (e) {
      console.error("Bulk email send failed", e);
      await prisma.fileShare.deleteMany({
        where: { id: { in: createdShareIds } },
      });
      return res.status(502).json({
        message: "Share was not sent because the email could not be delivered",
      });
    }
  } catch (err) {
    console.error("Bulk share error:", err);
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
            fileSize: true,
            mimeType: true,
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
        fileSize: Number(share.file.fileSize),
        mimeType: share.file.mimeType,
        recipientEmail: share.recipientEmail,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        openedAt: share.openedAt,
        revokedAt: share.revokedAt,
        status: share.revokedAt ? "revoked" : share.openedAt ? "opened" : "pending",
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
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    const { token } = req.params;
    const share = await prisma.fileShare.findUnique({
      where: { token },
      include: {
        owner: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    if (!share)
      return res.status(404).json({ message: "Invalid or expired link" });
    if (share.revokedAt)
      return res.status(410).json({ message: "This share link has been revoked" });
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
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        recipientEmail: share.recipientEmail,
        owner: {
          email: share.owner.email,
          firstName: share.owner.firstName,
          lastName: share.owner.lastName,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const revokeShare = async (req, res) => {
  try {
    const { id } = req.params;
    const share = await prisma.fileShare.findUnique({ where: { id } });
    if (!share)
      return res.status(404).json({ message: "Share not found" });
    if (share.ownerId !== req.user.id)
      return res.status(403).json({ message: "Access denied" });
    if (share.revokedAt)
      return res.status(400).json({ message: "Share is already revoked" });

    await prisma.fileShare.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return res.json({ message: "Share link revoked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Revoke error" });
  }
};

const deleteShare = async (req, res) => {
  try {
    const { id } = req.params;
    const share = await prisma.fileShare.findUnique({ where: { id } });
    if (!share)
      return res.status(404).json({ message: "Share not found" });
    if (share.ownerId !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    await prisma.fileShare.delete({
      where: { id },
    });

    return res.json({ message: "Share link deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete error" });
  }
};

const restoreShare = async (req, res) => {
  try {
    const { id } = req.params;
    const share = await prisma.fileShare.findUnique({ where: { id } });
    if (!share)
      return res.status(404).json({ message: "Share not found" });
    if (share.ownerId !== req.user.id)
      return res.status(403).json({ message: "Access denied" });
    if (!share.revokedAt)
      return res.status(400).json({ message: "Share is not revoked" });

    await prisma.fileShare.update({
      where: { id },
      data: { revokedAt: null },
    });

    return res.json({ message: "Share link access restored successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Restore error" });
  }
};

export { createShare, createBulkShare, listShares, publicShare, revokeShare, deleteShare, restoreShare };
