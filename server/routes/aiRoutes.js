const express = require("express");

const Document = require("../models/Document");
const LearningActivity = require("../models/LearningActivity");

const {
  prepareDocument,
  retrieveRelevantChunks,
  buildContext,
} = require("../rag/ragService");

const router = express.Router();

// =====================================================
// RAG CONTEXT HELPER
// =====================================================

function getRelevantContext(
  documentText,
  query,
  topK = 3
) {
  if (!documentText || !documentText.trim()) {
    return "";
  }

  const chunks = prepareDocument(documentText);

  const relevantChunks =
    retrieveRelevantChunks(
      chunks,
      query,
      topK
    );

  console.log(
    `📚 RAG: ${chunks.length} chunks → ${relevantChunks.length} relevant chunks`
  );

  return buildContext(relevantChunks);
}

// =====================================================
// SAVE LEARNING ACTIVITY HELPER
// =====================================================

async function saveLearningActivity({
  userId,
  documentId = null,
  activityType,
  title,
  description = "",
  topic = "General",
}) {
  try {
    if (!userId) {
      console.log(
        "⚠️ No userId provided. Learning activity not saved."
      );

      return;
    }

    await LearningActivity.create({
      userId,
      documentId: documentId || null,
      activityType,
      title,
      description,
      topic,
    });

    console.log(
      `📊 Learning activity saved: ${activityType}`
    );
  } catch (error) {
    console.error(
      "⚠️ Failed to save learning activity:",
      error.message
    );
  }
}

// =====================================================
// OLLAMA HELPER
// =====================================================

async function askOllama(
  prompt,
  options = {}
) {
  const response = await fetch(
    "http://localhost:11434/api/generate",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        model: "qwen2.5:7b",

        prompt,

        stream: true,

        keep_alive: "10m",

        options: {
          temperature:
            options.temperature ?? 0.2,

          num_predict:
            options.num_predict ?? 500,

          num_ctx:
            options.num_ctx ?? 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "❌ Ollama error:",
      errorText
    );

    throw new Error(
      `Ollama request failed: ${errorText}`
    );
  }

  let fullResponse = "";

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  while (true) {
    const {
      value,
      done,
    } = await reader.read();

    if (done) {
      break;
    }

    const chunk =
      decoder.decode(
        value,
        {
          stream: true,
        }
      );

    const lines =
      chunk
        .split("\n")
        .filter(
          (line) =>
            line.trim()
        );

    for (const line of lines) {
      try {
        const data =
          JSON.parse(line);

        if (data.response) {
          fullResponse +=
            data.response;
        }

        if (data.done) {
          break;
        }
      } catch (error) {
        // Ignore incomplete streaming chunks
      }
    }
  }

  return fullResponse;
}

// =====================================================
// ASK AI
// =====================================================

