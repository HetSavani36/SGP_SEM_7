import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

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

function CollegeAdminSettings() {
  const { college } = useOutletContext();
  const apiUrl = import.meta.env.VITE_API_URL;

  // --- Profile State ---
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });

  // --- Admin Password State ---
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  // --- Reset User Password State ---
  const [resetUserForm, setResetUserForm] = useState({
    email: "",
  });
  const [isResettingUser, setIsResettingUser] = useState(false);
  const [resetUserMessage, setResetUserMessage] = useState({ type: "", text: "" });

  // Populate form when college context loads
  useEffect(() => {
    if (college) {
      setProfileForm({
        name: college.name || "",
        email: college.email || "", // Usually read-only
        phone: college.phone || "",
        address: college.address || "",
      });
    }
  }, [college]);

  /* ---------- HANDLERS ---------- */
  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    setProfileMessage({ type: "", text: "" });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPasswordMessage({ type: "", text: "" });
  };

  const handleResetUserChange = (e) => {
    setResetUserForm({ ...resetUserForm, [e.target.name]: e.target.value });
    setResetUserMessage({ type: "", text: "" });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${apiUrl}/api/college/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone,
          address: profileForm.address,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile. Ensure name is unique.");

      setProfileMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setProfileMessage({ type: "error", text: err.message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsSavingPassword(true);
    setPasswordMessage({ type: "", text: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      setIsSavingPassword(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/user/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          oldPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update password");

      setPasswordMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordMessage({ type: "error", text: err.message });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleResetUserSubmit = async (e) => {
    e.preventDefault();
    setIsResettingUser(true);
    setResetUserMessage({ type: "", text: "" });

    try {
      // NOTE: Ensure you have a backend route configured to handle this POST request
      const res = await fetch(`${apiUrl}/api/college/reset-password/${resetUserForm.email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(resetUserForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset user password");

      setResetUserMessage({ type: "success", text: `${resetUserForm.role.toUpperCase()} password reset successfully!` });
      setResetUserForm({ email: "", newPassword: "", role: "student" });
    } catch (err) {
      setResetUserMessage({ type: "error", text: err.message });
    } finally {
      setIsResettingUser(false);
    }
  };

  return (
    <div className="employees-page" style={{
    height: "100%",
    overflowY: "auto",
    paddingBottom: "80px"
  }}>
      
      {/* ================= HEADER ================= */}
      <div className="employees-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 className="page-title">Admin Settings</h2>
          <p className="page-subtitle">
            Manage your college profile, security, and member access.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* ================= PROFILE SETTINGS CARD ================= */}
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
            Profile Information
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{
              width: '70px', height: '70px', borderRadius: '16px', backgroundColor: '#e0e7ff', color: '#4f46e5',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold'
            }}>
              {getInitials(profileForm.name)}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: '1.1rem' }}>{profileForm.name || "Your College"}</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Update your institution's public details.</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flexGrow: 1 }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Institution Name</label>
              <input 
                type="text" 
                name="name"
                value={profileForm.name} 
                onChange={handleProfileChange}
                className="form-input" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                required 
              />
              <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                * Must be a unique institution name across the platform.
              </span>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Registered Email (Read-Only)</label>
              <input 
                type="email" 
                value={profileForm.email} 
                className="form-input" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
                disabled 
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Contact Phone</label>
              <input 
                type="text" 
                name="phone"
                value={profileForm.phone} 
                onChange={handleProfileChange}
                className="form-input" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Campus Address</label>
              <textarea 
                name="address"
                value={profileForm.address} 
                onChange={handleProfileChange}
                className="form-input" 
                rows="3"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                required
              />
            </div>

            {profileMessage.text && (
              <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: profileMessage.type === 'error' ? '#fee2e2' : '#dcfce7', color: profileMessage.type === 'error' ? '#991b1b' : '#166534', fontSize: '0.9rem' }}>
                {profileMessage.text}
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '1rem', textAlign: 'right' }}>
              <button type="submit" className="btn-primary" disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save Profile Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* ================= RIGHT COLUMN: SECURITY CONTROLS ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* --- ADMIN SECURITY --- */}
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              My Admin Password
            </h3>

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Current Password</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  value={passwordForm.currentPassword} 
                  onChange={handlePasswordChange}
                  className="form-input" 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>New Password</label>
                  <input 
                    type="password" 
                    name="newPassword"
                    value={passwordForm.newPassword} 
                    onChange={handlePasswordChange}
                    className="form-input" 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required 
                  />
                </div>
                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Confirm Password</label>
                  <input 
                    type="password" 
                    name="confirmPassword"
                    value={passwordForm.confirmPassword} 
                    onChange={handlePasswordChange}
                    className="form-input" 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required 
                  />
                </div>
              </div>

              {passwordMessage.text && (
                <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: passwordMessage.type === 'error' ? '#fee2e2' : '#dcfce7', color: passwordMessage.type === 'error' ? '#991b1b' : '#166534', fontSize: '0.9rem' }}>
                  {passwordMessage.text}
                </div>
              )}

              <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                <button type="submit" className="btn-primary" disabled={isSavingPassword} style={{ backgroundColor: '#0f172a' }}>
                  {isSavingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* --- MANAGE USER PASSWORDS --- */}
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', borderTop: '4px solid #ef4444' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#0f172a' }}>
              Reset User Password
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              Force a password reset for a locked out student or mentor.
            </p>

            <form onSubmit={handleResetUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>User Role</label>
                  <select 
                    name="role"
                    value={resetUserForm.role}
                    onChange={handleResetUserChange}
                    className="form-input"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                  >
                    <option value="student">Student</option>
                    <option value="mentor">Mentor</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0, flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>User Email</label>
                  <input 
                    type="email" 
                    name="email"
                    placeholder="student@example.com"
                    value={resetUserForm.email} 
                    onChange={handleResetUserChange}
                    className="form-input" 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required 
                  />
                </div>
              </div>

              {resetUserMessage.text && (
                <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: resetUserMessage.type === 'error' ? '#fee2e2' : '#dcfce7', color: resetUserMessage.type === 'error' ? '#991b1b' : '#166534', fontSize: '0.9rem' }}>
                  {resetUserMessage.text}
                </div>
              )}

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
  <button 
    type="submit" 
    className="btn-danger" 
    disabled={isResettingUser} 
    style={{ 
      padding: '1.75rem 13rem',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '0.85rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      opacity: isResettingUser ? 0.7 : 1,
      cursor: isResettingUser ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      backgroundColor: '#ef4444',
      color: '#ffffff',
      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
    }}
    onMouseEnter={(e) => {
      if (!isResettingUser) {
        e.currentTarget.style.backgroundColor = '#dc2626';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isResettingUser) {
        e.currentTarget.style.backgroundColor = '#ef4444';
        e.currentTarget.style.transform = 'translateY(0)';
      }
    }}
  >
    {isResettingUser ? (
      <>
        <span style={{ fontSize: '0.1rem' }}>⏳</span> Re-setting...
      </>
    ) : (
      <>
        <span style={{ fontSize: '0.1rem' }}>⚠️</span> Force Password Reset
      </>
    )}
  </button>
</div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

export default CollegeAdminSettings;