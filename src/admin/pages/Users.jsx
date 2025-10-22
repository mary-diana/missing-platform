import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth"; 
import { getFirestore } from 'firebase/firestore';


export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const [formUser, setFormUser] = useState({
    name: "",
    email: "",
    orgrole: "User",
    contact: "",
    orgname: "",
    orgcode: "",
    role: "",
    description: "",
  });

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "adminusers"));
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(list);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  // Add new user
  const handleAddUser = async () => {
    if (!formUser.name.trim() || !formUser.email.trim()) {
      alert("Please fill out name,email and contact");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "adminusers"), formUser);
      setUsers([...users, { id: docRef.id, ...formUser }]);
      closeForm();
    } catch (err) {
      console.error("Error adding user:", err);
    }
  };

  // Edit user (open form with data)
  const handleEditUser = (user) => {
    setEditMode(true);
    setSelectedUser(user);
    setFormUser({
      name: user.name,
      email: user.email,
      orgrole: user.orgrole || "User",
      description: user.description || "",
      contact: user.contact || "",
      orgname: user.orgname || "",
      orgcode: user.orgcode || "",
      role: user.role || "",
    });
    setShowForm(true);
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!formUser.name.trim() || !formUser.email.trim()) {
      alert("Please fill out name and email");
      return;
    }
    try {
      const userRef = doc(db, "adminusers", selectedUser.id);
      await updateDoc(userRef, formUser);

      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, ...formUser } : u
        )
      );
      closeForm();
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  // Delete user
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteDoc(doc(db, "adminusers", id));
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // Reset/close form
  const closeForm = () => {
    setShowForm(false);
    setEditMode(false);
    setSelectedUser(null);
    setFormUser({ name: "", email: "", orgrole: "User" });
  };

  // Safe search filter
  const filteredUsers = users.filter((u) => {
    const nameMatch =
      u?.name?.toLowerCase().includes(search.toLowerCase()) || false;
    const emailMatch =
      u?.email?.toLowerCase().includes(search.toLowerCase()) || false;
    const orgCodeMatch =
      u?.orgcode?.toLowerCase().includes(search.toLowerCase()) || false;
    return nameMatch || emailMatch || orgCodeMatch;

  });

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

  // Cleanup subscription on component unmount
  return () => unsubscribe();
}, []);

  if (loading) {
    return <div className="text-center mt-10">Loading users...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        {isUserAdmin && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          Create New User
        </button>
        )}
      </div>
      <p className="text-gray-500 mb-4">Manage user accounts and permissions</p>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users or organization code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring focus:ring-blue-300"
        />
      </div>

      {/* User Table */}
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Org Code</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-3">{user.name || "N/A"}</td>
                <td className="px-4 py-3 text-blue-600">{user.email || "N/A"}</td>
                <td className="px-4 py-3 ">{user.contact || "N/A"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      user.orgrole === "Administrator"
                        ? "bg-gray-300"
                        : user.orgrole === "Moderator"
                        ? "bg-blue-200"
                        : "bg-gray-100"
                    }`}
                  >
                    {user.orgrole || "N/A"}
                  </span>
                </td>
                <td className="px-4 py-3">{user.description || "N/A"}</td>
                <td className="px-4 py-3">{user.orgname || "N/A"}</td>
                <td className="px-4 py-3">{user.orgcode || "N/A"}</td>
                <td className="px-4 py-3 text-right flex gap-3 justify-end">
                  {isUserAdmin && (
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  )}
                  {isUserAdmin && (
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:underline"
                  >
                     Delete
                  </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User Form (Create + Edit) */}
{showForm && (
  <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center z-50 overflow-y-auto">
    <div className="relative w-11/12 md:w-4/5 lg:w-2/3 xl:w-1/2 bg-white rounded-xl shadow-2xl p-6 my-10 max-h-[90vh] overflow-y-auto">
      
      {/* Close Button */}
      <button
        onClick={closeForm}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        aria-label="Close"
      >
        &times;
      </button>

      {/* Header */}
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">
        {editMode ? "Edit User" : "Create New User"}
      </h2>

      {/* Form */}
      <div className="grid md:grid-cols-2 gap-4 text-gray-700 text-sm mb-6">
        {/* Name */}
        <div>
          <label className="block font-medium text-gray-800 mb-1">Name</label>
          <input
            type="text"
            placeholder="Enter name"
            value={formUser.name}
            onChange={(e) => setFormUser({ ...formUser, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block font-medium text-gray-800 mb-1">Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={formUser.email}
            onChange={(e) => setFormUser({ ...formUser, email: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Contact */}
        <div>
          <label className="block font-medium text-gray-800 mb-1">Contact</label>
          <input
            type="number"
            placeholder="Enter contact number"
            value={formUser.contact}
            onChange={(e) => setFormUser({ ...formUser, contact: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block font-medium text-gray-800 mb-1">
            Role <span className="text-gray-500 text-xs">(Administrator / Organization)</span>
          </label>
          <select
            value={formUser.role}
            onChange={(e) => setFormUser({ ...formUser, role: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="Administration">Administration</option>
            <option value="Organization">Organization</option>
          </select>
        </div>

        {/* Organization Name */}
        <div>
          <label className="block font-medium text-gray-800 mb-1">Organization Name</label>
          <input
            type="text"
            placeholder="Enter organization name"
            value={formUser.orgname}
            onChange={(e) => setFormUser({ ...formUser, orgname: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Organization Code */}
        <div>
          <label className="block font-medium text-gray-800 mb-1">Organization Code</label>
          <input
            type="text"
            placeholder="Enter organization code"
            value={formUser.orgcode}
            onChange={(e) => setFormUser({ ...formUser, orgcode: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Description (Full width) */}
        <div className="md:col-span-2">
          <label className="block font-medium text-gray-800 mb-1">Description</label>
          <textarea
            placeholder="Enter description"
            value={formUser.description}
            onChange={(e) => setFormUser({ ...formUser, description: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Organization Role */}
        <div className="md:col-span-2">
          <label className="block font-medium text-gray-800 mb-1">
            Administration / Organization Role
          </label>
          <select
            value={formUser.orgrole}
            onChange={(e) => setFormUser({ ...formUser, orgrole: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="User">User</option>
            <option value="Moderator">Moderator</option>
            <option value="Administrator">Administrator</option>
            <option value="Volunteer">Volunteer</option>
            <option value="Police">Police</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <button
          onClick={closeForm}
          className="px-4 py-2 bg-gray-300 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={editMode ? handleUpdateUser : handleAddUser}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
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

