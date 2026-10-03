import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./AIStudyAssistant.css";

function AIStudyAssistant() {
  const [searchParams] = useSearchParams();

  const documentId = searchParams.get("documentId");


  // =====================================================
  // GET LOGGED-IN USER ID
  // =====================================================

  const getUserId = () => {
    try {
      // Option 1:
      // localStorage.setItem("userId", "...")
      const directUserId =
        localStorage.getItem("userId");

      if (directUserId) {
        return directUserId;
      }


      // Option 2:
      // localStorage.setItem("user", JSON.stringify({...}))
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


      // Option 3:
      // localStorage.setItem("userInfo", JSON.stringify({...}))
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

    } catch (error) {

      console.error(
        "Error reading user information:",
        error
      );
    }

    return null;
  };


  // =====================================================
  // STATE
  // =====================================================

  const [question, setQuestion] = useState("");

  const [answer, setAnswer] = useState("");

  const [summary, setSummary] = useState("");

  const [notes, setNotes] = useState("");

  const [questions, setQuestions] =
    useState("");


  const [loading, setLoading] =
    useState(false);

  const [summaryLoading, setSummaryLoading] =
    useState(false);

  const [notesLoading, setNotesLoading] =
    useState(false);

  const [questionsLoading, setQuestionsLoading] =
    useState(false);


  const [error, setError] =
    useState("");

  const [summaryError, setSummaryError] =
    useState("");

  const [notesError, setNotesError] =
    useState("");

  const [questionsError, setQuestionsError] =
    useState("");


  // =====================================================
  // ASK AI
  // =====================================================

  const askAI = async () => {

    if (!question.trim()) {
      return;
    }


    setLoading(true);

    setAnswer("");

    setError("");


    try {

      const userId =
        getUserId();


      console.log(
        "👤 User ID:",
        userId
      );


      const response =
        await fetch(
          "http://localhost:5001/api/ai/ask",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              question:
                question,

              documentId:
                documentId,

              userId:
                userId,
            }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
            "AI request failed"
        );
      }


      setAnswer(
        data.answer
      );

    } catch (error) {

      console.error(
        "AI error:",
        error
      );


      setError(
        "Unable to get an AI response. Please make sure the backend and Ollama are running."
      );

    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // SUMMARIZE DOCUMENT
  // =====================================================

  const summarizeDocument =
    async () => {

      if (!documentId) {

        setSummaryError(
          "Please open AI from a document."
        );

        return;
      }


      setSummaryLoading(true);

      setSummary("");

      setSummaryError("");

      setError("");


      try {

        const userId =
          getUserId();


        const response =
          await fetch(
            "http://localhost:5001/api/ai/summarize",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                documentId:
                  documentId,

                userId:
                  userId,
              }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
              "Summary generation failed"
          );
        }


        setSummary(
          data.summary
        );

      } catch (error) {

        console.error(
          "Summary error:",
          error
        );


        setSummaryError(
          "Unable to generate the summary. Please make sure the backend and Ollama are running."
        );

      } finally {

        setSummaryLoading(false);

      }
    };


  // =====================================================
  // GENERATE STUDY NOTES
  // =====================================================

  const generateNotes =
    async () => {

      if (!documentId) {

        setNotesError(
          "Please open AI from a document."
        );

        return;
      }


      setNotesLoading(true);

      setNotes("");

      setNotesError("");

      setError("");


      try {

        const userId =
          getUserId();


        const response =
          await fetch(
            "http://localhost:5001/api/ai/notes",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                documentId:
                  documentId,

                userId:
                  userId,
              }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
              "Study notes generation failed"
          );
        }


        setNotes(
          data.notes
        );

      } catch (error) {

        console.error(
          "Notes error:",
          error
        );


        setNotesError(
          "Unable to generate study notes. Please make sure the backend and Ollama are running."
        );

      } finally {

        setNotesLoading(false);

      }
    };


  // =====================================================
  // GENERATE QUESTIONS
  // =====================================================

  const generateQuestions =
    async () => {

      if (!documentId) {

        setQuestionsError(
          "Please open AI from a document."
        );

        return;
      }


      setQuestionsLoading(true);

      setQuestions("");

      setQuestionsError("");

      setError("");


      try {

        const userId =
          getUserId();


        const response =
          await fetch(
            "http://localhost:5001/api/ai/questions",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                documentId:
                  documentId,

                userId:
                  userId,
              }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
              "Question generation failed"
          );
        }


        setQuestions(
          data.questions
        );

      } catch (error) {

        console.error(
          "Questions error:",
          error
        );


        setQuestionsError(
          "Unable to generate questions. Please make sure the backend and Ollama are running."
        );

      } finally {

        setQuestionsLoading(false);

      }
    };


  // =====================================================
  // ENTER KEY
  // =====================================================

  const handleKeyDown =
    (event) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        askAI();
      }
    };


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="ai-page">

      {/* ================= HEADER ================= */}

      <div className="ai-header">

        <div>

          <h1>
            🤖 AI Study Assistant
          </h1>

          <p>
            {documentId
              ? "Study smarter using your uploaded document."
              : "Ask questions and get explanations from your local AI study assistant."
            }
          </p>

        </div>

      </div>


      {/* ================= DOCUMENT BANNER ================= */}

      {documentId && (

        <div
          style={{
            background:
              "#f3f0ff",

            border:
              "1px solid #ddd6fe",

            borderRadius:
              "10px",

            padding:
              "12px 16px",

            marginBottom:
              "20px",

            color:
              "#5b21b6",

            fontWeight:
              "600",
          }}
        >

          📄 AI is using your uploaded document

        </div>

      )}


      {/* =====================================================
          AI DOCUMENT TOOLS
      ===================================================== */}

      {documentId && (

        <div
          className="ai-card"
          style={{
            marginBottom:
              "20px",
          }}
        >

          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap:
                "15px",

              flexWrap:
                "wrap",
            }}
          >

            {/* LEFT */}

            <div>

              <h2
                style={{
                  margin:
                    "0 0 6px",
                }}
              >
                📚 Document Study Tools
              </h2>

              <p
                style={{
                  margin:
                    "0",

                  color:
                    "#6b7280",
                }}
              >
                Generate AI-powered study material from your document.
              </p>

            </div>


            {/* BUTTONS */}

            <div
              style={{
                display:
                  "flex",

                gap:
                  "10px",

                flexWrap:
                  "wrap",
              }}
            >

              {/* SUMMARY */}

              <button
                onClick={
                  summarizeDocument
                }

                disabled={
                  summaryLoading ||
                  notesLoading ||
                  questionsLoading
                }

                style={{
                  background:
                    "linear-gradient(135deg, #6c5ce7, #8e44ad)",

                  color:
                    "white",

                  border:
                    "none",

                  borderRadius:
                    "10px",

                  padding:
                    "12px 18px",

                  fontSize:
                    "14px",

                  fontWeight:
                    "600",

                  cursor:
                    summaryLoading ||
                    notesLoading ||
                    questionsLoading
                      ? "not-allowed"
                      : "pointer",

                  opacity:
                    summaryLoading ||
                    notesLoading ||
                    questionsLoading
                      ? 0.7
                      : 1,

                  boxShadow:
                    "0 4px 12px rgba(108, 92, 231, 0.25)",
                }}
              >

                {summaryLoading
                  ? "🧠 Generating..."
                  : "✨ Summarize"}

              </button>


              {/* NOTES */}

              <button
                onClick={
                  generateNotes
                }

                disabled={
                  notesLoading ||
                  summaryLoading ||
                  questionsLoading
                }

                style={{
                  background:
                    "linear-gradient(135deg, #00b894, #00cec9)",

                  color:
                    "white",

                  border:
                    "none",

                  borderRadius:
                    "10px",

                  padding:
                    "12px 18px",

                  fontSize:
                    "14px",

                  fontWeight:
                    "600",

                  cursor:
                    notesLoading ||
                    summaryLoading ||
                    questionsLoading
                      ? "not-allowed"
                      : "pointer",

                  opacity:
                    notesLoading ||
                    summaryLoading ||
                    questionsLoading
                      ? 0.7
                      : 1,

                  boxShadow:
                    "0 4px 12px rgba(0, 184, 148, 0.25)",
                }}
              >

                {notesLoading
                  ? "📝 Creating..."
                  : "📝 Generate Notes"}

              </button>


              {/* QUESTIONS */}

              <button
                onClick={
                  generateQuestions
                }

                disabled={
                  questionsLoading ||
                  summaryLoading ||
                  notesLoading
                }

                style={{
                  background:
                    "linear-gradient(135deg, #ff7675, #e84393)",

                  color:
                    "white",

                  border:
                    "none",

                  borderRadius:
                    "10px",

                  padding:
                    "12px 18px",

                  fontSize:
                    "14px",

                  fontWeight:
                    "600",

                  cursor:
                    questionsLoading ||
                    summaryLoading ||
                    notesLoading
                      ? "not-allowed"
                      : "pointer",

                  opacity:
                    questionsLoading ||
                    summaryLoading ||
                    notesLoading
                      ? 0.7
                      : 1,

                  boxShadow:
                    "0 4px 12px rgba(232, 67, 147, 0.25)",
                }}
              >

                {questionsLoading
                  ? "❓ Generating..."
                  : "❓ Generate Questions"}

              </button>

            </div>

          </div>

        </div>

      )}


      {/* ================= SUMMARY ERROR ================= */}

      {summaryError && (

        <div className="ai-error">

          ❌ {summaryError}

        </div>

      )}


      {/* ================= NOTES ERROR ================= */}

      {notesError && (

        <div className="ai-error">

          ❌ {notesError}

        </div>

      )}


      {/* ================= QUESTIONS ERROR ================= */}

      {questionsError && (

        <div className="ai-error">

          ❌ {questionsError}

        </div>

      )}


      {/* =====================================================
          SUMMARY RESULT
      ===================================================== */}

      {summary && (

        <div
          className="ai-answer-card"
          style={{
            marginBottom:
              "25px",
          }}
        >

          <div className="answer-header">

            <h2>
              📚 Study Summary
            </h2>

            <span>
              Qwen 2.5 7B
            </span>

          </div>

          <div className="answer-content">

            {summary}

          </div>

        </div>

      )}


      {/* =====================================================
          NOTES RESULT
      ===================================================== */}

      {notes && (

        <div
          className="ai-answer-card"
          style={{
            marginBottom:
              "25px",
          }}
        >

          <div className="answer-header">

            <h2>
              📝 Study Notes
            </h2>

            <span>
              Qwen 2.5 7B
            </span>

          </div>

          <div className="answer-content">

            {notes}

          </div>

        </div>

      )}


      {/* =====================================================
          QUESTIONS RESULT
      ===================================================== */}

      {questions && (

        <div
          className="ai-answer-card"
          style={{
            marginBottom:
              "25px",
          }}
        >

          <div className="answer-header">

            <h2>
              ❓ Practice Questions
            </h2>

            <span>
              Qwen 2.5 7B
            </span>

          </div>

          <div className="answer-content">

            {questions}

          </div>

        </div>

      )}


      {/* =====================================================
          ASK AI CARD
      ===================================================== */}

      <div className="ai-card">

        <label htmlFor="question">

          Ask your question

        </label>


        <textarea
          id="question"

          value={question}

          onChange={(event) =>
            setQuestion(
              event.target.value
            )
          }

          onKeyDown={
            handleKeyDown
          }

          placeholder={
            documentId
              ? "Example: What is classification of digital data?"
              : "Example: Explain TCP three-way handshake in simple words..."
          }

          rows="5"
        />


        <div className="ai-actions">

          <span className="keyboard-hint">

            Press Enter to ask

          </span>


          <button
            onClick={askAI}

            disabled={
              loading ||
              !question.trim()
            }
          >

            {loading
              ? "🤔 Thinking..."
              : "✨ Ask AI"}

          </button>

        </div>

      </div>


      {/* ================= ASK ERROR ================= */}

      {error && (

        <div className="ai-error">

          ❌ {error}

        </div>

      )}


      {/* =====================================================
          AI ANSWER
      ===================================================== */}

      {answer && (

        <div className="ai-answer-card">

          <div className="answer-header">

            <h2>
              💡 AI Answer
            </h2>

            <span>
              Qwen 2.5 7B
            </span>

          </div>

          <div className="answer-content">

            {answer}

          </div>

        </div>

      )}

    </div>

  );
}

export default AIStudyAssistant;