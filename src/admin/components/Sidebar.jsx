// src/admin/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, FileText, Users, BarChart2, Megaphone, Building, UserPlus, Lightbulb, LogOut,Scale,Map} from "lucide-react";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../../firebase";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", icon: <Home size={16} color="blue" />, path: "/admin/dashboard" },
    { name: "Reports", icon: <FileText size={16} color="blue" />, path: "/admin/reports" },
    { name: "Leads", icon: <Lightbulb size={16} color="blue" />, path: "/admin/leads" },
    { name: "Hotspot Map", icon: <Map size={16} color="blue" />, path: "/admin/hotspot-map" },
    { name: "Resources", icon: <BarChart2 size={16} color="blue" />, path: "/admin/resource-management" },
    { name: "Announcements", icon: <Megaphone size={16} color="blue" />, path: "/admin/announcements" },
    { name: "Users", icon: <Users size={16} color="blue" />, path: "/admin/users" },
    { name: "Organizations", icon: <Building size={16} color="blue" />, path: "/admin/organizations" },
    { name: "Volunteers", icon: <UserPlus size={16} color="blue" />, path: "/admin/volunteers" },
    { name: "Rules", icon: <Scale size={16} color="blue" />, path: "/admin/rules" },
  ];

  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const firestore = getFirestore();
  const navigate = useNavigate();

  // 🔹 Fetch logged-in user's role from Firestore
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.warn("No user logged in");
          setLoading(false);
          return;
        }

        const q = query(collection(firestore, "adminusers"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUserRole(userData.orgrole);
        } else {
          console.warn("No matching user found in adminusers collection");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [auth, firestore]);

  // 🔹 Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading)
    return (
      <aside className="w-64 bg-white shadow-md flex-shrink-0 sticky top-0 h-screen">
        <div className="p-4 font-bold text-lg border-b">Find Them</div>
        <div className="p-4 text-gray-500">Loading...</div>
      </aside>
    );

  return (
    <aside className="w-64 bg-white shadow-md flex-shrink-0 sticky top-0 h-screen flex flex-col justify-between">
      <div>
        <div className="p-4 font-bold text-lg border-b">Admin Panel</div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center gap-2 px-4 py-2 rounded hover:bg-blue-100"
            >
              {item.icon} {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* 🔹 Logout Button */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 w-full rounded text-red-600 hover:bg-red-100"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}
