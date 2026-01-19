import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  Paper,
} from "@mui/material";
import TextField from "@mui/material/TextField";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
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
  QueryConstraint,
  DocumentData,
  QuerySnapshot,
  writeBatch,
  doc,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { sanitizeKey, columns, unsanitizeKey } from "../../utils/KeySanitizer";
import {
  createExcelBlobFromRows,
  uploadBlobToGoogleDrive,
} from "./ReportFuntion";

declare global {
  interface Window {
    google?: any;
  }
}

const PAGE_SIZE = 20;
const SEARCH_FIELD = "No Container";

const ReportPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  // --- Data states ---
  const [rows, setRows] = useState<Record<string, string | number>[]>([]);

  // const [apiRows, setApiRows] = useState<Record<string, any>[]>([]); // rows returned from Firestore
  const [displayedRows, setDisplayedRows] = useState<Record<string, any>[]>([]); // rows after client-side filtering (if any)
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [lastDoc, setLastDoc] = useState<any>(null);

  // --- Cursors & cache (use both state and refs; refs keep stable callback closures) ---
  const [pageCursors, setPageCursors] = useState<any[]>([]);
  const pageCursorsRef = useRef<any[]>([]);
  const [pageCache, setPageCache] = useState<Record<number, Record<string, any>[]>>({});
  const pageCacheRef = useRef<Record<number, Record<string, any>[]>>({});
  const [cursors, setCursors] = useState<(QueryDocumentSnapshot<DocumentData> | null)[]>([null]);


  // sync refs whenever states change
  // useEffect(() => {
  //   pageCursorsRef.current = pageCursors;
  // }, [pageCursors]);
  // useEffect(() => {
  //   pageCacheRef.current = pageCache;
  // }, [pageCache]);

  // --- UI / filter state ---
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<number | undefined>(undefined);
  const filtersKeyRef = useRef<string>(""); // track latest filters key
  const [blDate, setBlDate] = useState<string | null>(null);
  const [coDate, setCoDate] = useState<string | null>(null);
  const [rcvDate, setRcvDate] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const rowsRef = useRef<Record<string, any>[]>([]);
  const [filteredRows, setFilteredRows] = useState(rows);


  const [jobsConverted, setJobsConverted] = useState(false);

  // --- Debounce search input ---
  // useEffect(() => {
  //   window.clearTimeout(debounceRef.current);
  //   debounceRef.current = window.setTimeout(() => {
  //     setDebouncedSearch(searchText.trim());
  //   }, 300);
  //   return () => window.clearTimeout(debounceRef.current);
  // }, [searchText]);

  // --- Reset cache when filters/sort change ---
  // useEffect(() => {
  //   // reset pagination & caches when filters/sort change
  //   setPageCursors([]);
  //   pageCursorsRef.current = [];
  //   setPageCache({});
  //   pageCacheRef.current = {};
  //   filtersKeyRef.current = ""; // force count refetch
  // }, [debouncedSearch, blDate, coDate, rcvDate, sortField, sortDirection]);

  // Fetch total count (optional, for pagination UI)
  const convertJobs = useCallback(async () => {
    if (jobsConverted) return; // Skip if already done

    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "employeeData"));
      let updatedCount = 0;
      setTotalRows(snapshot.size);
      const batch = writeBatch(db);

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const jobKey = sanitizeKey("Job");

        if (
          data[jobKey] &&
          typeof data[jobKey] === "string" &&
          !isNaN(Number(data[jobKey]))
        ) {
          batch.update(doc(db, "employeeData", docSnapshot.id), {
            [jobKey]: Number(data[jobKey]),
          });
          updatedCount++;
        }

        // Commit in batches of 500 to avoid exceeding limits
        if (updatedCount > 0 && updatedCount % 500 === 0) {
          await batch.commit();
        }
      }

      // Commit any remaining updates
      if (updatedCount % 500 !== 0 && updatedCount > 0) {
        await batch.commit();
      }

      if (updatedCount > 0) {
        console.log(`Converted ${updatedCount} Job values to numbers`);
      }

      setJobsConverted(true);
    } catch (err) {
      console.error("Error converting jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [jobsConverted, setTotalRows]);

  useEffect(() => {
    convertJobs();
  }, [convertJobs]);
  // Fetch paginated rows

  useEffect(() => {
    convertJobs();
  }, [convertJobs]);



  const fetchRows = useCallback(
    async (pageNumber: number) => {
      setLoading(true);
      try {
        let q = query(
          collection(db, "employeeData"),
          orderBy(sanitizeKey("Job"), "desc"),
          limit(PAGE_SIZE)
        );

        const cursor = cursors[pageNumber - 1];
        if (cursor) {
          q = query(
            collection(db, "employeeData"),
            orderBy(sanitizeKey("Job"), "desc"),
            startAfter(cursor),
            limit(PAGE_SIZE)
          );
        }

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => {
          const raw = doc.data();
          const mapped: { id: string;[key: string]: any } = { id: doc.id };
          for (const key of Object.keys(raw)) {
            mapped[unsanitizeKey(key)] = raw[key];
          }
          return mapped;
        });

        setRows(data);
        setLastDoc(
          snapshot.docs.length > 0
            ? snapshot.docs[snapshot.docs.length - 1]
            : null
        );
        // Save cursor for this page if not already saved
        if (!cursors[pageNumber]) {
          setCursors((prev) => {
            const updated = [...prev];
            updated[pageNumber] = snapshot.docs[snapshot.docs.length - 1] ?? null;
            return updated;
          });
        }
      } catch (err) {
        console.error("Error fetching employee data:", err);
      } finally {
        setLoading(false);
      }
    },
    [cursors]
  );



  useEffect(() => {
    fetchRows(page);
  }, [page, fetchRows]);

  // --- Build a stable filters key (used for cache + counting) ---
  // const buildFiltersKey = useCallback(() => {
  //   return JSON.stringify({
  //     s: debouncedSearch,
  //     bl: blDate,
  //     co: coDate,
  //     rc: rcvDate,
  //     sf: sortField ?? "Job",
  //     sd: sortDirection,
  //   });
  // }, [debouncedSearch, blDate, coDate, rcvDate, sortField, sortDirection]);

  //   const fetchTotalCountIfNeeded = useCallback(
  //   async (whereConstraints: QueryConstraint[]) => {
  //     const newKey = buildFiltersKey();
  //     if (filtersKeyRef.current === newKey && totalRows > 0) return;
  //     filtersKeyRef.current = newKey;

  //     try {
  //       const countQuery = query(collection(db, "employeeData"), ...whereConstraints);
  //       const countSnap = await getCountFromServer(countQuery as any);
  //       const cnt = Number(countSnap.data().count || 0);
  //       console.log("✅ Total count fetched:", cnt);
  //       // setTotalRows(cnt);
  //     } catch (err) {
  //       console.warn("⚠️ Count fetch failed (will estimate):", err);
  //       // fallback: use ref instead of undefined variable
  //       const estimated =
  //         (page - 1) * PAGE_SIZE +
  //         (pageCacheRef.current[page]?.length ?? rowsRef.current.length);
  //       // setTotalRows((prev) => Math.max(prev, estimated));
  //     }
  //   },
  //   [buildFiltersKey, page, totalRows] // rowsRef.current not needed in deps
  // );


  // --- Fetch page (stable callback) ---
  // const fetchPage = useCallback(
  //   async (pageNum: number = 1) => {
  //     const filtersKey = buildFiltersKey();

  //     // cache hit?
  //     const cacheHit = pageCacheRef.current[pageNum];
  //     if (cacheHit && filtersKeyRef.current === filtersKey) {
  //       setApiRows(cacheHit);
  //       // setTotalRows((prev) => Math.max(prev, (pageNum - 1) * PAGE_SIZE + cacheHit.length));
  //       return;
  //     }

  //     // mark current filters key
  //     filtersKeyRef.current = filtersKey;

  //     setLoading(true);
  //     try {
  //       const whereConstraints: QueryConstraint[] = [];
  //       if (blDate) where(sanitizeKey("B/L Date"), "==", blDate);
  //       if (coDate) where(sanitizeKey("CO Date"), "==", coDate);
  //       if (rcvDate) where(sanitizeKey("Rcv Date"), "==", rcvDate);
  //       if (debouncedSearch) {
  //         const fieldSan = sanitizeKey(SEARCH_FIELD);
  //         where(fieldSan, ">=", debouncedSearch);
  //         where(fieldSan, "<=", debouncedSearch + "\uf8ff");
  //       }

  //       const orderByField = sanitizeKey(sortField ?? "Job");
  //       const constraints: QueryConstraint[] = [
  //         ...whereConstraints,
  //         orderBy(orderByField, sortDirection),
  //       ];

  //       const startAfterDoc = pageNum > 1 ? pageCursorsRef.current[pageNum - 2] ?? null : null;
  //       if (startAfterDoc) constraints.push(startAfter(startAfterDoc));
  //       constraints.push(limit(PAGE_SIZE));

  //       console.log("Running Firestore query for page", pageNum, "constraints:", constraints);

  //       const q = query(collection(db, "employeeData"), ...constraints);
  //       const snapshot: QuerySnapshot<DocumentData> = await getDocs(q);
  //         setTotalRows(snapshot.size);

  //       const data = snapshot.docs.map((d) => {
  //         const raw = d.data();
  //         return {
  //           id: d.id,
  //           ...Object.fromEntries(Object.entries(raw).map(([k, v]) => [unsanitizeKey(k), v])),
  //         };
  //       });

  //       setApiRows(data);

  //       const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
  //       setLastDoc(newLastDoc);

  //       // update state + refs for cursors & cache
  //       setPageCursors((prev) => {
  //         const next = [...prev];
  //         next[pageNum - 1] = newLastDoc;
  //         pageCursorsRef.current = next;
  //         return next;
  //       });
  //       setPageCache((prev) => {
  //         const next = { ...prev, [pageNum]: data };
  //         pageCacheRef.current = next;
  //         return next;
  //       });

  //       // only fetch total count when on first page (or filters changed)
  //       // if (pageNum === 1) {
  //       //   await fetchTotalCountIfNeeded(whereConstraints);
  //       // }
  //     } catch (err) {
  //       console.error("Error fetching employee data:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   },
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [lastDoc, buildFiltersKey, blDate, coDate, rcvDate, debouncedSearch, sortField, sortDirection, 
  //     // fetchTotalCountIfNeeded
  //   ]
  //   // intentionally no pageCache/pageCursors in deps; refs handle mutable access
  // );

  // --- Trigger fetch when page changes or filters change (page already reset on filter change) ---
  // useEffect(() => {
  //   fetchPage(page);
  // }, [page, fetchPage]);

  // --- Client-side filtering for displayedRows (pure derived state) ---
  // This avoids mutating the fetched apiRows inside an effect that depends on apiRows (we use useMemo instead).


  const computedDisplayedRows = useMemo(() => {
    let filtered = [...rows];

    if (searchText) {
      const s = searchText.toLowerCase();
      filtered = filtered.filter((row) =>
        columns.some((col) =>
          String(row[col] ?? "")
            .toLowerCase()
            .includes(s)
        )
      );
    }

    if (blDate) {
      filtered = filtered.filter((row) => row["B/L Date"] === blDate);
    }
    if (coDate) {
      filtered = filtered.filter((row) => row["CO Date"] === coDate);
    }
    if (rcvDate) {
      filtered = filtered.filter((row) => row["Rcv Date"] === rcvDate);
    }
    setFilteredRows(filtered);
    return filtered;
  }, [rows, searchText, blDate, coDate, rcvDate, columns]);


  // sync computed -> displayedRows (only when computed changes)
  useEffect(() => {
    setDisplayedRows(computedDisplayedRows);
    // Keep totalRows consistent for client-side paging fallback
    setTotalRows((prev) => Math.max(prev, computedDisplayedRows.length));
  }, [computedDisplayedRows]);

  // --- Helpers ---
  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));
  };

  const handleSelectAllCurrentPage = (checked: boolean) => {
    if (checked) {
      const ids = displayedRows.map((r) => r.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    } else {
      const ids = new Set(displayedRows.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !ids.has(id)));
    }
  };

  const handleExportNewExcel = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one row to export.");
      return;
    }
    // export selected rows from currently displayed rows
    const exportRows = displayedRows.filter((r) => selectedIds.includes(r.id));
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
      const exportRows = displayedRows.filter((r) => selectedIds.includes(r.id));
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
    pageCursorsRef.current = [];
  };

  function normalizeRowDate(value: any): string | null {
    if (!value && value !== 0) return null;
    if (typeof value === "object" && typeof value.toDate === "function") {
      return dayjs(value.toDate()).format("YYYY-MM-DD");
    }
    if (typeof value === "string") {
      return dayjs(value).isValid() ? dayjs(value).format("YYYY-MM-DD") : value;
    }
    return String(value);
  }

  // --- Render ---
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
            <TextField
              label="Search Records"
              variant="outlined"
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              fullWidth
            />
          </Box>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ flexGrow: 1, minWidth: "200px", maxWidth: isMobile ? "100%" : "220px" }}>
              <DatePicker
                label="B/L Date"
                value={blDate ? dayjs(blDate) : null}
                onChange={(date) => setBlDate(date ? date.format("YYYY-MM-DD") : null)}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: "200px", maxWidth: isMobile ? "100%" : "220px" }}>
              <DatePicker
                label="CO Date"
                value={coDate ? dayjs(coDate) : null}
                onChange={(date) => setCoDate(date ? date.format("YYYY-MM-DD") : null)}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: "200px", maxWidth: isMobile ? "100%" : "220px" }}>
              <DatePicker
                label="Rcv Date"
                value={rcvDate ? dayjs(rcvDate) : null}
                onChange={(date) => setRcvDate(date ? date.format("YYYY-MM-DD") : null)}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            </Box>
          </LocalizationProvider>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={() => {
                setSearchText("");
                setBlDate(null);
                setCoDate(null);
                setRcvDate(null);
              }}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 4, p: 2 }}>
          <TableContainer >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={filteredRows.length > 0 && filteredRows.every((r) => selectedIds.includes(String(r.id)))}
                      onChange={(e) => handleSelectAllCurrentPage(e.target.checked)}
                      indeterminate={selectedIds.length > 0 && !displayedRows.every((r) => selectedIds.includes(String(r.id)))}
                    />
                  </TableCell>

                  {columns.filter((col) => !isMobile || columns.includes(col)).map((col, colIndex) => (
                    <TableCell
                      key={`${col}-${colIndex}`}
                      onClick={() => handleSort(col)}
                      sx={{
                        fontWeight: 700,
                        bgcolor: "#f5f5f5",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        maxWidth: 120,
                        minWidth: 80,
                        fontSize: 13,
                        borderRight: "1px solid #eee",
                        ...(col === "B/L No" ||
                          col === "Quantity" ||
                          col === "CBM/CIF" ||
                          col === "20'" ||
                          col === "40'" ||
                          col === "CONT SIZE"
                          ? { textAlign: "right" }
                          : { textAlign: "left" }),
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {col}
                        {sortField === col && (
                          <SortIcon
                            fontSize="small"
                            sx={{
                              ml: 0.5,
                              transform: sortDirection === "desc" ? "rotate(180deg)" : "none",
                              fontSize: "16px",
                              opacity: 0.7,
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {displayedRows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => handleRowClick(row)}
                    sx={{ cursor: "pointer", "&:hover": { backgroundColor: "#f9f9fb" } }}

                  >
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}

                      sx={{ borderRight: "1px solid #eee" }}
                    >
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(row.id, e.target.checked);
                        }}
                      />
                    </TableCell>

                    {columns.filter((col) => !isMobile || columns.includes(col)).map((col) => (
                      <TableCell key={col}>{row[col]}</TableCell>
                    ))}
                  </TableRow>
                ))}

                {displayedRows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.filter((col) => !isMobile || columns.includes(col)).length + 1}
                      sx={{ textAlign: "center", py: 3 }}
                    >
                      <Typography variant="body2">No records found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          {totalRows > PAGE_SIZE && (
            <Pagination
              count={Math.ceil(totalRows / PAGE_SIZE)}
              page={page}
              onChange={(_, value) => {
                setPage(value);
                fetchRows(value);
              }}
              color="primary"
            />
          )}
        </Box>

      </Paper>

      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <CircularProgress size={24} />
          <Typography variant="body2">Loading...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ReportPage;
