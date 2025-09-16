// Utility functions for Report component: data fetch/convert, filter/sort, excel creation, Drive upload
import * as XLSX from "xlsx";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  writeBatch,
  doc,
} from "firebase/firestore";
import { sanitizeKey, unsanitizeKey } from "../../utils/KeySanitizer";
type RowObject = Record<string, any>;
type Filters = {
  searchText?: string;
  blDate?: string | null;
  coDate?: string | null;
  rcvDate?: string | null;
};

const PAGE_SIZE_DEFAULT = 20;

/** Load Google Identity Services script (idempotent) */
export async function ensureGoogleIdentityLoaded(): Promise<void> {
  if ((window as any).google && (window as any).google.accounts) return;
  if (document.getElementById("google-identity")) {
    await new Promise<void>((res) => {
      const check = setInterval(() => {
        if ((window as any).google && (window as any).google.accounts) {
          clearInterval(check);
          res();
        }
      }, 100);
    });
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.id = "google-identity";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity script"));
    document.head.appendChild(s);
  });
}

/** Convert "Job" fields that are strings to numbers (batch update). Returns number updated. */
export async function convertJobs(db: any): Promise<number> {
  const snapshot = await getDocs(collection(db, "employeeData"));
  const batch = writeBatch(db);
  let updatedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const jobKey = sanitizeKey("Job");
    if (
      data[jobKey] &&
      typeof data[jobKey] === "string" &&
      !isNaN(Number(data[jobKey]))
    ) {
      batch.update(doc(db, "employeeData", docSnap.id), {
        [jobKey]: Number(data[jobKey]),
      });
      updatedCount++;
      if (updatedCount % 500 === 0) {
        await batch.commit();
      }
    }
  }

  if (updatedCount % 500 !== 0 && updatedCount > 0) {
    await batch.commit();
  }

  return updatedCount;
}

/** Fetch rows (basic): paginated + sorted by Job desc by default.
 *  Returns mapped rows (unsanitized keys) and lastDoc (Firestore doc snapshot)
 */
export async function fetchRows(
  db: any,
  pageNum = 1,
  pageSize = PAGE_SIZE_DEFAULT,
  sortFieldSanitized = sanitizeKey("Job"),
  sortDir: "asc" | "desc" = "desc"
): Promise<{ rows: RowObject[]; lastDoc: any | null }> {
  const q = query(
    collection(db, "employeeData"),
    orderBy(sortFieldSanitized, sortDir),
    limit(pageSize)
  );
  const snapshot = await getDocs(q);
  const rows: RowObject[] = snapshot.docs.map((d) => {
    const raw = d.data();
    const mapped: RowObject = { id: d.id };
    for (const k of Object.keys(raw)) {
      mapped[unsanitizeKey(k)] = raw[k];
    }
    return mapped;
  });
  const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
  return { rows, lastDoc };
}

/** Filter and sort rows in-memory */
export function filterAndSortRows(
  rows: RowObject[],
  filters: Filters,
  sortField: string | null,
  sortDirection: "asc" | "desc"
): RowObject[] {
  let filtered = [...rows];

  const searchText = (filters.searchText || "").trim().toLowerCase();
  if (searchText) {
    filtered = filtered.filter((row) =>
      Object.keys(row).some((k) =>
        String(row[k] ?? "").toLowerCase().includes(searchText)
      )
    );
  }

  if (filters.blDate) {
    filtered = filtered.filter((r) => r["B/L Date"] === filters.blDate);
  }
  if (filters.coDate) {
    filtered = filtered.filter((r) => r["CO Date"] === filters.coDate);
  }
  if (filters.rcvDate) {
    filtered = filtered.filter((r) => r["Rcv Date"] === filters.rcvDate);
  }

  if (sortField) {
    filtered.sort((a, b) => {
      const aValue = a[sortField] ?? "";
      const bValue = b[sortField] ?? "";
      if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
        return sortDirection === "asc" ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
      }
      return sortDirection === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }

  return filtered;
}

/** Create an XLSX Blob from rows with header order (no styles) */
export function createExcelBlobFromRows(rows: RowObject[], columns: string[], sheetName = "Data"): Blob {
  const sheetData: any[][] = [];
  sheetData.push(columns); // header
  for (const r of rows) {
    sheetData.push(columns.map((c) => (r[c] !== undefined && r[c] !== null ? r[c] : "")));
  }
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/** Find existing file by name in Drive (returns first match or null) */
export async function findExistingDriveFile(fileName: string, accessToken: string): Promise<any | null> {
  const q = encodeURIComponent(`name='${fileName}' and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  return data.files?.[0] ?? null;
}

/** Upload Blob to Google Drive using GIS token flow; returns uploaded file JSON */
export async function uploadBlobToGoogleDrive(blob: Blob, filename: string, clientId: string): Promise<any> {
  await ensureGoogleIdentityLoaded();

  if (!(window as any).google || !(window as any).google.accounts || !(window as any).google.accounts.oauth2) {
    throw new Error("Google Identity Services not available");
  }

  const tokenResp: any = await new Promise((resolve, reject) => {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (resp: any) => {
        if (!resp || resp.error) return reject(resp || new Error("Failed to obtain token"));
        resolve(resp);
      },
      error_callback: (err: any) => reject(err),
    });

    try {
      client.requestAccessToken({ prompt: "" }); // attempt silent
    } catch (e) {
      try {
        client.requestAccessToken({ prompt: "consent" }); // interactive fallback
      } catch (e2) {
        reject(e2);
      }
    }
  });

  const accessToken = tokenResp.access_token;
  if (!accessToken) throw new Error("No access token received");

  // check if file exists (replace if exists)
  const existing = await findExistingDriveFile(filename, accessToken);

  const metadata = { name: filename, mimeType: blob.type || "application/octet-stream" };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", blob);

  let url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
  let method: "POST" | "PATCH" = "POST";
  if (existing) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`;
    method = "PATCH";
  }

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Drive upload failed: ${res.statusText}`);
  }
  return res.json();
}

/** Convenience: select rows by index, create excel blob and upload */
export async function exportSelectedRowsAndUpload(
  rows: RowObject[],
  selectedIndexes: number[],
  columns: string[],
  clientId: string,
  filename = "1.Clearance Follow Up SAMPLE.xlsx"
): Promise<any> {
  const exportRows = selectedIndexes.length > 0 ? selectedIndexes.map((i) => rows[i]) : [];
  if (exportRows.length === 0) throw new Error("No rows selected");
  const blob = createExcelBlobFromRows(exportRows, columns);
  return uploadBlobToGoogleDrive(blob, filename, clientId);
}