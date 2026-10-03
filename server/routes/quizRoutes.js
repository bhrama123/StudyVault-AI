const express = require("express");

const Document = require("../models/Document");
const QuizResult = require("../models/QuizResult");

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
  topK = 1
) {
  if (!documentText || !documentText.trim()) {
    return "";
  }

  const chunks = prepareDocument(documentText);

  const relevantChunks = retrieveRelevantChunks(
    chunks,
    query,
    topK
  );

  console.log(
    `📚 Quiz RAG: ${chunks.length} chunks → ${relevantChunks.length} relevant chunks`
  );

  return buildContext(relevantChunks);
}


// =====================================================
// OLLAMA HELPER
// =====================================================

async function askOllama(prompt, timeoutMs = 180000) {
  console.log("🤖 Sending request to Ollama...");
  console.log(
    "📏 Prompt length:",
    prompt.length,
    "characters"
  );

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    console.log("⏰ Ollama request timeout reached.");
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(
      "http://127.0.0.1:11434/api/generate",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model: "qwen2.5:7b",

          prompt,

          stream: false,

          keep_alive: "10m",

          options: {
            temperature: 0.15,

            // Smaller output per request.
            // We generate 5 questions per request.
            num_predict: 900,

            num_ctx: 8192,
          },
        }),

        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "❌ Ollama error:",
        errorText
      );

      throw new Error(
        `Ollama request failed: ${errorText}`
      );
    }

    const data = await response.json();

    console.log("✅ Ollama response received");

    console.log(
      "📦 Ollama response length:",
      (data.response || "").length
    );

    return data.response || "";

  } catch (error) {

    if (error.name === "AbortError") {
      throw new Error(
        "Ollama took too long to generate the quiz. Please try again."
      );
    }

    throw error;

  } finally {
    clearTimeout(timeout);
  }
}


// =====================================================
// CLEAN AI JSON RESPONSE
// =====================================================

function extractJson(text) {

  if (!text) {
    return null;
  }

  let cleaned = text.trim();


  // Remove markdown code fences
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();


  // Direct JSON parsing
  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue below
  }


  // Find JSON array
  const firstArray = cleaned.indexOf("[");
  const lastArray = cleaned.lastIndexOf("]");

  if (
    firstArray !== -1 &&
    lastArray !== -1 &&
    lastArray > firstArray
  ) {

    const possibleJson = cleaned.slice(
      firstArray,
      lastArray + 1
    );

    try {
      return JSON.parse(possibleJson);
    } catch {
      // Continue
    }
  }


  // Find JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {

    const possibleJson = cleaned.slice(
      firstBrace,
      lastBrace + 1
    );

    try {
      return JSON.parse(possibleJson);
    } catch {
      // Continue
    }
  }


  return null;
}


// =====================================================
// NORMALIZE QUESTIONS
// =====================================================

function normalizeQuestions(questions) {

  if (!Array.isArray(questions)) {
    return [];
  }

  return questions

    .map((question) => {

      if (!question) {
        return null;
      }


      // ---------------------------------------------
      // Handle options
      // ---------------------------------------------

      let options = question.options || {};


      // Format:
      // ["Option A", "Option B", "Option C", "Option D"]

      if (Array.isArray(options)) {

        options = {
          A: options[0] || "",
          B: options[1] || "",
          C: options[2] || "",
          D: options[3] || "",
        };
      }


      // Format:
      // { A: "...", B: "...", C: "...", D: "..." }

      const normalizedOptions = {
        A: String(options.A || "").trim(),
        B: String(options.B || "").trim(),
        C: String(options.C || "").trim(),
        D: String(options.D || "").trim(),
      };


      // ---------------------------------------------
      // Handle correct answer
      // ---------------------------------------------

      let answer =
        question.correctAnswer ||
        question.answer ||
        question.correct ||
        "";

      answer = String(answer).trim();


      let correctAnswer = "";


      // If AI gives A/B/C/D

      const answerLetter = answer
        .toUpperCase()
        .replace(/[.)]/g, "")
        .trim();


      if (
        ["A", "B", "C", "D"].includes(answerLetter)
      ) {

        correctAnswer = answerLetter;

      } else {

        // If AI gives actual option text

        const answerLower =
          answer.toLowerCase();

        for (
          const letter of ["A", "B", "C", "D"]
        ) {

          if (
            normalizedOptions[letter]
              .toLowerCase() === answerLower
          ) {

            correctAnswer = letter;
            break;
          }
        }
      }


      return {
        question: String(
          question.question ||
          question.questionText ||
          ""
        ).trim(),

        options: normalizedOptions,

        correctAnswer,
      };

    })

    .filter((question) => {

      return (
        question &&
        question.question &&
        question.options.A &&
        question.options.B &&
        question.options.C &&
        question.options.D &&
        ["A", "B", "C", "D"].includes(
          question.correctAnswer
        )
      );

    });
}


