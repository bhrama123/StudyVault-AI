import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import DocumentViewer from "./pages/DocumentViewer";
import AIStudyAssistant from "./pages/AIStudyAssistant";
import LearningHistory from "./pages/LearningHistory";
import TopicProgress from "./pages/TopicProgress";
import Quiz from "./pages/Quiz";
import QuizHistory from "./pages/QuizHistory";
import RevisionPlanner from "./pages/RevisionPlanner";

import Navbar from "./Navbar";


// =====================================================
// MAIN LAYOUT
// =====================================================

function MainLayout() {
  return (
    <>
      <Navbar />

      <main>
        <Outlet />
      </main>
    </>
  );
}


// =====================================================
// APP
// =====================================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ============================================
            AUTHENTICATION
        ============================================ */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* ============================================
            MAIN APPLICATION
        ============================================ */}

        <Route
          element={<MainLayout />}
        >

          {/* Dashboard */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />


          {/* Documents */}

          <Route
            path="/documents"
            element={<Documents />}
          />

          <Route
            path="/documents/:documentId"
            element={<DocumentViewer />}
          />


          {/* AI Study */}

          <Route
            path="/ai-study"
            element={<AIStudyAssistant />}
          />


          {/* Quiz */}

          <Route
            path="/quiz"
            element={<Quiz />}
          />

          <Route
            path="/quiz-history"
            element={<QuizHistory />}
          />


          {/* Topic Progress */}

          <Route
            path="/topic-progress"
            element={<TopicProgress />}
          />


          {/* Revision Planner */}

          <Route
            path="/revision-planner"
            element={<RevisionPlanner />}
          />


          {/* Learning History */}

          <Route
            path="/learning-history"
            element={<LearningHistory />}
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}


export default App;