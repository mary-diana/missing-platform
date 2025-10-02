// src/pages/ProvideLeads.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { PhotoIcon } from "@heroicons/react/24/outline";

const ProvideLeads = () => {
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({
    missingname: "",
    missingage: "",
    gender: "",
    name: "",
    phone: "",
    location: "",
    county: "",
    datetime: "",
    description: "",
    media: [],
  });

  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle media selection
  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setForm((prev) => ({ ...prev, media: files }));

    // create preview URLs
    const previews = files.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
    }));
    setMediaPreviews(previews);
  };

  // Remove media file
  const handleRemoveMedia = (indexToRemove) => {
    const newMedia = form.media.filter((_, idx) => idx !== indexToRemove);
    setForm((prev) => ({ ...prev, media: newMedia }));

    URL.revokeObjectURL(mediaPreviews[indexToRemove].url);
    setMediaPreviews(mediaPreviews.filter((_, idx) => idx !== indexToRemove));
  };

  // Upload media to Supabase Storage
  const uploadMediaFiles = async () => {
    const mediaURLs = [];
    for (const file of form.media) {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase
        .storage
        .from("report-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase
        .storage
        .from("report-media")
        .getPublicUrl(fileName);

      mediaURLs.push(publicData.publicUrl);
    }
    return mediaURLs;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const mediaURLs = form.media.length > 0 ? await uploadMediaFiles() : [];

      await addDoc(collection(db, "leads"), {
        missingname: form.missingname,
        missingage: Number(form.missingage),
        gender: form.gender,
        name: form.name,
        phone: form.phone,
        location: form.location,
        county: form.county,
        createdWhen: serverTimestamp(),
        datetime: form.datetime,
        description: form.description,
        media: mediaURLs,
      });

      alert("Lead submitted successfully. Your information will not be shared publicly.");
      navigate(-1);
    } catch (err) {
      console.error("Error submitting lead:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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

      <h1 className="text-3xl font-bold mb-2">Provide Leads</h1>
      <p className="text-gray-600 mb-6">
        If you have any information or sightings related to missing persons or
        potential dangers, please share them with us. Your leads could be
        crucial in resolving cases.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <label className="block text-sm font-medium text-gray-700">
          Missing Person Name
        </label>
        <input
          type="text"
          name="missingname"
          value={form.missingname}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          required
        />

        <label className="block text-sm font-medium text-gray-700">
          Missing Person's Age
        </label>
        <input
          type="number"
          name="missingage"
          value={form.missingage}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          required
        />

        <label className="block text-sm font-medium text-gray-700">
          Missing Person's Gender
        </label>
        <input
          type="text"
          name="gender"
          placeholder="Male or Female"
          value={form.gender}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          required
        />

        <label className="block text-sm font-medium text-gray-700">
          Your Name (Optional)
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
        />

        <label className="block text-sm font-medium text-gray-700">
          Phone Number (Optional)
        </label>
        <input
          type="text"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
        />

        <label className="block text-sm font-medium text-gray-700">
          Location of Sighting
        </label>
        <input
          type="text"
          name="location"
          value={form.location}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          required
        />

        <label className="block text-sm font-medium text-gray-700">
          County of Sighting
        </label>
        <input
          type="text"
          name="county"
          value={form.county}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          required
        />

        <label className="block text-sm font-medium text-gray-700">
          Date and Time of Sighting
        </label>
        <input
          type="datetime-local"
          name="datetime"
          value={form.datetime}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          required
        />

        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full p-3 border rounded-md"
          rows="3"
          required
        />

        <label className="block text-sm font-medium text-gray-700">
          Media
        </label>
        <div className="border-2 border-dashed rounded-md p-6 text-center">
          <PhotoIcon className="w-8 h-8 text-gray-400 mb-2  mx-auto" />
          <p className="text-gray-600 mb-2">Upload Media (Optional)</p>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            name="media"
            onChange={handleMediaChange}
            className="block mx-auto"
          />
          <p className="text-xs text-gray-400 mt-2">
            You can upload multiple files below 50 MB (images or short videos).
          </p>

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
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Lead"}
        </button>
      </form>
    </div>
  );
};

export default ProvideLeads;
