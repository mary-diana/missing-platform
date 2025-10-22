// src/pages/OrgDashboardMock.jsx
import React, { useEffect, useState, useMemo } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase";
import downloadImage from "../../assets/download.jfif";
import { UserPlus, Lightbulb, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OrgDashboardMock() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missingPersonsReports, setMissingPersonsReports] = useState([]);
  const [dangerReports, setDangerReports] = useState([]);
  const navigate = useNavigate();

  const auth = getAuth();

  // Fetch logged-in user's orgrole by email
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.warn("No authenticated user found.");
          setLoading(false);
          return;
        }

        // Query the adminusers collection by email
        const q = query(collection(db, "adminusers"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUserRole(userData.orgrole);
        } else {
          console.warn("No user found with that email.");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [auth]);

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const missingSnap = await getDocs(collection(db, "missingPersonsReports"));
        const dangerSnap = await getDocs(collection(db, "dangerReports"));

        setMissingPersonsReports(missingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setDangerReports(dangerSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching reports:", err);
      }
    };

    fetchReports();
  }, []);

  // Overall stats
  const overall = useMemo(
    () => ({
      missing: missingPersonsReports.length,
      danger: dangerReports.length,
      total: missingPersonsReports.length + dangerReports.length,
    }),
    [missingPersonsReports, dangerReports]
  );

  // Role-based access control
  const canViewVolunteers = userRole === "Administrator" || userRole === "Volunteer";
  const canViewLeads = userRole === "Administrator" || userRole === "Moderator" || userRole === "Police";

  if (loading) return <div className="text-center mt-20 text-gray-600">Loading...</div>;

  return (
    <div className="min-h-screen font-sans bg-gray-100 relative">
      {/* Hero Section */}
      <div
        className="relative h-[70vh] flex items-center justify-center text-center text-white"
        style={{
          backgroundImage: `url(${downloadImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        <div className="relative z-10 max-w-4xl px-6 flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-yellow-300">Find Them</h1>
          <p className="mt-2 text-sm md:text-base mb-10">
            Find Them is a centralized platform that brings together citizens, families and organizations
            to raise awareness about missing people and real-time dangers in communities. Our goal is to
            unify reporting and improve response through transparency and accessibility.
          </p>

          {/* ACCESS BUTTONS */}
          <div className="flex flex-wrap justify-center gap-4">
            {/* Manage Volunteers — Admin + Volunteer only */}
            {canViewVolunteers && (
              <button
                onClick={() => navigate("/org/volunteers")}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
              >
                <UserPlus size={20} /> Manage Volunteers
              </button>
            )}

            {/* Review Leads — Admin + Moderator + Police */}
            {canViewLeads && (
              <button
                onClick={() => navigate("/org/leads")}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
              >
                <Lightbulb size={20} /> Review Leads
              </button>
            )}

            {/* Rules */}
            <button
              onClick={() => navigate("/org/rules")}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
            >
              <AlertTriangle size={20} /> Review Rules
            </button>
          </div>
        </div>
      </div>

      {/* Volunteer Instructions Section */}
      <div className="container mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Volunteer Updates</h2>
        <p className="text-gray-600 mb-6">
          If you wish to participate in helping with <strong>missing individuals</strong> or{" "}
          <strong>danger reports</strong>, please visit the <strong>Announcements</strong> section to view
          current updates and opportunities.
        </p>

        <div className="flex justify-center flex-wrap gap-8 mt-8">
  {/* Missing Reports */}
  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg p-6 w-64 transform transition-transform hover:scale-105 hover:shadow-2xl">
    <h3 className="text-lg font-semibold flex items-center gap-2">
      <svg
        
        className="h-5 w-5 text-white opacity-90"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M12 8v4m0 4h.01"
        />
      </svg>
      Missing Reports
    </h3>
    <p className="text-4xl font-bold mt-3">{overall.missing}</p>
  </div>

  {/* Danger Reports */}
  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl shadow-lg p-6 w-64 transform transition-transform hover:scale-105 hover:shadow-2xl">
    <h3 className="text-lg font-semibold flex items-center gap-2">
      <svg
        className="h-5 w-5 text-white opacity-90"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      Danger Reports
    </h3>
    <p className="text-4xl font-bold mt-3">{overall.danger}</p>
  </div>

  {/* Total Reports */}
  <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-2xl shadow-lg p-6 w-64 transform transition-transform hover:scale-105 hover:shadow-2xl">
    <h3 className="text-lg font-semibold flex items-center gap-2">
      <svg
        className="h-5 w-5 text-white opacity-90"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 10h18M3 6h18M3 14h18M3 18h18"
        />
      </svg>
      Total Reports
    </h3>
    <p className="text-4xl font-bold mt-3">{overall.total}</p>
  </div>
</div>

      </div>
    </div>
  );
}

