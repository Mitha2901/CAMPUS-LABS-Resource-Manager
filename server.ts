import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import Database from "better-sqlite3";

// Initialize express app
const app = express();
app.use(express.json());

const PORT = 3000;
const DB_SQLITE_FILE = path.join(process.cwd(), "database.db");

// Initialize SQLite Database
const sqliteDb = new Database(DB_SQLITE_FILE);
sqliteDb.pragma("journal_mode = WAL");

// Define basic interface schemas for state
interface User {
  id: string;
  username: string;
  passwordHash: string; // for simulation, we can match plain text safely
  role: "student" | "admin";
  fullName: string;
  department?: string;
}

interface Equipment {
  id: string;
  name: string;
  labName: string;
  totalUsageHours: number;
  lastMaintenanceDate: string; // YYYY-MM-DD
  status: "Available" | "In Use" | "Maintenance Required";
  usageThreshold: number; // default: 50 hrs
  maintenanceLimitDays: number; // default: 30 days
  specification: string;
}

interface Booking {
  id: string;
  systemId: string;
  systemName: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "09:00 AM - 11:00 AM"
  purpose: string;
  status: "Active" | "Completed" | "Cancelled";
  durationHours: number;
}

interface MaintenanceAlert {
  id: string;
  systemId: string;
  systemName: string;
  triggerReason: string;
  predictionDate: string; // YYYY-MM-DD
  severity: "High" | "Medium";
  isResolved: boolean;
  resolvedDate: string | null;
}

// Default Seed Data
const initialUsers: User[] = [
  { id: "std01", username: "student1", passwordHash: "student", role: "student", fullName: "Susmitha Govind", department: "Computer Science" },
  { id: "std02", username: "student2", passwordHash: "student", role: "student", fullName: "John Doe", department: "Electronics Engineering" },
  { id: "admin", username: "admin", passwordHash: "admin", role: "admin", fullName: "Prof. Raghavan", department: "Lab Administration" }
];

const initialEquipment: Equipment[] = [
  { id: "SYS-01", name: "High-Performance Workstation - PC 1", labName: "Advanced Computing Lab", totalUsageHours: 52, lastMaintenanceDate: "2026-06-15", status: "Maintenance Required", usageThreshold: 50, maintenanceLimitDays: 30, specification: "Intel Xeon 16-Core, 64GB RAM, RTX 4090 GPU" },
  { id: "SYS-02", name: "High-Performance Workstation - PC 2", labName: "Advanced Computing Lab", totalUsageHours: 24, lastMaintenanceDate: "2026-06-20", status: "Available", usageThreshold: 50, maintenanceLimitDays: 30, specification: "Intel Xeon 16-Core, 64GB RAM, RTX 4090 GPU" },
  { id: "SYS-03", name: "Digital Storage Oscilloscope", labName: "Electronics & Embedded Lab", totalUsageHours: 12, lastMaintenanceDate: "2026-05-10", status: "Maintenance Required", usageThreshold: 40, maintenanceLimitDays: 45, specification: "4 Channels, 200 MHz, 2 GSa/s Sample Rate" },
  { id: "SYS-04", name: "Industrial IoT Starter Kit", labName: "Robotics & IoT Lab", totalUsageHours: 8, lastMaintenanceDate: "2026-06-25", status: "Available", usageThreshold: 60, maintenanceLimitDays: 60, specification: "Raspberry Pi 4, Arduino Mega, Sensor Pack, ESP32 Modules" },
  { id: "SYS-05", name: "High-Precision 3D Printer", labName: "Robotics & IoT Lab", totalUsageHours: 41, lastMaintenanceDate: "2026-06-10", status: "Available", usageThreshold: 45, maintenanceLimitDays: 30, specification: "FDM Dual Extruder, Build volume 300x300x400mm" }
];

const initialBookings: Booking[] = [
  { id: "B-1001", systemId: "SYS-02", systemName: "High-Performance Workstation - PC 2", studentId: "std01", studentName: "Susmitha Govind", date: "2026-07-04", timeSlot: "11:00 AM - 01:00 PM", purpose: "Deep Learning Model Training", status: "Active", durationHours: 2 },
  { id: "B-1002", systemId: "SYS-04", systemName: "Industrial IoT Starter Kit", studentId: "std02", studentName: "John Doe", date: "2026-07-04", timeSlot: "02:00 PM - 04:00 PM", purpose: "ESP32 MQTT Broker Integration Practice", status: "Active", durationHours: 2 }
];

