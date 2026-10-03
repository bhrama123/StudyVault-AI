import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Documents.css";

function DocumentViewer() {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/documents/view/${documentId}`
        );

        const data = await response.json();

        if (response.ok) {
          setDocument(data.document);
        } else {
          setError(data.message || "Document not found");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        setError("Cannot connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  const openAI = () => {
    navigate(`/ai-study?documentId=${documentId}`);
  };

  if (loading) {
    return (
      <div className="documents-page">
        <div className="document-viewer-card">
          <h2>Loading document...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="documents-page">
        <div className="document-viewer-card">
          <h2>❌ {error}</h2>

          <button
            className="back-button"
            onClick={() => navigate("/documents")}
          >
            ← Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="documents-page">

      <div className="documents-header">
        <div>
          <h1>📄 {document.originalName}</h1>

          <p>
            📚 {document.subject} •{" "}
            {document.extractedText.length} characters extracted
          </p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/documents")}
        >
          ← My Documents
        </button>
      </div>

      <div className="document-viewer-card">

        <div className="viewer-header">
          <div>
            <h2>📖 Extracted Text</h2>

            <p>
              Text extracted from your uploaded PDF.
            </p>
          </div>

          <span className="text-count">
            {document.extractedText.length} characters
          </span>
        </div>

        {/* AI BUTTON */}

        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={openAI}
            style={{
              background:
                "linear-gradient(135deg, #6c5ce7, #8e44ad)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "12px 20px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow:
                "0 4px 12px rgba(108, 92, 231, 0.25)",
            }}
          >
            🤖 Ask AI About This Document
          </button>
        </div>

        <div className="extracted-text">
          {document.extractedText ? (
            <pre>{document.extractedText}</pre>
          ) : (
            <div className="no-text">
              <div>📭</div>

              <h3>No text extracted</h3>

              <p>
                This PDF may contain scanned images
                instead of selectable text.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default DocumentViewer;