// ===============================
// LOAD ENVIRONMENT VARIABLES FIRST
// ===============================

require("dotenv").config({
  path: "./config.env",
});

// ===============================
// IMPORT PACKAGES
// ===============================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ===============================
// IMPORT ROUTES
// ===============================

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const aiRoutes = require("./routes/aiRoutes");
const learningRoutes = require("./routes/learningRoutes");
const topicRoutes = require("./routes/topicRoutes");
const quizRoutes = require("./routes/quizRoutes");

// ===============================
// CREATE EXPRESS APP
// ===============================

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());

app.use(express.json());

// ===============================
// API ROUTES
// ===============================

app.use("/api/auth", authRoutes);

app.use("/api/documents", documentRoutes);

app.use("/api/ai", aiRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/quiz", quizRoutes);
// ===============================
// TEST ROUTE
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "StudyVault AI backend is running 🚀",
  });
});

// ===============================
// MONGODB CONNECTION
// ===============================

mongoose
  .connect(process.env.MONGO_URI)

  .then(() => {
    console.log("MongoDB connected successfully ✅");

    // ===============================
    // START SERVER
    // ===============================

    const PORT = process.env.PORT || 5001;

    app.listen(PORT, () => {
      console.log(
        `StudyVault AI server running on http://localhost:${PORT}`
      );
    });
  })

  .catch((error) => {
    console.error(
      "MongoDB connection failed ❌"
    );

    console.error(
      error.message
    );
  });