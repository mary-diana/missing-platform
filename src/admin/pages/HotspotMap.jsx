import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, LayersControl, LayerGroup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const db = getFirestore();

/* -------------------------------------------------------
   FIXED SEARCH MANAGEMENT ZONES (YOUR FIRST VERSION)
---------------------------------------------------------*/
const HOTSPOT_TIERS = {
  HIGH_PROBABILITY: { radiusMeters: 5000, color: "#FF0000", opacity: 0.6, weight: 3, name: "High (0–5 km)" },
  MEDIUM_PROBABILITY: { radiusMeters: 20000, color: "#FFA500", opacity: 0.4, weight: 2, name: "Medium (5–20 km)" },
  LOW_PROBABILITY: { radiusMeters: 60000, color: "#00FF00", opacity: 0.2, weight: 1, name: "Low (20–60 km)" },
};

/* -------------------------------------------------------
   TRAVEL-BASED SEARCH SPEEDS (YOUR SECOND VERSION)
---------------------------------------------------------*/
const SEARCH_SPEEDS = {
  ADULT_FOOT_AVG: 3,
  INJURED_FOOT_AVG: 0.75,
  LOCAL_ROAD_AVG: 50,
  HIGHWAY_AVG: 100,
};

/* -------------------------------------------------------
   GENERAL UTILITIES
---------------------------------------------------------*/
function parsePosition(position) {
  if (!position) return null;
  if (Array.isArray(position)) return [parseFloat(position[0]), parseFloat(position[1])];
  if (position.latitude !== undefined) return [position.latitude, position.longitude];
  if (typeof position === "string") {
    const m = position.match(/([0-9]+\.?[0-9]*)\D*([0-9]+\.?[0-9]*)/);
    if (m) return [parseFloat(m[1]), parseFloat(m[2])];
  }
  return null;
}

function hoursBetween(a, b) {
  return Math.abs((a.getTime() - b.getTime()) / (1000 * 60 * 60));
}

function computeRadii(hoursMissing, report) {
  const terrain = (report.terrain || "").toLowerCase();
  const isInjured = report.flags?.includes("injured");

  let footSpeed = isInjured ? SEARCH_SPEEDS.INJURED_FOOT_AVG : SEARCH_SPEEDS.ADULT_FOOT_AVG;
  let footRadius = hoursMissing * footSpeed;
  if (terrain.includes("forest") || terrain.includes("river") || terrain.includes("mountain/hill")) footRadius *= 0.6;
  footRadius = Math.min(footRadius, 50);

  const roadSpeed =
    terrain.includes("highway") || report.location?.toLowerCase().includes("highway")
      ? SEARCH_SPEEDS.HIGHWAY_AVG
      : SEARCH_SPEEDS.LOCAL_ROAD_AVG;

  let carRadius = Math.min(hoursMissing * roadSpeed, 200);

  return { footMeters: footRadius * 1000, carMeters: carRadius * 1000 };
}

