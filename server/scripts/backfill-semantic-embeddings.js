import prisma from "../src/config/prisma.js";
import { embedFileSemanticContent } from "../src/utils/semantic-indexer.js";

const fetchFileBuffer = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch file buffer (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const backfillSemanticEmbeddings = async () => {
  const files = await prisma.file.findMany({
    where: {
      fileEmbedding: null,
    },
    select: {
      id: true,
      originalFileName: true,
      mimeType: true,
      cloudinaryUrl: true,
      fileContent: {
        select: {
          content: true,
        },
      },
    },
  });

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const isImage =
        typeof file.mimeType === "string" &&
        file.mimeType.toLowerCase().startsWith("image/");
      const extractedContent = file.fileContent?.content || "";

      let buffer = null;
      if (isImage && file.cloudinaryUrl) {
        buffer = await fetchFileBuffer(file.cloudinaryUrl);
      }

      const semanticResult = await embedFileSemanticContent({
        buffer,
        mimeType: file.mimeType,
        extractedContent,
        originalFileName: file.originalFileName,
      });

      if (!semanticResult?.embedding) {
        skipped += 1;
        continue;
      }

      await prisma.fileEmbedding.upsert({
        where: { fileId: file.id },
        create: {
          fileId: file.id,
          model: process.env.COHERE_EMBED_MODEL || "embed-v4.0",
          inputType: semanticResult.inputType,
          embeddingKind: semanticResult.embeddingKind,
          dimensions: Array.isArray(semanticResult.embedding)
            ? semanticResult.embedding.length
            : null,
          vector: semanticResult.embedding,
        },
        update: {
          model: process.env.COHERE_EMBED_MODEL || "embed-v4.0",
          inputType: semanticResult.inputType,
          embeddingKind: semanticResult.embeddingKind,
          dimensions: Array.isArray(semanticResult.embedding)
            ? semanticResult.embedding.length
            : null,
          vector: semanticResult.embedding,
        },
      });

      created += 1;
      console.log(`Indexed file ${file.id} (${file.originalFileName})`);
    } catch (error) {
      failed += 1;
      console.error(
        `Failed to index ${file.id} (${file.originalFileName})`,
        error,
      );
    }
  }

  console.log(
    `Backfill complete. created=${created} skipped=${skipped} failed=${failed}`,
  );
};

try {
  await prisma.$connect();
  await backfillSemanticEmbeddings();
} catch (error) {
  console.error("Backfill failed", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
