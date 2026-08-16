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

function getInitials(name) {
  if (!name) return "C";
  return name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join("");
}

function CompanyJobDetailsPage() {
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
      // Assuming your route is exactly this based on standard REST naming
      const res = await fetch(`${apiUrl}/api/company/job/${id}`, {
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
    return <div className="dashboard-loading" style={{ height: '100vh' }}>Loading job profile...</div>;
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

  if (!job) return null;

  const isExpired = new Date(job.dueDate) < new Date();
  const counts = job.applicationCount || { total: 0, pending: 0, shortlisted: 0, hired: 0, rejected: 0 };

  return (
    <div className="employees-page" style={{
    height: "100%",
    overflowY: "auto",
    paddingBottom: "80px"
  }}>
      
      {/* ================= HEADER WITH BACK BUTTON ================= */}
      <div className="employees-header" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={() => navigate(-1)}
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
        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="page-title">{job.title}</h2>
            <p className="page-subtitle" style={{ fontFamily: 'monospace', color: '#64748b' }}>
              Job ID: {job.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <span style={{
              padding: "6px 12px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600",
              backgroundColor: job.isApproved ? "#dcfce7" : "#fef08a",
              color: job.isApproved ? "#166534" : "#854d0e", border: `1px solid ${job.isApproved ? '#bbf7d0' : '#fef08a'}`
            }}>
              {job.isApproved ? "✓ College Approved" : "⏳ Pending Approval"}
            </span>
            <span style={{
              padding: "6px 12px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600",
              backgroundColor: isExpired ? "#fee2e2" : "#e0e7ff",
              color: isExpired ? "#991b1b" : "#3730a3", border: `1px solid ${isExpired ? '#fecaca' : '#c7d2fe'}`
            }}>
              {isExpired ? "Closed / Expired" : "Active & Open"}
            </span>
          </div>
        </div>
      </div>

      {/* ================= PIPELINE METRICS ROW ================= */}
      <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1.1rem" }}>Application Pipeline</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        
        <div className="card" style={{ padding: '1.5rem', borderBottom: '4px solid #3b82f6' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Applied</p>
          <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', color: '#0f172a' }}>{counts.total}</h2>
        </div>
        
        <div className="card" style={{ padding: '1.5rem', borderBottom: '4px solid #eab308' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Pending Review</p>
          <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', color: '#0f172a' }}>{counts.pending}</h2>
        </div>
        
        <div className="card" style={{ padding: '1.5rem', borderBottom: '4px solid #a855f7' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Shortlisted</p>
          <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', color: '#0f172a' }}>{counts.shortlisted}</h2>
        </div>
        
        <div className="card" style={{ padding: '1.5rem', borderBottom: '4px solid #10b981' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Hired</p>
          <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', color: '#0f172a' }}>{counts.hired}</h2>
        </div>

      </div>

      {/* ================= MAIN CONTENT GRID ================= */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem" }}>
        
        {/* LEFT COLUMN: CORE JOB INFO */}
        <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
            Job Specifications
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💰</div>
            <div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Salary Offering</p>
              <p style={{ margin: 0, fontWeight: "600", color: "#0f172a", fontSize: "1.05rem" }}>{formatCurrency(job.salary)}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>⏳</div>
            <div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Tenure / Type</p>
              <p style={{ margin: 0, fontWeight: "600", color: "#0f172a", fontSize: "1.05rem" }}>{job.tenure || "Full-Time"}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📍</div>
            <div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Location</p>
              <p style={{ margin: 0, fontWeight: "600", color: "#0f172a", fontSize: "1.05rem" }}>{job.address || "Remote / Unspecified"}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📅</div>
            <div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Application Deadline</p>
              <p style={{ margin: 0, fontWeight: "600", color: isExpired ? "#ef4444" : "#0f172a", fontSize: "1.05rem" }}>
                {formatDate(job.dueDate)}
              </p>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🕒</div>
            <div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Posted On</p>
              <p style={{ margin: 0, fontWeight: "600", color: "#0f172a", fontSize: "1.05rem" }}>{formatDate(job.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PARTNER INFO (COLLEGE & MENTOR) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* College Details Card */}
          <div className="card" style={{ padding: '2rem' }}>
            <h4 style={{ marginTop: 0, marginBottom: "1.5rem", color: "#0f172a", fontSize: '1.1rem', display: "flex", alignItems: "center", gap: "0.5rem" }}>
              🏛️ Target College
            </h4>
            
            {job.college ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {getInitials(job.college.name)}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: "600", color: "#0f172a", fontSize: "1.1rem" }}>{job.college.name}</p>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem", fontFamily: "monospace" }}>ID: {job.college.id.slice(0, 8)}</p>
                  </div>
                </div>
                
                <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p style={{ margin: 0, color: "#334155", fontSize: '0.9rem' }}>
                    <strong>Email:</strong> <a href={`mailto:${job.college.email}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>{job.college.email}</a>
                  </p>
                  <p style={{ margin: 0, color: "#334155", fontSize: '0.9rem' }}>
                    <strong>Phone:</strong> {job.college.phone || "N/A"}
                  </p>
                  <p style={{ margin: 0, color: "#334155", fontSize: '0.9rem' }}>
                    <strong>Address:</strong> {job.college.address || "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ color: "#94a3b8" }}>College details unavailable.</p>
            )}
          </div>

          {/* Assigned Mentor Card */}
          <div className="card" style={{ padding: '2rem' }}>
            <h4 style={{ marginTop: 0, marginBottom: "1.5rem", color: "#0f172a", fontSize: '1.1rem', display: "flex", alignItems: "center", gap: "0.5rem" }}>
              👨‍🏫 Assigned College Mentor
            </h4>
            
            {job.mentor ? (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#f3e8ff", color: "#a855f7",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "bold"
                }}>
                  {getInitials(job.mentor.user.name)}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: "600", color: "#0f172a", fontSize: "1.1rem" }}>{job.mentor.user.name}</p>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>{job.mentor.user.email}</p>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "1.5rem", margin: 0, backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                <p style={{ margin: 0, color: "#64748b", fontSize: '0.9rem', textAlign: 'center' }}>No mentor has been assigned to this job by the college yet.</p>
              </div>
            )}
          </div>

        </div>
      </div>
      
    </div>
  );
}

export default CompanyJobDetailsPage;