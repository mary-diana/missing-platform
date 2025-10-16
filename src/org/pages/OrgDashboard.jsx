// src/pages/OrgDashboard.jsx
import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import downloadImage from "../../assets/download.jfif";

export default function OrgDashboard() {
  const db = getFirestore();
  const auth = getAuth();

  const [orgInfo] = useState({
    name: "Find Them",
    description:
      "Find Them is a centralized platform that brings together citizens, families and organizations to raise awareness about missing people and real-time dangers in communities. Our goal is to unify reporting and improve response through transparency and accessibility.",
  });

  // Data protection modal state
  const [showModal, setShowModal] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [termsVersion] = useState("1.0"); // 🔹 version control for legal updates

  useEffect(() => {
     const fetchAcceptance = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDocRef = doc(db, "adminusers", user.uid);
      const userDoc = await getDoc(userDocRef);

      const data = userDoc.exists() ? userDoc.data() : {};
      if (!data.acceptedTerms || data.termsVersion !== termsVersion) {
        setShowModal(true);
      } else {
        setAccepted(true);
      }
    } catch (err) {
      console.error("Error checking acceptance:", err);
    }
  };

  fetchAcceptance();
}, [auth, db, termsVersion]);

const handleAccept = async () => {
    const user = auth.currentUser;
    if (!user) {
        console.error("User not authenticated.");
        return;
    }

    try {
        // 🔑 KEY: This structure GUARANTEES the document ID is 'user.uid'.
        // It updates the existing document or creates it if it doesn't exist (upsert).
        await setDoc(
            doc(db, "adminusers", user.uid),
            {
                acceptedTerms: true,
                acceptedAt: new Date(),
                termsVersion: termsVersion,
            },
            { merge: true } // { merge: true } is essential to keep other user fields
        );

        setAccepted(true);
        setShowModal(false);
        console.log(`Terms accepted and saved to adminusers/${user.uid}`);
    } catch (err) {
        console.error("Error updating acceptance:", err);
    }
};


  return (
    <div className="min-h-screen font-sans bg-gray-100 relative">
      {/* Data Protection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-8 relative">
            <h2 className="text-2xl font-bold text-center text-blue-700 mb-4">
              Data Protection & Confidentiality Terms (v{termsVersion})
            </h2>

            <p className="text-gray-700 mb-4 text-sm leading-relaxed">
              As a registered <strong>Organization</strong> on the Find Them platform,
              you are granted access to reports involving missing individuals and real-time
              danger alerts. By continuing, you agree to:
            </p>

            <ul className="list-disc pl-6 text-gray-700 text-sm space-y-2 mb-4">
              <li>Handle all data in compliance with privacy and data protection laws.</li>
              <li>
                Access only reports assigned to your organization and avoid sharing
                information externally without authorization.
              </li>
              <li>
                Use collected data solely for assisting investigations or providing verified support.
              </li>
              <li>
                Maintain confidentiality for all personal and sensitive information encountered.
              </li>
              <li>
                Report any unauthorized access or misuse of data to the system administrator immediately.
              </li>
            </ul>

            <p className="text-gray-600 text-sm mb-6">
              Failure to comply with these terms may result in restricted access, suspension,
              or legal consequences under applicable data protection regulations.
            </p>

            {/* 🔹 Legal compliance footer */}
            <div className="text-xs text-gray-500 italic mb-6">
              In compliance with the <strong>Kenya Data Protection Act (2019)</strong>, all
              organizations must handle personal data responsibly and maintain strict
              confidentiality.
            </div>

            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="accept"
                checked={accepted}
                onChange={() => setAccepted(!accepted)}
                className="mr-2"
              />
              <label htmlFor="accept" className="text-sm text-gray-700">
                I have read and agree to the Data Protection & Confidentiality Terms.
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => window.location.replace("/login")}
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                disabled={!accepted}
                className={`px-4 py-2 rounded text-sm font-medium text-white ${
                  accepted
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Accept & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Landing Section */}
      <div
        className="relative h-[70vh] flex items-center justify-center text-center text-white"
        style={{
          backgroundImage: `url(${downloadImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        <div className="relative z-10 max-w-3xl px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-yellow-300">
            {orgInfo.name}
          </h1>
          <p className="mt-2 text-sm md:text-base">{orgInfo.description}</p>
        </div>
      </div>
    </div>
  );
}
