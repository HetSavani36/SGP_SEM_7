import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiDollarSign, FiCalendar, FiClock, FiSearch } from "react-icons/fi";
import { apiFetch } from "../../utils/api";

const formatCurrency = (amount) => amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "Not Disclosed";
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A";
const getInitials = (title) => title ? title.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join("") : "JB";

function JobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("current"); 

  const filters = [
    { id: "current", label: "Active Jobs" },
    { id: "not_applied", label: "Not Applied" },
    { id: "all", label: "All Postings" },
    { id: "past", label: "Expired" },
  ];

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/student/jobs?filter=${activeFilter}&limit=100`);
        const fetchedJobs = res.data?.jobs || res.data || [];
        setJobs(Array.isArray(fetchedJobs) ? fetchedJobs : []);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [activeFilter]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => 
      job.title?.toLowerCase().includes(search.toLowerCase()) || 
      job.company?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [jobs, search]);

  return (
    <>
      <style>{`
        .premium-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: #cbd5e1;
        }
        .filter-btn {
          padding: 8px 16px;
          border-radius: 10px;
          border: none;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-btn:hover { background-color: #e2e8f0; }
        .filter-btn.active {
          background-color: #ffffff; color: #0f172a; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .filter-btn.inactive {
          background-color: transparent; color: #64748b;
        }
      `}</style>

      <div style={{ height: 'calc(100vh - 40px)', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
        <div className="employees-page" style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem' }}>
          
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Job Directory</h2>
            <p style={{ fontSize: '1.05rem', color: '#64748b', margin: 0 }}>Explore and search all available college job postings.</p>
          </div>

          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '2.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ position: 'relative', marginBottom: '2rem', maxWidth: '600px' }}>
              <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.2rem' }} />
              <input 
                placeholder="Search by job title or company..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                style={{ width: '100%', padding: '16px 20px 16px 48px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', backgroundColor: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} 
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Filters</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
                {filters.map(f => (
                  <button key={f.id} onClick={() => setActiveFilter(f.id)} className={`filter-btn ${activeFilter === f.id ? 'active' : 'inactive'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '4rem 0', textAlign: 'center', color: '#64748b', fontSize: '1.2rem', fontWeight: 600 }}>Loading job directory...</div>
          ) : filteredJobs.length === 0 ? (
            <div style={{ padding: '5rem 2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
              <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>📭</span>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: 800 }}>No jobs found</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '1.05rem' }}>No active jobs match your search or filter.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
              {filteredJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="premium-card" 
                  onClick={() => navigate(`/student/job/${job.id}`)}
                  style={{ opacity: activeFilter === "past" ? 0.65 : 1 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800 }}>
                      {getInitials(job.title)}
                    </div>
                    {activeFilter === "past" && <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, backgroundColor: '#f1f5f9', color: '#475569', textTransform: 'uppercase' }}><FiClock /> Expired</span>}
                    {activeFilter === "not_applied" && <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, backgroundColor: '#f3e8ff', color: '#7e22ce', textTransform: 'uppercase' }}>New</span>}
                  </div>
                  
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.3rem', fontWeight: 800, lineHeight: '1.3' }}>{job.title}</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', flexGrow: 1, marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '0.95rem', fontWeight: 500 }}>
                      <div style={{ padding: '6px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}><FiDollarSign color="#10b981"/></div>
                      <strong style={{ color: '#0f172a' }}>{formatCurrency(job.salary)}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '0.95rem', fontWeight: 500 }}>
                      <div style={{ padding: '6px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}><FiCalendar color="#3b82f6"/></div>
                      Deadline: {formatDate(job.dueDate)}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', color: '#4f46e5', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    View Job Details →
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default JobsPage;