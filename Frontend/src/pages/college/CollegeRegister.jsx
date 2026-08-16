import React, { useState } from "react";
import TextInput from "../../components/TextInput.jsx";

import { useNavigate } from "react-router-dom";

const CollegeRegister = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL


  const [form, setForm] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "College name is required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.password.trim()) newErrors.password = "Password is required";
    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
    }

    if (
      form.password &&
      form.confirmPassword &&
      form.password !== form.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (form.phone && form.phone.length < 10) {
      newErrors.phone = "Phone number looks too short";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const res = await fetch(
        `${apiUrl}/api/auth/register/college`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      alert("College registered successfully!");

      setForm({
        name: "",
        address: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Network error:", error);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-center">
        <div className="register-card">
          {/* Header */}
          <div className="register-header">
            <div className="register-icon">🎓</div>
            <h2>College Register</h2>
            <p>Create a new college account to collaborate with companies</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="register-grid">
              <TextInput
                label="College Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter college name"
                required
                error={errors.name}
              />

              <TextInput
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter official email"
                required
                error={errors.email}
              />

              <div className="register-full">
                <TextInput
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter college address"
                  required
                  error={errors.address}
                />
              </div>

              <TextInput
                label="Phone (optional)"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91XXXXXXXXXX"
                error={errors.phone}
              />

              <TextInput
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                error={errors.password}
              />

              <TextInput
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                error={errors.confirmPassword}
              />
            </div>

            <div className="register-footer">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Registering..." : "Register College"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CollegeRegister;
