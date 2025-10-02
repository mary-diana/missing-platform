import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function AdminVolunteerManagement() {
  const [volunteers, setVolunteers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");

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

  const filteredVolunteers = volunteers.filter((vol) => {
    return (
      vol.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCounty ? vol.county === selectedCounty : true) &&
      (selectedType ? vol.type === selectedType : true) &&
      (selectedAvailability ? vol.availability === selectedAvailability : true)
    );
  });

  // Extract unique values for dropdowns
  const counties = [...new Set(volunteers.map((v) => v.county).filter(Boolean))];
  const types = [...new Set(volunteers.map((v) => v.type).filter(Boolean))];
  const availabilities = [
    ...new Set(volunteers.map((v) => v.availability).filter(Boolean)),
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Volunteer Management</h1>
      </div>
      <p className="text-gray-500 mb-4">
        Manage registered volunteers and their availability
      </p>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">Total Volunteers</p>
          <p className="text-2xl font-bold">{volunteers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">Active Counties</p>
          <p className="text-2xl font-bold">{new Set(volunteers.map((v) => v.county)).size}</p>
        </div>
      </div>

      <div className="flex flex-nowrap gap-4 items-center mb-6">
  {/* Search */}
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

  {/* County Filter */}
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

  {/* Type Filter */}
  <select
    value={selectedType}
    onChange={(e) => setSelectedType(e.target.value)}
    className="border rounded-lg px-3 py-2 shadow-sm bg-white w-25"
  >
    <option value="">All Types</option>
    {types.map((type, i) => (
      <option key={i} value={type}>
        {type}
      </option>
    ))}
  </select>

  {/* Availability Filter */}
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
              <th className="px-4 py-3">Skills</th>
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
                <td className="px-4 py-3">{vol.skills || "N/A"}</td>
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
    </div>
  );
}

