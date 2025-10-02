import React, { useMemo, useState } from "react";
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

// ---  Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function Statistics() {
  const navigate = useNavigate();
  const [timeGranularity, setTimeGranularity] = useState("weekly");
  const [selectedCategory, setSelectedCategory] = useState("Accidents");

  const overall = {
    total: 950,
    missing: 100,
    danger: 850,
  };

  // Incident frequency (demo)
  const series = useMemo(() => {
    const weekly = [
      { label: "Week 1", total: 160 },
      { label: "Week 2", total: 140 },
      { label: "Week 3", total: 155 },
      { label: "Week 4", total: 170 },
      { label: "Week 5", total: 230 },
      { label: "Week 6", total: 180 },
      { label: "Week 7", total: 210 },
    ];
    const daily = new Array(14).fill(null).map((_, i) => ({
      label: `Day ${i + 1}`,
      total: 40 + Math.round(10 * Math.sin(i / 2) + Math.random() * 8),
    }));
    const monthly = [
      { label: "Jan", total: 520 },
      { label: "Feb", total: 480 },
      { label: "Mar", total: 590 },
      { label: "Apr", total: 560 },
      { label: "May", total: 610 },
      { label: "Jun", total: 650 },
      { label: "Jul", total: 880 },
      { label: "Aug", total: 950},
    ];
    return { daily, weekly, monthly };
  }, []);

  // Category breakdown (demo)
  const categoryMoM = [
    { category: "Missing Persons", current: 80, previous: 100 },
    { category: "Accident", current: 210, previous: 140 },
    { category: "Assault", current: 120, previous: 80 },
    { category: "Crime", current: 270, previous: 210 },
    { category: "Natural Disaster", current: 20, previous: 50 },
    { category: "Violence", current: 250, previous: 300 },
  ];

  const enrichedCategoryMoM = useMemo(
    () =>
      categoryMoM.map((c) => ({
        ...c,
        changePct:
          c.previous === 0
            ? 100
            : Math.round(((c.current - c.previous) / c.previous) * 100),
      })),
    []
  );

  // --- Hotspots by category ---
  const hotspotsByCategory = {
    Accidents: [
      { name: "Nithi Bridge", lat: -0.2036, lng: 37.6656, count: 12 },
      { name: "Salgaa", lat: -0.2139, lng: 35.8544, count: 18 },
      { name: "Kibarani Causeway", lat: -4.0435, lng: 39.6682, count: 15 },
      { name: "Nairobi-Nakuru Highway", lat: -0.3, lng: 36.0, count: 20 },
      { name: "Kiboswa", lat: -0.0257, lng: 34.7006, count: 10 },
    ],
    Assaults: [
      { name: "Mandera", lat: 3.9373, lng: 41.8569, count: 22 },
      { name: "Garissa", lat: -0.4569, lng: 39.6583, count: 17 },
      { name: "Lamu", lat: -2.2716, lng: 40.902, count: 14 },
      { name: "Eastleigh", lat: -1.2807, lng: 36.854, count: 19 },
      { name: "Mathare", lat: -1.2667, lng: 36.8667, count: 11 },
    ],
    Crime: [
      { name: "Kibra", lat: -1.3086, lng: 36.7741, count: 25 },
      { name: "Mishomoroni", lat: -3.9781, lng: 39.6994, count: 18 },
      { name: "Manyatta", lat: -0.1022, lng: 34.7617, count: 12 },
      { name: "Bondeni", lat: -0.3031, lng: 36.08, count: 15 },
      { name: "Mandera/Garissa/Lamu/Wajir", lat: 2.0, lng: 40.0, count: 20 },
    ],
    Violence: [
      { name: "Mandera/Garissa/Lamu", lat: 1.8, lng: 40.2, count: 21 },
      { name: "West Pokot", lat: 1.5, lng: 35.0, count: 15 },
      { name: "Turkana", lat: 3.1219, lng: 35.597, count: 13 },
      { name: "Nairobi", lat: -1.2921, lng: 36.8219, count: 30 },
      { name: "Mombasa", lat: -4.0435, lng: 39.6682, count: 18 },
    ],
    "Natural Disaster": [
      { name: "Tana River", lat: -0.1, lng: 40.1167, count: 16 },
      { name: "Nairobi Floods", lat: -1.2921, lng: 36.8219, count: 14 },
      { name: "Budalang'i", lat: 0.1, lng: 34.0, count: 12 },
      { name: "Kano Plains", lat: -0.05, lng: 34.95, count: 10 },
      { name: "West Pokot", lat: 1.5, lng: 35.0, count: 15 },
    ],
    "Missing Individuals": [
      { name: "Nairobi", lat: -1.2921, lng: 36.8219, count: 22 },
      { name: "Kiambu", lat: -1.1714, lng: 36.8356, count: 12 },
      { name: "Migori", lat: -1.0634, lng: 34.4736, count: 9 },
      { name: "Mombasa", lat: -4.0435, lng: 39.6682, count: 15 },
      { name: "North Eastern Region", lat: 2.0, lng: 40.1167, count: 14 },
    ],
  };

  const colorsByCategory = {
    Accidents: "#ef4444",
    Assaults: "#f97316",
    Crime: "#2563eb",
    Violence: "#7c3aed",
    "Natural Disaster": "#059669",
    "Missing Individuals": "#eab308",
  };

  const currentHotspots = hotspotsByCategory[selectedCategory] || [];
  const top5 = [...currentHotspots].sort((a, b) => b.count - a.count).slice(0, 5);

  const radiusFor = (count) => Math.max(8, Math.min(36, (count / 30) * 36));

  const granularityOptions = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];

  // --- Demographic Data (counts; displayed as percentages) ---
  const genderData = [
    { name: "Male", value: 480 },
    { name: "Female", value: 520 },
    { name: "Other", value: 50 },
  ];

  const ageData = [
    { name: "0-17", value: 120 },
    { name: "18-35", value: 450 },
    { name: "36-60", value: 390 },
    { name: "60+", value: 90 },
  ];

  const countyData = [
    { name: "Nairobi", value: 300 },
    { name: "Mombasa", value: 150 },
    { name: "Kisumu", value: 120 },
    { name: "Nakuru", value: 200 },
    { name: "Garissa", value: 80 },
  ];

  const pieColors = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

  // Label function to show percentages on slices
  const percentLabel = ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold">Statistics</h1>
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
            {enrichedCategoryMoM.map((c) => (
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
              <BarChart data={enrichedCategoryMoM}>
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

      {/* Demographic Insights (Pie charts show percentages) */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Demographic Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {/* Gender */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Gender Distribution</h3>
            <ResponsiveContainer width="100%" height={290}>
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={percentLabel}  // ✅ percent labels
                >
                  {genderData.map((_, idx) => (
                    <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                {/* Tooltip shows % as well */}
                <Tooltip
                  formatter={(value, name, props) => [
                    `${(props.payload.percent * 100).toFixed(1)}%`,
                    name,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Age */}
          <div className="rounded-2x1 border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Age Distribution</h3>
            <ResponsiveContainer width="100%" height={290}>
              <PieChart>
                <Pie
                  data={ageData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={percentLabel}  // ✅ percent labels
                >
                  {ageData.map((_, idx) => (
                    <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${(props.payload.percent * 100).toFixed(1)}%`,
                    name,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* County */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">County Distribution</h3>
            <ResponsiveContainer width="100%" height={290}>
              <PieChart>
                <Pie
                  data={countyData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={percentLabel}  // ✅ percent labels
                >
                  {countyData.map((_, idx) => (
                    <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${(props.payload.percent * 100).toFixed(1)}%`,
                    name,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
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

