import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase"; // Assuming `db` is your Firestore instance
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        // Step 1: Authenticate the user with Firebase
        const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
        );
        const user = userCredential.user;

        // Step 2: Attempt to find the user in the 'adminusers' collection first
        const adminDocRef = doc(db, "adminusers", user.uid);
        const adminDocSnap = await getDoc(adminDocRef);

        let userRole = null; // Initialize role as null

        if (adminDocSnap.exists()) {
            userRole = adminDocSnap.data().role;
            // Now, redirect based on the role found in adminusers
            if (["Administrator", "Moderator"].includes(userRole)) {
                localStorage.setItem("role", "organization");
                navigate("/admin/dashboard");
                return; // Exit the function to prevent further checks
            }
        }

        // Step 3: If not found in 'adminusers', check the 'users' collection
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            userRole = userDocSnap.data().role;
            // Now, redirect based on the role found in users
            if (userRole === "Citizen") { // Assuming 'Citizen' is the role for regular users
                localStorage.setItem("role", "citizen");
                navigate("/");
                return;
            }
        }

        // If no role is found in either collection, or it's an unrecognized role,
        // you might want to handle this case (e.g., redirect to a restricted page).
        alert("Your account role could not be determined. Please contact support.");
        navigate("/login"); // Redirect back to login or an error page

    } catch (error) {
        alert(error.message);
    }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={credentials.email}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>
        <p className="text-sm text-center mt-4">
          Don’t have an account?{" "}
          <a href="/signup" className="text-blue-600">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}
