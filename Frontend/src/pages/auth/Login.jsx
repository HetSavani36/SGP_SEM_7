import React, { useState } from "react";
import TextInput from "../../components/TextInput";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  // Safe fallback in case the .env variable is missing
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setServerError(""); 

    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.password.trim()) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      setServerError("");

      console.log(`👉 Sending login request to: ${apiUrl}/api/auth/login`);

      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", 
        body: JSON.stringify(form),
      });

      const data = await res.json();
      console.log("👉 Login Response:", data); // Check your F12 Console!

      if (!res.ok) {
        setServerError(data.message || "Incorrect email or password");
        return;
      }

      // Store token
      const token = data?.token || data?.data?.token || data?.data?.accessToken || data?.accessToken;
      if (token) {
        localStorage.setItem("token", token);
      }

      // Deeply extract the user object (Handles different backend response structures)
      const userObj = data?.data?.user || data?.data || data?.user;
      
      if (userObj) {
        localStorage.setItem("user", JSON.stringify(userObj));
      }

      // Role based navigation
      const role = userObj?.role;
      console.log("👉 Detected Role:", role);

      if (role === "student") navigate("/student");
      else if (role === "companyAdmin") navigate("/company");
      else if (role === "collegeAdmin") navigate("/college");
      else if (role === "mentor") navigate("/mentor");
      else {
        setServerError(`Unknown user role: ${role || 'undefined'}`);
        console.error("Failed to route because role is unknown:", role);
      }

    } catch (error) {
      console.error("Login error:", error);
      setServerError("Something went wrong. Please check if your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-center">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/src/assets/images/logo.png" alt="CampusHire Logo" />
          </div>
          <h2>Welcome to CampusHire</h2>
          <p className="auth-subtitle">
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <TextInput
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              error={errors.email}
            />

            <TextInput
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              error={errors.password}
              showPasswordToggle={true}
              togglePassword={() => setShowPassword(!showPassword)}
            />

            {serverError && (
              <div className="auth-error" style={{ color: 'red', marginTop: '10px', fontSize: '14px', textAlign: 'center' }}>
                {serverError}
              </div>
            )}

            <div className="auth-forgot" style={{ textAlign: 'right', margin: '10px 0', fontSize: '14px', cursor: 'pointer', color: '#4f46e5' }}>
              Forgot password?
            </div>

            <button className="auth-btn" type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-footer" style={{ textAlign: 'center', marginTop: '20px' }}>
            Don't have an account?{" "}
            <Link to="/register" className="auth-register-link" style={{ color: '#4f46e5', textDecoration: 'none' }}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;