import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

export default function AssignReportPage() {
  const { docId } = useParams(); // Get docId from URL
  const navigate = useNavigate(); // For redirection
  const db = getFirestore();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the form inputs
  const [leaderName, setLeaderName] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");
  const [leaderContact, setLeaderContact] = useState("");
  const [leaderOrganization, setLeaderOrganization] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const dangerDocRef = doc(db, "dangerReports", docId);
        const missingDocRef = doc(db, "missingPersonsReports", docId);

        // Try fetching from dangerReports
        let docSnap = await getDoc(dangerDocRef);
        let collectionName = "dangerReports";

        if (!docSnap.exists()) {
          // If not found, try fetching from missingPersonsReports
          docSnap = await getDoc(missingDocRef);
          collectionName = "missingPersonsReports";
        }

        if (docSnap.exists()) {
          const reportData = { id: docSnap.id, ...docSnap.data(), collectionName };
          setReport(reportData);

          // Pre-fill form if assignedLeader data exists
          if (reportData.assignedLeader) {
            setLeaderName(reportData.assignedLeader.name || "");
            setLeaderEmail(reportData.assignedLeader.email || "");
            setLeaderContact(reportData.assignedLeader.contact || "");
            setLeaderOrganization(reportData.assignedLeader.organization || "");
          }
        } else {
          setError("Report not found.");
        }
      } catch (e) {
        console.error("Error fetching report:", e);
        setError("Failed to load report details.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [docId, db]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!report) {
        throw new Error("Report data not loaded.");
      }

      const reportRef = doc(db, report.collectionName, docId);
      const newAssignedLeader = {
        name: leaderName,
        email: leaderEmail,
        contact: leaderContact,
        organization: leaderOrganization,
      };

      await updateDoc(reportRef, {
        assignedLeader: newAssignedLeader,
      });

      alert("Assigned Leader updated successfully!");
      navigate('/admin/reports'); // Go back to the reports list or specific report view
    } catch (e) {
      console.error("Error updating assigned leader:", e);
      alert("Failed to update assigned leader: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!window.confirm("Are you sure you want to unassign this leader?")) {
      return;
    }
    setLoading(true);
    try {
      if (!report) {
        throw new Error("Report data not loaded.");
      }
      const reportRef = doc(db, report.collectionName, docId);
      await updateDoc(reportRef, {
        assignedLeader: null, // Remove the assignedLeader object
      });
      alert("Assigned Leader removed successfully!");
      navigate('/admin/reports'); // Go back to the reports list
    } catch (e) {
      console.error("Error removing assigned leader:", e);
      alert("Failed to remove assigned leader: " + e.message);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <div className="text-center p-8">Loading report...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }

  if (!report) {
    return <div className="text-center p-8 text-red-600">No report found for ID: {docId}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md my-8">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Assign Leader to Report</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
        >
          Back to Reports
        </button>
      </div>

      <p className="text-gray-600 mb-4">
        Report ID: <span className="font-semibold">{docId}</span> (Type: {report.type})
      </p>
      <p className="text-gray-600 mb-6">
        Description: <span className="italic">{report.description || report.lastSeen || 'N/A'}</span>
      </p>

      {/* Current Assignment Details */}
      {report.assignedLeader ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-xl font-semibold text-blue-800 mb-3">Currently Assigned Leader</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
            <p><strong>Name:</strong> {report.assignedLeader.name}</p>
            <p><strong>Email:</strong> {report.assignedLeader.email}</p>
            <p><strong>Contact:</strong> {report.assignedLeader.contact}</p>
            <p><strong>Organization:</strong> {report.assignedLeader.organization}</p>
          </div>
          <button
            onClick={handleDeleteAssignment}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            disabled={loading}
          >
            Unassign Leader
          </button>
        </div>
      ) : (
        <p className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
          No leader currently assigned to this report.
        </p>
      )}

      {/* Assignment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 border-t pt-6 mt-6">Assign New / Update Leader</h3>
        <div>
          <label htmlFor="leaderName" className="block text-sm font-medium text-gray-700">
            Leader Name
          </label>
          <input
            type="text"
            id="leaderName"
            value={leaderName}
            onChange={(e) => setLeaderName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="leaderEmail" className="block text-sm font-medium text-gray-700">
            Leader Email
          </label>
          <input
            type="email"
            id="leaderEmail"
            value={leaderEmail}
            onChange={(e) => setLeaderEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="leaderContact" className="block text-sm font-medium text-gray-700">
            Leader Contact
          </label>
          <input
            type="text"
            id="leaderContact"
            value={leaderContact}
            onChange={(e) => setLeaderContact(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="leaderOrganization" className="block text-sm font-medium text-gray-700">
            Leader Organization
          </label>
          <input
            type="text"
            id="leaderOrganization"
            value={leaderOrganization}
            onChange={(e) => setLeaderOrganization(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Assignment"}
        </button>
      </form>
    </div>
  );
}