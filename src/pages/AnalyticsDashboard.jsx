import React, { useMemo, useState,useEffect } from "react";
import {
LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";


// --- Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const getReportDate = (report) => {
  // Check for Firebase Timestamp (from .data())
  if (report.createdAt && typeof report.createdAt.toDate === 'function') {
    return report.createdAt.toDate();
  }
  // Standard string, ISO, or Date object
  return new Date(report.createdAt);
};

const groupReportsByGranularity = (reports, granularity) => {
    if (!reports || reports.length === 0) return [];

    const groupedReports = new Map();

    for (const report of reports) {
        const date = getReportDate(report);
        if (isNaN(date.getTime())) continue; // Skip invalid dates

        let key; // Unique key for the time period
        let label; // Display label

        switch (granularity) {
            case 'daily':
                key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                break;
            case 'weekly':
                // Approximation for a week number
                const weekNum = Math.ceil(date.getDate() / 7);
                key = `${date.getFullYear()}-${date.getMonth()}-Week${weekNum}`;
                label = `Week ${weekNum}`;
                break;
            case 'monthly':
                key = `${date.getFullYear()}-${date.getMonth()}`;
                label = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
                break;
            default:
                continue;
        }

        if (groupedReports.has(key)) {
            groupedReports.get(key).total += 1;
        } else {
            groupedReports.set(key, { label, total: 1 });
        }
    }

    // Convert Map to sorted array
    // ✅ Properly sort by real Date instead of string
    const sorted = Array.from(groupedReports.entries())
      .map(([key, value]) => {
        const parts = key.split("-");
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parts[2] && !parts[2].includes("Week") ? parseInt(parts[2]) : 1; // handle daily/weekly
        const date = new Date(year, month, day);
        return { key, date, ...value };
      })
      .sort((a, b) => a.date - b.date);

    return sorted.map(({ label, total }) => ({ label, total }));
};


