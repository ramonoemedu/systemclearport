import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Pagination,
  useMediaQuery,
  useTheme,
  TableContainer,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import TextField from "@mui/material/TextField";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Paper from "@mui/material/Paper";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import SortIcon from "@mui/icons-material/Sort";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { sanitizeKey, columns, unsanitizeKey } from "../../utils/KeySanitizer";
import {
  createExcelBlobFromRows,
  uploadBlobToGoogleDrive,
} from "./ReportFuntion";

// Add global declaration for window.google to avoid TypeScript error
declare global {
  interface Window {
    google?: any;
  }
}

const PAGE_SIZE = 20;
// the single field used for text prefix search in Firestore (change as needed)
const SEARCH_FIELD = "No Container";

const ReportPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [ setLastDoc] = useState<any>(null);
  const [pageCursors, setPageCursors] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [blDate, setBlDate] = useState<string | null>(null);
  const [coDate, setCoDate] = useState<string | null>(null);
  const [rcvDate, setRcvDate] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Reset to first page and clear cursors when filters change
  useEffect(() => {
    setPage(1);
    setPageCursors([]);
  }, [searchText, blDate, coDate, rcvDate]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // Build where constraints (filters) first
        const whereConstraints: any[] = [];
        if (blDate) whereConstraints.push(where(sanitizeKey("B/L Date"), "==", blDate));
        if (coDate) whereConstraints.push(where(sanitizeKey("CO Date"), "==", coDate));
        if (rcvDate) whereConstraints.push(where(sanitizeKey("Rcv Date"), "==", rcvDate));

        // text prefix search on single field (Firestore range trick)
        const sText = (searchText || "").trim();
        if (sText) {
          const fieldSan = sanitizeKey(SEARCH_FIELD);
          whereConstraints.push(where(fieldSan, ">=", sText), where(fieldSan, "<=", sText + "\uf8ff"));
        }

        // Build full query constraints with ordering, cursor and limit
        const constraints: any[] = [...whereConstraints];
        // order by - default to Job (sanitized). If you want to sort by other columns, ensure they are indexed.
        const orderByField = sanitizeKey(sortField ?? "Job");
        constraints.push(orderBy(orderByField, sortDirection));

        // startAfter cursor for pages > 1
        const startAfterDoc = page > 1 ? pageCursors[page - 2] ?? null : null;
        if (startAfterDoc) constraints.push(startAfter(startAfterDoc));

        constraints.push(limit(PAGE_SIZE));

        const q = query(collection(db, "employeeData"), ...constraints);
        const snapshot = await getDocs(q);

        if (cancelled) return;

        const data = snapshot.docs.map((d) => {
          const raw = d.data();
          const mapped: { id: string; [key: string]: any } = { id: d.id };
          for (const key of Object.keys(raw)) {
            mapped[unsanitizeKey(key)] = raw[key];
          }
          return mapped;
        });

        setRows(data);
        const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
        setLastDoc(newLastDoc);

        setPageCursors((prev) => {
          const next = [...prev];
          next[page - 1] = newLastDoc;
          return next;
        });

        // Get total count matching same filters (best effort)
        try {
          // count query should include the same where constraints (no order/startAfter/limit)
          const countQuery = query(collection(db, "employeeData"), ...whereConstraints);
          const countSnap = await getCountFromServer(countQuery as any);
          const cnt = Number(countSnap.data().count || 0);
          setTotalRows(cnt);
        } catch (countErr) {
          // fallback: estimate based on current page and size
          setTotalRows((prev) => Math.max(prev, (page - 1) * PAGE_SIZE + snapshot.size));
          console.warn("getCountFromServer failed or not available:", countErr);
        }
      } catch (err) {
        if (!cancelled) console.error("Error fetching employee data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // re-run when page or filters or sort change
  }, [page, searchText, blDate, coDate, rcvDate, sortField, sortDirection, pageCursors, setLastDoc]);

  // Selection helpers
  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));
  };

  const handleSelectAllCurrentPage = (checked: boolean) => {
    if (checked) {
      const ids = rows.map((r) => r.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    } else {
      const ids = new Set(rows.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !ids.has(id)));
    }
  };

  // Export handlers
  const handleExportNewExcel = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one row to export.");
      return;
    }
    // export selected rows from currently loaded pages only (ids may come from multiple pages)
    const exportRows = rows.filter((r) => selectedIds.includes(r.id));
    const blob = createExcelBlobFromRows(exportRows, columns);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ExportedData.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportToGoogleDrive = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one row to export.");
      return;
    }
    setLoading(true);
    try {
      const exportRows = rows.filter((r) => selectedIds.includes(r.id));
      const blob = createExcelBlobFromRows(exportRows, columns);
      await uploadBlobToGoogleDrive(
        blob,
        "1.Clearance Follow Up SAMPLE.xlsx",
        process.env.REACT_APP_GOOGLE_CLIENT_ID ||
          "756046169704-piuq4qipnshpv1bqe2jt4327pisccbvv.apps.googleusercontent.com"
      );
      alert('File uploaded to Google Drive as "1.Clearance Follow Up SAMPLE.xlsx"');
    } catch (err: any) {
      console.error(err);
      alert("Export/upload failed: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (row: Record<string, any>) => {
    if (row.id) navigate(`/home/customs-form/${row.id}`);
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDirection("asc");
    }
    // reset to page 1 when sort changes
    setPage(1);
    setPageCursors([]);
  };

  function normalizeRowDate(value: any): string | null {
    if (!value && value !== 0) return null;
    // Firestore Timestamp
    if (typeof value === "object" && typeof value.toDate === "function") {
      return dayjs(value.toDate()).format("YYYY-MM-DD");
    }
    // already a string (assume YYYY-MM-DD or similar)
    if (typeof value === "string") {
      return dayjs(value).isValid() ? dayjs(value).format("YYYY-MM-DD") : value;
    }
    return String(value);
  }

  // example client-side filter usage inside an effect
  useEffect(() => {
    let filtered = [...rows];

    const s = (searchText || "").trim().toLowerCase();
    if (s) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(s))
      );
    }

    if (blDate) {
      filtered = filtered.filter((row) => normalizeRowDate(row["B/L Date"]) === blDate);
    }
    if (coDate) {
      filtered = filtered.filter((row) => normalizeRowDate(row["CO Date"]) === coDate);
    }
    if (rcvDate) {
      filtered = filtered.filter((row) => normalizeRowDate(row["Rcv Date"]) === rcvDate);
    }

    // apply sort if needed...
    setRows(filtered);
    // totalRows for client-side paging:
    setTotalRows(filtered.length);
  }, [rows, searchText, blDate, coDate, rcvDate]);

  return (
    <Box sx={{ maxWidth: "100%", mx: "auto", mt: 4, position: "relative" }}>
      <Paper sx={{ mb: 4, p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Shipment Records
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={handleExportNewExcel} disabled={selectedIds.length === 0}>
              Download Excel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleExportToGoogleDrive}
              disabled={selectedIds.length === 0}
              startIcon={<img src="/gdrive-icon.png" alt="" width="16" height="16" />}
            >
              Save to Google Drive
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
          <Box sx={{ flexGrow: 1, minWidth: "200px", maxWidth: isMobile ? "100%" : "220px" }}>
            <TextField label="Search Records" variant="outlined" size="small" value={searchText} onChange={(e) => setSearchText(e.target.value)} fullWidth />
          </Box>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ flexGrow: 1, minWidth: "200px", maxWidth: isMobile ? "100%" : "220px" }}>
              <DatePicker label="B/L Date" value={blDate ? dayjs(blDate) : null} onChange={(date) => setBlDate(date ? date.format("YYYY-MM-DD") : null)} slotProps={{ textField: { size: "small", fullWidth: true } }} />
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: "200px", maxWidth: isMobile ? "100%" : "220px" }}>
              <DatePicker label="CO Date" value={coDate ? dayjs(coDate) : null} onChange={(date) => setCoDate(date ? date.format("YYYY-MM-DD") : null)} slotProps={{ textField: { size: "small", fullWidth: true } }} />
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: "200px", maxWidth: isMobile ? "100%" : "220px" }}>
              <DatePicker label="Rcv Date" value={rcvDate ? dayjs(rcvDate) : null} onChange={(date) => setRcvDate(date ? date.format("YYYY-MM-DD") : null)} slotProps={{ textField: { size: "small", fullWidth: true } }} />
            </Box>
          </LocalizationProvider>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Button variant="outlined" color="inherit" size="small" onClick={() => { setSearchText(""); setBlDate(null); setCoDate(null); setRcvDate(null); }}>
              Clear Filters
            </Button>
          </Box>
        </Box>

        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={rows.length > 0 && rows.every((r) => selectedIds.includes(r.id))}
                    onChange={(e) => handleSelectAllCurrentPage(e.target.checked)}
                    indeterminate={selectedIds.length > 0 && !rows.every((r) => selectedIds.includes(r.id))}
                  />
                </TableCell>

                {columns.filter((col) => !isMobile || columns.includes(col)).map((col, colIndex) => (
                  <TableCell key={`${col}-${colIndex}`} onClick={() => handleSort(col)} sx={{ fontWeight: 600, cursor: "pointer", userSelect: "none" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {col}
                      {sortField === col && <SortIcon fontSize="small" sx={{ ml: 0.5, transform: sortDirection === "desc" ? "rotate(180deg)" : "none", fontSize: "16px", opacity: 0.7 }} />}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} onClick={() => handleRowClick(row)} sx={{ cursor: "pointer", "&:hover": { backgroundColor: "#f9f9fb" } }}>
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.includes(row.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(row.id, e.target.checked); }} />
                  </TableCell>

                  {columns.filter((col) => !isMobile || columns.includes(col)).map((col) => (
                    <TableCell key={col}>{row[col]}</TableCell>
                  ))}
                </TableRow>
              ))}

              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={columns.filter((col) => !isMobile || columns.includes(col)).length + 1} sx={{ textAlign: "center", py: 3 }}>
                    <Typography variant="body2">No records found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          {totalRows > PAGE_SIZE && (
            <Pagination count={Math.ceil(totalRows / PAGE_SIZE)} page={page} onChange={(_, value) => setPage(value)} color="primary" />
          )}
        </Box>
      </Paper>

      {loading && (
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={24} />
          <Typography variant="body2">Loading...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ReportPage;