import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { 
  FiUser, FiMail, FiLock, FiShield, FiCheckCircle, 
  FiAlertCircle, FiCamera, FiMapPin, FiBriefcase 
} from "react-icons/fi";
import { apiFetch } from "../../utils/api";

function getInitials(name) {
  if (!name) return "MN";
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("");
}

function MentorSettingsPage() {
  // Grab mentor data passed from the SideNavBar context
  const { mentor } = useOutletContext();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // --- Password State ---
  const [passwordData, setPasswordData] = useState({ 
    oldPassword: "", 
    newPassword: "", 
    confirmPassword: "" 
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Clear alerts when switching tabs
  useEffect(() => { setMessage({ type: "", text: "" }); }, [activeTab]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setMessage({ type: "error", text: "New passwords do not match." });
    }

    setPasswordLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Calls your existing change-password endpoint
      await apiFetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      setMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage({ type: "error", text: err?.message || "Failed to update password." });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .settings-tab {
          padding: 12px 20px; font-weight: 700; font-size: 0.95rem; border: none; background: transparent; 
          color: #64748b; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s;
        }
        .settings-tab.active { color: #4f46e5; border-bottom-color: #4f46e5; }
        
        .settings-input {
          width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; 
          font-size: 1rem; color: #0f172a; background-color: #f8fafc; outline: none; transition: 0.2s;
        }
        .settings-input:focus { border-color: #4f46e5; background-color: #fff; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        .settings-label { display: block; margin-bottom: 8px; font-size: 0.85rem; font-weight: 800; color: #475569; text-transform: uppercase; }
      `}</style>

      <div style={{ height: 'calc(100vh - 40px)', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
        <div className="employees-page" style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem' }}>
          
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Account Settings</h2>
            <p style={{ fontSize: '1.05rem', color: '#64748b', margin: 0 }}>Manage your personal details and account security.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
            
            {/* LEFT: Mini Profile Card */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: '2.5rem', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 1.5rem' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800 }}>
                  {getInitials(mentor?.name)}
                </div>
                <button style={{ position: 'absolute', bottom: 0, right: 0, background: '#4f46e5', border: '2px solid #fff', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed' }}>
                  <FiCamera size={14} />
                </button>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', fontWeight: 800 }}>{mentor?.name}</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>{mentor?.email}</p>
              
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '0.9rem' }}>
                  <FiBriefcase color="#4f46e5" /> <span>College Coordinator</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '0.9rem' }}>
                  <FiMapPin color="#4f46e5" /> <span>{mentor?.college?.name || "Assigned College"}</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Tabs & Content */}
            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', padding: '0 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <button className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Personal Info</button>
                <button className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>Security</button>
              </div>

              <div style={{ padding: '2.5rem' }}>
                {message.text && (
                  <div style={{ padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b' }}>
                    {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                    {message.text}
                  </div>
                )}

                {/* --- TAB: PROFILE (Read Only for now as per role) --- */}
                {activeTab === 'profile' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div>
                        <label className="settings-label">Full Name</label>
                        <input className="settings-input" value={mentor?.name} disabled />
                      </div>
                      <div>
                        <label className="settings-label">Email Address</label>
                        <input className="settings-input" value={mentor?.email} disabled />
                      </div>
                    </div>
                    <div>
                      <label className="settings-label">Current College</label>
                      <input className="settings-input" value={mentor?.college?.name || "Verified Campus"} disabled />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                      Note: Profile information is managed by your College Administrator. Please contact them to update your details.
                    </p>
                  </div>
                )}

                {/* --- TAB: SECURITY --- */}
                {activeTab === 'security' && (
                  <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' }}>
                    <div>
                      <label className="settings-label"><FiLock style={{ verticalAlign: 'middle', marginRight: '4px' }}/> Current Password</label>
                      <input 
                        type="password" 
                        className="settings-input" 
                        value={passwordData.oldPassword} 
                        onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="settings-label"><FiShield style={{ verticalAlign: 'middle', marginRight: '4px' }}/> New Password</label>
                      <input 
                        type="password" 
                        className="settings-input" 
                        value={passwordData.newPassword} 
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} 
                        required 
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="settings-label"><FiShield style={{ verticalAlign: 'middle', marginRight: '4px' }}/> Confirm New Password</label>
                      <input 
                        type="password" 
                        className="settings-input" 
                        value={passwordData.confirmPassword} 
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} 
                        required 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={passwordLoading}
                      style={{ marginTop: '1rem', padding: '14px 28px', borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: passwordLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)' }}
                    >
                      {passwordLoading ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MentorSettingsPage;