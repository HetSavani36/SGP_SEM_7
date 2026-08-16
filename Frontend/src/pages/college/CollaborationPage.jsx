import { useEffect, useState, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

/* ---------- Status Badge ---------- */
function StatusBadge({ status, onAccept, onReject }) {
  if (status === "REQUEST") {
    return (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          className="btn-success" 
          style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.9rem' }}
          onClick={onAccept}
        >
          ✔ Accept
        </button>
        <button 
          className="btn-danger" 
          style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.9rem' }}
          onClick={onReject}
        >
          ✖ Reject
        </button>
      </div>
    );
  }

  // Display a nice badge for already Collaborated/Rejected states
  return (
    <span style={{
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "0.85rem",
      fontWeight: "bold",
      backgroundColor: status === "COLLABORATED" ? "#dcfce7" : "#fee2e2",
      color: status === "COLLABORATED" ? "#166534" : "#991b1b"
    }}>
      {status === "COLLABORATED" ? "✓ Active Collab" : "✕ Rejected"}
    </span>
  );
}

/* ---------- Helpers ---------- */
function getInitial(name) {
  return name?.charAt(0)?.toUpperCase() || "C";
}

/* ---------- Status Mapping ---------- */
const STATUS_MAP = {
  pending: "REQUEST",
  accepted: "COLLABORATED",
  rejected: "REJECTED",
};

const REVERSE_STATUS_MAP = {
  REQUEST: "pending",
  COLLABORATED: "accepted",
  REJECTED: "rejected",
};

/* ---------- Page ---------- */
function CollegeCollaborationPage() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { college } = useOutletContext();
  const navigate = useNavigate(); // 👈 Added for navigation

  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("REQUEST");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ---------- Fetch Collaborations ---------- */
  // Wrapped in useCallback and moved above useEffect to fix hoisting issues
  const fetchCompanies = useCallback(async (backendStatus = "pending") => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({
        status: backendStatus,
      }).toString();

      const res = await fetch(
        `${apiUrl}/api/college/collab/request?${query}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to fetch collaborations");

      const data = await res.json();

      const normalized = (data.data.collabRequests || []).map((c) => ({
        ...c,
        status: STATUS_MAP[c.status] || "REQUEST",
      }));

      setCompanies(normalized);
    } catch (err) {
      setError(err.message);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchCompanies(REVERSE_STATUS_MAP[filter]);
  }, [filter, fetchCompanies]);

  /* ---------- Accept / Reject ---------- */
  const updateStatus = async (e, companyId, action) => {
    e.stopPropagation(); // 👈 Prevents the card's onClick from firing

    // Optimistic UI (instant removal)
    setCompanies((prev) =>
      prev.filter((c) => c.company.id !== companyId)
    );

    try {
      const res = await fetch(
        `${apiUrl}/api/college/collab/request/${companyId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result: action }), // "1" or "0"
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Action failed");
    } catch (err) {
      alert(err.message);
      // rollback if API fails
      fetchCompanies(REVERSE_STATUS_MAP[filter]);
    }
  };

  /* ---------- Search (client-side only) ---------- */
  const filteredCompanies = companies.filter((c) =>
    c.company.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="employees-page" style={{ minHeight: '120vh', paddingBottom: '10vh' }}>
      
      {/* ================= HEADER ================= */}
      <div className="employees-header">
        <div>
          <h2 className="page-title">Company Collaborations</h2>
          <p className="page-subtitle">
            Manage partnership requests for <strong>{college?.name}</strong>
          </p>
        </div>
      </div>

      {/* ================= CONTROLS ================= */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <input
            className="search-input"
            placeholder="Search company by name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: '300px' }}
          />

          <div className="filter-tabs" style={{ margin: 0 }}>
            {["REQUEST", "COLLABORATED", "REJECTED"].map((item) => (
              <button
                key={item}
                className={`filter-pill ${filter === item ? "active" : ""}`}
                onClick={() => setFilter(item)}
              >
                {item === "REQUEST" ? "PENDING REQUESTS" : item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= COLLABORATION LIST ================= */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '50vh' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          {filter === "REQUEST" ? "Pending Requests" : filter} ({filteredCompanies.length})
        </h3>

        {loading ? (
          <div className="dashboard-loading" style={{ flexGrow: 1 }}>Loading collaborations...</div>
        ) : error ? (
          <div className="empty-state" style={{ color: '#ef4444', flexGrow: 1 }}>{error}</div>
        ) : filteredCompanies.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', flexGrow: 1 }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
            <p style={{ margin: 0, color: '#64748b' }}>No {filter.toLocaleLowerCase()} records found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {filteredCompanies.map((c) => (
              <div 
                key={c.id} 
                className="job-card-soft" 
                onClick={() => navigate(`/college/company/${c.company.id}`)} // 👈 Navigation integrated here!
                style={{ 
                  padding: '1.5rem', 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0', 
                  borderLeft: `4px solid ${filter === 'REQUEST' ? '#eab308' : filter === 'COLLABORATED' ? '#10b981' : '#ef4444'}`,
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer' // 👈 Shows it's clickable
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }}
              >
                
                {/* Top: Company Info */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#334155',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold', flexShrink: 0
                  }}>
                    {getInitial(c.company.name)}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#0f172a' }}>{c.company.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                      <span style={{ marginTop: '2px' }}>📍</span> {c.company.address}
                    </p>
                  </div>
                </div>

                {/* Bottom: Actions/Status & View Link */}
                <div style={{ 
                  paddingTop: '1rem', 
                  borderTop: '1px solid #f1f5f9', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <StatusBadge
                    status={c.status}
                    onAccept={(e) => updateStatus(e, c.company.id, "1")} // 👈 e is passed to stop propagation
                    onReject={(e) => updateStatus(e, c.company.id, "0")}
                  />
                  
                  {/* Subtle hint that the card is clickable */}
                  {c.status !== "REQUEST" && (
                     <span style={{ color: '#4f46e5', fontSize: '0.9rem', fontWeight: 600 }}>
                       View Profile →
                     </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* EXPLICIT BOTTOM SPACER */}
      <div style={{ height: '50px', width: '100%', flexShrink: 0 }}></div>

    </div>
  );
}

export default CollegeCollaborationPage;