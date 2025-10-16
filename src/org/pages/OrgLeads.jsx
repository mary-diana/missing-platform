import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import LeadDetailsModal from "../components/LeadDetailsModal";

export default function OrgLeads() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    const fetchLeads = async () => {
      const querySnapshot = await getDocs(collection(db, "leads"));
      const leadsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLeads(leadsData);
    };

    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((lead) =>
    lead.description?.toLowerCase().includes(search.toLowerCase())
  );

  
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
        <p className="text-3xl font-bold mt-2 text-black-600">{leads.length}</p>
      </div>
    </div>

        {/* Search */}
        <div className="mb-4">
        <input
          type="text"
          placeholder="Search leads"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-full  shadow-sm focus:ring-2 focus:ring-blue-500"
        />
        </div>

    {/* Leads Table */}
    
      {/* Table */}
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
        />
      )}
    </div>
  
);
}
