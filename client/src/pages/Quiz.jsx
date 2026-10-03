import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001";

function Quiz() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [topic, setTopic] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // =====================================================
  // GET USER ID
  // =====================================================

  function getUserId() {
    const storageKeys = [
      "studyvaultUser",
      "user",
      "userInfo",
      "userId",
    ];

    for (const key of storageKeys) {
      const storedValue =
        localStorage.getItem(key);

      if (!storedValue) {
        continue;
      }

      try {
        const parsed =
          JSON.parse(storedValue);

        if (
          typeof parsed === "object" &&
          parsed !== null
        ) {
          const id =
            parsed?._id ||
            parsed?.id ||
            parsed?.userId ||
            parsed?.user?._id ||
            parsed?.user?.id ||
            parsed?.user?.userId;

          if (id) {
            return id;
          }
        }

        if (
          typeof parsed === "string" &&
          parsed
        ) {
          return parsed;
        }
      } catch {
        if (storedValue) {
          return storedValue;
        }
      }
    }

    return null;
  }

  // =====================================================
  // GENERATE QUIZ
  // =====================================================

  async function generateQuiz() {
    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    const userId = getUserId();

    if (!userId) {
      setError(
        "Please log in before generating a quiz."
      );
      return;
    }

    setLoading(true);
    setError("");
    setQuiz(null);
    setResult(null);
    setAnswers({});
    setCurrentQuestion(0);

    console.log(
      "🧠 Starting document-based quiz..."
    );

    console.log(
      "👤 User ID:",
      userId
    );

    console.log(
      "📚 Topic:",
      topic.trim()
    );

    try {
      const controller =
        new AbortController();

      const timeoutId =
  setTimeout(() => {
    controller.abort();
  }, 900000); // 15 minutes
      const response = await fetch(
        `${API}/api/quiz/generate`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            userId: userId,

            topic: topic.trim(),

            numberOfQuestions: 10,
          }),

          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      console.log(
        "📡 Quiz API status:",
        response.status
      );

      const responseText =
        await response.text();

      if (!responseText) {
        throw new Error(
          "The server returned an empty response."
        );
      }

      let data;

      try {
        data =
          JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          "❌ JSON parsing error:",
          parseError
        );

        console.error(
          "Server response:",
          responseText
        );

        throw new Error(
          "The server returned an invalid quiz response."
        );
      }

      console.log(
        "📦 Quiz response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to generate quiz."
        );
      }

      // =================================================
      // VALIDATE QUESTIONS
      // =================================================

      if (
        !data ||
        !Array.isArray(data.questions) ||
        data.questions.length === 0
      ) {
        throw new Error(
          "No questions were generated."
        );
      }

      // =================================================
      // CLEAN QUESTIONS
      // =================================================

      const validQuestions =
        data.questions
          .filter((question) => {
            return (
              question &&
              typeof question.question ===
                "string" &&
              question.question.trim() &&
              question.options &&
              typeof question.options ===
                "object" &&
              question.correctAnswer
            );
          })
          .map((question) => ({
            question:
              question.question.trim(),

            options: {
              A:
                question.options.A ||
                "",

              B:
                question.options.B ||
                "",

              C:
                question.options.C ||
                "",

              D:
                question.options.D ||
                "",
            },

            correctAnswer:
              String(
                question.correctAnswer
              )
                .trim()
                .toUpperCase()
                .charAt(0),
          }))
          .filter((question) => {
            return (
              ["A", "B", "C", "D"].includes(
                question.correctAnswer
              ) &&
              question.options.A &&
              question.options.B &&
              question.options.C &&
              question.options.D
            );
          });

      if (validQuestions.length < 10) {
        throw new Error(
          "The AI did not generate enough valid questions. Please try again."
        );
      }

      // =================================================
      // SAVE QUIZ
      // =================================================

      const quizData = {
        topic:
          data.topic ||
          topic.trim(),

        documentId:
          data.documentId || null,

        documentName:
          data.documentName || "",

        questions:
          validQuestions.slice(0, 10),
      };

      console.log(
        "📄 Quiz generated from:",
        quizData.documentName
      );

      console.log(
        "✅ Questions:",
        quizData.questions.length
      );

      setQuiz(quizData);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "❌ Quiz generation error:",
        err
      );

     if (
  err.name ===
  "AbortError"
) {
  setError(
    "Quiz generation is taking longer than expected. Please wait and try again."
  );
}else {
        setError(
          err.message ||
            "Unable to generate quiz."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // SELECT ANSWER
  // =====================================================

  function selectAnswer(
    questionIndex,
    answer
  ) {
    setAnswers((previous) => ({
      ...previous,

      [questionIndex]: answer,
    }));
  }

  // =====================================================
  // NEXT QUESTION
  // =====================================================

  function nextQuestion() {
    if (
      quiz &&
      currentQuestion <
        quiz.questions.length - 1
    ) {
      setCurrentQuestion(
        currentQuestion + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  // =====================================================
  // PREVIOUS QUESTION
  // =====================================================

  function previousQuestion() {
    if (currentQuestion > 0) {
      setCurrentQuestion(
        currentQuestion - 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  // =====================================================
  // SUBMIT QUIZ
  // =====================================================

  async function submitQuiz() {
    if (!quiz) {
      return;
    }

    const unanswered =
      quiz.questions.filter(
        (_, index) =>
          !answers[index]
      ).length;

    if (unanswered > 0) {
      setError(
        `Please answer all questions. ${unanswered} question(s) remaining.`
      );

      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const userId =
        getUserId();

      if (!userId) {
        throw new Error(
          "Please log in before submitting the quiz."
        );
      }

      let correctAnswers = 0;

      const answerDetails =
        quiz.questions.map(
          (question, index) => {
            const selectedAnswer =
              answers[index];

            const isCorrect =
              selectedAnswer ===
              question.correctAnswer;

            if (isCorrect) {
              correctAnswers++;
            }

            return {
              question:
                question.question,

              selectedAnswer,

              correctAnswer:
                question.correctAnswer,

              isCorrect,
            };
          }
        );

      const totalQuestions =
        quiz.questions.length;

      const wrongAnswers =
        totalQuestions -
        correctAnswers;

      const score =
        correctAnswers;

      const accuracy =
        Math.round(
          (correctAnswers /
            totalQuestions) *
            100
        );

      console.log(
        "📊 Quiz result:",
        {
          totalQuestions,
          correctAnswers,
          wrongAnswers,
          accuracy,
        }
      );

      // =================================================
      // SAVE RESULT
      // =================================================

      const response =
        await fetch(
          `${API}/api/quiz/result`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              userId,

              documentId:
                quiz.documentId ||
                null,

              topic:
                quiz.topic,

              totalQuestions,

              correctAnswers,

              wrongAnswers,

              score,

              accuracy,

              answers:
                answerDetails,
            }),
          }
        );

      const responseText =
        await response.text();

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        console.warn(
          "Could not parse result response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to save quiz result."
        );
      }

      console.log(
        "✅ Quiz result saved."
      );

      // =================================================
      // SHOW RESULT
      // =================================================

      setResult({
        totalQuestions,

        correctAnswers,

        wrongAnswers,

        score,

        accuracy,

        answers:
          answerDetails,
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "❌ Quiz submission error:",
        err
      );

      setError(
        err.message ||
          "Unable to submit quiz."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // =====================================================
  // RESTART QUIZ
  // =====================================================

  function restartQuiz() {
    setQuiz(null);
    setAnswers({});
    setCurrentQuestion(0);
    setResult(null);
    setError("");
  }

  // =====================================================
  // CURRENT QUESTION
  // =====================================================

  const current =
    quiz?.questions?.[
      currentQuestion
    ];

  // =====================================================
  // STYLES
  // =====================================================

  const cardStyle = {
    background: "#ffffff",

    borderRadius: "18px",

    padding: "28px",

    boxShadow:
      "0 5px 20px rgba(0,0,0,0.06)",
  };

  const optionStyle = (
    selected
  ) => ({
    width: "100%",

    textAlign: "left",

    padding: "16px",

    marginTop: "12px",

    borderRadius: "12px",

    border: selected
      ? "2px solid #4f46e5"
      : "1px solid #dbe0f0",

    background: selected
      ? "#eef2ff"
      : "#ffffff",

    cursor: "pointer",

    fontSize: "16px",

    color: "#20243a",

    transition:
      "all 0.2s ease",
  });

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",

        background:
          "#f4f6ff",

        padding: "35px",

        fontFamily:
          "Arial, sans-serif",

        color: "#20243a",
      }}
    >
      <div
        style={{
          maxWidth: "900px",

          margin: "auto",
        }}
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div style={cardStyle}>
          <h1
            style={{
              marginTop: 0,

              fontSize: "36px",
            }}
          >
            📝 AI Practice Quiz
          </h1>

          <p
            style={{
              fontSize: "17px",

              lineHeight: "1.6",
            }}
          >
            Test your understanding
            using AI-generated
            questions based on your
            uploaded study material.
          </p>

          <button
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
            style={{
              padding:
                "11px 20px",

              border: "none",

              borderRadius:
                "10px",

              background:
                "#4f46e5",

              color: "white",

              cursor: "pointer",

              fontWeight: "600",
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* ================================================= */}
        {/* TOPIC SELECTION */}
        {/* ================================================= */}

        {!quiz && !result && (
          <div
            style={{
              ...cardStyle,

              marginTop: "25px",
            }}
          >
            <h2>
              🎯 Choose a Topic
            </h2>

            <p>
              Enter a topic from
              your uploaded study
              material.
            </p>

            <p
              style={{
                fontSize: "14px",

                color: "#64748b",

                background:
                  "#f8fafc",

                padding: "12px",

                borderRadius: "10px",

                lineHeight: "1.5",
              }}
            >
              📚 The quiz will use
              relevant content from
              your latest uploaded
              document.
            </p>

            <input
              type="text"
              value={topic}
              onChange={(e) =>
                setTopic(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !loading
                ) {
                  generateQuiz();
                }
              }}
              disabled={loading}
              placeholder="Example: Classification of Digital Data"
              style={{
                width: "100%",

                boxSizing:
                  "border-box",

                padding: "15px",

                borderRadius:
                  "10px",

                border:
                  "1px solid #cbd5e1",

                fontSize: "16px",

                outline: "none",

                marginTop: "10px",
              }}
            />

            <button
              onClick={
                generateQuiz
              }
              disabled={loading}
              style={{
                marginTop: "18px",

                padding:
                  "13px 24px",

                border: "none",

                borderRadius:
                  "10px",

                background: loading
                  ? "#a5b4fc"
                  : "#4f46e5",

                color: "white",

                cursor: loading
                  ? "not-allowed"
                  : "pointer",

                fontSize: "16px",

                fontWeight: "600",
              }}
            >
              {loading
                ? "🤖 Generating..."
                : "✨ Generate Quiz"}
            </button>

            {loading && (
              <p
                style={{
                  marginTop:
                    "15px",

                  color:
                    "#4f46e5",

                  fontWeight:
                    "600",

                  lineHeight:
                    "1.5",
                }}
              >
                🤖 Qwen is searching
                your study material
                and preparing the
                questions...
              </p>
            )}
          </div>
        )}

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div
            style={{
              ...cardStyle,

              marginTop: "20px",

              background:
                "#fff7f7",

              border:
                "1px solid #fecaca",
            }}
          >
            <p
              style={{
                margin: 0,

                color:
                  "#dc2626",

                fontWeight:
                  "600",

                lineHeight:
                  "1.6",
              }}
            >
              ❌ {error}
            </p>
          </div>
        )}

        {/* ================================================= */}
        {/* QUIZ */}
        {/* ================================================= */}

        {quiz &&
          !result &&
          current && (
            <div
              style={{
                ...cardStyle,

                marginTop: "25px",
              }}
            >
              {/* Document information */}

              {quiz.documentName && (
                <div
                  style={{
                    background:
                      "#f0fdf4",

                    border:
                      "1px solid #bbf7d0",

                    padding: "12px 15px",

                    borderRadius:
                      "10px",

                    marginBottom:
                      "20px",

                    color:
                      "#166534",

                    fontSize: "14px",
                  }}
                >
                  📚 Based on:{" "}
                  <strong>
                    {
                      quiz.documentName
                    }
                  </strong>
                </div>
              )}

              {/* Quiz Header */}

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  gap: "15px",

                  flexWrap:
                    "wrap",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                    }}
                  >
                    {quiz.topic}
                  </h2>

                  <p>
                    Question{" "}
                    {currentQuestion +
                      1}{" "}
                    of{" "}
                    {
                      quiz.questions
                        .length
                    }
                  </p>
                </div>

                <div
                  style={{
                    background:
                      "#eef2ff",

                    padding:
                      "10px 15px",

                    borderRadius:
                      "10px",

                    color:
                      "#4f46e5",

                    fontWeight:
                      "600",
                  }}
                >
                  {
                    Object.keys(
                      answers
                    ).length
                  }{" "}
                  /{" "}
                  {
                    quiz.questions
                      .length
                  }{" "}
                  answered
                </div>
              </div>

              {/* Progress */}

              <div
                style={{
                  width: "100%",

                  height: "8px",

                  background:
                    "#e5e7eb",

                  borderRadius:
                    "20px",

                  margin:
                    "20px 0 30px",

                  overflow:
                    "hidden",
                }}
              >
                <div
                  style={{
                    width: `${
                      ((currentQuestion +
                        1) /
                        quiz
                          .questions
                          .length) *
                      100
                    }%`,

                    height: "100%",

                    background:
                      "#4f46e5",

                    transition:
                      "width 0.3s",
                  }}
                />
              </div>

              {/* Question */}

              <h2
                style={{
                  fontSize: "22px",

                  lineHeight: "1.5",
                }}
              >
                {currentQuestion +
                  1}
                . {current.question}
              </h2>

              {/* Options */}

              <div
                style={{
                  marginTop:
                    "20px",
                }}
              >
                {[
                  "A",
                  "B",
                  "C",
                  "D",
                ].map(
                  (letter) => (
                    <button
                      key={letter}
                      onClick={() =>
                        selectAnswer(
                          currentQuestion,
                          letter
                        )
                      }
                      style={optionStyle(
                        answers[
                          currentQuestion
                        ] === letter
                      )}
                    >
                      <strong>
                        {letter}.
                      </strong>{" "}
                      {
                        current.options[
                          letter
                        ]
                      }
                    </button>
                  )
                )}
              </div>

              {/* Navigation */}

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  marginTop:
                    "30px",

                  gap: "15px",
                }}
              >
                <button
                  onClick={
                    previousQuestion
                  }
                  disabled={
                    currentQuestion ===
                    0
                  }
                  style={{
                    padding:
                      "12px 20px",

                    border:
                      "1px solid #cbd5e1",

                    borderRadius:
                      "10px",

                    background:
                      currentQuestion ===
                      0
                        ? "#f1f5f9"
                        : "#ffffff",

                    cursor:
                      currentQuestion ===
                      0
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  ← Previous
                </button>

                {currentQuestion <
                quiz.questions
                  .length -
                  1 ? (
                  <button
                    onClick={
                      nextQuestion
                    }
                    disabled={
                      !answers[
                        currentQuestion
                      ]
                    }
                    style={{
                      padding:
                        "12px 20px",

                      border: "none",

                      borderRadius:
                        "10px",

                      background:
                        answers[
                          currentQuestion
                        ]
                          ? "#4f46e5"
                          : "#c7d2fe",

                      color:
                        "white",

                      cursor:
                        answers[
                          currentQuestion
                        ]
                          ? "pointer"
                          : "not-allowed",

                      fontWeight:
                        "600",
                    }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={
                      submitQuiz
                    }
                    disabled={
                      submitting
                    }
                    style={{
                      padding:
                        "12px 20px",

                      border: "none",

                      borderRadius:
                        "10px",

                      background:
                        submitting
                          ? "#a5b4fc"
                          : "#16a34a",

                      color:
                        "white",

                      cursor:
                        submitting
                          ? "not-allowed"
                          : "pointer",

                      fontWeight:
                        "600",
                    }}
                  >
                    {submitting
                      ? "Saving..."
                      : "✓ Submit Quiz"}
                  </button>
                )}
              </div>
            </div>
          )}

        {/* ================================================= */}
        {/* RESULT */}
        {/* ================================================= */}

        {result && (
          <div
            style={{
              ...cardStyle,

              marginTop: "25px",

              textAlign:
                "center",
            }}
          >
            <div
              style={{
                fontSize: "60px",
              }}
            >
              {result.accuracy >=
              80
                ? "🎉"
                : result.accuracy >=
                  60
                ? "👍"
                : "📚"}
            </div>

            <h1>
              Quiz Completed!
            </h1>

            <p
              style={{
                fontSize: "20px",
              }}
            >
              Topic:{" "}
              <strong>
                {quiz.topic}
              </strong>
            </p>

            {quiz.documentName && (
              <p
                style={{
                  color:
                    "#64748b",
                }}
              >
                📚 Source:{" "}
                <strong>
                  {
                    quiz.documentName
                  }
                </strong>
              </p>
            )}

            {/* Score cards */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(160px, 1fr))",

                gap: "15px",

                marginTop: "30px",
              }}
            >
              <div
                style={{
                  background:
                    "#eef2ff",

                  padding: "20px",

                  borderRadius:
                    "14px",
                }}
              >
                <h2>
                  {result.score}/
                  {
                    result.totalQuestions
                  }
                </h2>

                <p>
                  Score
                </p>
              </div>

              <div
                style={{
                  background:
                    "#ecfdf5",

                  padding: "20px",

                  borderRadius:
                    "14px",
                }}
              >
                <h2>
                  {
                    result.correctAnswers
                  }
                </h2>

                <p>
                  Correct
                </p>
              </div>

              <div
                style={{
                  background:
                    "#fef2f2",

                  padding: "20px",

                  borderRadius:
                    "14px",
                }}
              >
                <h2>
                  {
                    result.wrongAnswers
                  }
                </h2>

                <p>
                  Wrong
                </p>
              </div>

              <div
                style={{
                  background:
                    "#fff7ed",

                  padding: "20px",

                  borderRadius:
                    "14px",
                }}
              >
                <h2>
                  {result.accuracy}%
                </h2>

                <p>
                  Accuracy
                </p>
              </div>
            </div>

            {/* Performance message */}

            <div
              style={{
                marginTop:
                  "25px",

                padding: "18px",

                borderRadius:
                  "12px",

                background:
                  result.accuracy >=
                  80
                    ? "#f0fdf4"
                    : result.accuracy >=
                      60
                    ? "#eff6ff"
                    : "#fff7ed",
              }}
            >
              {result.accuracy >=
              80 ? (
                <p>
                  🎉 Excellent! You
                  have a strong
                  understanding of
                  this topic.
                </p>
              ) : result.accuracy >=
                60 ? (
                <p>
                  👍 Good attempt!
                  Review the questions
                  you got wrong.
                </p>
              ) : (
                <p>
                  📚 This topic may
                  need more revision.
                  Review your study
                  material and try
                  another quiz.
                </p>
              )}
            </div>

            {/* Answer Review */}

            <div
              style={{
                marginTop:
                  "35px",

                textAlign:
                  "left",
              }}
            >
              <h2>
                📋 Answer Review
              </h2>

              {result.answers.map(
                (
                  answer,
                  index
                ) => (
                  <div
                    key={index}
                    style={{
                      padding:
                        "18px",

                      marginTop:
                        "12px",

                      borderRadius:
                        "12px",

                      background:
                        answer.isCorrect
                          ? "#f0fdf4"
                          : "#fff7f7",

                      border:
                        answer.isCorrect
                          ? "1px solid #bbf7d0"
                          : "1px solid #fecaca",
                    }}
                  >
                    <strong>
                      {index + 1}.{" "}
                      {
                        answer.question
                      }
                    </strong>

                    <p>
                      Your answer:{" "}
                      <strong>
                        {
                          answer.selectedAnswer
                        }
                      </strong>
                    </p>

                    <p>
                      Correct answer:{" "}
                      <strong>
                        {
                          answer.correctAnswer
                        }
                      </strong>
                    </p>

                    <p
                      style={{
                        color:
                          answer.isCorrect
                            ? "#15803d"
                            : "#dc2626",

                        fontWeight:
                          "600",
                      }}
                    >
                      {answer.isCorrect
                        ? "✓ Correct"
                        : "✗ Incorrect"}
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Buttons */}

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "center",

                gap: "15px",

                marginTop:
                  "30px",

                flexWrap:
                  "wrap",
              }}
            >
              <button
                onClick={
                  restartQuiz
                }
                style={{
                  padding:
                    "12px 22px",

                  border: "none",

                  borderRadius:
                    "10px",

                  background:
                    "#4f46e5",

                  color: "white",

                  cursor:
                    "pointer",

                  fontWeight:
                    "600",
                }}
              >
                🔄 Take Another Quiz
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/topic-progress"
                  )
                }
                style={{
                  padding:
                    "12px 22px",

                  border:
                    "1px solid #cbd5e1",

                  borderRadius:
                    "10px",

                  background:
                    "white",

                  cursor:
                    "pointer",

                  fontWeight:
                    "600",
                }}
              >
                🎯 View Topic Progress
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/dashboard"
                  )
                }
                style={{
                  padding:
                    "12px 22px",

                  border:
                    "1px solid #cbd5e1",

                  borderRadius:
                    "10px",

                  background:
                    "white",

                  cursor:
                    "pointer",

                  fontWeight:
                    "600",
                }}
              >
                🏠 Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Quiz;