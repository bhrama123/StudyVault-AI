import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function LearningHistory() {
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");

  // =====================================================
  // GET USER ID
  // =====================================================

  const getUserId = () => {
    try {
      const directUserId =
        localStorage.getItem("userId");

      if (directUserId) {
        return directUserId;
      }

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

      const studyvaultUser =
        localStorage.getItem(
          "studyvaultUser"
        );

      if (studyvaultUser) {
        const user = JSON.parse(
          studyvaultUser
        );

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
  // FETCH LEARNING HISTORY
  // =====================================================

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const userId = getUserId();

      console.log(
        "👤 Learning History userId:",
        userId
      );

      if (!userId) {
        setError(
          "User information not found. Please login again."
        );

        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5001/api/learning/activity/${userId}`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load learning history"
        );
      }

      const data =
        await response.json();

      console.log(
        "📚 Learning history:",
        data
      );

      setActivities(
        data.activities || []
      );
    } catch (error) {
      console.error(
        "❌ Learning history error:",
        error
      );

      setError(
        "Unable to load your learning history."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD PAGE
  // =====================================================

  useEffect(() => {
    loadHistory();
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
  // DATE FORMAT
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "Unknown date";
    }

    return new Date(
      date
    ).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // FILTER ACTIVITIES
  // =====================================================

  const filteredActivities =
    useMemo(() => {
      if (filter === "all") {
        return activities;
      }

      return activities.filter(
        (activity) =>
          activity.activityType ===
          filter
      );
    }, [activities, filter]);

  // =====================================================
  // ACTIVITY COUNTS
  // =====================================================

  const counts = useMemo(() => {
    return {
      all: activities.length,

      ask_ai: activities.filter(
        (item) =>
          item.activityType ===
          "ask_ai"
      ).length,

      summary: activities.filter(
        (item) =>
          item.activityType ===
          "summary"
      ).length,

      notes: activities.filter(
        (item) =>
          item.activityType ===
          "notes"
      ).length,

      questions: activities.filter(
        (item) =>
          item.activityType ===
          "questions"
      ).length,

      document_upload:
        activities.filter(
          (item) =>
            item.activityType ===
            "document_upload"
        ).length,

      revision_plan:
        activities.filter(
          (item) =>
            item.activityType ===
            "revision_plan"
        ).length,
    };
  }, [activities]);

  // =====================================================
  // STUDY PROGRESS
  // =====================================================

  const studyProgress = useMemo(() => {
    const today = new Date();

    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);

      date.setDate(
        today.getDate() - i
      );

      date.setHours(
        0,
        0,
        0,
        0
      );

      const nextDate = new Date(
        date
      );

      nextDate.setDate(
        date.getDate() + 1
      );

      const dayActivities =
        activities.filter(
          (activity) => {
            const activityDate =
              new Date(
                activity.createdAt
              );

            return (
              activityDate >=
                date &&
              activityDate <
                nextDate
            );
          }
        );

      days.push({
        date,
        count:
          dayActivities.length,
      });
    }

    return days;
  }, [activities]);

  // =====================================================
  // MAX ACTIVITY FOR CHART
  // =====================================================

  const maxProgress =
    Math.max(
      ...studyProgress.map(
        (day) => day.count
      ),
      1
    );

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={loadingCardStyle}>
          <div
            style={{
              fontSize: "45px",
            }}
          >
            📊
          </div>

          <h2>
            Loading Learning History...
          </h2>

          <p>
            StudyVault AI is retrieving
            your learning activity.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>

        {/* =================================================
            HEADER
        ================================================= */}

        <div style={headerStyle}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                color: "#222",
              }}
            >
              📊 Learning History
            </h1>

            <p
              style={{
                marginTop: "8px",
                color: "#777",
              }}
            >
              See everything you have
              done in StudyVault AI.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() =>
                navigate("/dashboard")
              }
              style={secondaryButtonStyle}
            >
              ← Dashboard
            </button>

            <button
              onClick={loadHistory}
              style={primaryButtonStyle}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div style={summaryGridStyle}>

          <SummaryCard
            icon="📊"
            title="Total Activities"
            value={counts.all}
          />

          <SummaryCard
            icon="🤖"
            title="AI Questions"
            value={counts.ask_ai}
          />

          <SummaryCard
            icon="📚"
            title="Summaries"
            value={counts.summary}
          />

          <SummaryCard
            icon="📝"
            title="Study Notes"
            value={counts.notes}
          />

          <SummaryCard
            icon="❓"
            title="Question Sets"
            value={counts.questions}
          />

          <SummaryCard
            icon="📅"
            title="Revision Plans"
            value={
              counts.revision_plan
            }
          />

          <SummaryCard
            icon="📄"
            title="Documents"
            value={
              counts.document_upload
            }
          />
        </div>

        {/* =================================================
            STUDY PROGRESS
        ================================================= */}

        <div style={progressCardStyle}>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "25px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#222",
                }}
              >
                📈 Study Progress
              </h2>

              <p
                style={{
                  margin:
                    "7px 0 0",
                  color: "#777",
                }}
              >
                Your learning activity
                during the last 7 days.
              </p>
            </div>

            <div
              style={{
                background:
                  "#eef2ff",
                color:
                  "#4f46e5",
                padding:
                  "8px 13px",
                borderRadius:
                  "20px",
                fontSize:
                  "12px",
                fontWeight:
                  "bold",
              }}
            >
              Last 7 Days
            </div>
          </div>

          {/* BAR CHART */}

          <div
            style={{
              display: "flex",
              alignItems:
                "flex-end",
              justifyContent:
                "space-between",
              gap: "12px",
              height: "230px",
              padding:
                "15px 5px 0",
            }}
          >
            {studyProgress.map(
              (day, index) => {
                const height =
                  day.count === 0
                    ? 5
                    :
                      Math.max(
                        20,
                        (day.count /
                          maxProgress) *
                          170
                      );

                return (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      height:
                        "100%",
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      justifyContent:
                        "flex-end",
                      alignItems:
                        "center",
                      gap: "8px",
                    }}
                  >
                    {/* COUNT */}

                    <div
                      style={{
                        fontSize:
                          "13px",
                        fontWeight:
                          "bold",
                        color:
                          day.count >
                          0
                            ? "#4f46e5"
                            : "#aaa",
                      }}
                    >
                      {day.count}
                    </div>

                    {/* BAR */}

                    <div
                      style={{
                        width:
                          "100%",
                        maxWidth:
                          "65px",
                        height:
                          `${height}px`,
                        background:
                          day.count >
                          0
                            ? "#6366f1"
                            : "#e5e7eb",
                        borderRadius:
                          "9px 9px 3px 3px",
                        transition:
                          "height 0.3s ease",
                      }}
                    />

                    {/* DAY */}

                    <div
                      style={{
                        fontSize:
                          "11px",
                        color:
                          "#777",
                        fontWeight:
                          "bold",
                      }}
                    >
                      {day.date.toLocaleDateString(
                        "en-IN",
                        {
                          weekday:
                            "short",
                        }
                      )}
                    </div>

                    {/* DATE */}

                    <div
                      style={{
                        fontSize:
                          "10px",
                        color:
                          "#aaa",
                      }}
                    >
                      {day.date.getDate()}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div style={filterCardStyle}>
          <h2
            style={{
              marginTop: 0,
              marginBottom:
                "18px",
            }}
          >
            🔎 Filter Activity
          </h2>

          <div
            style={{
              display:
                "flex",
              gap: "10px",
              flexWrap:
                "wrap",
            }}
          >
            <FilterButton
              label={`All (${counts.all})`}
              active={
                filter === "all"
              }
              onClick={() =>
                setFilter("all")
              }
            />

            <FilterButton
              label={`🤖 AI Questions (${counts.ask_ai})`}
              active={
                filter === "ask_ai"
              }
              onClick={() =>
                setFilter(
                  "ask_ai"
                )
              }
            />

            <FilterButton
              label={`📚 Summaries (${counts.summary})`}
              active={
                filter ===
                "summary"
              }
              onClick={() =>
                setFilter(
                  "summary"
                )
              }
            />

            <FilterButton
              label={`📝 Notes (${counts.notes})`}
              active={
                filter === "notes"
              }
              onClick={() =>
                setFilter("notes")
              }
            />

            <FilterButton
              label={`❓ Questions (${counts.questions})`}
              active={
                filter ===
                "questions"
              }
              onClick={() =>
                setFilter(
                  "questions"
                )
              }
            />

            <FilterButton
              label={`📅 Revision Plans (${counts.revision_plan})`}
              active={
                filter ===
                "revision_plan"
              }
              onClick={() =>
                setFilter(
                  "revision_plan"
                )
              }
            />

            <FilterButton
              label={`📄 Documents (${counts.document_upload})`}
              active={
                filter ===
                "document_upload"
              }
              onClick={() =>
                setFilter(
                  "document_upload"
                )
              }
            />
          </div>
        </div>

        {/* =================================================
            ACTIVITY TIMELINE
        ================================================= */}

        <div style={historyCardStyle}>

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "10px",
              flexWrap:
                "wrap",
              marginBottom:
                "20px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                🕒 Activity Timeline
              </h2>

              <p
                style={{
                  marginTop:
                    "6px",
                  color:
                    "#777",
                }}
              >
                Showing{" "}
                <strong>
                  {
                    filteredActivities.length
                  }
                </strong>{" "}
                activities
              </p>
            </div>

            <div
              style={{
                background:
                  "#eef2ff",
                color:
                  "#4f46e5",
                padding:
                  "8px 13px",
                borderRadius:
                  "20px",
                fontWeight:
                  "bold",
                fontSize:
                  "13px",
              }}
            >
              Latest activity first
            </div>
          </div>

          {filteredActivities.length ===
          0 ? (
            <div
              style={{
                textAlign:
                  "center",
                padding:
                  "50px 20px",
                color:
                  "#777",
              }}
            >
              <div
                style={{
                  fontSize:
                    "50px",
                  marginBottom:
                    "10px",
                }}
              >
                📭
              </div>

              <h3>
                No activities found
              </h3>

              <p>
                Start studying with
                StudyVault AI and
                your activity will
                appear here.
              </p>
            </div>
          ) : (
            <div>
              {filteredActivities.map(
                (
                  activity,
                  index
                ) => (
                  <div
                    key={
                      activity._id ||
                      index
                    }
                    style={{
                      display:
                        "flex",
                      gap:
                        "18px",
                      padding:
                        "20px 0",
                      borderBottom:
                        index ===
                        filteredActivities.length -
                          1
                          ? "none"
                          : "1px solid #eee",
                    }}
                  >
                    {/* ICON */}

                    <div
                      style={{
                        width:
                          "52px",
                        height:
                          "52px",
                        borderRadius:
                          "14px",
                        background:
                          "#f3f4ff",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        fontSize:
                          "25px",
                        flexShrink:
                          0,
                      }}
                    >
                      {getActivityIcon(
                        activity.activityType
                      )}
                    </div>

                    {/* CONTENT */}

                    <div
                      style={{
                        flex: 1,
                        minWidth:
                          0,
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap:
                            "15px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <h3
                          style={{
                            margin:
                              "0 0 6px",
                            color:
                              "#222",
                            fontSize:
                              "17px",
                          }}
                        >
                          {getActivityTitle(
                            activity
                          )}
                        </h3>

                        <span
                          style={{
                            color:
                              "#999",
                            fontSize:
                              "12px",
                          }}
                        >
                          {formatDate(
                            activity.createdAt
                          )}
                        </span>
                      </div>

                      {activity.description && (
                        <p
                          style={{
                            margin:
                              "5px 0 8px",
                            color:
                              "#666",
                            lineHeight:
                              "1.5",
                            wordBreak:
                              "break-word",
                          }}
                        >
                          {
                            activity.description
                          }
                        </p>
                      )}

                      <div
                        style={{
                          display:
                            "flex",
                          gap:
                            "8px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <span
                          style={{
                            background:
                              "#f3f4f6",
                            color:
                              "#555",
                            padding:
                              "5px 9px",
                            borderRadius:
                              "7px",
                            fontSize:
                              "11px",
                            fontWeight:
                              "bold",
                          }}
                        >
                          {activity.topic ||
                            "General"}
                        </span>

                        <span
                          style={{
                            background:
                              "#eef2ff",
                            color:
                              "#4f46e5",
                            padding:
                              "5px 9px",
                            borderRadius:
                              "7px",
                            fontSize:
                              "11px",
                            fontWeight:
                              "bold",
                          }}
                        >
                          {
                            activity.activityType
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          style={{
            marginTop:
              "20px",
            background:
              "#ffffff",
            padding:
              "18px",
            borderRadius:
              "14px",
            color:
              "#777",
            fontSize:
              "13px",
            boxShadow:
              "0 3px 10px rgba(0,0,0,0.05)",
          }}
        >
          💡{" "}
          <strong>
            StudyVault AI:
          </strong>{" "}
          Your learning history records
          your interactions with documents,
          AI, study notes, practice questions,
          and revision planning.
        </div>
      </div>
    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  icon,
  title,
  value,
}) {
  return (
    <div
      style={{
        background:
          "#ffffff",
        padding:
          "20px",
        borderRadius:
          "15px",
        boxShadow:
          "0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          fontSize:
            "28px",
          marginBottom:
            "10px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize:
            "30px",
          fontWeight:
            "bold",
          color:
            "#222",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop:
            "5px",
          color:
            "#777",
          fontSize:
            "13px",
        }}
      >
        {title}
      </div>
    </div>
  );
}

// =====================================================
// FILTER BUTTON
// =====================================================

function FilterButton({
  label,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:
          "10px 14px",
        borderRadius:
          "9px",
        border: active
          ? "1px solid #4f46e5"
          : "1px solid #ddd",
        background:
          active
            ? "#4f46e5"
            : "#ffffff",
        color:
          active
            ? "#ffffff"
            : "#444",
        fontWeight:
          active
            ? "bold"
            : "normal",
        cursor:
          "pointer",
        fontSize:
          "13px",
      }}
    >
      {label}
    </button>
  );
}

// =====================================================
// STYLES
// =====================================================

const pageStyle = {
  minHeight:
    "100vh",
  background:
    "linear-gradient(135deg, #f5f7ff, #eef2ff)",
  padding:
    "30px",
  fontFamily:
    "Arial, sans-serif",
};

const containerStyle = {
  maxWidth:
    "1200px",
  margin:
    "0 auto",
};

const headerStyle = {
  background:
    "#ffffff",
  padding:
    "28px",
  borderRadius:
    "18px",
  boxShadow:
    "0 4px 15px rgba(0,0,0,0.08)",
  marginBottom:
    "25px",
  display:
    "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
  gap:
    "20px",
  flexWrap:
    "wrap",
};

const summaryGridStyle = {
  display:
    "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap:
    "18px",
  marginBottom:
    "25px",
};

const progressCardStyle = {
  background:
    "#ffffff",
  padding:
    "28px",
  borderRadius:
    "18px",
  boxShadow:
    "0 4px 15px rgba(0,0,0,0.08)",
  marginBottom:
    "25px",
};

const filterCardStyle = {
  background:
    "#ffffff",
  padding:
    "25px",
  borderRadius:
    "18px",
  boxShadow:
    "0 4px 15px rgba(0,0,0,0.08)",
  marginBottom:
    "25px",
};

const historyCardStyle = {
  background:
    "#ffffff",
  padding:
    "28px",
  borderRadius:
    "18px",
  boxShadow:
    "0 4px 15px rgba(0,0,0,0.08)",
};

const primaryButtonStyle = {
  padding:
    "11px 18px",
  border:
    "none",
  borderRadius:
    "8px",
  background:
    "#4f46e5",
  color:
    "#ffffff",
  fontWeight:
    "bold",
  cursor:
    "pointer",
};

const secondaryButtonStyle = {
  padding:
    "11px 18px",
  border:
    "1px solid #ddd",
  borderRadius:
    "8px",
  background:
    "#ffffff",
  color:
    "#444",
  fontWeight:
    "bold",
  cursor:
    "pointer",
};

const errorStyle = {
  background:
    "#fee2e2",
  color:
    "#b91c1c",
  padding:
    "14px",
  borderRadius:
    "10px",
  marginBottom:
    "20px",
};

const loadingCardStyle = {
  maxWidth:
    "600px",
  margin:
    "100px auto",
  background:
    "#ffffff",
  padding:
    "50px",
  borderRadius:
    "18px",
  textAlign:
    "center",
  boxShadow:
    "0 4px 15px rgba(0,0,0,0.08)",
};

export default LearningHistory;