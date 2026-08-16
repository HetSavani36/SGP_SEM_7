import Navbar from "./components/Navbar";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "./pages/auth/Login";
import RegisterChoice from "./pages/auth/RegisterChoice";
import CollegeRegister from "./pages/college/CollegeRegister";
import CompanyRegister from "./pages/company/CompanyRegister";

/* ---------- Company ---------- */
import CompanyDashboardLayout from "./pages/company/side_nav_bar";
import EmployeesPage from "./pages/company/EmployeesPage";
import JobsPage from "./pages/company/JobsPage";
import ApplicationsPage from "./pages/company/ApplicationsPage";
import CollaborationPage from "./pages/company/CollaborationPage";
import AdminSettingsPage from "./pages/company/AdminSettingsPage";

/* ---------- College ---------- */
import CollegeDashboardLayout from "./pages/college/side_nav_bar";
import CollegeDashboard from "./pages/college/DashboardPage";
import MentorsPage from "./pages/college/MentorsPage";
import CollegeJobsPage from "./pages/college/JobsPage";
import StudentsPage from "./pages/college/StudentsPage";
import CollegeCollaborationPage from "./pages/college/CollaborationPage";
import CollegeAdminSettingsPage from "./pages/college/AdminSettingsPage";
import MentorsDetailPage from "./pages/college/MentorDetailsPage";


/* ---------- Student ---------- */
import StudentDashboardLayout from "./pages/student/side_nav_bar";
import StudentDashboard from "./pages/student/DashboardPage";
import StudentJobsPage from "./pages/student/JobsPage";
import StudentApplicationsPage from "./pages/student/ApplicationsPage";
import StudentMentorApprovedPage from "./pages/student/MentorApprovedPage";
import ApplyPage from "./pages/student/ApplyPage";
import StudentJobDetailsPage from "./pages/student/JobDetailPage";

import JobDetailsPage from "./pages/college/JobDetailsPage";
import CompanyDetailsPage from "./pages/college/CompanyDetailsPage";
import EmployeeDetailsPage from "./pages/company/EmployeeDetailsPage";
import CompanyJobDetailsPage from "./pages/company/CompanyJobDetailsPage";
import JobPipelinePage from "./pages/company/JobPipelinePage";
import CompanyCollegeDetailsPage from "./pages/company/CompanyCollegeDetailsPage";
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanySettingsPage from "./pages/company/AdminSettingsPage";
import ProfilePage from "./pages/student/CompleteProfilePage";

 import MentorDashboardLayout from "./pages/mentor/side_nav_bar";
import MentorDashboard from "./pages/mentor/MentorDashboard";
import MentorJobsPage from "./pages/mentor/Jobs";
import MentorApprovalsPage from "./pages/mentor/MentorApproval";
import MentorSettingsPage from "./pages/mentor/Profile";
import MentorStudentsPage from "./pages/mentor/Students";
/* ---------- Inline Coming Soon ---------- */
function ComingSoon({ title }) {
  return (
    <div
      style={{
        height: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#475569",
      }}
    >
      <h1>{title}</h1>
      <p>🚧 Coming Soon</p>
    </div>
  );
}

function App() {
  const location = useLocation();

  // Hide navbar on dashboards
  const hideNavbar =
    location.pathname.startsWith("/company") ||
    location.pathname.startsWith("/college") ||
    location.pathname.startsWith("/student");

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* ---------- Auth ---------- */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterChoice />} />
        <Route path="/register/college" element={<CollegeRegister />} />
        <Route path="/register/company" element={<CompanyRegister />} />

        {/* ---------- Company Dashboard ---------- */}
        <Route path="/company" element={<CompanyDashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CompanyDashboard />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="collaboration" element={<CollaborationPage />} />
          <Route path="admin-settings" element={<AdminSettingsPage />} />
          <Route path="employees/:id" element={<EmployeeDetailsPage />} />
          <Route path="jobs/:id" element={<CompanyJobDetailsPage />} />
          <Route path="applications/:jobId" element={<JobPipelinePage />} />
          <Route path="college/:id" element={<CompanyCollegeDetailsPage />} />
          <Route path="settings" element={<CompanySettingsPage/>} />
        </Route>

        {/* ---------- College Dashboard ---------- */}

        <Route path="/college" element={<CollegeDashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CollegeDashboard />} />
          <Route path="mentors" element={<MentorsPage />} />
          <Route path="jobs" element={<CollegeJobsPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="collaboration" element={<CollegeCollaborationPage />} />
          <Route path="admin-settings" element={<CollegeAdminSettingsPage />} />
          <Route path="mentors/:id" element={<MentorsDetailPage />} /> {/* NEW ROUTE */}
          <Route path="jobs/:id" element={<JobDetailsPage />} />
          <Route path="company/:id" element={<CompanyDetailsPage />} />
        </Route>



        {/* ---------- Student Dashboard ---------- */}

        <Route path="/student" element={<StudentDashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="apply" element={<ApplyPage />} />
          <Route path="jobs" element={<StudentJobsPage />} />
          <Route path="applications" element={<StudentApplicationsPage />} />
          <Route path="mentor-approved" element={<StudentMentorApprovedPage />} />
          <Route path="profile" element={<ProfilePage />} />
          
          {/* 👇 THIS NOW POINTS TO THE STUDENT'S DETAIL PAGE */}
          <Route path="job/:jobId" element={<StudentJobDetailsPage />} />
        </Route>


     
        {/* ------------------mentor dashboard-------- */}
        <Route path="/mentor" element={<MentorDashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<MentorDashboard />} />
          <Route path="approvals" element={<MentorApprovalsPage />} />
          <Route path="students" element={<MentorStudentsPage />} />
          <Route path="jobs" element={<MentorJobsPage />} />
          <Route path="profile" element={<MentorSettingsPage />} /> 
        </Route>

        {/* ---------- Fallback ---------- */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
