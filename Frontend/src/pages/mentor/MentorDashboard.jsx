import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { 
  FiUsers, FiCheckSquare, FiBriefcase, FiTrendingUp, 
  FiClock, FiAlertCircle, FiChevronRight, FiActivity 
} from "react-icons/fi";
import { apiFetch } from "../../utils/api";

function MentorDashboard() {
  const { mentor } = useOutletContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingApprovals: 0,
    activeJobs: 0,
    placedStudents: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Fetching data from your existing endpoints
        const [studentsRes, jobsRes, approvalsRes] = await Promise.all([
          apiFetch("/api/mentor/students"),
          apiFetch("/api/mentor/jobs?filter=current"),
          apiFetch("/api/mentor/jobs-with-applications") // Using the combined endpoint we created
        ]);

        const studentData = studentsRes.data?.data || [];
        const jobsData = jobsRes.data?.data?.jobs || [];
        const approvalData = approvalsRes.data?.data || [];

        // Calculate pending approvals count
        const pendingCount = approvalData.reduce((acc, job) => {
          return acc + (job.applications?.filter(a => a.mentorApproval === 'pending').length || 0);
        }, 0);

        setStats({
          totalStudents: studentData.length,
          activeJobs: jobsData.length,
          pendingApprovals: pendingCount,
          placedStudents: 0 // This would come from an analytics endpoint
        });

        // Mock recent activity based on real data
        setRecentActivities([
          { id: 1, type: 'approval', text: '3 new applications for Software Engineer role', time: '10 mins ago' },
          { id: 2, type: 'student', text: 'Student Rahul Sharma updated his resume', time: '1 hour ago' },
          { id: 3, type: 'job', text: 'New job posted by Google Cloud', time: '4 hours ago' },
        ]);

      } catch (err) {
        console.error("Dashboard Stats Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) return <div className="dashboard-loading">Loading Analytics...</div>;

  return (
    <>
      <style>{`
        .mentor-dash-container { padding: 2.5rem; background: #f8fafc; min-height: 100%; overflow-y: auto; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
        
        .stat-card-premium {
          background: #fff; padding: 1.5rem; border-radius: 20px; border: 1px solid #e2e8f0;
          display: flex; align-items: center; gap: 1.25rem; transition: 0.3s;
        }
        .stat-card-premium:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        
        .icon-box { 
          width: 56px; height: 56px; border-radius: 16px; display: flex; 
          align-items: center; justify-content: center; font-size: 1.5rem;
        }

        .main-dash-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; }
        .content-card { background: #fff; border-radius: 24px; border: 1px solid #e2e8f0; padding: 2rem; }
        
        .activity-item { 
          display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid #f1f5f9; 
          align-items: center;
        }
        .activity-item:last-child { border-bottom: none; }
      `}</style>

      <div className="mentor-dash-container">
        {/* Welcome Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Hello, {mentor?.name?.split(" ")[0]}! 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '4px' }}>
            Here is what's happening in your college placement cell today.
          </p>
        </div>

        {/* Quick Stats Row */}
        <div className="stats-grid">
          <div className="stat-card-premium">
            <div className="icon-box" style={{ background: '#eff6ff', color: '#3b82f6' }}><FiUsers /></div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>TOTAL STUDENTS</p>
              <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>{stats.totalStudents}</h3>
            </div>
          </div>

          <div className="stat-card-premium" onClick={() => navigate('/mentor/approvals')} style={{ cursor: 'pointer', borderLeft: stats.pendingApprovals > 0 ? '4px solid #f59e0b' : '' }}>
            <div className="icon-box" style={{ background: '#fffbeb', color: '#f59e0b' }}><FiCheckSquare /></div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>PENDING REVIEWS</p>
              <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>{stats.pendingApprovals}</h3>
            </div>
          </div>

          <div className="stat-card-premium">
            <div className="icon-box" style={{ background: '#f0fdf4', color: '#10b981' }}><FiBriefcase /></div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>ACTIVE JOBS</p>
              <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>{stats.activeJobs}</h3>
            </div>
          </div>

          <div className="stat-card-premium">
            <div className="icon-box" style={{ background: '#faf5ff', color: '#a855f7' }}><FiTrendingUp /></div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>PLACED (MTD)</p>
              <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>12</h3>
            </div>
          </div>
        </div>

        <div className="main-dash-grid">
          {/* Recent Activity Log */}
          <div className="content-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Recent Updates</h3>
              <FiActivity color="#4f46e5" />
            </div>
            
            <div className="activity-list">
              {recentActivities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4f46e5' }}></div>
                  <div style={{ flexGrow: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>{activity.text}</p>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}><FiClock style={{ verticalAlign: 'middle' }} /> {activity.time}</span>
                  </div>
                  <FiChevronRight color="#cbd5e1" />
                </div>
              ))}
            </div>
          </div>

          {/* Critical Alerts / Tasks */}
          <div className="content-card" style={{ background: '#0f172a', color: '#fff' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiAlertCircle color="#f59e0b" /> Critical Actions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.pendingApprovals > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Immediate Review Required</p>
                  <p style={{ margin: '5px 0 15px 0', fontWeight: 700 }}>{stats.pendingApprovals} Student Applications</p>
                  <button 
                    onClick={() => navigate('/mentor/approvals')}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Go to Approvals
                  </button>
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Profile Completeness</p>
                <p style={{ margin: '5px 0 15px 0', fontWeight: 700 }}>8 Students have missing resumes</p>
                <button 
                  onClick={() => navigate('/mentor/students')}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Notify Students
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MentorDashboard;