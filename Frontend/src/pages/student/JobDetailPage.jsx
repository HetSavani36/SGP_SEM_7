import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { 
  FiMapPin, FiDollarSign, FiCalendar, FiBriefcase, FiUser, 
  FiMail, FiPhone, FiAlertCircle, FiLock, FiCheckCircle, FiClock, FiFileText
} from "react-icons/fi";
import { apiFetch } from "../../utils/api";

const formatCurrency = (amount) => amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "Not Disclosed";
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A";

function JobDetailsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyLoading, setApplyLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const idempotencyKeyRef = useRef(null);

  /* ---------------- FETCH JOB DETAILS ---------------- */
  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        const res = await apiFetch(`/api/student/job/${jobId}`);
        setJob(res.data?.data ?? res.data);
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: err?.message || "Access Restricted or Job Not Found" });
      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchJobDetail();
  }, [jobId]);

  /* ---------------- APPLY LOGIC ---------------- */
  const handleApply = async () => {
    setApplyLoading(true);
    setMessage({ type: "", text: "" });

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = uuidv4();
    }

    try {
      // Endpoint exactly matches your student.route.js
      await apiFetch(`/api/student/apply/${jobId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKeyRef.current 
        },
      });

      setMessage({ type: "success", text: "Application submitted! Redirecting..." });
      
      // Optimistically update the UI to show 'pending' immediately
      setJob(prev => ({ ...prev, applicationStatus: "pending", mentorApprovalStatus: "pending" }));
      
      setTimeout(() => navigate("/student/applications"), 2000);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.data?.message || err?.message || "Failed to submit application.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setApplyLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) return <div className="dashboard-loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading job details...</div>;
  
  if (!job) return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', background: '#fff', marginBottom: '1.5rem', fontWeight: 600 }}>← Go Back</button>
      <div style={{ background: '#fee2e2', color: '#991b1b', padding: '2.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', border: '1px solid #fecaca' }}>
         <FiAlertCircle size={48} />
         <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Cannot Access Job</h2>
         <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: 1.5 }}>{message.text || "This job may be inactive, unapproved, or restricted to another college."}</p>
      </div>
    </div>
  );

  /* ================= BACKEND FEASIBILITY GUARDS ================= */
  const isExpired = new Date(job.dueDate) < new Date();
  const isClosed = job.status !== "active"; 
  const hasApplied = Boolean(job.applicationStatus);
  
  // Combine all conditions that should prevent the user from applying
  const isLocked = isExpired || isClosed || hasApplied;

  return (
    <div style={{ height: 'calc(100vh - 40px)', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      <div className="employees-page" style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem' }}>
        
        {/* ================= TOP NAVIGATION & HEADER ================= */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.2rem", color: "#475569", flexShrink: 0, transition: 'background 0.2s' }}>←</button>
          <div style={{ flexGrow: 1 }}>
            <p style={{ margin: 0, color: '#4f46e5', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>{job.company?.name}</p>
            <h2 style={{ margin: '4px 0 0 0', color: '#0f172a', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.2 }}>{job.title}</h2>
          </div>
          
          {/* Dynamic Top Badge for Application Status */}
          {hasApplied && (
            <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #bbf7d0' }}>
              <FiCheckCircle size={16} /> Applied ({job.applicationStatus})
            </span>
          )}
        </div>

        {/* ================= TOAST MESSAGES ================= */}
        {message.text && (
          <div style={{ padding: '1.25rem', marginBottom: '2rem', borderRadius: '12px', fontWeight: 600, backgroundColor: message.type === "success" ? "#dcfce7" : "#fee2e2", color: message.type === "success" ? "#166534" : "#991b1b", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`, display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '1.5rem' }}>{message.type === "success" ? "🎉" : <FiAlertCircle />}</span>
            {message.text}
          </div>
        )}

        {/* ================= MAIN CONTENT GRID ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          
          {/* ----------------- LEFT COLUMN ----------------- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Highlights Card */}
            <div style={{ padding: '2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiFileText color="#4f46e5" /> Job Overview
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Salary Package</p>
                  <p style={{ margin: 0, color: '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem' }}><FiDollarSign color="#10b981"/> {formatCurrency(job.salary)}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Job Type</p>
                  <p style={{ margin: 0, color: '#0f172a', fontWeight: 600, fontSize: '1.15rem' }}>{job.tenure || "Full-Time"}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Location</p>
                  <p style={{ margin: 0, color: '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem' }}><FiMapPin color="#f43f5e"/> {job.address || job.company?.address || "Unspecified"}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Deadline</p>
                  <p style={{ margin: 0, color: isExpired ? '#ef4444' : '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem' }}><FiCalendar color={isExpired ? "#ef4444" : "#3b82f6"}/> {formatDate(job.dueDate)}</p>
                </div>
              </div>
            </div>

            {/* Detailed Description Card */}
            <div style={{ padding: '2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.25rem' }}>About The Role</h3>
              <div style={{ color: '#475569', lineHeight: 1.6, fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                {job.description || "The company has not provided a detailed description for this role yet. Please refer to the job highlights and company information to learn more about the position and requirements."}
              </div>
            </div>

          </div>

          {/* ----------------- RIGHT COLUMN (Sticky) ----------------- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'sticky', top: '2rem' }}>
            
            {/* 1. Dynamic Application Action Card */}
            <div style={{ padding: '2rem', background: isLocked ? '#f8fafc' : '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: isLocked ? 'none' : '0 10px 25px -5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              
              <h3 style={{ margin: '0 0 0.5rem 0', color: isLocked ? '#475569' : '#0f172a', fontSize: '1.4rem' }}>
                {hasApplied ? "Application Tracked" : isClosed ? "Opportunity Closed" : isExpired ? "Deadline Passed" : "Start your career"}
              </h3>
              
              <p style={{ margin: '0 0 2rem 0', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {hasApplied ? "Your application is currently being processed by the college and company." : 
                 isLocked ? "This job is no longer accepting new applications at this time." : 
                 "Ensure your profile and resume are fully updated before applying."}
              </p>
              
              {/* THE APPLY BUTTON */}
              <button
                onClick={handleApply}
                disabled={isLocked || applyLoading}
                style={{
                  width: '100%', padding: '1.15rem', borderRadius: '12px', fontWeight: 800, fontSize: '1.05rem', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                  cursor: (isLocked || applyLoading) ? 'not-allowed' : 'pointer',
                  backgroundColor: hasApplied ? '#10b981' : isLocked ? '#cbd5e1' : '#4f46e5',
                  color: isLocked && !hasApplied ? '#64748b' : '#fff',
                  transition: 'all 0.3s ease',
                  boxShadow: isLocked ? 'none' : '0 4px 14px 0 rgba(79, 70, 229, 0.3)'
                }}
              >
                {applyLoading ? "Submitting..." : 
                 hasApplied ? <><FiCheckCircle size={18} /> Application Submitted</> : 
                 isExpired ? <><FiClock size={18} /> Deadline Passed</> : 
                 isClosed ? <><FiLock size={18} /> Posting Inactive</> : 
                 "Apply Now →"}
              </button>

              {/* DUAL PIPELINE TRACKER (Company & Mentor) */}
              {hasApplied && (
                <div style={{ marginTop: '1.5rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Company Status */}
                  <div style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#0f172a' }}>Company Status:</strong> 
                    <span style={{ 
                      color: job.applicationStatus === 'hired' ? '#16a34a' : job.applicationStatus === 'rejected' ? '#dc2626' : job.applicationStatus === 'shortlisted' ? '#2563eb' : '#d97706', 
                      fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.5px'
                    }}>
                      {job.applicationStatus}
                    </span>
                  </div>

                  {/* Mentor Status */}
                  {job.mentorApprovalStatus && (
                    <div style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#0f172a' }}>Mentor Approval:</strong> 
                      <span style={{ 
                        color: job.mentorApprovalStatus === 'approved' ? '#16a34a' : job.mentorApprovalStatus === 'rejected' ? '#dc2626' : '#d97706', 
                        fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.5px' 
                      }}>
                        {job.mentorApprovalStatus}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Company Info Card */}
            <div style={{ padding: '2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.15rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiBriefcase color="#4f46e5" /> About the Company
              </h3>
              
              <h4 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.3rem', fontWeight: 800 }}>{job.company?.name}</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {job.company?.address && (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', color: '#64748b' }}><FiMapPin size={18} /></div>
                    <div><p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Headquarters</p><p style={{ margin: 0, color: '#0f172a', fontSize: '0.95rem', fontWeight: 600 }}>{job.company?.address}</p></div>
                  </div>
                )}
                
                {job.company?.email && (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', color: '#64748b' }}><FiMail size={18} /></div>
                    <div><p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Email</p><p style={{ margin: 0, color: '#0f172a', fontSize: '0.95rem', fontWeight: 600 }}>{job.company?.email}</p></div>
                  </div>
                )}
                
                {job.company?.contactNo && (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', color: '#64748b' }}><FiPhone size={18} /></div>
                    <div><p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</p><p style={{ margin: 0, color: '#0f172a', fontSize: '0.95rem', fontWeight: 600 }}>{job.company?.contactNo}</p></div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Mentor Info Card (Only shows if mentor is assigned) */}
            {job.mentor && (
              <div style={{ padding: '2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', borderTop: '6px solid #a855f7', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>College Coordinator</h3>
                <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.4 }}>Responsible for reviewing your application before it reaches the company.</p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#faf5ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #f3e8ff' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e9d5ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                    <FiUser />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.mentor.name}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#7e22ce', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.mentor.email}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetailsPage;