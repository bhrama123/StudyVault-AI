import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5001/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Account created successfully!");

        setFormData({
          name: "",
          email: "",
          password: "",
        });

        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        setMessage(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Left Section */}
      <div className="auth-brand">

        <div className="brand-logo">
          <div className="brand-icon">🧠</div>
          <span>StudyVault</span>
          <span className="brand-ai">AI</span>
        </div>

        <div className="brand-content">
          <h1>
            Build your
            <br />
            <span>academic memory.</span>
          </h1>

          <p>
            Create your personal learning space where your
            notes, questions, progress, and AI-powered
            learning come together.
          </p>

          <div className="feature-list">

            <div className="feature">
              <span>📚</span>
              <div>
                <strong>One Study Space</strong>
                <small>
                  Organize your academic materials in one place.
                </small>
              </div>
            </div>

            <div className="feature">
              <span>🧠</span>
              <div>
                <strong>Learn With AI</strong>
                <small>
                  Ask questions using your own study materials.
                </small>
              </div>
            </div>

            <div className="feature">
              <span>📊</span>
              <div>
                <strong>Track Your Progress</strong>
                <small>
                  Discover your strengths and weak topics.
                </small>
              </div>
            </div>

          </div>
        </div>

        <div className="brand-footer">
          Study smarter. Remember better. 🚀
        </div>

      </div>

      {/* Right Section */}
      <div className="auth-form-section">

        <div className="auth-card">

          <div className="mobile-logo">
            🧠 StudyVault <span>AI</span>
          </div>

          <div className="form-header">
            <h2>Create your account</h2>

            <p>
              Start building your personal academic memory.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Name */}
            <div className="form-group">

              <label htmlFor="name">
                Full name
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  👤
                </span>

                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                />

              </div>

            </div>

            {/* Email */}
            <div className="form-group">

              <label htmlFor="email">
                Email address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />

              </div>

            </div>

            {/* Password */}
            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                  minLength="6"
                />

              </div>

              <small
                style={{
                  display: "block",
                  marginTop: "7px",
                  color: "#94a3b8",
                  fontSize: "12px",
                }}
              >
                Password must contain at least 6 characters.
              </small>

            </div>

            {/* Create Account */}
            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create account"}

              {!loading && <span>→</span>}
            </button>

          </form>

          {/* Message */}
          {message && (
            <div
              className={
                message === "Account created successfully!"
                  ? "success-message"
                  : "error-message"
              }
            >
              {message === "Account created successfully!"
                ? "✓ "
                : "⚠ "}

              {message}
            </div>
          )}

          {/* Login */}
          <div className="register-section">

            <span>
              Already have an account?
            </span>

            <button
              type="button"
              onClick={() => navigate("/")}
            >
              Sign in
            </button>

          </div>

          <div className="security-note">
            🔐 Your account is securely protected.
          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;