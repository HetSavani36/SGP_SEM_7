import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiDollarSign, FiCalendar, FiSearch, FiClock, FiCheckCircle, FiXCircle, FiFilter, FiList } from "react-icons/fi";
import { apiFetch } from "../../utils/api";

const formatCurrency = (amount) => amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "Not Disclosed";
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A";
const getInitials = (title) => title ? title.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join("") : "JB";

function MentorApprovedPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Default to the new "All" filter
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deadline"); // deadline, salary, title

  const filters = [
    { id: "all", label: "All Records" },
    { id: "mentor_approval_pending", label: "Pending" },
    { id: "mentor_approval_approved", label: "Approved" },
    { id: "mentor_approval_rejected", label: "Rejected" },
  ];

  /* ---------------- FETCH & MERGE LOGIC ---------------- */
  useEffect(() => {
    const fetchMentorApprovals = async () => {
      setLoading(true);
      try {
        if (activeFilter === "all") {
          // Fetch all three categories concurrently to build the "All" view
          const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
            apiFetch(`/api/student/jobs?filter=mentor_approval_pending&limit=100`),
            apiFetch(`/api/student/jobs?filter=mentor_approval_approved&limit=100`),
            apiFetch(`/api/student/jobs?filter=mentor_approval_rejected&limit=100`)
          ]);

          // Extract arrays and attach a frontend status tag for the badges
          const pending = (pendingRes.data?.jobs || pendingRes.data || []).map(j => ({ ...j, _status: "pending" }));
          const approved = (approvedRes.data?.jobs || approvedRes.data || []).map(j => ({ ...j, _status: "approved" }));
          const rejected = (rejectedRes.data?.jobs || rejectedRes.data || []).map(j => ({ ...j, _status: "rejected" }));

          setJobs([...pending, ...approved, ...rejected]);
        } else {
          // Fetch just the specific filter
          const res = await apiFetch(`/api/student/jobs?filter=${activeFilter}&limit=100`);
          const fetchedJobs = res.data?.jobs || res.data || [];
          
          // Determine tag based on active filter
          const statusTag = activeFilter.includes("approved") ? "approved" : activeFilter.includes("rejected") ? "rejected" : "pending";
          setJobs((Array.isArray(fetchedJobs) ? fetchedJobs : []).map(j => ({ ...j, _status: statusTag })));
        }
      } catch (err) {
        console.error("Failed to fetch mentor approvals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMentorApprovals();
  }, [activeFilter]);

  /* ---------------- SEARCH & SORT LOGIC ---------------- */
  const processedJobs = useMemo(() => {
    // 1. Search Filter
    let filtered = jobs.filter(job => 
      job.title?.toLowerCase().includes(search.toLowerCase())
    );

    // 2. Sort Logic
    return filtered.sort((a, b) => {
      if (sortBy === "deadline") {
        return new Date(a.dueDate) - new Date(b.dueDate); // Closest deadline first
      } else if (sortBy === "salary") {
        return Number(b.salary || 0) - Number(a.salary || 0); // High to Low
      } else if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || ""); // A-Z
      }
      return 0; 
    });
  }, [jobs, search, sortBy]);

  /* ---------------- DYNAMIC BADGE RENDERER ---------------- */
  const renderBadge = (status) => {
    const style = { padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' };
    switch (status) {
      case "approved": return <span style={{ ...style, backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}><FiCheckCircle size={14} /> Approved</span>;
      case "rejected": return <span style={{ ...style, backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}><FiXCircle size={14} /> Rejected</span>;
      case "pending": return <span style={{ ...style, backgroundColor: '#fefce8', color: '#854d0e', border: '1px solid #fef08a' }}><FiClock size={14} /> Pending</span>;
      default: return null;
    }
  };

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
        .sort-select {
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background-color: #fff;
          color: #0f172a;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
        }
        .sort-select:hover { border-color: #94a3b8; }
      `}</style>

      <div style={{ height: 'calc(100vh - 40px)', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
        <div className="employees-page" style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem' }}>
          
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Mentor Approvals</h2>
            <p style={{ fontSize: '1.05rem', color: '#64748b', margin: 0 }}>Track your college coordinator's review of your applications.</p>
          </div>

          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '2.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            
            {/* Search and Sort Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ position: 'relative', flexGrow: 1, maxWidth: '500px' }}>
                <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.2rem' }} />
                <input 
                  placeholder="Search applications by job title..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  style={{ width: '100%', padding: '12px 20px 12px 48px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', backgroundColor: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiFilter color="#64748b" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b' }}>Sort by:</span>
                <select 
                  className="sort-select" 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="deadline">Deadline: Closing Soon</option>
                  <option value="salary">Salary: High to Low</option>
                  <option value="title">Job Title (A-Z)</option>
                </select>
              </div>
            </div>
            
            {/* Filters Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Approval Status</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
                {filters.map(f => (
                  <button key={f.id} onClick={() => setActiveFilter(f.id)} className={`filter-btn ${activeFilter === f.id ? 'active' : 'inactive'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* GRID RENDERER */}
          {loading ? (
            <div style={{ padding: '4rem 0', textAlign: 'center', color: '#64748b', fontSize: '1.2rem', fontWeight: 600 }}>Loading mentor approvals...</div>
          ) : processedJobs.length === 0 ? (
            <div style={{ padding: '5rem 2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
              <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>🎓</span>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: 800 }}>No applications found</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '1.05rem' }}>There are no records matching your current filter.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
              {processedJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="premium-card" 
                  onClick={() => navigate(`/student/job/${job.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800 }}>
                      {getInitials(job.title)}
                    </div>
                    {/* Render the dynamically attached tag from our Promise.all logic */}
                    {renderBadge(job._status)}
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

export default MentorApprovedPage;