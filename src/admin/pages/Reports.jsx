// src/admin/pages/Reports.jsx
import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc, 
  getDocs, 
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // ⭐ NEW: Import Auth functions

// --- tiny util: check if URL is a video
const isVideo = (url) => {
  if (!url || typeof url !== 'string') return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith(".mp4") || lowerUrl.endsWith(".mov") || lowerUrl.endsWith(".webm");
};

export default function Reports() {
  const db = getFirestore();
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  // State for admin user check
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const fetchAdminStatus = async (userEmail) => {
      if (!userEmail) {
        setIsUserAdmin(false);
        return;
      }
      try {
        const adminsRef = collection(db, "adminusers");
        const adminSnapshot = await getDocs(adminsRef);
        const allowedEmails = adminSnapshot.docs
        .filter(doc => ["Administrator", "Moderator"].includes(doc.data().role))
        .map(doc => doc.data().email);
        setIsUserAdmin(allowedEmails.includes(userEmail));
      } catch (error) {
        console.error("Failed to fetch admin list:", error);
        setIsUserAdmin(false);
      }
    };

    const authUnsub = onAuthStateChanged(auth, (user) => {
      fetchAdminStatus(user ? user.email : null);
    });

    const unsubscribers = [];
    const dangerUnsub = onSnapshot(collection(db, "dangerReports"), (snapshot) => {
      const dangerReports = snapshot.docs.map((d) => ({
        id: `danger-${d.id}`,
        docId: d.id,
        ...d.data(),
        type: "Danger",
      }));
      setReports((prev) => {
        const others = prev.filter((p) => p.type !== "Danger");
        return [...others, ...dangerReports];
      });
      setLoading(false);
    });

    const missingUnsub = onSnapshot(
      collection(db, "missingPersonsReports"),
      (snapshot) => {
        const missingReports = snapshot.docs.map((d) => ({
          id: `missing-${d.id}`,
          docId: d.id,
          ...d.data(),
          type: "Missing Person",
        }));
        setReports((prev) => {
          const others = prev.filter((p) => p.type !== "Missing Person");
          return [...others, ...missingReports];
        });
        setLoading(false);
      }
    );

    unsubscribers.push(dangerUnsub, missingUnsub, authUnsub);

    return () => unsubscribers.forEach((unsub) => unsub());
  }, []);

  const getStatus = (report) => {
    if (report.isSolved) return "Resolved";
    if (report.isVerified) return "Verified";
    if (report.isRejected) return "Rejected";
    return "Pending";
  };

  // --- Filtering ---
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report?.description?.toLowerCase().includes(search.toLowerCase()) ||
      report?.missingPersonName?.toLowerCase().includes(search.toLowerCase()) ||
      report?.location?.toLowerCase().includes(search.toLowerCase()) ||
      report?.county?.toLowerCase().includes(search.toLowerCase()) ||
      report?.docId?.toLowerCase().includes(search.toLowerCase()) ||
      false;

    const matchesType =
      filterType === "All" ? true : report.type === filterType;

    const matchesStatus =
      statusFilter === "All"
        ? true
        : (statusFilter === "Verified" && report.isVerified && !report.isSolved) ||
          (statusFilter === "Resolved" && report.isSolved) ||
          (statusFilter === "Pending" && !report.isVerified && !report.isSolved) ||
          (statusFilter === "Rejected" && report.isRejected);

    const now = new Date();
    const createdAt =
      report.createdAt?.toDate?.() || report.submittedWhen?.toDate?.();
    let matchesDate = true;

    if (createdAt && dateFilter !== "All") {
      const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
      if (dateFilter === "24h") matchesDate = diffDays <= 1;
      if (dateFilter === "7d") matchesDate = diffDays <= 7;
      if (dateFilter === "30d") matchesDate = diffDays <= 30;
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const toggleStatus = async (docId, type, field, currentValue) => {
    const collectionName =
      type === "Danger" ? "dangerReports" : "missingPersonsReports";
    const docRef = doc(db, collectionName, docId);
    try {
      await updateDoc(docRef, { [field]: !currentValue });
    } catch (e) {
      console.error("Error updating document:", e);
    }
  };

  //  Add handleDelete function
  const handleDelete = async (docId, type) => {
    if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      return;
    }

    const collectionName = type === "Danger" ? "dangerReports" : "missingPersonsReports";
    const docRef = doc(db, collectionName, docId);
    try {
      await deleteDoc(docRef);
      console.log("Report deleted successfully.");
    } catch (e) {
      console.error("Error deleting document:", e);
    }
  };

  // A component to render either a video or image based on URL
  const MediaRenderer = ({ url, className, isModal = false }) => {
    if (isVideo(url)) {
      return (
        <video src={url} controls className={className}>
          Your browser does not support the video tag.
        </video>
      );
    }
    return (
      <img src={url} alt="Post" className={className} />
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold">Reports Management</h1>
      <p className="text-gray-500 mb-6">
        Manage and resolve submitted reports of missing persons and dangers.
      </p>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name, description, county, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg shadow-sm focus:ring focus:ring-blue-300"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg shadow-sm"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Verified">Verified</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg shadow-sm"
        >
          <option value="All">All Dates</option>
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 text-sm font-medium">
        {["All", "Missing Person", "Danger"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-4 py-2 rounded-lg ${
              filterType === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {tab === "All" ? "All Reports" : tab + "s"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">DOC ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">County</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Date Submitted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredReports.map((report) => (
              <tr key={report.id} className="border-t">
                <td className="px-4 py-3">{report.docId}</td>
                <td className="px-4 py-3">{report.type}</td>
                <td className="px-4 py-3">{report.county || "N/A"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      getStatus(report) === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : getStatus(report) === "Verified"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {getStatus(report)}
                  </span>
                </td>
                <td className="px-4 py-3">{report.location || "N/A"}</td>
                <td className="px-4 py-3">
                  {report.createdAt?.toDate
                    ? report.createdAt.toDate().toLocaleDateString()
                    : report.submittedWhen?.toDate
                    ? report.submittedWhen.toDate().toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="text-indigo-600 hover:underline"
                  >
                    View
                  </button>
                  {/* Conditionally render the delete button for admins */}
                  {isUserAdmin && (
                  <button
                    onClick={() =>
                      toggleStatus(report.docId, report.type, "isVerified", report.isVerified)
                    }
                    className="text-blue-600 hover:underline"
                  >
                    {report.isVerified ? "Unverify" : "Verify"}
                  </button>
                  )}
                  {/* Conditionally render the delete button for admins */}
                  {isUserAdmin && (
                  <button
                    onClick={() =>
                      toggleStatus(report.docId, report.type, "isSolved", report.isSolved)
                    }
                    className="text-green-600 hover:underline"
                  >
                    {report.isSolved ? "Unresolve" : "Resolve"}
                  </button>
                  )}
                  {/* Conditionally render the delete button for admins */}
                  {isUserAdmin && (
                  <button
                    onClick={() =>
                      toggleStatus(report.docId, report.type, "isRejected", report.isRejected)
                    }
                    className="text-red-600 hover:underline"
                  >
                    {report.isRejected ? "Unreject" : "Reject"}
                  </button>
                  )}
                  {/* Conditionally render the delete button for admins */}
                  {isUserAdmin && (
                    <button
                      onClick={() => handleDelete(report.docId, report.type)}
                      className="text-red-600 hover:underline ml-3"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredReports.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No reports found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              X
            </button>
            <h2 className="text-xl font-bold mb-4">Report Details</h2>
            <p><strong>Type:</strong> {selectedReport.type}</p>
            <p><strong> Doc ID:</strong> {selectedReport.docId}</p>
            <div className="flex gap-6 mb-2">
            {selectedReport.reportId && (
              <p><strong>Report ID:</strong> {selectedReport.reportId}</p>
            )}
            {selectedReport.contact && (
              <p><strong>Reporter's Contact:</strong> {selectedReport.contact}</p>
            )}
            </div>
            <div className="flex gap-6 mb-2">
            <p><strong>County:</strong> {selectedReport.county}</p>
            <p><strong>Location:</strong> {selectedReport.location}</p>
            </div>
            <p><strong>Status:</strong> {getStatus(selectedReport)}</p>
            <p><strong>Description:</strong> {selectedReport.description || selectedReport.lastSeen|| "N/A"}</p>
            {selectedReport.missingPersonName && (
              <p><strong>Missing Person:</strong> {selectedReport.missingPersonName}</p>
            )}
            <p className="mt-4"><strong>Media:</strong></p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {selectedReport.media && selectedReport.media.length > 0 ? (
                selectedReport.media.map((url, idx) => (
                  <MediaRenderer
                    key={idx}
                    url={url}
                    className="w-full h-80 object-cover rounded"
                  />
                ))
              ) : (
                <p className="col-span-2 text-center text-gray-500">No media</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}