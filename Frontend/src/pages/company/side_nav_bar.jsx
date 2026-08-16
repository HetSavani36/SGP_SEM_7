import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom"; // Added useNavigate
import companyLogo from "../../assets/images/H_logo.png";
import "../../dashboard.css";
import logoutIcon from "../../assets/icons/logout.png";
import gridIcon from "../../assets/icons/grid.png";
import listIcon from "../../assets/icons/list.png";
import exportIcon from "../../assets/icons/export.png";

// Helper for dynamic initials
function getInitials(name) {
  if (!name) return "CO";
  return name
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((n) => n[0]?.toUpperCase())
  .join("");
}

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL
  
  // 1. Add loading state
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/company/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setCompany(data.data);
        } else {
          // If auth fails (401), redirect to login
          console.error("Not authenticated");
          navigate("/login");
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        navigate("/login");
      } finally {
        // Stop loading whether success or fail
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

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
    return <div className="dashboard-loading">Loading Dashboard...</div>;
  }

  // Safety check: If loading finished but company is still null (rare error case)
  if (!company) return null; 

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
            <img src={companyLogo} alt="Company logo" />
            <div className="sidebar-company-meta">
              {/* Safe access to data */}
              <span className="sidebar-company-name">{company.name}</span>
              <span className="sidebar-company-role">Company Panel</span>
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
          <NavLink to="/company/dashboard" end className={navClass}>
            <img src={gridIcon} alt="" className="nav-icon" />
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink to="/company/employees" className={navClass}>
            <img src={listIcon} alt="" className="nav-icon" />
            <span className="nav-label">Employees</span>
          </NavLink>
          <NavLink to="/company/jobs" className={navClass}>
            <img src={exportIcon} alt="" className="nav-icon" />
            <span className="nav-label">Jobs</span>
          </NavLink>
          <NavLink to="/company/applications" className={navClass}>
            <img src={listIcon} alt="" className="nav-icon" />
            <span className="nav-label">Applications</span>
          </NavLink>
          <NavLink to="/company/collaboration" className={navClass}>
            <img src={gridIcon} alt="" className="nav-icon" />
            <span className="nav-label">Collaboration</span>
          </NavLink>
          <NavLink to="/company/admin-settings" className={navClass}>
            <img src={exportIcon} alt="" className="nav-icon" />
            <span className="nav-label">Admin Settings</span>
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
            <span className="topbar-avatar">{getInitials(company.name)}</span>
            
            <div className="topbar-user-info">
              {/* Dynamic Email */}
              <div className="topbar-name">{company.name}</div>
              <div className="topbar-role">Admin</div>
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
          <Outlet context={{ company }} />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;