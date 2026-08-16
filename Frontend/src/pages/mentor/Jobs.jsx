import { useState, useEffect, useMemo } from "react";
import { 
  FiSearch, FiMapPin, FiDollarSign, FiCalendar, 
  FiBriefcase, FiChevronDown, FiChevronUp, FiClock, 
  FiFileText, FiCheckCircle, FiXCircle, FiLock, FiExternalLink 
} from "react-icons/fi";
import { apiFetch } from "../../utils/api";

const formatCurrency = (amount) => amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "Not Disclosed";
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A";

function MentorJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("current");

  // State for expanding students within the card
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [expandedJobData, setExpandedJobData] = useState({});
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/mentor/jobs?filter=${activeFilter}&limit=100`);
        const fetchedJobs = res.data?.data?.jobs || res.data?.jobs || [];
        setJobs(Array.isArray(fetchedJobs) ? fetchedJobs : []);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [activeFilter]);

  const toggleExpand = async (jobId) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      return;
    }
    setExpandedJobId(jobId);

    if (!expandedJobData[jobId]) {
      try {
        const res = await apiFetch(`/api/mentor/job/${jobId}`);
        setExpandedJobData(prev => ({ ...prev, [jobId]: res.data?.data || res.data }));
      } catch (err) {
        console.error("Error fetching job details:", err);
      }
    }
  };

  const handleDecision = async (jobId, applicationId, decision) => {
    setProcessingId(applicationId);
    try {
      await apiFetch(`/api/mentor/application/${applicationId}/decision`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: decision }),
      });

      setExpandedJobData(prev => {
        const job = prev[jobId];
        if (!job) return prev;
        const updatedJob = { ...job };
        Object.keys(updatedJob.applications).forEach(group => {
          updatedJob.applications[group] = updatedJob.applications[group].map(app => 
            app.id === applicationId ? { ...app, mentorApproval: decision } : app
          );
        });
        return { ...prev, [jobId]: updatedJob };
      });
    } catch (err) {
      alert(err?.response?.data?.message || "Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => 
      job.title?.toLowerCase().includes(search.toLowerCase()) || 
      job.company?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [jobs, search]);

  return (
    <>
      <style>{`
        .job-card-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; margin-bottom: 1.5rem; overflow: hidden; transition: 0.3s; }
        .job-card-container:hover { border-color: #4f46e5; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        .job-main-row { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .student-dropdown { padding: 0 1.5rem 1.5rem 1.5rem; background: #f8fafc; border-top: 1px solid #f1f5f9; }
        
        .mini-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 1rem; }
        .mini-table th { background: #f1f5f9; padding: 10px 15px; text-align: left; font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .mini-table td { padding: 12px 15px; border-top: 1px solid #f1f5f9; font-size: 0.85rem; }

        .btn-mini { padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px; }
        .btn-appr { background: #10b981; color: #fff; }
        .btn-rejt { background: #ef4444; color: #fff; margin-left: 5px; }
        .status-pill { padding: 4px 8px; border-radius: 5px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
      `}</style>

      <div style={{ height: 'calc(100vh - 40px)', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
        <div className="employees-page" style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem' }}>
          
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Job Directory</h2>
            <p style={{ color: '#64748b' }}>Click on a job card to manage student applications directly.</p>
          </div>

          {/* Search and Filter */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
             <input 
               className="settings-input" 
               placeholder="Search job or company..." 
               value={search} 
               onChange={e => setSearch(e.target.value)} 
               style={{ maxWidth: '400px', borderRadius:"15px" }}
             />
             <div style={{ display: 'flex', gap: '5px', background: '#fff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
               <button onClick={() => setActiveFilter("current")} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeFilter === 'current' ? '#4f46e5' : 'transparent', color: activeFilter === 'current' ? '#fff' : '#64748b', fontWeight: 700, cursor: 'pointer' }}>Active</button>
               <button onClick={() => setActiveFilter("past")} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeFilter === 'past' ? '#4f46e5' : 'transparent', color: activeFilter === 'past' ? '#fff' : '#64748b', fontWeight: 700, cursor: 'pointer' }}>Past</button>
             </div>
          </div>

          {loading ? <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Jobs...</div> : (
            <div>
              {filteredJobs.map(job => {
                const isExpanded = expandedJobId === job.id;
                const details = expandedJobData[job.id];
                const isPastJob = new Date(job.dueDate) < new Date();

                return (
                  <div key={job.id} className="job-card-container">
                    <div className="job-main-row" onClick={() => toggleExpand(job.id)}>
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', background: '#eff6ff', color: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>{job.title[0]}</div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{job.title}</h3>
                          <div style={{ display: 'flex', gap: '15px', color: '#64748b', fontSize: '0.85rem', marginTop: '4px', fontWeight: 600 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiMapPin /> {job.company?.name}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiDollarSign /> {formatCurrency(job.salary)}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiCalendar /> Deadline: {formatDate(job.dueDate)}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ color: '#94a3b8' }}>{isExpanded ? <FiChevronUp size={24}/> : <FiChevronDown size={24}/>}</div>
                    </div>

                    {isExpanded && (
                      <div className="student-dropdown">
                        {isPastJob && (
                          <div style={{ padding: '10px', background: '#fff7ed', color: '#c2410c', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiLock /> Application decisions are locked for past jobs.
                          </div>
                        )}
                        {!details ? <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>Loading applicants...</div> : (
                          <table className="mini-table">
                            <thead>
                              <tr>
                                <th>Student</th>
                                <th>Branch</th>
                                <th>Resume</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.values(details.applications).flat().length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>No applicants yet.</td></tr>
                              ) : (
                                Object.values(details.applications).flat().map(app => (
                                  <tr key={app.id}>
                                    <td>
                                      <div style={{ fontWeight: 700 }}>{app.student?.user?.name}</div>
                                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{app.student?.rollNo}</div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{app.student?.branch}</td>
                                    <td>
                                      {app.student?.resume ? <a href={app.student.resume} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 700 }}><FiFileText /> View</a> : "—"}
                                    </td>
                                    <td>
                                      <span className="status-pill" style={{ 
                                        background: app.mentorApproval === 'approved' ? '#dcfce7' : app.mentorApproval === 'rejected' ? '#fee2e2' : '#fefce8',
                                        color: app.mentorApproval === 'approved' ? '#166534' : app.mentorApproval === 'rejected' ? '#991b1b' : '#854d0e'
                                      }}>
                                        {app.mentorApproval || "pending"}
                                      </span>
                                    </td>
                                    <td style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                      {(app.mentorApproval === 'pending' || !app.mentorApproval) && !isPastJob ? (
                                        <>
                                          <button onClick={() => handleDecision(job.id, app.id, "approved")} className="btn-mini btn-appr" disabled={processingId === app.id}><FiCheckCircle /> Approve</button>
                                          <button onClick={() => handleDecision(job.id, app.id, "rejected")} className="btn-mini btn-rejt" disabled={processingId === app.id}><FiXCircle /> Reject</button>
                                        </>
                                      ) : (
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{isPastJob ? "Closed" : "Processed"}</span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default MentorJobsPage;