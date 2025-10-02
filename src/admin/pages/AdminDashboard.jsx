import React, { useEffect, useState } from "react";
import { getFirestore, } from "firebase/firestore";
import downloadImage from "../../assets/download.jfif";

export default function AdminDashboard() {

  // Static org info 
  const [orgInfo] = useState({
    name: "Find Them",
    description: "Find Them is a centralized platform that brings together citizens, families and organizations to raise awareness about missing people and real-time dangers in communities. Our goal is to unify reporting and improve response through transparency and accessibility.",
  });

  return (
    <div className="min-h-screen font-sans bg-gray-100">
      {/* Landing Section */}
      <div
        className="relative h-[70vh] flex items-center justify-center text-center text-white"
        style={{
          backgroundImage: `url(${downloadImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        {/* Content */}
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