router.post(
  "/ask",
  async (req, res) => {
    try {
      const {
        question,
        documentId,
        userId,

        // Used by Revision Planner
        activityType = "ask_ai",
      } = req.body;

      if (!question) {
        return res.status(400).json({
          message:
            "Question is required",
        });
      }

      console.log(
        "🤖 AI question:",
        question
      );

      console.log(
        "📌 Activity type received:",
        activityType
      );

      // =================================================
      // IMPORTANT
      // Only allow known activity types.
      // =================================================

      const safeActivityType =
        activityType === "revision_plan"
          ? "revision_plan"
          : "ask_ai";

      console.log(
        "📌 Activity type used:",
        safeActivityType
      );

      let documentContext = "";

      // =================================================
      // LOAD DOCUMENT
      // =================================================

      if (documentId) {
        console.log(
          "📄 Loading document:",
          documentId
        );

        const document =
          await Document.findById(
            documentId
          );

        if (!document) {
          return res.status(404).json({
            message:
              "Document not found",
          });
        }

        documentContext =
          document.extractedText ||
          "";

        console.log(
          "📖 Document text:",
          documentContext.length,
          "characters"
        );
      }

      // =================================================
      // CREATE PROMPT
      // =================================================

      let prompt = "";

      if (documentContext) {
        const relevantContext =
          getRelevantContext(
            documentContext,
            question,
            3
          );

        prompt = `
You are StudyVault AI,
an academic study assistant.

Answer the student's question
using ONLY the provided study
document sections.

STRICT RULES:

- Use only information explicitly
  present in the provided document.
- Do not use outside knowledge.
- Do not invent information.
- If the answer is not available
  in the provided document sections,
  say:

"This information is not available
in the uploaded document."

- Explain clearly and simply.
- Use headings or bullet points
  when useful.
- Keep the answer concise and
  exam-friendly.

RELEVANT STUDY DOCUMENT SECTIONS:

${relevantContext}

STUDENT QUESTION:

${question}
`;
      } else {
        prompt = `
You are StudyVault AI,
an academic study assistant.

Explain concepts clearly and simply
for college engineering students.

Keep the answer concise and
exam-friendly.

STUDENT QUESTION:

${question}
`;
      }

      // =================================================
      // SEND TO QWEN
      // =================================================

      console.log(
        "🤖 Sending question to Qwen..."
      );

      const answer =
        await askOllama(
          prompt,
          {
            temperature: 0.2,
            num_predict: 400,
            num_ctx: 8192,
          }
        );

      console.log(
        "🤖 AI answer received"
      );

      // =================================================
      // SAVE LEARNING ACTIVITY
      // =================================================

      let activityTitle =
        "Asked AI";

      if (
        safeActivityType ===
        "revision_plan"
      ) {
        activityTitle =
          "Generated Revision Plan";
      }

      await saveLearningActivity({
        userId,

        documentId,

        activityType:
          safeActivityType,

        title: activityTitle,

        description: question,

        topic: "General",
      });

      // =================================================
      // SEND RESPONSE
      // =================================================

      res.status(200).json({
        answer,
      });
    } catch (error) {
      console.error(
        "❌ Local AI error:",
        error
      );

      res.status(500).json({
        message:
          "AI request failed",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// SUMMARIZE DOCUMENT
// MAP → REDUCE SUMMARY
// =====================================================

router.post(
  "/summarize",
  async (req, res) => {
    try {
      const {
        documentId,
        userId,
      } = req.body;

      if (!documentId) {
        return res.status(400).json({
          message:
            "Document ID is required",
        });
      }

      console.log(
        "📝 Summarizing document:",
        documentId
      );

      const document =
        await Document.findById(
          documentId
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      const documentText =
        document.extractedText || "";

      console.log(
        "📖 Document text for summary:",
        documentText.length,
        "characters"
      );

      if (!documentText.trim()) {
        return res.status(400).json({
          message:
            "This document does not contain extracted text",
        });
      }

      // =================================================
      // STEP 1 — PREPARE ALL CHUNKS
      // =================================================

      const chunks =
        prepareDocument(
          documentText
        );

      console.log(
        `📚 Summary: ${chunks.length} chunks found`
      );

      // =================================================
      // STEP 2 — MAP
      // Summarize each chunk
      // =================================================

      const chunkSummaries = [];

      for (
        let i = 0;
        i < chunks.length;
        i++
      ) {
        const chunk =
          chunks[i];

        console.log(
          `🤖 Summarizing chunk ${i + 1}/${chunks.length}...`
        );

        const chunkPrompt = `
You are StudyVault AI.

Summarize the following section
of a college study document.

STRICT RULES:

- Use ONLY the information
  present in this section.
- Do NOT use outside knowledge.
- Do NOT invent facts.
- Preserve important terminology.
- Include important definitions.
- Include important concepts.
- Include classifications.
- Include lists.
- Include examples.
- Include exam-important points.
- Keep the summary concise.

DOCUMENT SECTION:

${chunk.text}

Create a concise study summary
for this section.
`;

        const summary =
          await askOllama(
            chunkPrompt,
            {
              temperature: 0.2,
              num_predict: 350,
              num_ctx: 8192,
            }
          );

        if (summary.trim()) {
          chunkSummaries.push(
            `SECTION ${i + 1}\n${summary}`
          );
        }
      }

      console.log(
        `✅ ${chunkSummaries.length} chunk summaries generated`
      );

      // =================================================
      // STEP 3 — COMBINE
      // =================================================

      const combinedSummary =
        chunkSummaries.join(
          "\n\n"
        );

      console.log(
        "📚 Combined summary length:",
        combinedSummary.length
      );

      // =================================================
      // STEP 4 — REDUCE
      // Create final summary
      // =================================================

      const finalPrompt = `
You are StudyVault AI,
an academic study assistant.

Create the FINAL study summary
using ONLY the section summaries
provided below.

STRICT RULES:

- Use ONLY the information
  contained in the section summaries.
- Do NOT use outside knowledge.
- Do NOT invent facts.
- Do NOT add information that
  is not present.
- Remove unnecessary repetition.
- Preserve important terminology.
- Cover the document as completely
  as possible.
- Keep it exam-friendly.
- Organize information clearly.

Use this structure:

# Complete Study Summary

## 1. Overview

Give a short overview of the
document content.

## 2. Major Topics

List the major topics covered.

## 3. Important Definitions

List important definitions.

## 4. Key Concepts

Explain the important concepts
using concise bullet points.

## 5. Classifications and Lists

Include important classifications,
types, categories and lists.

## 6. Important Examples

Include examples mentioned
in the document.

## 7. Exam Points

List important points useful
for examination preparation.

## 8. Quick Revision

Give a short revision checklist.

SECTION SUMMARIES:

${combinedSummary}
`;

      console.log(
        "🤖 Creating final summary with Qwen..."
      );

      const finalSummary =
        await askOllama(
          finalPrompt,
          {
            temperature: 0.2,
            num_predict: 1200,
            num_ctx: 8192,
          }
        );

      console.log(
        "✅ Complete document summary generated"
      );

      // =================================================
      // SAVE LEARNING ACTIVITY
      // =================================================

      await saveLearningActivity({
        userId,
        documentId,
        activityType: "summary",
        title: "Generated Summary",
        description:
          document.originalName,
        topic:
          document.subject ||
          "General",
      });

      res.status(200).json({
        summary: finalSummary,
      });
    } catch (error) {
      console.error(
        "❌ Summary error:",
        error
      );

      res.status(500).json({
        message:
          "Document summarization failed",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// GENERATE STUDY NOTES
// =====================================================

router.post(
  "/notes",
  async (req, res) => {
    try {
      const {
        documentId,
        userId,
      } = req.body;

      if (!documentId) {
        return res.status(400).json({
          message:
            "Document ID is required",
        });
      }

      console.log(
        "📝 Generating study notes:",
        documentId
      );

      const document =
        await Document.findById(
          documentId
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      const documentText =
        document.extractedText || "";

      console.log(
        "📖 Document text for notes:",
        documentText.length,
        "characters"
      );

      if (!documentText.trim()) {
        return res.status(400).json({
          message:
            "This document does not contain extracted text",
        });
      }

      const notesQuery = `
Create complete study notes from this document.

Find the main topics,
important definitions,
key concepts,
classifications,
lists,
examples,
and exam points.
`;

      const relevantContext =
        getRelevantContext(
          documentText,
          notesQuery,
          5
        );

      console.log(
        "📚 Notes context prepared"
      );

      const prompt = `
You are StudyVault AI,
an academic study assistant.

Create structured, exam-ready
study notes using ONLY the
provided study document sections.

STRICT RULES:

- Use ONLY information explicitly
  present in the document sections.
- Do NOT use outside knowledge.
- Do NOT invent facts,
  definitions, examples, or topics.
- Preserve terminology.
- If OCR text is unclear,
  do not guess.
- Every note must be supported
  by the document.
- Keep notes concise but useful.

Create notes using:

# Study Notes

## 1. Main Topics

List the main topics.

## 2. Important Definitions

List important definitions.

## 3. Key Concepts

Explain important concepts
using short bullet points.

## 4. Classifications and Lists

Include classifications,
categories, types and lists.

## 5. Important Examples

Include examples from
the document.

## 6. Exam Points

List important points
for examination.

## 7. Quick Revision

Create a short revision checklist.

STUDY DOCUMENT SECTIONS:

${relevantContext}
`;

      console.log(
        "🤖 Sending document to Qwen for notes..."
      );

      const notes =
        await askOllama(
          prompt,
          {
            temperature: 0.2,
            num_predict: 800,
            num_ctx: 8192,
          }
        );

      console.log(
        "✅ Study notes generated"
      );

      // =================================================
      // SAVE LEARNING ACTIVITY
      // =================================================

      await saveLearningActivity({
        userId,
        documentId,
        activityType: "notes",
        title:
          "Generated Study Notes",
        description:
          document.originalName,
        topic:
          document.subject ||
          "General",
      });

      res.status(200).json({
        notes,
      });
    } catch (error) {
      console.error(
        "❌ Notes error:",
        error
      );

      res.status(500).json({
        message:
          "Study notes generation failed",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// GENERATE QUESTIONS
// =====================================================

router.post(
  "/questions",
  async (req, res) => {
    try {
      const {
        documentId,
        userId,
      } = req.body;

      if (!documentId) {
        return res.status(400).json({
          message:
            "Document ID is required",
        });
      }

      console.log(
        "❓ Generating questions:",
        documentId
      );

      const document =
        await Document.findById(
          documentId
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      const documentText =
        document.extractedText || "";

      console.log(
        "📖 Document text for questions:",
        documentText.length,
        "characters"
      );

      if (!documentText.trim()) {
        return res.status(400).json({
          message:
            "This document does not contain extracted text",
        });
      }

      const questionQuery = `
Generate exam-oriented questions
from this document.

Cover definitions,
concepts,
explanations,
classifications,
lists,
and important exam topics.
`;

      const relevantContext =
        getRelevantContext(
          documentText,
          questionQuery,
          3
        );

      console.log(
        "📚 Question context prepared"
      );

      const prompt = `
You are StudyVault AI,
an academic study assistant.

Generate exam-oriented questions
and answers using ONLY the provided
study document sections.

STRICT RULES:

- Use ONLY information explicitly
  present in the provided sections.
- Do NOT use outside knowledge.
- Do NOT invent facts or topics.
- Do NOT create questions about
  information not present.
- Preserve terminology.
- If OCR text is unclear,
  do not guess.
- Every question and answer must
  be supported by the document.

Generate exactly 10 questions.

Use a mixture of:

- Definition questions
- Conceptual questions
- Explanation questions
- Classification or list questions
- Important exam-oriented questions

For every question provide
its answer.

Use this format:

# Practice Questions

## Question 1

**Question:** ...

**Answer:** ...

## Question 2

**Question:** ...

**Answer:** ...

Continue until Question 10.

At the end include:

## Quick Practice

List 5 important topics from
the provided document sections
that the student should revise.

STUDY DOCUMENT SECTIONS:

${relevantContext}
`;

      console.log(
        "🤖 Sending document to Qwen for questions..."
      );

      const questions =
        await askOllama(
          prompt,
          {
            temperature: 0.2,
            num_predict: 700,
            num_ctx: 8192,
          }
        );

      console.log(
        "✅ Questions generated"
      );

      // =================================================
      // SAVE LEARNING ACTIVITY
      // =================================================

      await saveLearningActivity({
        userId,
        documentId,
        activityType: "questions",
        title:
          "Generated Practice Questions",
        description:
          document.originalName,
        topic:
          document.subject ||
          "General",
      });

      res.status(200).json({
        questions,
      });
    } catch (error) {
      console.error(
        "❌ Questions error:",
        error
      );

      res.status(500).json({
        message:
          "Question generation failed",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;