import React, { useState } from "react";
import TextInput from "../../components/TextInput.jsx";
import { useNavigate } from "react-router-dom";

const CompanyRegister = () => {
  const apiUrl = import.meta.env.VITE_API_URL


  const navigate=useNavigate()
  const [form, setForm] = useState({
    name: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: "",
    registrationNo: "",
    contactNo: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Company name is required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.registrationNo.trim())
      newErrors.registrationNo = "Registration number is required";
    if (!form.contactNo.trim())
      newErrors.contactNo = "Contact number is required";
    if (!form.password.trim()) newErrors.password = "Password is required";
    if (!form.confirmPassword.trim())
      newErrors.confirmPassword = "Confirm password is required";

    if (
      form.password &&
      form.confirmPassword &&
      form.password !== form.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      
      const res = await fetch(`${apiUrl}/api/auth/register/company`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form)
      });

      const data = await res.json();  // <-- IMPORTANT

      if (!res.ok) {
        console.error("Error:", data);
        alert(data.message || "Registration failed");
        return;
      }

      console.log("company Registration Success:", data);
      alert("company registered successfully!");

      setForm({
        name: "",
        address: "",
        email: "",
        password: "",
        confirmPassword: "",
        registrationNo: "",
        contactNo: "",
      });

    // 2️⃣ Redirect to login page
      navigate("/login", { replace: true });

    } catch (error) {
      console.error("Network error:", error);
      alert("Something went wrong!");
    }
  };

  return (
    
    
    <div className="auth-page">

      <div className="auth-center">
        <div className="register-card">

          {/* Header */}
          <div className="register-header">
            <div className="register-icon">🏢</div>
            <h2>Company Register</h2>
            <p>Create a new company account to get started</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="register-grid">
              <TextInput
                label="Company Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Odoo India"
                required
                error={errors.name}
              />

              <TextInput
                label="Registration Number"
                name="registrationNo"
                value={form.registrationNo}
                onChange={handleChange}
                placeholder="Enter registration number"
                required
                error={errors.registrationNo}
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

              <TextInput
                label="Contact Number"
                name="contactNo"
                value={form.contactNo}
                onChange={handleChange}
                placeholder="+91XXXXXXXXXX"
                required
                error={errors.contactNo}
              />

              <div className="register-full">
                <TextInput
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter company address"
                  required
                  error={errors.address}
                />
              </div>

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
              <button type="submit" className="btn-primary">
                Register Company
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

};

export default CompanyRegister;
