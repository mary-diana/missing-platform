import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth } from "firebase/auth";

export default function AdminVolunteerManagement() {
  const [volunteers, setVolunteers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [leaderName, setLeaderName] = useState("");
  const [leaderContact, setLeaderContact] = useState("");
  const [task, setTask] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState("Pending");
  const [showModal, setShowModal] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [showRestrictedDetails, setShowRestrictedDetails] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    // Initialize auth instance
    const auth = getAuth();

    const fetchAdminStatus = async (userEmail) => {
      if (!userEmail) {
        setIsUserAdmin(false);
        return;
      }
      try {
        // Use the globally imported 'db' instead of calling getFirestore()
        const adminsRef = collection(db, "adminusers"); 
        const adminSnapshot = await getDocs(adminsRef);
        const allowedEmails = adminSnapshot.docs
        .filter(doc => ["Administrator","Volunteer"].includes(doc.data().orgrole))
        .map(doc => doc.data().email);
        setIsUserAdmin(allowedEmails.includes(userEmail));
      } catch (error) {
        console.error("Failed to fetch admin list:", error);
        setIsUserAdmin(false);
      }
    };

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(user => {
        if (user) {
            fetchAdminStatus(user.email);
        } else {
            setIsUserAdmin(false);
        }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe(); 
}, []);

  // Fetch volunteers
  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "volunteer"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVolunteers(data);
      } catch (error) {
        console.error("Error fetching volunteers:", error);
      }
    };
    fetchVolunteers();
  }, []);

  // Fetch latest volunteer data when modal opens
  useEffect(() => {
    const fetchVolunteerDetails = async () => {
      if (!selectedVolunteer) return;
      try {
        const ref = doc(db, "volunteer", selectedVolunteer.id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setLeaderName(data.leaderName || "");
          setLeaderContact(data.leaderContact || "");
          setTask(data.task || "");
          setTimePeriod(data.timePeriod || "");
          setAssignmentStatus(data.assignmentStatus || "Pending");
        }
      } catch (error) {
        console.error("Error fetching volunteer details:", error);
      }
    };
    fetchVolunteerDetails();
  }, [selectedVolunteer]);

  const filteredVolunteers = volunteers.filter((vol) => {
    return (
      vol.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCounty ? vol.county === selectedCounty : true) &&
      (selectedType ? vol.type === selectedType : true) &&
      (selectedAvailability ? vol.availability === selectedAvailability : true)
    );
  });

  const counties = [...new Set(volunteers.map((v) => v.county).filter(Boolean))];
  const types = [...new Set(volunteers.map((v) => v.type).filter(Boolean))];
  const availabilities = [
    ...new Set(volunteers.map((v) => v.availability).filter(Boolean)),
  ];

  const handleOpenModal = (vol) => {
    setSelectedVolunteer(vol);
    setShowModal(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedVolunteer) return;

    try {
      const volunteerRef = doc(db, "volunteer", selectedVolunteer.id);
      await updateDoc(volunteerRef, {
        leaderName,
        leaderContact,
        task,
        timePeriod,
        assignmentStatus,
        assignedAt: new Date().toISOString(),
      });

      alert("Assignment updated successfully!");
      setShowModal(false);
    } catch (error) {
      console.error("Error updating volunteer:", error);
      alert("Failed to update assignment.");
    }
  };


  const handleMarkDone = async () => {
    try {
      const volunteerRef = doc(db, "volunteer", selectedVolunteer.id);
      await updateDoc(volunteerRef, {
        assignmentStatus: "Done",
      });
      setIsDone(true); // Update local state so UI updates instantly
    } catch (error) {
      console.error("Error marking as done:", error);
    }
  };

  useEffect(() => {
    if (selectedVolunteer) {
        // The assignment is considered "Done" only if the status is exactly 'Done'
        const isCurrentlyDone = selectedVolunteer.assignmentStatus === "Done";
        setIsDone(isCurrentlyDone);
    } else {
        setIsDone(false);
    }
  }, [selectedVolunteer]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Volunteer Management</h1>
      </div>
      <p className="text-gray-500 mb-4">
        Manage registered volunteers, assign tasks, and track progress.
      </p>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">Total Volunteers</p>
          <p className="text-2xl font-bold">{volunteers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">Active Counties</p>
          <p className="text-2xl font-bold">
            {new Set(volunteers.map((v) => v.county)).size}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm w-72">
          <Search className="w-7 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search volunteers by name"
            className="w-full outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={selectedCounty}
          onChange={(e) => setSelectedCounty(e.target.value)}
          className="border rounded-lg px-3 py-2 shadow-sm bg-white"
        >
          <option value="">All Counties</option>
          {counties.map((county, i) => (
            <option key={i} value={county}>
              {county}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="border rounded-lg px-3 py-2 shadow-sm bg-white"
        >
          <option value="">All Types</option>
          {types.map((type, i) => (
            <option key={i} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={selectedAvailability}
          onChange={(e) => setSelectedAvailability(e.target.value)}
          className="border rounded-lg px-3 py-2 shadow-sm bg-white"
        >
          <option value="">All Availability</option>
          {availabilities.map((avail, i) => (
            <option key={i} value={avail}>
              {avail}
            </option>
          ))}
        </select>
      </div>

      {/* Volunteers Table */}
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">County</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Availability</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredVolunteers.map((vol) => (
              <tr key={vol.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{vol.name || "N/A"}</td>
                <td className="px-4 py-3 text-blue-600">{vol.email || "N/A"}</td>
                <td className="px-4 py-3">{vol.phone || "N/A"}</td>
                <td className="px-4 py-3">{vol.county || "N/A"}</td>
                <td className="px-4 py-3">{vol.location || "N/A"}</td>
                <td className="px-4 py-3">{vol.type || "N/A"}</td>
                <td className="px-4 py-3">{vol.availability || "N/A"}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleOpenModal(vol)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filteredVolunteers.length === 0 && (
              <tr>
                <td colSpan="8" className="px-4 py-6 text-center text-gray-500">
                  No volunteers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      
      
      {/* Modal */}
{showModal && selectedVolunteer && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
            {/* Close Button (Unchanged) */}
            <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-lg font-bold"
            >
                ✕
            </button>

            <h2 className="text-2xl font-semibold mb-4 text-center">
                Volunteer Assignment Details
            </h2>

            {/* Common Volunteer Info (Always visible) */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <p><strong>Volunteer:</strong> {selectedVolunteer.name}</p>
                <p><strong>Email:</strong> {selectedVolunteer.email}</p>
                <p><strong>Phone:</strong> {selectedVolunteer.phone}</p>
                <p><strong>Type:</strong> {selectedVolunteer.type}</p>
                <p><strong>Skills:</strong> {selectedVolunteer.skills || "N/A"}</p>
                <p><strong>County:</strong> {selectedVolunteer.county}</p>
                <p><strong>Location:</strong> {selectedVolunteer.location}</p>
                <p><strong>Availability:</strong> {selectedVolunteer.availability}</p>
                <p><strong>Assigned At:</strong> {selectedVolunteer.assignedAt || "N/A"}</p>
            </div>

            <hr className="mb-4" />

            {/* HIDE/VIEW TOGGLE BUTTON  */}
            {isUserAdmin && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setShowRestrictedDetails(!showRestrictedDetails)}
                        className="px-3 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        {showRestrictedDetails ? "Hide Assignment Details" : "View Assignment Details"}
                    </button>
                </div>
            )}

            {/* RESTRICTED ASSIGNMENT DETAILS BLOCK  */}
            {isUserAdmin && showRestrictedDetails && (
                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Task Management</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Fields that were previously visible */}
                        <div>
                            <label className="text-sm font-medium">Leader Name</label>
                            <input
                                type="text"
                                className="border rounded w-full px-2 py-1"
                                value={leaderName}
                                onChange={(e) => setLeaderName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Leader Contact</label>
                            <input
                                type="text"
                                className="border rounded w-full px-2 py-1"
                                value={leaderContact}
                                onChange={(e) => setLeaderContact(e.target.value)}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium">Task</label>
                            <textarea
                                className="border rounded w-full px-2 py-1"
                                rows="2"
                                value={task}
                                onChange={(e) => setTask(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Time Period</label>
                            <input
                                type="text"
                                className="border rounded w-full px-2 py-1"
                                value={timePeriod}
                                onChange={(e) => setTimePeriod(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Assignment Status</label>
                            <select
                                className="border rounded w-full px-2 py-1"
                                value={assignmentStatus}
                                onChange={(e) => setAssignmentStatus(e.target.value)}
                            >
                                <option>Pending</option>
                                <option>In Progress</option>
                                <option>Done</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
            {/* END RESTRICTED BLOCK */}

            <div className="flex justify-end gap-3 mt-6">
                {/* Action buttons (Only show Mark as Done if details are visible, assuming it's part of management) */}
                {isUserAdmin && showRestrictedDetails && (
                    <button
                        onClick={handleSaveAssignment}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                        Save Assignment
                    </button>
                )}
                
                {isUserAdmin && showRestrictedDetails && (
                    <button
                        onClick={handleMarkDone}
                        disabled={isDone} 
                        className={`px-4 py-2 rounded text-sm ${
                            isDone
                                ? "bg-gray-400 text-white cursor-not-allowed"
                                : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                    >
                        {isDone ? "Done" : "Completed Volunteer Task"}
                    </button>
                )}
                
                <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
)}
    </div>
  );
}

