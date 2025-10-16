// src/admin/components/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Home, FileText, Users, BarChart2, Megaphone, Building,UserPlus,Lightbulb } from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", icon: <Home size={18} color="blue"/>, path: "/org/dashboard" },
    { name: "Reports", icon: <FileText size={18}  color="blue"/>, path: "/org/reports" },
    { name: "Volunteers", icon: <UserPlus size={18} color="blue"/>, path: "/org/volunteers" },
    { name: "Leads", icon: <Lightbulb size={18} color="blue" />, path: "/org/leads" },
    { name: "Announcements", icon: <Megaphone size={18} color="blue" />, path: "/org/announcements" },
  ];

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
