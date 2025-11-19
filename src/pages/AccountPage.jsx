import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';



// --- tiny util: check if URL is a video
const isVideo = (url) => {
  if (!url || typeof url !== 'string') return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith(".mp4") || lowerUrl.endsWith(".mov") || lowerUrl.endsWith(".webm");
};

// Helper function to merge and sort posts
const mergeAndSortPosts = (arr) =>
  arr.slice().sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? 0;
    const tb = b.createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    location: null,
    county: "",
    profile_photo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const LONG_PRESS_DURATION = 800;
  
  // State for Your Posts tab
  const [posts, setPosts] = useState([]);
  const [expandedPostIds, setExpandedPostIds] = useState(new Set());
  const [commentsByPost, setCommentsByPost] = useState({});
  const [loadingCommentsFor, setLoadingCommentsFor] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);

  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        navigate("/login");
        return;
      }
      const myUid = firebaseUser.uid;

      try {
        const userDocRef = doc(db, "users", myUid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setProfile({
            ...userData,
            email: firebaseUser.email,
          });

          if (userData.county) {
            const notifQ = query(
              collection(db, "notifications"),
              where("county", "==", userData.county),
              
            );
            onSnapshot(notifQ, (snap) => {
              const list = snap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .sort((a, b) => {
                  const ta = a.createdAt?.toMillis?.() ?? 0;
                  const tb = b.createdAt?.toMillis?.() ?? 0;
                  return tb - ta;
                });
              setNotifications(list);
            });
          }
        } else {
          await setDoc(userDocRef, {
            user_id: myUid,
            email: firebaseUser.email,
            full_name: "",
            phone_number: "",
            location: null,
            county: "",
            profile_photo_url: "",
            createdAt: new Date(),
            last_login: new Date(),
            role: "",
          });
          setProfile((prev) => ({ ...prev, email: firebaseUser.email }));
        }

        // --- Post-related subscriptions ---
        const unsubDanger = onSnapshot(
          query(collection(db, "dangerReports"), where("reportedBy", "==", myUid)),
          (snap) => {
            setPosts((prev) => {
              const others = prev.filter((p) => p.collection !== "dangerReports");
              const mine = snap.docs.map((d) => ({
                id: d.id,
                collection: "dangerReports",
                ...d.data(),
                isVerified: d.data().isVerified || false,
                isSolved: d.data().isSolved || false,
                isRejected: d.data().isRejected || false,
              }));
              return mergeAndSortPosts([...others, ...mine]);
            });
          }
        );

        const unsubMissing = onSnapshot(
          query(
            collection(db, "missingPersonsReports"),
            where("reportedBy", "==", myUid)
          ),
          (snap) => {
            setPosts((prev) => {
              const others = prev.filter(
                (p) => p.collection !== "missingPersonsReports"
              );
              const mine = snap.docs.map((d) => ({
                id: d.id,
                collection: "missingPersonsReports",
                ...d.data(),
                isVerified: d.data().isVerified || false,
                isSolved: d.data().isSolved || false,
                isRejected: d.data().isRejected || false,
              }));
              return mergeAndSortPosts([...others, ...mine]);
            });
          }
        );

        setLoading(false);

        return () => {
          unsubscribeAuth();
          unsubDanger();
          unsubMissing();
        };

      } catch (err) {
        console.error("Error loading account or posts:", err);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth, navigate]);

  // Rest of the functions (handleChange, handleSave, handleLogout, handleProfilePicUpload, handlePasswordReset)
  // ... (unchanged)
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        location: profile.location,
        county: profile.county,
        profile_photo_url: profile.profile_photo_url,
        last_login: new Date(),
      });
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Error updating profile: " + err.message);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const user = auth.currentUser;
    const fileName = `${user.uid}-${Date.now()}.${file.name.split(".").pop()}`;

    const { error: uploadError } = await supabase.storage
      .from("profile_pictures")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      alert("Error uploading image: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("profile_pictures")
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    setProfile((prev) => ({ ...prev, profile_photo_url: publicUrl }));

    await updateDoc(doc(db, "users", user.uid), {
      profile_photo_url: publicUrl,
    });

    setUploading(false);
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, profile.email);
      alert("Password reset email sent!");
    } catch (err) {
      alert("Error sending reset email: " + err.message);
    }
  };
  
  // ===== Notifications actions (unchanged) =====
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const handleNotificationClick = async (notifId) => {
    try {
      await updateDoc(doc(db, "notifications", notifId), { read: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleDeleteNotification = async (notifId, notifTitle) => {
    if (
      window.confirm(`Are you sure you want to delete the notification: "${notifTitle}"?`)
    ) {
      try {
        await deleteDoc(doc(db, "notifications", notifId));
      } catch (err) {
        console.error("Error deleting notification:", err);
        alert("Failed to delete notification.");
      }
    }
  };

  const handleLongPressStart = (notif) => {
    if (longPressTimer) clearTimeout(longPressTimer);
    const timer = setTimeout(() => {
      handleDeleteNotification(notif.id, notif.title || "notification");
    }, LONG_PRESS_DURATION);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) clearTimeout(longPressTimer);
    setLongPressTimer(null);
  };
  
  // --- Post-related functions  ---
  const toggleComments = async (post) => {
    const isOpen = expandedPostIds.has(post.id);
    const next = new Set(expandedPostIds);
    if (isOpen) {
      next.delete(post.id);
      setExpandedPostIds(next);
      return;
    }
    setExpandedPostIds(next.add(post.id));
    if (!commentsByPost[post.id]) {
      try {
        setLoadingCommentsFor(post.id);
        const q = query(
          collection(db, "comments"),
          where("report_id", "==", post.id)
        );
        const snap = await getDocs(q);
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.timestamp?.toMillis?.() ?? 0;
            const tb = b.timestamp?.toMillis?.() ?? 0;
            return ta - tb;
          });
        setCommentsByPost((prev) => ({ ...prev, [post.id]: list }));
      } finally {
        setLoadingCommentsFor(null);
      }
    }
  };

  const deletePostWithComments = async (post) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this post? "
      )
    ) {
      return;
    }
    try {
      setDeletingPostId(post.id);
      const commentsQ = query(
        collection(db, "comments"),
        where("report_id", "==", post.id)
      );
      const commentsSnap = await getDocs(commentsQ);
      const batch = writeBatch(db);
      commentsSnap.docs.forEach((c) => batch.delete(c.ref));
      batch.delete(doc(db, post.collection, post.id));
      await batch.commit();
      setCommentsByPost((prev) => {
        const next = { ...prev };
        delete next[post.id];
        return next;
      });
      setExpandedPostIds((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post.");
    } finally {
      setDeletingPostId(null);
    }
  };

  // A component to render either a video or image based on URL
  const MediaRenderer = ({ url, className, isModal = false }) => {
    if (isVideo(url)) {
      return (
        <video src={url} controls className={className}>
          Your browser does not support the video tag.
        </video>
      );
    }
    return (
      <img src={url} alt="Post" className={className} />
    );
  };

  if (loading) return <div className="text-center mt-10 ">Loading...</div>;
  

  return (
    <div className="max-w-6xl mx-auto p-6 flex space-x-8">
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-6">Account</h1>
        <div className="flex items-center space-x-4 mb-6">
          <label className="cursor-pointer">
            <img
              src={profile.profile_photo_url || "https://via.placeholder.com/100"}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border"
            />
            {editMode && (
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePicUpload}
              />
            )}
          </label>
          <div>
            <h2 className="text-lg font-semibold">{profile.full_name || "No Name"}</h2>
            <p className="text-gray-600">{profile.county || "No county set"}</p>
          </div>
        </div>

        <div className="border-b flex space-x-6 mb-4">
          {["profile", "notifications", "your-posts", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 relative ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              {tab.replace("-", " ").split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              {tab === "notifications" && unreadCount > 0 && (
                <span className="absolute -top-2 -right-3 inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center text-xs font-bold text-white bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {["full_name", "phone_number", "location", "county"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium capitalize mb-1">
                  {field.replace("_", " ")}
                </label>
                <input
                  type="text"
                  name={field}
                  value={profile[field] || ""}
                  onChange={handleChange}
                  disabled={!editMode}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            ))}
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                {uploading ? "Uploading..." : "Save Changes"}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 mt-2"
            >
              Logout
            </button>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Notifications</h3>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-gray-500">No notifications yet.</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onMouseDown={() => handleLongPressStart(notif)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(notif)}
                    onTouchEnd={handleLongPressEnd}
                    onTouchCancel={handleLongPressEnd}
                    onClick={() => handleNotificationClick(notif.id)}
                    className={`flex items-start justify-betweenspace-x-3 p-3 rounded-lg cursor-pointer ${
                      notif.read ? "bg-gray-100" : "bg-yellow-100"
                    }`}
                  >
                    <span className="text-gray-500">🔔</span>
                    <div className="flex flex-col flex-1">
                      <p className="font-medium">{notif.title || "Notification"}</p>
                      <p className="text-sm text-gray-600">{notif.message}</p>
                      {/* Display media if available */}
                      {notif.media && notif.media.length > 0 && (
                        <div className="flex gap-3 mt-3">
                          {notif.media.map((url, idx) => (
                            <MediaRenderer
                              key={idx}
                              url={url}
                              alt={`Notification media ${idx + 1}`}
                              className={`object-cover rounded h-60 ${notif.media.length === 1 ? "w-full" : "w-1/2"}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-400 ml-4 self-start ">
                      {notif.createdAt?.toDate
                        ? notif.createdAt.toDate().toLocaleString()
                        : ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Your Posts Tab */}
        {activeTab === "your-posts" && (
          <div>
            <h3 className="text-lg font-semibold mb-6">Your Posts</h3>
            {posts.length === 0 ? (
              <p className="text-gray-500">You haven’t created any posts yet.</p>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => {
                  const created = post.createdAt?.toDate
                    ? post.createdAt.toDate().toLocaleString()
                    : "";
                  const typeLabel =
                    post.collection === "dangerReports"
                      ? "Danger Alert"
                      : "Missing Person";
                  const isExpanded = expandedPostIds.has(post.id);
                  const comments = commentsByPost[post.id] || [];

                  let title, description;
                  if (post.collection === "missingPersonsReports") {
                    title = post.missingPersonName || "(Unnamed)";
                    description = post.lastSeen || "(No last seen info)";
                  } else {
                    title = post.title || post.category || "(No title)";
                    description = post.description || "(No description)";
                  }

                  return (
                    <div
                      key={`${post.collection}-${post.id}`}
                      className="border rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex-1">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200">
                                {typeLabel}
                              </span>
                              <span className="text-xs text-gray-500">{created}</span>
                              {/* Status Icons and Tooltips */}
                              {post.isVerified && (
                                <span
                                  className="text-blue-500 ml-1"
                                  title="Verified"
                                >
                                  <FaCheckCircle />
                                </span>
                              )}
                              {post.isSolved && (
                                <span
                                  className="text-green-500 ml-1"
                                  title="Solved"
                                >
                                  <FaCheckCircle />
                                </span>
                              )}
                              {post.isRejected && (
                                <span className="text-red-500 ml-1" title="Rejected">
                                  <FaTimesCircle />
                                </span>
                              )}
                            </div>
                            <button
                              disabled={deletingPostId === post.id}
                              onClick={() => deletePostWithComments(post)}
                              className={`text-red-600 hover:text-red-700 text-sm ${
                                deletingPostId === post.id
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              title="Delete post"
                            >
                              {deletingPostId === post.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>

                          <h4 className="font-semibold mt-1">{title}</h4>
                          <p className="text-sm text-gray-700 mt-1">{description}</p>

                          {/* Move image here, below description */}
                          {post.media?.length > 0 && (
                            <div className="flex gap-3 mt-3">
                              {post.media.map((url, idx) => (
                                <MediaRenderer
                                  key={idx}
                                  url={url}
                                  className={`object-cover rounded h-80 ${post.media.length === 1 ? "w-full" : "w-1/2"}`}
                                />
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => toggleComments(post)}
                            className="mt-3 text-blue-600 hover:underline text-sm"
                          >
                            {isExpanded ? "Hide Comments" : "View Comments"}
                          </button>
                          {isExpanded && (
                            <div className="mt-3 space-y-2 border-t pt-3 pl-1">
                              {loadingCommentsFor === post.id ? (
                                <p className="text-sm text-gray-500">
                                  Loading comments…
                                </p>
                              ) : comments.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                  No comments yet.
                                </p>
                              ) : (
                                comments.map((c) => (
                                  <div key={c.id} className="flex items-start gap-2">
                                    <div className="text-gray-500"></div>
                                    <div>
                                      <div className="text-sm">{c.comment_text}</div>
                                      <div className="text-xs text-gray-400">
                                        {c.timestamp?.toDate
                                          ? c.timestamp.toDate().toLocaleString()
                                          : ""}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Settings</h3>
            <p className="text-sm text-gray-600">Manage your account preferences</p>
            <button
              onClick={handlePasswordReset}
              className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
            >
              Reset Password
            </button>
          </div>
        )}
      </div>

      <div className="w-64 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Tips</h3>
        <p className="text-sm text-blue-600">
          Stay informed about missing persons in your county by enabling alerts. Notifications
          will appear here automatically.
        </p>
        
        <p className="text-sm text-black mt-4">
          Reminder: If your posts are rejected, we request to delete it immediately. Failure to
          comply may result to deletion of the post without prior notice or permission.
        </p>

        <p className="text-sm text-black mt-4">
        Only report missing persons or dangers at the navigaation bar above. Do not create posts here.If you wish 
        to support,volunteer or provide leads click on the support section. Only logged in users can create reports.
        </p>

        <p className="text-sm text-black mt-4">
        If you wish to access the analytics dashboard, click on the reports tab in the navigation bar above.Choose either
        the map or analytics button.
        </p>
      </div>
    </div>
  );
}