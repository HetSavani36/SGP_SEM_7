import { useEffect, useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import gridIcon from "../../assets/icons/grid.png";
import listIcon from "../../assets/icons/list.png";
import exportIcon from "../../assets/icons/export.png";
import addIcon from "../../assets/icons/add.png";

/* ---------- Helpers ---------- */
function getInitials(name) {
  if (!name) return "EM";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function getAvatarColor(name) {
  const colors = [
    { bg: "#e0e7ff", text: "#4f46e5" },
    { bg: "#dcfce7", text: "#166534" },
    { bg: "#fce7f3", text: "#be185d" },
    { bg: "#fef3c7", text: "#b45309" },
    { bg: "#e0f2fe", text: "#0369a1" },
  ];
  const charCode = name ? name.charCodeAt(0) : 0;
  return colors[charCode % colors.length];
}

function EmployeesPage() {
  const { company } = useOutletContext();
  const apiUrl = import.meta.env.VITE_API_URL;

  // --- UI States ---
  const [viewMode, setViewMode] = useState("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // --- Data States ---
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({ name: "", email: "" });

  // --- Server-Side Pagination & Search States ---
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Number of items per page
  const [pagination, setPagination] = useState({
    totalEmployees: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  /* ---------- Debounce Search Input ---------- */
  // Prevents spamming the API on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 whenever a new search is executed
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  /* ---------- Fetch Employees (Server-Side) ---------- */
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query string based on backend expectations
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      const res = await fetch(`${apiUrl}/api/company/employees?${queryParams}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.data) {
        // Map based on the Prisma structure in your backend response
        setEmployees(
          data.data.employees.map((emp) => ({
            id: emp.id,
            systemId: emp.user?.id,
            name: emp.user?.name || "Unknown",
            email: emp.user?.email || "No Email",
          }))
        );
        // Save pagination metadata
        if (data.data.pagination) setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, page, limit, debouncedSearch]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  /* ---------- Export Employees ---------- */
  const exportEmployees = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/company/export/employees`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to export");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "employees.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting employees:", error);
    }
  };

  /* ---------- Create Employee ---------- */
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const res = await fetch(`${apiUrl}/api/company/create/employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setShowAddModal(false);
        
        // 🔥 OPTIMISTIC UI UPDATE: Inject the new employee instantly into the UI
        setEmployees((prev) => [
          {
            id: data.data?.id || `temp-${Date.now()}`, // Use real ID if backend returns it, else temp
            systemId: data.data?.user?.id || "Pending",
            name: formData.name,
            email: formData.email,
          },
          ...prev,
        ]);

        // Reset form and pagination
        setFormData({ name: "", email: "" });
        setPage(1); 
        
        // Trigger background refresh to sync with DB
        fetchEmployees(); 
      } else {
        alert(data.message || "Failed to create employee");
      }
    } catch (error) {
      console.error("Creation error:", error);
      alert("Something went wrong");
    } finally {
      setIsCreating(false);
    }
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
          <h2 className="page-title">Employee Roster</h2>
          <p className="page-subtitle">
            Manage your recruitment team for <strong>{company?.name}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-outline" 
            onClick={exportEmployees}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px' }}
          >
            <img src={exportIcon} alt="Export" style={{ width: '16px', filter: 'grayscale(100%) opacity(70%)' }} />
            Export CSV
          </button>

          <button
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px' }}
          >
            <img src={addIcon} alt="Add" style={{ width: '16px', filter: 'brightness(0) invert(1)' }} />
            Add Employee
          </button>
        </div>
      </div>

      {/* ================= TOOLBAR ================= */}
      <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          className="search-input"
          placeholder="Search by name, email, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '300px', margin: 0 }}
        />

        {/* Segmented View Toggle */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setViewMode("grid")}
            style={{
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: viewMode === "grid" ? '#ffffff' : 'transparent',
              boxShadow: viewMode === "grid" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <img src={gridIcon} alt="Grid" style={{ width: '18px', opacity: viewMode === "grid" ? 1 : 0.5 }} />
          </button>

          <button
            onClick={() => setViewMode("list")}
            style={{
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: viewMode === "list" ? '#ffffff' : 'transparent',
              boxShadow: viewMode === "list" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <img src={listIcon} alt="List" style={{ width: '18px', opacity: viewMode === "list" ? 1 : 0.5 }} />
          </button>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      {isLoading ? (
        <div className="dashboard-loading" style={{ padding: '4rem 0' }}>Loading Employees...</div>
      ) : employees.length === 0 ? (
         <div className="empty-state" style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
           <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>👥</span>
           <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>No Employees Found</h3>
           <p style={{ margin: 0, color: '#64748b' }}>Try adjusting your search or add a new employee to get started.</p>
         </div>
      ) : viewMode === "grid" ? (
        
        /* --- GRID VIEW --- */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {employees.map((emp) => {
            const colors = getAvatarColor(emp.name);
            return (
              <div
                onClick={() => navigate(`/company/employees/${emp.id}`)} // 👈 Add this
                key={emp.id} 
                className="card" 
                style={{ 
                  padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
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
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', marginBottom: '1rem',
                  backgroundColor: colors.bg, color: colors.text, display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold'
                }}>
                  {getInitials(emp.name)}
                </div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#0f172a' }}>{emp.name}</h4>
                <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem' }}>{emp.email}</p>
                <div style={{ backgroundColor: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', color: '#475569', fontWeight: 600, fontFamily: 'monospace' }}>
                  ID: {emp.id.slice(0, 8).toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
      ) : (

        /* --- LIST VIEW --- */
        <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '60vh', padding: 0, overflow: 'hidden', marginBottom: '2rem' }}>
          <div style={{ overflowY: 'auto', flexGrow: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                <tr>
                  <th style={{ padding: '16px', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Employee</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Email Address</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>System ID</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const colors = getAvatarColor(emp.name);
                  return (
                    <tr key={emp.id} onClick={() => navigate(`/company/employees/${emp.id}`)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            width: '36px', height: '36px', borderRadius: '50%', backgroundColor: colors.bg, color: colors.text, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold'
                          }}>
                            {getInitials(emp.name)}
                          </span>
                          <span style={{ fontWeight: 500, color: '#0f172a' }}>{emp.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{emp.email}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {emp.id.slice(0, 8).toUpperCase()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= PAGINATION CONTROLS ================= */}
      {!isLoading && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.totalEmployees} total)
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: pagination.hasPrevPage ? '#fff' : '#f8fafc', color: pagination.hasPrevPage ? '#0f172a' : '#94a3b8', cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed', fontWeight: 500 }}
            >
              ← Previous
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

      {/* ================= ADD EMPLOYEE MODAL ================= */}
      {showAddModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="modal-card" style={{
            backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '450px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', overflow: 'hidden'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Add New Employee</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateEmployee} style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Full Name</label>
                <input required type="text" placeholder="e.g., Jane Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Email Address</label>
                <input type="email" required placeholder="jane@company.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setShowAddModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isCreating} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}>{isCreating ? "Adding..." : "Add Employee"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPLICIT BOTTOM SPACER */}
      <div style={{ height: '50px', width: '100%', flexShrink: 0 }}></div>

    </div>
  );
}

export default EmployeesPage;