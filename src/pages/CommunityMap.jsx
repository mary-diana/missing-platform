// src/pages/CommunityMap.jsx
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup,useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

// Custom icons
const redIcon = new L.Icon({
  iconUrl:"https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// A custom component to handle search and map view changes
function MapController({ searchQuery }) {
  const map = useMap(); //  map instance

  useEffect(() => {
    if (searchQuery) {
      // Use a geocoding service ( Nominatim)
      // Incase you do  want to search outside Kenya, use this ''https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json''
      fetch(`https://nominatim.openstreetmap.org/search?q=${searchQuery}&countrycodes=ke&format=json`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            // Fly to the new location and adjust zoom
            map.flyTo([parseFloat(lat), parseFloat(lon)], 13);
          }
        })
        .catch(error => {
          console.error("Geocoding error:", error);
        });
    }
  }, [searchQuery, map]);

  return null; // This component doesn't render anything
}

export default function CommunityMap() {
  const [incidentType, setIncidentType] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [selected, setSelected] = useState(null);
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
 

  //  Fetch data from Firestore
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const dangerSnapshot = await getDocs(collection(db, "dangerReports"));
        const missingSnapshot = await getDocs(
          collection(db, "missingPersonsReports")
        );

        const dangerData = dangerSnapshot.docs.map((doc) => {
        const data = doc.data();
        let position = null;
        if (data.position && typeof data.position.latitude === 'number' && typeof data.position.longitude === 'number') {
            position = [data.position.latitude, data.position.longitude];
          }
        return {
          id: doc.id,
          ...data,
          type: "danger",
          position: position,
          title: data.category || "Danger Report",
          description: data.description || "No description provided.",
        };
        });

        const missingData = missingSnapshot.docs.map((doc) => {
            const data = doc.data();
            let position = null;
            if (data.position && typeof data.position.latitude === 'number' && typeof data.position.longitude === 'number') {
            position = [data.position.latitude, data.position.longitude];
          }
            return {
              id: doc.id,
              ...data,
              type: "missing",
              position: position,
              title: data.missingPersonName || "Missing Person",
              description: `Last seen: ${data.lastSeen || "Unknown"}`,
            };
        });

        //  Filter out reports with a null position before setting the state
        const allReports = [...dangerData, ...missingData].filter(report => report.position !== null);
        setReports(allReports);
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };

    fetchReports();
  }, []);

  //  Apply filters
  const filteredReports = reports.filter((report) => {
    if (!report.position || !Array.isArray(report.position)) {
        return false;
    }
    if (incidentType && report.type !== incidentType) return false;
    if (report.isRejected || report.isSolved) {
      return false; // Don't display if rejected or solved
  }
    if (dateRange && report.createdAt) {
      const now = new Date();
      const reportDate = new Date(report.createdAt.toDate());
      const diff = (now - reportDate) / (1000 * 60 * 60 * 24); // days

      if (dateRange === "24h" && diff > 1) return false;
      if (dateRange === "7d" && diff > 7) return false;
      if (dateRange === "30d" && diff > 30) return false;
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/*  Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-yellow-300 text-gray-700 rounded-lg hover:bg-gray-300"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-2">Community Safety Map</h1>
      <p className="text-gray-600 mb-6">
        Explore reported incidents of missing persons and potential dangers in
        your area. Click on markers for details and stay informed.
      </p>

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search for a location or county"
          className="w-full border rounded-lg px-4 py-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={incidentType}
          onChange={(e) => setIncidentType(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">Incident Type</option>
          <option value="missing">Missing Person</option>
          <option value="danger">Danger</option>
        </select>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">Date Range</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>

      </div>

      {/* Leaflet Map */}
      <div className="h-[500px] rounded-lg overflow-hidden shadow">
        <MapContainer
          center={[-1.2921, 36.8219]} // Nairobi
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* The new component to control map view */}
          <MapController searchQuery={searchQuery} />

          {/* Simplified rendering logic */}
          {filteredReports.map((report) => (
            <Marker
              key={report.id}
              position={report.position}
              icon={report.type === "danger" ? redIcon : blueIcon}
              eventHandlers={{
                click: () => setSelected(report),
              }}
            />
          ))}

          {selected &&
            selected.position &&
            Array.isArray(selected.position) &&
            selected.position.length === 2 && (
              <Popup
                position={selected.position}
                onClose={() => setSelected(null)}
              >
                <div>
                  <h3 className="font-bold">{selected.title}</h3>
                  <p>{selected.description}</p>
                </div>
              </Popup>
            )}
        </MapContainer>
      </div>

      <p className="text-xs text-gray-500 text-center mt-3">
        Data is updated every 24 hours. For immediate assistance, contact local
        authorities.
      </p>
    </div>
  );
}

