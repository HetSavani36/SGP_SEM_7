import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ---------- Helpers ---------- */
function getInitials(name) {
  if (!name) return "CO";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function CompanyDetailsPage() {
  const { id } = useParams(); // Gets companyId from the URL
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------- FETCH COMPANY DETAILS ---------- */
  const fetchCompanyDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Adjust this endpoint if your route structure is different
      const res = await fetch(`${apiUrl}/api/college/company/${id}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch company details");
      }

      setCompany(data.data);
    } catch (err) {
      console.error("Company details fetch error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, id]);

  useEffect(() => {
    fetchCompanyDetails();
  }, [fetchCompanyDetails]);

  if (isLoading && !company) {
    return <div className="dashboard-loading">Loading company profile...</div>;
  }

  if (error) {
    return (
      <div className="empty-state" style={{ color: "#ef4444", marginTop: "2rem" }}>
        <h3>Oops!</h3>
        <p>{error}</p>
        <button className="btn-outline" onClick={() => navigate(-1)} style={{ marginTop: "1rem" }}>
          Go Back
        </button>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="employees-page" style={{ minHeight: "100vh", paddingBottom: "10vh" }}>
      
      {/* ================= HEADER WITH BACK BUTTON ================= */}
      <div className="employees-header" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={() => navigate(-1)} // Navigates back to collaborations page
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: "#64748b" }}
        >
          ←
        </button>
        <div>
          <h2 className="page-title">Company Profile</h2>
          <p className="page-subtitle">
            Viewing details for <strong>{company.name}</strong>
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginTop: "1rem" }}>
        
        {/* ================= MAIN INFO CARD ================= */}
        <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "16px", // Slightly squarer for companies vs circular for people
              backgroundColor: "#f1f5f9",
              color: "#334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              fontWeight: "bold",
              border: "1px solid #e2e8f0"
            }}>
              {getInitials(company.name)}
            </div>
            
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem", color: "#0f172a" }}>{company.name}</h3>
              <p style={{ margin: 0, color: "#64748b", fontFamily: "monospace" }}>ID: {company.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "1.2rem" }}>✉️</span>
              <div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Official Email</p>
                <p style={{ margin: 0, fontWeight: "500", color: "#0f172a" }}>
                  <a href={`mailto:${company.email}`} style={{ color: "#2563eb", textDecoration: "none" }}>{company.email}</a>
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "1.2rem" }}>📞</span>
              <div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Contact Number</p>
                <p style={{ margin: 0, fontWeight: "500", color: "#0f172a" }}>{company.contactNo || "N/A"}</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <span style={{ fontSize: "1.2rem", marginTop: "2px" }}>📍</span>
              <div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Headquarters / Address</p>
                <p style={{ margin: 0, fontWeight: "500", color: "#0f172a", lineHeight: "1.5" }}>{company.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= STATS / TRUST METRICS CARD ================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          <div className="card" style={{ padding: "2rem", borderTop: "4px solid #10b981" }}>
            <h4 style={{ marginTop: 0, marginBottom: "1rem", color: "#0f172a", fontSize: "1.1rem" }}>
              Trust & Collaboration Metrics
            </h4>
            
            <div style={{ 
              backgroundColor: "#f8fafc", 
              border: "1px solid #e2e8f0", 
              borderRadius: "8px", 
              padding: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1.5rem"
            }}>
              <div style={{
                width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#d1fae5", color: "#059669",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem"
              }}>
                🤝
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold", color: "#0f172a", lineHeight: 1 }}>
                  {company.collaboratedCount}
                </p>
                <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.9rem" }}>
                  Active College Collaborations
                </p>
              </div>
            </div>
            
            <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" }}>
              * This metric shows how many other institutions this company has successfully partnered with on Vikassetu.
            </p>
          </div>
          
        </div>

      </div>
    </div>
  );
}

export default CompanyDetailsPage;