// =====================================================
// REMOVE DUPLICATE QUESTIONS
// =====================================================

function removeDuplicateQuestions(questions) {

  const seen = new Set();

  return questions.filter((question) => {

    const key = question.question
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}


// =====================================================
// BUILD QUIZ PROMPT
// =====================================================

function buildQuizPrompt({
  topic,
  questionCount,
  context,
  previousQuestions = [],
}) {

  let previousSection = "";

  if (previousQuestions.length > 0) {

    previousSection = `

QUESTIONS ALREADY GENERATED:
${previousQuestions
  .map(
    (q, index) =>
      `${index + 1}. ${q.question}`
  )
  .join("\n")}

Do NOT repeat these questions.
Do NOT ask the same fact in a different sentence.
`;
  }


  return `
You are generating an academic multiple-choice quiz.

TOPIC:
${topic}

TASK:
Generate exactly ${questionCount} multiple-choice questions.

SOURCE:
Use ONLY the provided document context.

STRICT RULES:

1. Generate exactly ${questionCount} questions.
2. Every question must be related to the topic.
3. Every question must be supported by the document context.
4. Each question must have exactly 4 options.
5. Each option must be different.
6. There must be exactly one correct answer.
7. The "answer" field must contain the exact text of the correct option.
8. Do not use outside knowledge.
9. Do not create explanations.
10. Do not create hints.
11. Do not write an introduction.
12. Do not write a conclusion.
13. Do not use Markdown.
14. Return ONLY valid JSON.
15. Keep questions concise.
16. Prefer definitions, classifications, characteristics, concepts,
important facts, terminology and exam-oriented information.
17. Do not repeat the same question or fact.

${previousSection}

RETURN EXACTLY THIS JSON FORMAT:

[
  {
    "question": "Question text",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "answer": "Option A"
  }
]

DOCUMENT CONTEXT:
${context}
`;
}


// =====================================================
// GENERATE ONE BATCH
// =====================================================

async function generateQuizBatch({
  topic,
  questionCount,
  context,
  previousQuestions,
}) {

  const prompt = buildQuizPrompt({
    topic,
    questionCount,
    context,
    previousQuestions,
  });


  const aiResponse =
    await askOllama(
      prompt,
      180000
    );


  console.log(
    "🤖 Quiz batch response received"
  );

  console.log(
    "📦 Batch response length:",
    aiResponse.length
  );


  const parsed =
    extractJson(aiResponse);


  if (!parsed) {

    console.error(
      "❌ Could not parse Qwen quiz JSON."
    );

    console.error(
      "Raw response:",
      aiResponse
    );

    return [];
  }


  const rawQuestions =
    Array.isArray(parsed)
      ? parsed
      : parsed.questions;


  return normalizeQuestions(
    rawQuestions
  );
}


// =====================================================
// GENERATE QUIZ
// =====================================================

router.post(
  "/generate",
  async (req, res) => {

    try {

      const {
        userId,
        topic,
        documentId,
      } = req.body;


      // ---------------------------------------------
      // Validate input
      // ---------------------------------------------

      if (!userId) {

        return res.status(400).json({
          message:
            "userId is required to generate a document-based quiz.",
        });
      }


      if (!topic || !topic.trim()) {

        return res.status(400).json({
          message:
            "Topic is required.",
        });
      }


      console.log(
        "🧠 Generating document-based quiz..."
      );

      console.log(
        "👤 User:",
        userId
      );

      console.log(
        "📚 Topic:",
        topic
      );


      // ---------------------------------------------
      // Load document
      // ---------------------------------------------

      let document;


      if (documentId) {

        document =
          await Document.findOne({
            _id: documentId,
            userId,
          });

      } else {

        document =
          await Document.findOne({
            userId,
          }).sort({
            uploadedAt: -1,
            createdAt: -1,
          });
      }


      if (!document) {

        return res.status(404).json({
          message:
            "No study document was found. Please upload a document first.",
        });
      }


      console.log(
        "📄 Quiz document:",
        document.originalName
      );

      console.log(
        "🆔 Document ID:",
        document._id
      );


      // ---------------------------------------------
      // Get extracted text
      // ---------------------------------------------

      const documentText =
        document.extractedText || "";


      console.log(
        "📖 Document text:",
        documentText.length,
        "characters"
      );


      if (!documentText.trim()) {

        return res.status(400).json({
          message:
            "This document does not contain extracted text.",
        });
      }


      // ---------------------------------------------
      // Number of questions
      // ---------------------------------------------

      const questionCount = 10;

      // Generate in two smaller batches.
      const batchSize = 5;


      // ---------------------------------------------
      // RAG query
      // ---------------------------------------------

      const quizQuery = `
Create a quiz about the topic:

${topic.trim()}

Find study material related to this topic.

Focus on:
- definitions
- concepts
- classifications
- characteristics
- explanations
- important facts
- exam-oriented information
- terminology used in the study material
`;


      console.log(
        "🔎 Searching document for topic..."
      );


      // ---------------------------------------------
      // Retrieve only 1 relevant chunk
      // This keeps the local Qwen prompt smaller.
      // ---------------------------------------------

      const relevantContext =
        getRelevantContext(
          documentText,
          quizQuery,
          1
        );


      if (
        !relevantContext ||
        !relevantContext.trim()
      ) {

        return res.status(400).json({
          message:
            "Could not find relevant study material for this topic in the uploaded document.",
        });
      }


      console.log(
        "📚 Relevant quiz context prepared."
      );

      console.log(
        "📏 Context length:",
        relevantContext.length,
        "characters"
      );


      // ---------------------------------------------
      // Generate first 5 questions
      // ---------------------------------------------

      console.log(
        "🧩 Generating quiz batch 1/2..."
      );


      let allQuestions = [];


      const firstBatch =
        await generateQuizBatch({
          topic: topic.trim(),
          questionCount: batchSize,
          context: relevantContext,
          previousQuestions: [],
        });


      console.log(
        "✅ Batch 1 valid questions:",
        firstBatch.length
      );


      allQuestions =
        allQuestions.concat(firstBatch);


      // ---------------------------------------------
      // Generate second 5 questions
      // ---------------------------------------------

      console.log(
        "🧩 Generating quiz batch 2/2..."
      );


      const secondBatch =
        await generateQuizBatch({
          topic: topic.trim(),
          questionCount: batchSize,
          context: relevantContext,
          previousQuestions: allQuestions,
        });


      console.log(
        "✅ Batch 2 valid questions:",
        secondBatch.length
      );


      allQuestions =
        allQuestions.concat(secondBatch);


      // ---------------------------------------------
      // Remove duplicates
      // ---------------------------------------------

      allQuestions =
        removeDuplicateQuestions(
          allQuestions
        );


      console.log(
        "🧹 Questions after duplicate removal:",
        allQuestions.length
      );


// ---------------------------------------------
// Recovery loop
// Keep generating until we have 10 unique
// valid questions.
// ---------------------------------------------

let recoveryAttempts = 0;
const maxRecoveryAttempts = 6;

while (
  allQuestions.length < questionCount &&
  recoveryAttempts < maxRecoveryAttempts
) {

  recoveryAttempts++;

  const remaining =
    questionCount -
    allQuestions.length;

  console.log(
    `🔄 Recovery attempt ${recoveryAttempts}/${maxRecoveryAttempts}`
  );

  console.log(
    `📝 Questions still needed: ${remaining}`
  );


  const recoveryBatch =
    await generateQuizBatch({
      topic: topic.trim(),

      // Ask for a few extra questions.
      // This helps if some are duplicates.
      questionCount: 5,
      context: relevantContext,

      previousQuestions:
        allQuestions,
    });


  console.log(
    `📦 Recovery batch returned: ${recoveryBatch.length}`
  );


  allQuestions =
    allQuestions.concat(
      recoveryBatch
    );


  allQuestions =
    removeDuplicateQuestions(
      allQuestions
    );


  console.log(
    `🧹 Questions after recovery attempt ${recoveryAttempts}: ${allQuestions.length}`
  );
}


if (
  allQuestions.length <
  questionCount
) {

  console.error(
    `❌ Could only generate ${allQuestions.length}/${questionCount} unique questions after ${maxRecoveryAttempts} recovery attempts.`
  );

  return res.status(500).json({
    message:
      `The AI generated ${allQuestions.length} unique questions instead of ${questionCount}. Please try again.`,
  });
}
      // ---------------------------------------------
      // Final validation
      // ---------------------------------------------

      if (
        allQuestions.length <
        questionCount
      ) {

        return res.status(500).json({
          message:
            `The AI generated only ${allQuestions.length} valid questions. Please try the topic again.`,
        });
      }


      // ---------------------------------------------
      // Keep exactly 10
      // ---------------------------------------------

      const finalQuestions =
        allQuestions.slice(
          0,
          questionCount
        );


      console.log(
        "🎯 Final quiz questions:",
        finalQuestions.length
      );


      // ---------------------------------------------
      // Send response
      // ---------------------------------------------

      return res.status(200).json({

        message:
          "Document-based quiz generated successfully",

        topic:
          topic.trim(),

        documentId:
          document._id,

        documentName:
          document.originalName,

        questions:
          finalQuestions,

      });


    } catch (error) {

      console.error(
        "❌ Quiz generation error:",
        error
      );


      return res.status(500).json({

        message:
          "Quiz generation failed",

        error:
          error.message,

      });
    }
  }
);


// =====================================================
// SAVE QUIZ RESULT
// =====================================================

router.post(
  "/result",
  async (req, res) => {

    try {

      const {
        userId,
        documentId,
        topic,
        totalQuestions,
        correctAnswers,
        answers,
      } = req.body;


      // ---------------------------------------------
      // Validate
      // ---------------------------------------------

      if (!userId) {

        return res.status(400).json({
          message:
            "userId is required",
        });
      }


      if (!topic) {

        return res.status(400).json({
          message:
            "topic is required",
        });
      }


      if (
        totalQuestions === undefined ||
        totalQuestions === null ||
        Number(totalQuestions) <= 0
      ) {

        return res.status(400).json({
          message:
            "totalQuestions is required",
        });
      }


      // ---------------------------------------------
      // Calculate result on server
      // ---------------------------------------------

      const total =
        Number(totalQuestions);

      const correct =
        Math.max(
          0,
          Number(correctAnswers || 0)
        );


      const wrong =
        Math.max(
          0,
          total - correct
        );


      const score =
        correct;


      const accuracy =
        Number(
          (
            (correct / total) *
            100
          ).toFixed(2)
        );


      // ---------------------------------------------
      // Save
      // ---------------------------------------------

      const quizResult =
        await QuizResult.create({

          userId,

          documentId:
            documentId || null,

          topic:
            String(topic).trim(),

          totalQuestions:
            total,

          correctAnswers:
            correct,

          wrongAnswers:
            wrong,

          score,

          accuracy,

          answers:
            Array.isArray(answers)
              ? answers
              : [],

        });


      console.log(
        `📊 Quiz result saved: ${topic} - ${accuracy}%`
      );


      return res.status(201).json({

        message:
          "Quiz result saved successfully",

        result:
          quizResult,

      });


    } catch (error) {

      console.error(
        "❌ Quiz result error:",
        error
      );


      return res.status(500).json({

        message:
          "Failed to save quiz result",

        error:
          error.message,

      });
    }
  }
);


// =====================================================
// QUIZ HISTORY
// =====================================================

router.get(
  "/history/:userId",
  async (req, res) => {

    try {

      const {
        userId,
      } = req.params;


      const results =
        await QuizResult.find({
          userId,
        })
          .sort({
            completedAt: -1,
          })
          .limit(20);


      return res.status(200).json({

        message:
          "Quiz history fetched successfully",

        results,

      });


    } catch (error) {

      console.error(
        "❌ Quiz history error:",
        error
      );


      return res.status(500).json({

        message:
          "Failed to fetch quiz history",

        error:
          error.message,

      });
    }
  }
);


// =====================================================
// TOPIC PERFORMANCE
// =====================================================

router.get(
  "/performance/:userId/:topic",
  async (req, res) => {

    try {

      const {
        userId,
        topic,
      } = req.params;


      const results =
        await QuizResult.find({
          userId,
          topic,
        }).sort({
          completedAt: -1,
        });


      if (results.length === 0) {

        return res.status(200).json({

          message:
            "No quiz attempts found",

          topic,

          attempts:
            0,

          averageAccuracy:
            0,

          results: [],

        });
      }


      const totalAccuracy =
        results.reduce(
          (sum, result) =>
            sum +
            Number(
              result.accuracy || 0
            ),
          0
        );


      const averageAccuracy =
        Math.round(
          totalAccuracy /
          results.length
        );


      return res.status(200).json({

        message:
          "Topic performance fetched successfully",

        topic,

        attempts:
          results.length,

        averageAccuracy,

        results,

      });


    } catch (error) {

      console.error(
        "❌ Quiz performance error:",
        error
      );


      return res.status(500).json({

        message:
          "Failed to fetch quiz performance",

        error:
          error.message,

      });
    }
  }
);


module.exports = router;