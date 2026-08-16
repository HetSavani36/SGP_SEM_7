import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* ---------- Helpers ---------- */
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays === 1) return "Today";
  if (diffDays === 2) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

function CompanyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/company/dashboard`, { credentials: "include" });
        const json = await res.json();
        if (res.ok) setData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [apiUrl]);

  if (loading) return <div className="dashboard-loading" style={{ height: '100vh' }}>Loading Dashboard...</div>;
  if (!data) return <div className="empty-state">Failed to load dashboard data.</div>;

  // Calculate percentages for the pipeline bar
  const totalApps = data.pipeline.total || 1; // Prevent division by zero
  const pendingPct = (data.pipeline.pending / totalApps) * 100;
  const shortPct = (data.pipeline.shortlisted / totalApps) * 100;
  const hiredPct = (data.pipeline.hired / totalApps) * 100;
  const rejectedPct = (data.pipeline.rejected / totalApps) * 100;

  return (
    <div style={{ 
      height: 'calc(100vh - 40px)', width: '100%', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', boxSizing: 'border-box'
    }}>
      <div className="employees-page" style={{ flexGrow: 1, overflowY: 'auto', padding: '0 2rem 5rem 2rem', boxSizing: 'border-box' }}>
        
        {/* ================= HEADER ================= */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 className="page-title" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Welcome back!</h2>
            <p className="page-subtitle">Here is what's happening at <strong>{data.companyName}</strong> today.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => navigate('/company/collaboration?filter=not_applied')} className="btn-outline" style={{ padding: '10px 16px', borderRadius: '8px' }}>Find Colleges</button>
            <button onClick={() => navigate('/company/jobs')} className="btn-primary" style={{ padding: '10px 16px', borderRadius: '8px' }}>+ Post a Job</button>
          </div>
        </div>

        {/* ================= QUICK METRICS ROW ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>💼</div>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Jobs</p>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem' }}>{data.metrics.activeJobs}</h3>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '12px', backgroundColor: '#fefce8', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📄</div>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Applicants</p>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem' }}>{data.pipeline.total}</h3>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '12px', backgroundColor: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎉</div>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Hired</p>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem' }}>{data.pipeline.hired}</h3>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🏛️</div>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Partner Colleges</p>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem' }}>{data.metrics.activeCollabs}</h3>
            </div>
          </div>

        </div>

        {/* ================= MIDDLE SECTION: PIPELINE & RECENT JOBS ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* PIPELINE FUNNEL */}
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0f172a', fontSize: '1.15rem' }}>Overall Application Pipeline</h3>
            
            {/* Visual Progress Bar */}
            <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', backgroundColor: '#f1f5f9' }}>
              <div style={{ width: `${pendingPct}%`, backgroundColor: '#facc15', transition: 'width 1s ease' }}></div>
              <div style={{ width: `${shortPct}%`, backgroundColor: '#60a5fa', transition: 'width 1s ease' }}></div>
              <div style={{ width: `${hiredPct}%`, backgroundColor: '#34d399', transition: 'width 1s ease' }}></div>
              <div style={{ width: `${rejectedPct}%`, backgroundColor: '#f87171', transition: 'width 1s ease' }}></div>
            </div>

            {/* Pipeline Legend / Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#fefce8', borderRadius: '8px' }}>
                <span style={{ color: '#854d0e', fontWeight: 500, fontSize: '0.9rem' }}>🟡 Pending Review</span>
                <strong style={{ color: '#854d0e' }}>{data.pipeline.pending}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                <span style={{ color: '#1d4ed8', fontWeight: 500, fontSize: '0.9rem' }}>🔵 Shortlisted</span>
                <strong style={{ color: '#1d4ed8' }}>{data.pipeline.shortlisted}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                <span style={{ color: '#15803d', fontWeight: 500, fontSize: '0.9rem' }}>🟢 Hired</span>
                <strong style={{ color: '#15803d' }}>{data.pipeline.hired}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                <span style={{ color: '#b91c1c', fontWeight: 500, fontSize: '0.9rem' }}>🔴 Rejected</span>
                <strong style={{ color: '#b91c1c' }}>{data.pipeline.rejected}</strong>
              </div>
            </div>
          </div>

          {/* RECENT JOBS */}
          <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem' }}>Active Job Postings</h3>
              <button onClick={() => navigate('/company/jobs')} style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>View All →</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.recentJobs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No active jobs found.</div>
              ) : (
                data.recentJobs.map((job) => (
                  <div key={job.id} onClick={() => navigate(`/company/jobs/${job.id}`)} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1rem' }}>{job.title}</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>{job.collegeName}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ backgroundColor: '#e2e8f0', color: '#334155', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {job.applicantCount} Applicants
                      </span>
                      <span style={{ color: '#cbd5e1' }}>›</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ================= BOTTOM SECTION: RECENT APPLICANT ACTIVITY ================= */}
        <div className="card" style={{ padding: '0', marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem' }}>Recent Applicant Activity</h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '12px 1.5rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Candidate Name</th>
                  <th style={{ padding: '12px 1.5rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Applied For</th>
                  <th style={{ padding: '12px 1.5rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 1.5rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentApplications.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No recent applications.</td></tr>
                ) : (
                  data.recentApplications.map((app) => {
                    let statusColor = { bg: "#fefce8", text: "#854d0e", label: "Pending" };
                    if (app.status === "shortlisted") statusColor = { bg: "#eff6ff", text: "#1d4ed8", label: "Shortlisted" };
                    if (app.status === "hired") statusColor = { bg: "#dcfce7", text: "#15803d", label: "Hired" };
                    if (app.status === "rejected") statusColor = { bg: "#fee2e2", text: "#b91c1c", label: "Rejected" };

                    return (
                      <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{app.studentName}</p>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{app.branch}</p>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', color: '#334155', fontWeight: 500 }}>{app.jobTitle}</td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ backgroundColor: statusColor.bg, color: statusColor.text, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {statusColor.label}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>{formatDate(app.date)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CompanyDashboard;