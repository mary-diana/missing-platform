import React, { useEffect, useState } from "react";
import { useLocation,useParams, useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

export default function ResolveReportPage() {
  const { docId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const db = getFirestore();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resolution form fields
  const [status, setStatus] = useState("");
  const [foundLocation, setFoundLocation] = useState("");
  const [foundCounty, setFoundCounty] = useState("");
  const [resolutionDate, setResolutionDate] = useState("");
  const [description, setDescription] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const dangerDocRef = doc(db, "dangerReports", docId);
        const missingDocRef = doc(db, "missingPersonsReports", docId);

        // Try fetching from both collections
        let docSnap = await getDoc(dangerDocRef);
        let collectionName = "dangerReports";

        if (!docSnap.exists()) {
          docSnap = await getDoc(missingDocRef);
          collectionName = "missingPersonsReports";
        }

        if (docSnap.exists()) {
          const reportData = { id: docSnap.id, ...docSnap.data(), collectionName };
          setReport(reportData);

          if (reportData.resolution) {
            setStatus(reportData.resolution.status || "");
            setFoundLocation(reportData.resolution.location || "");
            setFoundCounty(reportData.resolution.county || "");
            setResolutionDate(reportData.resolution.date || "");
            setDescription(reportData.resolution.description || "");
            setAdditionalNotes(reportData.resolution.notes || "");
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
      if (!report) throw new Error("Report not loaded.");

      const reportRef = doc(db, report.collectionName, docId);
      const resolutionData = {
        status,
        location: foundLocation,
        county: foundCounty,
        date: resolutionDate,
        description,
        notes: additionalNotes,
        resolvedAt: new Date().toISOString(),
      };

      await updateDoc(reportRef, { resolution: resolutionData });

      alert("Report resolved successfully!");
      const redirectPath = location.pathname.startsWith('/admin')
        ? '/admin/reports' // Redirect to admin reports page
        : '/org/reports'; // Assuming /org/reports is the correct path for the org account
      navigate(redirectPath);
    } catch (e) {
      console.error("Error updating resolution:", e);
      alert("Failed to update resolution: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8">Loading report...</div>;
  if (error) return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  if (!report) return <div className="text-center p-8 text-red-600">No report found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md my-8">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Resolve Report</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
        >
          Back
        </button>
      </div>

      <p className="text-gray-600 mb-4">
        Report ID: <span className="font-semibold">{docId}</span> (Type: {report.type})
      </p>

      <p className="text-gray-600 mb-6">
        Description:{" "}
        <span className="italic">{report.description || report.lastSeen || "N/A"}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Resolution Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            required
          >
            <option value="">Select Status</option>
            <option value="Found Alive">Found Alive</option>
            <option value="Found Deceased">Found Deceased</option>
            <option value="Mutilated body">Mutilated body</option>
            <option value="Sexually assaulted">Sexually assaulted</option>
            <option value="Resolved - Safe">Resolved - Safe</option>
            <option value="Unfounded">Unfounded</option>
          </select>
        </div>

        <div>
          <label htmlFor="foundLocation" className="block text-sm font-medium text-gray-700">
            Found Location
          </label>
          <input
            type="text"
            id="foundLocation"
            value={foundLocation}
            onChange={(e) => setFoundLocation(e.target.value)}
            placeholder="Enter Location"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="foundCounty" className="block text-sm font-medium text-gray-700">
            Found County
          </label>
          <input
            type="text"
            id="foundCounty"
            value={foundCounty}
            onChange={(e) => setFoundCounty(e.target.value)}
            placeholder="Enter County"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="resolutionDate" className="block text-sm font-medium text-gray-700">
            Resolution Date
          </label>
          <input
            type="date"
            id="resolutionDate"
            value={resolutionDate}
            onChange={(e) => setResolutionDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Resolution Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            placeholder="Describe what happened or how the person was found..."
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          ></textarea>
        </div>

        <div>
          <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700">
            Additional Notes (optional)
          </label>
          <textarea
            id="additionalNotes"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows="3"
            placeholder="Any extra information or remarks"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          {loading ? "Saving..." : "Save/Update Resolution"}
        </button>
      </form>
    </div>
  );
}
