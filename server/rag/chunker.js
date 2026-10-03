function cleanText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function chunkText(text, chunkSize = 6000, overlap = 500) {
  const cleanedText = cleanText(text);

  if (!cleanedText) {
    return [];
  }

  const chunks = [];
  let start = 0;

  while (start < cleanedText.length) {
    let end = start + chunkSize;

    // Try to end at a paragraph/newline instead of cutting a sentence
    if (end < cleanedText.length) {
      const paragraphBreak = cleanedText.lastIndexOf("\n\n", end);

      if (paragraphBreak > start + chunkSize * 0.6) {
        end = paragraphBreak;
      } else {
        const sentenceBreak = cleanedText.lastIndexOf(". ", end);

        if (sentenceBreak > start + chunkSize * 0.6) {
          end = sentenceBreak + 1;
        }
      }
    }

    const chunk = cleanedText.slice(start, end).trim();

    if (chunk) {
      chunks.push({
        index: chunks.length,
        text: chunk,
        start,
        end,
      });
    }

    if (end >= cleanedText.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

module.exports = {
  cleanText,
  chunkText,
};