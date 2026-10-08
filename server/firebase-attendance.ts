import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  limit 
} from "firebase/firestore";
import fs from "fs";
import path from "path";

// Read Firebase applet config
let firestoreDb: any = null;

export function initFirebaseFirestore() {
  try {
    if (firestoreDb) return firestoreDb;
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      console.warn("[Firebase] Config file not found at", configPath);
      return null;
    }
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp({
      apiKey: cfg.apiKey,
      projectId: cfg.projectId,
      authDomain: cfg.authDomain,
      storageBucket: cfg.storageBucket,
      messagingSenderId: cfg.messagingSenderId
    });

    const dbId = cfg.firestoreDatabaseId || "(default)";
    firestoreDb = getFirestore(app, dbId);
    console.log(`[Firebase] Firestore initialized successfully with database: ${dbId}`);
    return firestoreDb;
  } catch (err: any) {
    console.error("[Firebase] Error initializing Firestore:", err.message);
    return null;
  }
}

// 1. Sync current attendance state to Firestore
export async function syncAttendanceToFirestore(state: {
  attendanceRecords?: any[];
  workers?: any[];
  weeklyReports?: any[];
  attendanceLogs?: any[];
}) {
  const db = initFirebaseFirestore();
  if (!db) return false;

  try {
    const timestamp = new Date().toISOString();

    // 1. Save master attendance records snapshot (strip falsy attendance dates)
    if (state.attendanceRecords && state.attendanceRecords.length > 0) {
      const cleaned = state.attendanceRecords.map((r: any) => {
        const cleanAtt: Record<string, boolean> = {};
        if (r && r.attendance) {
          Object.entries(r.attendance).forEach(([d, val]) => {
            if (val === true) cleanAtt[d] = true;
          });
        }
        return {
          ...r,
          attendance: cleanAtt
        };
      });

      await setDoc(doc(db, "attendance", "current_records"), {
        attendanceRecords: cleaned,
        workers: state.workers || [],
        updatedAt: timestamp,
        totalWorkers: (state.workers || []).length,
        totalRecords: cleaned.length
      }, { merge: true });
    }

    // 2. Save each weekly report to weekly_attendance_reports & weekly_reports collections
    if (state.weeklyReports && state.weeklyReports.length > 0) {
      for (const rep of state.weeklyReports) {
        if (!rep) continue;
        const repId = rep.id || `rep_${rep.weekStartDate || Date.now()}`;
        const repData = {
          ...rep,
          syncedAt: timestamp
        };
        await setDoc(doc(db, "weekly_attendance_reports", repId), repData, { merge: true });
        await setDoc(doc(db, "weekly_reports", repId), repData, { merge: true });
      }
    }

    console.log("[Firebase] Successfully synchronized attendance & weekly reports to Firestore!");
    return true;
  } catch (err: any) {
    console.error("[Firebase] Error syncing attendance to Firestore:", err.message);
    return false;
  }
}

// 2. Restore attendance state from Firestore on startup
export async function restoreAttendanceFromFirestore(currentState: any): Promise<any> {
  const db = initFirebaseFirestore();
  if (!db) return currentState;

  try {
    console.log("[Firebase] Checking Firestore for saved attendance data...");
    const masterDocSnap = await getDoc(doc(db, "attendance", "current_records"));
    let updated = { ...currentState };
    let hasChanges = false;

    if (masterDocSnap.exists()) {
      const data = masterDocSnap.data();
      if (data && Array.isArray(data.attendanceRecords) && data.attendanceRecords.length > 0) {
        console.log(`[Firebase] Restoring ${data.attendanceRecords.length} attendance records from Firestore.`);
        // Merge attendance records: keep any newer local records, but restore all from Firestore
        const mergedMap = new Map();
        // First put cloud records
        data.attendanceRecords.forEach((r: any) => {
          if (r && r.workerId) mergedMap.set(r.workerId, r);
        });
        // Then overlay any existing local records
        (currentState.attendanceRecords || []).forEach((r: any) => {
          if (r && r.workerId) {
            const cloud = mergedMap.get(r.workerId);
            if (!cloud) {
              mergedMap.set(r.workerId, r);
            } else {
              // merge attendance dates
              mergedMap.set(r.workerId, {
                ...cloud,
                ...r,
                attendance: { ...(cloud.attendance || {}), ...(r.attendance || {}) },
                customStatus: { ...(cloud.customStatus || {}), ...(r.customStatus || {}) },
                reasons: { ...(cloud.reasons || {}), ...(r.reasons || {}) }
              });
            }
          }
        });
        updated.attendanceRecords = Array.from(mergedMap.values());
        hasChanges = true;
      }
    }

    // Also pull weekly reports from weekly_attendance_reports collection
    try {
      const reportsSnap = await getDocs(collection(db, "weekly_attendance_reports"));
      if (!reportsSnap.empty) {
        const cloudReports: any[] = [];
        reportsSnap.forEach(docSnap => {
          cloudReports.push(docSnap.data());
        });
        console.log(`[Firebase] Restoring ${cloudReports.length} weekly attendance reports from Firestore.`);
        const repMap = new Map();
        (currentState.weeklyReports || []).forEach((r: any) => {
          if (r) {
            const key = r.id || `${r.weekStartDate}_${r.weekEndDate}`;
            repMap.set(key, r);
          }
        });
        cloudReports.forEach((r: any) => {
          if (r) {
            const key = r.id || `${r.weekStartDate}_${r.weekEndDate}`;
            repMap.set(key, { ...(repMap.get(key) || {}), ...r });
          }
        });
        updated.weeklyReports = Array.from(repMap.values());
        hasChanges = true;
      }
    } catch (err: any) {
      console.warn("[Firebase] Could not fetch weekly_attendance_reports collection:", err.message);
    }

    return hasChanges ? updated : currentState;
  } catch (err: any) {
    console.error("[Firebase] Error restoring attendance from Firestore:", err.message);
    return currentState;
  }
}
