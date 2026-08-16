import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";

/* ---------- Helpers ---------- */
function getInitials(name) {
  if (!name) return "M";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function MentorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { college } = useOutletContext();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [mentor, setMentor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filter, setFilter] = useState("jobs_current"); 

  /* ---------- FETCH MENTOR DETAILS ---------- */
  const fetchMentorDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const queryParam = filter ? `?filter=${filter}` : "";
      const res = await fetch(`${apiUrl}/api/college/mentor/${id}${queryParam}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch mentor details");
      }

      setMentor(data.data);
    } catch (err) {
      console.error("Mentor details fetch error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, id, filter]);

  useEffect(() => {
    fetchMentorDetails();
  }, [fetchMentorDetails]);

  if (isLoading && !mentor) {
    return <div className="dashboard-loading">Loading mentor details...</div>;
  }

  if (error) {
    return (
      <div className="empty-state" style={{ color: '#ef4444' }}>
        <h3>Oops!</h3>
        <p>{error}</p>
        <button className="btn-outline" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
          Go Back
        </button>
      </div>
    );
  }

  if (!mentor) return null;

  return (
    // ✅ Added minHeight and paddingBottom to ensure the whole page can scroll freely
    <div
  className="employees-page"
  style={{
    height: "100%",
    overflowY: "auto",
    paddingBottom: "60px"
  }}
>
      
      {/* ================= HEADER WITH BACK BUTTON ================= */}
      <div className="employees-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => navigate('/college/mentors')} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#64748b' }}
        >
          ←
        </button>
        <div>
          <h2 className="page-title">Mentor Profile</h2>
          <p className="page-subtitle">
            Viewing details for <strong>{mentor.name}</strong>
          </p>
        </div>
      </div>

      {/* ================= MENTOR INFO CARD ================= */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexShrink: 0 }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#4f46e5',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 'bold'
        }}>
          {getInitials(mentor.name)}
        </div>
        
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: '#0f172a' }}>{mentor.name}</h3>
          <p style={{ margin: 0, color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span><strong>Email:</strong> {mentor.email}</span>
            <span><strong>Mentor ID:</strong> {mentor.id}</span>
            <span><strong>System User ID:</strong> {mentor.userId}</span>
          </p>
        </div>
      </div>

      {/* ================= ASSIGNED JOBS SECTION ================= */}
      {/* ✅ Made this card a flex container with a maxHeight to enable internal scrolling */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '65vh' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
          <h3 style={{ margin: 0 }}>Assigned Jobs</h3>
          
          <div className="filter-tabs" style={{ margin: 0 }}>
            <button
              className={`filter-pill ${filter === "" ? "active" : ""}`}
              onClick={() => setFilter("")}
            >
              All Jobs
            </button>
            <button
              className={`filter-pill ${filter === "jobs_current" ? "active" : ""}`}
              onClick={() => setFilter("jobs_current")}
            >
              Current
            </button>
            <button
              className={`filter-pill ${filter === "jobs_past" ? "active" : ""}`}
              onClick={() => setFilter("jobs_past")}
            >
              Past
            </button>
          </div>
        </div>

        {/* ✅ Wrapped the jobs list in an overflow-y container */}
        <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '10px', paddingBottom: '10px' }}>
          {isLoading ? (
            <div className="dashboard-loading" style={{ padding: '2rem 0' }}>Refreshing jobs...</div>
          ) : !mentor.jobs || mentor.jobs.length === 0 ? (
            <div className="empty-state" style={{ 
              padding: '3rem', 
              textAlign: 'center', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px', 
              border: '1px dashed #cbd5e1' 
            }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
              <p style={{ margin: 0, color: '#64748b' }}>No jobs assigned to this mentor for the selected filter.</p>
            </div>
          ) : (
            <div className="jobs-cards-clean" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '1.5rem', 
              marginTop: '0.5rem' 
            }}>
              {mentor.jobs.map((job) => (
                <div 
                  key={job.id} 
                  className="job-card-soft" 
                  style={{ 
                    padding: '1.25rem', 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0', 
                    borderLeft: '4px solid #4f46e5',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div className="job-title-soft" style={{ fontWeight: 600, color: '#0f172a', fontSize: '1.1rem', lineHeight: '1.4' }}>
                        {job.title}
                      </div>
                      <div style={{
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        marginLeft: '1rem'
                      }}>
                        Role
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                      <span>🏷️</span>
                      <span style={{ fontFamily: 'monospace' }}>ID: {job.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </div>

                  <div style={{ 
                    marginTop: '1.25rem', 
                    paddingTop: '1rem', 
                    borderTop: '1px solid #f1f5f9', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      {filter === 'jobs_past' ? 'Archived' : 'Active Assignment'}
                    </span>
                    <span onClick={() => navigate(`/college/jobs/${job.id}`)} style={{ color: '#4f46e5', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      View <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>→</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ✅ EXPLICIT BOTTOM SPACER */}
      <div style={{ height: '50px', width: '100%', flexShrink: 0 }}></div>

    </div>
  );
}

export default MentorDetailsPage;