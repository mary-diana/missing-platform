import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import downloadImage from "../../assets/download.jfif"; 


export default function AdminDashboard() {
  const db = getFirestore();
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Static org info (Find Them)
  const [orgInfo, setOrgInfo] = useState({
    name: "Find Them",
    number: "+254 700 000 000",
    location: "Nairobi",
    county: "Nairobi County",
    reason:
      "To create a collaborative space for citizens and organizations to report and track missing people and dangers.",
    description:
      "Find Them is a centralized platform that brings together citizens, families, and organizations to raise awareness about missing people and real-time dangers in communities. Our goal is to unify reporting and improve response through transparency and accessibility.",
    media: [
      "https://images.unsplash.com/photo-1549495864-16d7a42b102b?q=80&w=1470&auto=format&fit=crop",
    ],
  });

  // Fetch announcements from Firestore (you can keep this)
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const snapshot = await getDocs(collection(db, "announcements"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAnnouncements(data);
      } catch (err) {
        console.error("Error fetching announcements:", err);
      }
    };
    fetchAnnouncements();
  }, [db]);

  return (
    <div className="bg-gray-100 min-h-screen p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>

        {/* Header Image */}
        <div className="relative h-48 rounded-lg overflow-hidden mb-6 shadow-md">
          <img
            src={downloadImage}
            alt="Dashboard header"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>

        {/* Organization Details */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Organization Details
            </h2>
            
          </div>
          <div className="space-y-4 text-gray-600 ">
            <div className="flex items-center">
              <span className="font-semibold w-32 text-gray-800">Name</span>
              <span className="ml-4">{orgInfo.name}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold w-32 text-gray-800">Number</span>
              <span className="ml-4">{orgInfo.number}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold w-32 text-gray-800">Location</span>
              <span className="ml-4">{orgInfo.location}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold w-32 text-gray-800">County</span>
              <span className="ml-4">{orgInfo.county}</span>
            </div>
          </div>
          <div className="mt-6 space-y-4 text-gray-600">
            <div>
              <span className="font-semibold text-gray-800">Reason to Join</span>
              <p className="mt-1 ml-4">{orgInfo.reason}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-800">Description</span>
              <p className="mt-1 ml-4">{orgInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Site Statistics */}
        <h2 className="text-lg font-semibold mb-2 text-gray-700">
          Site Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Total Reports", value: "250" },
            { label: "Active Users", value: "150" },
            { label: "New Reports This Month", value: "30" },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 text-center shadow-md"
            >
              <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Announcements */}
        <h2 className="text-lg font-semibold mb-2 text-gray-700">
          Announcements
        </h2>
        <div className="bg-white rounded-lg p-6 shadow-md">
          {announcements.length > 0 ? (
            announcements.map((a) => (
              <div key={a.id} className="border-b last:border-b-0 pb-4 mb-4">
                <h3 className="font-semibold text-gray-800">{a.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{a.content}</p>
                <p className="text-gray-600 text-sm mt-1">
                  Posted by {a.authorName} ({a.authorRole})
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              No announcements yet. Check back later.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
