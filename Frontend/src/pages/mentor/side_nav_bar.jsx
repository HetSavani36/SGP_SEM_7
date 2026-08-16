import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import mentorLogo from "../../assets/images/H_logo.png"; // Change if you have a different logo
import "../../dashboard.css";

import logoutIcon from "../../assets/icons/logout.png";
import gridIcon from "../../assets/icons/grid.png";
import listIcon from "../../assets/icons/list.png";
import exportIcon from "../../assets/icons/export.png";

// Helper for dynamic initials
function getInitials(name) {
  if (!name) return "MN";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function MentorSideNavBar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // 👉 ADDED FALLBACK URL 
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  
  const [mentor, setMentor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log(`👉 Mentor Nav Fetching: ${apiUrl}/api/auth/me`);
        const res = await fetch(`${apiUrl}/api/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          console.log("👉 Mentor Nav Data:", data);
          setMentor(data.data || data.user || data);
        } else {
          console.error("👉 Mentor Nav: Not authenticated! Redirecting to login...");
          navigate("/login");
        }
      } catch (error) {
        console.error("👉 Mentor Nav: Failed to fetch user:", error);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate, apiUrl]);

  const handleLogout = async (e) => {
    e.stopPropagation();
    try {
        const res = await fetch(`${apiUrl}/api/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (res.ok) {
            navigate("/login");
        } else {
            alert("Logout failed");
        }
    } catch (error) {
        console.error("Logout error", error);
    }
  };

  const navClass = ({ isActive }) =>
    isActive ? "nav-item nav-item-active" : "nav-item";

  // 2. Prevent crash: Show loading or return null until data exists
  if (isLoading) {
    return <div className="dashboard-loading">Loading Mentor Portal...</div>;
  }

  // Safety check: If loading finished but mentor is still null
  if (!mentor) return null; 

  return (
    <div
      className={`dashboard-root ${
        sidebarOpen ? "sidebar-open" : "sidebar-closed"
      }`}
    >
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={mentorLogo} alt="Mentor logo" />
            <div className="sidebar-company-meta">
              {/* Safe access to data */}
              <span className="sidebar-company-name">{mentor.name || "Mentor"}</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-toggle-btn inside"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            ☰
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/mentor/dashboard" end className={navClass}>
            <img src={gridIcon} alt="" className="nav-icon" />
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink to="/mentor/approvals" className={navClass}>
            <img src={listIcon} alt="" className="nav-icon" />
            <span className="nav-label">Approvals</span>
          </NavLink>
          <NavLink to="/mentor/students" className={navClass}>
            <img src={listIcon} alt="" className="nav-icon" />
            <span className="nav-label">My Students</span>
          </NavLink>
          <NavLink to="/mentor/jobs" className={navClass}>
            <img src={exportIcon} alt="" className="nav-icon" />
            <span className="nav-label">Job Directory</span>
          </NavLink>
          <NavLink to="/mentor/profile" className={navClass}>
            <img src={exportIcon} alt="" className="nav-icon" />
            <span className="nav-label">Settings</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            {!sidebarOpen && (
              <button
                type="button"
                className="sidebar-toggle-btn"
                onClick={() => setSidebarOpen(true)}
              >
                ☰
              </button>
            )}
          </div>

          <div
            className="topbar-user"
            onClick={() => setUserMenuOpen((prev) => !prev)}
          >
            {/* Dynamic Initials */}
            <span className="topbar-avatar">{getInitials(mentor.name)}</span>
            
            <div className="topbar-user-info">
              {/* Dynamic Name & Role */}
              <div className="topbar-name">{mentor.name || "Mentor Name"}</div>
              <div className="topbar-role">{mentor.email || "Coordinator"}</div>
            </div>
            
            {userMenuOpen && (
              <div className="user-menu">
                <button
                  type="button"
                  className="user-menu-item"
                  onClick={handleLogout}
                >
                  <img
                    src={logoutIcon}
                    alt="Logout"
                    className="user-menu-icon"
                  />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="content-wrapper">
          {/* 👇 You must pass the context prop here! */}
          <Outlet context={{ mentor }} />
        </main>
      </div>
    </div>
  );
}

export default MentorSideNavBar;