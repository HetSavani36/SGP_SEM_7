import React from "react";

const TextInput = ({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  required,
  error,
  showPasswordToggle,
  togglePassword,
}) => {
  return (
    <div className="form-group">
      <label>{label}</label>

      <div className="input-wrapper">
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`form-input ${error ? "input-error" : ""}`}
        />

        {showPasswordToggle && (
          <span className="password-toggle" onClick={togglePassword}>
            👁
          </span>
        )}
      </div>

      {error && <p className="input-error-text">{error}</p>}
    </div>
  );
};

export default TextInput;