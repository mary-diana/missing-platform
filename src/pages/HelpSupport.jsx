// src/pages/HelpSupport.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import volunteerImage from "../assets/volunteer.jpg";
import leadsImage from "../assets/leads.jpg";
import resourcesImage from "../assets/resources.jpg";


const HelpSupport = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Volunteer Sign-Up",
      description:
        "Join our team of volunteers and make a difference in the search for missing persons.",
      image: volunteerImage,
      route: "/volunteer",
    },
    {
      title: "Provide Leads",
      description:
        "Share information or leads that could help locate missing individuals.",
      image: leadsImage,
      route: "/provide-leads",
    },
    {
      title: "Resource Contribution",
      description:
        "Contribute resources, such as funding or expertise, to support our operations.",
      image: resourcesImage,
      route: "/resource-contribution",
    },
  ];

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold mb-2">Help and Support</h1>
      <p className="text-gray-600 mb-8">
        Choose how you would like to contribute to our mission.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.route)}
            className="cursor-pointer rounded-2xl shadow-md overflow-hidden hover:shadow-lg hover:scale-105 transition-transform bg-gray-50"
          >
            <img
              src={card.image}
              alt={card.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="text-lg font-semibold">{card.title}</h2>
              <p className="text-sm text-gray-600">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HelpSupport;
