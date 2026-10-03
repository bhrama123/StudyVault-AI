import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import RevisionPlanner from "./RevisionPlanner";

function Dashboard() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [stats, setStats] = useState({
    totalActivities: 0,
    questionsAsked: 0,
    summariesGenerated: 0,
    notesGenerated: 0,
    questionsGenerated: 0,
    documentsUploaded: 0,
    revisionPlansGenerated: 0,
  });

  const [activities, setActivities] = useState([]);

  const [topicData, setTopicData] = useState({
    totalTopics: 0,
    weakTopics: [],
    needsAttention: [],
    wellExplored: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // GET USER ID
  // =====================================================

  const getUserId = () => {
    try {
      // -------------------------------------------------
      // Direct userId
      // -------------------------------------------------

      const directUserId =
        localStorage.getItem("userId");

      if (directUserId) {
        return directUserId;
      }

      // -------------------------------------------------
      // user
      // -------------------------------------------------

      const userData =
        localStorage.getItem("user");

      if (userData) {
        const user = JSON.parse(userData);

        return (
          user?._id ||
          user?.id ||
          user?.userId ||
          null
        );
      }

      // -------------------------------------------------
      // userInfo
      // -------------------------------------------------

      const userInfo =
        localStorage.getItem("userInfo");

      if (userInfo) {
        const user = JSON.parse(userInfo);

        return (
          user?._id ||
          user?.id ||
          user?.userId ||
          null
        );
      }

      // -------------------------------------------------
      // studyvaultUser
      // -------------------------------------------------

      const studyvaultUser =
        localStorage.getItem("studyvaultUser");

      if (studyvaultUser) {
        const user = JSON.parse(studyvaultUser);

        return (
          user?._id ||
          user?.id ||
          user?.userId ||
          null
        );
      }
    } catch (error) {
      console.error(
        "Error reading user information:",
        error
      );
    }

    return null;
  };

  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const userId = getUserId();

      console.log(
        "👤 Dashboard userId:",
        userId
      );

      if (!userId) {
        setError(
          "User information not found. Please login again."
        );

        setLoading(false);
        return;
      }

      // =================================================
      // LEARNING STATISTICS
      // =================================================

      const statsResponse = await fetch(
        `http://localhost:5001/api/learning/stats/${userId}`
      );

      if (!statsResponse.ok) {
        throw new Error(
          "Failed to load learning statistics"
        );
      }

      const statsData =
        await statsResponse.json();

      console.log(
        "📊 Learning statistics:",
        statsData
      );

      // =================================================
      // ACTUAL DOCUMENTS
      // =================================================

      const documentsResponse = await fetch(
        `http://localhost:5001/api/documents/${userId}`
      );

      if (!documentsResponse.ok) {
        throw new Error(
          "Failed to load documents"
        );
      }

      const documentsData =
        await documentsResponse.json();

      const actualDocumentCount =
        documentsData.documents?.length || 0;

      console.log(
        "📄 Dashboard documents:",
        actualDocumentCount
      );

      // =================================================
      // SET STATISTICS
      // =================================================

      setStats({
        totalActivities:
          statsData.stats?.totalActivities || 0,

        questionsAsked:
          statsData.stats?.questionsAsked || 0,

        summariesGenerated:
          statsData.stats?.summariesGenerated || 0,

        notesGenerated:
          statsData.stats?.notesGenerated || 0,

        questionsGenerated:
          statsData.stats?.questionsGenerated || 0,

        documentsUploaded:
          actualDocumentCount,

        revisionPlansGenerated:
          statsData.stats?.revisionPlansGenerated || 0,
      });

      // =================================================
      // RECENT ACTIVITIES
      // =================================================

      const activityResponse = await fetch(
        `http://localhost:5001/api/learning/activity/${userId}`
      );

      if (!activityResponse.ok) {
        throw new Error(
          "Failed to load learning activities"
        );
      }

      const activityData =
        await activityResponse.json();

      console.log(
        "📚 Recent activities:",
        activityData
      );

      setActivities(
        activityData.activities || []
      );

      // =================================================
      // TOPIC ANALYSIS
      // =================================================

      const topicResponse = await fetch(
        `http://localhost:5001/api/topics/${userId}`
      );

      if (!topicResponse.ok) {
        throw new Error(
          "Failed to load topic analysis"
        );
      }

      const topicResult =
        await topicResponse.json();

      console.log(
        "🧠 Topic analysis:",
        topicResult
      );

      setTopicData({
        totalTopics:
          topicResult.totalTopics || 0,

        weakTopics:
          topicResult.weakTopics || [],

        needsAttention:
          topicResult.needsAttention || [],

        wellExplored:
          topicResult.wellExplored || [],
      });
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );

      setError(
        "Unable to load your learning progress."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD WHEN PAGE OPENS
  // =====================================================

  useEffect(() => {
    loadDashboardData();
  }, []);

  // =====================================================
  // ACTIVITY ICON
  // =====================================================

  const getActivityIcon = (type) => {
    switch (type) {
      case "ask_ai":
        return "🤖";

      case "summary":
        return "📚";

      case "notes":
        return "📝";

      case "questions":
        return "❓";

      case "document_upload":
        return "📄";

      case "revision_plan":
        return "📅";

      default:
        return "📊";
    }
  };

  // =====================================================
  // ACTIVITY TITLE
  // =====================================================

  const getActivityTitle = (activity) => {
    switch (activity.activityType) {
      case "ask_ai":
        return "Asked AI";

      case "summary":
        return "Generated Summary";

      case "notes":
        return "Generated Study Notes";

      case "questions":
        return "Generated Practice Questions";

      case "document_upload":
        return "Uploaded Document";

      case "revision_plan":
        return "Generated Revision Plan";

      default:
        return (
          activity.title ||
          "Learning Activity"
        );
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleString();
  };

  // =====================================================
  // ANALYTICS DATA
  // =====================================================

  const analytics = [
    {
      label: "AI Questions",
      value: stats.questionsAsked,
      icon: "🤖",
    },

    {
      label: "Summaries",
      value: stats.summariesGenerated,
      icon: "📚",
    },

    {
      label: "Study Notes",
      value: stats.notesGenerated,
      icon: "📝",
    },

    {
      label: "Question Sets",
      value: stats.questionsGenerated,
      icon: "❓",
    },

    {
      label: "Revision Plans",
      value: stats.revisionPlansGenerated,
      icon: "📅",
    },
  ];

  const maxAnalyticsValue = Math.max(
    ...analytics.map(
      (item) => item.value
    ),
    1
  );

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f5f7ff, #eef2ff)",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            background: "#ffffff",
            padding: "30px",
            borderRadius: "18px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.08)",
            marginBottom: "30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: "#222",
                fontSize: "34px",
              }}
            >
              StudyVault AI 🧠
            </h1>

            <h2
              style={{
                marginTop: "12px",
                color: "#444",
              }}
            >
              Welcome to your Dashboard 👋
            </h2>

            <p
              style={{
                color: "#666",
                fontSize: "16px",
                marginBottom: 0,
              }}
            >
              Your academic memory starts here.
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem(
                "studyvaultUser"
              );

              localStorage.removeItem(
                "user"
              );

              localStorage.removeItem(
                "userId"
              );

              localStorage.removeItem(
                "userInfo"
              );

              navigate("/");
            }}
            style={logoutButtonStyle}
          >
            Logout
          </button>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={{
              background: "#ffe5e5",
              color: "#c62828",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div
            style={{
              background: "#ffffff",
              padding: "50px",
              borderRadius: "18px",
              textAlign: "center",
              boxShadow:
                "0 4px 15px rgba(0,0,0,0.08)",
            }}
          >
            <h3>
              Loading your learning progress...
              ⏳
            </h3>
          </div>
        ) : (
          <>
            {/* =================================================
                STUDYVAULT OVERVIEW
            ================================================= */}

            <h2
              style={{
                color: "#222",
                marginBottom: "18px",
              }}
            >
              📚 Your StudyVault
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
                marginBottom: "35px",
              }}
            >
              {/* DOCUMENTS */}

              <div style={cardStyle}>
                <div style={iconStyle}>
                  📄
                </div>

                <h3>
                  Documents
                </h3>

                <p style={numberStyle}>
                  {stats.documentsUploaded}
                </p>

                <small style={smallStyle}>
                  Study materials stored
                </small>
              </div>

              {/* AI QUESTIONS */}

              <div style={cardStyle}>
                <div style={iconStyle}>
                  🤖
                </div>

                <h3>
                  AI Questions
                </h3>

                <p style={numberStyle}>
                  {stats.questionsAsked}
                </p>

                <small style={smallStyle}>
                  Questions asked to AI
                </small>
              </div>

              {/* SUMMARIES */}

              <div style={cardStyle}>
                <div style={iconStyle}>
                  📚
                </div>

                <h3>
                  Summaries
                </h3>

                <p style={numberStyle}>
                  {stats.summariesGenerated}
                </p>

                <small style={smallStyle}>
                  AI summaries created
                </small>
              </div>

              {/* NOTES */}

              <div style={cardStyle}>
                <div style={iconStyle}>
                  📝
                </div>

                <h3>
                  Study Notes
                </h3>

                <p style={numberStyle}>
                  {stats.notesGenerated}
                </p>

                <small style={smallStyle}>
                  Notes generated
                </small>
              </div>

              {/* QUESTION SETS */}

              <div style={cardStyle}>
                <div style={iconStyle}>
                  ❓
                </div>

                <h3>
                  Question Sets
                </h3>

                <p style={numberStyle}>
                  {stats.questionsGenerated}
                </p>

                <small style={smallStyle}>
                  Practice sets created
                </small>
              </div>

              {/* REVISION PLANS */}

              <div style={cardStyle}>
                <div style={iconStyle}>
                  📅
                </div>

                <h3>
                  Revision Plans
                </h3>

                <p style={numberStyle}>
                  {stats.revisionPlansGenerated}
                </p>

                <small style={smallStyle}>
                  AI revision plans generated
                </small>
              </div>

              {/* TOTAL ACTIVITIES */}

              <div style={cardStyle}>
                <div style={iconStyle}>
                  📈
                </div>

                <h3>
                  Total Activities
                </h3>

                <p style={numberStyle}>
                  {stats.totalActivities}
                </p>

                <small style={smallStyle}>
                  Recorded learning actions
                </small>
              </div>
            </div>

            {/* =================================================
                LEARNING INSIGHTS
            ================================================= */}

            <div
              style={{
                background: "#ffffff",
                padding: "28px",
                borderRadius: "18px",
                boxShadow:
                  "0 4px 15px rgba(0,0,0,0.08)",
                marginBottom: "30px",
              }}
            >
              {/* HEADER */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "15px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#222",
                    }}
                  >
                    🧠 Learning Insights
                  </h2>

                  <p
                    style={{
                      color: "#777",
                      marginTop: "8px",
                    }}
                  >
                    StudyVault AI analyzes your
                    documents and learning activity.
                  </p>
                </div>

                <div
                  style={{
                    background: "#eef2ff",
                    padding: "10px 16px",
                    borderRadius: "20px",
                    color: "#4f46e5",
                    fontWeight: "bold",
                  }}
                >
                  {topicData.totalTopics} topics detected
                </div>
              </div>

              {/* =================================================
                  INSIGHT CARDS
              ================================================= */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "20px",
                  marginTop: "25px",
                }}
              >
                {/* =================================================
                    WEAK TOPICS
                ================================================= */}

                <div
                  style={{
                    background: "#fff8f0",
                    border:
                      "1px solid #ffe1bd",
                    borderRadius: "15px",
                    padding: "22px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          color: "#b45309",
                        }}
                      >
                        ⚠️ Topics Needing Attention
                      </h3>

                      <p
                        style={{
                          color: "#777",
                          fontSize: "13px",
                        }}
                      >
                        Topics you have asked AI about
                      </p>
                    </div>

                    <span
                      style={{
                        background: "#f59e0b",
                        color: "#ffffff",
                        padding: "6px 11px",
                        borderRadius: "20px",
                        fontWeight: "bold",
                      }}
                    >
                      {topicData.weakTopics.length}
                    </span>
                  </div>

                  {topicData.weakTopics.length ===
                  0 ? (
                    <div
                      style={{
                        padding: "20px 0",
                        color: "#777",
                      }}
                    >
                      🎉 No topics needing attention
                      yet.
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: "15px",
                      }}
                    >
                      {topicData.weakTopics
                        .slice(0, 8)
                        .map(
                          (topic, index) => (
                            <div
                              key={
                                topic.topic +
                                index
                              }
                              style={{
                                background:
                                  "#ffffff",
                                padding:
                                  "14px",
                                borderRadius:
                                  "10px",
                                marginBottom:
                                  "10px",
                                display:
                                  "flex",
                                justifyContent:
                                  "space-between",
                                alignItems:
                                  "center",
                                gap: "10px",
                              }}
                            >
                              <div>
                                <strong
                                  style={{
                                    color:
                                      "#333",
                                  }}
                                >
                                  {topic.topic}
                                </strong>

                                <p
                                  style={{
                                    margin:
                                      "5px 0 0",
                                    fontSize:
                                      "12px",
                                    color:
                                      "#777",
                                  }}
                                >
                                  {topic.reason}
                                </p>
                              </div>

                              <span
                                style={{
                                  background:
                                    "#fff3cd",
                                  color:
                                    "#a16207",
                                  padding:
                                    "5px 8px",
                                  borderRadius:
                                    "8px",
                                  fontSize:
                                    "12px",
                                  whiteSpace:
                                    "nowrap",
                                }}
                              >
                                {topic.aiQuestions}{" "}
                                question
                                {topic.aiQuestions !==
                                1
                                  ? "s"
                                  : ""}
                              </span>
                            </div>
                          )
                        )}
                    </div>
                  )}
                </div>

                {/* =================================================
                    WELL EXPLORED
                ================================================= */}

                <div
                  style={{
                    background: "#f1fff5",
                    border:
                      "1px solid #c8efd5",
                    borderRadius: "15px",
                    padding: "22px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          color: "#15803d",
                        }}
                      >
                        ✅ Well Explored Topics
                      </h3>

                      <p
                        style={{
                          color: "#777",
                          fontSize: "13px",
                        }}
                      >
                        Topics currently without
                        AI questions
                      </p>
                    </div>

                    <span
                      style={{
                        background: "#16a34a",
                        color: "#ffffff",
                        padding: "6px 11px",
                        borderRadius: "20px",
                        fontWeight: "bold",
                      }}
                    >
                      {topicData.wellExplored.length}
                    </span>
                  </div>

                  {topicData.wellExplored.length ===
                  0 ? (
                    <div
                      style={{
                        padding: "20px 0",
                        color: "#777",
                      }}
                    >
                      📚 Keep studying to build
                      your learning history.
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: "15px",
                      }}
                    >
                      {topicData.wellExplored
                        .slice(0, 8)
                        .map(
                          (topic, index) => (
                            <div
                              key={
                                topic.topic +
                                index
                              }
                              style={{
                                background:
                                  "#ffffff",
                                padding:
                                  "14px",
                                borderRadius:
                                  "10px",
                                marginBottom:
                                  "10px",
                                display:
                                  "flex",
                                justifyContent:
                                  "space-between",
                                alignItems:
                                  "center",
                              }}
                            >
                              <div>
                                <strong
                                  style={{
                                    color:
                                      "#333",
                                  }}
                                >
                                  {topic.topic}
                                </strong>

                                <p
                                  style={{
                                    margin:
                                      "5px 0 0",
                                    fontSize:
                                      "12px",
                                    color:
                                      "#777",
                                  }}
                                >
                                  Available in your
                                  study documents
                                </p>
                              </div>

                              <span
                                style={{
                                  background:
                                    "#dcfce7",
                                  color:
                                    "#15803d",
                                  padding:
                                    "6px 9px",
                                  borderRadius:
                                    "8px",
                                  fontWeight:
                                    "bold",
                                }}
                              >
                                ✓
                              </span>
                            </div>
                          )
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* =================================================
                  AI REVISION PLANNER
              ================================================= */}

              <RevisionPlanner
                weakTopics={
                  topicData.weakTopics
                }
              />

              {/* =================================================
                  INSIGHT FOOTER
              ================================================= */}

              <div
                style={{
                  marginTop: "20px",
                  background: "#f8f9ff",
                  padding: "15px",
                  borderRadius: "10px",
                  color: "#666",
                  fontSize: "13px",
                }}
              >
                💡 <strong>How this works:</strong>{" "}
                StudyVault AI currently identifies
                topics from your uploaded documents
                and uses your AI question activity to
                highlight topics that may need more
                attention.
              </div>
            </div>

            {/* =================================================
                LEARNING ANALYTICS
            ================================================= */}

            <div
              style={{
                background: "#ffffff",
                padding: "28px",
                borderRadius: "18px",
                boxShadow:
                  "0 4px 15px rgba(0,0,0,0.08)",
                marginBottom: "30px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#222",
                    }}
                  >
                    📊 Learning Analytics
                  </h2>

                  <p
                    style={{
                      color: "#777",
                      marginTop: "8px",
                    }}
                  >
                    Track how you are using
                    StudyVault AI.
                  </p>
                </div>

                <div
                  style={{
                    background: "#eef2ff",
                    padding: "10px 16px",
                    borderRadius: "20px",
                    color: "#4f46e5",
                    fontWeight: "bold",
                  }}
                >
                  {stats.totalActivities} activities
                </div>
              </div>

              {/* ANALYTICS BARS */}

              <div
                style={{
                  marginTop: "25px",
                }}
              >
                {analytics.map(
                  (item) => {
                    const width =
                      item.value === 0
                        ? 0
                        : Math.max(
                            (item.value /
                              maxAnalyticsValue) *
                              100,
                            8
                          );

                    return (
                      <div
                        key={item.label}
                        style={{
                          marginBottom:
                            "22px",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            marginBottom:
                              "8px",
                          }}
                        >
                          <span
                            style={{
                              fontWeight:
                                "bold",
                              color:
                                "#333",
                            }}
                          >
                            {item.icon}{" "}
                            {item.label}
                          </span>

                          <span
                            style={{
                              fontWeight:
                                "bold",
                              color:
                                "#4f46e5",
                            }}
                          >
                            {item.value}
                          </span>
                        </div>

                        <div
                          style={{
                            height: "12px",
                            background:
                              "#edf0f7",
                            borderRadius:
                              "10px",
                            overflow:
                              "hidden",
                          }}
                        >
                          <div
                            style={{
                              width:
                                `${width}%`,
                              height: "100%",
                              background:
                                "#4f46e5",
                              borderRadius:
                                "10px",
                              transition:
                                "width 0.5s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* ANALYTICS SUMMARY */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "15px",
                  marginTop: "30px",
                }}
              >
                <div
                  style={analyticsMiniCard}
                >
                  <strong>
                    📄{" "}
                    {stats.documentsUploaded}
                  </strong>

                  <span>
                    Documents
                  </span>
                </div>

                <div
                  style={analyticsMiniCard}
                >
                  <strong>
                    🤖{" "}
                    {stats.questionsAsked}
                  </strong>

                  <span>
                    AI Interactions
                  </span>
                </div>

                <div
                  style={analyticsMiniCard}
                >
                  <strong>
                    📚{" "}
                    {stats.summariesGenerated +
                      stats.notesGenerated}
                  </strong>

                  <span>
                    Study Materials
                  </span>
                </div>

                <div
                  style={analyticsMiniCard}
                >
                  <strong>
                    ❓{" "}
                    {stats.questionsGenerated}
                  </strong>

                  <span>
                    Practice Sets
                  </span>
                </div>

                <div
                  style={analyticsMiniCard}
                >
                  <strong>
                    📅{" "}
                    {stats.revisionPlansGenerated}
                  </strong>

                  <span>
                    Revision Plans
                  </span>
                </div>
              </div>
            </div>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div
              style={{
                background: "#ffffff",
                padding: "28px",
                borderRadius: "18px",
                boxShadow:
                  "0 4px 15px rgba(0,0,0,0.08)",
                marginBottom: "30px",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                }}
              >
                🚀 What would you like to do?
              </h2>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginTop: "20px",
                }}
              >
                <button
                  onClick={() =>
                    navigate("/documents")
                  }
                  style={buttonStyle}
                >
                  📄 Upload Documents
                </button>

                <button
                  onClick={() =>
                    navigate("/ai-study")
                  }
                  style={buttonStyle}
                >
                  🧠 Ask AI
                </button>

                <button
                  onClick={() =>
                    navigate("/ai-study")
                  }
                  style={buttonStyle}
                >
                  📝 Practice Questions
                </button>

                {/* QUIZ */}

                <button
                  onClick={() =>
                    navigate("/quiz")
                  }
                  style={buttonStyle}
                >
                  ❓ Take Quiz
                </button>

                {/* QUIZ HISTORY */}

                <button
                  onClick={() =>
                    navigate("/quiz-history")
                  }
                  style={buttonStyle}
                >
                  📊 Quiz Performance
                </button>

                {/* TOPIC PROGRESS */}

                <button
                  onClick={() =>
                    navigate("/topic-progress")
                  }
                  style={buttonStyle}
                >
                  🧠 Topic Progress
                </button>

                {/* LEARNING HISTORY */}

                <button
                  onClick={() =>
                    navigate("/learning-history")
                  }
                  style={buttonStyle}
                >
                  📚 Learning History
                </button>

                {/* REFRESH */}

                <button
                  onClick={
                    loadDashboardData
                  }
                  style={buttonStyle}
                >
                  🔄 Refresh Analytics
                </button>
              </div>
            </div>

            {/* =================================================
                RECENT ACTIVITY
            ================================================= */}

            <div
              style={{
                background: "#ffffff",
                padding: "28px",
                borderRadius: "18px",
                boxShadow:
                  "0 4px 15px rgba(0,0,0,0.08)",
                marginBottom: "30px",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                }}
              >
                🕒 Recent Learning Activity
              </h2>

              {activities.length === 0 ? (
                <p
                  style={{
                    color: "#777",
                    padding: "20px 0",
                  }}
                >
                  No learning activity yet.
                  Start studying to build your
                  academic history! 🚀
                </p>
              ) : (
                <div>
                  {activities.map(
                    (activity) => (
                      <div
                        key={activity._id}
                        style={{
                          padding:
                            "16px 0",
                          borderBottom:
                            "1px solid #eee",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "14px",
                          }}
                        >
                          <span
                            style={{
                              fontSize:
                                "28px",
                            }}
                          >
                            {getActivityIcon(
                              activity.activityType
                            )}
                          </span>

                          <div
                            style={{
                              flex: 1,
                            }}
                          >
                            <h3
                              style={{
                                margin:
                                  "0 0 5px",
                                color:
                                  "#333",
                              }}
                            >
                              {getActivityTitle(
                                activity
                              )}
                            </h3>

                            {activity.description && (
                              <p
                                style={{
                                  margin:
                                    "4px 0",
                                  color:
                                    "#666",
                                }}
                              >
                                {
                                  activity.description
                                }
                              </p>
                            )}

                            <small
                              style={{
                                color:
                                  "#999",
                              }}
                            >
                              {activity.topic ||
                                "General"}

                              {" • "}

                              {formatDate(
                                activity.createdAt
                              )}
                            </small>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================
// CARD STYLE
// =====================================================

const cardStyle = {
  background: "#ffffff",
  padding: "22px",
  borderRadius: "16px",
  boxShadow:
    "0 4px 12px rgba(0,0,0,0.07)",
};

// =====================================================
// ICON STYLE
// =====================================================

const iconStyle = {
  fontSize: "30px",
};

// =====================================================
// NUMBER STYLE
// =====================================================

const numberStyle = {
  fontSize: "32px",
  fontWeight: "bold",
  margin: "8px 0 4px",
  color: "#222",
};

// =====================================================
// SMALL TEXT
// =====================================================

const smallStyle = {
  color: "#888",
  fontSize: "13px",
};

// =====================================================
// ANALYTICS MINI CARD
// =====================================================

const analyticsMiniCard = {
  background: "#f8f9ff",
  padding: "18px",
  borderRadius: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

// =====================================================
// BUTTON STYLE
// =====================================================

const buttonStyle = {
  padding: "12px 18px",
  border: "none",
  borderRadius: "8px",
  background: "#4f46e5",
  color: "white",
  fontSize: "15px",
  cursor: "pointer",
};

// =====================================================
// LOGOUT BUTTON
// =====================================================

const logoutButtonStyle = {
  padding: "11px 20px",
  border: "none",
  borderRadius: "8px",
  background: "#222",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "bold",
  cursor: "pointer",
};

export default Dashboard;