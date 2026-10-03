import { useState } from "react";

function RevisionPlanner({ weakTopics = [] }) {
  const [revisionPlan, setRevisionPlan] = useState("");
  const [generating, setGenerating] = useState(false);
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

      return null;
    } catch (error) {
      console.error(
        "Error reading user information:",
        error
      );

      return null;
    }
  };

  // =====================================================
  // GENERATE REVISION PLAN
  // =====================================================

  const generateRevisionPlan = async () => {
    try {
      setGenerating(true);
      setError("");
      setRevisionPlan("");

      // ===============================================
      // GET USER
      // ===============================================

      const userId = getUserId();

      console.log(
        "👤 Revision Planner userId:",
        userId
      );

      if (!userId) {
        setError(
          "User information not found. Please login again."
        );

        return;
      }

      // ===============================================
      // CHECK WEAK TOPICS
      // ===============================================

      if (
        !weakTopics ||
        weakTopics.length === 0
      ) {
        setError(
          "There are no topics needing attention yet."
        );

        return;
      }

      // ===============================================
      // PREPARE TOPICS
      // ===============================================

      const topicList =
        weakTopics
          .slice(0, 8)
          .map(
            (topic, index) =>
              `${index + 1}. ${topic.topic} - AI questions asked: ${topic.aiQuestions}`
          )
          .join("\n");

      // ===============================================
      // AI PROMPT
      // ===============================================

      const question = `
You are StudyVault AI, an academic revision planner.

Create a personalized 7-day revision plan using ONLY
the following topics from the student's study documents.

TOPICS NEEDING ATTENTION:

${topicList}

IMPORTANT RULES:

1. Use ONLY the topics listed above.
2. Do NOT invent additional academic topics.
3. Do NOT change the topic names.
4. Give more attention to topics with more AI questions.
5. Keep the plan suitable for a college engineering student.
6. Make the workload realistic.
7. Include concept review.
8. Include short practice.
9. Include self-testing.
10. Keep each day's workload manageable.
11. Do not use outside academic information.
12. Do not add unrelated subjects.

Create a practical 7-day revision schedule.

Use EXACTLY this structure:

## 🧠 7-Day Revision Plan

### Day 1

- Topic:
- Revision task:
- Practice task:
- Self-test:

### Day 2

- Topic:
- Revision task:
- Practice task:
- Self-test:

### Day 3

- Topic:
- Revision task:
- Practice task:
- Self-test:

### Day 4

- Topic:
- Revision task:
- Practice task:
- Self-test:

### Day 5

- Topic:
- Revision task:
- Practice task:
- Self-test:

### Day 6

- Topic:
- Revision task:
- Practice task:
- Self-test:

### Day 7

- Topic:
- Revision task:
- Practice task:
- Self-test:

### ✅ Final Revision Checklist

- Review the topics again.
- Test yourself without looking at notes.
- Identify concepts that still need revision.
- Mark completed topics.

Generate the plan now.
`;

      console.log(
        "🧠 Generating revision plan..."
      );

      console.log(
        "📤 Sending activityType:",
        "revision_plan"
      );

      // ===============================================
      // CALL LOCAL AI API
      // ===============================================

      const response = await fetch(
        "http://localhost:5001/api/ai/ask",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            userId: userId,
            question: question,
            activityType: "revision_plan",
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Revision API error:",
          errorText
        );

        throw new Error(
          "Failed to generate revision plan"
        );
      }

      const data =
        await response.json();

      console.log(
        "📚 Revision plan generated:",
        data
      );

      if (!data.answer) {
        throw new Error(
          "AI returned an empty revision plan"
        );
      }

      setRevisionPlan(data.answer);
    } catch (error) {
      console.error(
        "❌ Revision planner error:",
        error
      );

      setError(
        "Unable to generate the revision plan. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  // =====================================================
  // IF THERE ARE NO WEAK TOPICS
  // =====================================================

  if (
    !weakTopics ||
    weakTopics.length === 0
  ) {
    return null;
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        marginTop: "25px",
        background: "#ffffff",
        borderRadius: "15px",
        padding: "24px",
        border:
          "1px solid #ddd6fe",
        boxShadow:
          "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: "#4f46e5",
              fontSize: "22px",
            }}
          >
            📅 AI Revision Planner
          </h3>

          <p
            style={{
              margin:
                "7px 0 0",
              color: "#777",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            Generate a personalized
            7-day revision plan from
            your topics needing attention.
          </p>
        </div>

        <button
          onClick={
            generateRevisionPlan
          }
          disabled={generating}
          style={{
            padding:
              "12px 20px",
            border: "none",
            borderRadius: "9px",
            background:
              generating
                ? "#a5b4fc"
                : "#4f46e5",
            color: "#ffffff",
            fontWeight: "bold",
            fontSize: "14px",
            cursor:
              generating
                ? "not-allowed"
                : "pointer",
          }}
        >
          {generating
            ? "🤖 Creating..."
            : "✨ Generate Plan"}
        </button>
      </div>

      {/* =================================================
          TOPICS USED
      ================================================= */}

      <div
        style={{
          marginTop: "18px",
          padding: "14px",
          background: "#f8f7ff",
          borderRadius: "10px",
          border:
            "1px solid #e5e7eb",
        }}
      >
        <strong
          style={{
            color: "#4338ca",
          }}
        >
          Topics used for planning:
        </strong>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "10px",
          }}
        >
          {weakTopics
            .slice(0, 8)
            .map(
              (topic, index) => (
                <span
                  key={
                    topic.topic +
                    index
                  }
                  style={{
                    background:
                      "#e0e7ff",
                    color:
                      "#3730a3",
                    padding:
                      "6px 10px",
                    borderRadius:
                      "8px",
                    fontSize:
                      "12px",
                    fontWeight:
                      "bold",
                  }}
                >
                  {topic.topic}
                </span>
              )
            )}
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          style={{
            marginTop: "15px",
            padding: "12px",
            background:
              "#fee2e2",
            color: "#b91c1c",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* =================================================
          REVISION PLAN
      ================================================= */}

      {revisionPlan && (
        <div
          style={{
            marginTop: "22px",
            padding: "22px",
            background:
              "#f8f7ff",
            borderRadius: "12px",
            border:
              "1px solid #ddd6fe",
            whiteSpace:
              "pre-wrap",
            lineHeight: "1.7",
            color: "#333",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "10px",
              marginBottom:
                "15px",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#3730a3",
              }}
            >
              🧠 Your Revision Plan
            </h3>

            <span
              style={{
                background:
                  "#e0e7ff",
                color:
                  "#4338ca",
                padding:
                  "5px 10px",
                borderRadius:
                  "8px",
                fontSize:
                  "12px",
                fontWeight:
                  "bold",
              }}
            >
              Qwen AI
            </span>
          </div>

          <div
            style={{
              fontSize: "15px",
            }}
          >
            {revisionPlan}
          </div>
        </div>
      )}
    </div>
  );
}

export default RevisionPlanner;