/* -------------------------------------------------------
 MARKER COMPONENT
---------------------------------------------------------*/
const FocusableMarker = ({ report, setActiveReport, setZoneType }) => {
  if (!report.pos) return null;

  return (
    <Marker
      position={report.pos}
      eventHandlers={{
        click: () => setActiveReport(report),
      }}
    >
      <Popup>
        <div>
          <strong>{report.name}</strong>
          <div>{report.summary}</div>

          <hr />

          {/* Inline buttons BELOW description */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{
                flex: 1,
                padding: 6,
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
              }}
              onClick={() => {
                setActiveReport(report);
                setZoneType("management");
              }}
            >
              Search Management
            </button>

            <button
              style={{
                flex: 1,
                padding: 6,
                background: "orange",
                color: "white",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
              }}
              onClick={() => {
                setActiveReport(report);
                setZoneType("travel");
              }}
            >
              Travel
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};


/* -------------------------------------------------------
   MAIN PAGE
---------------------------------------------------------*/
export default function HotspotMap({ center = [0.65, 34.85], zoom = 9 }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected hotspot type:
  // "none" | "management" | "travel"
  const [zoneType, setZoneType] = useState("none");
  const [activeReport, setActiveReport] = useState(null);

  // Toggle zone choice popup
  const [showChoice, setShowChoice] = useState(false);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "missingPersonsReports"));
        const now = new Date();
        const items = [];

        snap.forEach((doc) => {
          const d = doc.data();
          const pos = parsePosition(d.position) || parsePosition(d.geopoint);
          if (!pos) return;

          let disappearanceDate = d.dateOfDisappearance?.toDate
            ? d.dateOfDisappearance.toDate()
            : new Date(d.dateOfDisappearance);

          const hoursMissing = hoursBetween(now, disappearanceDate);
          const radii = computeRadii(hoursMissing, d);

          items.push({
            id: doc.id,
            ...d,
            pos,
            hoursMissing,
            name: d.missingPersonName || "Unknown",
            summary: d.lastSeen || "No details",
            footMeters: radii.footMeters,
            carMeters: radii.carMeters,
          });
        });

        setReports(items);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);

  /* ----------------------------
     SHOW ZONE CHOICE POPUP
  -----------------------------*/
  useEffect(() => {
    if (activeReport) {
      setShowChoice(true);
      setZoneType("none");
    }
  }, [activeReport]);

  return (
    <div style={{ height: "80vh" }}>
      <h1 className="text-3xl font-bold">HotSpot Missing Persons Management</h1>
      <p className="text-gray-500 mb-6">
        Search and rescue tool for submitted reports of missing persons.
      </p>
      {/* Info / Description Panel */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border">
        <h2 className="font-semibold text-lg mb-2">What this map shows</h2>
        <p className="text-sm text-gray-700 mb-2">
          Click a marker to open the report popup. Use the popup buttons to toggle:
          <strong> Search Management</strong> (fixed-radius tiers) or <strong>Travel</strong> (dynamic radii based on time missing).
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            <span className="text-gray-700">High probability (0–5 km)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
            <span className="text-gray-700">Medium probability (5–20 km)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
            <span className="text-gray-700">Low probability (20–60 km)</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Note: radii are estimates (meters). Travel-based zones show estimated foot and vehicle ranges calculated from
          the reported disappearance time and terrain flags (forest, river, highway).
        </p>
      </div>


      <MapContainer center={center} zoom={zoom} style={{ height: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <LayersControl>
          <LayersControl.Overlay name="Missing Persons" checked>
            <LayerGroup>
              {reports.map((r) => (
                <FocusableMarker 
                key={r.id} 
                report={r} 
                setActiveReport={setActiveReport}
                setZoneType={setZoneType} />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          {/* Fixed search management zones */}
          {zoneType === "management" && activeReport && (
            <LayersControl.Overlay name="Search Management Zones" checked>
              <LayerGroup>
                {Object.values(HOTSPOT_TIERS).map((tier) => (
                  <Circle
                    key={tier.name}
                    center={activeReport.pos}
                    radius={tier.radiusMeters}
                    pathOptions={{
                      color: tier.color,
                      fillOpacity: tier.opacity,
                      weight: tier.weight,
                    }}
                  />
                ))}
              </LayerGroup>
            </LayersControl.Overlay>
          )}

          {/* Travel-based dynamic zones */}
          {zoneType === "travel" && activeReport && (
            <LayersControl.Overlay name="Travel-Based Zones" checked>
              <LayerGroup>
                <Circle
                  center={activeReport.pos}
                  radius={activeReport.carMeters}
                  pathOptions={{ color: "orange", weight: 1, fillOpacity: 0.25 }}
                />
                <Circle
                  center={activeReport.pos}
                  radius={activeReport.footMeters}
                  pathOptions={{ color: "red", weight: 2, fillOpacity: 0.45 }}
                />
              </LayerGroup>
            </LayersControl.Overlay>
          )}
        </LayersControl>
      </MapContainer>
      
    </div>
  );
}
