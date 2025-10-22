import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
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

// --- LeadDetailsModal Component
function LeadDetailsModal({ lead, onClose, onAssign }) {
  if (!lead) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative p-6 w-11/12 md:w-3/5 lg:w-1/3 bg-white rounded-xl shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-blue-800">
          Lead Details
        </h2>

        {/* Lead Details Section */}
        <div className="space-y-3 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border">
          <p>
            <span className="font-semibold">Missing Person:</span>{" "}
            {lead.missingname || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Reporter:</span>{" "}
            {lead.name || "Anonymous"}
          </p>
          <p>
            <span className="font-semibold">Contact:</span>{" "}
            {lead.phone || "Anonymous"}
          </p>
          <p>
            <span className="font-semibold">Location:</span>{" "}
            {lead.location || "N/A"}
          </p>
          <p>
            <span className="font-semibold">County:</span>{" "}
            {lead.county || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Date & Time:</span>{" "}
            {lead.createdWhen?.toDate().toLocaleString() || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Description:</span>{" "}
            {lead.description || "No details"}
          </p>
        </div>

        {/* Media Section */}
        {lead.media ? (
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-semibold mb-2 text-gray-800">Attached Media</h3>
            <MediaRenderer
              url={lead.media}
              className="w-full h-auto max-h-80 object-contain rounded-lg border"
            />
          </div>
        ) : (
          <p className="text-center text-gray-500 italic mt-2">
            No media uploaded
          </p>
        )}
      </div>
    </div>
  );
}

// --- Main LeadsManagement Component
export default function LeadsManagement() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

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

  // Assign a lead to someone
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

      await fetchLeads();
      return { success: true };
    } catch (error) {
      console.error("Error assigning lead:", error);
      return { success: false, error: error.message };
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Leads Management</h1>
      </div>
      <p className="text-gray-500 mb-6">
        Manage leads provided by the public on missing persons
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
              <th className="px-4 py-3">Missing Person</th>
              <th className="px-4 py-3">Reporter</th>
              <th className="px-4 py-3">Contact Info</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Media</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{lead.missingname || "N/A"}</td>
                  <td className="px-4 py-3">{lead.name || "Anonymous"}</td>
                  <td className="px-4 py-3">{lead.phone || "Anonymous"}</td>
                  <td className="px-4 py-3">{lead.location || "N/A"}</td>
                  <td className="px-4 py-3">
                    {lead.createdWhen
                      ? lead.createdWhen.toDate().toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    {lead.description || "No details"}
                  </td>
                  <td className="px-4 py-3">
                    {lead.media ? (
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="px-4 py-6 text-center text-gray-500"
                >
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
        />
      )}
    </div>
  );
}
