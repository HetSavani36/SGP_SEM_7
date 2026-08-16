import { useState, useEffect } from "react";
import { 
  FiChevronDown, FiChevronUp, FiCheckCircle, FiXCircle, 
  FiClock, FiSearch, FiFileText, FiMapPin, FiExternalLink, FiLock
} from "react-icons/fi";
import { apiFetch } from "../../utils/api";

function MentorApprovalsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Stores detailed job data (including applications) when a job is expanded
  const [expandedJobData, setExpandedJobData] = useState({});
  const [expandedJobId, setExpandedJobId] = useState(null);
  
  const [processingId, setProcessingId] = useState(null);

  // --- 1. FETCH INITIAL JOBS LIST ---
  useEffect(() => {
    const fetchJobsList = async () => {
      try {
        // Uses your existing getAllJobs endpoint
        const res = await apiFetch("/api/mentor/jobs?filter=current");
        const fetchedJobs = res.data?.data?.jobs || res.data?.jobs || [];
        setJobs(fetchedJobs);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobsList();
  }, []);

  // --- 2. FETCH JOB DETAILS ON EXPAND ---
  const toggleExpand = async (jobId) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      return;
    }

    setExpandedJobId(jobId);

    // Only fetch if we don't already have the details for this job
    if (!expandedJobData[jobId]) {
      try {
        const res = await apiFetch(`/api/mentor/job/${jobId}`);
        const jobDetails = res.data?.data || res.data;
        
        setExpandedJobData(prev => ({
          ...prev,
          [jobId]: jobDetails
        }));
      } catch (err) {
        console.error("Failed to fetch job details:", err);
      }
    }
  };

  // --- 3. HANDLE MENTOR DECISION (Approve/Reject) ---
  const handleDecision = async (jobId, applicationId, decision) => {
    setProcessingId(applicationId);
    try {
      // Matches your makeStudentApplicationDecision backend API
      await apiFetch(`/api/mentor/application/${applicationId}/decision`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: decision }), // Backend expects { result: "approved" | "rejected" }
      });

      // Update local state to show the new status immediately
      setExpandedJobData(prev => {
        const job = prev[jobId];
        if (!job) return prev;

        const updatedJob = { ...job };
        // Your backend groups applications by status (pending, shortlisted, etc.)
        Object.keys(updatedJob.applications).forEach(group => {
          updatedJob.applications[group] = updatedJob.applications[group].map(app => 
            app.id === applicationId ? { ...app, mentorApproval: decision } : app
          );
        });

        return { ...prev, [jobId]: updatedJob };
      });

    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(search.toLowerCase()) || 
    job.company?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderStatusBadge = (status) => {
    switch (status) {
      case "approved": return <span className="badge badge-success"><FiCheckCircle /> Approved</span>;
      case "rejected": return <span className="badge badge-danger"><FiXCircle /> Rejected</span>;
      default: return <span className="badge badge-warning"><FiClock /> Pending</span>;
    }
  };

  if (loading) return <div className="dashboard-loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading assigned jobs...</div>;

  return (
    <>
      <style>{`
        .job-accordion { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; }
        .job-header { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s; }
        .job-header:hover { background: #f8fafc; }
        .job-body { padding: 0 1.5rem 1.5rem 1.5rem; border-top: 1px solid #f1f5f9; background: #f8fafc; }
        
        .student-table { width: 100%; border-collapse: collapse; margin-top: 1rem; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; }
        .student-table th { background: #f1f5f9; padding: 12px 16px; text-align: left; font-size: 0.8rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .student-table td { padding: 14px 16px; border-top: 1px solid #f1f5f9; vertical-align: middle; font-size: 0.9rem; }
        
        .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; display: inline-flex; alignItems: center; gap: 4px; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-warning { background: #fefce8; color: #854d0e; }
        
        .btn-action { padding: 8px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: 0.2s; }
        .btn-approve { background: #10b981; color: #fff; }
        .btn-reject { background: #ef4444; color: #fff; margin-left: 6px; }
        .btn-disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div style={{ height: 'calc(100vh - 40px)', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
        <div className="employees-page" style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem' }}>
          
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '0' }}>Student Approvals</h2>
            <p style={{ color: '#64748b', marginTop: '4px' }}>Manage applications for your assigned jobs.</p>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '2rem', maxWidth: '500px', position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              placeholder="Search job or company..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }} 
            />
          </div>

          {filteredJobs.map((job) => {
            const isExpanded = expandedJobId === job.id;
            const details = expandedJobData[job.id];
            const isPastJob = new Date(job.dueDate) < new Date();

            return (
              <div key={job.id} className="job-accordion">
                <div className="job-header" onClick={() => toggleExpand(job.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '45px', height: '45px', background: '#eff6ff', color: '#3b82f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {job.title[0]}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{job.title}</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{job.company?.name}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {isPastJob && <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><FiLock /> DEADLINE PASSED</span>}
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="job-body">
                    {isPastJob && (
                      <div style={{ padding: '10px', background: '#fff7ed', color: '#c2410c', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', border: '1px solid #ffedd5' }}>
                        Notice: This job's deadline has passed. Decisions are locked.
                      </div>
                    )}

                    {!details ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading applications...</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="student-table">
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Roll & Branch</th>
                              <th>Resume</th>
                              <th>Status</th>
                              <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.values(details.applications).flat().length === 0 ? (
                               <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No applications found.</td></tr>
                            ) : (
                              Object.values(details.applications).flat().map((app) => {
                                const isProcessed = app.mentorApproval && app.mentorApproval !== "pending";
                                return (
                                  <tr key={app.id}>
                                    <td>
                                      <div style={{ fontWeight: 700 }}>{app.student?.user?.name}</div>
                                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{app.student?.user?.email}</div>
                                    </td>
                                    <td>
                                      <div style={{ fontWeight: 600 }}>{app.student?.rollNo}</div>
                                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{app.student?.branch}</div>
                                    </td>
                                    <td>
                                      {app.student?.resume ? (
                                        <a href={app.student.resume} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <FiFileText /> View
                                        </a>
                                      ) : "—"}
                                    </td>
                                    <td>{renderStatusBadge(app.mentorApproval || "pending")}</td>
                                    <td style={{ textAlign: 'right' }}>
                                      {!isProcessed && !isPastJob ? (
                                        <>
                                          <button onClick={() => handleDecision(job.id, app.id, "approved")} className="btn-action btn-approve" disabled={processingId === app.id}>
                                            {processingId === app.id ? "..." : "Approve"}
                                          </button>
                                          <button onClick={() => handleDecision(job.id, app.id, "rejected")} className="btn-action btn-reject" disabled={processingId === app.id}>
                                            {processingId === app.id ? "..." : "Reject"}
                                          </button>
                                        </>
                                      ) : (
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                                          {isPastJob && !isProcessed ? "Locked" : "Completed"}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default MentorApprovalsPage;