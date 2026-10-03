import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function QuizHistory() {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // GET USER ID
  // =====================================================

  const getUserId = () => {
    const storageKeys = [
      "studyvaultUser",
      "user",
      "userInfo",
      "userId",
    ];

    for (const key of storageKeys) {
      const value = localStorage.getItem(key);

      if (!value) {
        continue;
      }

      try {
        const parsed = JSON.parse(value);

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
      } catch {
        if (value && value.length > 10) {
          return value;
        }
      }
    }

    return null;
  };

  // =====================================================
  // FETCH QUIZ HISTORY
  // =====================================================

  useEffect(() => {
    const fetchQuizHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const userId = getUserId();

        console.log(
          "🔑 Quiz History userId:",
          userId
        );

        if (!userId) {
          setError(
            "User not found. Please login again."
          );
          return;
        }

        const response = await fetch(
          `http://localhost:5001/api/quiz/history/${userId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch quiz history"
          );
        }

        setResults(
          Array.isArray(data.results)
            ? data.results
            : []
        );
      } catch (err) {
        console.error(
          "❌ Quiz history error:",
          err
        );

        setError(
          err.message ||
            "Failed to load quiz history."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuizHistory();
  }, []);

  // =====================================================
  // OVERALL STATISTICS
  // =====================================================

  const statistics = useMemo(() => {
    const totalAttempts = results.length;

    const totalQuestions = results.reduce(
      (sum, result) =>
        sum +
        (Number(result.totalQuestions) || 0),
      0
    );

    const totalCorrect = results.reduce(
      (sum, result) =>
        sum +
        (Number(result.correctAnswers) || 0),
      0
    );

    const totalWrong = results.reduce(
      (sum, result) =>
        sum +
        (Number(result.wrongAnswers) || 0),
      0
    );

    const averageAccuracy =
      totalAttempts > 0
        ? Math.round(
            results.reduce(
              (sum, result) =>
                sum +
                (Number(result.accuracy) || 0),
              0
            ) / totalAttempts
          )
        : 0;

    return {
      totalAttempts,
      totalQuestions,
      totalCorrect,
      totalWrong,
      averageAccuracy,
    };
  }, [results]);

  // =====================================================
  // TOPIC-WISE PERFORMANCE
  // =====================================================

  const topicPerformance = useMemo(() => {
    const topicMap = {};

    results.forEach((result) => {
      const topic =
        result.topic || "General";

      if (!topicMap[topic]) {
        topicMap[topic] = {
          topic,
          attempts: 0,
          totalAccuracy: 0,
          bestAccuracy: 0,
          totalCorrect: 0,
          totalQuestions: 0,
        };
      }

      const accuracy =
        Number(result.accuracy) || 0;

      topicMap[topic].attempts += 1;

      topicMap[topic].totalAccuracy +=
        accuracy;

      topicMap[topic].bestAccuracy =
        Math.max(
          topicMap[topic].bestAccuracy,
          accuracy
        );

      topicMap[topic].totalCorrect +=
        Number(result.correctAnswers) || 0;

      topicMap[topic].totalQuestions +=
        Number(result.totalQuestions) || 0;
    });

    return Object.values(topicMap)
      .map((topic) => ({
        ...topic,

        averageAccuracy:
          topic.attempts > 0
            ? Math.round(
                topic.totalAccuracy /
                  topic.attempts
              )
            : 0,
      }))
      .sort(
        (a, b) =>
          b.averageAccuracy -
          a.averageAccuracy
      );
  }, [results]);

  // =====================================================
  // ACCURACY TREND
  // =====================================================

  const accuracyTrend = useMemo(() => {
    return [...results]
      .reverse()
      .slice(-10)
      .map((result, index) => ({
        attempt: index + 1,
        accuracy:
          Number(result.accuracy) || 0,
        topic:
          result.topic || "General",
        date:
          result.completedAt ||
          result.createdAt,
      }));
  }, [results]);

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Unknown date";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // SHORT DATE
  // =====================================================

  const formatShortDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  // =====================================================
  // ACCURACY LABEL
  // =====================================================

  const getAccuracyLabel = (accuracy) => {
    const value = Number(accuracy) || 0;

    if (value >= 80) {
      return "Strong";
    }

    if (value >= 50) {
      return "Needs Practice";
    }

    return "Needs Revision";
  };

  // =====================================================
  // ACCURACY STYLE
  // =====================================================

  const getAccuracyStyle = (accuracy) => {
    const value = Number(accuracy) || 0;

    if (value >= 80) {
      return {
        background: "#dcfce7",
        color: "#15803d",
      };
    }

    if (value >= 50) {
      return {
        background: "#fef3c7",
        color: "#b45309",
      };
    }

    return {
      background: "#fee2e2",
      color: "#dc2626",
    };
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={centerCardStyle}>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "15px",
              }}
            >
              📊
            </div>

            <h2>
              Loading Quiz Performance...
            </h2>

            <p style={mutedText}>
              Fetching your quiz history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={centerCardStyle}>
            <div
              style={{
                fontSize: "48px",
              }}
            >
              ⚠️
            </div>

            <h2>
              Unable to Load Quiz History
            </h2>

            <p style={mutedText}>
              {error}
            </p>

            <div style={buttonRowStyle}>
              <button
                style={primaryButtonStyle}
                onClick={() =>
                  window.location.reload()
                }
              >
                🔄 Try Again
              </button>

              <button
                style={secondaryButtonStyle}
                onClick={() =>
                  navigate("/dashboard")
                }
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>

        {/* =================================================
            HEADER
        ================================================= */}

        <div style={headerCardStyle}>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <span
                style={{
                  fontSize: "42px",
                }}
              >
                📊
              </span>

              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "32px",
                    color: "#1f2937",
                  }}
                >
                  Quiz Performance
                </h1>

                <p
                  style={{
                    margin:
                      "8px 0 0",
                    color: "#6b7280",
                  }}
                >
                  Track your quiz attempts,
                  accuracy and topic-wise
                  performance.
                </p>
              </div>
            </div>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* =================================================
            OVERALL STATISTICS
        ================================================= */}

        <div style={statsGridStyle}>

          <StatCard
            icon="📝"
            label="Quiz Attempts"
            value={
              statistics.totalAttempts
            }
          />

          <StatCard
            icon="🎯"
            label="Average Accuracy"
            value={`${statistics.averageAccuracy}%`}
          />

          <StatCard
            icon="✅"
            label="Correct Answers"
            value={
              statistics.totalCorrect
            }
          />

          <StatCard
            icon="❌"
            label="Wrong Answers"
            value={
              statistics.totalWrong
            }
          />

        </div>

        {/* =================================================
            ACCURACY TREND
        ================================================= */}

        {results.length > 0 && (
          <div style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>
                  📈 Accuracy Trend
                </h2>

                <p style={mutedText}>
                  Accuracy across your recent
                  quiz attempts.
                </p>
              </div>

              <div
                style={{
                  background: "#eef2ff",
                  color: "#4f46e5",
                  padding: "8px 14px",
                  borderRadius: "20px",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Last {accuracyTrend.length} attempts
              </div>
            </div>

            <div
              style={{
                marginTop: "30px",
                display: "flex",
                alignItems: "flex-end",
                gap: "18px",
                height: "220px",
                padding:
                  "10px 10px 0",
                borderBottom:
                  "1px solid #e5e7eb",
              }}
            >
              {accuracyTrend.map(
                (item) => (
                  <div
                    key={
                      `${item.date}-${item.attempt}`
                    }
                    style={{
                      flex: 1,
                      height: "100%",
                      display: "flex",
                      flexDirection:
                        "column",
                      justifyContent:
                        "flex-end",
                      alignItems:
                        "center",
                      minWidth: "35px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        marginBottom:
                          "7px",
                        color: "#374151",
                      }}
                    >
                      {item.accuracy}%
                    </span>

                    <div
                      title={`${item.topic} - ${item.accuracy}%`}
                      style={{
                        width: "100%",
                        maxWidth: "48px",
                        height: `${Math.max(
                          item.accuracy * 1.7,
                          8
                        )}px`,
                        background:
                          "#4f46e5",
                        borderRadius:
                          "8px 8px 0 0",
                        transition:
                          "height 0.4s ease",
                      }}
                    />

                    <span
                      style={{
                        marginTop: "8px",
                        fontSize: "11px",
                        color: "#6b7280",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      Q{item.attempt}
                    </span>
                  </div>
                )
              )}
            </div>

            <div
              style={{
                marginTop: "12px",
                color: "#9ca3af",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              Older → Newer
            </div>
          </div>
        )}

        {/* =================================================
            TOPIC-WISE PERFORMANCE
        ================================================= */}

        {topicPerformance.length > 0 && (
          <div style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>
                  📚 Topic-wise Performance
                </h2>

                <p style={mutedText}>
                  Your quiz accuracy grouped
                  by topic.
                </p>
              </div>

              <span
                style={{
                  background: "#f3f4f6",
                  padding: "8px 14px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#4b5563",
                }}
              >
                {topicPerformance.length} topic
                {topicPerformance.length !==
                1
                  ? "s"
                  : ""}
              </span>
            </div>

            <div
              style={{
                marginTop: "25px",
                display: "grid",
                gap: "15px",
              }}
            >
              {topicPerformance.map(
                (topic) => {
                  const accuracy =
                    topic.averageAccuracy;

                  return (
                    <div
                      key={topic.topic}
                      style={{
                        border:
                          "1px solid #e5e7eb",
                        borderRadius: "14px",
                        padding: "18px",
                        background:
                          "#fafafa",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap: "15px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            minWidth:
                              "220px",
                          }}
                        >
                          <h3
                            style={{
                              margin:
                                "0 0 6px",
                              color:
                                "#1f2937",
                              fontSize:
                                "17px",
                            }}
                          >
                            {topic.topic}
                          </h3>

                          <p
                            style={{
                              margin: 0,
                              color:
                                "#6b7280",
                              fontSize:
                                "13px",
                            }}
                          >
                            {topic.attempts}{" "}
                            attempt
                            {topic.attempts !==
                            1
                              ? "s"
                              : ""}{" "}
                            • Best:{" "}
                            {
                              topic.bestAccuracy
                            }
                            %
                          </p>
                        </div>

                        <div
                          style={{
                            textAlign:
                              "right",
                          }}
                        >
                          <strong
                            style={{
                              fontSize:
                                "24px",
                              color:
                                accuracy >=
                                80
                                  ? "#15803d"
                                  : accuracy >=
                                      50
                                    ? "#b45309"
                                    : "#dc2626",
                            }}
                          >
                            {accuracy}%
                          </strong>

                          <div
                            style={{
                              fontSize:
                                "12px",
                              color:
                                "#6b7280",
                            }}
                          >
                            Average
                          </div>
                        </div>
                      </div>

                      {/* PROGRESS BAR */}

                      <div
                        style={{
                          marginTop:
                            "14px",
                          height: "10px",
                          background:
                            "#e5e7eb",
                          borderRadius:
                            "10px",
                          overflow:
                            "hidden",
                        }}
                      >
                        <div
                          style={{
                            width:
                              `${Math.min(
                                accuracy,
                                100
                              )}%`,
                            height:
                              "100%",
                            background:
                              accuracy >=
                              80
                                ? "#16a34a"
                                : accuracy >=
                                    50
                                  ? "#f59e0b"
                                  : "#ef4444",
                            borderRadius:
                              "10px",
                            transition:
                              "width 0.5s ease",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          marginTop:
                            "10px",
                        }}
                      >
                        <span
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#6b7280",
                          }}
                        >
                          Correct:{" "}
                          {
                            topic.totalCorrect
                          }{" "}
                          /{" "}
                          {
                            topic.totalQuestions
                          }
                        </span>

                        <span
                          style={{
                            ...getAccuracyStyle(
                              accuracy
                            ),
                            padding:
                              "5px 10px",
                            borderRadius:
                              "15px",
                            fontSize:
                              "11px",
                            fontWeight:
                              "bold",
                          }}
                        >
                          {getAccuracyLabel(
                            accuracy
                          )}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* =================================================
            RECENT QUIZ ATTEMPTS
        ================================================= */}

        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>
                🕒 Recent Quiz Attempts
              </h2>

              <p style={mutedText}>
                Your latest quiz results.
              </p>
            </div>

            <span
              style={{
                background: "#eef2ff",
                color: "#4f46e5",
                padding: "8px 14px",
                borderRadius: "20px",
                fontWeight: "600",
                fontSize: "13px",
              }}
            >
              {results.length} attempt
              {results.length !== 1
                ? "s"
                : ""}
            </span>
          </div>

          {results.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "50px 20px",
              }}
            >
              <div
                style={{
                  fontSize: "55px",
                }}
              >
                📝
              </div>

              <h3>
                No Quiz Attempts Yet
              </h3>

              <p style={mutedText}>
                Complete your first quiz
                to start tracking your
                performance.
              </p>

              <button
                style={primaryButtonStyle}
                onClick={() =>
                  navigate("/quiz")
                }
              >
                ✨ Take a Quiz
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "15px",
                marginTop: "20px",
              }}
            >
              {results.map(
                (result, index) => {
                  const accuracy =
                    Number(
                      result.accuracy
                    ) || 0;

                  return (
                    <div
                      key={
                        result._id ||
                        `${result.topic}-${index}`
                      }
                      style={{
                        border:
                          "1px solid #e5e7eb",
                        borderRadius:
                          "14px",
                        padding: "20px",
                        background:
                          "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap: "20px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        {/* LEFT */}

                        <div
                          style={{
                            display:
                              "flex",
                            gap: "14px",
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              width:
                                "48px",
                              height:
                                "48px",
                              borderRadius:
                                "12px",
                              background:
                                "#eef2ff",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              fontSize:
                                "24px",
                              flexShrink:
                                0,
                            }}
                          >
                            🎯
                          </div>

                          <div>
                            <h3
                              style={{
                                margin:
                                  "0 0 7px",
                                color:
                                  "#1f2937",
                              }}
                            >
                              {result.topic ||
                                "General Quiz"}
                            </h3>

                            <p
                              style={{
                                margin:
                                  "0 0 5px",
                                color:
                                  "#6b7280",
                                fontSize:
                                  "13px",
                              }}
                            >
                              📚{" "}
                              {result.documentId
                                ? "Based on uploaded study material"
                                : "AI-generated quiz"}
                            </p>

                            <p
                              style={{
                                margin: 0,
                                color:
                                  "#9ca3af",
                                fontSize:
                                  "12px",
                              }}
                            >
                              🕒{" "}
                              {formatDate(
                                result.completedAt ||
                                  result.createdAt
                              )}
                            </p>
                          </div>
                        </div>

                        {/* RIGHT */}

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "25px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <Metric
                            label="Score"
                            value={`${result.score ?? 0}/${result.totalQuestions ?? 0}`}
                          />

                          <Metric
                            label="Correct"
                            value={
                              result.correctAnswers ??
                              0
                            }
                          />

                          <Metric
                            label="Wrong"
                            value={
                              result.wrongAnswers ??
                              0
                            }
                          />

                          <div
                            style={{
                              textAlign:
                                "center",
                              minWidth:
                                "75px",
                            }}
                          >
                            <strong
                              style={{
                                fontSize:
                                  "22px",
                                color:
                                  accuracy >=
                                  80
                                    ? "#15803d"
                                    : accuracy >=
                                        50
                                      ? "#b45309"
                                      : "#dc2626",
                              }}
                            >
                              {accuracy}%
                            </strong>

                            <div
                              style={{
                                fontSize:
                                  "11px",
                                color:
                                  "#6b7280",
                              }}
                            >
                              Accuracy
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ATTEMPT PROGRESS */}

                      <div
                        style={{
                          marginTop:
                            "18px",
                          height: "7px",
                          background:
                            "#e5e7eb",
                          borderRadius:
                            "10px",
                          overflow:
                            "hidden",
                        }}
                      >
                        <div
                          style={{
                            width:
                              `${Math.min(
                                accuracy,
                                100
                              )}%`,
                            height:
                              "100%",
                            background:
                              "#4f46e5",
                            borderRadius:
                              "10px",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          marginTop:
                            "7px",
                          fontSize:
                            "11px",
                          color:
                            "#9ca3af",
                          textAlign:
                            "right",
                        }}
                      >
                        {formatShortDate(
                          result.completedAt ||
                            result.createdAt
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* =================================================
            BOTTOM ACTIONS
        ================================================= */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "30px",
          }}
        >
          <button
            style={primaryButtonStyle}
            onClick={() =>
              navigate("/quiz")
            }
          >
            ✨ Take Another Quiz
          </button>

          <button
            style={secondaryButtonStyle}
            onClick={() =>
              navigate("/topic-progress")
            }
          >
            🧠 View Topic Progress
          </button>

          <button
            style={secondaryButtonStyle}
            onClick={() =>
              navigate("/dashboard")
            }
          >
            🏠 Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  icon,
  label,
  value,
}) {
  return (
    <div
      style={{
        ...cardStyle,
        display: "flex",
        alignItems: "center",
        gap: "15px",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "14px",
          background: "#eef2ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "25px",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color: "#6b7280",
            fontSize: "13px",
            marginBottom: "5px",
          }}
        >
          {label}
        </div>

        <strong
          style={{
            fontSize: "25px",
            color: "#1f2937",
          }}
        >
          {value}
        </strong>
      </div>
    </div>
  );
}

// =====================================================
// METRIC
// =====================================================

function Metric({
  label,
  value,
}) {
  return (
    <div
      style={{
        textAlign: "center",
        minWidth: "65px",
      }}
    >
      <strong
        style={{
          fontSize: "19px",
          color: "#1f2937",
        }}
      >
        {value}
      </strong>

      <div
        style={{
          fontSize: "11px",
          color: "#6b7280",
          marginTop: "3px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// =====================================================
// PAGE STYLE
// =====================================================

const pageStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, #f5f7ff, #eef2ff)",
  padding: "30px",
  fontFamily:
    "Arial, Helvetica, sans-serif",
};

// =====================================================
// CONTAINER
// =====================================================

const containerStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
};

// =====================================================
// HEADER
// =====================================================

const headerCardStyle = {
  background: "#ffffff",
  padding: "28px",
  borderRadius: "18px",
  boxShadow:
    "0 4px 15px rgba(0,0,0,0.08)",
  marginBottom: "25px",
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
};

// =====================================================
// CARD
// =====================================================

const cardStyle = {
  background: "#ffffff",
  padding: "28px",
  borderRadius: "18px",
  boxShadow:
    "0 4px 15px rgba(0,0,0,0.08)",
  marginBottom: "25px",
};

// =====================================================
// CENTER CARD
// =====================================================

const centerCardStyle = {
  ...cardStyle,
  textAlign: "center",
  padding: "60px 30px",
};

// =====================================================
// STATS GRID
// =====================================================

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
  marginBottom: "25px",
};

// =====================================================
// SECTION HEADER
// =====================================================

const sectionHeaderStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "15px",
  flexWrap: "wrap",
};

// =====================================================
// SECTION TITLE
// =====================================================

const sectionTitleStyle = {
  margin: 0,
  color: "#1f2937",
  fontSize: "23px",
};

// =====================================================
// MUTED TEXT
// =====================================================

const mutedText = {
  color: "#6b7280",
  marginTop: "7px",
};

// =====================================================
// BUTTON ROW
// =====================================================

const buttonRowStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "20px",
};

// =====================================================
// PRIMARY BUTTON
// =====================================================

const primaryButtonStyle = {
  padding: "12px 20px",
  border: "none",
  borderRadius: "9px",
  background: "#4f46e5",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "bold",
  cursor: "pointer",
};

// =====================================================
// SECONDARY BUTTON
// =====================================================

const secondaryButtonStyle = {
  padding: "11px 18px",
  border: "1px solid #d1d5db",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#374151",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
};

export default QuizHistory;