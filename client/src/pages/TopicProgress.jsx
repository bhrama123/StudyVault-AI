import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001";

function TopicProgress() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTopics() {
      try {
        const storedUser = JSON.parse(
          localStorage.getItem("studyvaultUser") || "null"
        );

        const userId =
          storedUser?._id ||
          storedUser?.id ||
          storedUser?.userId;

        if (!userId) {
          setError("Please log in to view your topics.");
          return;
        }

        console.log("🔑 Topic Progress userId:", userId);

        const response = await fetch(
          `${API}/api/topics/${userId}`
        );

        if (!response.ok) {
          throw new Error(
            "Unable to fetch topic analysis."
          );
        }

        const result = await response.json();

        console.log("📊 Topic Progress data:", result);

        setData(result);
      } catch (err) {
        console.error("Topic loading error:", err);

        setError(
          err.message ||
            "Something went wrong while loading topics."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTopics();
  }, []);

  // =====================================================
  // COMMON CARD STYLE
  // =====================================================

  const cardStyle = {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "18px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
  };

  // =====================================================
  // TOPIC CARD
  // =====================================================

  const topicCard = (item, index, type) => {
    const hasQuiz =
      (item.quizAttempts ?? 0) > 0;

    const quizAccuracy =
      item.quizAccuracy ?? 0;

    const bestQuizAccuracy =
      item.bestQuizAccuracy ?? quizAccuracy;

    return (
      <div
        key={`${type}-${index}`}
        style={{
          padding: "20px",
          background: "#f8f9ff",
          border: "1px solid #e7e9ff",
          borderRadius: "14px",
          marginTop: "14px",
        }}
      >
        {/* Topic Name */}
        <h3
          style={{
            margin: "0 0 14px",
            color: "#20243a",
            fontSize: "21px",
          }}
        >
          {item.topic}
        </h3>

        {/* AI QUESTIONS */}
        <p
          style={{
            margin: "6px 0",
            fontSize: "15px",
          }}
        >
          🤖 <strong>AI Questions:</strong>{" "}
          {item.aiQuestions ?? 0}
        </p>

        {/* DOCUMENTS */}
        <p
          style={{
            margin: "6px 0",
            fontSize: "15px",
          }}
        >
          📄 <strong>Documents:</strong>{" "}
          {item.documents ?? 0}
        </p>

        {/* ACTIVITY SCORE */}
        <p
          style={{
            margin: "6px 0",
            fontSize: "15px",
          }}
        >
          📊 <strong>Activity Score:</strong>{" "}
          {item.score ?? 0}
        </p>

        {/* =================================================
            QUIZ PERFORMANCE
        ================================================= */}

        {hasQuiz && (
          <div
            style={{
              marginTop: "16px",
              padding: "15px",
              borderRadius: "12px",
              background:
                quizAccuracy < 50
                  ? "#fff1f2"
                  : "#ecfdf5",
              border:
                quizAccuracy < 50
                  ? "1px solid #fecdd3"
                  : "1px solid #bbf7d0",
            }}
          >
            <h4
              style={{
                margin: "0 0 10px",
                color:
                  quizAccuracy < 50
                    ? "#be123c"
                    : "#15803d",
                fontSize: "17px",
              }}
            >
              🎯 Quiz Performance
            </h4>

            <p
              style={{
                margin: "6px 0",
              }}
            >
              📝 <strong>Quiz Attempts:</strong>{" "}
              {item.quizAttempts}
            </p>

            <p
              style={{
                margin: "6px 0",
              }}
            >
              📈 <strong>Average Accuracy:</strong>{" "}
              {quizAccuracy}%
            </p>

            <p
              style={{
                margin: "6px 0",
              }}
            >
              🏆 <strong>Best Accuracy:</strong>{" "}
              {bestQuizAccuracy}%
            </p>

            {/* Accuracy bar */}
            <div
              style={{
                marginTop: "12px",
                width: "100%",
                height: "9px",
                background: "#e5e7eb",
                borderRadius: "20px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(
                    Math.max(quizAccuracy, 0),
                    100
                  )}%`,
                  height: "100%",
                  background:
                    quizAccuracy < 50
                      ? "#ef4444"
                      : "#22c55e",
                  borderRadius: "20px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            {/* Quiz message */}
            {quizAccuracy < 50 ? (
              <p
                style={{
                  color: "#b91c1c",
                  marginTop: "12px",
                  marginBottom: 0,
                  fontWeight: "600",
                }}
              >
                ⚠️ Quiz accuracy is below 50%.
                Review this topic and try the quiz again.
              </p>
            ) : (
              <p
                style={{
                  color: "#15803d",
                  marginTop: "12px",
                  marginBottom: 0,
                  fontWeight: "600",
                }}
              >
                ✅ Your quiz performance is currently
                above 50%.
              </p>
            )}
          </div>
        )}

        {/* =================================================
            ATTENTION TOPIC MESSAGE
        ================================================= */}

        {type === "attention" && !hasQuiz && (
          <p
            style={{
              color: "#b45309",
              marginTop: "14px",
              padding: "10px 12px",
              background: "#fffbeb",
              borderRadius: "8px",
            }}
          >
            ⚠️ You have asked AI about this topic.
            Consider revisiting it.
          </p>
        )}

        {/* =================================================
            ATTENTION + QUIZ MESSAGE
        ================================================= */}

        {type === "attention" &&
          hasQuiz &&
          quizAccuracy < 50 && (
            <p
              style={{
                color: "#b91c1c",
                marginTop: "12px",
                fontWeight: "600",
              }}
            >
              🧠 This topic may need additional revision
              based on your quiz performance.
            </p>
          )}

        {/* =================================================
            OTHER TOPIC
        ================================================= */}

        {type === "other" && (
          <p
            style={{
              color: "#475569",
              marginTop: "12px",
            }}
          >
            📖 Detected in your study material.
          </p>
        )}
      </div>
    );
  };

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6ff",
        padding: "35px",
        fontFamily: "Arial, sans-serif",
        color: "#20243a",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "auto",
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div style={cardStyle}>
          <h1
            style={{
              marginTop: 0,
              fontSize: "36px",
            }}
          >
            🎯 Topic-wise Learning Progress
          </h1>

          <p
            style={{
              fontSize: "17px",
              lineHeight: "1.6",
            }}
          >
            Explore topics extracted from your documents
            and track your AI learning activity and quiz
            performance.
          </p>

          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "10px",
              background: "#4f46e5",
              color: "white",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "600",
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div
            style={{
              ...cardStyle,
              marginTop: "25px",
              textAlign: "center",
            }}
          >
            <h2>⏳ Loading topic analysis...</h2>

            <p>
              Please wait while StudyVault AI analyzes
              your learning topics.
            </p>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && !loading && (
          <div
            style={{
              ...cardStyle,
              marginTop: "25px",
              border: "1px solid #fecaca",
              background: "#fff7f7",
            }}
          >
            <h2 style={{ color: "#dc2626" }}>
              ❌ Unable to load topics
            </h2>

            <p
              style={{
                color: "#b91c1c",
                fontSize: "16px",
              }}
            >
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "10px",
                padding: "10px 18px",
                border: "none",
                borderRadius: "8px",
                background: "#dc2626",
                color: "white",
                cursor: "pointer",
              }}
            >
              🔄 Try Again
            </button>
          </div>
        )}

        {/* =================================================
            DATA
        ================================================= */}

        {data && !loading && !error && (
          <>
            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
                marginTop: "25px",
              }}
            >
              {/* TOTAL TOPICS */}

              <div style={cardStyle}>
                <h2
                  style={{
                    fontSize: "32px",
                    margin: 0,
                  }}
                >
                  📚 {data.totalTopics ?? 0}
                </h2>

                <p>Total Topics</p>
              </div>

              {/* ATTENTION */}

              <div style={cardStyle}>
                <h2
                  style={{
                    fontSize: "32px",
                    margin: 0,
                  }}
                >
                  ⚠️{" "}
                  {data.needsAttention?.length ?? 0}
                </h2>

                <p>Topics Needing Attention</p>
              </div>

              {/* WEAK TOPICS */}

              <div style={cardStyle}>
                <h2
                  style={{
                    fontSize: "32px",
                    margin: 0,
                  }}
                >
                  🧠 {data.weakTopics?.length ?? 0}
                </h2>

                <p>Potential Weak Topics</p>
              </div>

              {/* OTHER TOPICS */}

              <div style={cardStyle}>
                <h2
                  style={{
                    fontSize: "32px",
                    margin: 0,
                  }}
                >
                  📖 {data.wellExplored?.length ?? 0}
                </h2>

                <p>Other Detected Topics</p>
              </div>
            </div>

            {/* =================================================
                TOPICS NEEDING ATTENTION
            ================================================= */}

            <div
              style={{
                ...cardStyle,
                marginTop: "25px",
              }}
            >
              <h2>⚠️ Topics Needing Attention</h2>

              <p>
                These topics have either matching AI
                questions or quiz activity in your learning
                history.
              </p>

              {(data.needsAttention || []).length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    marginTop: "15px",
                  }}
                >
                  <p>
                    ✅ No topics currently need attention.
                  </p>
                </div>
              ) : (
                data.needsAttention.map((item, index) =>
                  topicCard(
                    item,
                    index,
                    "attention"
                  )
                )
              )}
            </div>

            {/* =================================================
                POTENTIAL WEAK TOPICS
            ================================================= */}

            <div
              style={{
                ...cardStyle,
                marginTop: "25px",
              }}
            >
              <h2>🧠 Potential Weak Topics</h2>

              <p>
                These topics have quiz performance below
                50%. Quiz performance is used as evidence
                for identifying topics that may need more
                revision.
              </p>

              {(data.weakTopics || []).length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    marginTop: "15px",
                  }}
                >
                  <p>
                    ✅ No potential weak topics detected
                    from quiz performance yet.
                  </p>
                </div>
              ) : (
                data.weakTopics.map((item, index) =>
                  topicCard(
                    item,
                    index,
                    "weak"
                  )
                )
              )}
            </div>

            {/* =================================================
                OTHER TOPICS
            ================================================= */}

            <div
              style={{
                ...cardStyle,
                marginTop: "25px",
              }}
            >
              <h2>📖 Other Detected Topics</h2>

              <p>
                These topics were extracted from your
                uploaded study documents but do not
                currently have matching AI questions or quiz
                performance data.
              </p>

              {(data.wellExplored || []).length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    marginTop: "15px",
                  }}
                >
                  <p>
                    No additional topics to display.
                  </p>
                </div>
              ) : (
                data.wellExplored.map((item, index) =>
                  topicCard(
                    item,
                    index,
                    "other"
                  )
                )
              )}
            </div>

            {/* =================================================
                INFORMATION
            ================================================= */}

            <div
              style={{
                ...cardStyle,
                marginTop: "25px",
                marginBottom: "40px",
                background: "#eef2ff",
              }}
            >
              <h3>💡 How Topic Progress Works</h3>

              <p>
                StudyVault AI extracts topics from your
                uploaded study documents and compares them
                with your learning activity.
              </p>

              <p>
                Asking AI about a topic can indicate that
                you are studying or revisiting that topic,
                but it does not automatically mean that you
                are weak in it.
              </p>

              <p>
                Quiz performance provides additional
                evidence. Topics with quiz accuracy below
                50% are shown as potential weak topics for
                revision.
              </p>

              <p
                style={{
                  marginBottom: 0,
                  fontWeight: "600",
                  color: "#3730a3",
                }}
              >
                🎯 Keep taking quizzes to make your topic
                analysis more accurate over time.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TopicProgress;