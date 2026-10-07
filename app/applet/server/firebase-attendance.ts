import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection 
} from "firebase/firestore";
import fs from "fs";
import path from "path";

// User's custom Firebase configuration (pencatatan-voucher-perusahaan)
export const USER_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDfIvUOLqAULR9eKy0rkqJfY_99Q4rxy2M",
  authDomain: "pencatatan-voucher-perusahaan.firebaseapp.com",
  databaseURL: "https://pencatatan-voucher-perusahaan-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pencatatan-voucher-perusahaan",
  storageBucket: "pencatatan-voucher-perusahaan.firebasestorage.app",
  messagingSenderId: "5344554002",
  appId: "1:5344554002:web:9137a500fbb8f3223b7ccb",
  measurementId: "G-1249N852Y5"
};

let userFirestoreDb: any = null;

export function initFirebaseFirestore() {
  try {
    if (userFirestoreDb) return userFirestoreDb;
    
    // Check if app already initialized
    let app: any;
    try {
      app = getApp("UserPencatatanVoucher");
    } catch {
      app = initializeApp(USER_FIREBASE_CONFIG, "UserPencatatanVoucher");
    }

    userFirestoreDb = getFirestore(app);
    console.log(`[Firebase] Connected to user's Firebase project: ${USER_FIREBASE_CONFIG.projectId}`);
    return userFirestoreDb;
  } catch (err: any) {
    console.error("[Firebase] Error initializing User Firestore:", err.message);
    return null;
  }
}

// 1. Sync current attendance state to user's Firestore (pencatatan-voucher-perusahaan)
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

    // 1. Save master attendance records snapshot
    if (state.attendanceRecords && state.attendanceRecords.length > 0) {
      await setDoc(doc(db, "attendance", "current_records"), {
        attendanceRecords: state.attendanceRecords,
        workers: state.workers || [],
        updatedAt: timestamp,
        totalWorkers: (state.workers || []).length,
        totalRecords: state.attendanceRecords.length
      }, { merge: true });
    }

    // 2. Save each weekly report to weekly_attendance_reports collection
    if (state.weeklyReports && state.weeklyReports.length > 0) {
      for (const rep of state.weeklyReports) {
        if (!rep) continue;
        const repId = rep.id || `rep_${rep.weekStartDate || Date.now()}`;
        await setDoc(doc(db, "weekly_attendance_reports", repId), {
          ...rep,
          syncedAt: timestamp
        }, { merge: true });
      }
    }

    console.log(`[Firebase] Successfully synced attendance & weekly reports to user's project (${USER_FIREBASE_CONFIG.projectId})!`);
    return true;
  } catch (err: any) {
    console.error("[Firebase] Error syncing attendance to user Firestore:", err.message);
    return false;
  }
}

// 2. Restore attendance state from user's Firestore on startup
export async function restoreAttendanceFromFirestore(currentState: any): Promise<any> {
  const db = initFirebaseFirestore();
  if (!db) return currentState;

  try {
    console.log(`[Firebase] Checking user project (${USER_FIREBASE_CONFIG.projectId}) for saved attendance data...`);
    const masterDocSnap = await getDoc(doc(db, "attendance", "current_records"));
    let updated = { ...currentState };
    let hasChanges = false;

    if (masterDocSnap.exists()) {
      const data = masterDocSnap.data();
      if (data && Array.isArray(data.attendanceRecords) && data.attendanceRecords.length > 0) {
        console.log(`[Firebase] Restoring ${data.attendanceRecords.length} attendance records from user's project.`);
        const mergedMap = new Map();
        data.attendanceRecords.forEach((r: any) => {
          if (r && r.workerId) mergedMap.set(r.workerId, r);
        });
        (currentState.attendanceRecords || []).forEach((r: any) => {
          if (r && r.workerId) {
            const cloud = mergedMap.get(r.workerId);
            if (!cloud) {
              mergedMap.set(r.workerId, r);
            } else {
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

    // Pull weekly reports from user's weekly_attendance_reports collection
    try {
      const reportsSnap = await getDocs(collection(db, "weekly_attendance_reports"));
      if (!reportsSnap.empty) {
        const cloudReports: any[] = [];
        reportsSnap.forEach(docSnap => {
          cloudReports.push(docSnap.data());
        });
        console.log(`[Firebase] Restoring ${cloudReports.length} weekly attendance reports from user's project.`);
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
    console.error("[Firebase] Error restoring attendance from user Firestore:", err.message);
    return currentState;
  }
}
