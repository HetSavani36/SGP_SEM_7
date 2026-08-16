import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { 
  FiBriefcase, FiCheckCircle, FiClock, FiStar, 
  FiChevronRight, FiMapPin, FiDollarSign, FiTrendingUp
} from "react-icons/fi";
import { apiFetch } from "../../utils/api";

const formatCurrency = (amount) => amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "Not Disclosed";

function StudentDashboard() {
  const navigate = useNavigate();
  // Grab the basic student info from the layout (fallback while loading fresh data)
  const { student } = useOutletContext();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    profile: null,
    stats: { available: 0, pending: 0, shortlisted: 0, hired: 0, totalApplied: 0 },
    recentApplications: [],
    recommendedJobs: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Concurrently fetch from the endpoints you already built!
        const [
          profileRes,
          notAppliedRes,
          pendingRes,
          shortlistedRes,
          hiredRes,
          rejectedRes
        ] = await Promise.all([
          apiFetch("/api/student/profile").catch(() => null),
          apiFetch("/api/student/jobs?filter=not_applied&limit=4").catch(() => ({ data: { jobs: [], pagination: { totalJobs: 0 } } })),
          apiFetch("/api/student/jobs?filter=pending&limit=4").catch(() => ({ data: { jobs: [], pagination: { totalJobs: 0 } } })),
          apiFetch("/api/student/jobs?filter=shortlisted&limit=1").catch(() => ({ data: { jobs: [], pagination: { totalJobs: 0 } } })),
          apiFetch("/api/student/jobs?filter=hired&limit=1").catch(() => ({ data: { jobs: [], pagination: { totalJobs: 0 } } })),
          apiFetch("/api/student/jobs?filter=rejected&limit=1").catch(() => ({ data: { jobs: [], pagination: { totalJobs: 0 } } }))
        ]);

        // Safely extract counts from your backend's pagination object
        const available = notAppliedRes?.data?.pagination?.totalJobs || 0;
        const pending = pendingRes?.data?.pagination?.totalJobs || 0;
        const shortlisted = shortlistedRes?.data?.pagination?.totalJobs || 0;
        const hired = hiredRes?.data?.pagination?.totalJobs || 0;
        const rejected = rejectedRes?.data?.pagination?.totalJobs || 0;
        
        setDashboardData({
          profile: profileRes?.data?.data || profileRes?.data || student,
          stats: {
            available,
            pending,
            shortlisted,
            hired,
            totalApplied: pending + shortlisted + hired + rejected
          },
          // Attach statuses so we can render badges
          recentApplications: (pendingRes?.data?.jobs || []).map(j => ({ ...j, _status: 'pending' })).slice(0, 4),
          recommendedJobs: (notAppliedRes?.data?.jobs || []).slice(0, 4)
        });

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [student]);

  const renderBadge = (status) => {
    const baseStyle = { padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' };
    switch (status) {
      case "hired": return <span style={{ ...baseStyle, backgroundColor: '#dcfce7', color: '#166534' }}><FiCheckCircle /> Hired</span>;
      case "shortlisted": return <span style={{ ...baseStyle, backgroundColor: '#eff6ff', color: '#1d4ed8' }}><FiStar /> Shortlisted</span>;
      default: return <span style={{ ...baseStyle, backgroundColor: '#fefce8', color: '#854d0e' }}><FiClock /> Pending</span>;
    }
  };

  if (loading) return <div className="dashboard-loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading your dashboard...</div>;

  return (
    <>
      <style>{`
        .stat-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
        }
        .stat-icon {
          width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justifyContent: center; font-size: 1.5rem; flex-shrink: 0;
        }
        .list-item {
          display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border-bottom: 1px solid #f1f5f9; transition: background-color 0.2s; cursor: pointer;
        }
        .list-item:hover { background-color: #f8fafc; }
        .list-item:last-child { border-bottom: none; }
      `}</style>

      <div style={{ height: 'calc(100vh - 40px)', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
        <div className="employees-page" style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem' }}>
          
          {/* ================= WELCOME HEADER ================= */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', color: '#64748b', fontSize: '1.05rem', fontWeight: 600 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Welcome back, {dashboardData.profile?.user?.name?.split(" ")[0] || dashboardData.profile?.name?.split(" ")[0] || "Student"}! 👋
              </h2>
            </div>
            
            {/* Quick action button */}
            {!dashboardData.profile?.resume && (
              <button onClick={() => navigate("/student/profile")} style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Complete Profile to Apply →
              </button>
            )}
          </div>

          {/* ================= METRICS ROW ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            
            <div className="stat-card" onClick={() => navigate("/student/apply")} style={{ cursor: 'pointer' }}>
              <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}><FiBriefcase /></div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Available Jobs</p>
                <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: 800 }}>{dashboardData.stats.available}</h3>
              </div>
            </div>

            <div className="stat-card" onClick={() => navigate("/student/applications")} style={{ cursor: 'pointer' }}>
              <div className="stat-icon" style={{ backgroundColor: '#f3e8ff', color: '#a855f7' }}><FiTrendingUp /></div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Applied</p>
                <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: 800 }}>{dashboardData.stats.totalApplied}</h3>
              </div>
            </div>

            <div className="stat-card" onClick={() => navigate("/student/applications")} style={{ cursor: 'pointer' }}>
              <div className="stat-icon" style={{ backgroundColor: '#fefce8', color: '#ca8a04' }}><FiClock /></div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Pending Review</p>
                <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: 800 }}>{dashboardData.stats.pending}</h3>
              </div>
            </div>

            <div className="stat-card" onClick={() => navigate("/student/applications")} style={{ cursor: 'pointer' }}>
              <div className="stat-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}><FiCheckCircle /></div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Shortlisted & Hired</p>
                <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: 800 }}>{dashboardData.stats.shortlisted + dashboardData.stats.hired}</h3>
              </div>
            </div>

          </div>

          {/* ================= MAIN CONTENT SPLIT ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
            
            {/* LEFT COLUMN: Recent Applications */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>Recent Applications</h3>
                <button onClick={() => navigate("/student/applications")} style={{ background: 'transparent', border: 'none', color: '#4f46e5', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>View All</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {dashboardData.recentApplications.length === 0 ? (
                  <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>📋</span>
                    <p style={{ margin: 0, fontWeight: 600 }}>You haven't applied to any jobs yet.</p>
                  </div>
                ) : (
                  dashboardData.recentApplications.map((job) => (
                    <div key={job.id} className="list-item" onClick={() => navigate(`/student/job/${job.id}`)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>
                          {job.title[0]}
                        </div>
                        <div>
                          <p style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontWeight: 700, fontSize: '1rem' }}>{job.title}</p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {job.company?.name || "Company"} • {formatCurrency(job.salary)}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {renderBadge(job._status)}
                        <FiChevronRight color="#cbd5e1" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Recommended / Active Jobs */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>Recommended Opportunities</h3>
                <button onClick={() => navigate("/student/apply")} style={{ background: 'transparent', border: 'none', color: '#4f46e5', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Browse All</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
                {dashboardData.recommendedJobs.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>📭</span>
                    <p style={{ margin: 0, fontWeight: 600 }}>No new active jobs currently available.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    {dashboardData.recommendedJobs.map((job) => (
                      <div key={job.id} onClick={() => navigate(`/student/job/${job.id}`)} style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#cbd5e1'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.05rem', fontWeight: 800 }}>{job.title}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiMapPin /> {job.company?.name || "Local"}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiDollarSign /> {formatCurrency(job.salary)}</span>
                          </div>
                        </div>
                        <span style={{ backgroundColor: '#eff6ff', color: '#3b82f6', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>Apply</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default StudentDashboard;