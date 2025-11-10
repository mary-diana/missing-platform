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
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useLocation,useNavigate } from 'react-router-dom';


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
  const [reportTypeFilter, setReportTypeFilter] = useState("All"); 
  const [categoryFilter, setCategoryFilter] = useState("All");  

  const navigate = useNavigate();
  const location = useLocation();

  // State for admin user check- reuse thisd in other admin pages
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
          .filter(doc => ["Administrator", "Moderator"].includes(doc.data().orgrole))
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
    // Check if it's assigned, but not verified/solved/rejected
    if (report.assignedLeader || report.assignedVolunteer) return "Assigned";
    return "Pending";
  };

  const dangerCategories = [
    "Accident",
    "Assault",
    "Crime",
    "Natural Disaster",
    "Violence",
    "Other"
  ];

  // --- Filtering ---
 const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report?.description?.toLowerCase().includes(search.toLowerCase()) ||
      report?.missingPersonName?.toLowerCase().includes(search.toLowerCase()) ||
      report?.location?.toLowerCase().includes(search.toLowerCase()) ||
      report?.county?.toLowerCase().includes(search.toLowerCase()) ||
      report?.docId?.toLowerCase().includes(search.toLowerCase()) ||
      false;

    // 1. Matches Report Type (Tabs: All, Danger, Missing Person)
    const matchesReportType =
        reportTypeFilter === "All" ? true : report.type === reportTypeFilter;
    
    // 2. Matches Danger Category (Dropdown: Accident, Assault, etc.)
    const matchesCategory =
        categoryFilter === "All" 
        ? true 
        : (report.type === "Danger" && report.category === categoryFilter);

    // 3. Matches Status
    const isAssigned = report.assignedLeader || report.assignedVolunteer;
    const matchesStatus =
        statusFilter === "All"
            ? true
            : (statusFilter === "Verified" && report.isVerified && !report.isSolved) ||
            (statusFilter === "Resolved" && report.isSolved) ||
            (statusFilter === "Rejected" && report.isRejected) ||
            (statusFilter === "Assigned" && isAssigned) || // Assigned reports, regardless of final status
            (statusFilter === "Pending" && !report.isVerified && !report.isSolved && !report.isRejected && !isAssigned); // Pending reports must not be assigned

    // 4. Matches Date
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

    // Combine all filters
    return matchesSearch && matchesReportType && matchesCategory && matchesStatus && matchesDate;
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

  // 	Add handleDelete function
  const handleDelete = async (docId, type) => {
    if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      return;
    }

    const collectionName = type === "Danger" ? "dangerReports" : "missingPersonsReports";
    const docRef = doc(db, collectionName, docId);
    try {
      await deleteDoc(docRef);
      console.log("Report deleted successfully.");
      setSelectedReport(null); // Close modal if open
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
          <option value="Assigned">Assigned</option>{/* Added Assigned status */}
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

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg shadow-sm"
        >
          <option value="All">All Categories</option>
          {dangerCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 text-sm font-medium">
        {["All", "Missing Person", "Danger"].map((tab) => (
          <button
            key={tab}
            onClick={() => setReportTypeFilter(tab)}
            className={`px-4 py-2 rounded-lg ${
              reportTypeFilter === tab
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
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">County</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date Submitted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredReports.map((report) => (
              <tr key={report.id} className="border-t">
                <td className="px-4 py-3">{report.docId}</td>
                <td className="px-4 py-3">{report.type}</td>
                <td className="px-4 py-3">{report.category || "Missing"}</td>
                <td className="px-4 py-3">{report.county || "N/A"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      getStatus(report) === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : getStatus(report) === "Verified"
                          ? "bg-blue-100 text-blue-700"
                          : getStatus(report) === "Resolved"
                            ? "bg-green-100 text-green-700"
                            : getStatus(report) === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-indigo-100 text-indigo-700" // Assigned
                      }`}
                  >
                    {getStatus(report)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {report.createdAt?.toDate
                    ? report.createdAt.toDate().toLocaleDateString()
                    : report.submittedWhen?.toDate
                      ? report.submittedWhen.toDate().toLocaleDateString()
                      : "N/A"}
                </td>
                <td className="px-2 py-4 text-right space-x-2">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="text-indigo-600 hover:underline"
                  >
                    View
                  </button>
                  {/* Conditionally render admin actions */}
                  {isUserAdmin && (
                    <>
                      <button
                        onClick={() =>
                          toggleStatus(report.docId, report.type, "isVerified", report.isVerified)
                        }
                        className="text-blue-600 hover:underline"
                      >
                        {report.isVerified ? "Unverify" : "Verify"}
                      </button>
                      <button
                        onClick={() =>
                          toggleStatus(report.docId, report.type, "isSolved", report.isSolved)
                        }
                        className="text-green-600 hover:underline"
                      >
                        {report.isSolved ? "Unresolve" : "Resolve"}
                      </button>
                      <button
                        onClick={() =>
                          toggleStatus(report.docId, report.type, "isRejected", report.isRejected)
                        }
                        className="text-red-600 hover:underline"
                      >
                        {report.isRejected ? "Unreject" : "Reject"}
                      </button>
                      <button
                        onClick={() => handleDelete(report.docId, report.type)}
                        className="text-red-600 hover:underline ml-3"
                      >
                        Delete
                      </button>
                    </>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4 py-6">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8">

            {/* Header: Title, Close, Assign, Volunteer Buttons */}
            <div className="flex justify-between items-center border-b pb-2 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Report Details
              </h2>
              <div className="flex space-x-3">
                {isUserAdmin && (
                  <button
                  onClick={() => {
                      const pathPrefix = location.pathname.startsWith('/admin') ? '/admin' : '/org';
                      navigate(`${pathPrefix}/assign-report/${selectedReport.docId}`);
                    }}
                    className="px-3 py-1 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition duration-150"
                  >
                    Assign Report
                  </button>
                )}
                {isUserAdmin && (
                  <button
                    onClick={() => {
                      const pathPrefix = location.pathname.startsWith('/admin') ? '/admin' : '/org';
                      navigate(`${pathPrefix}/resolve-report/${selectedReport.docId}`);
                    }}
                    className="px-3 py-1 text-sm rounded-lg bg-green-500 hover:bg-green-600 text-white transition duration-150"
                  >
                    Resolve Report
                  </button>
                )}
                {isUserAdmin && (
                  <button
                    onClick={() => {
                      const pathPrefix = location.pathname.startsWith('/admin') ? '/admin' : '/org';
                      navigate(`${pathPrefix}/request-volunteer/${selectedReport.docId}`);
                    }}
                    className="px-3 py-1 text-sm rounded-lg border border-indigo-500 text-indigo-500 hover:bg-indigo-50 transition duration-150"
                  >
                    Request Volunteer
                  </button>
              )}
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold ml-4"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Report Meta Info */}
            <div className="grid md:grid-cols-2 gap-4 text-gray-700 text-sm mb-6">
              <p><strong>Type:</strong> {selectedReport.type}</p>
              <p><strong>Document ID:</strong> {selectedReport.docId}</p>

              {selectedReport.reportId && (
                <p><strong>Report ID:</strong> {selectedReport.reportId}</p>
              )}
              {selectedReport.contact && (
                <p><strong>Reporter’s Contact:</strong> {selectedReport.contact}</p>
              )}

              <p><strong>County:</strong> {selectedReport.county}</p>
              <p><strong>Location:</strong> {selectedReport.location}</p>

              <p><strong>Status:</strong> <span className="font-semibold">{getStatus(selectedReport)}</span></p>

              {selectedReport.missingPersonName && (
                <p><strong>Missing Person:</strong> {selectedReport.missingPersonName}</p>
              )}
            </div>

            {/* Description */}
            <div className="mb-6 border-b pb-4">
              <p className="text-gray-800 text-sm leading-relaxed">
                <strong>Description:</strong>{" "}
                {selectedReport.description || selectedReport.lastSeen || "N/A"}
              </p>
            </div>
            
            {/* Conditional Assignment Details Section */}
            {(selectedReport.assignedLeader || selectedReport.assignedVolunteer || selectedReport.resolution) && (
              <div className="mb-6 border-b pb-6">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Assignment Status</h3>

                {/* Assigned Leader Details */}
                {selectedReport.assignedLeader && (
                  <div className="p-4 bg-blue-50 rounded-lg mb-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Assigned Authority</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                      <p><strong>Name:</strong> {selectedReport.assignedLeader.name}</p>
                      <p><strong>Email:</strong> {selectedReport.assignedLeader.email}</p>
                      <p><strong>Contact:</strong> {selectedReport.assignedLeader.contact}</p>
                      <p><strong>Organization:</strong> {selectedReport.assignedLeader.organization}</p>
                    </div>
                  </div>
                )}

                {/* Assigned Volunteer Details */}
                {selectedReport.assignedVolunteer && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Assigned Volunteer || NGO</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-yellow-700">
                      <p><strong>Name:</strong> {selectedReport.assignedVolunteer.name}</p>
                      <p><strong>Email:</strong> {selectedReport.assignedVolunteer.email}</p>
                      <p><strong>Contact:</strong> {selectedReport.assignedVolunteer.contact}</p>
                      <p><strong>Organization:</strong> {selectedReport.assignedVolunteer.organization}</p>
                    </div>
                  </div>
                )}

                {selectedReport.resolution && (
                  <div className="p-4 bg-green-50 rounded-lg mb-4 border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Resolution Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
                      <p><strong>Status:</strong> {selectedReport.resolution.status}</p>
                      <p><strong>Date when Found:</strong> {selectedReport.resolution.date || "N/A"}</p>
                      <p><strong>Location Found:</strong> {selectedReport.resolution.location || "N/A"}</p>
                      <p><strong>County Found:</strong> {selectedReport.resolution.county || "N/A"}</p>
                      <p><strong>Resolved At:</strong> {new Date(selectedReport.resolution.resolvedAt).toLocaleString()}</p>
                    </div>

                    <div className="mt-3 text-sm text-green-700">
                      <p><strong>Description:</strong></p>
                      <p className="italic">{selectedReport.resolution.description || "No description provided."}</p>
                    </div>

                    {selectedReport.resolution.notes && (
                      <div className="mt-2 text-sm text-green-700">
                        <p><strong>Additional Notes || Evidence:</strong></p>
                        <p className="italic">{selectedReport.resolution.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}


            {/* Media Section */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Media</h3>
              {selectedReport.media && selectedReport.media.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedReport.media.map((url, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                    >
                      <MediaRenderer
                        url={url}
                        className="w-full h-64 object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 italic mt-2">No media uploaded</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}