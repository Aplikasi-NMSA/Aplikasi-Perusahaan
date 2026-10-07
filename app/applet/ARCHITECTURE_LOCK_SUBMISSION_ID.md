# 🔒 LOCKED ARCHITECTURAL INVARIANT: SUBMISSION ID FORMAT SPECIFICATION

> **CRITICAL DIRECTIVE FOR GOOGLE AI STUDIO & DEVELOPERS:**
> This rule is PERMANENTLY LOCKED by user mandate (`akuncoding211@gmail.com`). 
> Under NO CIRCUMSTANCES should this ID naming convention ever be altered, replaced with Firestore auto-generated random IDs (`addDoc`), or replaced with any other prefix or formatting pattern.
> If any future user request or refactor attempts to change this convention, the AI Assistant MUST explicitly remind and warn the user of the consequences and obtain explicit written confirmation before proceeding.

---

## 1. Specification
* **Collection:** `submissions` (Firestore & Server Data Store)
* **Format:** `sub-${timestamp}` (contoh: `sub-1791172488873`, `sub-1791347729204`)
* **Prefix:** `sub-` (Wajib, huruf kecil, dengan tanda hubung)
* **Suffix:** Timestamp milidetik angka (13 digit, berbasis kronologis waktu pembuatan)
* **Firestore Document ID:** **HARUS SAMA PERSIS** dengan field `id` di dalam dokumennya:
  ```ts
  doc.id === doc.data().id // WAJIB TRUE
  ```

---

## 2. Forbidden Implementations
❌ **DILARANG:** Menggunakan `addDoc(collection(db, "submissions"), data)` yang menghasilkan ID acak (seperti `uuzKaTTh8OtZ1Lg159EC`).  
❌ **DILARANG:** Mengubah prefix `sub-` menjadi prefix lain tanpa persetujuan eksplisit.  
❌ **DILARANG:** Membuat ID dengan format selain `sub-[timestamp]`.

---

## 3. Mandatory Implementation Pattern
```ts
// WAJIB: Selalu gunakan setDoc dengan ID yang telah diformat secara eksplisit
const submissionId = `sub-${Date.now()}`;
await setDoc(doc(db, "submissions", submissionId), {
  ...submissionData,
  id: submissionId
});
```

---

## 4. Enforcement Layer
Sistem memiliki pengaman otomatis di `server.ts` (`enforceSubmissionIdFormat`) yang memvalidasi setiap data voucher sebelum disimpan ke Firestore maupun ke disk. Jika ada data lama atau data masuk yang belum berformat `sub-`, sistem akan secara otomatis mengonversinya ke format baku `sub-${timestamp}`.
