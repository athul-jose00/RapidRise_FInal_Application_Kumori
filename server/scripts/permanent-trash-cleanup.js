#!/usr/bin/env node
import prisma from "../src/config/prisma.js";
import cloudinary from "../src/config/cloudinary.js";
import supabase from "../src/config/supabase.js";
import fsp from "node:fs/promises";
import path from "node:path";

async function purgeOldTrash() {
  const cutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  console.log(`Purging trashed files older than ${cutoff.toISOString()}`);

  const toDelete = await prisma.file.findMany({
    where: { isTrashed: true, trashedAt: { lte: cutoff } },
  });

  for (const file of toDelete) {
    try {
      if (file.storageBackend === "supabase" && file.supabasePath) {
        try {
          const bucket = process.env.SUPABASE_BUCKET_NAME || "files";
          await supabase.storage.from(bucket).remove([file.supabasePath]);
        } catch (e) {
          console.error("supabase delete error", e);
        }
      } else if (file.storageBackend === "local" && file.storedFileName) {
        try {
          const fullPath = path.join(
            process.cwd(),
            "server",
            "uploads",
            file.storedFileName,
          );
          await fsp.unlink(fullPath).catch(() => {});
        } catch (e) {
          console.error("local delete error", e);
        }
      } else if (file.cloudinaryPublicId) {
        try {
          await cloudinary.uploader.destroy(file.cloudinaryPublicId, {
            resource_type: file.cloudinaryResourceType || "raw",
          });
        } catch (e) {
          console.error("cloudinary delete error", e);
        }
      }

      // delete dependent rows
      try {
        await prisma.fileShare.deleteMany({ where: { fileId: file.id } });
      } catch (e) {
        console.error("Failed to delete related FileShare records", e);
      }

      try {
        await prisma.fileContent.deleteMany({ where: { fileId: file.id } });
      } catch (e) {
        console.error("Failed to delete related FileContent records", e);
      }

      try {
        await prisma.fileEmbedding.deleteMany({ where: { fileId: file.id } });
      } catch (e) {
        console.error("Failed to delete related FileEmbedding records", e);
      }

      await prisma.file.delete({ where: { id: file.id } });
      console.log(`Purged file ${file.id}`);
    } catch (err) {
      console.error(`Failed to purge file ${file.id}`, err);
    }
  }
}

if (require.main === module) {
  purgeOldTrash()
    .then(() => {
      console.log("Purge complete");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default purgeOldTrash;