// Setup tables if they do not exist
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL,
    fullName TEXT NOT NULL,
    department TEXT
  );

  CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    labName TEXT NOT NULL,
    totalUsageHours REAL NOT NULL DEFAULT 0,
    lastMaintenanceDate TEXT NOT NULL,
    status TEXT NOT NULL,
    usageThreshold REAL NOT NULL DEFAULT 50,
    maintenanceLimitDays INTEGER NOT NULL DEFAULT 30,
    specification TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    systemId TEXT NOT NULL,
    systemName TEXT NOT NULL,
    studentId TEXT NOT NULL,
    studentName TEXT NOT NULL,
    date TEXT NOT NULL,
    timeSlot TEXT NOT NULL,
    purpose TEXT NOT NULL,
    status TEXT NOT NULL,
    durationHours REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    systemId TEXT NOT NULL,
    systemName TEXT NOT NULL,
    triggerReason TEXT NOT NULL,
    predictionDate TEXT NOT NULL,
    severity TEXT NOT NULL,
    isResolved INTEGER NOT NULL DEFAULT 0,
    resolvedDate TEXT
  );
`);

// Seed database tables if empty
function seedDatabase() {
  const userCount = (sqliteDb.prepare("SELECT COUNT(*) as count FROM users").get() as any).count;
  if (userCount === 0) {
    const insertUser = sqliteDb.prepare("INSERT INTO users (id, username, passwordHash, role, fullName, department) VALUES (?, ?, ?, ?, ?, ?)");
    for (const u of initialUsers) {
      insertUser.run(u.id, u.username, u.passwordHash, u.role, u.fullName, u.department || null);
    }
  }

  const equipCount = (sqliteDb.prepare("SELECT COUNT(*) as count FROM equipment").get() as any).count;
  if (equipCount === 0) {
    const insertEquip = sqliteDb.prepare("INSERT INTO equipment (id, name, labName, totalUsageHours, lastMaintenanceDate, status, usageThreshold, maintenanceLimitDays, specification) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const eq of initialEquipment) {
      insertEquip.run(eq.id, eq.name, eq.labName, eq.totalUsageHours, eq.lastMaintenanceDate, eq.status, eq.usageThreshold, eq.maintenanceLimitDays, eq.specification);
    }
  }

  const bookingCount = (sqliteDb.prepare("SELECT COUNT(*) as count FROM bookings").get() as any).count;
  if (bookingCount === 0) {
    const insertBooking = sqliteDb.prepare("INSERT INTO bookings (id, systemId, systemName, studentId, studentName, date, timeSlot, purpose, status, durationHours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const b of initialBookings) {
      insertBooking.run(b.id, b.systemId, b.systemName, b.studentId, b.studentName, b.date, b.timeSlot, b.purpose, b.status, b.durationHours);
    }
  }
}

seedDatabase();

// Helper to calculate days between two dates
function getDaysBetween(date1Str: string, date2Str: string): number {
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Database helper functions
function loadDatabase() {
  try {
    const usersRows = sqliteDb.prepare("SELECT * FROM users").all() as any[];
    const equipmentRows = sqliteDb.prepare("SELECT * FROM equipment").all() as any[];
    const bookingsRows = sqliteDb.prepare("SELECT * FROM bookings").all() as any[];
    const alertsRows = sqliteDb.prepare("SELECT * FROM alerts").all() as any[];

    const users: User[] = usersRows.map(u => ({
      id: u.id,
      username: u.username,
      passwordHash: u.passwordHash,
      role: u.role as "student" | "admin",
      fullName: u.fullName,
      department: u.department || undefined
    }));

    const equipment: Equipment[] = equipmentRows.map(e => ({
      id: e.id,
      name: e.name,
      labName: e.labName,
      totalUsageHours: Number(e.totalUsageHours),
      lastMaintenanceDate: e.lastMaintenanceDate,
      status: e.status as "Available" | "In Use" | "Maintenance Required",
      usageThreshold: Number(e.usageThreshold),
      maintenanceLimitDays: Number(e.maintenanceLimitDays),
      specification: e.specification
    }));

    const bookings: Booking[] = bookingsRows.map(b => ({
      id: b.id,
      systemId: b.systemId,
      systemName: b.systemName,
      studentId: b.studentId,
      studentName: b.studentName,
      date: b.date,
      timeSlot: b.timeSlot,
      purpose: b.purpose,
      status: b.status as "Active" | "Completed" | "Cancelled",
      durationHours: Number(b.durationHours)
    }));

    const alerts: MaintenanceAlert[] = alertsRows.map(a => ({
      id: a.id,
      systemId: a.systemId,
      systemName: a.systemName,
      triggerReason: a.triggerReason,
      predictionDate: a.predictionDate,
      severity: a.severity as "High" | "Medium",
      isResolved: Boolean(a.isResolved),
      resolvedDate: a.resolvedDate
    }));

    return { users, equipment, bookings, alerts };
  } catch (err) {
    console.error("Error loading SQLite database, returning fallback data...", err);
    return {
      users: initialUsers,
      equipment: initialEquipment,
      bookings: initialBookings,
      alerts: [] as MaintenanceAlert[]
    };
  }
}

function saveDatabase(data: any) {
  const transaction = sqliteDb.transaction(() => {
    // Save users
    sqliteDb.prepare("DELETE FROM users").run();
    const insertUser = sqliteDb.prepare("INSERT INTO users (id, username, passwordHash, role, fullName, department) VALUES (?, ?, ?, ?, ?, ?)");
    for (const u of data.users) {
      insertUser.run(u.id, u.username, u.passwordHash, u.role, u.fullName, u.department || null);
    }

    // Save equipment
    sqliteDb.prepare("DELETE FROM equipment").run();
    const insertEquip = sqliteDb.prepare("INSERT INTO equipment (id, name, labName, totalUsageHours, lastMaintenanceDate, status, usageThreshold, maintenanceLimitDays, specification) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const eq of data.equipment) {
      insertEquip.run(eq.id, eq.name, eq.labName, eq.totalUsageHours, eq.lastMaintenanceDate, eq.status, eq.usageThreshold, eq.maintenanceLimitDays, eq.specification);
    }

    // Save bookings
    sqliteDb.prepare("DELETE FROM bookings").run();
    const insertBooking = sqliteDb.prepare("INSERT INTO bookings (id, systemId, systemName, studentId, studentName, date, timeSlot, purpose, status, durationHours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const b of data.bookings) {
      insertBooking.run(b.id, b.systemId, b.systemName, b.studentId, b.studentName, b.date, b.timeSlot, b.purpose, b.status, b.durationHours);
    }

    // Save alerts
    sqliteDb.prepare("DELETE FROM alerts").run();
    const insertAlert = sqliteDb.prepare("INSERT INTO alerts (id, systemId, systemName, triggerReason, predictionDate, severity, isResolved, resolvedDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for (const a of data.alerts) {
      insertAlert.run(a.id, a.systemId, a.systemName, a.triggerReason, a.predictionDate, a.severity, a.isResolved ? 1 : 0, a.resolvedDate || null);
    }
  });

  try {
    transaction();
  } catch (err) {
    console.error("Error saving to SQLite database:", err);
  }
}

// Run AI Rule engine on all equipment to keep status and alerts synchronized
function runAIRuleEngineOnAll() {
  const db = loadDatabase();
  const todayStr = new Date().toISOString().split("T")[0];
  let alertsUpdated = false;

  db.equipment.forEach((sys: Equipment) => {
    const daysSince = getDaysBetween(sys.lastMaintenanceDate, todayStr);
    const hoursExceeded = sys.totalUsageHours > sys.usageThreshold;
    const daysExceeded = daysSince > sys.maintenanceLimitDays;

    if (hoursExceeded || daysExceeded) {
      // It needs maintenance!
      if (sys.status !== "Maintenance Required") {
        sys.status = "Maintenance Required";
        
        // Check if an unresolved alert already exists for this system
        const alertExists = db.alerts.some((a: MaintenanceAlert) => a.systemId === sys.id && !a.isResolved);
        if (!alertExists) {
          const reason = hoursExceeded 
            ? `AI Agent Prediction: Usage hours (${sys.totalUsageHours} hrs) has crossed the threshold limit of ${sys.usageThreshold} hrs.`
            : `AI Agent Prediction: ${daysSince} days have passed since last maintenance, exceeding safety threshold of ${sys.maintenanceLimitDays} days.`;

          db.alerts.push({
            id: `A-${Date.now()}-${sys.id}`,
            systemId: sys.id,
            systemName: sys.name,
            triggerReason: reason,
            predictionDate: todayStr,
            severity: hoursExceeded ? "High" : "Medium",
            isResolved: false,
            resolvedDate: null
          });
        }
        alertsUpdated = true;
      }
    } else {
      // System is in good shape rule-wise
      if (sys.status === "Maintenance Required") {
        // Resolve status back to Available
        sys.status = "Available";
        alertsUpdated = true;
      }
    }
  });

  if (alertsUpdated) {
    saveDatabase(db);
  }
  return db;
}

// Initialize Gemini Client Lazily & Safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Run first rule evaluation
runAIRuleEngineOnAll();

// ================= API ENDPOINTS =================

// 1. Authentication
app.post("/api/auth/login", (req, res) => {
  const { username, password, role } = req.body;
  const db = loadDatabase();
  
  const user = db.users.find(
    (u: User) => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.passwordHash === password &&
      u.role === role
  );

  if (user) {
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department
      }
    });
  } else {
    res.status(401).json({ success: false, message: "Invalid username, password, or role selection." });
  }
});

// 2. Systems (Equipment)
app.get("/api/systems", (req, res) => {
  const db = runAIRuleEngineOnAll();
  res.json(db.equipment);
});

app.post("/api/systems", (req, res) => {
  const { name, labName, totalUsageHours, lastMaintenanceDate, usageThreshold, maintenanceLimitDays, specification } = req.body;
  const db = loadDatabase();
  
  const newSystem: Equipment = {
    id: `SYS-${Date.now().toString().slice(-4)}`,
    name,
    labName,
    totalUsageHours: Number(totalUsageHours) || 0,
    lastMaintenanceDate: lastMaintenanceDate || new Date().toISOString().split("T")[0],
    status: "Available",
    usageThreshold: Number(usageThreshold) || 50,
    maintenanceLimitDays: Number(maintenanceLimitDays) || 30,
    specification: specification || ""
  };

  db.equipment.push(newSystem);
  saveDatabase(db);
  
  // Re-run rules to verify if it is immediately flag-worthy
  const updatedDb = runAIRuleEngineOnAll();
  res.json({ success: true, system: newSystem, systems: updatedDb.equipment });
});

app.put("/api/systems/:id", (req, res) => {
  const { id } = req.params;
  const { name, labName, totalUsageHours, lastMaintenanceDate, usageThreshold, maintenanceLimitDays, specification, status } = req.body;
  const db = loadDatabase();

  const idx = db.equipment.findIndex((sys: Equipment) => sys.id === id);
  if (idx !== -1) {
    db.equipment[idx] = {
      ...db.equipment[idx],
      name: name !== undefined ? name : db.equipment[idx].name,
      labName: labName !== undefined ? labName : db.equipment[idx].labName,
      totalUsageHours: totalUsageHours !== undefined ? Number(totalUsageHours) : db.equipment[idx].totalUsageHours,
      lastMaintenanceDate: lastMaintenanceDate !== undefined ? lastMaintenanceDate : db.equipment[idx].lastMaintenanceDate,
      usageThreshold: usageThreshold !== undefined ? Number(usageThreshold) : db.equipment[idx].usageThreshold,
      maintenanceLimitDays: maintenanceLimitDays !== undefined ? Number(maintenanceLimitDays) : db.equipment[idx].maintenanceLimitDays,
      specification: specification !== undefined ? specification : db.equipment[idx].specification,
      status: status !== undefined ? status : db.equipment[idx].status
    };
    saveDatabase(db);
    const updatedDb = runAIRuleEngineOnAll();
    res.json({ success: true, system: updatedDb.equipment[idx] });
  } else {
    res.status(404).json({ success: false, message: "System not found" });
  }
});

app.delete("/api/systems/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();

  const initialLength = db.equipment.length;
  db.equipment = db.equipment.filter((sys: Equipment) => sys.id !== id);
  
  if (db.equipment.length < initialLength) {
    // Delete associated alerts too
    db.alerts = db.alerts.filter((a: MaintenanceAlert) => a.systemId !== id);
    // Cancel bookings for this system
    db.bookings = db.bookings.map((b: Booking) => {
      if (b.systemId === id && b.status === "Active") {
        return { ...b, status: "Cancelled" as const };
      }
      return b;
    });
    saveDatabase(db);
    res.json({ success: true, message: "System deleted successfully." });
  } else {
    res.status(404).json({ success: false, message: "System not found." });
  }
});

// Admin command: Mark equipment as maintained
app.post("/api/systems/:id/maintain", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  const todayStr = new Date().toISOString().split("T")[0];

  const idx = db.equipment.findIndex((sys: Equipment) => sys.id === id);
  if (idx !== -1) {
    db.equipment[idx].totalUsageHours = 0;
    db.equipment[idx].lastMaintenanceDate = todayStr;
    db.equipment[idx].status = "Available";

    // Resolve any pending alerts for this system
    db.alerts = db.alerts.map((a: MaintenanceAlert) => {
      if (a.systemId === id && !a.isResolved) {
        return { ...a, isResolved: true, resolvedDate: todayStr };
      }
      return a;
    });

    saveDatabase(db);
    res.json({ success: true, system: db.equipment[idx], alerts: db.alerts });
  } else {
    res.status(404).json({ success: false, message: "System not found." });
  }
});

// 3. Bookings
app.get("/api/bookings", (req, res) => {
  const db = loadDatabase();
  res.json(db.bookings);
});

app.post("/api/bookings", (req, res) => {
  const { systemId, studentId, studentName, date, timeSlot, purpose, durationHours } = req.body;
  const db = loadDatabase();

  // Find system
  const system = db.equipment.find((sys: Equipment) => sys.id === systemId);
  if (!system) {
    return res.status(404).json({ success: false, message: "System not found." });
  }

  if (system.status === "Maintenance Required") {
    return res.status(400).json({ 
      success: false, 
      message: "Booking rejected: This system requires maintenance as per AI predictive threshold. Booking is disabled until maintenance is completed." 
    });
  }

  // Check if system is already booked on this date and time slot
  const isConflict = db.bookings.some((b: Booking) => 
    b.systemId === systemId && 
    b.date === date && 
    b.timeSlot === timeSlot &&
    b.status === "Active"
  );

  if (isConflict) {
    return res.status(400).json({ success: false, message: "Booking conflict: System is already booked for this date and time slot." });
  }

  const hours = Number(durationHours) || 2;
  const newBooking: Booking = {
    id: `B-${Date.now().toString().slice(-4)}`,
    systemId,
    systemName: system.name,
    studentId,
    studentName,
    date,
    timeSlot,
    purpose,
    status: "Active",
    durationHours: hours
  };

  // Add the booking
  db.bookings.push(newBooking);

  // Since a booking is scheduled, simulate its usage hours immediately or when completed.
  // For the purpose of immediate, fun project demonstration, we add the duration hours to the system's usage hours,
  // which might trigger the rule-based AI system status change instantly!
  system.totalUsageHours += hours;
  if (system.status === "Available") {
    system.status = "In Use";
  }

  saveDatabase(db);
  
  // Re-run rules
  const updatedDb = runAIRuleEngineOnAll();

  res.json({ 
    success: true, 
    booking: newBooking, 
    system: updatedDb.equipment.find((s: Equipment) => s.id === systemId)
  });
});

app.post("/api/bookings/:id/cancel", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();

  const booking = db.bookings.find((b: Booking) => b.id === id);
  if (booking) {
    booking.status = "Cancelled";
    
    // If cancelling, reduce hours back from system usage
    const system = db.equipment.find((sys: Equipment) => sys.id === booking.systemId);
    if (system) {
      system.totalUsageHours = Math.max(0, system.totalUsageHours - booking.durationHours);
      if (system.status === "In Use") {
        system.status = "Available";
      }
    }

    saveDatabase(db);
    const updatedDb = runAIRuleEngineOnAll();
    res.json({ success: true, booking, systems: updatedDb.equipment });
  } else {
    res.status(404).json({ success: false, message: "Booking not found." });
  }
});

// Complete Booking - simulates that usage occurred and releases the device back to Available (or Maintenance Required if triggered)
app.post("/api/bookings/:id/complete", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();

  const booking = db.bookings.find((b: Booking) => b.id === id);
  if (booking) {
    booking.status = "Completed";
    
    const system = db.equipment.find((sys: Equipment) => sys.id === booking.systemId);
    if (system && system.status === "In Use") {
      system.status = "Available";
    }

    saveDatabase(db);
    const updatedDb = runAIRuleEngineOnAll();
    res.json({ success: true, booking, systems: updatedDb.equipment });
  } else {
    res.status(404).json({ success: false, message: "Booking not found." });
  }
});

// 4. Maintenance Alerts
app.get("/api/alerts", (req, res) => {
  const db = runAIRuleEngineOnAll();
  res.json(db.alerts);
});

// 5. Reports & Analytics
app.get("/api/reports", (req, res) => {
  const db = runAIRuleEngineOnAll();
  
  const totalSystems = db.equipment.length;
  const availableSystems = db.equipment.filter((s: Equipment) => s.status === "Available").length;
  const inUseSystems = db.equipment.filter((s: Equipment) => s.status === "In Use").length;
  const maintenanceRequired = db.equipment.filter((s: Equipment) => s.status === "Maintenance Required").length;

  const totalBookings = db.bookings.length;
  const activeBookings = db.bookings.filter((b: Booking) => b.status === "Active").length;
  const completedBookings = db.bookings.filter((b: Booking) => b.status === "Completed").length;

  // Usage by lab
  const labs: Record<string, { systemCount: number; totalHours: number; bookingCount: number }> = {};
  db.equipment.forEach((sys: Equipment) => {
    if (!labs[sys.labName]) {
      labs[sys.labName] = { systemCount: 0, totalHours: 0, bookingCount: 0 };
    }
    labs[sys.labName].systemCount += 1;
    labs[sys.labName].totalHours += sys.totalUsageHours;
  });

  db.bookings.forEach((b: Booking) => {
    const sys = db.equipment.find((s: Equipment) => s.id === b.systemId);
    if (sys && labs[sys.labName]) {
      labs[sys.labName].bookingCount += 1;
    }
  });

  const labReport = Object.keys(labs).map(lab => ({
    labName: lab,
    systemCount: labs[lab].systemCount,
    totalUsageHours: labs[lab].totalHours,
    bookingCount: labs[lab].bookingCount,
    utilizationIndex: Math.round((labs[lab].totalHours / (labs[lab].systemCount * 100)) * 100) || 0
  }));

  res.json({
    summary: {
      totalSystems,
      availableSystems,
      inUseSystems,
      maintenanceRequired,
      totalBookings,
      activeBookings,
      completedBookings
    },
    labReport,
    systemsDetail: db.equipment.map((sys: Equipment) => ({
      id: sys.id,
      name: sys.name,
      usageHours: sys.totalUsageHours,
      threshold: sys.usageThreshold,
      percentage: Math.round((sys.totalUsageHours / sys.usageThreshold) * 100)
    }))
  });
});

// 6. Gemini-powered SMARTLAB Assistant Chat Route
app.post("/api/chat", async (req, res) => {
  const { message, chatHistory } = req.body;
  const db = runAIRuleEngineOnAll();

  // Extract simple stats context
  const maintenanceSystems = db.equipment.filter((s: Equipment) => s.status === "Maintenance Required").map(s => `${s.name} (${s.id}) in ${s.labName}`);
  const activeBookings = db.bookings.filter((b: Booking) => b.status === "Active").map(b => `${b.studentName} booked ${b.systemName} on ${b.date} during ${b.timeSlot}`);
  const systemSummaries = db.equipment.map(s => `- ${s.name} (${s.id}) [${s.labName}]: Status is ${s.status}, Usage is ${s.totalUsageHours}/${s.usageThreshold} hrs.`);

  const systemContext = `
