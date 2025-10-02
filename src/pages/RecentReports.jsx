import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FaRegHeart,
  FaHeart,
  FaRegComment,
  FaShare,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";

import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  getDoc,
  query,
  addDoc,
  where,
  orderBy,
} from "firebase/firestore";

// --- tiny util: relative time
const formatRelativeTime = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
};

// --- tiny util: check if URL is a video
const isVideo = (url) => {
  if (!url || typeof url !== 'string') return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith(".mp4") || lowerUrl.endsWith(".mov") || lowerUrl.endsWith(".webm");
};

export default function RecentReports() {
  const db = getFirestore();
  const auth = getAuth();

  // feed + UI state
  const [posts, setPosts] = useState([]);
  const [openPost, setOpenPost] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [activeFilters, setActiveFilters] = useState([]);
  const [search, setSearch] = useState("");
  const [searchApplied, setSearchApplied] = useState(false);

  // New state to manage comments separately
  const [commentsByPost, setCommentsByPost] = useState({});
  const [loadingCommentsFor, setLoadingCommentsFor] = useState(null);


  // cache of userId -> full name and avatar
  const reporterNameCache = useRef(new Map());

  // categories (same as your sidebar)
  const categories = useMemo(
    () => [
      "Accident",
      "Assault",
      "Crime",
      "Natural Disaster",
      "Violence",
      "Missing Individuals",
      "Other",
    ],
    []
  );

  // ---- realtime listeners (danger + missing) ----
  useEffect(() => {
    const unsubscribers = [];

    // Fetches user name and avatar and caches the result
    const fetchUser = async (uid) => {
      if (!uid) return { fullName: "Anonymous", avatarUrl: "/avatars/default.png" };
      if (reporterNameCache.current.has(uid)) {
        return reporterNameCache.current.get(uid);
      }
      try {
        const uDoc = await getDoc(doc(db, "users", uid));
        const u = uDoc.exists() ? uDoc.data() : null;
        const fullName = (u && u.full_name) || "Anonymous";
        const avatarUrl = (u && u.profile_photo_url) || "/avatars/default.png";
        const userData = { fullName, avatarUrl };
        reporterNameCache.current.set(uid, userData);
        return userData;
      } catch (e) {
        console.error("Failed to fetch user:", e);
        return { fullName: "Anonymous", avatarUrl: "/avatars/default.png" };
      }
    };

    // DANGER REPORTS
    const q1 = query(collection(db, "dangerReports"));
    const unsub1 = onSnapshot(
      q1,
      async (snap) => {
        const items = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            const postId = `danger-${d.id}`;
            const { fullName, avatarUrl } = await fetchUser(data.reportedBy);

            // normalize
            return {
              id: postId,
              type: "danger",
              category: data.category || "Other",
              reporterName: fullName,
              avatar: avatarUrl,
              time: formatRelativeTime(
                data.createdAt?.toDate?.() || data.createdAt
              ),
              ts: data.createdAt?.toMillis?.() || new Date().getTime(),
              title: data.category || "Danger Report",
              text: data.description || "",
              location: data.location || "",
              county: data.county || "",
              images: Array.isArray(data.media) ? data.media : [],
              likes: 0,
              liked: false,
              isVerified: data.isVerified || false,
              isSolved: data.isSolved || false,
              isRejected: data.isRejected || false,
              comments: [], 
            };
          })
        );

        setPosts((prev) => {
          const others = prev.filter((p) => p.type !== "danger");
          const merged = [...others, ...items];
          return merged.sort((a, b) => b.ts - a.ts);
        });
      },
      (err) => console.error("dangerReports onSnapshot error:", err)
    );
    unsubscribers.push(unsub1);

    // MISSING PERSONS
    const q2 = query(collection(db, "missingPersonsReports"));
    const unsub2 = onSnapshot(
      q2,
      async (snap) => {
        const items = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            const postId = `missing-${d.id}`;
            const { fullName, avatarUrl } = await fetchUser(data.reportedBy);

            // normalize
            const submitted =
              data.submittedWhen?.toDate?.() || data.submittedWhen;
            return {
              id: postId,
              type: "missing",
              category: "Missing Individuals",
              reporterName: fullName,
              avatar: avatarUrl,
              time: formatRelativeTime(submitted),
              ts:
                data.submittedWhen?.toMillis?.() ||
                (submitted ? new Date(submitted).getTime() : Date.now()),
              title: data.missingPersonName || "Missing Person",
              text: data.lastSeen || "",
              location: data.location || "",
              county: data.county || "",
              personName: data.missingPersonName || "",
              images: Array.isArray(data.media) ? data.media : [],
              likes: 0,
              liked: false,
              isVerified: data.isVerified || false,
              isSolved: data.isSolved || false,
              isRejected: data.isRejected || false,
              comments: [], 
            };
          })
        );

        setPosts((prev) => {
          const others = prev.filter((p) => p.type !== "missing");
          const merged = [...others, ...items];
          return merged.sort((a, b) => b.ts - a.ts);
        });
      },
      (err) => console.error("missingPersonsReports onSnapshot error:", err)
    );
    unsubscribers.push(unsub2);

    return () => unsubscribers.forEach((u) => u && u());
  }, [db]);


  // --- NEW useEffect for real-time comments ---
  useEffect(() => {
    if (!openPost) return;

    const postId = openPost.id.split('-')[1];

    setLoadingCommentsFor(openPost.id);

    const q = query(
      collection(db, "comments"),
      where("report_id", "==", postId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list = await Promise.all(
        snapshot.docs.map(async (d) => {
          const commentData = d.data();
          const user = await getDoc(doc(db, "users", commentData.user_id));
          const userName = user.exists() ? user.data().full_name : "Anonymous";
          return {
            id: d.id,
            ...commentData,
            userName: userName,
          };
        })
      );
      setCommentsByPost((prev) => ({ ...prev, [openPost.id]: list }));
      setLoadingCommentsFor(null);
    });

    return () => unsubscribe();
  }, [openPost, db]);


  // Like toggle (local UI only)
  const toggleLike = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? Math.max(0, post.likes - 1) : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleShare = async (postId) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Check this out",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Post link copied to clipboard!");
      }
    } catch (err) {
      console.error("Sharing failed:", err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !openPost) return;

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to comment.");
      return;
    }

    const reportId = openPost.id.split('-')[1];

    try {
      //  Save comment to Firestore
      const commentData = {
        comment_text: newComment,
        report_id: reportId,
        user_id: user.uid,
        timestamp: new Date(),
      };
      await addDoc(collection(db, "comments"), commentData);

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment: ", error);
      alert("Failed to post comment.");
    }
  };

  const handleFilterChange = (category) => {
    setActiveFilters((prev) =>
      prev.includes(category)
        ? prev.filter((f) => f !== category)
        : [...prev, category]
    );
  };

  // --- filtering logic ---
  const filteredPosts = useMemo(() => {
    let list = posts;

    // category checkboxes (right sidebar)
    if (activeFilters.length > 0) {
      list = list.filter((p) => activeFilters.includes(p.category));
    }

    // search: only applies to missing reports' personName
    if (searchApplied && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.type === "missing" &&
            (
              (p.personName || "").toLowerCase().includes(q) ||
              (p.county || "").toLowerCase().includes(q)
            )
          ) ||
          (p.type === "danger" &&
            (p.county || "").toLowerCase().includes(q)
          )
      );
    }

    return list;
  }, [posts, activeFilters, search, searchApplied]);

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

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top search bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search missing persons by name or county"
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSearchApplied(true)}
              className="rounded-lg bg-blue-600 text-white px-4 py-2"
            >
              Search
            </button>
            <button
              onClick={() => {
                setSearch("");
                setSearchApplied(false);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 bg-white"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main feed */}
          <div className="lg:col-span-3">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <img
                    src={post.avatar}
                    alt={post.reporterName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {post.reporterName}
                      </span>
                      <span className="text-gray-500 text-sm">
                        • {post.time}
                      </span>
                      <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 text-gray-700 text-xs px-2 py-0.5">
                       {post.category}
                      </span>
                      {/* Display status of the report */}
                      {(post.isVerified || post.isSolved || post.isRejected) && (
                      <div className="relative group">
                        {post.isVerified && (
                          <span className="text-blue-500 text-lg">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          </span>
                        )}
                        {post.isSolved && (
                          <span className="text-green-500 text-lg">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                            </svg>
                          </span>
                        )}
                        {post.isRejected && (
                          <span className="text-red-500 text-lg">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                            </svg>
                          </span>
                        )}
                        <span className="absolute left-1/2 transform -translate-x-1/2 -top-full mt-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {post.isVerified ? 'Verified' : post.isSolved ? 'Solved' : 'Rejected'}
                        </span>
                      </div>
                    )}
                    
                    </div>
                    {/* title line: Missing name or category title */}
                    <div className="mt-1 text-gray-900 font-medium">
                      {post.type === "missing"
                        ? `Missing: ${post.title}`
                        : post.title}
                    </div>
                    {/* description */}
                    {post.text && (
                      <p className="mt-1 text-gray-700">
                        {post.text}
                      </p>
                    )}
                    
                    {/* Display location and county on a single line */}
                    {(post.location || post.county) && (
                      <p className="text-gray-500 text-sm mt-0.5">
                        {post.location && `📍 ${post.location}`}
                        {post.location && post.county && `, `}
                        {post.county && `${post.county} `}
                      </p>
                    )}
                  </div>
                </div>

                {/* Media (Instagram-style big) */}
                {post.images && post.images.length > 0 && (
                  <div className="mt-4">
                    {post.images.length === 1 && isVideo(post.images[0]) ? (
                      <div className="w-full rounded-lg overflow-hidden">
                        <MediaRenderer url={post.images[0]} className="w-full h-[480px] object-cover" />
                      </div>
                    ) : (
                      <div className={`grid gap-2 ${
                        post.images.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-2 md:grid-cols-3"
                      }`}>
                        {post.images.map((url, i) => (
                          <MediaRenderer
                            key={i}
                            url={url}
                            className="w-full h-[280px] md:h-[320px] object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}


                {/* Actions */}
                <div className="flex items-center gap-6 mt-4 text-gray-600">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className="flex items-center gap-2"
                  >
                    {post.liked ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaRegHeart />
                    )}
                    <span>{post.likes}</span>
                  </button>

                  <button
                    onClick={() => {
                      setOpenPost(post);
                      setActiveImage(0);
                    }}
                    className="flex items-center gap-2"
                  >
                    <FaRegComment />
                    <span>{commentsByPost[post.id]?.length || 0}</span>
                  </button>

                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-2"
                  >
                    <FaShare />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sticky right sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-semibold mb-3">Filter by</h3>
                <div className="space-y-2 mb-4">
                  {categories.map((item) => (
                    <label key={item} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={activeFilters.includes(item)}
                        onChange={() => handleFilterChange(item)}
                        className="accent-blue-600"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>

                <div className="flex flex-col space-y-3">
                  <Link
                    to="/analyse"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg text-center hover:bg-blue-700"
                  >
                    Analytics
                  </Link>
                  <Link
                    to="/map"
                    className="w-full bg-yellow-500 text-white py-2 rounded-lg text-center hover:bg-yellow-600"
                  >
                    Map
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal with carousel for comments/media  */}
      {openPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 lg:w-3/4 h-[86vh] flex overflow-hidden">
            {/* Left: Carousel */}
            <div className="w-1/2 bg-black flex items-center justify-center relative">
              {openPost.images.length > 1 && (
                <button
                  onClick={() =>
                    setActiveImage(
                      (prev) =>
                        (prev - 1 + openPost.images.length) %
                        openPost.images.length
                    )
                  }
                  className="absolute left-3 bg-white rounded-full p-2"
                >
                  <FaChevronLeft />
                </button>
              )}
              {/* This is the updated part for the modal's media */}
              {openPost.images[activeImage] && (
                <MediaRenderer
                  url={openPost.images[activeImage]}
                  className="max-h-full max-w-full object-contain"
                  isModal={true}
                />
              )}
              {openPost.images.length > 1 && (
                <button
                  onClick={() =>
                    setActiveImage(
                      (prev) => (prev + 1) % openPost.images.length
                    )
                  }
                  className="absolute right-3 bg-white rounded-full p-2"
                >
                  <FaChevronRight />
                </button>
              )}
            </div>

            {/* Right: Comments */}
            <div className="w-1/2 flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center border-b px-4 py-2">
                <div className="flex items-center gap-2">
                  <img
                    src={openPost.avatar}
                    alt={openPost.reporterName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="font-semibold">{openPost.reporterName}</div>
                </div>
                <button
                  onClick={() => setOpenPost(null)}
                  className="text-gray-500 hover:text-black"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Comments */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 text-sm">
                <div className="text-gray-900 font-medium">
                  {openPost.type === "missing"
                    ? `Missing: ${openPost.title}`
                    : openPost.title}
                </div>
                {openPost.text && (
                  <p className="text-gray-700">{openPost.text}</p>
                )}
                {openPost.location && (
                  <p className="text-gray-500 text-sm">📍 {openPost.location}</p>
                )}
                
                {/* --- Corrected Comments Rendering --- */}
                {commentsByPost[openPost.id] ? (
                  commentsByPost[openPost.id].length > 0 ? (
                    commentsByPost[openPost.id].map((c) => (
                      <div key={c.id}>
                        <span className="font-semibold">{c.userName || "Anonymous"}: </span>
                        {c.comment_text}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No comments yet.</p>
                  )
                ) : (
                  <p className="text-gray-500">Loading comments...</p>
                )}
                {/* ---------------------------------- */}
              </div>

              {/* Add Comment */}
              <div className="border-t p-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={handleAddComment}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}