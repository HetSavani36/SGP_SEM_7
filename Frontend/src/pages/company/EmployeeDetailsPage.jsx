import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ---------- Helpers ---------- */
function getInitials(name) {
  if (!name) return "EM";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function getAvatarColor(name) {
  const colors = [
    { bg: "#e0e7ff", text: "#4f46e5" }, // Indigo
    { bg: "#dcfce7", text: "#166534" }, // Green
    { bg: "#fce7f3", text: "#be185d" }, // Pink
    { bg: "#fef3c7", text: "#b45309" }, // Amber
    { bg: "#e0f2fe", text: "#0369a1" }, // Light Blue
  ];
  const charCode = name ? name.charCodeAt(0) : 0;
  return colors[charCode % colors.length];
}

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeString) => {
  if (!timeString) return "N/A";
  // Assuming time might come as a full ISO string or a time string
  try {
    const date = new Date(timeString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
    }
    return timeString; // Fallback if it's just a string like "14:30"
  } catch (e) {
    return timeString;
  }
};

function EmployeeDetailsPage() {
  const { id } = useParams(); // Gets employeeId from the URL
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------- FETCH EMPLOYEE DETAILS ---------- */
  const fetchEmployeeDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Adjust this endpoint if your route structure is different
      const res = await fetch(`${apiUrl}/api/company/employee/${id}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch employee details");
      }

      setEmployee(data.data);
    } catch (err) {
      console.error("Employee details fetch error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, id]);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [fetchEmployeeDetails]);

  if (isLoading && !employee) {
    return <div className="dashboard-loading" style={{ height: '100vh' }}>Loading employee profile...</div>;
  }

  if (error) {
    return (
      <div className="empty-state" style={{ color: "#ef4444", marginTop: "2rem" }}>
        <h3>Oops!</h3>
        <p>{error}</p>
        <button className="btn-outline" onClick={() => navigate(-1)} style={{ marginTop: "1rem" }}>
          Go Back
        </button>
      </div>
    );
  }

  if (!employee) return null;

  const user = employee.user || {};
  const avatarColors = getAvatarColor(user.name);

  return (
    <div className="employees-page" style={{ minHeight: "120vh", paddingBottom: "10vh" }}>
      
      {/* ================= HEADER WITH BACK BUTTON ================= */}
      <div className="employees-header" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={() => navigate(-1)} // Navigates back to employees list
          style={{ 
            background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", 
            width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: "1.2rem", color: "#475569", transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
        >
          ←
        </button>
        <div>
          <h2 className="page-title">Employee Profile</h2>
          <p className="page-subtitle">
            Viewing details for <strong>{user.name}</strong>
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem" }}>
        
        {/* ================= LEFT COLUMN: PROFILE CARD ================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="card" style={{ padding: "3rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{
              width: "100px", height: "100px", borderRadius: "50%", marginBottom: "1.5rem",
              backgroundColor: avatarColors.bg, color: avatarColors.text, display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: "bold",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}>
              {getInitials(user.name)}
            </div>
            
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.8rem", color: "#0f172a" }}>{user.name}</h3>
            <p style={{ margin: "0 0 1.5rem 0", color: "#64748b", fontSize: "1rem" }}>{user.email}</p>

            <div style={{ width: "100%", borderTop: "1px solid #f1f5f9", paddingTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
              <div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>System User ID</p>
                <p style={{ margin: 0, fontWeight: "500", color: "#334155", fontFamily: "monospace" }}>{user.id || "N/A"}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Employee Record ID</p>
                <p style={{ margin: 0, fontWeight: "500", color: "#334155", fontFamily: "monospace" }}>{employee.id}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Account Created</p>
                <p style={{ margin: 0, fontWeight: "500", color: "#334155" }}>{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: INTERVIEWS CARD ================= */}
        <div className="card" style={{ display: "flex", flexDirection: "column", maxHeight: "80vh" }}>
          <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
              🗓️ Assigned Interviews
            </h3>
            <span style={{ backgroundColor: "#f1f5f9", padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "bold", color: "#475569" }}>
              {employee.interviews?.length || 0} Total
            </span>
          </div>

          <div style={{ overflowY: "auto", flexGrow: 1, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", backgroundColor: "#f8fafc" }}>
            {!employee.interviews || employee.interviews.length === 0 ? (
              <div className="empty-state" style={{ padding: "3rem", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "8px", backgroundColor: "#fff" }}>
                <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>☕</span>
                <p style={{ margin: 0, color: "#64748b" }}>No interviews assigned to this employee yet.</p>
              </div>
            ) : (
              employee.interviews.map((interview) => {
                // Determine Status Badge
                let statusConfig = { bg: "#fefce8", color: "#854d0e", label: "Pending Evaluation" };
                if (interview.selected === true) statusConfig = { bg: "#dcfce7", color: "#166534", label: "Candidate Selected" };
                if (interview.selected === false) statusConfig = { bg: "#fee2e2", color: "#991b1b", label: "Candidate Rejected" };

                return (
                  <div key={interview.id} style={{ 
                    backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                  }}>
                    {/* Top Row: Date/Time & Status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <div>
                        <h4 style={{ margin: "0 0 0.25rem 0", color: "#0f172a", fontSize: "1.1rem" }}>
                          {formatDate(interview.date)}
                        </h4>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>⏰</span> {formatTime(interview.time)}
                        </p>
                      </div>
                      <span style={{
                        backgroundColor: statusConfig.bg, color: statusConfig.color,
                        padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "bold"
                      }}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Interview Location */}
                    <div style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "#475569", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                      <span style={{ marginTop: "2px" }}>📍</span>
                      <span>{interview.address || "Location not specified"}</span>
                    </div>

                    {/* Candidate / Student Details Box */}
                    <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                      <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.75rem", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Candidate Info
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748b", fontSize: "0.85rem" }}>College:</span>
                          <strong style={{ color: "#0f172a", fontSize: "0.85rem", textAlign: "right" }}>{interview.student?.college?.name || "N/A"}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Branch & Year:</span>
                          <strong style={{ color: "#0f172a", fontSize: "0.85rem", textAlign: "right" }}>
                            {interview.student?.branch || "N/A"} (Year {interview.student?.year || "-"})
                          </strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Roll No:</span>
                          <strong style={{ color: "#0f172a", fontSize: "0.85rem", fontFamily: "monospace" }}>{interview.student?.rollNo || "N/A"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default EmployeeDetailsPage;