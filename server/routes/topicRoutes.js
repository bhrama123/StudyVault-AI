const express = require("express");

const Document = require("../models/Document");

const LearningActivity = require("../models/LearningActivity");

const QuizResult = require("../models/QuizResult");

const router = express.Router();

// =====================================================
// IGNORED TOPICS
// =====================================================

const ignoredTopics = new Set([
  "NORMAL",
  "OTHER",
  "VOLUME",
  "VELOCITY",
  "HEAD",
  "BODY",
  "HTML",
  "BGCOLOR",
  "FFFFFF",
  "CHAPTER",
  "PAGE",
  "PAGES",
  "CONTENTS",
  "INDEX",
  "REFERENCES",
  "REFERENCE",
  "FIGURE",
  "FIGURES",
  "TABLE",
  "TABLES",
  "SOURCE",
  "SOURCES",
  "MODULE",
  "NULL",
  "NOT",
  "PRIMARY",
  "KEY",
  "FOREIGN",
  "CONSTRAINT",
  "CONSTRAINTS",
  "VARCHAR",
  "CHAR",
  "INT",
  "INTEGER",
  "DATE",
  "DECIMAL",
  "FLOAT",
  "DOUBLE",
  "BOOLEAN",
  "NAME",
  "DESIGNATION",
  "DEPARTMENT",
  "CONTACT",
  "CONTACTNO",
  "EMPLOYEE",
  "EMPLOYEES",
  "EMPNO",
  "EMPNAME",
  "DEPTNO",
]);

// =====================================================
// DATABASE / SQL PATTERNS
// =====================================================

