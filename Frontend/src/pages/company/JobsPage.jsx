import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ---------- Helpers ---------- */
const formatCurrency = (amount) => {
  if (!amount) return "Not Disclosed";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function CompanyJobsPage() {
  const apiUrl = import.meta.env.VITE_API_URL;

  // --- UI & Filter States ---
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("CURRENT");
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // --- Data States ---
  const [jobs, setJobs] = useState([]);
  const [skills, setSkills] = useState([]);
  const [approvedColleges, setApprovedColleges] = useState([]); // 👈 Added for target colleges
  
  // --- Pagination State ---
  const [page, setPage] = useState(1);
  const [limit] = useState(9); 
  const [pagination, setPagination] = useState({
    totalJobs: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // --- Modal Form State ---
  const [jobForm, setJobForm] = useState({
    title: "",
    salary: "",
    tenure: "", // 👈 Added
    address: "", // 👈 Added
    dueDate: "",
    selectedSkills: [], // 👈 Now stores IDs
    selectedColleges: [], // 👈 Now stores IDs
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // map UI filter -> API filter
  const filterMap = {
    CURRENT: "current",
    PAST: "past",
    ACCEPTED: "accepted",
    PENDING: "pending",
  };

  /* ---------------- FETCH JOBS ---------------- */
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        filter: filterMap[filter],
        page,
        limit,
      });

      const res = await fetch(`${apiUrl}/api/company/jobs?${queryParams}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();
      
      if (res.ok && data.data) {
        setJobs(data.data.jobs || []);
        if (data.data.pagination) setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, filter, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /* ---------------- FETCH SKILLS & COLLEGES (For Modal) ---------------- */
  useEffect(() => {
    const fetchModalData = async () => {
      try {
        // 1. Fetch Skills
        const skillsRes = await fetch(`${apiUrl}/api/company/skills?sortBy=name&sortOrder=asc`, {
          credentials: "include",
        });
        const skillsData = await skillsRes.json();
        if (skillsRes.ok && skillsData.data) {
          setSkills(skillsData.data);
        }

        // 2. Fetch Approved Colleges
        const collabsRes = await fetch(`${apiUrl}/api/company/college?filter=collaborated&limit=100`, {
          credentials: "include",
        });
        const collabsData = await collabsRes.json();
        
        // ✅ THE FIX: We drill down into collabsData.data.colleges instead of using .map()
        if (collabsRes.ok && collabsData.data && collabsData.data.colleges) {
          setApprovedColleges(collabsData.data.colleges);
        }
      } catch (err) {
        console.error("Error fetching modal data:", err);
      }
    };
    fetchModalData();
  }, [apiUrl]);

  /* ---------------- FRONTEND SEARCH ---------------- */
  const filteredJobs = useMemo(() => {
    return (jobs || []).filter((job) =>
      job.title?.toLowerCase().includes(search.toLowerCase())
    );
  }, [jobs, search]);

  /* ---------------- CREATE JOB HANDLER ---------------- */
  const handleCreateJob = async (e) => {
    e.preventDefault();

    if (jobForm.selectedColleges.length === 0) {
      return alert("Please select at least one college to post this job to.");
    }
    if (jobForm.selectedSkills.length === 0) {
      return alert("Please select at least one skill.");
    }

    setIsSubmitting(true);

    try {
      // Structure payload exactly as backend expects
      const payload = {
        title: jobForm.title,
        salary: jobForm.salary ? Number(jobForm.salary) : undefined,
        tenure: jobForm.tenure || undefined,
        address: jobForm.address || undefined,
        dueDate: jobForm.dueDate || undefined,
        skills: jobForm.selectedSkills,
        collegeIds: jobForm.selectedColleges,
      };

      const res = await fetch(`${apiUrl}/api/company/create/job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to create job");

      setShowAddModal(false);
      setJobForm({ title: "", salary: "", tenure: "", address: "", dueDate: "", selectedSkills: [], selectedColleges: [] });
      setFilter("CURRENT");
      setPage(1);
      fetchJobs();
    } catch (error) {
      alert(error.message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- TOGGLE HANDLERS ---------------- */
  const handleSkillToggle = (skillId) => {
    setJobForm((prev) => {
      const isSelected = prev.selectedSkills.includes(skillId);
      return {
        ...prev,
        selectedSkills: isSelected 
          ? prev.selectedSkills.filter(id => id !== skillId)
          : [...prev.selectedSkills, skillId]
      };
    });
  };

  const handleCollegeToggle = (collegeId) => {
    setJobForm((prev) => {
      const isSelected = prev.selectedColleges.includes(collegeId);
      return {
        ...prev,
        selectedColleges: isSelected 
          ? prev.selectedColleges.filter(id => id !== collegeId)
          : [...prev.selectedColleges, collegeId]
      };
    });
  };

  const navigate = useNavigate(); // Added for navigation


  return (
    <div className="employees-page" style={{
    height: "100%",
    overflowY: "auto",
    paddingBottom: "80px"
  }}>
      
      {/* ================= HEADER ================= */}
      <div className="employees-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title">Job Postings</h2>
          <p className="page-subtitle">Manage your open roles and campus placement requests.</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => setShowAddModal(true)}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Post New Job
        </button>
      </div>

      {/* ================= TOOLBAR ================= */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          className="search-input"
          placeholder="Search current page jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: '300px', margin: 0 }}
        />

        <div className="filter-tabs" style={{ margin: 0 }}>
          {["CURRENT", "PENDING", "ACCEPTED", "PAST"].map((f) => (
            <button
              key={f}
              className={`filter-pill ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ================= JOB GRID ================= */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '50vh', padding: '2rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem', color: '#0f172a' }}>
          {filter} Jobs ({pagination.totalJobs})
        </h3>

        {loading ? (
          <div className="dashboard-loading" style={{ flexGrow: 1, padding: '4rem 0' }}>Loading Jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', flexGrow: 1 }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>💼</span>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>No jobs found</h3>
            <p style={{ margin: 0, color: '#64748b' }}>There are no {filter.toLowerCase()} jobs matching your criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {filteredJobs.map((job) => (
              <div 
                key={job.id} 
                className="job-card-soft" 
                onClick={() => navigate(`/company/jobs/${job.id}`)}
                style={{ 
                  padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', 
                  borderLeft: `4px solid ${job.isApproved ? '#10b981' : filter === 'PAST' ? '#94a3b8' : '#eab308'}`,
                  borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', lineHeight: '1.3' }}>{job.title}</h4>
                    <span style={{
                      padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "bold",
                      backgroundColor: job.isApproved ? "#dcfce7" : "#fef08a",
                      color: job.isApproved ? "#166534" : "#854d0e", whiteSpace: 'nowrap'
                    }}>
                      {job.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>

                  {job.college?.name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>
                        {job.college.name.charAt(0).toUpperCase()}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>{job.college.name}</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>💰</span> <strong style={{ color: '#0f172a' }}>{formatCurrency(job.salary)}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⏳</span> Due: <span style={{ color: '#0f172a' }}>{formatDate(job.dueDate)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Posted {formatDate(job.createdAt)}</span>
                  <span style={{ color: '#4f46e5', fontSize: '0.85rem', fontWeight: 600 }}>View Details →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= PAGINATION ================= */}
        {!loading && pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: pagination.hasPrevPage ? '#fff' : '#f8fafc', color: pagination.hasPrevPage ? '#0f172a' : '#94a3b8', cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed', fontWeight: 500 }}
              >
                ← Prev
              </button>
              <button 
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNextPage}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: pagination.hasNextPage ? '#fff' : '#f8fafc', color: pagination.hasNextPage ? '#0f172a' : '#94a3b8', cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed', fontWeight: 500 }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= CREATE JOB MODAL ================= */}
      {showAddModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="modal-card" style={{
            backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '650px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', overflow: 'hidden'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Post a New Job</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flexGrow: 1 }}>
              <form id="create-job-form" onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Job Title *</label>
                  <input required type="text" placeholder="e.g., Senior Software Engineer" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Salary (₹)</label>
                    <input type="number" placeholder="e.g., 800000" value={jobForm.salary} onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Application Deadline</label>
                    <input type="date" value={jobForm.dueDate} onChange={(e) => setJobForm({ ...jobForm, dueDate: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Tenure / Type</label>
                    <input type="text" placeholder="e.g., Full-Time, 6 Months Internship" value={jobForm.tenure} onChange={(e) => setJobForm({ ...jobForm, tenure: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Job Location</label>
                    <input type="text" placeholder="Defaults to Company HQ" value={jobForm.address} onChange={(e) => setJobForm({ ...jobForm, address: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                {/* TARGET COLLEGES */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Target Colleges *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', maxHeight: '120px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                    {approvedColleges.length === 0 ? (
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No approved collaborations found. You must partner with a college first.</span>
                    ) : (
                      approvedColleges.map((college) => (
                        <button
                          key={college.id}
                          type="button"
                          onClick={() => handleCollegeToggle(college.id)}
                          style={{
                            padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', border: '1px solid',
                            transition: 'all 0.2s ease', textAlign: 'left',
                            backgroundColor: jobForm.selectedColleges.includes(college.id) ? '#e0e7ff' : '#ffffff',
                            color: jobForm.selectedColleges.includes(college.id) ? '#4f46e5' : '#64748b',
                            borderColor: jobForm.selectedColleges.includes(college.id) ? '#a5b4fc' : '#cbd5e1'
                          }}
                        >
                          {jobForm.selectedColleges.includes(college.id) ? "✓ " : "+ "}{college.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* REQUIRED SKILLS */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Required Skills *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', maxHeight: '120px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                    {skills.length === 0 ? (
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading skills...</span>
                    ) : (
                      skills.map((skill) => (
                        <button
                          key={skill.id} // 👈 Using ID instead of Name
                          type="button"
                          onClick={() => handleSkillToggle(skill.id)} // 👈 Toggling ID
                          style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer', border: '1px solid',
                            transition: 'all 0.2s ease',
                            backgroundColor: jobForm.selectedSkills.includes(skill.id) ? '#e0e7ff' : '#ffffff',
                            color: jobForm.selectedSkills.includes(skill.id) ? '#4f46e5' : '#64748b',
                            borderColor: jobForm.selectedSkills.includes(skill.id) ? '#a5b4fc' : '#cbd5e1'
                          }}
                        >
                          {jobForm.selectedSkills.includes(skill.id) ? "✓ " : "+ "}{skill.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>

              </form>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem', backgroundColor: '#f8fafc', flexShrink: 0 }}>
              <button type="button" className="btn-outline" onClick={() => setShowAddModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}>Cancel</button>
              <button form="create-job-form" type="submit" className="btn-primary" disabled={isSubmitting || jobForm.selectedColleges.length === 0} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}>
                {isSubmitting ? "Posting..." : "Post Job"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: '50px', width: '100%', flexShrink: 0 }}></div>

    </div>
  );
}

export default CompanyJobsPage;