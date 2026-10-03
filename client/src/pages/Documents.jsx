import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Documents.css";

function Documents() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("studyvaultUser")
  );

  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  const [deletingId, setDeletingId] = useState(null);

  // ===============================
  // FETCH USER DOCUMENTS
  // ===============================

  const fetchDocuments = async () => {
    if (!user) {
      setLoadingDocuments(false);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5001/api/documents/${user.id}`
      );

      const data = await response.json();

      if (response.ok) {
        setDocuments(data.documents || []);
      } else {
        console.error(
          "Failed to fetch documents:",
          data.message
        );
      }
    } catch (error) {
      console.error(
        "Error fetching documents:",
        error
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // ===============================
  // FILE SELECTION
  // ===============================

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setMessage("❌ Please select a PDF file.");
      setFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setMessage(
        "❌ File size must be less than 10 MB."
      );
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setMessage("");
  };

  // ===============================
  // UPLOAD DOCUMENT
  // ===============================

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage("❌ Please select a PDF.");
      return;
    }

    if (!user) {
      setMessage("❌ Please login again.");
      return;
    }

    setLoading(true);
    setMessage("Uploading document...");

    try {
      const formData = new FormData();

      formData.append("document", file);
      formData.append("subject", subject);
      formData.append("userId", user.id);

      const response = await fetch(
        "http://localhost:5001/api/documents/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "✅ Document uploaded successfully!"
        );

        setFile(null);
        setSubject("");

        const fileInput =
          document.getElementById(
            "documentFile"
          );

        if (fileInput) {
          fileInput.value = "";
        }

        fetchDocuments();
      } else {
        setMessage(
          `❌ ${data.message}`
        );
      }
    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      setMessage(
        "❌ Cannot connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // OPEN DOCUMENT
  // ===============================

  const openDocument = (documentId) => {
    navigate(
      `/documents/${documentId}`
    );
  };

  // ===============================
  // DELETE DOCUMENT
  // ===============================

  const deleteDocument = async (
    documentId,
    documentName
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${documentName}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(documentId);

    try {
      const response = await fetch(
        `http://localhost:5001/api/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setDocuments((currentDocuments) =>
          currentDocuments.filter(
            (doc) =>
              doc._id !== documentId
          )
        );

        setMessage(
          "✅ Document deleted successfully!"
        );
      } else {
        setMessage(
          `❌ ${data.message}`
        );
      }
    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      setMessage(
        "❌ Cannot connect to server."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="documents-page">

      {/* ===============================
          HEADER
      =============================== */}

      <div className="documents-header">

        <div>
          <h1>
            📚 My Documents
          </h1>

          <p>
            Upload your study materials
            and build your academic memory.
          </p>
        </div>

        <button
          className="back-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Dashboard
        </button>

      </div>


      {/* ===============================
          UPLOAD CARD
      =============================== */}

      <div className="upload-card">

        <div className="upload-icon">
          📄
        </div>

        <h2>
          Upload Study Material
        </h2>

        <p className="upload-description">
          Upload your lecture notes,
          textbooks, question papers,
          or other academic PDFs.
        </p>

        <form
          onSubmit={handleUpload}
        >

          <label className="file-label">
            Select PDF

            <input
              id="documentFile"
              type="file"
              accept=".pdf,application/pdf"
              onChange={
                handleFileChange
              }
            />
          </label>


          {file && (
            <div className="selected-file">

              📄

              <div>
                <strong>
                  {file.name}
                </strong>

                <small>
                  {(
                    file.size /
                    (1024 * 1024)
                  ).toFixed(2)}{" "}
                  MB
                </small>
              </div>

            </div>
          )}


          <label className="subject-label">
            Subject
          </label>

          <select
            value={subject}
            onChange={(e) =>
              setSubject(
                e.target.value
              )
            }
          >

            <option value="">
              Select a subject
            </option>

            <option value="Computer Networks">
              Computer Networks
            </option>

            <option value="Theory of Computation">
              Theory of Computation
            </option>

            <option value="Database Management Systems">
              Database Management Systems
            </option>

            <option value="Operating Systems">
              Operating Systems
            </option>

            <option value="Java">
              Java
            </option>

            <option value="Other">
              Other
            </option>

          </select>


          <button
            className="upload-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Uploading..."
              : "Upload Document →"}
          </button>

        </form>


        {message && (
          <div
            className={
              message.startsWith("✅")
                ? "upload-success"
                : "upload-error"
            }
          >
            {message}
          </div>
        )}


        <div className="upload-info">

          <span>
            PDF only
          </span>

          <span>
            •
          </span>

          <span>
            Maximum 10 MB
          </span>

        </div>

      </div>


      {/* ===============================
          DOCUMENT LIST
      =============================== */}

      <div className="documents-list">

        <div className="documents-list-header">

          <div>

            <h2>
              📂 Uploaded Documents
            </h2>

            <p>
              Your saved study materials
            </p>

          </div>

          <span className="document-count">

            {documents.length}{" "}

            document
            {documents.length !== 1
              ? "s"
              : ""}

          </span>

        </div>


        {loadingDocuments ? (

          <div className="empty-documents">
            Loading documents...
          </div>

        ) : documents.length === 0 ? (

          <div className="empty-documents">

            <div className="empty-icon">
              📭
            </div>

            <h3>
              No documents yet
            </h3>

            <p>
              Upload your first study
              material above.
            </p>

          </div>

        ) : (

          <div className="document-grid">

            {documents.map(
              (doc) => (

                <div
                  className="document-card"
                  key={doc._id}
                >

                  <div className="document-card-icon">
                    📄
                  </div>


                  <div className="document-card-content">

                    <h3
                      className="document-name-clickable"
                      onClick={() =>
                        openDocument(
                          doc._id
                        )
                      }
                      title="Click to view document"
                    >
                      {doc.originalName}
                    </h3>


                    <p className="document-subject">
                      📚 {doc.subject}
                    </p>


                    <p className="document-text">
                      📝{" "}
                      {doc.extractedText
                        ? doc.extractedText.length
                        : 0}{" "}
                      characters extracted
                    </p>


                    <p className="document-date">
                      Uploaded{" "}
                      {new Date(
                        doc.uploadedAt
                      ).toLocaleDateString()}
                    </p>


                    <div className="document-actions">

                      <button
                        className="view-document-button"
                        onClick={() =>
                          openDocument(
                            doc._id
                          )
                        }
                      >
                        View Document →
                      </button>

                      <button
                        className="delete-document-button"
                        onClick={() =>
                          deleteDocument(
                            doc._id,
                            doc.originalName
                          )
                        }
                        disabled={
                          deletingId ===
                          doc._id
                        }
                      >
                        {deletingId === doc._id
                          ? "Deleting..."
                          : "🗑️ Delete"}
                      </button>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}

export default Documents;