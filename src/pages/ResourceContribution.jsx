// src/pages/ResourceContribution.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase"; // adjust the path if needed
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const ResourceContribution = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "",
    details: "",
  });

  // handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "resource"), {
        ...formData,
        createdAt: serverTimestamp(),
      });

      alert(
        " Thank you for your contribution! Our team will reach out to you shortly."
      );

      // reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        type: "",
        details: "",
      });
    } catch (error) {
      console.error("Error adding resource:", error);
      alert(" Failed to submit. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-yellow-300 text-gray-700 rounded-lg hover:bg-gray-300"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-2">Resource Contribution</h1>
      <p className="text-gray-600 mb-6">
        Support our mission by contributing resources such as funding,
        transportation, printing posters or sharing expertise.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <label className="block text-sm font-medium text-gray-700">
          Full Name/Organization
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          required
        />

        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          required
        />

        <label className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          required
        />

        <label className="block text-sm font-medium text-gray-700">
          Select Resource Type
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          required
        >
          <option value="">Resource Type</option>
          <option>Funding</option>
          <option>Transportation</option>
          <option>Printing/Posters</option>
          <option>First Aid Support</option>
          <option>Other</option>
        </select>

        <label className="block text-sm font-medium text-gray-700">
          Additional Details
        </label>
        <textarea
          name="details"
          value={formData.details}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          rows="3"
          required
        />

        <label className="flex items-center space-x-2">
          <input type="checkbox" required />
          <span className="text-gray-700 text-sm">
            I consent to share my contacts with FindThem for resource
            contribution.
          </span>
        </label>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
        >
          Contribute
        </button>
      </form>
    </div>
  );
};

export default ResourceContribution;
