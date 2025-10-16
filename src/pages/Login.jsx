import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function Login() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    selectedType: "citizen",
    loginIdentifier: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { password, selectedType } = credentials;
    let loginIdentifier = credentials.loginIdentifier.trim();
    let email = loginIdentifier;
    let isNationalIdLogin = false;

    try {
      // ✅ Step 1: Check if the user logged in with National ID
      if (!loginIdentifier.includes("@")) {
        isNationalIdLogin = true;
        const nationalIdAsNumber = Number(loginIdentifier);

        if (isNaN(nationalIdAsNumber)) {
          alert("Invalid National ID format. Please enter only numbers.");
          return;
        }

        const collectionName = selectedType === "citizen" ? "users" : "adminusers";
        const q = query(
          collection(db, collectionName),
          where("nationalid", "==", nationalIdAsNumber)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          email = userData.email;
        } else {
          alert(`Login Failed: No ${selectedType} account found with that National ID.`);
          return;
        }
      }

      // ✅ Step 2: Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Step 3: Handle login type
      if (selectedType === "organization") {
        const q = query(collection(db, "adminusers"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();

          if (data.role === "Organization") {
            localStorage.setItem("role", "organization");
            navigate("/org/dashboard"); // ✅ Correct route for organizations
            return;
          } else if (data.role === "Administration") {
            localStorage.setItem("role", "admin");
            navigate("/admin/dashboard"); // ✅ Correct route for administrators
            return;
          }
        }

        alert("Access Denied. Organization or Admin account not found or role is incorrect.");
      }

      // ✅ Citizen login
      else if (selectedType === "citizen") {
        const citizenDocRef = doc(db, "users", user.uid);
        const citizenDocSnap = await getDoc(citizenDocRef);

        if (citizenDocSnap.exists()) {
          const data = citizenDocSnap.data();
          if (data.role === "citizen") {
            localStorage.setItem("role", "citizen");
            navigate("/");
            return;
          }
        }

        alert("Access Denied. Citizen account not found or role is incorrect.");
      }

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
            type="text"
            name="loginIdentifier"
            placeholder="Email Address or National ID"
            value={credentials.loginIdentifier}
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
          <select
            name="selectedType"
            value={credentials.selectedType}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="citizen">Citizen</option>
            <option value="organization">Organization</option>
          </select>

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
