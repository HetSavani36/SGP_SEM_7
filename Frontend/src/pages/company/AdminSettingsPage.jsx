import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

function CompanySettingsPage() {
  const { company: contextCompany } = useOutletContext() || {};
  const apiUrl = import.meta.env.VITE_API_URL;

  // --- UI States ---
  // 👇 FIX: Replaced boolean with a string to track WHICH form is loading
  const [loadingState, setLoadingState] = useState(""); 
  const [message, setMessage] = useState({ type: "", text: "" });

  // --- Form States ---
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    contactNo: "",
    address: "",
  });

  const [securityForm, setSecurityForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [employeeEmail, setEmployeeEmail] = useState("");

  /* ---------------- FETCH PROFILE ---------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/company/profile`, { credentials: "include" });
        const data = await res.json();
        if (res.ok && data.data) {
          setProfileForm({
            name: data.data.name || "",
            email: data.data.email || "",
            contactNo: data.data.contactNo || "",
            address: data.data.address || "",
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, [apiUrl]);

  /* ---------------- HANDLERS ---------------- */
  const showMessage = (type, text) => {
    setMessage({ type, text });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoadingState("profile"); // 👈 Only load profile button
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${apiUrl}/api/company/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: profileForm.name,
          contactNo: profileForm.contactNo,
          address: profileForm.address,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showMessage("success", "Profile updated successfully!");
      } else {
        showMessage("error", data.message || "Failed to update profile.");
      }
    } catch (error) {
      showMessage("error", "An unexpected error occurred.");
    } finally {
      setLoadingState("");
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      return showMessage("error", "New passwords do not match!");
    }

    setLoadingState("security"); // 👈 Only load security button
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${apiUrl}/api/user/change-password`, {
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          oldPassword: securityForm.oldPassword,
          newPassword: securityForm.newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showMessage("success", "Password changed successfully!");
        setSecurityForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        showMessage("error", data.message || "Failed to change password.");
      }
    } catch (err) {
      showMessage("error", "An unexpected error occurred.");
    } finally {
      setLoadingState("");
    }
  };

  const handleEmployeeReset = async (e) => {
    e.preventDefault();
    setLoadingState("recovery"); // 👈 Only load recovery button
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${apiUrl}/api/company/reset-password/${employeeEmail}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        showMessage("success", `Temporary password sent to ${employeeEmail}`);
        setEmployeeEmail(""); // clear input
      } else {
        showMessage("error", data.message || "Failed to reset employee password.");
      }
    } catch (err) {
      showMessage("error", "An unexpected error occurred.");
    } finally {
      setLoadingState("");
    }
  };

  return (
    <div style={{ 
      height: 'calc(100vh - 40px)', width: '100%', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', boxSizing: 'border-box'
    }}>
      <div className="employees-page" style={{ flexGrow: 1, overflowY: 'auto', padding: '0 2rem 5rem 2rem', boxSizing: 'border-box' }}>
        
        {/* ================= HEADER ================= */}
        <div className="employees-header" style={{ marginBottom: '2rem' }}>
          <h2 className="page-title">Admin Settings</h2>
          <p className="page-subtitle">Manage your organization's profile and security preferences.</p>
        </div>

        {/* ================= TOAST MESSAGE ================= */}
        {message.text && (
          <div style={{
            padding: '1rem', marginBottom: '2rem', borderRadius: '8px', fontWeight: 500,
            backgroundColor: message.type === "success" ? "#dcfce7" : "#fee2e2",
            color: message.type === "success" ? "#166534" : "#991b1b",
            border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.2rem' }}>{message.type === "success" ? "✅" : "⚠️"}</span>
            {message.text}
          </div>
        )}

        {/* ================= MAIN LAYOUT GRID ================= */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
          
          {/* ================= LEFT COLUMN: PROFILE ================= */}
          <div className="card" style={{ flex: '1 1 500px', padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🏢 Organization Details
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Update your company's public-facing contact info.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flexGrow: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569', fontSize: '0.9rem' }}>Company Name</label>
                    <input type="text" required value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569', fontSize: '0.9rem' }}>Registered Email <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'normal' }}>(Read Only)</span></label>
                    <input type="email" disabled value={profileForm.email} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }} />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569', fontSize: '0.9rem' }}>Contact Number</label>
                  <input type="text" required value={profileForm.contactNo} onChange={(e) => setProfileForm({ ...profileForm, contactNo: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', maxWidth: '300px' }} />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569', fontSize: '0.9rem' }}>Headquarters Address</label>
                  <textarea required rows="5" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', marginTop: '2rem' }}>
                <button type="submit" className="btn-primary" disabled={loadingState !== ""} style={{ padding: '0.75rem 2.5rem', borderRadius: '8px', fontWeight: 600 }}>
                  {loadingState === "profile" ? "Saving..." : "Save Profile Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* ================= RIGHT COLUMN: SECURITY & EMPLOYEES ================= */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* 1. Admin Password Card */}
            <div className="card" style={{ padding: '2rem' }}>
              <form onSubmit={handleSecuritySubmit}>
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🔒 Update Admin Password
                  </h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569', fontSize: '0.9rem' }}>Current Password</label>
                    <input type="password" required placeholder="Enter current password" value={securityForm.oldPassword} onChange={(e) => setSecurityForm({ ...securityForm, oldPassword: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569', fontSize: '0.9rem' }}>New Password</label>
                    <input type="password" required placeholder="Enter new password" minLength="8" value={securityForm.newPassword} onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div className="form-group" style={{ margin: 0, marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569', fontSize: '0.9rem' }}>Confirm New Password</label>
                    <input type="password" required placeholder="Confirm new password" minLength="8" value={securityForm.confirmPassword} onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '1rem' }}>
                  <button type="submit" className="btn-primary" disabled={loadingState !== ""} style={{ width: '100%', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 600 }}>
                    {loadingState === "security" ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Employee Access Recovery Card */}
            <div className="card" style={{ padding: '2rem', borderTop: '4px solid #f59e0b' }}>
              <form onSubmit={handleEmployeeReset}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🔑 Employee Recovery
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                    Generate and email a new temporary password to a locked-out employee.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569', fontSize: '0.9rem' }}>Employee Email</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="employee@company.com" 
                      value={employeeEmail} 
                      onChange={(e) => setEmployeeEmail(e.target.value)} 
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                    />
                  </div>
                  <button type="submit" className="btn-outline" disabled={loadingState !== ""} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, borderColor: '#f59e0b', color: '#b45309', backgroundColor: '#fffbeb' }}>
                    {loadingState === "recovery" ? "Sending..." : "Send Recovery Link"}
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default CompanySettingsPage;