The Laboratory Resource Hub status is as follows:
Current Systems:
${systemSummaries.join("\n")}

Active Bookings:
${activeBookings.length > 0 ? activeBookings.join("\n") : "None current"}

Systems Requiring Maintenance:
${maintenanceSystems.length > 0 ? maintenanceSystems.join("\n") : "All systems are working fine!"}

The automated rules-engine triggers "Maintenance Required" when usage exceeds threshold or last maintenance was over limit.
`;

  const gemini = getGeminiClient();

  if (!gemini) {
    // Simulated rule-based assistant if API key is not configured
    const lowMsg = message.toLowerCase();
    let reply = "I am the Lab Operations Desk Coordinator. Please configure your Gemini API Key in the Secrets tab to unlock full conversational assistance! Here is our current status report:\n\n";
    
    if (lowMsg.includes("maintenance") || lowMsg.includes("alert") || lowMsg.includes("broken") || lowMsg.includes("repair")) {
      reply += `Currently, there are **${maintenanceSystems.length}** equipment requiring maintenance:\n` + 
               (maintenanceSystems.length > 0 ? maintenanceSystems.map(s => `• ${s}`).join("\n") : "• All devices are operating normally.");
    } else if (lowMsg.includes("booking") || lowMsg.includes("booked") || lowMsg.includes("schedule")) {
      reply += `Active bookings: **${activeBookings.length}** active slots:\n` + 
               (activeBookings.length > 0 ? activeBookings.map(b => `• ${b}`).join("\n") : "• No system is currently occupied.");
    } else if (lowMsg.includes("system") || lowMsg.includes("pc") || lowMsg.includes("lab")) {
      reply += "Here are the registered laboratory resources:\n" + db.equipment.map(s => `• **${s.name}** [${s.status}] - Total Usage: ${s.totalUsageHours} hours`).join("\n");
    } else {
      reply += "How can I assist you? You can ask me about 'maintenance requirements', 'available systems', or 'current bookings'. Add your GEMINI_API_KEY to ask me complex scheduling optimizations!";
    }
    return res.json({ response: reply, isSimulated: true });
  }

  try {
    const formattedHistory = (chatHistory || []).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: msg.content }]
    }));

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...formattedHistory,
        { text: message }
      ],
      config: {
        systemInstruction: `You are "Lab Helpdesk Coordinator" - a professional collegiate laboratory resource manager.
