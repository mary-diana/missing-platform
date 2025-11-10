/// src/pages/Announcements.jsx
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
import { Send, Trash2 } from "lucide-react";

export default function OrgAnnouncements() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  const auth = getAuth();

  // Fetch announcements in real time
  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "asc"));
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

      const q = query(collection(db, "adminusers"), where("email", "==", user.email));
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
    if (!content.trim()) {
      alert("Please enter a message before sending.");
      return;
    }
    if (!currentAdmin) {
      alert("You must be an admin to publish announcements.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "announcements"), {
        title: title || "Announcement",
        content,
        createdAt: serverTimestamp(),
        authorName: currentAdmin.name,
        authorEmail: currentAdmin.email,
        authorRole: currentAdmin.orgrole,
      });
      setContent("");
      setTitle("");
    } catch (err) {
      console.error("Error publishing announcement:", err);
      alert("Failed to publish announcement.");
    }
    setLoading(false);
  };

  // Long-press delete
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this announcement?");
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
    } catch (err) {
      console.error("Error deleting announcement:", err);
    }
  };

  return (
    <div className="flex flex-col h-[90vh] bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white text-black flex justify-between items-center shadow">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <p className="text-sm opacity-80">
          {currentAdmin ? `Logged in as ${currentAdmin.name}` : "Not logged in"}
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
         <p className="text-slate-500 text-black">
          This section is only meant for communicating requests and reports.
          </p>
        {announcements.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">No announcements yet.</p>
        ) : (
          announcements.map((a) => {
            const isOwn = currentAdmin && currentAdmin.email === a.authorEmail;
            return (
              <div
                key={a.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  onMouseDown={(e) => {
                    const timeout = setTimeout(() => handleDelete(a.id), 1000);
                    e.target.dataset.timeout = timeout;
                  }}
                  onMouseUp={(e) => clearTimeout(e.target.dataset.timeout)}
                  onMouseLeave={(e) => clearTimeout(e.target.dataset.timeout)}
                  onTouchStart={(e) => {
                    const timeout = setTimeout(() => handleDelete(a.id), 1000);
                    e.target.dataset.timeout = timeout;
                  }}
                  onTouchEnd={(e) => clearTimeout(e.target.dataset.timeout)}
                  className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                    isOwn
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold">
                      {a.authorName || "Unknown"}
                    </span>
                    <span className="text-xs opacity-70">
                      {a.createdAt?.toDate
                        ? a.createdAt.toDate().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                  <p className="whitespace-pre-line">{a.content}</p>
                  <p className="text-xs opacity-70 mt-1">{a.authorRole}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-white p-3 flex items-center gap-3 shadow-sm">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePublish()}
          placeholder="Type an announcement..."
          className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring focus:ring-blue-200"
        />
        <button
          onClick={handlePublish}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow transition disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
