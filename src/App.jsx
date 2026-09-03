import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { CartProvider } from "./store/CartContext";
import { AuthProvider, useAuth } from "./store/AuthContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Venues from "./pages/Venues";
import Events from "./pages/Events";
import Games from "./pages/Games";
import Shop from "./pages/Shop";
import Sponsors from "./pages/Sponsors";
import Community from "./pages/Community";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import VerifyOTP from "./pages/VerifyOTP";
import Cart from "./pages/Cart";
import VenueDetail from "./pages/VenueDetail";
import EventDetail from "./pages/EventDetail";
import Affiliate from "./pages/Affiliate";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";


function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 size={32} className="animate-spin text-[#10B981]" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppShell() {
  const { loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen bg-[#0B1120] grid place-items-center"><Loader2 size={40} className="animate-spin text-[#10B981]" /></div>;
  }
  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col antialiased">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/events" element={<Events />} />
          <Route path="/games" element={<Games />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/community" element={<Community />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/venues/:id" element={<VenueDetail />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/affiliate" element={<ProtectedRoute><Affiliate /></ProtectedRoute>} />
          <Route path="/dashboard/affiliate" element={<ProtectedRoute><Affiliate /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppShell />
      </CartProvider>
    </AuthProvider>
  );
}