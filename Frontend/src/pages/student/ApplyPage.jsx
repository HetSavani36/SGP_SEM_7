import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiDollarSign, FiCalendar, FiClock, FiBriefcase } from "react-icons/fi";
import { apiFetch } from "../../utils/api";

const formatCurrency = (amount) => amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "Not Disclosed";
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A";
const getInitials = (title) => title ? title.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join("") : "JB";

function ApplyPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await apiFetch(`/api/student/jobs?filter=not_applied&limit=50`);
        const fetchedJobs = res.data?.jobs || res.data || [];
        console.log(res.data);
        
        setJobs(Array.isArray(fetchedJobs) ? fetchedJobs : []);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) =>
      job.title?.toLowerCase().includes(search.toLowerCase())
    );
  }, [jobs, search]);

  return (
    <div style={{ height: 'calc(100vh - 40px)', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="employees-page" style={{ flexGrow: 1, overflowY: 'auto', padding: '0 2rem 5rem 2rem' }}>
        
        <div className="employees-header" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
          <h2 className="page-title">Discover Opportunities</h2>
          <p className="page-subtitle">Explore active jobs curated specifically for your college.</p>
        </div>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <input
            className="search-input"
            placeholder="Search by job title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: '320px', margin: 0 }}
          />
        </div>

        {loading ? (
          <div className="dashboard-loading" style={{ padding: '4rem 0' }}>Fetching active jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>No new jobs available</h3>
            <p style={{ margin: 0, color: '#64748b' }}>You have applied to all active postings, or none match your search.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredJobs.map((job) => {
              const isClosingSoon = new Date(job.dueDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); 

              return (
                <div 
                  key={job.id} 
                  className="card" 
                  onClick={() => navigate(`/student/job/${job.id}`)}
                  style={{ 
                    padding: '1.5rem', display: 'flex', flexDirection: 'column', cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      {getInitials(job.title)}
                    </div>
                    {isClosingSoon && (
                      <span style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiClock /> Closing Soon
                      </span>
                    )}
                  </div>

                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.15rem', lineHeight: '1.3' }}>{job.title}</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', flexGrow: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem' }}>
                      <FiDollarSign className="text-gray-400" /><strong style={{ color: '#334155' }}>{formatCurrency(job.salary)}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem' }}>
                      <FiCalendar className="text-gray-400" />Deadline: {formatDate(job.dueDate)}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', color: '#4f46e5', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Review & Apply →
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ApplyPage;