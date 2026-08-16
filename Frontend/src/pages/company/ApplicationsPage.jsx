import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

/* ---------- Helpers ---------- */
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

function ApplicationsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  // --- Filtering & Sorting States ---
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("LIVE"); // ALL, LIVE, PENDING, EXPIRED
  const [sortBy, setSortBy] = useState("ASC"); // ASC (soonest first), DESC (latest first)

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/company/applications/overview`, { credentials: "include" });
        const data = await res.json();
        if (res.ok) setJobs(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [apiUrl]);

  /* ---------------- DATA PROCESSING ---------------- */
  const processedJobs = useMemo(() => {
    const now = new Date();

    // 1. Search Filter
    let filtered = jobs.filter(job => 
      job.title.toLowerCase().includes(search.toLowerCase()) || 
      job.collegeName?.toLowerCase().includes(search.toLowerCase())
    );

    // 2. Status Filter
    filtered = filtered.filter(job => {
      const isExpired = new Date(job.dueDate) < now;
      const isClosed = job.jobStatus === "closed";
      const isPendingApproval = !job.isApproved;

      if (filter === "ALL") return true;
      if (filter === "PENDING") return isPendingApproval;
      if (filter === "EXPIRED") return isExpired || isClosed;
      
      // "LIVE" = Approved, not closed, not expired
      if (filter === "LIVE") return !isPendingApproval && !isExpired && !isClosed;
      
      return true;
    });

    // 3. Sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return sortBy === "ASC" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [jobs, search, filter, sortBy]);

  if (loading) return <div className="dashboard-loading" style={{ height: '100vh' }}>Loading pipeline overview...</div>;

  return (
    <div style={{ 
      /* STRICT PAGE CONSTRAINTS FOR SCROLLING */
      height: 'calc(100vh - 40px)', 
      width: '100%',
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden', 
      boxSizing: 'border-box'
    }}>
      
      {/* SCROLLABLE INNER CONTAINER */}
      <div className="employees-page" style={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        padding: '0 2rem 5rem 2rem', 
        boxSizing: 'border-box'
      }}>
        
        {/* ================= HEADER ================= */}
        <div className="employees-header" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
          <div>
            <h2 className="page-title">Applications ATS</h2>
            <p className="page-subtitle">Track student applications across all active jobs and colleges.</p>
          </div>
        </div>

        {/* ================= TOOLBAR (Search, Filters, Sort) ================= */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          
          {/* Search */}
          <input
            className="search-input"
            placeholder="Search job or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: '280px', margin: 0 }}
          />

          {/* Filter Tabs */}
          <div className="filter-tabs" style={{ margin: 0 }}>
            {["LIVE", "PENDING", "EXPIRED", "ALL"].map((f) => (
              <button
                key={f}
                className={`filter-pill ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "PENDING" ? "Pending Approval" : f}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Sort Deadline:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#fff', cursor: 'pointer', color: '#0f172a' }}
            >
              <option value="ASC">Closing Soonest</option>
              <option value="DESC">Closing Latest</option>
            </select>
          </div>
        </div>

        {/* ================= JOB PIPELINE GRID ================= */}
        {/* 👇 FIXED GRID SPACING HERE 👇 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', // Reduced from 380px to 320px
          gap: '1.5rem' 
        }}>
          
          {processedJobs.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
               <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>📭</span>
               <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>No jobs match these filters</h3>
               <p style={{ margin: 0, color: '#64748b' }}>Try adjusting your search or switching tabs.</p>
            </div>
          ) : (
            processedJobs.map((job) => {
              
              const isExpired = new Date(job.dueDate) < new Date();
              const isClosed = job.jobStatus === "closed";
              const isPendingApproval = !job.isApproved; 
              
              let statusConfig = { bg: "#e0f2fe", color: "#0369a1", label: "🟢 Live", border: "#bae6fd" };
              if (isPendingApproval) statusConfig = { bg: "#fef08a", color: "#854d0e", label: "⏳ Pending Approval", border: "#fde047" };
              else if (isClosed || isExpired) statusConfig = { bg: "#fee2e2", color: "#991b1b", label: "🔴 Closed / Expired", border: "#fecaca" };

              return (
                <div 
                  key={job.id} 
                  className="card" 
                  onClick={() => navigate(`/company/applications/${job.id}`)}
                  style={{ 
                    padding: '1.25rem', // Reduced padding from 1.5rem to 1.25rem to make it tighter
                    maxWidth: '450px', // 👇 Prevents a single card from stretching across the entire screen
                    cursor: 'pointer', 
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    borderTop: `4px solid ${statusConfig.border}`,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  }}
                >
                  
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', paddingRight: '1rem', lineHeight: '1.3' }}>{job.title}</h4>
                    <span style={{ 
                      fontSize: '0.7rem', backgroundColor: statusConfig.bg, color: statusConfig.color, 
                      padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', whiteSpace: 'nowrap' 
                    }}>
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🏛️ {job.collegeName}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: isExpired ? '#ef4444' : '#64748b', fontWeight: 500 }}>
                      ⏳ Due: {formatDate(job.dueDate)}
                    </p>
                  </div>

                  {/* Pipeline Stats Bar */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem' }}>
                    <div style={{ flex: 1, backgroundColor: '#fef9c3', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #fef08a' }}>
                      <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#854d0e' }}>{job.pipeline.newPending}</p>
                      <p style={{ margin: 0, fontSize: '0.6rem', color: '#a16207', textTransform: 'uppercase', fontWeight: 600 }}>New</p>
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#f3e8ff', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #e9d5ff' }}>
                      <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#7e22ce' }}>{job.pipeline.mentorReview}</p>
                      <p style={{ margin: 0, fontSize: '0.6rem', color: '#9333ea', textTransform: 'uppercase', fontWeight: 600 }}>Mentor</p>
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#e0f2fe', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #bae6fd' }}>
                      <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#0369a1' }}>{job.pipeline.interviewReady}</p>
                      <p style={{ margin: 0, fontSize: '0.6rem', color: '#0284c7', textTransform: 'uppercase', fontWeight: 600 }}>Ready</p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Applied: <strong>{job.pipeline.total}</strong></span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>
                        {job.pipeline.hired} Hired
                      </span>
                      <span style={{ color: '#4f46e5', fontSize: '0.85rem', fontWeight: 600, marginLeft: '4px' }}>
                        Open Board →
                      </span>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}

export default ApplicationsPage;