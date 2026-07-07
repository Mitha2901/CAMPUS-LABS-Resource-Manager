import React, { useState, useEffect } from "react";
import {
  Wrench,
  Calendar,
  Layers,
  Bot,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  FileCode,
  Info,
  UserCheck,
  Search,
  BookOpen,
  Send,
  HelpCircle,
  Clock,
  Laptop,
  Check,
  Copy,
  Sliders,
  Sparkles,
  ExternalLink
} from "lucide-react";

// Types
interface User {
  id: string;
  username: string;
  fullName: string;
  role: "student" | "admin";
  department: string;
}

interface Equipment {
  id: string;
  name: string;
  labName: string;
  totalUsageHours: number;
  lastMaintenanceDate: string;
  status: "Available" | "In Use" | "Maintenance Required";
  usageThreshold: number;
  maintenanceLimitDays: number;
  specification: string;
}

interface Booking {
  id: string;
  systemId: string;
  systemName: string;
  studentId: string;
  studentName: string;
  date: string;
  timeSlot: string;
  purpose: string;
  status: "Active" | "Completed" | "Cancelled";
  durationHours: number;
}

interface MaintenanceAlert {
  id: string;
  systemId: string;
  systemName: string;
  triggerReason: string;
  predictionDate: string;
  severity: "High" | "Medium";
  isResolved: boolean;
  resolvedDate: string | null;
}

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState("student1");
  const [passwordInput, setPasswordInput] = useState("student");
  const [roleInput, setRoleInput] = useState<"student" | "admin">("student");
  const [authError, setAuthError] = useState("");

  // Live Data States
  const [systems, setSystems] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [javaCodeFiles, setJavaCodeFiles] = useState<Record<string, string>>({});

  // Active View Tab State (Dashboard, Bookings, Systems, AI Maintenance, Java Project)
  const [activeTab, setActiveTab] = useState<"dashboard" | "bookings" | "systems" | "ai" | "java">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [labFilter, setLabFilter] = useState("All");

  // Interaction States (Modals / Forms)
  const [showBookingModal, setShowBookingModal] = useState<string | null>(null); // contains system ID
  const [bookingDate, setBookingDate] = useState("2026-07-04");
  const [bookingTimeSlot, setBookingTimeSlot] = useState("09:00 AM - 11:00 AM");
  const [bookingPurpose, setBookingPurpose] = useState("");
  const [bookingDuration, setBookingDuration] = useState("2");
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  // Equipment CRUD modal / fields
  const [showAddSysModal, setShowAddSysModal] = useState(false);
  const [newSysName, setNewSysName] = useState("");
  const [newSysLab, setNewSysLab] = useState("Advanced Computing Lab");
  const [newSysHours, setNewSysHours] = useState(0);
  const [newSysDate, setNewSysDate] = useState("2026-07-01");
  const [newSysThreshold, setNewSysThreshold] = useState(50);
  const [newSysLimit, setNewSysLimit] = useState(30);
  const [newSysSpecs, setNewSysSpecs] = useState("");
  const [sysFormError, setSysFormError] = useState("");

  // Edit Equipment State
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null);

  // Chat Assistant State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    { sender: "bot", text: "Hello! I am SmartLab AI. I track system usage thresholds, predict failures, and manage slots. Ask me anything!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Java File Explorer States
  const [selectedJavaFile, setSelectedJavaFile] = useState<string | null>(null);
  const [copiedFileName, setCopiedFileName] = useState<string | null>(null);

  // Fetch all databases from Express endpoints
  const fetchAllData = async () => {
    try {
      const sysRes = await fetch("/api/systems");
      if (!sysRes.ok) {
        console.warn("Soft notice - Systems sync pending:", sysRes.statusText);
        return;
      }
      const systemsData = await sysRes.json();
      setSystems(systemsData);

      const bkngRes = await fetch("/api/bookings");
      if (!bkngRes.ok) {
        console.warn("Soft notice - Bookings sync pending:", bkngRes.statusText);
        return;
      }
      const bookingsData = await bkngRes.json();
      setBookings(bookingsData);

      const alertRes = await fetch("/api/alerts");
      if (!alertRes.ok) {
        console.warn("Soft notice - Alerts sync pending:", alertRes.statusText);
        return;
      }
      const alertsData = await alertRes.json();
      setAlerts(alertsData);

      // Fetch analytics
      const reportRes = await fetch("/api/reports");
      if (!reportRes.ok) {
        console.warn("Soft notice - Reports sync pending:", reportRes.statusText);
        return;
      }
      const reportData = await reportRes.json();
      setAnalytics(reportData);
    } catch (err) {
      console.warn("Soft notice - Database sync in progress:", err);
    }
  };

  // Fetch Java source files
  const fetchJavaFiles = async () => {
    try {
      const res = await fetch("/api/java-code");
      if (!res.ok) {
        console.warn("Soft notice - Java source code loading pending:", res.statusText);
        return;
      }
      const files = await res.json();
      setJavaCodeFiles(files);
      if (Object.keys(files).length > 0 && !selectedJavaFile) {
        setSelectedJavaFile(Object.keys(files)[0]);
      }
    } catch (err) {
      console.warn("Soft notice - Java source code loading:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchJavaFiles();

    // Auto update state every 10s
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Set default form values according to chosen role
  useEffect(() => {
    if (roleInput === "student") {
      setUsernameInput("student1");
      setPasswordInput("student");
    } else {
      setUsernameInput("admin");
      setPasswordInput("admin");
    }
    setAuthError("");
  }, [roleInput]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
          role: roleInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        // Direct to dashboards
        setActiveTab("dashboard");
      } else {
        setAuthError(data.message || "Failed to authenticate.");
      }
    } catch (err) {
      setAuthError("Server communication error. Please try again.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSearchQuery("");
  };

  // Create booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");
    setBookingSuccess("");
    if (!currentUser || !showBookingModal) return;

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId: showBookingModal,
          studentId: currentUser.id,
          studentName: currentUser.fullName,
          date: bookingDate,
          timeSlot: bookingTimeSlot,
          purpose: bookingPurpose || "Academic lab research and execution",
          durationHours: Number(bookingDuration)
        })
      });
      const data = await res.json();
      if (data.success) {
        setBookingSuccess("Booking scheduled successfully!");
        setBookingPurpose("");
        fetchAllData();
        setTimeout(() => {
          setShowBookingModal(null);
          setBookingSuccess("");
        }, 1500);
      } else {
        setBookingError(data.message || "Conflict or restriction encountered.");
      }
    } catch (err) {
      setBookingError("Failed to book device.");
    }
  };

  // Cancel booking
  const handleCancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      }
    } catch (err) {
      console.warn("Cancel error:", err);
    }
  };

  // Add system
  const handleAddSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSysFormError("");
    if (!newSysName || !newSysLab) {
      setSysFormError("Please fill out System Name and Lab location.");
      return;
    }

    try {
      const res = await fetch("/api/systems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSysName,
          labName: newSysLab,
          totalUsageHours: Number(newSysHours),
          lastMaintenanceDate: newSysDate,
          usageThreshold: Number(newSysThreshold),
          maintenanceLimitDays: Number(newSysLimit),
          specification: newSysSpecs
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddSysModal(false);
        setNewSysName("");
        setNewSysHours(0);
        setNewSysSpecs("");
        fetchAllData();
      } else {
        setSysFormError(data.message || "Failed to add system.");
      }
    } catch (err) {
      setSysFormError("Network error.");
    }
  };

  // Edit/Update Equipment Parameters
  const handleSaveEditSystem = async (sys: Equipment) => {
    try {
      const res = await fetch(`/api/systems/${sys.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sys)
      });
      const data = await res.json();
      if (data.success) {
        setEditingSystemId(null);
        fetchAllData();
      }
    } catch (err) {
      console.warn("Edit failure:", err);
    }
  };

  // Delete system
  const handleDeleteSystem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lab system permanently?")) return;
    try {
      const res = await fetch(`/api/systems/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      }
    } catch (err) {
      console.warn("Delete failure:", err);
    }
  };

  // Maintain system (Reset usage parameters to clean state)
  const handleMaintainSystem = async (id: string) => {
    try {
      const res = await fetch(`/api/systems/${id}/maintain`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      }
    } catch (err) {
      console.warn("Maintenance error:", err);
    }
  };

  // Send message to Gemini AI assistant chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { sender: "bot", text: data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: "bot", text: "Communication error with my neural module. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Copy code utility
  const handleCopyCode = (filename: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFileName(filename);
    setTimeout(() => setCopiedFileName(null), 2000);
  };

  // Filter systems list
  const filteredSystems = systems.filter(sys => {
    const matchesSearch = sys.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sys.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sys.specification.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLab = labFilter === "All" || sys.labName === labFilter;
    return matchesSearch && matchesLab;
  });

  const uniqueLabs: string[] = Array.from(new Set(systems.map(s => s.labName)));

  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      
      {/* 1. LOGIN COVER IF NOT AUTHENTICATED */}
      {!currentUser ? (
        <div className="flex-1 flex flex-col md:flex-row h-full w-full overflow-y-auto bg-slate-50">
          {/* Brand Left Column */}
          <div className="md:w-5/12 bg-slate-900 text-white flex flex-col justify-between p-8 md:p-12 relative overflow-hidden border-r border-slate-800">
            {/* Elegant Background Accents */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950"></div>
            
            {/* Header */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/10">L</div>
              <div>
                <h1 className="font-bold tracking-tight text-xl uppercase">CAMPUS LABS</h1>
                <p className="text-xs text-slate-400 font-medium">Resource Scheduling & Registry</p>
              </div>
            </div>

            {/* Core Message */}
            <div className="relative z-10 my-auto py-12 md:py-0">
              <span className="text-xs font-bold text-blue-400 bg-blue-950 border border-blue-800/40 px-3 py-1 rounded-full uppercase tracking-wider">Automated Resource Scheduler</span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4 text-white leading-tight">
                Coordinate college hardware access & prevent downtime.
              </h2>
              <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                Campus Labs Hub monitors hardware usage hours, evaluates safety thresholds, triggers automated preventative maintenance flags, and schedules student reservations.
              </p>

              {/* Rules summary block */}
              <div className="mt-8 p-5 bg-slate-800/40 rounded-2xl border border-slate-700/40 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider mb-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>Threshold Rules Engine</span>
                </div>
                <div className="text-xs space-y-1.5 font-mono text-slate-300">
                  <p className="text-amber-400">IF usage_hours &gt; USAGE_THRESHOLD</p>
                  <p className="text-amber-400">OR days_since_maintenance &gt; 30</p>
                  <p className="text-emerald-400">THEN status = "Maintenance Required"</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex justify-between items-center text-xs text-slate-500 border-t border-slate-800 pt-6">
              <p>© 2026 Academic Systems Hub</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>All Services Operational</span>
              </div>
            </div>
          </div>

          {/* Login Form Right Column */}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-100/50">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Sign In</h3>
                <p className="text-slate-500 text-sm mt-1">Select your role to access the laboratory inventory.</p>
              </div>

              {/* Role Toggle Selector */}
              <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRoleInput("student")}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    roleInput === "student"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Student Account
                </button>
                <button
                  type="button"
                  onClick={() => setRoleInput("admin")}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    roleInput === "admin"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Lab Administrator
                </button>
              </div>

              {authError && (
                <div className="mb-4 p-3.5 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-lg font-medium">
                  {authError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Username</label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                    placeholder="Enter your system identifier"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                    placeholder="Enter security key"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10 mt-2 flex items-center justify-center gap-2"
                >
                  <span>Access Secured Portal</span>
                  <UserCheck className="w-4 h-4" />
                </button>
              </form>

              {/* Demo Credentials Cheat Sheet */}
              <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500">
                <p className="font-semibold mb-2 text-slate-700">Project Demo Accounts:</p>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="font-bold text-blue-600">Student Mode</p>
                    <p>User: <span className="font-mono bg-white px-1">student1</span></p>
                    <p>Pass: <span className="font-mono bg-white px-1">student</span></p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="font-bold text-purple-600">Admin Mode</p>
                    <p>User: <span className="font-mono bg-white px-1">admin</span></p>
                    <p>Pass: <span className="font-mono bg-white px-1">admin</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        
        // 2. AUTHENTICATED SYSTEM PORTAL
        <div className="flex h-full w-full overflow-hidden">
          
          {/* Left Sidebar Navigation matching 'Professional Polish' */}
          <aside className="w-72 bg-slate-900 flex flex-col h-full shrink-0 border-r border-slate-800">
            {/* Header Brand */}
            <div className="p-6 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/10">L</div>
                <div>
                  <h1 className="text-white font-bold tracking-tight text-base uppercase">CAMPUS LABS</h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Resource Manager</p>
                </div>
              </div>
            </div>

            {/* Authenticated User Status block */}
            <div className="p-4 mx-4 my-3 bg-slate-800/20 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs uppercase">
                  {currentUser.fullName.slice(0, 2)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-100 truncate">{currentUser.fullName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{currentUser.role} account</p>
                </div>
              </div>
            </div>

            {/* Side Navigation Menu */}
            <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "dashboard"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <Layers className="w-5 h-5" />
                <span>Operations Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab("bookings")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "bookings"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5" />
                  <span>{currentUser.role === "admin" ? "Schedules Directory" : "Schedule Bookings"}</span>
                </div>
                {currentUser.role === "student" && bookings.filter(b => b.studentId === currentUser.id && b.status === "Active").length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 bg-blue-500 text-white rounded-full font-bold">
                    {bookings.filter(b => b.studentId === currentUser.id && b.status === "Active").length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("systems")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "systems"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <Laptop className="w-5 h-5" />
                <span>Lab Hardware Registry</span>
              </button>

              <button
                onClick={() => setActiveTab("ai")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "ai"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5" />
                  <span>Safety Threshold Alerts</span>
                </div>
                {alerts.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded-full font-bold">
                    {alerts.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("java")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "java"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <FileCode className="w-5 h-5 text-amber-400" />
                <span className="text-amber-300 font-bold">Java Source Files</span>
              </button>
            </nav>

            {/* Quick Rule Engine parameters sidebar badge */}
            <div className="p-4 mt-auto border-t border-slate-800/80">
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Automated Rules Engine</span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <p>Threshold: <span className="font-mono text-slate-300">50 Hrs / 30 Days</span></p>
                  <p>Database: <span className="font-mono text-slate-300">Spring JPA & SQLite</span></p>
                  <p className="text-blue-400 italic font-mono">System Protocol Operational</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-xl text-xs font-semibold transition-all border border-slate-700/30"
              >
                <LogOut className="w-4 h-4" />
                <span>End Session</span>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Header conforming to Professional Polish style */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                  {activeTab === "dashboard" && "Operations Overview"}
                  {activeTab === "bookings" && "Lab Scheduling Directory"}
                  {activeTab === "systems" && "Laboratory Resources Registry"}
                  {activeTab === "ai" && "Rules-Engine Safety Diagnostics"}
                  {activeTab === "java" && "Spring Boot MVC Project Source"}
                </h2>
                <span className="px-2.5 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Term: Fall 2026
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Search Bar in Header for quick accessibility */}
                <div className="relative w-64 hidden md:block">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search systems, specs..."
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{currentUser.fullName}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{currentUser.department || "Resource Management"}</p>
                  </div>
                  <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/10">
                    {currentUser.fullName.charAt(0)}
                  </div>
                </div>
              </div>
            </header>

            {/* Scrollable Container */}
            <div className="flex-1 p-8 overflow-y-auto">

              {/* TAB 1: EXECUTIVE DASHBOARD */}
              {activeTab === "dashboard" && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Stats Grid conforming to Professional Polish Layout */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className="absolute right-4 top-4 bg-slate-50 p-2 rounded-xl text-slate-400"><Laptop className="w-5 h-5" /></div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">TOTAL SYSTEMS</p>
                      <h3 className="text-3xl font-extrabold text-slate-900">{analytics?.summary?.totalSystems || systems.length}</h3>
                      <p className="text-xs text-blue-600 mt-2 font-medium">Across {uniqueLabs.length} unique labs</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className="absolute right-4 top-4 bg-blue-50 p-2 rounded-xl text-blue-500"><Calendar className="w-5 h-5" /></div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">ACTIVE BOOKINGS</p>
                      <h3 className="text-3xl font-extrabold text-slate-900">
                        {bookings.filter(b => b.status === "Active").length}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 font-medium">Currently reserved slots</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className="absolute right-4 top-4 bg-emerald-50 p-2 rounded-xl text-emerald-500"><CheckCircle2 className="w-5 h-5" /></div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">HEALTH INDEX</p>
                      <h3 className="text-3xl font-extrabold text-slate-900">
                        {systems.length > 0 
                          ? `${Math.round(((systems.length - alerts.length) / systems.length) * 100)}%` 
                          : "100%"}
                      </h3>
                      <p className="text-xs text-emerald-600 mt-2 font-medium">Safety threshold rating</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm ring-2 ring-red-500/10 relative overflow-hidden">
                      <div className="absolute right-4 top-4 bg-red-50 p-2 rounded-xl text-red-500"><AlertTriangle className="w-5 h-5" /></div>
                      <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider mb-1">THRESHOLD ALERTS</p>
                      <h3 className="text-3xl font-extrabold text-red-600">
                        {alerts.filter(a => !a.isResolved).length}
                      </h3>
                      <p className="text-xs text-red-500 mt-2 font-medium">Requires maintenance check</p>
                    </div>
                  </div>

                  {/* Dashboard split screen layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Lab Resources Monitor Table Card */}
                    <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h4 className="font-bold text-slate-900">Lab Equipment Monitor</h4>
                          <p className="text-xs text-slate-500">Device status matches current scheduling parameters and cumulative hours.</p>
                        </div>
                        
                        {/* Lab quick filter */}
                        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                          <button 
                            onClick={() => setLabFilter("All")}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${labFilter === "All" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"}`}
                          >
                            All
                          </button>
                          {uniqueLabs.map((lab: string) => (
                            <button
                              key={lab}
                              onClick={() => setLabFilter(lab)}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${labFilter === lab ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"}`}
                            >
                              {lab.split(" ")[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                              <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hardware</th>
                              <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</th>
                              <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usage & Limit</th>
                              <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Safety Status</th>
                              <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredSystems.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs">
                                  No registered systems match current criteria or queries.
                                </td>
                              </tr>
                            ) : (
                              filteredSystems.map(sys => {
                                const usagePercentage = Math.round((sys.totalUsageHours / sys.usageThreshold) * 100);
                                return (
                                  <tr key={sys.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                      <p className="text-sm font-semibold text-slate-800">{sys.name}</p>
                                      <p className="text-[11px] text-slate-400 font-mono">{sys.id}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                                        {sys.labName}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="font-mono text-slate-700 font-semibold">{sys.totalUsageHours} / {sys.usageThreshold} hrs</span>
                                        <span className={`font-semibold ${usagePercentage >= 100 ? "text-red-500" : "text-slate-400"}`}>{usagePercentage}%</span>
                                      </div>
                                      <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all ${usagePercentage >= 100 ? "bg-red-500" : usagePercentage >= 80 ? "bg-amber-400" : "bg-blue-600"}`} 
                                          style={{ width: `${Math.min(100, usagePercentage)}%` }}
                                        />
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      {sys.status === "Maintenance Required" ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-full uppercase border border-red-100">
                                          <ShieldAlert className="w-3 h-3" />
                                          <span>Maintenance Required</span>
                                        </span>
                                      ) : sys.status === "In Use" ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full uppercase border border-blue-100">
                                          <Clock className="w-3 h-3" />
                                          <span>In Use</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase border border-emerald-100">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>Ready</span>
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      {currentUser.role === "student" ? (
                                        <button
                                          onClick={() => setShowBookingModal(sys.id)}
                                          disabled={sys.status === "Maintenance Required"}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            sys.status === "Maintenance Required"
                                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                          }`}
                                        >
                                          {sys.status === "Maintenance Required" ? "Locked" : "Book Slot"}
                                        </button>
                                      ) : (
                                        <div className="flex justify-end gap-2">
                                          {sys.status === "Maintenance Required" && (
                                            <button
                                              onClick={() => handleMaintainSystem(sys.id)}
                                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                                              title="Mark maintenance complete and reset counter"
                                            >
                                              Maintain Complete
                                            </button>
                                          )}
                                          <button
                                            onClick={() => {
                                              setEditingSystemId(sys.id);
                                              setActiveTab("systems");
                                            }}
                                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                                          >
                                            Configure
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Safety Rules Engine Diagnostics */}
                    <div className="space-y-6">
                      
                      {/* Operational Diagnostics Box */}
                      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden border border-slate-800">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                          <Sliders className="w-24 h-24 text-white" />
                        </div>
                        
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <Sliders className="w-4 h-4 text-blue-400" />
                            <h5 className="text-blue-400 font-bold text-xs uppercase tracking-widest">Safety Threshold Evaluation</h5>
                          </div>
                          
                          <p className="text-xs text-slate-300 leading-relaxed mb-4 italic">
                            {alerts.length > 0 
                              ? `"Safety Notice: The system rules engine has flagged ${alerts.length} device(s) requiring inspection. Scheduling has been restricted automatically to safeguard equipment."`
                              : `"All registered lab devices are operating within safe bounds. Validation diagnostics confirm 100% nominal status."`}
                          </p>
                          
                          {alerts.length > 0 && (
                            <div className="p-3 bg-slate-800 border border-slate-700/50 rounded-xl mb-4">
                              <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Triggered Safety Flag:</p>
                              <p className="text-xs text-slate-200 mt-1 font-medium font-mono">{alerts[0].triggerReason}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setActiveTab("ai")}
                              className="flex-1 bg-blue-600 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/10"
                            >
                              Open Diagnostics
                            </button>
                            <button 
                              onClick={() => setChatOpen(true)}
                              className="flex-1 bg-slate-800 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-700 text-slate-300 border border-slate-700/50"
                            >
                              Operations Support
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Recent active schedule listings */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-bold text-slate-900">Upcoming Active Slots</h5>
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                            {bookings.filter(b => b.status === "Active").length} Slots
                          </span>
                        </div>

                        <div className="space-y-3 max-h-[220px] overflow-y-auto">
                          {bookings.filter(b => b.status === "Active").length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-6">No current active reservations.</p>
                          ) : (
                            bookings.filter(b => b.status === "Active").map(b => (
                              <div key={b.id} className="flex gap-4 p-3 bg-slate-50 hover:bg-slate-100/50 rounded-xl transition-all border border-slate-100">
                                <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center shrink-0">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase">{b.date.split("-")[1] === "07" ? "JUL" : "AUG"}</span>
                                  <span className="text-sm font-extrabold text-slate-800">{b.date.split("-")[2]}</span>
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-bold text-slate-800 truncate">{b.systemName}</p>
                                  <p className="text-[10px] text-slate-500 font-medium truncate">
                                    {b.studentName} ({b.timeSlot})
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* TAB 2: SCHEDULING DIRECTORY / BOOKINGS PAGE */}
              {activeTab === "bookings" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Student Booking Instruction Card */}
                  {currentUser.role === "student" && (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                      <div className="relative z-10">
                        <h3 className="text-lg font-bold">Need to book a high-spec laboratory system?</h3>
                        <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
                          Select any available hardware system from the hardware list. Note that the safety threshold engine automatically locks down any resource with exceeding usage hours or delayed periodic checkups to safeguard lab equipment.
                        </p>
                        <button 
                          onClick={() => setActiveTab("dashboard")} 
                          className="mt-4 px-4 py-2 bg-white text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors shadow-md"
                        >
                          Browse Available Hardware
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Booking Directory Grid */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-900">
                          {currentUser.role === "admin" ? "All Laboratory Schedules" : "Your Bookings History"}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {currentUser.role === "admin" 
                            ? "Review college-wide schedules, system hours, and resolve collisions." 
                            : "Track your personal active lab hours, booking approvals, and cancelled slots."}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Equipment System</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic User</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Slot</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usage Purpose</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Status</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {bookings.filter(b => currentUser.role === "admin" || b.studentId === currentUser.id).length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-xs">
                                No scheduling history found in current database.
                              </td>
                            </tr>
                          ) : (
                            bookings.filter(b => currentUser.role === "admin" || b.studentId === currentUser.id).map(b => (
                              <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-slate-700">{b.id}</td>
                                <td className="px-6 py-4">
                                  <p className="font-semibold text-slate-800">{b.systemName}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{b.systemId}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-medium text-slate-800">{b.studentName}</p>
                                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{b.studentId}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-semibold text-slate-800">{b.date}</p>
                                  <p className="text-[10px] text-slate-500">{b.timeSlot} ({b.durationHours} hrs)</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-xs text-slate-600 line-clamp-2 max-w-xs">{b.purpose}</p>
                                </td>
                                <td className="px-6 py-4">
                                  {b.status === "Active" ? (
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full uppercase border border-blue-100">
                                      Active
                                    </span>
                                  ) : b.status === "Completed" ? (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase border border-emerald-100">
                                      Completed
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full uppercase border border-slate-200">
                                      Cancelled
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {b.status === "Active" && (
                                    <button
                                      onClick={() => handleCancelBooking(b.id)}
                                      className="px-2.5 py-1 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all border border-red-200"
                                    >
                                      Cancel Slot
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}


              {/* TAB 3: HARDWARE REGISTRY / EQUIPMENT */}
              {activeTab === "systems" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Admin Command Row */}
                  {currentUser.role === "admin" && (
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">Configure Laboratory Inventory</h3>
                        <p className="text-xs text-slate-500">Define hardware specifications, tweak safety threshold rules, and add computing workstations.</p>
                      </div>
                      <button
                        onClick={() => setShowAddSysModal(true)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Lab System</span>
                      </button>
                    </div>
                  )}

                  {/* Equipment Catalog */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {systems.map(sys => {
                      const isEditing = editingSystemId === sys.id;
                      return (
                        <div 
                          key={sys.id} 
                          className={`bg-white p-6 rounded-2xl border transition-all ${
                            isEditing 
                              ? "ring-2 ring-blue-500 border-transparent shadow-lg" 
                              : "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex justify-between items-start gap-2 mb-4">
                            <div>
                              <p className="text-[10px] font-bold text-blue-500 uppercase font-mono">{sys.id}</p>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={sys.name}
                                  onChange={(e) => {
                                    const updated = systems.map(s => s.id === sys.id ? { ...s, name: e.target.value } : s);
                                    setSystems(updated);
                                  }}
                                  className="text-sm font-bold border-b border-slate-300 focus:outline-none focus:border-blue-500 mt-1"
                                />
                              ) : (
                                <h4 className="font-bold text-slate-900 text-base">{sys.name}</h4>
                              )}
                              
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={sys.labName}
                                  onChange={(e) => {
                                    const updated = systems.map(s => s.id === sys.id ? { ...s, labName: e.target.value } : s);
                                    setSystems(updated);
                                  }}
                                  className="text-xs border-b border-slate-300 text-slate-500 mt-1"
                                />
                              ) : (
                                <p className="text-xs text-slate-500 mt-0.5">{sys.labName}</p>
                              )}
                            </div>

                            {/* Status Indicator Badge */}
                            <div>
                              {sys.status === "Maintenance Required" ? (
                                <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[9px] font-bold rounded-full uppercase border border-red-100">
                                  Alert
                                </span>
                              ) : sys.status === "In Use" ? (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-full uppercase border border-blue-100">
                                  In Use
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full uppercase border border-emerald-100">
                                  Fine
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Specifications block */}
                          <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Specifications</p>
                            {isEditing ? (
                              <textarea
                                value={sys.specification}
                                onChange={(e) => {
                                  const updated = systems.map(s => s.id === sys.id ? { ...s, specification: e.target.value } : s);
                                  setSystems(updated);
                                }}
                                className="text-xs w-full bg-white border border-slate-200 rounded p-1"
                              />
                            ) : (
                              <p className="text-xs text-slate-700 font-medium leading-relaxed min-h-[40px]">
                                {sys.specification || "Standard laboratory computer terminal."}
                              </p>
                            )}
                          </div>

                          {/* Metrics Rows */}
                          <div className="grid grid-cols-2 gap-4 text-xs border-t border-b border-slate-100 py-3.5 mb-4">
                            <div>
                              <span className="text-slate-400 block mb-0.5">Usage Hours</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={sys.totalUsageHours}
                                  onChange={(e) => {
                                    const updated = systems.map(s => s.id === sys.id ? { ...s, totalUsageHours: Number(e.target.value) } : s);
                                    setSystems(updated);
                                  }}
                                  className="w-16 border rounded p-0.5 text-xs font-mono"
                                />
                              ) : (
                                <span className="font-mono font-bold text-slate-800">{sys.totalUsageHours} hrs</span>
                              )}
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Usage Threshold</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={sys.usageThreshold}
                                  onChange={(e) => {
                                    const updated = systems.map(s => s.id === sys.id ? { ...s, usageThreshold: Number(e.target.value) } : s);
                                    setSystems(updated);
                                  }}
                                  className="w-16 border rounded p-0.5 text-xs font-mono"
                                />
                              ) : (
                                <span className="font-mono font-bold text-slate-500">{sys.usageThreshold} hrs</span>
                              )}
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Last Maintained</span>
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={sys.lastMaintenanceDate}
                                  onChange={(e) => {
                                    const updated = systems.map(s => s.id === sys.id ? { ...s, lastMaintenanceDate: e.target.value } : s);
                                    setSystems(updated);
                                  }}
                                  className="w-full border rounded p-0.5 text-xs"
                                />
                              ) : (
                                <span className="font-medium text-slate-800">{sys.lastMaintenanceDate}</span>
                              )}
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Safety Limit (Days)</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={sys.maintenanceLimitDays}
                                  onChange={(e) => {
                                    const updated = systems.map(s => s.id === sys.id ? { ...s, maintenanceLimitDays: Number(e.target.value) } : s);
                                    setSystems(updated);
                                  }}
                                  className="w-16 border rounded p-0.5 text-xs font-mono"
                                />
                              ) : (
                                <span className="font-medium text-slate-800">{sys.maintenanceLimitDays} days</span>
                              )}
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEditSystem(sys)}
                                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                  Save Changes
                                </button>
                                <button
                                  onClick={() => setEditingSystemId(null)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : currentUser.role === "admin" ? (
                              <>
                                <button
                                  onClick={() => setEditingSystemId(sys.id)}
                                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                                >
                                  Tweak Limits
                                </button>
                                <button
                                  onClick={() => handleDeleteSystem(sys.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete System"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setShowBookingModal(sys.id)}
                                disabled={sys.status === "Maintenance Required"}
                                className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                                  sys.status === "Maintenance Required"
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                              >
                                {sys.status === "Maintenance Required" ? "Locked for Maintenance" : "Book Workstation"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


              {/* TAB 4: SAFETY THRESHOLD DIAGNOSTICS */}
              {activeTab === "ai" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Safety Rules Header banner */}
                  <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden border border-slate-800">
                    <div className="absolute top-0 right-0 p-6 text-blue-500 opacity-10">
                      <Sliders className="w-32 h-32 text-blue-500" />
                    </div>
                    
                    <div className="relative z-10 max-w-3xl">
                      <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest mb-3">
                        <Sliders className="w-4 h-4 text-blue-400" />
                        <span>System Health & Safety Standards</span>
                      </div>
                      <h2 className="text-2xl font-extrabold tracking-tight text-white">
                        Safety Protocols & Threshold Validation
                      </h2>
                      <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                        The rules-engine validates equipment operating thresholds against safety parameters on every refresh. Workstations exceeding limits are automatically flagged and disabled to avoid hardware damage.
                      </p>
                    </div>
                  </div>

                  {/* Active Predictive Alerts list */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">Active Safety Interventions</h4>
                        <p className="text-xs text-slate-500">The following systems were flagged automatically and temporarily removed from the student booking pool.</p>
                      </div>
                      <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 text-xs font-bold rounded-full">
                        {alerts.filter(a => !a.isResolved).length} Urgent Interventions
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {alerts.filter(a => !a.isResolved).length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                          <p className="font-bold text-slate-800 text-sm">Perfect Score: Zero Alerts</p>
                          <p className="text-xs text-slate-500 mt-1">All collegiate systems currently operate within safe usage parameters.</p>
                        </div>
                      ) : (
                        alerts.filter(a => !a.isResolved).map(alert => (
                          <div key={alert.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0 mt-1">
                                <AlertTriangle className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-slate-900">{alert.systemName}</h5>
                                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-500">{alert.systemId}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${alert.severity === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                    {alert.severity} Severity
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 font-medium mt-1.5">{alert.triggerReason}</p>
                                <p className="text-[10px] text-slate-400 mt-1">Safety Exception Logged: {alert.predictionDate}</p>
                              </div>
                            </div>

                            {currentUser.role === "admin" ? (
                              <button
                                onClick={() => handleMaintainSystem(alert.systemId)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                              >
                                Mark Maintained
                              </button>
                            ) : (
                              <span className="text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                                Admin Assigned
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}


              {/* TAB 5: JAVA SOURCE FILES CODE VIEWER */}
              {activeTab === "java" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Explanation card */}
                  <div className="bg-amber-50 border border-amber-200/60 p-6 rounded-2xl flex items-start gap-4">
                    <div className="bg-amber-100 text-amber-800 p-2.5 rounded-xl shrink-0">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">College Project Source Code Hub</h4>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        This application is natively structured inside the <span className="font-mono bg-white px-1">/java-src</span> directory, utilizing the complete <strong>Spring Boot Web Starter MVC architecture</strong>, <strong>JPA/Hibernate</strong> object-relational mapping, and a rule-based automated validation service. Select a source file below to view or copy the code for your college mini or major project.
                      </p>
                    </div>
                  </div>

                  {/* Code Explorer */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[550px]">
                    {/* Left File Selector List */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5 overflow-y-auto">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Spring Boot Files</p>
                      {Object.keys(javaCodeFiles).map(filename => (
                        <button
                          key={filename}
                          onClick={() => setSelectedJavaFile(filename)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                            selectedJavaFile === filename
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate pr-2">{filename.split("/").pop()}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase shrink-0">
                            {filename.endsWith(".sql") ? "sql" : "java"}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Right Code Display Canvas */}
                    <div className="lg:col-span-3 flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                      {selectedJavaFile ? (
                        <>
                          <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex justify-between items-center">
                            <span className="text-xs font-mono text-slate-400 font-bold">{selectedJavaFile}</span>
                            <button
                              onClick={() => handleCopyCode(selectedJavaFile, javaCodeFiles[selectedJavaFile])}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              {copiedFileName === selectedJavaFile ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Code</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="flex-1 p-6 overflow-auto font-mono text-xs text-slate-300 leading-relaxed bg-slate-950">
                            <pre>{javaCodeFiles[selectedJavaFile]}</pre>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                          <p>Select a file to inspect Java source code.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Branding conforming to Professional Polish */}
            <footer className="bg-white px-8 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider italic">
                  Powered by Java Spring Boot (Spring MVC, JPA) & SQLite Engine
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-slate-400 font-mono">v1.2.0 Build-Stable-2026.07.04</span>
                <button 
                  onClick={() => setActiveTab("java")}
                  className="text-[10px] text-blue-600 font-bold uppercase hover:underline flex items-center gap-1"
                >
                  <span>Java Package Inspector</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </footer>
          </main>
        </div>
      )}

      {/* 3. OPERATIONS SUPPORT FLOATING DRAWER (BOTTOM RIGHT) */}
      {currentUser && (
        <>
          {/* Chat Toggle Button */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 z-40 cursor-pointer"
            title="Contact Lab Helpdesk Coordinator"
          >
            {chatOpen ? (
              <span className="font-bold text-sm">Close</span>
            ) : (
              <HelpCircle className="w-6 h-6 animate-pulse" />
            )}
          </button>

          {/* Chat Assistant Window */}
          {chatOpen && (
            <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-3xl border border-slate-200 shadow-2xl z-40 flex flex-col overflow-hidden animate-slide-up">
              {/* Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">
                  Help
                </div>
                <div>
                  <h4 className="font-bold text-sm">Lab Helpdesk Coordinator</h4>
                  <p className="text-[10px] text-slate-400">Operations Desk Assistance</p>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-white text-slate-800 shadow-xs border border-slate-200/80 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3 shadow-xs">
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                        <span>Coordinator is replying...</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about slots, PC availability, rules..."
                  className="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </>
      )}


      {/* 4. MODALS & FORMS OVERLAYS */}
      
      {/* 4a. Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-slate-900 text-white p-6">
              <h4 className="font-bold text-lg">Schedule Laboratory Workstation</h4>
              <p className="text-xs text-slate-400 mt-1">Book computer workstations or instrument systems securely.</p>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4">
              {bookingError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-lg font-medium">
                  {bookingError}
                </div>
              )}
              {bookingSuccess && (
                <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs rounded-r-lg font-medium">
                  {bookingSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Selected System</label>
                <input
                  type="text"
                  readOnly
                  value={systems.find(s => s.id === showBookingModal)?.name || showBookingModal}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Booking Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Hours Requested</label>
                  <select
                    value={bookingDuration}
                    onChange={(e) => setBookingDuration(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="1">1 Hour</option>
                    <option value="2">2 Hours</option>
                    <option value="3">3 Hours</option>
                    <option value="4">4 Hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Time Slot</label>
                <select
                  value={bookingTimeSlot}
                  onChange={(e) => setBookingTimeSlot(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                  <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                  <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                  <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Purpose of Use</label>
                <textarea
                  required
                  rows={2}
                  value={bookingPurpose}
                  onChange={(e) => setBookingPurpose(e.target.value)}
                  placeholder="Describe your research experiment or assignment..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10"
                >
                  Confirm Slot Booking
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4b. Add System Modal */}
      {showAddSysModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-slate-900 text-white p-6">
              <h4 className="font-bold text-lg">Add New Equipment Workspace</h4>
              <p className="text-xs text-slate-400 mt-1">Configure physical limits & thresholds for AI Agent monitoring.</p>
            </div>

            <form onSubmit={handleAddSystem} className="p-6 space-y-4">
              {sysFormError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-lg font-medium">
                  {sysFormError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">System Name</label>
                  <input
                    type="text"
                    required
                    value={newSysName}
                    onChange={(e) => setNewSysName(e.target.value)}
                    placeholder="e.g. Deep Learning Workstation 3"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Lab Location</label>
                  <select
                    value={newSysLab}
                    onChange={(e) => setNewSysLab(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Advanced Computing Lab">Advanced Computing Lab</option>
                    <option value="Electronics & Embedded Lab">Electronics & Embedded Lab</option>
                    <option value="Robotics & IoT Lab">Robotics & IoT Lab</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Current Usage (Hrs)</label>
                  <input
                    type="number"
                    required
                    value={newSysHours}
                    onChange={(e) => setNewSysHours(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Last Maintained</label>
                  <input
                    type="date"
                    required
                    value={newSysDate}
                    onChange={(e) => setNewSysDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Usage Threshold (Hrs)</label>
                  <input
                    type="number"
                    required
                    value={newSysThreshold}
                    onChange={(e) => setNewSysThreshold(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Safety Limit (Days)</label>
                  <input
                    type="number"
                    required
                    value={newSysLimit}
                    onChange={(e) => setNewSysLimit(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Specifications & Features</label>
                <textarea
                  rows={2}
                  value={newSysSpecs}
                  onChange={(e) => setNewSysSpecs(e.target.value)}
                  placeholder="e.g. 128GB RAM, Nvidia H100 GPU, Liquid Cooling..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10"
                >
                  Register System
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSysModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
