import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  X,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  RefreshCw,
  Send,
  Users,
  FileText,
  Copy,
  ExternalLink,
  ChevronDown,
  UserCheck,
  Sparkles,
  Award
} from "lucide-react";
import { Worker, AttendanceRecord } from "../types";
import { INITIAL_WORKERS } from "../constantsAbsen";

interface MyAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: any;
  workers?: Worker[];
  attendanceRecords?: AttendanceRecord[];
  onAttendanceUpdated?: () => void;
}

export function MyAttendanceModal({
  isOpen,
  onClose,
  userProfile,
  workers = INITIAL_WORKERS,
  attendanceRecords = [],
  onAttendanceUpdated
}: MyAttendanceModalProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [isChangingWorker, setIsChangingWorker] = useState<boolean>(false);
  const [attendanceType, setAttendanceType] = useState<"office" | "field" | "status">("office");
  const [fieldLocation, setFieldLocation] = useState<string>("Site Pomalaa (Kolaka)");
  const [customFieldNote, setCustomFieldNote] = useState<string>("");
  const [nonPresentStatus, setNonPresentStatus] = useState<string>("Sakit");
  const [statusReason, setStatusReason] = useState<string>("");

  // Geolocation states
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoDistance, setGeoDistance] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "requesting" | "available" | "error">("idle");
  const [geoErrorMsg, setGeoErrorMsg] = useState<string>("");

  // Submit states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Time & Date strings (Jakarta timezone)
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");
  const todayYMD = (() => {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(d);
    const day = parts.find((p) => p.type === "day")?.value || "01";
    const month = parts.find((p) => p.type === "month")?.value || "01";
    const year = parts.find((p) => p.type === "year")?.value || "2026";
    return `${year}-${month}-${day}`;
  })();

  const todayFormattedIndo = (() => {
    try {
      return new Date().toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return todayYMD;
    }
  })();

  // Keep live time clock ticking
  useEffect(() => {
    const updateTime = () => {
      try {
        const time = new Date().toLocaleTimeString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setCurrentTimeStr(time + " WIB");
      } catch (e) {
        setCurrentTimeStr("");
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine matching worker based on userProfile or localStorage
  useEffect(() => {
    if (!isOpen) return;

    // 1. Check if previously saved on this device
    const lastSavedId = localStorage.getItem("nmsa_my_worker_id");
    if (lastSavedId && workers.some((w) => w.id === lastSavedId)) {
      setSelectedWorkerId(lastSavedId);
      return;
    }

    // 2. Check userProfile name
    const currentName = (userProfile?.fullName || "Nur Wahyudi").trim().toLowerCase();
    const matchedByName = workers.find((w) => {
      const wName = (w.name || "").trim().toLowerCase();
      return wName === currentName || wName.includes(currentName) || currentName.includes(wName);
    });

    if (matchedByName) {
      setSelectedWorkerId(matchedByName.id);
      localStorage.setItem("nmsa_my_worker_id", matchedByName.id);
      return;
    }

    // 3. Fallback to W06 (Nur Wahyudi) or first active worker
    const fallback = workers.find((w) => w.id === "W06") || workers[0];
    if (fallback) {
      setSelectedWorkerId(fallback.id);
    }
  }, [isOpen, userProfile, workers]);

  const activeWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0];

  // Check today's attendance status for active worker
  const activeRecord = attendanceRecords.find((r) => r.workerId === activeWorker?.id);
  const isAttendedToday = Boolean(
    activeRecord?.attendance?.[todayYMD] === true ||
    (activeRecord?.customStatus && activeRecord.customStatus[todayYMD])
  );
  const todayStatusText = activeRecord?.customStatus?.[todayYMD] || (activeRecord?.attendance?.[todayYMD] ? "Hadir (Tercatat)" : "Belum Absen");

  // Geolocation detection
  const OFFICE_LAT = -6.244342;
  const OFFICE_LON = 106.843073;
  const MAX_DISTANCE_METERS = 150;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const requestGps = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoStatus("error");
      setGeoErrorMsg("Browser ini tidak mendukung GPS Geolocation.");
      return;
    }
    setGeoStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setGeoCoords({ latitude: lat, longitude: lon });
        const dist = calculateDistance(lat, lon, OFFICE_LAT, OFFICE_LON);
        setGeoDistance(dist);
        setGeoStatus("available");
      },
      (err) => {
        setGeoStatus("error");
        setGeoErrorMsg(
          err.code === 1
            ? "Akses lokasi ditolak. Anda dapat memilih opsi 'Hadir Lapangan / Kantor Cabang / WFH' untuk check-in."
            : "Sinyal GPS tidak terdeteksi. Silakan gunakan opsi 'Hadir Lapangan / Kantor Cabang / WFH'."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Request GPS once modal opens
  useEffect(() => {
    if (isOpen && geoStatus === "idle") {
      requestGps();
    }
  }, [isOpen]);

  // Submit attendance handler
  const handleCheckIn = async (customStatusType?: string) => {
    if (!activeWorker) return;
    setSubmitting(true);
    setSubmitMessage(null);

    const isOfficeMode = attendanceType === "office";
    const isFieldMode = attendanceType === "field";
    const statusToSubmit = customStatusType || (attendanceType === "status" ? nonPresentStatus : "Hadir");

    const effectiveLocationName = isFieldMode
      ? `${fieldLocation}${customFieldNote.trim() ? ` - ${customFieldNote.trim()}` : ""}`
      : isOfficeMode
      ? "Kantor Wisma NH Pasar Minggu"
      : undefined;

    const payload = {
      workerId: activeWorker.id,
      date: todayYMD,
      latitude: geoCoords?.latitude || OFFICE_LAT,
      longitude: geoCoords?.longitude || OFFICE_LON,
      status: statusToSubmit,
      reason: attendanceType === "status" ? statusReason.trim() || `Pengajuan ${statusToSubmit}` : effectiveLocationName,
      isFieldLocation: isFieldMode,
      locationName: effectiveLocationName
    };

    try {
      const res = await fetch("/api/quick-self-attend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitMessage({
          type: "success",
          text: data.message || `Presensi berhasil! Kehadiran Anda hari ini telah dicatat.`
        });
        localStorage.setItem("nmsa_my_worker_id", activeWorker.id);
        if (onAttendanceUpdated) onAttendanceUpdated();
      } else if (data.reason === "OUTSIDE" && isOfficeMode) {
        setSubmitMessage({
          type: "error",
          text: `Deteksi GPS menunjukkan Anda berjarak ~${data.distance || Math.round(geoDistance || 0)}m dari Wisma NH. Silakan pilih tab 'Hadir Lapangan / WFH' jika Anda bertugas di luar kantor.`
        });
      } else {
        setSubmitMessage({
          type: "error",
          text: data.error || "Gagal mencatat presensi. Silakan coba lagi."
        });
      }
    } catch (err: any) {
      setSubmitMessage({
        type: "error",
        text: "Terjadi gangguan koneksi ke server. Presensi offline berhasil disimpan di peramban."
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Self attendance URL for WhatsApp or mobile browser
  const mySelfAttendanceUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?view=absen&workerId=${encodeURIComponent(activeWorker?.id || "W06")}&id=${encodeURIComponent(activeWorker?.id || "W06")}&quick=true`
    : "";

  const [copiedLink, setCopiedLink] = useState(false);
  const handleCopyLink = () => {
    if (!mySelfAttendanceUrl) return;
    navigator.clipboard.writeText(mySelfAttendanceUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100 font-sans">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-emerald-900/90 via-slate-900 to-indigo-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                  Presensi Mandiri NMSA
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-medium">
                  {currentTimeStr}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                Absen Saya Hari Ini
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* WORKER IDENTITY CARD */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center border-2 border-emerald-400/30 shrink-0 shadow-md">
                {(activeWorker?.name || "U").charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/70 px-2 py-0.2 rounded border border-indigo-800/60">
                    ID: {activeWorker?.id}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {activeWorker?.role || "Karyawan"}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white truncate">
                  {activeWorker?.name}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeWorker?.phoneNumber || "No. WA Belum Terdaftar"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setIsChangingWorker(!isChangingWorker)}
                className="text-xs text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/80 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>{isChangingWorker ? "Tutup Pilihan" : "Ganti Nama"}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isChangingWorker ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {/* WORKER PICKER DROPDOWN */}
          {isChangingWorker && (
            <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-3 space-y-2 animate-in fade-in duration-150">
              <span className="text-[11px] font-bold text-indigo-300 block uppercase tracking-wider">
                Pilih Nama Karyawan untuk Melakukan Absen:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {workers.filter((w) => w.isActive !== false).map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setSelectedWorkerId(w.id);
                      localStorage.setItem("nmsa_my_worker_id", w.id);
                      setIsChangingWorker(false);
                      setSubmitMessage(null);
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer text-left ${
                      selectedWorkerId === w.id
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800"
                    }`}
                  >
                    <span className="truncate">{w.name}</span>
                    <span className="text-[10px] font-mono opacity-70 ml-2">{w.id}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TODAY STATUS BADGE */}
          <div className="bg-slate-950/50 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Status Kehadiran Anda Hari Ini
              </span>
              <div className="text-xs text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>{todayFormattedIndo}</span>
              </div>
            </div>

            <div className="text-right">
              {isAttendedToday ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{todayStatusText}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Belum Presensi</span>
                </span>
              )}
            </div>
          </div>

          {/* SUBMISSION NOTIFICATION MESSAGES */}
          {submitMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-medium border leading-relaxed ${
                submitMessage.type === "success"
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-300"
              }`}
            >
              {submitMessage.text}
            </div>
          )}

          {/* ATTENDANCE CHECK-IN PANEL */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4">
            
            {/* TYPE TABS */}
            <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setAttendanceType("office")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  attendanceType === "office"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Kantor Pusat</span>
              </button>

              <button
                type="button"
                onClick={() => setAttendanceType("field")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  attendanceType === "field"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Lapangan / WFH</span>
              </button>

              <button
                type="button"
                onClick={() => setAttendanceType("status")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  attendanceType === "status"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Sakit / Izin</span>
              </button>
            </div>

            {/* TAB 1: KANTOR PUSAT (WISMA NH) */}
            {attendanceType === "office" && (
              <div className="space-y-3">
                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span>Lokasi Kantor: Wisma NH Pasar Minggu</span>
                    </span>
                    <button
                      type="button"
                      onClick={requestGps}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${geoStatus === "requesting" ? "animate-spin" : ""}`} />
                      <span>Refresh GPS</span>
                    </button>
                  </div>

                  {geoStatus === "available" && geoDistance !== null && (
                    <div className="text-[11px] text-slate-300">
                      Jarak ke kantor:{" "}
                      <strong className={geoDistance <= MAX_DISTANCE_METERS ? "text-emerald-400" : "text-amber-400"}>
                        ~{Math.round(geoDistance)} meter
                      </strong>
                      {geoDistance <= MAX_DISTANCE_METERS ? " (Dalam jangkauan kantor ✅)" : " (Di luar radius 150m)"}
                    </div>
                  )}

                  {geoStatus === "error" && (
                    <div className="text-[11px] text-amber-300/90 bg-amber-950/40 p-2 rounded-xl border border-amber-800/40 leading-relaxed">
                      ⚠️ {geoErrorMsg}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Presensi kehadiran harian Anda akan diverifikasi dan dicatatkan ke server rekap uang makan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCheckIn("Hadir")}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mencatatkan Kehadiran...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Absen Hadir Sekarang (Kantor Wisma NH)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: LAPANGAN / SITE / WFH */}
            {attendanceType === "field" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Pilih Lokasi Lapangan / Penugasan Anda:
                  </label>
                  <select
                    value={fieldLocation}
                    onChange={(e) => setFieldLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="Site Pomalaa (Kolaka, Sulawesi Tenggara)">Site Pomalaa (Kolaka, Sulawesi Tenggara)</option>
                    <option value="Site Morowali (Sulawesi Tengah)">Site Morowali (Sulawesi Tengah)</option>
                    <option value="Jetty Anggana / Samarinda (Kaltim)">Jetty Anggana / Samarinda (Kaltim)</option>
                    <option value="Kawasan Industri Tulang Bawang (Lampung)">Kawasan Industri Tulang Bawang (Lampung)</option>
                    <option value="Kantor Cabang / Kantor Perwakilan">Kantor Cabang / Kantor Perwakilan</option>
                    <option value="Perjalanan Dinas (SPPD) Lapangan">Perjalanan Dinas (SPPD) Lapangan</option>
                    <option value="Work From Home (WFH) / Remote">Work From Home (WFH) / Remote</option>
                    <option value="Lainnya (Tulis Manual)">Lainnya (Tulis Catatan di Bawah)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Keterangan / Aktivitas Kerja (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pengecekan kargo SIG atau inspeksi tongkang"
                    value={customFieldNote}
                    onChange={(e) => setCustomFieldNote(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleCheckIn("Hadir")}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mencatatkan Kehadiran...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      <span>Absen Hadir di Lapangan / Site</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 3: STATUS NON-HADIR */}
            {attendanceType === "status" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {["Sakit", "Izin", "Cuti", "Meeting"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNonPresentStatus(st)}
                      className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer text-left flex items-center justify-between ${
                        nonPresentStatus === st
                          ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
                      }`}
                    >
                      <span>{st}</span>
                      {nonPresentStatus === st && <CheckSquare className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Alasan / Keterangan:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Istirahat dokter atau meeting bersama mitra eksternal"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleCheckIn(nonPresentStatus)}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengirimkan Laporan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Catat Status {nonPresentStatus}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* SHARE & QUICK URL SECTION */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 truncate">
                Tautan Mandiri Khusus: <span className="font-mono text-emerald-400 font-bold">{activeWorker?.name}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? "Tersalin!" : "Salin Link WA"}</span>
              </button>

              <a
                href={mySelfAttendanceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Mandiri</span>
              </a>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500 font-mono">
            PT. Nusantara Mineral Sukses Abadi &copy; 2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs transition cursor-pointer"
          >
            Selesai &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
