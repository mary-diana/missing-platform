// src/admin/components/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Home, FileText, Users, BarChart2, Megaphone, Building,UserPlus,Lightbulb } from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", icon: <Home size={18} color="blue"/>, path: "/admin/dashboard" },
    { name: "Reports", icon: <FileText size={18}  color="blue"/>, path: "/admin/reports" },
    { name: "Users", icon: <Users size={18} color="blue"/>, path: "/admin/users" },
    { name: "Organizations", icon: <Building size={18} color="blue"/>, path: "/admin/organizations" },
    { name: "Volunteers", icon: <UserPlus size={18} color="blue"/>, path: "/admin/volunteers" },
    { name: "Leads", icon: <Lightbulb size={18} color="blue" />, path: "/admin/leads" },
    { name: "Announcements", icon: <Megaphone size={18} color="blue" />, path: "/admin/announcements" },
  ];

  return (
    <aside className="w-64 bg-white shadow-md flex-shrink-0">
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
    </aside>
  );
}
