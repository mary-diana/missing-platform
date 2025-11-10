import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query, // Needed for more specific queries
  where, // Needed for querying by email
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Needed for user authentication
import { db } from "../../firebase";

// --- Tiny util: check if URL is a video
const isVideo = (url) => {
  if (!url || typeof url !== "string") return false;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.endsWith(".mp4") ||
    lowerUrl.endsWith(".mov") ||
    lowerUrl.endsWith(".webm") ||
    lowerUrl.endsWith(".avi")
  );
};

// --- MediaRenderer Component
const MediaRenderer = ({ url, className }) => {
  if (!url) return <p className="text-gray-500 italic">No media attached.</p>;

  if (isVideo(url)) {
    return (
      <video src={url} controls className={className}>
        Your browser does not support the video tag.
      </video>
    );
  }

  return <img src={url} alt="Attached Media" className={className} />;
};

// --- AssignLeadForm Component (Extracted from Modal for clarity)
function AssignLeadForm({ leadId, onAssign }) {
  const [assigneeName, setAssigneeName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [docId, setDocId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAssign = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const result = await onAssign(leadId, assigneeName, organizationName, docId);
      if (result.success) {
        setMessage("Lead successfully assigned!");
        setAssigneeName("");
        setOrganizationName("");
        setDocId("");
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };


  return (
    <div className="border-t pt-4">
      <h3 className="font-semibold text-gray-800 mb-3">Assign Lead </h3>
      <form onSubmit={handleAssign} className="space-y-3">
        <label className="text-sm font-medium">Assignee Name</label>
        <input
          type="text"
          placeholder="eg Investigator Vivian"
          value={assigneeName}
          onChange={(e) => setAssigneeName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
        />
        <label className="text-sm font-medium">Organization Name</label>
        <input
          type="text"
          placeholder="eg Police Department in Nairobi"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
        />
        <label className="text-sm font-medium">Document ID / Reference</label>
        <input
          type="text"
          placeholder="Document ID or reference for tracking"
          value={docId}
          onChange={(e) => setDocId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white font-semibold transition-all ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Assigning..." : "Assign Lead"}
        </button>
      </form>
      {message && (
        <p className="text-center text-sm mt-3 font-medium text-gray-700">
          {message}
        </p>
      )}
    </div>
  );
}



// --- LeadDetailsModal Component (Simplified)
function LeadDetailsModal({ lead, onClose, onAssign, userRole }) {
  if (!lead) return null;

  // Only Administrator, Moderator, and Police can assign the lead
  const isAdminOrModeratorOrPolice = ["Administrator", "Moderator"].includes(userRole);

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center z-50 overflow-y-auto">
      <div className="relative w-11/12 md:w-4/5 lg:w-2/3 xl:w-1/2 bg-white rounded-xl shadow-2xl p-6 my-10 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Header */}
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">
          Lead Details
        </h2>

        {/* Lead Details Grid */}
        <div className="grid md:grid-cols-2 gap-4 text-gray-700 text-sm mb-6">
          <p><strong>Missing Person:</strong> {lead.missingname || "N/A"}</p>
          <p><strong>Reporter:</strong> {lead.name || "Anonymous"}</p>
          <p><strong>Contact:</strong> {lead.phone || "Anonymous"}</p>
          <p><strong>Location:</strong> {lead.location || "N/A"}</p>
          <p><strong>County:</strong> {lead.county || "N/A"}</p>
          <p><strong>Date and Time:</strong> {lead.createdWhen?.toDate().toLocaleString() || "N/A"}</p>
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-800 text-sm leading-relaxed">
            <strong>Description:</strong>{" "}
            {lead.description || "No details provided"}
          </p>
        </div>

        {/* Media Section */}
        <div className="mb-6 border-t pt-4">
          <h3 className="font-semibold text-gray-800 mb-2">Attached Media</h3>
          {lead.media ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(lead.media) ? (
                lead.media.map((url, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                  >
                    <MediaRenderer
                      url={url}
                      className="w-full h-64 object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                ))
              ) : (
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <MediaRenderer
                    url={lead.media}
                    className="w-full h-64 object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 italic mt-2">No media uploaded</p>
          )}
        </div>

        {/* Assigned To Details */}
        {lead.assignedTo && (
          <div className="mb-6 border-t pt-4">
            <h3 className="font-semibold text-green-800 mb-2 text-indigo-700">
              📌 Lead Status: {lead.status || "Assigned"}
            </h3>
            <div className="grid md:grid-cols-2 gap-2 text-gray-700 text-sm">
              <p><strong>Assigned To:</strong> {lead.assignedTo.name}</p>
              <p><strong>Organization:</strong> {lead.assignedTo.organization}</p>
              <p><strong>DOC ID:</strong> {lead.assignedTo.docId || "N/A"}</p>
              <p><strong>Assigned Date:</strong> {lead.assignedTo.assignedAt?.toDate().toLocaleString() || "N/A"}</p>
            </div>
          </div>
        )}

        {/* Action Section based on Role */}
        {isAdminOrModeratorOrPolice ? (
          <AssignLeadForm leadId={lead.id} onAssign={onAssign} />
        ) : (
          <div className="border-t pt-4 text-center text-gray-500 italic">
            Log in as an Administrator, Moderator or Police to assign or update this lead.
          </div>
        )}

      </div>
    </div>
  );
}

// --- Main OrgLeads Component
export default function LeadsManagement() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // State for Role-Based Access Control
  const [userRole, setUserRole] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Admin/Moderator/Police check is used to show the assignment form
  const isAdminOrModeratorOrPolice = ["Administrator", "Moderator", "Police"].includes(userRole);

  // --- Role Fetching Logic
  useEffect(() => {
    const auth = getAuth();

    const fetchUserRole = async (userEmail) => {
      if (!userEmail) {
        setUserRole(null);
        setIsLoadingUser(false);
        return;
      }
      try {
        const adminsRef = collection(db, "adminusers");
        // Query to find the user's specific document by email
        const q = query(adminsRef, where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Found the user, get their orgrole
            const userData = querySnapshot.docs[0].data();
            setUserRole(userData.orgrole || null);
        } else {
            setUserRole(null);
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        setUserRole(null);
      }
      setIsLoadingUser(false);
    };

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, user => {
        if (user) {
            fetchUserRole(user.email);
        } else {
            setUserRole(null);
            setIsLoadingUser(false);
        }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  // --- END Role Fetching Logic

  // Fetch leads from Firestore
  const fetchLeads = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "leads"));
      const leadsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLeads(leadsData);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((lead) =>
    lead.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Assign a lead to someone (updates the single 'assignedTo' field)
  const assignLead = async (leadId, assigneeName, organizationName, docId) => {
    try {
      const leadRef = doc(db, "leads", leadId);
      await updateDoc(leadRef, {
        assignedTo: {
          name: assigneeName,
          organization: organizationName,
          docId: docId,
          assignedAt: new Date(),
        },
        status: "Assigned",
      });

      await fetchLeads(); // Refresh the list
      return { success: true };
    } catch (error) {
      console.error("Error assigning lead:", error);
      return { success: false, error: error.message };
    }
  };


  if (isLoadingUser) {
      return (
          <div className="text-center p-10">
              Loading user permissions...
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Leads Management</h1>
      </div>
      <p className="text-gray-500 mb-6">
        Manage leads provided by the public on missing persons.
      </p>

      {/* Dashboard Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-700">Total Leads</h2>
          <p className="text-sm text-gray-500">All reported leads</p>
          <p className="text-3xl font-bold mt-2 text-black-600">
            {leads.length}
          </p>
        </div>
        {/* You can add more dashboard cards here based on 'assigned' status */}
      </div>


      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search leads"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-full shadow-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>



      {/* Leads Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Lead ID</th>
              <th className="px-4 py-3">Missing Person</th>
              <th className="px-4 py-3">Reporter</th>
              <th className="px-4 py-3">Contact Info</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs">{lead.id}</td>
                  <td className="px-4 py-3">{lead.missingname || "N/A"}</td>
                  <td className="px-4 py-3">{lead.name || "Anonymous"}</td>
                  <td className="px-4 py-3">{lead.phone || "Anonymous"}</td>
                  <td className="px-4 py-3">{lead.location || "N/A"}</td>
                  <td className="px-4 py-3">
                    {lead.description || "No details"}
                  </td>
                  <td className="px-4 py-3">
                    {lead.assignedTo ? lead.assignedTo.name : "Unassigned"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                  No leads available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={() => setShowModal(false)}
          onAssign={assignLead}
          userRole={userRole} // Pass the user role for RBAC

        />
      )}
    </div>
  );
}