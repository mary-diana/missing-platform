import React from "react";
import { Search, FileText, Users, Bell, ShieldCheck, Handshake } from "lucide-react";
import downloadImage from "../assets/download.jfif";
import myVideo from "../assets/video1.mp4";
import { useNavigate } from "react-router-dom";

import logo1 from "../assets/logo1.png";
import logo2 from "../assets/logo2.png";
import logo3 from "../assets/logo3.png";
import logo4 from "../assets/logo4.png";
import logo5 from "../assets/logo5.png";

const partnerLogos = [logo1, logo2, logo3, logo4, logo5];


export default function LandingPage() {

  const navigate = useNavigate();

  return (
    <div className="font-sans text-gray-800">
      {/* Hero Section */}
      <section className="px-6 py-10 flex flex-col items-center text-center">
        <div className="relative w-full max-w-6xl">
          <img
            src={downloadImage}
            alt="Hero"
            className="rounded-lg w-full max-h-[500px] object-cover"
          />
          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white px-5">
            <h1 className="text-4xl font-bold mb-3">Help Bring Them Home</h1>
            <p className="max-w-xl text-sm mb-6">
              Join our community dedicated to finding missing persons and report danger.
              Every search and every report brings us closer to reuniting families.
            </p>
            {/* Search Bar */}
            <div className="flex bg-white rounded-lg shadow overflow-hidden">
              <button 
                className="bg-yellow-400 hover:bg-yellow-500 transition px-6 py-2 font-semibold text-gray-800"
                onClick={() => navigate("/create-report")}
              >
                Report Missing Person
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How We Help */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-3">How We Help</h2>
        <p className="text-gray-600 mb-10">
          Our platform provides tools and resources to aid in the search for
          missing persons and connecting families with a supportive community.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6 hover:shadow-md transition bg-gray-100">
            <Search className="mb-4 text-gray-700" size={24} />
            <h3 className="font-bold mb-2">Search Missing Persons</h3>
            <p className="text-gray-600 text-sm">
              Access our extensive database of missing persons with detailed
              information 
            </p>
          </div>
          <div className="border rounded-lg p-6 hover:shadow-md transition bg-gray-100">
            <FileText className="mb-4 text-gray-700" size={24} />
            <h3 className="font-bold mb-2">Report a Missing Person</h3>
            <p className="text-gray-600 text-sm">
              Easily submit a missing person report with all necessary details,
              ensuring quick action.
            </p>
          </div>
          <div className="border rounded-lg p-6 hover:shadow-md transition bg-gray-100">
            <Users className="mb-4 text-gray-700" size={24} />
            <h3 className="font-bold mb-2">Community Support</h3>
            <p className="text-gray-600 text-sm">
              Connect with other families, volunteers and experts for support
              and guidance throughout the search.
            </p>
          </div>
        </div>
      </section>


      {/* Call to Action Split Layout */}
      <section className="px-6 py-12 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
        {/* Left - Text */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Take Immediate Action</h2>
          <p className="text-gray-600 mb-6">
            Help find missing persons or report a new case. Our platform provides a 
            comprehensive database, allowing you to search by name, county and other
            details. Report cases with ease, ensuring that critical information is captured
            accurately and efficiently.
          </p>
          <div className="flex gap-4">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
              onClick={() => navigate("/create-danger-report")}
            >
              Report Danger
            </button>

          </div>
        </div>

        {/* Right - Video */}
        <div className="flex-1">
          <div className="rounded-lg overflow-hidden shadow-lg">
            <iframe
              width="100%"
              height="300"
              src="https://www.youtube.com/embed/IM-rx-IC3zg"
              title="Awareness Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      <section className="px-6 py-10 flex flex-col items-center text-center">
        <div className="relative w-full max-w-6xl">
          <video
            src={myVideo}
            alt="Hero"
            className="rounded-lg w-full max-h-[500px] object-cover"
            loop
            autoPlay
            muted
            playsInline
            
          />
          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white px-4">
            <h1 className="text-4xl font-bold mb-3 text-yellow-400">Reach Out and Create Awareness</h1>
            <p className="max-w-xl text-sm mb-6">
              Share information about missing persons and any danger with us
            </p>
            
          </div>
        </div>
      </section>


      {/* Supported By Carousel */}
      <section className="px-6 py-12 bg-gray-50">
        <h2 className="text-2xl font-bold mb-6 text-center">Supported By</h2>
        <div className="flex space-x-8 overflow-x-auto max-w-6xl mx-auto pb-4">
          {partnerLogos.map((logo, i) => (
            <div
              key={i}
              className="flex-shrink-0 bg-white border rounded-lg p-6 w-48 h-28 flex items-center justify-center shadow "
            >
              <img src={logo} alt={`Partner Logo ${i + 1}`} className="max-h-16 object-contain" />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-6 px-6 text-sm text-gray-600">
        <div className="max-w-6xl mx-auto flex justify-between">
          <div className="flex space-x-6">
            
          </div>
          <span>©2025 Find Them. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
