import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc , collection, query, where, getDocs} from "firebase/firestore";

export default function Login() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    selectedType: "citizen",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password, selectedType } = credentials;

    try {
        // Step 1: Authenticate the user with Firebase
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );
        const user = userCredential.user;

        if (selectedType === "organization") {
            // --- ORGANIZATION LOGIN ATTEMPT ---
            // Query the 'adminusers' collection for the user's email
            const q = query(collection(db, "adminusers"), where("email", "==", user.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Get the first document from the results
                const adminDocSnap = querySnapshot.docs[0];
                const data = adminDocSnap.data();

                // Check if the user document has the role of 'organization'
                if (data.role === "organization") {
                    localStorage.setItem("role", "organization");
                    navigate("/admin/dashboard");
                    return;
                }
            }

            // If no document is found or the role is incorrect
            alert("Access Denied. Organization account not found or role is incorrect.");
        } else { // selectedType === "citizen"
            // --- CITIZEN LOGIN ATTEMPT ---
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