import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { getFirestore, doc, setDoc ,addDoc, collection} from "firebase/firestore";

export default function Signup() {
  const [role, setRole] = useState("citizen"); // tabs state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    county: "",
    description: "",
    location: "",
    number: "",
    reason: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }


    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      const db = getFirestore();

      if (role === "organization") {
        await setDoc(doc(db, "org", user.uid), {
          name: formData.name,
          email: formData.email,
          role,
          county: formData.county,
          description: formData.description,
          location: formData.location,
          number: formData.number,
          reason: formData.reason,
          createdAt: new Date(),
        });
      } else {
        await setDoc(doc(db, "users", user.uid), {
          name: formData.name,
          email: formData.email,
          role,
          createdAt: new Date(),
        });
      }

      localStorage.setItem("role", role);
      navigate(role === "organization" ? "/admin/dashboard" : "/");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>

        {/* Tabs */}
        <div className="flex mb-6">
          <button
            type="button"
            onClick={() => setRole("citizen")}
            className={`flex-1 py-2 rounded-t-lg ${
              role === "citizen"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Citizen
          </button>
          <button
            type="button"
            onClick={() => setRole("organization")}
            className={`flex-1 py-2 rounded-t-lg ${
              role === "organization"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Organization
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common fields */}
          <input
            type="text"
            name="name"
            placeholder="Full Name/Organization Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />

          {/* Role-specific fields */}
          {role === "organization" && (
            <>
              <input
                type="text"
                name="county"
                placeholder="County"
                value={formData.county}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
              <textarea
                name="reason"
                placeholder="Reason for joining"
                value={formData.reason}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="tel"
                name="number"
                placeholder="Contact"
                value={formData.number}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Create Account
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
