import React, { useEffect, useState } from "react";
import {
  UserIcon,
  MapPinIcon,
  PhotoIcon,
  CalendarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { supabase } from "../supabaseClient"; 
import { GeoPoint } from "firebase/firestore";

export default function CreateReport({ onReportSubmit }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    reportedBy: "",
    submittedWhen: new Date().toISOString().slice(0, 16),
    reportId: `RPT-${Date.now()}`,
    contact: "",
    location: "",
    county: "",
    missingPersonName: "",
    age: "",
    gender: "",
    lastSeen: "",
    dateOfDisappearance: "",
    media: [],
  });
  const [previews, setPreviews] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  //  Auth Guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  // --- Validation ---
  const step1Valid = form.reportedBy.trim() && form.submittedWhen && form.reportId.trim() && form.contact.trim();
  const step2Valid = form.location.trim() && form.county.trim();
  const step3Valid =
    form.missingPersonName.trim() &&
    form.age !== "" &&
    form.gender !== "" &&
    form.lastSeen !== "" &&
    form.dateOfDisappearance !== "" &&
    form.media.length > 0;

  // --- Media Preview ---
  useEffect(() => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    const urls = form.media.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [form.media]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm((s) => ({ ...s, media: Array.from(files) }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  };

  const handleNext = () => {
    if (step === 1 && !step1Valid) return;
    if (step === 2 && !step2Valid) return;
    setStep((s) => Math.min(3, s + 1));
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = (e) => {
    e.preventDefault();
    if (!step3Valid) return;
    setShowConfirm(true);
  };

  //  New function to handle removing media
  const handleRemoveMedia = (indexToRemove) => {
    // Filter the files in the form state
      const newMedia = form.media.filter((_, index) => index !== indexToRemove);
      setForm(prev => ({ ...prev, media: newMedia }));
      // Revoke URL and filter the previews
      URL.revokeObjectURL(mediaPreviews[indexToRemove].url);
      setMediaPreviews(mediaPreviews.filter((_, index) => index !== indexToRemove));
  };

  const confirmSubmission = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in.");
        return;
      }

      //  Upload each file to Supabase Storage
      const mediaURLs = [];
      for (const file of form.media) {
        const fileName = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase
          .storage
          .from("missing-reports") // bucket name, remember to match and use different buckets for different report types
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase
          .storage
          .from("missing-reports")
          .getPublicUrl(fileName);

        mediaURLs.push(publicData.publicUrl);
      }

      //  Create GeoPoint
      //  Geocode location + county via OpenStreetMap
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

      const report = {
        age: Number(form.age),
        county: form.county,
        dateOfDisappearance: new Date(form.dateOfDisappearance),
        gender: form.gender,
        lastSeen: form.lastSeen,
        location: form.location,
        media: mediaURLs,
        missingPersonName: form.missingPersonName,
        reportId: form.reportId,
        reportedBy: user.uid,
        status: "Pending",
        submittedWhen: new Date(form.submittedWhen),
        createdAt: serverTimestamp(),
        isVerified: false,
        isSolved: false,
        isRejected: false,
        position,
        contact: form.contact 
      };

       // 3 Save to Firestore
      await addDoc(collection(db, "missingPersonsReports"), report);

      // Call parent callback if provided
      if (onReportSubmit) onReportSubmit(report);

      await addDoc(collection(db, "notifications"), {
        title: `Missing person ${form.missingPersonName}`,
        message: ` last seen: ${form.lastSeen}`,
        reportId: user.uid,
        media: mediaURLs,
        createdAt: serverTimestamp(),
        read: false,
        county: form.county,
        position
      });


      setShowConfirm(false);
      setStep(1);
      setForm({
        reportedBy: "",
        submittedWhen: new Date().toISOString().slice(0, 16),
        reportId: `RPT-${Date.now()}`,
        contact: "",
        location: "",
        county: "",
        missingPersonName: "",
        age: "",
        gender: "",
        lastSeen: "",
        dateOfDisappearance: "",
        media: [],
      });
      setPreviews([]);
      alert("Report submitted successfully!");
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  const progressPct = Math.round(((step - 1) / 2) * 100);

  if (checkingAuth) {
    return <div className="p-8 text-center">Checking authentication...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* header + progress */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create Missing Person Report</h1>
        <div className="mt-4">
          <div className="flex items-center gap-4">
            {/* Step indicators */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                {step > 1 ? <CheckCircleIcon className="w-5 h-5" /> : 1}
              </div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                {step > 2 ? <CheckCircleIcon className="w-5 h-5" /> : 2}
              </div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                3
              </div>
            </div>
            {/* progress bar */}
            <div className="flex-1">
              <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
                <div className="h-2 bg-blue-600" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <div className="text-sm text-gray-500">{progressPct}%</div>
          </div>
        </div>
      </div>

      {/* form card */}
      <form onSubmit={handleFinish} className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Step 1 */}
        {step === 1 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-medium">Reporter Details</h2>
            </div>
            <label className="block text-sm font-medium mb-1">Reported by</label>
            <input
              name="reportedBy"
              value={form.reportedBy}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mb-3"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Submitted when</label>
                <input
                  name="submittedWhen"
                  type="datetime-local"
                  value={form.submittedWhen}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Report ID</label>
                <input
                  name="reportId"
                  value={form.reportId}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  name="contact"
                  value={form.contact}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>
          </section>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <MapPinIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-medium">Location Details</h2>
            </div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mb-3"
              required
            />
            <label className="block text-sm font-medium mb-1">County Name</label>
            <input
              name="county"
              value={form.county}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </section>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <PhotoIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-medium">Missing Person Details</h2>
            </div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="missingPersonName"
              value={form.missingPersonName}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mb-3"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">Age</label>
                <input
                  name="age"
                  type="number"
                  min="0"
                  value={form.age}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Last seen</label>
                <p className="text-sm text-gray-500 mb-2">Describe clothes, appearance, location, phone number</p>
                <textarea
                  name="lastSeen"
                  rows="6"
                  value={form.lastSeen}
                  onChange={handleChange}
                  className="w-full h-16 border rounded px-3 py-2"
                  required
                />
              </div>
            </div>
            <label className="block text-sm font-medium mb-1">Date of Disappearance</label>
            <input
              name="dateOfDisappearance"
              type="date"
              value={form.dateOfDisappearance}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mb-3"
              required
            />
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
                  You can upload multiple files below 50MB (images or short videos).
                </p>
              </div>
              {/* previews */}
              {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {previews.map((p, i) => (
                    <div
                      key={i}
                      className="relative w-full h-24 bg-gray-100 rounded overflow-hidden flex items-center justify-center"
                    >
                      {form.media[i] && form.media[i].type.startsWith("image") ? (
                        <img src={p} alt={`preview-${i}`} className="object-cover w-full h-full" />
                      ) : (
                        <video src={p} className="object-cover w-full h-full" controls />
                      )}
                    
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(i)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold opacity-80 hover:opacity-100 transition-opacity"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* navigation controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded ${
              step === 1
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white border hover:bg-gray-50"
            }`}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded text-white ${
                (step === 1 && step1Valid) || (step === 2 && step2Valid)
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Next
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!step3Valid}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded text-white ${
                step3Valid ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Review & Submit
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Confirm Report Submission</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Reporter</h4>
                  <p><strong>Reported by:</strong> {form.reportedBy}</p>
                  <p><strong>Submitted when:</strong> {form.submittedWhen}</p>
                  <p><strong>Report ID:</strong> {form.reportId}</p>
                  <p><strong>Contact:</strong> {form.contact}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Location</h4>
                  <p><strong>Location:</strong> {form.location}</p>
                  <p><strong>County:</strong> {form.county}</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Missing Person</h4>
                  <p><strong>Name:</strong> {form.missingPersonName}</p>
                  <p><strong>Age:</strong> {form.age}</p>
                  <p><strong>Gender:</strong> {form.gender}</p>
                  <p><strong>Last seen:</strong> {form.lastSeen}</p>
                  <p><strong>Date of disappearance:</strong> {form.dateOfDisappearance}</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Media Preview</h4>
                  {previews.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {previews.map((p, i) => (
                        <div key={i} className="w-full h-28 bg-gray-100 rounded overflow-hidden">
                          {form.media[i] && form.media[i].type.startsWith("image") ? (
                            <img src={p} alt={`media-${i}`} className="object-cover w-full h-full" />
                          ) : (
                            <video src={p} className="object-cover w-full h-full" controls />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No media attached</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Edit
                </button>
                <button
                  onClick={confirmSubmission}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Confirm Submission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}