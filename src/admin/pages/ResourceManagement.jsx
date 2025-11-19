import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc } from "firebase/firestore";

export default function ResourceManagement() {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [searchContributor, setSearchContributor] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterAvailability, setFilterAvailability] = useState("Any");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  // Fetch resources from Firestore
  useEffect(() => {
    const fetchResources = async () => {
      const querySnapshot = await getDocs(collection(db, "resource"));
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setResources(list);
      setFilteredResources(list);
    };
    fetchResources();
  }, []);

  const applyFilters = (
        searchName,
        typeFilter,
        availabilityFilter
    ) => {
        // Start with the original list of resources
        let filtered = [...resources];
        // 1. Filter by Contributor Name
        if (searchName.trim() !== "") {
            filtered = filtered.filter((item) =>
                item.name.toLowerCase().includes(searchName.toLowerCase())
            );
        }
        // 2. Filter by Type
        if (typeFilter !== "All") {
            filtered = filtered.filter((item) => item.type === typeFilter);
        }
        // 3. Filter by Availability/Status
        if (availabilityFilter !== "Any") {
            filtered = filtered.filter((item) => item.status === availabilityFilter);
        }
        // Update the displayed resources
        setFilteredResources(filtered);
    };

  const handleOpenModal = (resource = null) => {
    setEditingResource(resource);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingResource(null);
    setModalOpen(false);
  };

  const handleSaveResource = async () => {
    if (editingResource.id) {
      // Update existing resource
      const resRef = doc(db, "resource", editingResource.id);
      await updateDoc(resRef, editingResource);
      setResources((prev) =>
        prev.map((r) => (r.id === editingResource.id ? editingResource : r))
      );
      setFilteredResources((prev) =>
        prev.map((r) => (r.id === editingResource.id ? editingResource : r))
      );
    } else {
      // Add new resource
      const resRef = await addDoc(collection(db, "resource"), editingResource);
      const newRes = { id: resRef.id, ...editingResource };
      setResources((prev) => [...prev, newRes]);
      setFilteredResources((prev) => [...prev, newRes]);
    }
    handleCloseModal();
  };

  const handleDeleteResource = async (id) => {
    await deleteDoc(doc(db, "resource", id));
    setResources((prev) => prev.filter((r) => r.id !== id));
    setFilteredResources((prev) => prev.filter((r) => r.id !== id));
    handleCloseModal();
  };

  // Summary counts
  const totalResources = resources.length;
  const activeTypes = [...new Set(resources.map((r) => r.type))].length;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex justify-between items-start">
    {/* Text Content (Left Side) */}
    <div>
      <h1 className="text-3xl font-bold mb-2">Resource Management</h1>
      <p className="text-gray-600">View, manage, and track all contributed resources.</p>
    </div>

    {/* Button (Top Right Side) */}
    <button
      onClick={() => handleOpenModal()}
      className="bg-blue-600 text-white px-4 py-2 mt-1 rounded shadow hover:bg-blue-700 transition duration-150"
    >
      New Resource
    </button>
  </div>

      {/* SUMMARY */}
      <div className="flex gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow flex-1">
          <p className="text-gray-500">Total Resources</p>
          <p className="text-2xl font-bold">{totalResources}</p>
        </div>
        <div className="bg-white p-4 rounded shadow flex-1">
          <p className="text-gray-500">Active Types</p>
          <p className="text-2xl font-bold">{activeTypes}</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search contributor..."
          value={searchContributor}
          onChange={(e) => {
            setSearchContributor(e.target.value);
            applyFilters(e.target.value, filterType, filterAvailability); 
            }}
          className="border p-2 rounded flex-1 min-w-[200px]"
        />
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            applyFilters(searchContributor, e.target.value, filterAvailability);
            }}
          className="border p-2 rounded"
        >
          <option>All</option>
          <option>Funding</option>
          <option>Transportation</option>
          <option>Printing/Posters</option>
          <option>First Aid Support</option>
            <option>Other</option>
        </select>
        <select
          value={filterAvailability}
          onChange={(e) => {
            setFilterAvailability(e.target.value);
            applyFilters(searchContributor, filterType, e.target.value);
            }}
          className="border p-2 rounded"
        >
          <option value="Any">Any</option>
          <option value="ongoing">Ongoing</option>
          <option value="pending">Pending</option>
          <option value="complete">Complete</option>
        </select>
      </div>

      {/* RESOURCE TABLE */}
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="w-full table-auto text-left border-collapse">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Contact</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Quantity</th>
              <th className="p-3 text-left">Availability</th>
              <th className="p-3 text-left">Notes</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredResources.map((item) => (
              <tr key={item.id} className="border-b bg-gray-100 border-t">
                <td className="p-3">{item.name}</td>
                <td className="p-3">
                  <p>{item.email}</p>
                  <p>{item.phone}</p>
                </td>
                <td className="p-3">{item.type}</td>
                <td className="p-3">{item.quantity || "-"}</td>
                <td className="p-3 capitalize">{item.status || "pending"}</td>
                <td className="p-3">{item.details}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="text-indigo-600 hover:underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredResources.length === 0 && (
          <p className="text-center py-6 text-gray-500">No resources found.</p>
        )}
      </div>

      {/* MODAL */}
        {modalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg overflow-y-auto max-h-full">
            
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                {editingResource?.id ? "Edit Resource" : "New Resource"}
                </h2>
                {/* Close Button (Matching the 'X' icon aesthetic) */}
                <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition duration-150"
                aria-label="Close"
                >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            {/* FORM FIELDS */}
            <div className="flex flex-col gap-4">

                {/* 1. Name Input (Resource Name) */}
                <div>
                <label htmlFor="resource-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Name
                </label>
                <input
                    id="resource-name"
                    type="text"
                    placeholder="Water Filters"
                    value={editingResource?.name || ""}
                    onChange={(e) =>
                    setEditingResource({ ...editingResource, name: e.target.value })
                    }
                    // Tailwind styles for a cleaner look
                    className="w-full border border-gray-300 p-2 text-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                </div>

                {/* 2. Email Input */}
                <div>
                <label htmlFor="resource-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                </label>
                <input
                    id="resource-email"
                    type="email"
                    placeholder="contact@example.com"
                    value={editingResource?.email || ""}
                    onChange={(e) =>
                    setEditingResource({ ...editingResource, email: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2 text-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                </div>

                {/* 3. Phone Input */}
                <div>
                <label htmlFor="resource-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                </label>
                <input
                    id="resource-phone"
                    type="text"
                    placeholder="1234567890"
                    value={editingResource?.phone || ""}
                    onChange={(e) =>
                    setEditingResource({ ...editingResource, phone: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2 text-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                </div>

                {/* 4. Type Input */}
                <div>
                <label htmlFor="resource-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Type
                </label>
                <select
                    id="resource-type"
                    type="text"
                    value={editingResource?.type || ""}
                    onChange={(e) =>
                    setEditingResource({ ...editingResource, type: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2 text-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Select a type</option>
                    <option value="Funding">Funding</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Printing/Posters">Printing/Posters</option>
                    <option value="First Aid Support">First Aid Support</option>
                    <option value="Other">Other</option>
                </select>
                </div>

                {/* 5. Quantity Input */}
                <div>
                <label htmlFor="resource-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                </label>
                <input
                    id="resource-quantity"
                    type="text"
                    placeholder="Enter number"
                    value={editingResource?.quantity || ""}
                    onChange={(e) =>
                    setEditingResource({ ...editingResource, quantity: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2 text-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                </div>

                {/* 6. Status Select */}
                <div>
                <label htmlFor="resource-status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                </label>
                <select
                    id="resource-status"
                    value={editingResource?.status || "pending"}
                    onChange={(e) =>
                    setEditingResource({ ...editingResource, status: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2 text-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                    <option value="ongoing">Ongoing</option>
                    <option value="pending">Pending</option>
                    <option value="complete">Complete</option>
                </select>
                </div>
                
                {/* 7. Notes Textarea */}
                <div>
                <label htmlFor="resource-notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes / Details
                </label>
                <textarea
                    id="resource-notes"
                    placeholder="Add any relevant details or notes here..."
                    value={editingResource?.details || ""}
                    rows={3}
                    onChange={(e) =>
                    setEditingResource({ ...editingResource, details: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2 text-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                </div>

            </div>

            {/* BUTTONS */}
            <div className="mt-6 flex justify-end gap-3 border-t pt-4 border-gray-200">
                {editingResource?.id && (
                <button
                    onClick={() => handleDeleteResource(editingResource.id)}
                    className="text-red-600 hover:text-red-700 px-4 py-2 font-medium transition duration-150"
                >
                    Delete
                </button>
                )}
                <button
                onClick={handleCloseModal}
                // The cancel button in the image is a plain text button
                className="text-gray-500 hover:text-gray-700 px-4 py-2 font-medium transition duration-150"
                >
                Cancel
                </button>
                <button
                onClick={handleSaveResource}
                // Using a subtle blue primary button style
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition duration-150"
                >
                Save
                </button>
            </div>
            </div>
        </div>
        )}
    </div>
  );
}
