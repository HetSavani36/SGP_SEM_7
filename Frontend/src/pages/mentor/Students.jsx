import { useState, useEffect, useMemo } from "react";
import { 
  FiSearch, FiFilter, FiUser, FiMail, FiBookOpen, 
  FiCalendar, FiFileText, FiAward, FiX, FiBriefcase, 
  FiCheckCircle, FiXCircle, FiClock, FiExternalLink, FiMapPin
} from "react-icons/fi";
import { apiFetch } from "../../utils/api";

function getInitials(name) {
  if (!name) return "ST";
  return name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join("");
}

function MentorStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await apiFetch("/api/mentor/students");
        setStudents(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Failed to fetch students:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.user?.name?.toLowerCase().includes(search.toLowerCase()) || 
        student.rollNo?.toLowerCase().includes(search.toLowerCase());
      const matchesBranch = branchFilter === "All" || student.branch === branchFilter;
      const matchesYear = yearFilter === "All" || student.year?.toString() === yearFilter;
      return matchesSearch && matchesBranch && matchesYear;
    });
  }, [students, search, branchFilter, yearFilter]);

  const uniqueBranches = useMemo(() => {
    const branches = new Set(students.map(s => s.branch).filter(Boolean));
    return ["All", ...Array.from(branches)];
  }, [students]);

  const openStudentDetails = async (studentId) => {
    setSelectedStudentId(studentId);
    setDetailsLoading(true);
    try {
      const res = await apiFetch(`/api/mentor/student/${studentId}/history`);
      setStudentDetails(res.data?.data || res.data);
    } catch (err) {
      alert("Failed to load student history.");
      setSelectedStudentId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const renderBadge = (status) => {
    const style = { padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid transparent' };
    if (status === "approved" || status === "hired") return <span style={{ ...style, background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}><FiCheckCircle /> {status}</span>;
    if (status === "rejected") return <span style={{ ...style, background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }}><FiXCircle /> {status}</span>;
    if (status === "shortlisted") return <span style={{ ...style, background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}><FiAward /> {status}</span>;
    return <span style={{ ...style, background: '#fefce8', color: '#854d0e', borderColor: '#fef08a' }}><FiClock /> {status || "pending"}</span>;
  };

  return (
    <>
      <style>{`
        .filter-select { padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-size: 0.95rem; color: #0f172a; outline: none; cursor: pointer; font-weight: 600; }
        
        .student-table { width: 100%; border-collapse: separate; border-spacing: 0; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        .student-table th { background: #f8fafc; padding: 16px; text-align: left; font-size: 0.85rem; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
        .student-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; }
        .student-table tbody tr:hover { background-color: #f1f5f9; cursor: pointer; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); z-index: 1000; display: flex; justify-content: flex-end; }
        
        .modal-content { 
          width: 100%; 
          max-width: 1200px; /* 👈 THE REQUESTED WIDTH */
          background: #f8fafc; 
          height: 100%; 
          box-shadow: -20px 0 50px rgba(0,0,0,0.15); 
          display: flex; 
          flex-direction: column; 
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }

        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        
        .history-grid {
          display: grid;
          grid-template-columns: 350px 1fr; /* Sidebar + Main History Area */
          gap: 2rem;
          padding: 2rem;
          height: calc(100% - 80px);
          overflow-y: auto;
        }

        .profile-sidebar {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid #e2e8f0;
          height: fit-content;
          position: sticky;
          top: 0;
        }
      `}</style>

      {/* Main Page Content */}
      <div style={{ height: 'calc(100vh - 40px)', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
        <div className="employees-page" style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>College Students</h2>
            <p style={{ fontSize: '1.05rem', color: '#64748b', margin: 0 }}>Select a student to view their full 1200px expanded history panel.</p>
          </div>

          {/* ... Search & Filter UI (Same as before) ... */}

          <div style={{ overflowX: 'auto' }}>
            <table className="student-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Roll Number</th>
                  <th>Branch</th>
                  <th>Year</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} onClick={() => openStudentDetails(student.id)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                          {getInitials(student.user?.name)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 800 }}>{student.user?.name}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{student.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{student.rollNo || "—"}</td>
                    <td style={{ fontWeight: 600 }}>{student.branch || "—"}</td>
                    <td>{student.year}</td>
                    <td style={{ textAlign: 'right', color: '#4f46e5', fontWeight: 700 }}>View Details →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= 1200px WIDE SIDE PANEL ================= */}
      {selectedStudentId && (
        <div className="modal-overlay" onClick={() => setSelectedStudentId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ padding: '1.5rem 2.5rem', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <FiUser size={24} color="#4f46e5" />
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Detailed Student Insights</h2>
              </div>
              <button onClick={() => setSelectedStudentId(null)} style={{ background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}><FiX size={20}/></button>
            </div>

            {detailsLoading ? (
              <div style={{ padding: '5rem', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>Fetching complete records...</div>
            ) : studentDetails && (
              <div className="history-grid">
                
                {/* PANEL LEFT SIDE: Profile Summary */}
                <div className="profile-sidebar">
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '100px', height: '100px', margin: '0 auto 1.5rem', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, border: '4px solid #fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                      {getInitials(studentDetails.user?.name)}
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 800 }}>{studentDetails.user?.name}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{studentDetails.user?.email}</p>
                    
                    {studentDetails.resume && (
                      <a href={studentDetails.resume} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: 700 }}>
                        <FiFileText /> View Full Resume
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Academic ID</label>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#0f172a' }}>{studentDetails.rollNo || "—"}</p>
                    </div>
                    <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Department</label>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#0f172a' }}>{studentDetails.branch}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Top Skills</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {studentDetails.skills?.map((s, i) => (
                          <span key={i} style={{ padding: '4px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>{s.skill?.name || s.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PANEL RIGHT SIDE: History Timeline */}
                <div>
                  <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem', fontWeight: 800 }}>
                    <FiBriefcase color="#4f46e5" /> Comprehensive Application Log
                  </h3>
                  
                  {studentDetails.applications?.length === 0 ? (
                    <div style={{ background: '#fff', padding: '3rem', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>
                      No applications recorded for this student.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {studentDetails.applications.map(app => (
                        <div key={app.id} style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{app.job?.title}</h4>
                              <p style={{ margin: '4px 0 0 0', color: '#4f46e5', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><FiMapPin /> {app.job?.company?.name}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Applied Date</p>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{new Date(app.appliedAt).toLocaleDateString()}</p>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                            <div>
                              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>College Status</label>
                              {renderBadge(app.mentorApproval)}
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Company Status</label>
                              {renderBadge(app.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default MentorStudentsPage;