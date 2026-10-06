import { Routes, Route } from "react-router-dom";
import ScrollToTop from "../components/common/ScrollToTop";
import ProtectedRoute from "../components/common/ProtectedRoute";

import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import About from "../pages/About";
import History from "../pages/History";
import Contact from "../pages/Contact";
import ComingSoon from "../pages/ComingSoon";
import ModelExperiments from "../pages/ModelExperiments";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import Login from "../pages/Login";
import Signup from "../pages/Signup";

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/History" element={<History />} />
        <Route path="/Contact" element={<Contact />} />
        <Route path="/experiments" element={<ModelExperiments />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected — require login */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Coming soon pages */}
        <Route path="/docs" element={<ComingSoon title="Documentation" />} />
        <Route path="/api-info" element={<ComingSoon title="API Reference" />} />
        <Route path="/guides" element={<ComingSoon title="Platform Guides" />} />
        <Route path="/support" element={<ComingSoon title="Help & Support" />} />
        <Route path="/privacy" element={<ComingSoon title="Privacy Policy" />} />
      </Routes>
    </>
  );
}

export default AppRoutes;