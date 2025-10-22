// src/pages/Announcements.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  doc,
  orderBy,
  query,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth } from "firebase/auth";

export default function OrgAnnouncements() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  const auth = getAuth();

  // Fetch announcements in real time
  useEffect(() => {
    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAnnouncements(list);
    });

    return () => unsubscribe();
  }, []);

  // Get current admin user details
  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "adminusers"),
        where("email", "==", user.email)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setCurrentAdmin(userData); // name, role, email
      }
    };

    checkAdmin();
  }, [auth]);

  // Publish announcement
  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please enter both a title and content.");
      return;
    }
    if (!currentAdmin) {
      alert("You must be an admin to publish announcements.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "announcements"), {
        title,
        content,
        createdAt: serverTimestamp(),
        authorName: currentAdmin.name,
        authorEmail: currentAdmin.email,
        authorRole: currentAdmin.orgrole,
      });
      alert("Announcement published!");
      setTitle("");
      setContent("");
    } catch (err) {
      console.error("Error publishing announcement:", err);
      alert("Failed to publish announcement.");
    }
    setLoading(false);
  };

  // Delete announcement
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "announcements", id));
      alert("Announcement deleted!");
    } catch (err) {
      console.error("Error deleting announcement:", err);
      alert("Failed to delete announcement.");
    }
  };


  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-2">Announcements</h1>
      <p className="text-gray-500 mb-6">
        Create and manage site-wide announcements.
      </p>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Announcement Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter announcement title"
          className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
        />
      </div>

      {/* Content */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">Announcement Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Compose your announcement here"
          rows="4"
          className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
        ></textarea>
      </div>

      {/* Button */}
      <div className="flex justify-end mb-8">
        <button
          onClick={handlePublish}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish Announcement"}
        </button>
      </div>

      {/* List of Announcements */}
      <h2 className="text-xl font-semibold mb-4">All Announcements</h2>
      {announcements.length === 0 ? (
        <p className="text-gray-500">No announcements yet.</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((a) => (
  <li
    key={a.id}
    className="p-4 border rounded-lg shadow flex justify-between items-start select-none"
    onMouseDown={(e) => {
      e.preventDefault();
      const timeout = setTimeout(() => {
        handleDelete(a.id);
      }, 1000); // 1 second hold triggers delete
      e.target.dataset.timeout = timeout;
    }}
    onMouseUp={(e) => {
      clearTimeout(e.target.dataset.timeout);
    }}
    onMouseLeave={(e) => {
      clearTimeout(e.target.dataset.timeout);
    }}
    onTouchStart={(e) => {
      const timeout = setTimeout(() => {
        handleDelete(a.id);
      }, 1000);
      e.target.dataset.timeout = timeout;
    }}
    onTouchEnd={(e) => {
      clearTimeout(e.target.dataset.timeout);
    }}
  >
    <div>
      <h3 className="font-bold">{a.title}</h3>
      <p className="text-gray-700">{a.content}</p>
      <p className="text-sm text-gray-600 mt-1">
        Posted by <span className="font-semibold">{a.authorName}</span>{" "}
        ({a.authorRole})
      </p>
      {a.createdAt?.toDate && (
        <p className="text-xs text-gray-500">
          {a.createdAt.toDate().toLocaleString()}
        </p>
      )}
    </div>
  </li>
))}

        </ul>
      )}
    </div>
  );
}
