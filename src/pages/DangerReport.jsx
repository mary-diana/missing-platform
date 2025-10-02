// src/pages/DangerReport.jsx
import React, { useState, useEffect } from "react";
import { ExclamationTriangleIcon, PhotoIcon } from "@heroicons/react/24/solid";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { supabase } from "../supabaseClient";
import { GeoPoint } from "firebase/firestore";


export default function DangerReport() {
  const [form, setForm] = useState({
    category: "",
    media: [],
    description: "",
    location: "",
    county: "",
    priority: ""
  });
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const db = getFirestore();

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [mediaPreviews]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const fileArray = Array.from(files);
      const updatedMedia = [...form.media, ...fileArray]; // Combine old and new files

      setForm((prev) => ({ ...prev, [name]: updatedMedia }));

      const previews = updatedMedia.map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type
      }));
      setMediaPreviews(previews);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  //  function to handle removing media
  const handleRemoveMedia = (indexToRemove) => {
    // Filter the files in the form state
    const newMedia = form.media.filter((_, index) => index !== indexToRemove);
    setForm(prev => ({ ...prev, media: newMedia }));

    // Revoke URL and filter the previews
    URL.revokeObjectURL(mediaPreviews[indexToRemove].url);
    setMediaPreviews(mediaPreviews.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const confirmSubmission = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to submit a report.");
        return;
      }

      // Upload media files to Supabase Storage
      const mediaURLs = [];
      for (const file of form.media) {
        const fileName = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase
          .storage
          .from("danger-reports")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase
          .storage
          .from("danger-reports")
          .getPublicUrl(fileName);

        mediaURLs.push(publicData.publicUrl);
      }
      
      // Geocode location using Nominatim
      const query = `${form.location}, ${form.county}, Kenya`;
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
        {
          headers: {
            "User-Agent": "YourAppName/1.0 (your-email@example.com)", // required by Nominatim
          },
        }
      );
      const geoData = await geoRes.json();
      let position = null;
      if (geoData && geoData.length > 0) {
        // Use GeoPoint to create the position
        position = new GeoPoint(
        parseFloat(geoData[0].lat),
        parseFloat(geoData[0].lon)
                    );
                  }
      
      // Save report in Firestore
      await addDoc(collection(db, "dangerReports"), {
        category: form.category,
        description: form.description,
        location: form.location,
        county: form.county,
        priority: form.priority,
        media: mediaURLs,
        reportedBy: user.uid,
        createdAt: serverTimestamp(),
        isSolved: false,
        isVerified: false,
        isRejected: false,
        position
      });

      await addDoc(collection(db, "notifications"), {
        title: form.category,
        message: form.description,
        reportId: user.uid,
        media: mediaURLs,
        createdAt: serverTimestamp(),
        read: false,
        county: form.county,
        position
      });

      // Reset form
      setShowModal(false);
      setForm({ category: "", media: [], description: "", county: "", location: "", priority: "" });
      setMediaPreviews([]);
      alert("Danger report successfully submitted!");
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
        Report Danger
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div>
          <label className="block font-semibold mb-1">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Select category</option>
            <option value="Accident">Accident</option>
            <option value="Assault">Assault</option>
            <option value="Crime">Crime</option>
            <option value="Natural Disaster">Natural Disaster</option>
            <option value="Violence">Violence</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded p-2"
            rows={4}
            placeholder="Describe the situation..."
            required
          />
        </div>

        {/* Location */}
        <div>
          <label className="block font-semibold mb-1">Location</label>
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="Enter location"
            required
          />
        </div>

        {/* County */}
        <div>
          <label className="block font-semibold mb-1">County</label>
          <input
            type="text"
            name="county"
            value={form.county}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="Enter county name"
            required
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block font-semibold mb-1">Priority Level</label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Select priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Media upload */}
        <div className="border-2 border-dashed rounded-lg p-4 text-center">
          <div className="flex flex-col items-center justify-center">
            <PhotoIcon className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-2">Upload photos / short videos</p>
            <input
              type="file"
              name="media"
              accept="image/*,video/*"
              multiple
              onChange={handleChange}
              className="block mx-auto"
            />
            <p className="text-xs text-gray-400 mt-2">
              You can upload multiple files below 50 MB (images or short videos).
            </p>
          </div>

          {/* Media Previews */}
          {mediaPreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {mediaPreviews.map((media, idx) => (
                <div key={idx} className="relative">
                  {media.type.startsWith("image/") ? (
                    <img
                      src={media.url}
                      alt={`preview-${idx}`}
                      className="rounded border w-full h-40 object-cover"
                    />
                  ) : (
                    <video
                      src={media.url}
                      controls
                      className="rounded border w-full h-40 object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold opacity-80 hover:opacity-100"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
        >
          Submit Report
        </button>
      </form>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded shadow p-6 w-80">
            <h2 className="text-lg font-bold mb-4">Confirm Submission</h2>
            <p className="mb-4">Are you sure you want to submit this danger report?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmission}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}