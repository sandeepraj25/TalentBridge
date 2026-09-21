import { Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";

// ================= PUBLIC =================
import Terms from "@/pages/public/Terms";
import RefundPolicy from "@/pages/public/RefundPolicy";
import Privacy from "@/pages/public/Privacy";
import Contact from "@/pages/public/Contact";
import Home from "@/pages/public/Home";
import Jobs from "@/pages/public/Jobs";
import JobDetail from "@/pages/public/JobDetail";
import Companies from "@/pages/public/Companies";
import CompanyDetail from "@/pages/public/CompanyDetail";
import Pricing from "@/pages/public/Pricing";
import Content from "@/pages/public/Content";

// ================= AUTH =================
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Suspended from "@/pages/auth/Suspended";
import NotFound from "@/pages/NotFound";

// ================= CANDIDATE =================
import CandidateOverview from "@/pages/candidate/Overview";
import CandidateProfile from "@/pages/candidate/Profile";
import CandidateApplications from "@/pages/candidate/Applications";
import CandidateSaved from "@/pages/candidate/Saved";
import CandidateRecommended from "@/pages/candidate/Recommended";
import CandidateAlerts from "@/pages/candidate/Alerts";
import CandidateInterviews from "@/pages/candidate/Interviews";

// ================= RECRUITER =================
import RecruiterOverview from "@/pages/recruiter/Overview";
import RecruiterJobs from "@/pages/recruiter/Jobs";
import RecruiterJobForm from "@/pages/recruiter/JobForm";
import RecruiterApplications from "@/pages/recruiter/Applications";
import RecruiterPipeline from "@/pages/recruiter/Pipeline";
import RecruiterCandidates from "@/pages/recruiter/Candidates";
import RecruiterCandidateDetail from "@/pages/recruiter/CandidateDetail";
import RecruiterCompany from "@/pages/recruiter/Company";
import RecruiterCoins from "@/pages/recruiter/Coins";
import RecruiterPackages from "@/pages/recruiter/Packages";
import RecruiterAnalytics from "@/pages/recruiter/Analytics";
import RecruiterInterviews from "@/pages/recruiter/Interviews";

// ================= ADMIN =================
import AdminOverview from "@/pages/admin/Overview";
import AdminUsers from "@/pages/admin/Users";
import AdminCompanies from "@/pages/admin/Companies";
import AdminJobs from "@/pages/admin/Jobs";
import AdminApprovals from "@/pages/admin/Approvals";
import AdminPackages from "@/pages/admin/Packages";
import AdminCoins from "@/pages/admin/Coins";
import AdminPayments from "@/pages/admin/Payments";
import AdminCoupons from "@/pages/admin/Coupons";
import AdminReports from "@/pages/admin/Reports";
import AdminCms from "@/pages/admin/Cms";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminSettings from "@/pages/admin/Settings";
import AdminAudit from "@/pages/admin/Audit";

// ================= SHARED =================
import Messages from "@/pages/shared/Messages";
import Notifications from "@/pages/shared/Notifications";

export function App() {
  return (
    <Routes>

      {/* =====================================================
          PUBLIC ROUTES
      ===================================================== */}
      <Route element={<PublicLayout />}>

        {/* Main */}
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />

        {/* Companies */}
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:slug" element={<CompanyDetail />} />

        {/* Pricing */}
        <Route path="/pricing" element={<Pricing />} />

        {/* Company Information */}
        <Route path="/about" element={<Content pageKey="about" />} />
        <Route path="/about-us" element={<Content pageKey="about" />} />

        {/* Contact / Support */}
        <Route path="/contact" element={<Contact />} />
        <Route path="/support" element={<Contact />} />

        {/* Privacy */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/privacy-policy" element={<Privacy />} />

        {/* Refund */}
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/refund" element={<RefundPolicy />} />

        {/* Terms */}
        {/* Terms */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/terms-of-service" element={<Terms />} />

        {/* Cookie Policy */}
        <Route
          path="/cookie-policy"
          element={<Content pageKey="cookie-policy" />}
        />

        {/* FAQ / Help */}
        <Route path="/faq" element={<Content pageKey="faq" />} />
        <Route path="/help" element={<Content pageKey="help" />} />

      </Route>


      {/* =====================================================
          AUTH ROUTES
      ===================================================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/suspended" element={<Suspended />} />

      {/* Dashboard redirect */}
      <Route path="/dashboard" element={<DashboardRedirect />} />


      {/* =====================================================
          CANDIDATE DASHBOARD
      ===================================================== */}
      <Route
        path="/dashboard/candidate"
        element={<DashboardLayout role="candidate" />}
      >
        <Route index element={<CandidateOverview />} />

        <Route path="profile" element={<CandidateProfile />} />
        <Route path="applications" element={<CandidateApplications />} />
        <Route path="saved" element={<CandidateSaved />} />
        <Route path="recommended" element={<CandidateRecommended />} />
        <Route path="alerts" element={<CandidateAlerts />} />

        <Route
          path="messages"
          element={<Messages role="candidate" />}
        />

        <Route
          path="interviews"
          element={<CandidateInterviews />}
        />

        <Route
          path="notifications"
          element={<Notifications role="candidate" />}
        />
      </Route>


      {/* =====================================================
          RECRUITER DASHBOARD
      ===================================================== */}
      <Route
        path="/dashboard/recruiter"
        element={<DashboardLayout role="recruiter" />}
      >
        <Route index element={<RecruiterOverview />} />

        <Route path="jobs" element={<RecruiterJobs />} />
        <Route path="jobs/new" element={<RecruiterJobForm />} />
        <Route
          path="jobs/:id/edit"
          element={<RecruiterJobForm />}
        />

        <Route
          path="applications"
          element={<RecruiterApplications />}
        />

        <Route path="pipeline" element={<RecruiterPipeline />} />

        <Route
          path="candidates"
          element={<RecruiterCandidates />}
        />

        <Route
          path="candidates/:id"
          element={<RecruiterCandidateDetail />}
        />

        <Route path="company" element={<RecruiterCompany />} />

        <Route path="coins" element={<RecruiterCoins />} />

        <Route
          path="packages"
          element={<RecruiterPackages />}
        />

        <Route
          path="analytics"
          element={<RecruiterAnalytics />}
        />

        <Route
          path="messages"
          element={<Messages role="recruiter" />}
        />

        <Route
          path="interviews"
          element={<RecruiterInterviews />}
        />

        <Route
          path="notifications"
          element={<Notifications role="recruiter" />}
        />
      </Route>


      {/* =====================================================
          ADMIN DASHBOARD
      ===================================================== */}
      <Route
        path="/dashboard/admin"
        element={<DashboardLayout role="admin" />}
      >
        <Route index element={<AdminOverview />} />

        <Route path="users" element={<AdminUsers />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="jobs" element={<AdminJobs />} />

        <Route
          path="approvals"
          element={<AdminApprovals />}
        />

        <Route
          path="packages"
          element={<AdminPackages />}
        />

        <Route path="coins" element={<AdminCoins />} />

        <Route
          path="payments"
          element={<AdminPayments />}
        />

        <Route
          path="coupons"
          element={<AdminCoupons />}
        />

        <Route
          path="reports"
          element={<AdminReports />}
        />

        <Route
          path="cms"
          element={<AdminCms />}
        />

        <Route
          path="analytics"
          element={<AdminAnalytics />}
        />

        <Route
          path="settings"
          element={<AdminSettings />}
        />

        <Route
          path="audit"
          element={<AdminAudit />}
        />

        <Route
          path="notifications"
          element={<Notifications role="admin" />}
        />
      </Route>


      {/* =====================================================
          404
      ===================================================== */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}


/* =========================================================
   DASHBOARD REDIRECT
========================================================= */

function DashboardRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={`/dashboard/${user.role}`}
      replace
    />
  );
}