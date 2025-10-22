// src/admin/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  FileText,
  Megaphone,
  Lightbulb,
} from "lucide-react";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase";

export default function Sidebar() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const firestore = getFirestore();

  // 🔹 Fetch logged-in user's role from Firestore (using email since you use auto IDs)
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.warn("No user logged in");
          setLoading(false);
          return;
        }

        const q = query(
          collection(firestore, "adminusers"),
          where("email", "==", user.email)
        );
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

  // 🔹 Define what each role can see
  const canViewLeads =
    userRole === "Administrator" ||
    userRole === "Moderator" ||
    userRole ==="User" ||
    userRole === "Police";

  // Define menu items (conditionally include Leads)
  const menuItems = [
    { name: "Dashboard", icon: <Home size={18} color="blue" />, path: "/org/dashboard" },
    { name: "Reports", icon: <FileText size={18} color="blue" />, path: "/org/reports" },
    ...(canViewLeads
      ? [{ name: "Leads", icon: <Lightbulb size={18} color="blue" />, path: "/org/leads" }]
      : []),
    { name: "Announcements", icon: <Megaphone size={18} color="blue" />, path: "/org/announcements" },
  ];

  if (loading)
    return (
      <aside className="w-64 bg-white shadow-md flex-shrink-0">
        <div className="p-4 font-bold text-lg border-b">Find Them</div>
        <div className="p-4 text-gray-500">Loading...</div>
      </aside>
    );

  return (
    <aside className="w-64 bg-white shadow-md flex-shrink-0">
      <div className="p-4 font-bold text-lg border-b">Find Them</div>
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
    </aside>
  );
}