const databasePatterns = [
  /\bVARCHAR\s*\(\s*\d+\s*\)/i,
  /\bCHAR\s*\(\s*\d+\s*\)/i,
  /\bDECIMAL\s*\(/i,
  /\bFLOAT\b/i,
  /\bDOUBLE\b/i,
  /\bINTEGER\b/i,
  /\bINT\b/i,
  /\bDATE\b/i,
  /\bBOOLEAN\b/i,
  /\bNOT\s+NULL\b/i,
  /\bPRIMARY\s+KEY\b/i,
  /\bFOREIGN\s+KEY\b/i,
  /\bCREATE\s+TABLE\b/i,
  /\bALTER\s+TABLE\b/i,
  /\bDROP\s+TABLE\b/i,
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+\w+\s+SET\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bSELECT\s+.+\s+FROM\b/i,
  /\bEMPNAME\b/i,
  /\bEMPNO\b/i,
  /\bDEPTNO\b/i,
  /\bCONTACTNO\b/i,
  /\bDESIGNATION\b/i,
];

// =====================================================
// COMMON SENTENCE WORDS
// =====================================================

const sentenceWords = new Set([
  "this",
  "that",
  "these",
  "those",
  "which",
  "where",
  "when",
  "what",
  "why",
  "how",
  "there",
  "their",
  "they",
  "them",
  "is",
  "are",
  "was",
  "were",
  "has",
  "have",
  "had",
  "can",
  "could",
  "will",
  "would",
  "should",
  "may",
  "might",
  "used",
  "use",
  "using",
  "provides",
  "contains",
  "consists",
  "means",
  "refers",
  "defined",
  "called",
  "helps",
  "allows",
  "include",
  "includes",
  "following",
]);

// =====================================================
// CLEAN TOPIC
// =====================================================

function cleanTopic(topic) {
  if (!topic) {
    return "";
  }

  return topic
    // Remove HTML tags
    .replace(/<[^>]*>/g, " ")

    // Remove HTML entities
    .replace(/&[a-zA-Z0-9#]+;/g, " ")

    // Remove HTML attributes
    .replace(
      /\b(BGCOLOR|COLOR|FONT|SIZE|FACE|STYLE)\b/gi,
      " "
    )

    // Remove numbering such as 1.1, 1.2.3
    .replace(
      /^\s*\d+(?:\.\d+)+[\s.)-]+/,
      ""
    )

    // Remove bullet characters
    .replace(
      /^[•●▪◦■□◆◇▶►→]+\s*/,
      ""
    )

    // Normalize spaces
    .replace(/\s+/g, " ")

    // Remove punctuation from beginning/end
    .replace(
      /^[\s\-–—:;,.]+|[\s\-–—:;,.]+$/g,
      ""
    )

    .trim();
}

// =====================================================
// NORMALIZE TOPIC
// =====================================================

function normalizeTopic(topic) {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// =====================================================
// DATABASE CONTENT CHECK
// =====================================================

function isDatabaseContent(topic) {
  for (const pattern of databasePatterns) {
    if (pattern.test(topic)) {
      return true;
    }
  }

  return false;
}

// =====================================================
// NUMBERED HEADING CHECK
// =====================================================

function isNumberedHeading(line) {
  return /^\s*\d+(?:\.\d+)+[\s.)-]+[A-Za-z]/.test(line);
}

// =====================================================
// UPPERCASE HEADING CHECK
// =====================================================

function isUppercaseHeading(topic) {
  const letters = topic.replace(
    /[^A-Za-z]/g,
    ""
  );

  // Too short to be a meaningful heading
  if (letters.length < 8) {
    return false;
  }

  // Must actually be uppercase
  if (letters !== letters.toUpperCase()) {
    return false;
  }

  const words = topic
    .split(/\s+/)
    .filter(Boolean);

  // Heading should have at least 2 words
  if (words.length < 2) {
    return false;
  }

  // Avoid accepting huge OCR paragraphs
  if (words.length > 8) {
    return false;
  }

  return true;
}

// =====================================================
// SENTENCE-LIKE CONTENT CHECK
// =====================================================

function looksLikeSentence(topic) {
  const lower = topic.toLowerCase();

  // Strong sentence indicators
  if (
    topic.includes(".") ||
    topic.includes("?") ||
    topic.includes("=")
  ) {
    return true;
  }

  const words = lower.split(/\s+/);

  // Long text is probably paragraph/body text
  if (words.length > 10) {
    return true;
  }

  let sentenceWordCount = 0;

  for (const word of words) {
    if (sentenceWords.has(word)) {
      sentenceWordCount++;
    }
  }

  if (sentenceWordCount >= 2) {
    return true;
  }

  return false;
}

// =====================================================
// VALID TOPIC CHECK
// =====================================================

function isValidTopic(topic, originalLine) {
  if (!topic) {
    return false;
  }

  // -----------------------------------------------
  // Length
  // -----------------------------------------------

  if (
    topic.length < 5 ||
    topic.length > 90
  ) {
    return false;
  }

  // -----------------------------------------------
  // Ignored exact words
  // -----------------------------------------------

  if (
    ignoredTopics.has(
      topic.toUpperCase()
    )
  ) {
    return false;
  }

  // -----------------------------------------------
  // HTML
  // -----------------------------------------------

  if (
    /<[^>]+>/.test(originalLine)
  ) {
    return false;
  }

  if (
    /BGCOLOR|FONT-SIZE|TEXT-ALIGN|BACKGROUND-COLOR/i.test(
      topic
    )
  ) {
    return false;
  }

  // -----------------------------------------------
  // URLs
  // -----------------------------------------------

  if (
    /https?:\/\//i.test(topic) ||
    /www\./i.test(topic)
  ) {
    return false;
  }

  // -----------------------------------------------
  // Database / SQL
  // -----------------------------------------------

  if (
    isDatabaseContent(topic)
  ) {
    return false;
  }

  // -----------------------------------------------
  // Sentence-like text
  // -----------------------------------------------

  if (
    looksLikeSentence(topic)
  ) {
    return false;
  }

  // -----------------------------------------------
  // Colon usually indicates body text
  // -----------------------------------------------

  if (
    originalLine.includes(":")
  ) {
    return false;
  }

  // -----------------------------------------------
  // Too many numbers
  // -----------------------------------------------

  const digitCount =
    (topic.match(/\d/g) || []).length;

  if (digitCount > 3) {
    return false;
  }

  // -----------------------------------------------
  // Long numeric IDs / phone numbers
  // -----------------------------------------------

  const onlyDigits =
    topic.replace(/\D/g, "");

  if (onlyDigits.length >= 7) {
    return false;
  }

  // -----------------------------------------------
  // Too many special characters
  // -----------------------------------------------

  const specialCharacters =
    topic.replace(
      /[A-Za-z0-9\s]/g,
      ""
    ).length;

  if (
    specialCharacters >
    topic.length * 0.20
  ) {
    return false;
  }

  // -----------------------------------------------
  // Must contain enough letters
  // -----------------------------------------------

  const letters =
    topic.replace(
      /[^A-Za-z]/g,
      ""
    );

  if (letters.length < 5) {
    return false;
  }

  // -----------------------------------------------
  // Single-word topics are ignored
  // -----------------------------------------------

  const words =
    topic.split(/\s+/);

  if (words.length === 1) {
    return false;
  }

  // -----------------------------------------------
  // Sample employee information
  // -----------------------------------------------

  if (
    /\b(Software Engineer|Consultant|Manager|Developer|Employee)\b/i.test(
      topic
    )
  ) {
    return false;
  }

  // -----------------------------------------------
  // Heading validation
  // -----------------------------------------------

  const numbered =
    isNumberedHeading(
      originalLine
    );

  const uppercase =
    isUppercaseHeading(topic);

  // Only numbered headings or
  // genuine uppercase headings
  // are accepted.

  if (
    !numbered &&
    !uppercase
  ) {
    return false;
  }

  return true;
}

// =====================================================
// EXTRACT TOPICS FROM DOCUMENT
// =====================================================

function extractTopicsFromText(text) {
  if (!text) {
    return [];
  }

  const lines =
    text
      .split("\n")
      .map(
        (line) => line.trim()
      )
      .filter(Boolean);

  const topics = [];

  const seenTopics =
    new Set();

  for (
    const originalLine of lines
  ) {
    // ---------------------------------------------
    // Ignore extremely long OCR lines
    // ---------------------------------------------

    if (
      originalLine.length > 120
    ) {
      continue;
    }

    // ---------------------------------------------
    // Ignore very short lines
    // ---------------------------------------------

    if (
      originalLine.length < 4
    ) {
      continue;
    }

    // ---------------------------------------------
    // Detect numbered heading
    // ---------------------------------------------

    const numbered =
      isNumberedHeading(
        originalLine
      );

    // ---------------------------------------------
    // Clean line
    // ---------------------------------------------

    const cleaned =
      cleanTopic(
        originalLine
      );

    if (!cleaned) {
      continue;
    }

    // ---------------------------------------------
    // Validate
    // ---------------------------------------------

    if (
      !isValidTopic(
        cleaned,
        originalLine
      )
    ) {
      continue;
    }

    // ---------------------------------------------
    // Check heading
    // ---------------------------------------------

    const uppercase =
      isUppercaseHeading(
        cleaned
      );

    if (
      !numbered &&
      !uppercase
    ) {
      continue;
    }

    // ---------------------------------------------
    // Normalize
    // ---------------------------------------------

    const normalized =
      normalizeTopic(
        cleaned
      );

    if (!normalized) {
      continue;
    }

    // ---------------------------------------------
    // Remove duplicates
    // ---------------------------------------------

    if (
      seenTopics.has(
        normalized
      )
    ) {
      continue;
    }

    seenTopics.add(
      normalized
    );

    topics.push(
      cleaned
    );
  }

  return topics;
}

// =====================================================
// FIND RELATED TOPICS
// =====================================================

function findRelatedTopics(
  question,
  topics
) {
  if (
    !question ||
    !topics ||
    topics.length === 0
  ) {
    return [];
  }

  const questionText =
    question
      .toLowerCase()
      .replace(
        /[^a-z0-9\s]/g,
        " "
      );

  return topics.filter(
    (topic) => {
      const words =
        topic
          .toLowerCase()
          .replace(
            /[^a-z0-9\s]/g,
            " "
          )
          .split(/\s+/)
          .filter(
            (word) =>
              word.length > 3
          );

      if (
        words.length === 0
      ) {
        return false;
      }

      const matchedWords =
        words.filter(
          (word) =>
            questionText.includes(
              word
            )
        );

      return (
        matchedWords.length >=
        Math.max(
          1,
          Math.ceil(
            words.length * 0.4
          )
        )
      );
    }
  );
}

// =====================================================
// GET TOPIC ANALYSIS
// =====================================================

router.get(
  "/:userId",
  async (req, res) => {
    try {
      const {
        userId,
      } = req.params;

      console.log(
        "🧠 Analyzing topics for user:",
        userId
      );

      // =============================================
      // GET DOCUMENTS
      // =============================================

      const documents =
        await Document.find({
          userId,
        });

      console.log(
        "📄 Documents available:",
        documents.length
      );

      // =============================================
      // GET LEARNING ACTIVITIES
      // =============================================

      const activities =
        await LearningActivity.find({
          userId,
        }).sort({
          createdAt: -1,
        });

      console.log(
        "📊 Activities available:",
        activities.length
      );

      // =============================================
      // GET QUIZ RESULTS
      // =============================================

      const quizResults =
        await QuizResult.find({
          userId,
        }).sort({
          completedAt: -1,
        });

      console.log(
        "📝 Quiz results available:",
        quizResults.length
      );

      // =============================================
      // TOPIC MAP
      // =============================================

      const topicMap =
        new Map();

      // =============================================
      // PROCESS DOCUMENTS
      // =============================================

      for (
        const document of documents
      ) {
        const documentTopics =
          extractTopicsFromText(
            document.extractedText
          );

        console.log(
          `📚 ${document.originalName}: ${documentTopics.length} clean topics found`
        );

        for (
          const topic of documentTopics
        ) {
          const normalized =
            normalizeTopic(
              topic
            );

          if (!normalized) {
            continue;
          }

          if (
            !topicMap.has(
              normalized
            )
          ) {
            topicMap.set(
              normalized,
              {
                topic,

                documents: 0,

                aiQuestions: 0,

                activities: 0,

                score: 0,

                // Quiz performance
                quizAttempts: 0,

                quizAccuracyTotal: 0,

                bestQuizAccuracy: 0,
              }
            );
          }

          const topicData =
            topicMap.get(
              normalized
            );

          topicData.documents += 1;
        }
      }

      // =============================================
      // PROCESS AI QUESTIONS
      // =============================================

      for (
        const activity of activities
      ) {
        if (
          activity.activityType !==
          "ask_ai"
        ) {
          continue;
        }

        const question =
          activity.description ||
          "";

        for (
          const topicData of topicMap.values()
        ) {
          const related =
            findRelatedTopics(
              question,
              [topicData.topic]
            );

          if (
            related.length > 0
          ) {
            topicData.aiQuestions +=
              1;

            topicData.activities +=
              1;

            topicData.score +=
              2;
          }
        }
      }

      // =============================================
      // PROCESS QUIZ PERFORMANCE
      // =============================================

      for (
        const quiz of quizResults
      ) {
        const quizTopic =
          quiz.topic || "";

        if (
          !quizTopic.trim()
        ) {
          continue;
        }

        for (
          const topicData of topicMap.values()
        ) {
          const related =
            findRelatedTopics(
              quizTopic,
              [topicData.topic]
            );

          if (
            related.length > 0
          ) {
            const accuracy =
              Number(
                quiz.accuracy
              ) || 0;

            topicData.quizAttempts +=
              1;

            topicData.quizAccuracyTotal +=
              accuracy;

            topicData.bestQuizAccuracy =
              Math.max(
                topicData.bestQuizAccuracy,
                accuracy
              );

            // Low quiz accuracy gives
            // this topic additional
            // attention weight.
            if (
              accuracy < 50
            ) {
              topicData.score +=
                5;
            }
          }
        }
      }

      // =============================================
      // CONVERT MAP TO ARRAY
      // =============================================

      const topicAnalysis =
        Array.from(
          topicMap.values()
        );

      // =============================================
      // SORT TOPICS
      // =============================================

      topicAnalysis.sort(
        (a, b) => {
          if (
            b.score !==
            a.score
          ) {
            return (
              b.score -
              a.score
            );
          }

          return (
            b.documents -
            a.documents
          );
        }
      );

      // =============================================
      // TOPICS NEEDING ATTENTION
      // =============================================

      const needsAttention =
        topicAnalysis
          .filter(
            (topic) =>
              topic.aiQuestions > 0 ||
              (topic.quizAttempts || 0) > 0
          )
          .slice(0, 10);

      // =============================================
      // WEAK TOPICS
      // =============================================

      // A topic is considered a potential
      // weak topic only when:
      //
      // 1. The user has attempted a quiz.
      // 2. Average quiz accuracy is below 50%.
      //
      // This is based on quiz performance,
      // not simply asking AI questions.

      const weakTopics =
        needsAttention
          .filter(
            (topic) =>
              (topic.quizAttempts || 0) > 0 &&
              topic.quizAccuracyTotal /
                topic.quizAttempts <
                50
          )
          .map(
            (topic) => ({
              topic:
                topic.topic,

              aiQuestions:
                topic.aiQuestions,

              activities:
                topic.activities,

              score:
                topic.score,

              documents:
                topic.documents,

              quizAttempts:
                topic.quizAttempts,

              quizAccuracy:
                Math.round(
                  topic.quizAccuracyTotal /
                    topic.quizAttempts
                ),

              bestQuizAccuracy:
                topic.bestQuizAccuracy,

              reason:
                "Quiz accuracy is below 50%. Review this topic and try the quiz again.",
            })
          );

      // =============================================
      // OTHER DETECTED TOPICS
      // =============================================

      const wellExplored =
        topicAnalysis
          .filter(
            (topic) =>
              topic.aiQuestions === 0 &&
              (topic.quizAttempts || 0) === 0
          )
          .slice(0, 10);

      // =============================================
      // LOG RESULTS
      // =============================================

      console.log(
        "🧠 Clean topics detected:",
        topicAnalysis.length
      );

      console.log(
        "⚠️ Topics needing attention:",
        needsAttention.length
      );

      console.log(
        "🧠 Weak topics:",
        weakTopics.length
      );

      console.log(
        "✅ Well explored topics:",
        wellExplored.length
      );

      // =============================================
      // SEND RESPONSE
      // =============================================

      res.status(200).json({
        message:
          "Topic analysis generated successfully",

        totalTopics:
          topicAnalysis.length,

        topics:
          topicAnalysis,

        needsAttention,

        weakTopics,

        wellExplored,
      });

    } catch (error) {
      console.error(
        "❌ Topic analysis error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to analyze learning topics",

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