You possess full access to the real-time laboratory databases.
Here is your live lab state data:
${systemContext}

Your goals:
1. Help students find available hardware, check time slots, and explain why booking systems with status "Maintenance Required" is disabled.
2. Help Admins check which devices are flagged for safety maintenance and summarize usage statistics.
3. Keep answers highly professional, supportive, clear, polite, and focused on college laboratory scheduling. No robotic or sci-fi sci-fi sounding jargon.
4. Refrain from listing json paths, and act as a helpful human operations manager.`,
        temperature: 0.7,
      }
    });

    res.json({ response: response.text || "I was unable to generate a response.", isSimulated: false });
  } catch (err: any) {
    console.error("Gemini Chat Error:", err);
    res.status(500).json({ error: "Conversational model error.", message: err.message });
  }
});

// 7. Java Source Files Code Endpoint
app.get("/api/java-code", (req, res) => {
  const javaDir = path.join(process.cwd(), "java-src");
  const files: Record<string, string> = {};

  function traverseDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const list = fs.readdirSync(dir);
    list.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        traverseDir(fullPath);
      } else {
        const relativePath = path.relative(javaDir, fullPath);
        files[relativePath] = fs.readFileSync(fullPath, "utf-8");
      }
    });
  }

  traverseDir(javaDir);
  res.json(files);
});

// Vite Setup for Development vs Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Laboratory Resource Hub Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
