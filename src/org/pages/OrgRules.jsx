import React, { useState } from "react";
import downloadImage from "../../assets/download.jfif";

export default function OrgRules() {
  // Static org info
  const [orgInfo] = useState({
    name: "Find Them",
    description:
      "Find Them is a centralized platform that brings together citizens, families and organizations to raise awareness about missing people and real-time dangers in communities. Our goal is to unify reporting and improve response through transparency and accessibility.",
  });

  // Optional: simple accordion toggle
  const [openIndex, setOpenIndex] = useState(null);
  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const adminRules = [
    {
      title: "1. General Administrative Rules",
      rules: [
        "Moderators must act impartially and avoid personal or political bias.",
        "All moderator actions (verify, delete, approve) must be logged in the system.",
        "Do not use moderator privileges for personal or financial gain.",
        "Reports must be reviewed for accuracy before approval or publication.",
      ],
    },
    {
      title: "2. Data Privacy and Confidentiality",
      rules: [
        "Protect all personal data and do not share it with unauthorized parties.",
        "Follow Kenya’s Data Protection Act (2019).",
        "Anonymize data before public analytics or reports.",
        "Secure all admin accounts with strong passwords",
        "Report any data breaches immediately to system administrators.",
      ],
    },
    {
      title: "3. Report Verification and Moderation",
      rules: [
        "Flag or remove false, duplicate or offensive reports.",
        "Keep resolved reports archived but not deleted.",
        "Communicate with reporters for additional information if needed.",
        "Do not share unverified reports publicly.",
        "Only moderators can approve,verify,reject and resolve reports for public viewing.",  
        "Users in the can only view and create reports but cannot verify,approve,reject or resolve them.",
        "Urgent reports (abductions,assaults and deaths) must be prioritized for review and action.",
      ],
    },
    {
      title: "4. User Management",
      rules: [
        "Suspend or ban users spreading false information.",
        "Role changes must be approved by a senior admin.",
        "Do not impersonate other users or maintain duplicate accounts.",
        "Review inactive or suspicious accounts regularly.",
      ],
    },
    {
      title: "5. Communication and Content Rules",
      rules: [
        "Keep all public communication professional and factual.",
        "Avoid political, discriminatory or defamatory language.",
        "Do not engage in arguments with users in public comments.",
      ],
    },
    {
      title: "6. Security and System Management",
      rules: [
        "Back up the database regularly and store backups securely.",
        "Access to sensitive data should be role-based.",
        "Ensure system logs are maintained for all major actions.",
        "All admin devices must be secured and updated regularly.",
      ],
    },
    {
      title: "7. Legal and Ethical Conduct",
      rules: [
        "Comply with Kenya’s laws including the Data Protection Act and Cybercrime Act.",
        "Do not discriminate by gender, ethnicity or religion.",
        "Cooperate with law enforcement under due legal process.",
        "Violations of any rule may lead to suspension or legal action.",
      ],
    },
  ];

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

      {/* Admin Rules Section */}
      <div className="max-w-5xl mx-auto py-12 px-6">
        <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center">
          🛡️ Admin Rules and Guidelines
        </h2>

        <div className="space-y-4">
          {adminRules.map((section, index) => (
            <div
              key={index}
              className="bg-white shadow rounded-lg border border-gray-200"
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full text-left px-6 py-4 flex justify-between items-center focus:outline-none"
              >
                <span className="font-medium text-lg text-gray-800">
                  {section.title}
                </span>
                <span className="text-gray-500 text-2xl">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>

              {openIndex === index && (
                <ul className="px-8 pb-6 list-disc space-y-2 text-gray-700 text-sm md:text-base">
                  {section.rules.map((rule, i) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-sm text-gray-600">
            Last Updated: October 2025 | Admins must review these rules
            regularly and confirm compliance before performing sensitive
            actions.
          </p>
          
        </div>
      </div>
    </div>
  );
}

