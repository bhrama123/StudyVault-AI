import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("studyvaultUser");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    localStorage.removeItem("userInfo");

    navigate("/");
  };

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "🏠",
    },
    {
      path: "/documents",
      label: "Documents",
      icon: "📚",
    },
    {
      path: "/ai-study",
      label: "AI Study",
      icon: "🤖",
    },
    {
      path: "/quiz",
      label: "Quiz",
      icon: "📝",
    },
    {
      path: "/quiz-history",
      label: "Quiz History",
      icon: "📊",
    },
    {
      path: "/topic-progress",
      label: "Topic Progress",
      icon: "📈",
    },
    {
      path: "/revision-planner",
      label: "Revision Planner",
      icon: "📅",
    },
    {
      path: "/learning-history",
      label: "Learning History",
      icon: "🧠",
    },
  ];

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <style>
        {`
          .studyvault-navbar {
            position: sticky;
            top: 0;
            z-index: 1000;
            width: 100%;
            background: rgba(255, 255, 255, 0.97);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid #e5e7eb;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
          }

          .studyvault-nav-container {
            max-width: 1450px;
            margin: 0 auto;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            gap: 18px;
          }

          .studyvault-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 190px;
            cursor: pointer;
            user-select: none;
          }

          .studyvault-logo-icon {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
          }

          .studyvault-logo-text {
            font-size: 18px;
            font-weight: 800;
            color: #20243a;
            line-height: 1.2;
          }

          .studyvault-logo-subtext {
            font-size: 10px;
            color: #7c8498;
            margin-top: 2px;
          }

          .studyvault-nav-links {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
          }

          .studyvault-nav-link {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 9px 10px;
            border-radius: 9px;
            text-decoration: none;
            color: #596174;
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            transition: all 0.2s ease;
          }

          .studyvault-nav-link:hover {
            background: #f5f7ff;
            color: #4f46e5;
          }

          .studyvault-active-link {
            color: #4f46e5;
            background: #eef2ff;
            box-shadow: inset 0 0 0 1px #e0e7ff;
          }

          .studyvault-logout {
            border: none;
            background: #fff1f2;
            color: #dc2626;
            padding: 9px 14px;
            border-radius: 9px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
          }

          .studyvault-logout:hover {
            background: #ffe4e6;
          }

          .studyvault-menu-button {
            display: none;
            border: none;
            background: #eef2ff;
            color: #4f46e5;
            width: 42px;
            height: 42px;
            border-radius: 10px;
            font-size: 22px;
            cursor: pointer;
          }

          .studyvault-mobile-menu {
            display: none;
          }

          @media (max-width: 1200px) {
            .studyvault-nav-container {
              padding: 10px 16px;
            }

            .studyvault-nav-link {
              padding: 8px 7px;
              font-size: 12px;
            }

            .studyvault-logo {
              min-width: 170px;
            }
          }

          @media (max-width: 1000px) {
            .studyvault-nav-links,
            .studyvault-desktop-logout {
              display: none;
            }

            .studyvault-menu-button {
              display: block;
              margin-left: auto;
            }

            .studyvault-mobile-menu {
              display: flex;
              flex-direction: column;
              gap: 5px;
              padding: 10px 16px 16px;
              border-top: 1px solid #e5e7eb;
              background: white;
            }

            .studyvault-mobile-link {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 12px 14px;
              border-radius: 9px;
              text-decoration: none;
              color: #596174;
              font-size: 14px;
              font-weight: 600;
            }

            .studyvault-mobile-link:hover {
              background: #f5f7ff;
            }

            .studyvault-mobile-active {
              color: #4f46e5;
              background: #eef2ff;
            }

            .studyvault-mobile-logout {
              margin-top: 6px;
              border: none;
              background: #fff1f2;
              color: #dc2626;
              padding: 12px 14px;
              border-radius: 9px;
              text-align: left;
              font-size: 14px;
              font-weight: 700;
              cursor: pointer;
            }
          }

          @media (max-width: 600px) {
            .studyvault-nav-container {
              padding: 9px 12px;
            }

            .studyvault-logo-text {
              font-size: 16px;
            }

            .studyvault-logo-subtext {
              display: none;
            }

            .studyvault-logo-icon {
              width: 38px;
              height: 38px;
              font-size: 20px;
            }
          }
        `}
      </style>

      <nav className="studyvault-navbar">

        <div className="studyvault-nav-container">

          {/* Logo */}
          <div
            className="studyvault-logo"
            onClick={() => navigate("/dashboard")}
          >
            <div className="studyvault-logo-icon">
              🧠
            </div>

            <div>
              <div className="studyvault-logo-text">
                StudyVault AI
              </div>

              <div className="studyvault-logo-subtext">
                Smart Study Platform
              </div>
            </div>
          </div>


          {/* Desktop navigation */}
          <div className="studyvault-nav-links">

            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `studyvault-nav-link ${
                    isActive
                      ? "studyvault-active-link"
                      : ""
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}

          </div>


          {/* Desktop logout */}
          <button
            className="studyvault-logout studyvault-desktop-logout"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>


          {/* Mobile menu button */}
          <button
            className="studyvault-menu-button"
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
          >
            {menuOpen ? "✕" : "☰"}
          </button>

        </div>


        {/* Mobile navigation */}
        {menuOpen && (
          <div className="studyvault-mobile-menu">

            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `studyvault-mobile-link ${
                    isActive
                      ? "studyvault-mobile-active"
                      : ""
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}

            <button
              className="studyvault-mobile-logout"
              onClick={handleLogout}
            >
              🚪 Logout
            </button>

          </div>
        )}

      </nav>
    </>
  );
}

export default Navbar;