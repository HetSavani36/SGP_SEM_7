import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

/* ---------- Helpers ---------- */
function getInitials(name) {
  if (!name) return "CL";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function getAvatarColor(name) {
  const colors = [
    { bg: "#e0e7ff", text: "#4f46e5" }, // Indigo
    { bg: "#fce7f3", text: "#be185d" }, // Pink
    { bg: "#e0f2fe", text: "#0369a1" }, // Light Blue
    { bg: "#fef3c7", text: "#b45309" }, // Amber
    { bg: "#dcfce7", text: "#166534" }, // Green
  ];
  const charCode = name ? name.charCodeAt(0) : 0;
  return colors[charCode % colors.length];
}

function ColloborationPage() {
  const apiUrl = import.meta.env.VITE_API_URL;

  // --- UI & Filter States ---
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [requestingId, setRequestingId] = useState(null); // Tracks which college is being requested

  // --- Data States ---
  const [colleges, setColleges] = useState([]);
  
  // --- Pagination State ---
  const [page, setPage] = useState(1);
  const [limit] = useState(9); 
  const [pagination, setPagination] = useState({
    totalColleges: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // UI Tabs mapping to your Backend API filters
  const filterTabs = [
    { label: "All Colleges", value: "all" },
    { label: "Discover (Not Applied)", value: "not_applied" },
    { label: "Active Collabs", value: "collaborated" },
    { label: "Pending", value: "pending" },
    { label: "Rejected", value: "rejected" },
  ];

  /* ---------------- FETCH COLLEGES (Server-Side Paginated) ---------------- */
  const fetchColleges = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        filter: filter,
        page,
        limit,
      });

      // Matches your backend route
      const res = await fetch(`${apiUrl}/api/company/college?${queryParams}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();
      
      if (res.ok && data.data) {
        setColleges(data.data.colleges || []);
        if (data.data.pagination) setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching colleges:", err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, filter, page, limit]);

  // Reset page to 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  // Fetch when page or filter changes
  useEffect(() => {
    fetchColleges();
  }, [fetchColleges]);

  /* ---------------- FRONTEND SEARCH (Over current page) ---------------- */
  const filteredColleges = useMemo(() => {
    return (colleges || []).filter((college) =>
      college.name?.toLowerCase().includes(search.toLowerCase()) ||
      college.address?.toLowerCase().includes(search.toLowerCase())
    );
  }, [colleges, search]);

  /* ---------------- SEND COLLAB REQUEST ---------------- */
  const handleRequestCollab = async (collegeId) => {
    setRequestingId(collegeId);
    try {
      // NOTE: Ensure you have a backend route to handle this POST request!
      const res = await fetch(`${apiUrl}/api/company/collab/request/${collegeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to send collaboration request");

      // Optimistic UI Update: Change status locally so user sees instant feedback
      setColleges((prev) => 
        prev.map(c => c.id === collegeId ? { ...c, status: "pending" } : c)
      );
      
    } catch (error) {
      alert(error.message);
      console.error(error);
    } finally {
      setRequestingId(null);
    }
  };

  /* ---------------- RENDER STATUS BADGE ---------------- */
  const renderStatus = (status, collegeId) => {
    if (status === "not applied") {
      return (
        <button 
          onClick={() => handleRequestCollab(collegeId)}
          disabled={requestingId === collegeId}
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '6px', 
            fontSize: '0.9rem', 
            fontWeight: 600,
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '8px',
            backgroundColor: requestingId === collegeId ? '#94a3b8' : '#0649e7', // Formal Dark Slate
            color: '#ffffff',
            border: 'none',
            cursor: requestingId === collegeId ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease, transform 0.1s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            if (requestingId !== collegeId) {
              e.currentTarget.style.backgroundColor = '#1e293b'; // Slightly lighter on hover
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (requestingId !== collegeId) {
              e.currentTarget.style.backgroundColor = '#0649e7';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {requestingId === collegeId ? (
             <>
               <span style={{ fontSize: '1rem' }}>↻</span> Processing...
             </>
          ) : (
             <>
               <span style={{ fontSize: '1.1rem', fontWeight: 'normal' }}>+</span> Request Collaboration
             </>
          )}
        </button>
      );
    }

    const badgeStyles = {
      collaborated: { bg: "#f0fdf4", color: "#166534", icon: "✓", label: "Active Collaboration" },
      pending: { bg: "#fefce8", color: "#854d0e", icon: "⧗", label: "Request Pending Review" },
      rejected: { bg: "#fef2f2", color: "#991b1b", icon: "✕", label: "Request Declined" },
    };

    const style = badgeStyles[status] || { bg: "#f8fafc", color: "#475569", icon: "•", label: status };

    return (
      <div style={{ 
        width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: style.bg, color: style.color, 
        fontWeight: 600, fontSize: '0.85rem', textAlign: 'center', border: `1px solid ${style.color}30`
      }}>
        <span style={{ marginRight: '6px', fontWeight: 'bold' }}>{style.icon}</span> {style.label}
      </div>
    );
  };

  const navigate=useNavigate()

  return (
    <div className="employees-page" style={{
    height: "100%",
    overflowY: "auto",
    paddingBottom: "80px"
  }}>
      
      {/* ================= HEADER ================= */}
      <div className="employees-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title">College Directory</h2>
          <p className="page-subtitle">
            Discover institutions, send partnership requests, and manage active collaborations.
          </p>
        </div>
      </div>

      {/* ================= TOOLBAR ================= */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          className="search-input"
          placeholder="Search colleges by name or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: '320px', margin: 0 }}
        />

        <div className="filter-tabs" style={{ margin: 0 }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              className={`filter-pill ${filter === tab.value ? "active" : ""}`}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= COLLEGE GRID ================= */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '55vh', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
            {filterTabs.find(t => t.value === filter)?.label} ({pagination.totalColleges})
          </h3>
        </div>

        {loading ? (
          <div className="dashboard-loading" style={{ flexGrow: 1, padding: '4rem 0' }}>Loading Colleges...</div>
        ) : filteredColleges.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', flexGrow: 1 }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>🏛️</span>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>No colleges found</h3>
            <p style={{ margin: 0, color: '#64748b' }}>There are no colleges matching the "{filterTabs.find(t => t.value === filter)?.label}" criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {filteredColleges.map((college) => {
              const colors = getAvatarColor(college.name);
              
              return (
                <div 
                  key={college.id} 
                  className="job-card-soft" 
                  onClick={() => navigate(`/company/college/${college.id}`)}
                  style={{ 
                    padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', 
                    borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor:"pointer"
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
                  {/* Top Section */}
                  <div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <div style={{
                        width: '56px', height: '56px', borderRadius: '12px', flexShrink: 0,
                        backgroundColor: colors.bg, color: colors.text, display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold'
                      }}>
                        {getInitials(college.name)}
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#0f172a', lineHeight: '1.3' }}>
                          {college.name}
                        </h4>
                        <a href={`mailto:${college.email}`} style={{ fontSize: '0.85rem', color: '#4f46e5', textDecoration: 'none', display: 'block', marginBottom: '4px' }}>
                          {college.email}
                        </a>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                      <span style={{ marginTop: '2px' }}>📍</span>
                      <span>{college.address || "Address not provided"}</span>
                    </div>
                  </div>

                  {/* Bottom Action / Status Section */}
                  <div 
                  style={{ paddingTop: '1rem', borderTop: '1px solid #f1f5f9', marginTop: 'auto' }}
                  onClick={(e) => e.stopPropagation()} // 👈 VERY IMPORTANT: Prevents navigation when clicking buttons inside the card
                >
                  {renderStatus(college.status, college.id)}
                </div>
                </div>
              );
            })}
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

      <div style={{ height: '50px', width: '100%', flexShrink: 0 }}></div>
    </div>
  );
}

export default ColloborationPage;