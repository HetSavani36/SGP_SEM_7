import { useState, useEffect } from "react";
import { 
  FiUser, FiMail, FiBookOpen, FiCalendar, FiFileText, 
  FiLock, FiShield, FiPlus, FiCheckCircle, FiAlertCircle, FiLink, FiAward, FiMapPin
} from "react-icons/fi";
import { apiFetch } from "../../utils/api";

function getInitials(name) {
  if (!name) return "ST";
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("");
}

function ProfilePage() {
  const [activeTab, setActiveTab] = useState("general");
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // --- Profile Data State ---
  const [profile, setProfile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [formData, setFormData] = useState({ branch: "", year: "1", aboutMe: "", resume: "" });

  // --- Skills State ---
  const [skillInput, setSkillInput] = useState("");
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsList, setSkillsList] = useState([]);

  // --- Password State ---
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  /* ================= FETCH FRESH PROFILE ================= */
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await apiFetch("/api/student/profile");
        const data = res.data?.data || res.data; // Safely unwrap response
        setProfile(data);
        
        setFormData({
          branch: data.branch || "",
          year: data.year?.toString() || "1",
          aboutMe: data.aboutMe || "",
          resume: data.resume || "",
        });
        
        // 👇 Now directly loads the flattened array from your new backend controller
        setSkillsList(data.skills || []); 

      } catch (err) {
        console.error("Error fetching profile:", err);
        setMessage({ type: "error", text: "Failed to load profile data." });
      } finally {
        setPageLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Clear messages when switching tabs
  useEffect(() => { setMessage({ type: "", text: "" }); }, [activeTab]);

  /* ================= HANDLERS ================= */
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await apiFetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch: formData.branch,
          year: Number(formData.year),
          aboutMe: formData.aboutMe,
          resume: formData.resume
        }),
      });
      
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditingProfile(false);
      
      // Update local state to reflect changes instantly without reloading
      setProfile((prev) => ({
        ...prev,
        branch: formData.branch,
        year: Number(formData.year),
        aboutMe: formData.aboutMe,
        resume: formData.resume
      }));
    } catch (err) {
      setMessage({ type: "error", text: err?.message || "Failed to update profile." });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    
    setSkillsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await apiFetch("/api/student/add/skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: skillInput }),
      });
      
      setSkillsList([...skillsList, skillInput.toUpperCase()]);
      setSkillInput("");
      setMessage({ type: "success", text: "Skill added successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err?.message || "Failed to add skill." });
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setMessage({ type: "error", text: "New passwords do not match." });
    }

    setPasswordLoading(true);
    setMessage({ type: "", text: "" });

    try {
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

  if (pageLoading) {
    return <div className="dashboard-loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading your profile...</div>;
  }

  return (
    <>
      <style>{`
        .tab-btn {
          padding: 14px 24px; font-weight: 800; font-size: 0.95rem; border: none; background: transparent; 
          color: #64748b; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s;
        }
        .tab-btn:hover { color: #0f172a; }
        .tab-btn.active { color: #4f46e5; border-bottom-color: #4f46e5; }
        .form-input {
          width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; 
          font-size: 1rem; color: #0f172a; background-color: #f8fafc; transition: all 0.2s; box-sizing: border-box;
        }
        .form-input:focus { outline: none; border-color: #4f46e5; background-color: #fff; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        .form-label { display: block; margin-bottom: 6px; font-size: 0.85rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
      `}</style>

      <div style={{ height: 'calc(100vh - 40px)', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
        <div className="employees-page" style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem' }}>
          
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>My Profile</h2>
            <p style={{ fontSize: '1.05rem', color: '#64748b', margin: 0 }}>Manage your personal information, skills, and security settings.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '2rem', alignItems: 'start' }}>
            
            {/* ================= LEFT COLUMN (Summary Card) ================= */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.15)' }}>
                {getInitials(profile?.user?.name)}
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: 800 }}>{profile?.user?.name}</h3>
              <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}><FiMail /> {profile?.user?.email}</p>
              
              <div style={{ width: '100%', height: '1px', backgroundColor: '#e2e8f0', marginBottom: '1.5rem' }}></div>
              
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Roll Number / ID</span>
                  <p style={{ margin: '4px 0 0 0', color: '#0f172a', fontWeight: 700 }}>{profile?.rollNo || "—"}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Academic Branch</span>
                  <p style={{ margin: '4px 0 0 0', color: '#0f172a', fontWeight: 700 }}>{profile?.branch || "Not Set"}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>College</span>
                  <p style={{ margin: '4px 0 0 0', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}><FiMapPin color="#4f46e5" /> {profile?.college?.name || "—"}</p>
                </div>
              </div>
            </div>

            {/* ================= RIGHT COLUMN (Tabs & Forms) ================= */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              
              {/* TABS */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '0 1rem' }}>
                <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                  <FiUser style={{ display: 'inline', marginRight: '8px', marginBottom: '-2px' }}/> General Info
                </button>
                <button className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')}>
                  <FiAward style={{ display: 'inline', marginRight: '8px', marginBottom: '-2px' }}/> Skills
                </button>
                <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                  <FiShield style={{ display: 'inline', marginRight: '8px', marginBottom: '-2px' }}/> Security
                </button>
              </div>

              <div style={{ padding: '2rem' }}>
                
                {message.text && (
                  <div style={{ padding: '1.25rem', marginBottom: '2rem', borderRadius: '10px', fontWeight: 700, backgroundColor: message.type === "success" ? "#dcfce7" : "#fee2e2", color: message.type === "success" ? "#166534" : "#991b1b", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {message.type === "success" ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />}
                    {message.text}
                  </div>
                )}

                {/* --- TAB 1: GENERAL INFO --- */}
                {activeTab === 'general' && (
                  <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: 800 }}>Personal Details</h3>
                      {!isEditingProfile && (
                        <button type="button" onClick={() => setIsEditingProfile(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          Edit Profile
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div>
                        <label className="form-label"><FiBookOpen style={{ display: 'inline' }}/> Branch</label>
                        <input className="form-input" disabled={!isEditingProfile} value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} placeholder="e.g., Computer Engineering" required />
                      </div>
                      <div>
                        <label className="form-label"><FiCalendar style={{ display: 'inline' }}/> Current Year</label>
                        <select className="form-input" disabled={!isEditingProfile} value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year (Final)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="form-label"><FiLink style={{ display: 'inline' }}/> Resume URL (Drive Link)</label>
                      <input className="form-input" type="url" disabled={!isEditingProfile} value={formData.resume} onChange={e => setFormData({...formData, resume: e.target.value})} placeholder="https://drive.google.com/..." required />
                      {!formData.resume && !isEditingProfile && (
                         <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><FiAlertCircle /> Resume is missing! You cannot apply to jobs until this is filled.</p>
                      )}
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Provide a viewable link to your latest resume.</p>
                    </div>

                    <div>
                      <label className="form-label"><FiFileText style={{ display: 'inline' }}/> About Me</label>
                      <textarea className="form-input" rows="5" disabled={!isEditingProfile} value={formData.aboutMe} onChange={e => setFormData({...formData, aboutMe: e.target.value})} placeholder="Tell companies about your projects, goals, and passions..." style={{ resize: 'vertical' }}></textarea>
                    </div>

                    {isEditingProfile && (
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="submit" disabled={profileLoading} style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 800, cursor: profileLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)' }}>
                          {profileLoading ? "Saving..." : "Save Changes"}
                        </button>
                        <button type="button" onClick={() => { setIsEditingProfile(false); setFormData({ branch: profile?.branch || "", year: profile?.year?.toString() || "1", aboutMe: profile?.aboutMe || "", resume: profile?.resume || "" }); }} style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </form>
                )}

                {/* --- TAB 2: SKILLS --- */}
                {activeTab === 'skills' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', color: '#0f172a', fontWeight: 800 }}>Technical & Soft Skills</h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>Add skills to stand out to companies reviewing your profile.</p>
                    </div>

                    <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '1rem' }}>
                      <input 
                        className="form-input" 
                        value={skillInput} 
                        onChange={e => setSkillInput(e.target.value)} 
                        placeholder="e.g., Docker, Redis, React, Python..." 
                        style={{ flexGrow: 1 }}
                      />
                      <button type="submit" disabled={skillsLoading || !skillInput.trim()} style={{ padding: '0 24px', borderRadius: '10px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, cursor: (skillsLoading || !skillInput.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}>
                        <FiPlus size={18} /> Add
                      </button>
                    </form>

                    {/* 👇 DISPLAYS ALL SKILLS 👇 */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '1rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', minHeight: '120px' }}>
                      {skillsList?.length === 0 ? (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                          <FiAward size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                          <span style={{ fontStyle: 'italic', fontWeight: 600 }}>No skills added yet.</span>
                        </div>
                      ) : (
                        skillsList?.map((skillName, idx) => (
                          <span key={idx} style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', fontSize: '0.9rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            {skillName}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* --- TAB 3: SECURITY --- */}
                {activeTab === 'security' && (
                  <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', color: '#0f172a', fontWeight: 800 }}>Change Password</h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>Ensure your account stays secure.</p>
                    </div>

                    <div>
                      <label className="form-label"><FiLock style={{ display: 'inline' }}/> Current Password</label>
                      <input className="form-input" type="password" value={passwordData.oldPassword} onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})} required />
                    </div>
                    <div>
                      <label className="form-label"><FiShield style={{ display: 'inline' }}/> New Password</label>
                      <input className="form-input" type="password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} required minLength={6} />
                    </div>
                    <div>
                      <label className="form-label"><FiShield style={{ display: 'inline' }}/> Confirm New Password</label>
                      <input className="form-input" type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} required minLength={6} />
                    </div>

                    <button type="submit" disabled={passwordLoading} style={{ marginTop: '1rem', padding: '14px 24px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: passwordLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.3)' }}>
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

export default ProfilePage;