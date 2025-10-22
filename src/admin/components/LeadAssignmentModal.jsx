import React, { useState } from "react";

export default function LeadAssignmentModal({ lead, onClose, onAssign }) {
  // State for the assignment form inputs
  const [assigneeName, setAssigneeName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [docId, setDocId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState(null);

  if (!lead) return null;

  const handleAssignment = async (e) => {
    e.preventDefault();
    setAssignmentMessage(null);

    // Safety check (redundant but helpful)
    if (typeof onAssign !== 'function') {
      console.error("ERROR: onAssign function is missing in the parent component.");
      setAssignmentMessage({ type: "error", text: "Assignment function not available." });
      return;
    }

    if (!assigneeName || !organizationName || !docId) {
      setAssignmentMessage({
        type: "error",
        text: "All assignment fields (Name, Organization, DOC ID) must be filled.",
      });
      return;
    }

    setIsAssigning(true);

    try {
      // Call the function passed down from OrgLeads.js
      const result = await onAssign(lead.id, assigneeName, organizationName, docId);

      if (result && result.success) {
        setAssignmentMessage({
          type: "success",
          text: `Lead ${lead.id} successfully assigned!`,
        });
        // Close modal after a short delay
        setTimeout(onClose, 1500); 
      } else {
        setAssignmentMessage({
          type: "error",
          text: result?.error || "Assignment failed. Check console for details.",
        });
      }
    } catch (error) {
      setAssignmentMessage({
        type: "error",
        text: "An error occurred during assignment.",
      });
      console.error("Assignment error:", error);
    }
    
    setIsAssigning(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative p-6 w-11/12 md:w-1/2 lg:w-1/3 bg-white rounded-xl shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-green-700">Assign Lead: {lead.missingname}</h2>
        
        <form onSubmit={handleAssignment} className="space-y-4 pt-4">
          
          {assignmentMessage && (
            <div
              className={`p-3 rounded-md text-sm ${
                assignmentMessage.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              } transition-opacity duration-300`}
            >
              {assignmentMessage.text}
            </div>
          )}

          {/* Input: Assignee Name */}
          <div>
            <label htmlFor="assigneeName" className="block text-sm font-medium text-gray-700">
              Assignee Name
            </label>
            <input
              type="text"
              id="assigneeName"
              value={assigneeName}
              onChange={(e) => setAssigneeName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., Investigator Jane"
              required
            />
          </div>

          {/* Input: Organization Name */}
          <div>
            <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
              Organization's Name
            </label>
            <input
              type="text"
              id="organizationName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., Police Department"
              required
            />
          </div>

          {/* Input: DOC ID */}
          <div>
            <label htmlFor="docId" className="block text-sm font-medium text-gray-700">
              DOC ID (Case Identifier)
            </label>
            <input
              type="text"
              id="docId"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-green-500 focus:border-green-500"
              placeholder="Enter the case tracking ID"
              required
            />
          </div>

          {/* Assignment Button */}
          <button
            type="submit"
            disabled={isAssigning}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
          >
            {isAssigning ? "Assigning..." : " Confirm Assignment"}
          </button>
        </form>
      </div>
    </div>
  );
}
