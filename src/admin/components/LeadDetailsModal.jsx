import React from "react";

// --- tiny util: check if URL is a video
const isVideo = (url) => {
  if (!url || typeof url !== 'string') return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith(".mp4") || lowerUrl.endsWith(".mov") || lowerUrl.endsWith(".webm");
};

// A component to render either a video or image based on URL
const MediaRenderer = ({ url, className, isModal = false }) => {
  if (isVideo(url)) {
    return (
      <video src={url} controls className={className}>
        Your browser does not support the video tag.
      </video>
    );
  }
  return (
    <img src={url} alt="Post" className={className} />
  );
};

export default function LeadDetailsModal({ lead, onClose }) {
  if (!lead) return null; 

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative p-6 w-11/12 md:w-1/2 lg:w-1/3 bg-white rounded-xl shadow-lg transform transition-all">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Lead Details</h2>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-semibold">Missing Person:</span> {lead.missingname || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Reporter:</span> {lead.name || "Anonymous"}
          </p>
          <p>
            <span className="font-semibold">Contact:</span> {lead.phone || "Anonymous"}
          </p>
          <p>
            <span className="font-semibold">Location:</span> {lead.location || "N/A"}
          </p>
          <p>
            <span className="font-semibold">County:</span> {lead.county || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Date & Time:</span> {lead.createdWhen?.toDate().toLocaleString() || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Description:</span> {lead.description || "No details"}
          </p>
        </div>
        {lead.media && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Attached Media</h3>
            <MediaRenderer url={lead.media || 'No media'} className="w-full h-auto rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
}