import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ---------- Helpers ---------- */
const formatCurrency = (amount) => {
  if (!amount) return "Not Disclosed";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

function JobDetailsPage() {
  const { id } = useParams(); // Gets jobId from the URL
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------- FETCH JOB DETAILS ---------- */
  const fetchJobDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Assuming your route is exactly this based on your standard naming
      const res = await fetch(`${apiUrl}/api/college/job/${id}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch job details");
      }

      setJob(data.data);
    } catch (err) {
      console.error("Job details fetch error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, id]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  if (isLoading && !job) {
    return <div className="dashboard-loading">Loading job details...</div>;
  }

  if (error) {
    return (
      <div className="empty-state" style={{ color: "#ef4444" }}>
        <h3>Oops!</h3>
        <p>{error}</p>
        <button className="btn-outline" onClick={() => navigate(-1)} style={{ marginTop: "1rem" }}>
          Go Back
        </button>
      </div>
    );
  }

  if (!job) return null;

  // Check if job is past due
  const isExpired = new Date(job.dueDate) < new Date();

  return (
    <div className="employees-page" style={{
    height: "100%",
    overflowY: "auto",
    paddingBottom: "80px"
  }}>
      
      {/* ================= HEADER WITH BACK BUTTON ================= */}
      <div className="employees-header" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={() => navigate(-1)} // Navigates to previous page (Mentors page or Jobs page)
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: "#64748b" }}
        >
          ←
        </button>
        <div>
          <h2 className="page-title">Job Details</h2>
          <p className="page-subtitle">
            Posted by <strong style={{ color: "#4f46e5" }}>{job.company?.name || "Unknown Company"}</strong>
          </p>
        </div>
      </div>

      {/* ================= MAIN CONTENT GRID ================= */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem", marginTop: "1rem" }}>
        
        {/* LEFT COLUMN: CORE JOB INFO */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Main Job Card */}
          <div className="card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.8rem", color: "#0f172a", lineHeight: "1.2" }}>
                {job.title}
              </h3>
              <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  backgroundColor: job.isApproved ? "#dcfce7" : "#fef08a",
                  color: job.isApproved ? "#166534" : "#854d0e"
                }}>
                  {job.isApproved ? "✓ Approved" : "⏳ Pending Approval"}
                </span>
                <span style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  backgroundColor: isExpired ? "#fee2e2" : "#e0e7ff",
                  color: isExpired ? "#991b1b" : "#3730a3"
                }}>
                  {isExpired ? "Expired" : "Active"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.2rem" }}>💰</span>
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Salary Offering</p>
                  <p style={{ margin: 0, fontWeight: "600", color: "#0f172a" }}>{formatCurrency(job.salary)}</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.2rem" }}>⏳</span>
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Tenure / Type</p>
                  <p style={{ margin: 0, fontWeight: "600", color: "#0f172a" }}>{job.tenure || "Full-Time"}</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.2rem" }}>📅</span>
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Application Deadline</p>
                  <p style={{ margin: 0, fontWeight: "600", color: isExpired ? "#ef4444" : "#0f172a" }}>
                    {formatDate(job.dueDate)}
                  </p>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.2rem" }}>🕒</span>
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Posted On</p>
                  <p style={{ margin: 0, fontWeight: "600", color: "#0f172a" }}>{formatDate(job.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Required Card */}
          <div className="card">
            <h4 style={{ marginTop: 0, marginBottom: "1rem", color: "#334155" }}>Required Skills</h4>
            {job.jobSkills && job.jobSkills.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {job.jobSkills.map((skill, idx) => (
                  <span key={idx} style={{
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    border: "1px solid #e2e8f0"
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: "#94a3b8" }}>No specific skills listed.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ENTITY INFO (COMPANY & MENTOR) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Company Details Card */}
          <div className="card" style={{ borderTop: "4px solid #3b82f6" }}>
            <h4 style={{ marginTop: 0, marginBottom: "1.5rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              🏢 Company Profile
            </h4>
            
            {job.company ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Company Name</p>
                  <p style={{ margin: 0, fontWeight: "600", color: "#0f172a", fontSize: "1.1rem" }}>{job.company.name}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Registration Number</p>
                  <p style={{ margin: 0, color: "#334155", fontFamily: "monospace" }}>{job.company.registrationNo || "N/A"}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Official Email</p>
                  <p style={{ margin: 0, color: "#334155" }}>
                    <a href={`mailto:${job.company.email}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                      {job.company.email}
                    </a>
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Contact Number</p>
                  <p style={{ margin: 0, color: "#334155" }}>{job.company.contactNo || "N/A"}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Location / Address</p>
                  <p style={{ margin: 0, color: "#334155", lineHeight: "1.5" }}>{job.company.address || "N/A"}</p>
                </div>
              </div>
            ) : (
              <p style={{ color: "#94a3b8" }}>Company details unavailable.</p>
            )}
          </div>

          {/* Assigned Mentor Card */}
          <div className="card" style={{ borderTop: "4px solid #8b5cf6" }}>
            <h4 style={{ marginTop: 0, marginBottom: "1.5rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              🎓 Assigned Mentor
            </h4>
            
            {job.mentor ? (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#e0e7ff", color: "#4f46e5",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "bold"
                }}>
                  {job.mentor.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: "600", color: "#0f172a", fontSize: "1.1rem" }}>{job.mentor.name}</p>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>{job.mentor.email}</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "#94a3b8" }}>Mentor ID: {job.mentor.id.slice(0, 8)}...</p>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "1.5rem", margin: 0 }}>
                <p style={{ margin: 0, color: "#64748b" }}>No mentor assigned to this job yet.</p>
              </div>
            )}
          </div>

        </div>
      </div>
      
    </div>
  );
}

export default JobDetailsPage;