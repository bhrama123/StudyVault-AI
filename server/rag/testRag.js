const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.env" });

const Document = require("../models/Document");

const {
  prepareDocument,
  retrieveRelevantChunks,
} = require("./ragService");

async function testRAG() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected");

    const documents = await Document.find()
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`📄 Documents found: ${documents.length}`);

    documents.forEach((doc, index) => {
      console.log(
        `${index + 1}. ${doc.originalName} | Text length: ${doc.extractedText.length}`
      );
    });

    const document = documents.find(
      (doc) => doc.extractedText && doc.extractedText.length > 2000
    );

    if (!document) {
      throw new Error("❌ No OCR document with large extracted text found");
    }

    console.log("\n📚 Using document:");
    console.log(document.originalName);

    console.log(
      `📖 Extracted text length: ${document.extractedText.length}`
    );

    const chunks = prepareDocument(document.extractedText);

    console.log(`📦 Total chunks: ${chunks.length}`);

    const question = "What is classification of digital data?";

    console.log(`\n🔎 Searching for: ${question}`);

    const results = retrieveRelevantChunks(
      chunks,
      question,
      3
    );

    console.log(`🎯 Retrieved chunks: ${results.length}`);

    results.forEach((chunk) => {
      console.log("\n==============================");
      console.log(`Chunk: ${chunk.index + 1}`);
      console.log(`Score: ${chunk.score}`);
      console.log("==============================");
      console.log(chunk.text.slice(0, 700));
    });

    await mongoose.disconnect();

    console.log("\n✅ RAG test completed");
  } catch (error) {
    console.error("\n❌ RAG test failed:");
    console.error(error);
  }
}

testRAG();