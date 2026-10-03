import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =====================================================
  // HANDLE LOGIN
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5001/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      console.log("🔐 Login response:", data);

      if (response.ok) {
        // =================================================
        // GET USER FROM BACKEND RESPONSE
        // =================================================

        const loggedInUser = data.user;

        if (!loggedInUser) {
          console.error(
            "❌ Login successful but user data is missing"
          );

          setMessage(
            "Login successful, but user information was not received."
          );

          return;
        }

        // =================================================
        // FIND USER ID
        // =================================================

        const userId =
          loggedInUser._id ||
          loggedInUser.id ||
          loggedInUser.userId;

        console.log(
          "👤 Logged-in user:",
          loggedInUser
        );

        console.log(
          "🆔 Logged-in userId:",
          userId
        );

        // =================================================
        // CHECK USER ID
        // =================================================

        if (!userId) {
          console.error(
            "❌ No user ID found in login response"
          );

          setMessage(
            "Login successful, but user ID was not found."
          );

          return;
        }

        // =================================================
        // CLEAR OLD USER INFORMATION
        // =================================================

        localStorage.removeItem("userId");
        localStorage.removeItem("user");
        localStorage.removeItem("userInfo");
        localStorage.removeItem("studyvaultUser");

        // =================================================
        // SAVE CURRENT USER
        // =================================================

        // Direct user ID
        localStorage.setItem(
          "userId",
          userId
        );

        // Full user object
        localStorage.setItem(
          "user",
          JSON.stringify(loggedInUser)
        );

        // Compatibility with other parts of app
        localStorage.setItem(
          "userInfo",
          JSON.stringify(loggedInUser)
        );

        // Existing StudyVault storage
        localStorage.setItem(
          "studyvaultUser",
          JSON.stringify(loggedInUser)
        );

        console.log(
          "✅ User information saved successfully"
        );

        console.log(
          "✅ Stored userId:",
          localStorage.getItem("userId")
        );

        setMessage("Login successful!");

        // =================================================
        // GO TO DASHBOARD
        // =================================================

        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } else {
        setMessage(
          data.message ||
            "Invalid email or password"
        );
      }
    } catch (error) {
      console.error(
        "❌ Login error:",
        error
      );

      setMessage(
        "Cannot connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="auth-page">

      {/* =================================================
          LEFT SECTION
      ================================================= */}

      <div className="auth-brand">

        <div className="brand-logo">
          <div className="brand-icon">
            🧠
          </div>

          <span>
            StudyVault
          </span>

          <span className="brand-ai">
            AI
          </span>
        </div>


        <div className="brand-content">

          <h1>
            Your knowledge.
            <br />

            <span>
              Your advantage.
            </span>
          </h1>


          <p>
            Organize your academic materials,
            learn with AI, track your progress,
            and build your personal academic
            memory.
          </p>


          <div className="feature-list">

            {/* Academic Memory */}

            <div className="feature">

              <span>
                📚
              </span>

              <div>
                <strong>
                  Academic Memory
                </strong>

                <small>
                  Keep all your study
                  materials organized.
                </small>
              </div>

            </div>


            {/* AI Learning */}

            <div className="feature">

              <span>
                🧠
              </span>

              <div>
                <strong>
                  AI-Powered Learning
                </strong>

                <small>
                  Ask questions from your
                  own notes.
                </small>
              </div>

            </div>


            {/* Analytics */}

            <div className="feature">

              <span>
                📊
              </span>

              <div>
                <strong>
                  Learning Analytics
                </strong>

                <small>
                  Understand your strengths
                  and weak topics.
                </small>
              </div>

            </div>

          </div>

        </div>


        <div className="brand-footer">
          Study smarter. Remember better. 🚀
        </div>

      </div>


      {/* =================================================
          RIGHT SECTION
      ================================================= */}

      <div className="auth-form-section">

        <div className="auth-card">

          {/* Mobile Logo */}

          <div className="mobile-logo">
            🧠 StudyVault{" "}
            <span>
              AI
            </span>
          </div>


          {/* Form Header */}

          <div className="form-header">

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to continue your
              learning journey.
            </p>

          </div>


          {/* =================================================
              LOGIN FORM
          ================================================= */}

          <form onSubmit={handleSubmit}>

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
                  placeholder="Enter your password"
                  required
                />

              </div>

            </div>


            {/* Login Button */}

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign in"}

              {!loading && (
                <span>
                  →
                </span>
              )}
            </button>

          </form>


          {/* =================================================
              MESSAGE
          ================================================= */}

          {message && (
            <div
              className={
                message ===
                "Login successful!"
                  ? "success-message"
                  : "error-message"
              }
            >
              {message ===
              "Login successful!"
                ? "✓ "
                : "⚠ "}

              {message}
            </div>
          )}


          {/* =================================================
              REGISTER
          ================================================= */}

          <div className="register-section">

            <span>
              Don't have an account?
            </span>

            <button
              type="button"
              onClick={() =>
                navigate("/register")
              }
            >
              Create account
            </button>

          </div>


          {/* Security */}

          <div className="security-note">
            🔐 Your account is securely protected.
          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;