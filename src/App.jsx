import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "leaflet/dist/leaflet.css";

// Public
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import RecentReports from "./pages/RecentReports";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import CreateReport from "./pages/CreateReport";
import DangerReport from "./pages/DangerReport";
import AccountPage from "./pages/AccountPage";
import CommunityMap from "./pages/CommunityMap";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import HelpSupport from "./pages/HelpSupport";
import Volunteer from "./pages/Volunteer";
import ProvideLeads from "./pages/ProvideLeads";
import ResourceContribution from "./pages/ResourceContribution";

// Admin
import AdminLayout from "./admin/pages/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import Reports from "./admin/pages/Reports";
import AdminUsers from "./admin/pages/Users";
import Announcements from "./admin/pages/Announcements";
import Organizations from "./admin/pages/Organization";
import AdminVolunteer from "./admin/pages/AdminVolunteer";
import LeadsManagement from "./admin/pages/AdminLeads";
import RequestVolunteerPage from "./admin/pages/RequestVolunteerPage";
import AssignReportPage from "./admin/pages/AssignReportPage";
import ResolveReportPage from "./admin/pages/ResolveReportPage";
import AdminRules from "./admin/pages/AdminRules";

//Organizations
import OrgDashboard from "./org/pages/OrgDashboard";
import OrgLayout from "./org/pages/OrgLayout";
import OrgLeads from "./org/pages/OrgLeads";
import OrgAnnouncements from "./org/pages/OrgAnnouncements";
import OrgReports from "./org/pages/OrgReports";
import OrgVolunteerManagement from "./org/pages/OrgVolunteer";
import OrgRules from "./org/pages/OrgRules";

// Auth Context & Protected Route
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<><Navbar /><LandingPage /></>} />
          <Route path="/missing-persons" element={<><Navbar /><RecentReports /></>} />
          <Route path="/signup" element={<><Navbar /><Signup /></>} />
          <Route path="/login" element={<><Navbar /><Login /></>} />
          <Route
            path="/create-report"
            element={
              <ProtectedRoute>
                <Navbar />
                <CreateReport />
              </ProtectedRoute>
            }
          />

          {/* DangerReport - Protected */}
          <Route
            path="/create-danger-report"
            element={
              <ProtectedRoute>
                <Navbar />
                <DangerReport />
              </ProtectedRoute>
            }
          />
          <Route path="/help-support" element={<ProtectedRoute><Navbar /><HelpSupport /></ProtectedRoute>} />
          <Route path="/account" element={<><Navbar /><AccountPage /></>} />
          <Route path="/map" element={<><Navbar /><CommunityMap /></>} />
          <Route path="/analyse" element={<><Navbar /><AnalyticsDashboard /></>} />
          <Route path="/volunteer" element={<><Navbar /><Volunteer /></>} />
          <Route path="/provide-leads" element={<><Navbar /><ProvideLeads /></>} />
          <Route path="/resource-contribution" element={<><Navbar /><ResourceContribution /></>} />


          {/* Admin Pages */}
          <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/reports" element={<AdminLayout><Reports /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
          <Route path="/admin/announcements" element={<AdminLayout><Announcements /></AdminLayout>} />
          <Route path="/admin/organizations" element={<AdminLayout><Organizations /></AdminLayout>} />
          <Route path="/admin/volunteers" element={<AdminLayout><AdminVolunteer /></AdminLayout>} />
          <Route path="/admin/leads" element={<AdminLayout><LeadsManagement /></AdminLayout>} />
          <Route path="/admin/request-volunteer/:docId" element={<AdminLayout><RequestVolunteerPage /></AdminLayout>} />
          <Route path="/admin/assign-report/:docId" element={<AdminLayout><AssignReportPage /></AdminLayout>} />
          <Route path="/admin/resolve-report/:docId" element={<AdminLayout><ResolveReportPage /></AdminLayout>} />
          <Route path="/admin/rules" element={<AdminLayout><AdminRules /></AdminLayout>} />

          {/* Organization Pages */}
          <Route path="/org/dashboard" element={<OrgLayout><OrgDashboard /></OrgLayout>} />
          <Route path="/org/leads" element={<OrgLayout><OrgLeads /></OrgLayout>} />
          <Route path="/org/announcements" element={<OrgLayout><OrgAnnouncements /></OrgLayout>} />
          <Route path="/org/reports" element={<OrgLayout><OrgReports /></OrgLayout>} />
          <Route path="/org/volunteers" element={<OrgLayout><OrgVolunteerManagement /></OrgLayout>} />
          <Route path="/org/rules" element={<OrgLayout><OrgRules /></OrgLayout>} />
          <Route path="/org/resolve-report/:docId" element={<OrgLayout><ResolveReportPage redirectTo="/org/dashboard" /></OrgLayout>} />
          <Route path="/org/request-volunteer/:docId" element={<OrgLayout><RequestVolunteerPage redirectTo="/org/dashboard" /></OrgLayout>} />
          <Route path="/org/assign-report/:docId" element={<OrgLayout><AssignReportPage redirectTo="/org/dashboard" /></OrgLayout>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
