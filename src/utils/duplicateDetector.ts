import { Submission, SubmissionItem, AccurateMappedTransaction } from '../types';

export interface DuplicateSubmissionMatch {
  submission: Submission;
  reason: string;
  matchedNominal: number;
}

/**
 * Normalizes text for robust comparison (lowercase, trimmed, collapsed spaces)
 */
export function normalizeText(text: string = ''): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Detects duplicate items within a single voucher (same description & same nominal)
 */
export function findDuplicateItemIndices(items: SubmissionItem[]): Set<number> {
  const seen = new Map<string, number>();
  const duplicateIndices = new Set<number>();

  items.forEach((item, index) => {
    const cleanDesc = normalizeText(item.item);
    const amount = Number(item.total) || 0;
    if (cleanDesc && amount > 0) {
      const key = `${cleanDesc}_${amount}`;
      if (seen.has(key)) {
        duplicateIndices.add(index);
        duplicateIndices.add(seen.get(key)!);
      } else {
        seen.set(key, index);
      }
    }
  });

  return duplicateIndices;
}

/**
 * Removes duplicate items from a voucher's items array
 */
export function removeDuplicateItems(items: SubmissionItem[]): {
  cleaned: SubmissionItem[];
  removedCount: number;
} {
  const seen = new Set<string>();
  const cleaned: SubmissionItem[] = [];
  let removedCount = 0;

  items.forEach((item, index) => {
    const cleanDesc = normalizeText(item.item);
    const amount = Number(item.total) || 0;
    if (cleanDesc && amount > 0) {
      const key = `${cleanDesc}_${amount}`;
      if (seen.has(key)) {
        removedCount++;
        return;
      }
      seen.add(key);
    }
    cleaned.push({
      ...item,
      no: cleaned.length + 1
    });
  });

  return { cleaned, removedCount };
}

/**
 * Checks for potential duplicate submissions across the entire database.
 * Detects matches based on:
 * 1. Same payee (dibayarkanKepada) + same exact nominal total
 * 2. Same transaction date + same nominal total + same jenisPengajuan
 * 3. Specific item description + exact same item nominal for the same recipient
 */
export function findPotentialDuplicateSubmissions(
  current: {
    dibayarkanKepada?: string;
    total?: number;
    tanggal?: string;
    jenisPengajuan?: string;
    items?: SubmissionItem[];
    id?: string;
  },
  existingSubmissions: Submission[] = []
): DuplicateSubmissionMatch[] {
  if (!existingSubmissions || existingSubmissions.length === 0) return [];
  const currentTotal = Number(current.total) || (current.items?.reduce((acc, it) => acc + (Number(it.total) || 0), 0) || 0);
  if (currentTotal <= 0 && (!current.items || current.items.length === 0)) return [];

  const cleanRecipient = normalizeText(current.dibayarkanKepada);
  const matches: DuplicateSubmissionMatch[] = [];

  for (const existing of existingSubmissions) {
    // Skip if comparing against itself
    if (current.id && existing.id === current.id) continue;

    const existingTotal = (existing.items && existing.items.length > 0)
      ? existing.items.reduce((acc, it) => acc + (Number(it.total) || 0), 0)
      : ((existing as any).nominal || (existing as any).total || 0);

    const existingRecipient = normalizeText(existing.dibayarkanKepada);

    // Rule 1: Same recipient + same exact nominal total
    if (cleanRecipient && existingRecipient && cleanRecipient === existingRecipient && currentTotal > 0 && existingTotal === currentTotal) {
      matches.push({
        submission: existing,
        reason: `Penerima (${existing.dibayarkanKepada}) & Total Nominal (Rp ${currentTotal.toLocaleString('id-ID')}) sama persis`,
        matchedNominal: currentTotal
      });
      continue;
    }

    // Rule 2: Same date + same exact nominal total + same jenis pengajuan
    if (current.tanggal && existing.tanggal === current.tanggal && currentTotal > 0 && existingTotal === currentTotal && current.jenisPengajuan === existing.jenisPengajuan) {
      matches.push({
        submission: existing,
        reason: `Tanggal (${existing.tanggal}), Jenis (${existing.jenisPengajuan}), & Nominal (Rp ${currentTotal.toLocaleString('id-ID')}) sama persis`,
        matchedNominal: currentTotal
      });
      continue;
    }

    // Rule 3: Specific item description and amount match for the same recipient
    if (cleanRecipient && existingRecipient && cleanRecipient === existingRecipient && current.items && current.items.length > 0 && existing.items && existing.items.length > 0) {
      const matchingItem = current.items.find(curIt => {
        const curDesc = normalizeText(curIt.item);
        const curAmt = Number(curIt.total) || 0;
        if (!curDesc || curAmt <= 0) return false;

        return existing.items?.some(exIt => {
          const exDesc = normalizeText(exIt.item);
          const exAmt = Number(exIt.total) || 0;
          return curDesc === exDesc && curAmt === exAmt;
        });
      });

      if (matchingItem) {
        matches.push({
          submission: existing,
          reason: `Rincian transaksi "${matchingItem.item}" (Rp ${Number(matchingItem.total).toLocaleString('id-ID')}) sama persis`,
          matchedNominal: Number(matchingItem.total)
        });
      }
    }
  }

  return matches;
}

/**
 * Finds duplicate transaction IDs in Accurate Petty Cash Mapping (same description + same amount + same date)
 */
export function findDuplicateAccurateTransactions(transactions: AccurateMappedTransaction[]): Set<string> {
  const seen = new Map<string, string>();
  const duplicateIds = new Set<string>();

  for (const t of transactions) {
    const cleanDesc = normalizeText(t.description);
    const amount = Number(t.amount) || 0;
    if (cleanDesc && amount > 0) {
      const key = `${t.date || ''}_${cleanDesc}_${amount}`;
      if (seen.has(key)) {
        duplicateIds.add(t.id);
      } else {
        seen.set(key, t.id);
      }
    }
  }

  return duplicateIds;
}

/**
 * Removes duplicate transactions from Accurate Petty Cash Mapping list
 */
export function removeDuplicateAccurateTransactions(transactions: AccurateMappedTransaction[]): {
  cleaned: AccurateMappedTransaction[];
  removedCount: number;
} {
  const seen = new Set<string>();
  const cleaned: AccurateMappedTransaction[] = [];
  let removedCount = 0;

  for (const t of transactions) {
    const cleanDesc = normalizeText(t.description);
    const amount = Number(t.amount) || 0;
    if (cleanDesc && amount > 0) {
      const key = `${t.date || ''}_${cleanDesc}_${amount}`;
      if (seen.has(key)) {
        removedCount++;
        continue;
      }
      seen.add(key);
    }
    cleaned.push(t);
  }

  return { cleaned, removedCount };
}
