import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth"; 
import { getFirestore } from 'firebase/firestore';

export default function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const [formOrg, setFormOrg] = useState({
    name: "",
    email: "",
    county: "",
    location: "",
    number: "",
    description: "",
    reason: "",
    role: "organization",
    code: "",
    noofusers: "",
  });

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const snapshot = await getDocs(collection(db, "org"));
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrganizations(list);
      } catch (err) {
        console.error("Error fetching organizations:", err);
      }
      setLoading(false);
    };
    fetchOrganizations();
  }, []);

  // Add new organization
  const handleAddOrg = async () => {
    const numberAsString = String(formOrg.number);
    if (
      !formOrg.name.trim() ||
      !formOrg.email.trim() ||
      !numberAsString.trim() ||
      !formOrg.code.trim()
    ) {
      alert("Please fill out all required fields: Name, Email and Number");
      return;
    }
    try {
      await addDoc(collection(db, "org"), {
        ...formOrg,
        createdAt: serverTimestamp(),
      });
      // Re-fetch data to show the latest state
      const snapshot = await getDocs(collection(db, "org"));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrganizations(list);
      closeForm();
    } catch (err) {
      console.error("Error adding organization:", err);
    }
  };

  // Edit organization (open form with data)
  const handleEditOrg = (org) => {
    setEditMode(true);
    setSelectedOrg(org);
    setFormOrg({
      name: org.name || "",
      email: org.email || "",
      county: org.county || "",
      location: org.location || "",
      number: org.number || "",
      description: org.description || "",
      reason: org.reason || "",
      role: org.role || "organization",
      code: org.code || "",
      noofusers: org.noofusers || "",
    });
    setShowForm(true);
  };

  // Update organization
  const handleUpdateOrg = async () => {
    const numberAsString = String(formOrg.number);
    if (
      !formOrg.name.trim() ||
      !formOrg.email.trim() ||
      !numberAsString.trim()||
      !formOrg.code.trim() ||
      !formOrg.noofusers.trim()
    ) {
      alert("Please fill out all required fields: Name, Email, and Number");
      return;
    }
    try {
      const orgRef = doc(db, "org", selectedOrg.id);
      await updateDoc(orgRef, formOrg);
      setOrganizations(
        organizations.map((o) =>
          o.id === selectedOrg.id ? { ...o, ...formOrg } : o
        )
      );
      closeForm();
    } catch (err) {
      console.error("Error updating organization:", err);
    }
  };

  // Delete organization
  const handleDeleteOrg = async (id) => {
    if (!window.confirm("Are you sure you want to delete this organization?"))
      return;
    try {
      await deleteDoc(doc(db, "org", id));
      setOrganizations(organizations.filter((o) => o.id !== id));
    } catch (err) {
      console.error("Error deleting organization:", err);
    }
  };

  // Reset/close form
  const closeForm = () => {
    setShowForm(false);
    setEditMode(false);
    setSelectedOrg(null);
    setFormOrg({
      name: "",
      email: "",
      county: "",
      location: "",
      number: "",
      description: "",
      reason: "",
      role: "organization",
      code: "",
      noofusers: "",
    });
  };

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
      .filter(doc => ["Administrator"].includes(doc.data().orgrole))
      .map(doc => doc.data().email);
      setIsUserAdmin(allowedEmails.includes(userEmail));
      } catch (error) {
        console.error("Failed to fetch admin list:", error);
        setIsUserAdmin(false);
          }
        };
    
            // Check admin status on component load and auth state change
            useEffect(() => {
              const auth = getAuth();
              const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                  fetchAdminStatus(user.email);
                } else {
                  setIsUserAdmin(false);
                }
              });
          return () => unsubscribe();
        }, []);

  // Safe search filter
  const filteredOrgs = organizations.filter((org) => {
    const nameMatch = org?.name?.toLowerCase().includes(search.toLowerCase());
    const emailMatch = org?.email?.toLowerCase().includes(search.toLowerCase());
    const countyMatch = org?.county?.toLowerCase().includes(search.toLowerCase());
    const codeMatch = org?.code?.toLowerCase().includes(search.toLowerCase());
    return nameMatch || emailMatch || countyMatch || codeMatch;
  });

  if (loading) {
    return <div className="text-center mt-10">Loading organizations...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Organizations</h1>
        {isUserAdmin && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          Add New Organization
        </button>
        )}
      </div>
      <p className="text-gray-500 mb-4">
        Manage registered organizations and their details
      </p>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email, county or code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring focus:ring-blue-300"
        />
      </div>

      {/* Organizations Table */}
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Total Number of Users</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">County</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredOrgs.map((org) => (
              <tr key={org.id} className="border-t">
                <td className="px-4 py-3">{org.name || "N/A"}</td>
                <td className="px-4 py-3 text-blue-600">{org.email || "N/A"}</td>
                <td className="px-4 py-3 ">{org.code || "N/A"}</td>
                <td className="px-4 py-3 ">{org.noofusers || "N/A"}</td>
                <td className="px-4 py-3 ">{org.description || "N/A"}</td>
                <td className="px-4 py-3">{org.number || "N/A"}</td>
                <td className="px-4 py-3">{org.county || "N/A"}</td>
                <td className="px-4 py-3 text-right flex gap-3 justify-end">
                  {isUserAdmin && (
                  <button
                    onClick={() => handleEditOrg(org)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                    )}
                  {isUserAdmin && (
                  <button
                    onClick={() => handleDeleteOrg(org.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                    )}
                </td>
              </tr>
            ))}
            {filteredOrgs.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No organizations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Organization Form (Create + Edit) */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              {editMode ? "Edit Organization" : "Add New Organization"}
            </h2>
            <input
              type="text"
              placeholder="Name"
              value={formOrg.name}
              onChange={(e) =>
                setFormOrg({ ...formOrg, name: e.target.value })
              }
              className="w-full px-3 py-2 border rounded mb-3"
            />
            <input
              type="email"
              placeholder="Email"
              value={formOrg.email}
              onChange={(e) =>
                setFormOrg({ ...formOrg, email: e.target.value })
              }
              className="w-full px-3 py-2 border rounded mb-3"
            />
            <input
              type="text"
              placeholder="Code"
              value={formOrg.code}
              onChange={(e) =>
                setFormOrg({ ...formOrg, code: e.target.value })
              }
              className="w-full px-3 py-2 border rounded mb-3"
            />

            <input
              type="text"
              placeholder="Total Number of Users"
              value={formOrg.noofusers}
              onChange={(e) =>
                setFormOrg({ ...formOrg, noofusers: e.target.value })
              }
              className="w-full px-3 py-2 border rounded mb-3"
            />

            <input
              type="text"
              placeholder="Contact Number"
              value={formOrg.number}
              onChange={(e) =>
                setFormOrg({ ...formOrg, number: e.target.value })
              }
              className="w-full px-3 py-2 border rounded mb-3"
            />
            <input
              type="text"
              placeholder="County"
              value={formOrg.county}
              onChange={(e) =>
                setFormOrg({ ...formOrg, county: e.target.value })
              }
              className="w-full px-3 py-2 border rounded mb-3"
            />
            <input
              type="text"
              placeholder="Location"
              value={formOrg.location}
              onChange={(e) =>
                setFormOrg({ ...formOrg, location: e.target.value })
              }
              className="w-full px-3 py-2 border rounded mb-3"
            />
            <textarea
              placeholder="Description"
              value={formOrg.description}
              onChange={(e) =>
                setFormOrg({ ...formOrg, description: e.target.value })
              }
              className="w-full px-3 py-2 border rounded mb-3"
              rows="3"
            ></textarea>
            <textarea
              placeholder="Reason for inclusion"
              value={formOrg.reason}
              onChange={(e) =>
                setFormOrg({ ...formOrg, reason: e.target.value })
              }
              className="w-full px-3 py-2 border rounded mb-3"
              rows="3"
            ></textarea>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeForm}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={editMode ? handleUpdateOrg : handleAddOrg}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editMode ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}