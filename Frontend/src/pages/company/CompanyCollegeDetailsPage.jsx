import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

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

function CompanyCollegeDetailsPage() {
  const { id } = useParams(); // Gets collegeId from the URL
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [college, setCollege] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------- FETCH COLLEGE DETAILS ---------- */
  const fetchCollegeDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/company/college/${id}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch college details");
      }

      setCollege(data.data);
    } catch (err) {
      console.error("College details fetch error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, id]);

  useEffect(() => {
    fetchCollegeDetails();
  }, [fetchCollegeDetails]);

  if (isLoading && !college) {
    return <div className="dashboard-loading" style={{ height: '100vh' }}>Loading institution profile...</div>;
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

  if (!college) return null;

  const avatarColors = getAvatarColor(college.name);

  return (
    <div className="employees-page" style={{ minHeight: "100vh", paddingBottom: "10vh" }}>
      
      {/* ================= HEADER WITH BACK BUTTON ================= */}
      <div className="employees-header" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={() => navigate(-1)} // Navigates back to the directory
          style={{ 
            background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", 
            width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: "1.2rem", color: "#475569", transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
        >
          ←
        </button>
        <div>
          <h2 className="page-title">Institution Profile</h2>
          <p className="page-subtitle">
            Viewing details for <strong>{college.name}</strong>
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem" }}>
        
        {/* ================= LEFT COLUMN: MAIN PROFILE CARD ================= */}
        <div className="card" style={{ padding: "2.5rem 2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{
              width: "80px", height: "80px", borderRadius: "16px", // Squarish for institutions
              backgroundColor: avatarColors.bg, color: avatarColors.text, display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}>
              {getInitials(college.name)}
            </div>
            
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem", color: "#0f172a", lineHeight: 1.2 }}>{college.name}</h3>
              <p style={{ margin: 0, color: "#64748b", fontFamily: "monospace", fontSize: "0.85rem" }}>ID: {college.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Email */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                ✉️
              </div>
              <div>
                <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Official Email</p>
                <p style={{ margin: 0, fontWeight: "500", color: "#0f172a" }}>
                  <a href={`mailto:${college.email}`} style={{ color: "#4f46e5", textDecoration: "none" }}>{college.email}</a>
                </p>
              </div>
            </div>

            {/* Phone */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                📞
              </div>
              <div>
                <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Contact Number</p>
                <p style={{ margin: 0, fontWeight: "500", color: "#0f172a" }}>
                  {college.phone ? (
                    <a href={`tel:${college.phone}`} style={{ color: "#0f172a", textDecoration: "none" }}>{college.phone}</a>
                  ) : "Not Provided"}
                </p>
              </div>
            </div>

            {/* Address */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                📍
              </div>
              <div>
                <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Campus Address</p>
                <p style={{ margin: 0, fontWeight: "500", color: "#0f172a", lineHeight: "1.5" }}>{college.address || "Not Provided"}</p>
              </div>
            </div>

          </div>
        </div>

        {/* ================= RIGHT COLUMN: TRUST & METRICS ================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          <div className="card" style={{ padding: "2rem", borderTop: "4px solid #10b981", height: 'fit-content' }}>
            <h4 style={{ marginTop: 0, marginBottom: "1.5rem", color: "#0f172a", fontSize: "1.1rem" }}>
              Platform Trust Metrics
            </h4>
            
            <div style={{ 
              backgroundColor: "#f0fdf4", 
              border: "1px solid #bbf7d0", 
              borderRadius: "12px", 
              padding: "2rem",
              display: "flex",
              alignItems: "center",
              gap: "1.5rem"
            }}>
              <div style={{
                width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#dcfce7", color: "#15803d",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem"
              }}>
                🤝
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "2.5rem", fontWeight: "bold", color: "#14532d", lineHeight: 1 }}>
                  {college.collaboratedCount}
                </p>
                <p style={{ margin: "0.5rem 0 0 0", color: "#166534", fontSize: "0.95rem", fontWeight: 500 }}>
                  Active Partnerships
                </p>
              </div>
            </div>
            
            <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", lineHeight: "1.5" }}>
                This metric represents the total number of companies currently collaborating with this institution for campus placements. A higher number indicates a well-established recruitment pipeline.
              </p>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}

export default CompanyCollegeDetailsPage;