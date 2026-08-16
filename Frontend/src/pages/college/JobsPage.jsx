import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

/* ---------- Helpers ---------- */
const formatCurrency = (amount) => {
  if (!amount) return "Not Disclosed";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function CollegeJobsPage() {
  const { college } = useOutletContext();
  const navigate = useNavigate(); // Added for navigation

  const [jobs, setJobs] = useState([]);
  const [mentors, setMentors] = useState([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("PENDING");

  const [selectedJob, setSelectedJob] = useState(null);
  const [mentor, setMentor] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL;

  /* ---------------- FETCH JOBS ---------------- */
  const fetchJobs = async () => {
    try {
      const res = await fetch(
        `${apiUrl}/api/college/job/requests?filter=${filter}`,
        { credentials: "include" }
      );

      if (!res.ok) return;

      const data = await res.json();
      const jobsFromApi = data.data.jobRequests || data.jobs || [];

      setJobs(
        jobsFromApi.map((job) => ({
          id: job.id,
          title: job.title,
          company: job.companyName,
          salary: job.salary,
          deadline: job.deadline,
          status: job.status,
          mentor: job.mentorName || null,
        }))
      );
    } catch (err) {
      console.error(err.message);
    }
  };

  /* 🔴 IMPORTANT FIX: do NOT refetch while modal is open */
  useEffect(() => {
    if (selectedJob) return;
    fetchJobs();
  }, [filter, apiUrl, selectedJob]);

  /* ---------------- FETCH MENTORS ---------------- */
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/college/mentors`, {
          credentials: "include",
        });

        if (!res.ok) return;

        const data = await res.json();
        const mentorsFromApi = data.data.mentors || data.mentors || [];

        setMentors(
          mentorsFromApi.map((m) => ({
            id: m.id,
            name: m.name,
          }))
        );
      } catch (err) {
        console.error(err.message);
      }
    };

    fetchMentors();
  }, [apiUrl]);

  /* ---------------- FILTER ---------------- */
  const filteredJobs = useMemo(() => {
    return jobs.filter(
      (job) =>
        job.status === filter &&
        job.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [jobs, filter, search]);

  /* ---------------- REJECT JOB ---------------- */
  const rejectJobHandler = async (e, jobId) => {
    e.stopPropagation(); // Prevents card navigation
    setJobs((prev) => prev.filter((j) => j.id !== jobId));

    try {
      const res = await fetch(
        `${apiUrl}/api/college/job/${jobId}/0`,
        { method: "POST", credentials: "include" }
      );

      if (!res.ok) fetchJobs();
    } catch (err) {
      console.error(err.message);
      fetchJobs();
    }
  };

  /* ---------------- APPROVE JOB ---------------- */
  const approveAndOpenModal = (e, job) => {
    e.stopPropagation(); // Prevents card navigation
    setSelectedJob({ ...job, status: "ASSIGN_MENTOR" });
    setFilter("ASSIGN_MENTOR");

    (async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/college/job/${job.id}/1`,
          { method: "POST", credentials: "include" }
        );

        if (!res.ok) return;

        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, status: "ASSIGN_MENTOR" } : j
          )
        );
      } catch (err) {
        console.error(err.message);
      }
    })();
  };

  /* ---------------- ASSIGN MENTOR ---------------- */
  const assignMentorHandler = async () => {
    try {
      const res = await fetch(
        `${apiUrl}/api/college/job/${selectedJob.id}/assign-mentor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ mentorId: mentor }),
        }
      );

      if (!res.ok) return;

      setJobs((prev) => prev.filter((j) => j.id !== selectedJob.id));
      setSelectedJob(null);
      setMentor("");
    } catch (err) {
      console.error(err.message);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="employees-page" style={{
    height: "100%",
    overflowY: "auto",
    paddingBottom: "80px"
  }}>
      
      {/* ================= HEADER ================= */}
      <div className="employees-header">
        <div>
          <h2 className="page-title">Jobs Dashboard</h2>
          <p className="page-subtitle">
            Manage incoming job requests and assignments for <strong>{college?.name}</strong>
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* SEARCH */}
          <input
            className="search-input"
            placeholder="Search job titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: '250px' }}
          />

          {/* FILTERS */}
          <div className="filter-tabs" style={{ margin: 0 }}>
            {["PENDING", "CURRENT", "PAST", "ASSIGN_MENTOR"].map((f) => (
              <button
                key={f}
                className={`filter-pill ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= JOB GRID ================= */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '50vh' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          {filter.replace("_", " ")} Jobs ({filteredJobs.length})
        </h3>

        {filteredJobs.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', flexGrow: 1 }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
            <p style={{ margin: 0, color: '#64748b' }}>No jobs found for the selected filter.</p>
          </div>
        ) : (
          <div className="jobs-cards-clean" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredJobs.map((job) => (
              <div 
                key={job.id} 
                className="job-card-soft" 
                onClick={() => navigate(`/college/jobs/${job.id}`)} // 👈 Navigation added here
                style={{ 
                  padding: '1.25rem', 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0', 
                  borderTop: `4px solid ${filter === 'PENDING' ? '#eab308' : filter === 'ASSIGN_MENTOR' ? '#f97316' : '#4f46e5'}`,
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer' // 👈 Indicates it's clickable
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }}
              >
                
                {/* Top Section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold'
                    }}>
                      {job.company ? job.company.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1.1rem', lineHeight: '1.2' }}>{job.title}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{job.company}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>💰</span> <strong>{formatCurrency(job.salary)}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>📅</span> Deadline: {formatDate(job.deadline)}
                    </div>
                    {job.mentor && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <span>🎓</span> <span style={{ color: '#4f46e5', fontWeight: 500 }}>{job.mentor}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Section */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  {job.status === "PENDING" && (
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                      <button
                        className="btn-success"
                        style={{ flex: 1, padding: '8px', borderRadius: '6px' }}
                        onClick={(e) => approveAndOpenModal(e, job)} // 👈 e.stopPropagation() inside
                      >
                        ✓
                      </button>
                      <button
                        className="btn-danger"
                        style={{ flex: 1, padding: '8px', borderRadius: '6px' }}
                        onClick={(e) => rejectJobHandler(e, job.id)} // 👈 e.stopPropagation() inside
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {job.status === "ASSIGN_MENTOR" && (
                    <button
                      className="btn-primary"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px' }}
                      onClick={(e) => {
                        e.stopPropagation(); // 👈 Prevents navigation
                        setSelectedJob(job);
                      }}
                    >
                      Assign Mentor
                    </button>
                  )}

                  {(job.status === "CURRENT" || job.status === "PAST") && (
                     <span style={{ color: '#4f46e5', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', width: '100%', justifyContent: 'flex-end' }}>
                       View Details <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>→</span>
                     </span>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {selectedJob && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Assign Mentor</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>{selectedJob.title}</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{selectedJob.company}</p>
            </div>

            <div className="form-group">
              <label>Select a Mentor from the list</label>
              <select
                className="form-input"
                value={mentor}
                onChange={(e) => setMentor(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">-- Choose a Mentor --</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-footer" style={{ marginTop: '2rem' }}>
              <button
                className="btn-outline"
                onClick={() => {
                  setSelectedJob(null);
                  setMentor("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={!mentor}
                onClick={assignMentorHandler}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPLICIT BOTTOM SPACER */}
      <div style={{ height: '50px', width: '100%', flexShrink: 0 }}></div>

    </div>
  );
}

export default CollegeJobsPage;