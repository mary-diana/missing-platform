import React, { useEffect, useState, useMemo } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase";
import downloadImage from "../../assets/download.jfif";
import { UserPlus, Lightbulb, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

// 🚀 Chart.js Imports
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register the necessary Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);


export default function AdminDashboard() {
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [missingPersonsReports, setMissingPersonsReports] = useState([]);
    const [dangerReports, setDangerReports] = useState([]);
    const navigate = useNavigate();

    const auth = getAuth();

    // 1.  Report Status helper function (Existing Logic)
    const getReportStatus = (report) => {
        if (report.isSolved) return "Resolved";
        if (report.isVerified) return "Verified";
        if (report.isRejected) return "Rejected";
        if (report.assignedLeader || report.assignedVolunteer) return "Assigned";
        return "Pending";
    };

    // 2.  Resolution Status helper function (New Logic)
    const getResolutionStatus = (report) => {
        // Only interested in reports that have a final resolution object
        if (report.resolution && report.resolution.status) {
            return report.resolution.status;
        }
        // If the report is solved but lacks the full resolution object,
        // we default to the generic "Resolved" status from the old logic
        if (report.isSolved) return "Resolved - General"; 
        
        return "Not Yet Resolved"; // Status for reports without a final outcome
    };

    // Fetch logged-in user's orgrole by email (Logic remains unchanged)
    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                // ... (Omitted for brevity - same as original)
                const user = auth.currentUser;
                if (!user) {
                    console.warn("No authenticated user found.");
                    setLoading(false);
                    return;
                }

                const q = query(collection(db, "adminusers"), where("email", "==", user.email));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0].data();
                    setUserRole(userData.orgrole);
                } else {
                    console.warn("No user found with that email.");
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserRole();
    }, [auth]);

    // Fetch reports (Logic remains unchanged)
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const missingSnap = await getDocs(collection(db, "missingPersonsReports"));
                const dangerSnap = await getDocs(collection(db, "dangerReports"));

                setMissingPersonsReports(missingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
                setDangerReports(dangerSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error fetching reports:", err);
            }
        };

        fetchReports();
    }, []);

    // Overall stats (Logic remains unchanged)
    const overall = useMemo(
        () => ({
            missing: missingPersonsReports.length,
            danger: dangerReports.length,
            total: missingPersonsReports.length + dangerReports.length,
        }),
        [missingPersonsReports, dangerReports]
    );

    // 3.  Compute generic report counts by status (Existing Logic, renamed helper)
    const reportStatusCounts = useMemo(() => {
        const allReports = [...missingPersonsReports, ...dangerReports];
        const counts = { Resolved: 0, Verified: 0, Rejected: 0, Assigned: 0, Pending: 0 };
        allReports.forEach((report) => {
            const status = getReportStatus(report);
            counts[status] = (counts[status] || 0) + 1;
        });
        return counts;
    }, [missingPersonsReports, dangerReports]);

    // 4. 🆕 Compute RESOLUTION counts by status
    const resolutionStatusCounts = useMemo(() => {
        const allReports = [...missingPersonsReports, ...dangerReports];
        const counts = {}; // Use a dynamic object as statuses are varied
        allReports.forEach((report) => {
            const status = getResolutionStatus(report);
            counts[status] = (counts[status] || 0) + 1;
        });
        return counts;
    }, [missingPersonsReports, dangerReports]);


    // 5. 🚀 Prepare data for the GENERIC Report Status Donut Chart (Existing Logic)
    const reportDonutChartData = useMemo(() => {
        const labels = Object.keys(reportStatusCounts);
        const data = Object.values(reportStatusCounts);
        const backgroundColors = [
            '#4CAF50', // Resolved (Green)
            '#2196F3', // Verified (Blue)
            '#F44336', // Rejected (Red)
            '#FFC107', // Assigned (Amber)
            '#9E9E9E', // Pending (Grey)
        ];

        return {
            labels: labels,
            datasets: [
                {
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: '#ffffff',
                    borderWidth: 2,
                },
            ],
        };
    }, [reportStatusCounts]);

    // 6. 🆕 Prepare data for the RESOLUTION Status Donut Chart
    const resolutionDonutChartData = useMemo(() => {
        const labels = Object.keys(resolutionStatusCounts);
        const data = Object.values(resolutionStatusCounts);
        
        // Define specific colors for the resolution outcomes
        const colorMap = {
            "Found Alive": '#22c55e', // Green for positive outcome
            "Resolved - Safe": '#3b82f6', // Blue for safe resolution
            "Found Deceased": '#ef4444', // Red for tragic outcome
            "Mutilated body": '#b91c1c', // Dark Red for severe cases
            "Sexually assaulted": '#c026d3', // Pink for sensitive cases
            "Unfounded": '#f59e0b', // Amber for false alarm/unfounded
            "Resolved - General": '#8b5cf6', // Purple for old/generic solved status
            "Not Yet Resolved": '#9ca3af', // Gray for pending
        };

        const backgroundColors = labels.map(label => colorMap[label] || '#ccc');

        return {
            labels: labels,
            datasets: [
                {
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: '#ffffff',
                    borderWidth: 2,
                },
            ],
        };
    }, [resolutionStatusCounts]);

    // 7. 🚀 Donut Chart Options (Reusable logic for both charts)
    const chartOptions = useMemo(() => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 14 },
                    },
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                const value = context.parsed;
                                const percentage = ((value / total) * 100).toFixed(1) + '%';
                                label += `${value} (${percentage})`;
                            }
                            return label;
                        }
                    }
                }
            },
        };
    }, []);


    // Role-based access control (Logic remains unchanged)
    const canViewVolunteers = userRole === "Administrator" || userRole === "Volunteer";
    const canViewLeads = userRole === "Administrator" || userRole === "Moderator" || userRole === "Police";

    if (loading) return <div className="text-center mt-20 text-gray-600">Loading...</div>;

    return (
        <div className="min-h-screen font-sans bg-gray-100 relative">
            {/* Hero Section (Omitted for brevity - same as original) */}
            <div
                className="relative h-[60vh] flex items-center justify-center text-center text-white"
                style={{
                    backgroundImage: `url(${downloadImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                <div className="relative z-10 max-w-4xl px-6 flex flex-col items-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-yellow-300">Find Them</h1>
                    <p className="mt-2 text-sm md:text-base mb-10">
                        Find Them is a centralized platform that brings together citizens, families and organizations
                        to raise awareness about missing people and real-time dangers in communities. Our goal is to
                        unify reporting and improve response through transparency and accessibility.
                    </p>
                    {/* ACCESS BUTTONS (Omitted for brevity - same as original) */}
                    
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                <header>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-slate-600 mt-1">
                        Analyze trends and patterns in reported incidents to enhance safety measures.
                    </p>
                </header>

                {/* Overall Stats (Omitted for brevity - same as original) */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard title="Total Reports" value={overall.total} />
                    <StatCard title="Missing Persons" value={overall.missing} />
                    <StatCard title="Danger Events" value={overall.danger} />
                </section>

                {/* 8. 🆕 Grid for Charts */}
                <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* 🚀 CHART 1: Generic Report Status */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-slate-700">Internal Workflow Status</h2>
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-center" style={{ height: '400px' }}>
                            {overall.total > 0 ? (
                                <Doughnut data={reportDonutChartData} options={chartOptions} />
                            ) : (
                                <p className="text-gray-500">No reports to display internal status.</p>
                            )}
                        </div>
                    </div>

                    {/* 🚀 CHART 2: Resolution Outcome Status */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-slate-700">Final Resolution Outcomes</h2>
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-center" style={{ height: '400px' }}>
                            {overall.total > 0 ? (
                                <Doughnut data={resolutionDonutChartData} options={chartOptions} />
                            ) : (
                                <p className="text-gray-500">No resolved reports to display outcomes.</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Assignment Information Section (Omitted for brevity - same as original) */}
                <section className="mt-8 bg-black p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-700 mb-2 text-center text-yellow-400">Want to work on a report?</h3>
                    <p className="text-slate-600 text-white">
                        If you are interested in being **assigned** to a specific report (Verified or Pending status), 
                        please check the **Announcements** section for available tasks or reach out and communicate your requests.
                    </p>
                </section>
            </div>
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