export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [timeGranularity, setTimeGranularity] = useState("weekly");
  const [selectedCategory, setSelectedCategory] = useState("Accidents");
  const db = getFirestore();
  const [missingPersonsReports, setMissingPersonsReports] = useState([]);
  const [dangerReports, setDangerReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const missingSnap = await getDocs(collection(db, "missingPersonsReports"));
        const dangerSnap = await getDocs(collection(db, "dangerReports"));

        setMissingPersonsReports(
          missingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setDangerReports(
          dangerSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );

        setLoading(false);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Overall stats
  const overall = useMemo(() => ({
  missing: missingPersonsReports.length,
  danger: dangerReports.length,
  total: missingPersonsReports.length + dangerReports.length,
  }), [missingPersonsReports, dangerReports]);


  // Incident frequency (demo)
  const series = useMemo(() => {
    // 1. Combine all reports into a single array
    const allReports = [
        ...missingPersonsReports,
        ...dangerReports
    ];

    // 2. Generate series data by grouping the combined reports
    const daily = groupReportsByGranularity(allReports, 'daily');
    const weekly = groupReportsByGranularity(allReports, 'weekly');
    const monthly = groupReportsByGranularity(allReports, 'monthly');

    // 3. Return the calculated data
    return { daily, weekly, monthly };
}, [missingPersonsReports, dangerReports]);


  // Category breakdown 
  const categoryMoM = useMemo(() => {
  // --- 1. Define Current and Previous Month Boundaries ---
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  let previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  //  FIX 1: Robust Helper for Date Parsing
  const getReportDate = (report) => {
    // Handle Firebase/Firestore Timestamp: needs .toDate()
    if (report.createdAt && typeof report.createdAt.toDate === 'function') {
      return report.createdAt.toDate();
    }
    // Handle standard string, ISO, or Date object
    return new Date(report.createdAt);
  };

  // Function to check if a report belongs to the current month
  const isCurrentMonth = (report) => {
    // Safely parse the date using the helper
    const reportDate = getReportDate(report);
    // Check for "Invalid Date"
    if (isNaN(reportDate)) return false; 
    
    return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
  };

  // Function to check if a report belongs to the previous month
  const isPreviousMonth = (report) => {
    // Safely parse the date using the helper
    const reportDate = getReportDate(report);
    // Check for "Invalid Date"
    if (isNaN(reportDate)) return false; 
    
    return reportDate.getMonth() === previousMonth && reportDate.getFullYear() === previousYear;
  };

  // --- 2. Filter and Count Danger Reports ---

  const currentDangerCounts = dangerReports
    .filter(isCurrentMonth)
    .reduce((acc, report) => {
      // Ensure the category field is present (handles missing data)
      const category = report.category || "Uncategorized"; 
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

  const previousDangerCounts = dangerReports
    .filter(isPreviousMonth)
    .reduce((acc, report) => {
      const category = report.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

  // --- 3. Handle Missing Persons Reports ---
  const currentMissingCount = missingPersonsReports.filter(isCurrentMonth).length;
  const previousMissingCount = missingPersonsReports.filter(isPreviousMonth).length;

  // --- 4. Combine and Calculate MoM Data ---
  const allDangerCategories = new Set([
    ...Object.keys(currentDangerCounts),
    ...Object.keys(previousDangerCounts),
  ]);

  const dangerData = Array.from(allDangerCategories).map(category => ({
    category,
    current: currentDangerCounts[category] || 0,
    previous: previousDangerCounts[category] || 0,
  }));
  
  const data = [
    // Missing Persons Category
    { 
      category: "Missing Persons", 
      current: currentMissingCount, 
      previous: previousMissingCount 
    },
    // All Danger Report Categories
    ...dangerData,
  ];

  // --- 5. Calculate Change Percentage ---
  return data.map((c) => {
    let changePct;
    if (c.previous === 0) {
      // New category (or category that was 0)
      changePct = c.current > 0 ? 100 : 0; 
    } else {
      changePct = Math.round(((c.current - c.previous) / c.previous) * 100);
    }
    
    return {
      ...c,
      changePct,
    };
  });
}, [dangerReports, missingPersonsReports]); // Dependencies remain the same


// Geospatial trends AND Hotspots by category
const hotspotsByCategory = useMemo(() => {
  const categories = {};

  // From danger reports
  dangerReports.forEach((r) => {
    const cat = r.category || "Uncategorized";
    if (!categories[cat]) categories[cat] = [];

    if (r.position) {
      categories[cat].push({
        name: r.location || "Unknown",
        lat: r.position.latitude || r.position._lat,
        lng: r.position.longitude || r.position._long,
        count: 1,
      });
    }
  });
  // Combine multiple reports in same location
  Object.keys(categories).forEach((cat) => {
    const grouped = {};
    categories[cat].forEach((p) => {
      const key = `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`;
      if (!grouped[key]) grouped[key] = { ...p, count: 0 };
      grouped[key].count += 1;
    });
    categories[cat] = Object.values(grouped);
  });
  // Missing persons category
  categories["Missing Persons"] = missingPersonsReports
    .filter((r) => r.position)
    .map((r) => ({
      name: r.location || r.county || "Unknown",
      lat: r.position.latitude || r.position._lat,
      lng: r.position.longitude || r.position._long,
      count: 1,
    }));

  return categories;
}, [dangerReports, missingPersonsReports]);


  const colorsByCategory = {
    Accident: "#ef4444",
    Assaults: "#ef4444",
    Crime: "#ef4444",
    Violence: "#ef4444",
    "Natural Disaster": "#ef4444",
    "Missing Persons": "#ef4444",
    Other: "#ef4444",
    Assault: "#ef4444",
  };

  const currentHotspots = hotspotsByCategory[selectedCategory] || [];
  const top5 = [...currentHotspots].sort((a, b) => b.count - a.count).slice(0, 5);

  const radiusFor = (count) => Math.max(8, Math.min(36, (count / 30) * 36));

  const granularityOptions = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];


  if (loading) {
  return (
    <div className="flex justify-center items-center h-screen">
      <p>Loading analytics...</p>
    </div>
  );
}

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/*  Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-yellow-300 text-gray-700 rounded-lg hover:bg-gray-300"
      >
        ← Back
      </button>

      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Analyze trends and patterns in reported incidents to enhance safety measures.
        </p>
      </header>

      {/* Overall Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Reports" value={overall.total} />
        <StatCard title="Missing Persons" value={overall.missing} />
        <StatCard title="Danger Events" value={overall.danger} />
      </section>

      {/* Incident Frequency */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Incident Frequency Over Time</h2>
          <div className="flex gap-2">
            {granularityOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTimeGranularity(opt.key)}
                className={`px-3 py-1.5 rounded-lg border text-sm ${
                  timeGranularity === opt.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series[timeGranularity]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Category Breakdown */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Category Breakdown</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-4 mb-4">
            {categoryMoM.map((c) => (
              <div key={c.category} className="min-w-[180px]">
                <div className="text-xs text-slate-500">MoM Change</div>
                <div
                  className={`text-lg font-semibold ${
                    c.changePct >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {c.changePct >= 0 ? "+" : ""}
                  {c.changePct}%
                </div>
                <div className="text-sm text-slate-600">{c.category}</div>
              </div>
            ))}
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryMoM}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="previous" name="Previous Month" fill="#c7d2fe" radius={[6, 6, 0, 0]} />
                <Bar dataKey="current" name="Current Month" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Geospatial Trends */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Geospatial Trends</h2>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            {Object.keys(hotspotsByCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="h-[420px] w-full rounded-xl overflow-hidden">
            <MapContainer center={[-1.2921, 36.8219]} zoom={6} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {currentHotspots.map((h) => (
                <CircleMarker
                  key={h.name}
                  center={[h.lat, h.lng]}
                  radius={radiusFor(h.count)}
                  pathOptions={{
                    color: colorsByCategory[selectedCategory],
                    fillColor: colorsByCategory[selectedCategory],
                    fillOpacity: 0.4,
                  }}
                >
                  <Popup>
                    <div>
                      <div className="font-semibold">{h.name}</div>
                      <div className="text-sm text-slate-600">Incidents: {h.count}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Top 5 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">
            Top 5 Hotspot Locations ({selectedCategory})
          </h3>
          <ol className="space-y-2 list-decimal list-inside">
            {top5.map((h, idx) => (
              <li
                key={h.name}
                className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{h.name}</span>
                </div>
                <span className="text-slate-600">{h.count} incidents</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="text-center text-xs text-slate-500 pt-4">
        Data fetched is from various sources due to fragmentation.
      </footer>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-slate-500 text-sm">{title}</div>
      <div className="text-2xl font-bold mt-1">{value.toLocaleString()}</div>
    </div>
  );
}
