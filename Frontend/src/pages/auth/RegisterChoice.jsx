import React from "react";
import { Link } from "react-router-dom";
import companyImg from "../../assets/images/company.jpg";
import collegeImg from "../../assets/images/college.jpg";


const RegisterChoice = () => {
    return (
        <div className="auth-page">
            <div className="auth-center">
                <div className="choice-card">
                    <h2>Register on CampusHire</h2>
                    <p className="choice-subtitle">
                        Select how you want to register
                    </p>

                    <div className="choice-grid">
                        <Link to="/register/company" className="choice-item">
                            <img src={companyImg} alt="Company" />
                            <span>Register as Company</span>
                        </Link>

                        <Link to="/register/college" className="choice-item">
                            <img src={collegeImg} alt="College" />
                            <span>Register as College</span>
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RegisterChoice;
