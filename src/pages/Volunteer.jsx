// src/pages/Volunteer.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const Volunteer = () => {
  const navigate = useNavigate();

  // State for form fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    county: "",
    location: "",
    availability: "",
    type: "",
    skills: "",
  });

  // handle changes
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
      await addDoc(collection(db, "volunteer"), {
        ...formData,
        createdAt: serverTimestamp(),
      });

      alert(" Thank you for signing up! Your volunteer information has been submitted.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        county: "",
        location: "",
        availability: "",
        type: "",
        skills: "",
      });
    } catch (error) {
      console.error("Error adding volunteer:", error);
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

      <h1 className="text-3xl font-bold mb-2">Volunteer Sign-Up</h1>

      <p className="text-gray-600 mb-6">
        Join our network of volunteers to assist in searches, raise awareness or
        patrol neighborhoods. Your involvement can make a significant difference
        in ensuring community safety.
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
          Email Address
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

        <label className="block text-sm font-medium text-gray-700">County</label>
        <input
          type="text"
          name="county"
          value={formData.county}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          required
        />

        <label className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          required
        />

        <label className="block text-sm font-medium text-gray-700">
          Availability
        </label>
        <select
          name="availability"
          value={formData.availability}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          required
        >
          <option value="">Select Availability</option>
          <option>Weekdays</option>
          <option>Weekends</option>
          <option>Both</option>
        </select>

        <label className="block text-sm font-medium text-gray-700">
          Volunteer Type
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          required
        >
          <option value="">Choose</option>
          <option>Search and Rescue</option>
          <option>Awareness Campaigns (flyers, posters, online advocacy)</option>
          <option>First Aid/Medical services</option>
          <option>Fundraising</option>
          <option>Shelter</option>
          <option>Food Distribution</option>
          <option>Other</option>
        </select>

        <label className="block text-sm font-medium text-gray-700">
          Special Skills (Optional)
        </label>
        <textarea
          name="skills"
          value={formData.skills}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          rows="3"
        />

        <label className="flex items-center space-x-2">
          <input type="checkbox" required />
          <span className="text-gray-700 text-sm">
            I consent to be contacted by FindThem for volunteer opportunities.
          </span>
        </label>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default Volunteer;
