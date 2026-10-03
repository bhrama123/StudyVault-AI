const { chunkText } = require("./chunker");

/**
 * Split document text into manageable chunks.
 */
function prepareDocument(text) {
  const chunks = chunkText(text, 6000, 500);

  console.log(`📚 Document divided into ${chunks.length} chunks`);

  return chunks;
}

/**
 * Simple keyword-based retrieval.
 *
 * This is our first RAG version.
 * Later we can replace this with embeddings/vector search.
 */
function retrieveRelevantChunks(chunks, query, topK = 3) {
  if (!chunks || chunks.length === 0) {
    return [];
  }

  const queryWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const scoredChunks = chunks.map((chunk) => {
    const text = chunk.text.toLowerCase();

    let score = 0;

    for (const word of queryWords) {
      const matches = text.match(new RegExp(`\\b${word}\\b`, "g"));

      if (matches) {
        score += matches.length;
      }
    }

    return {
      ...chunk,
      score,
    };
  });

  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Combine retrieved chunks into AI context.
 */
function buildContext(chunks) {
  return chunks
    .sort((a, b) => a.index - b.index)
    .map(
      (chunk) =>
        `--- Document Section ${chunk.index + 1} ---\n${chunk.text}`
    )
    .join("\n\n");
}

module.exports = {
  prepareDocument,
  retrieveRelevantChunks,
  buildContext,
};