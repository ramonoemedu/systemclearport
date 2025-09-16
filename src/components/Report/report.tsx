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
import { db } from "../../firebase/config";
import {  sanitizeKey, columns } from "../../utils/KeySanitizer";
import TextField from "@mui/material/TextField";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Paper from "@mui/material/Paper";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import SortIcon from "@mui/icons-material/Sort";
import {
  fetchRows as utilFetchRows,
  convertJobs as utilConvertJobs,
  filterAndSortRows,
  createExcelBlobFromRows,
  exportSelectedRowsAndUpload,
} from "./ReportFuntion";

// Add global declaration for window.google to avoid TypeScript error
declare global {
  interface Window {
    google?: any;
  }
}

const PAGE_SIZE = 20;

const ReportPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [filteredRows, setFilteredRows] = useState<Record<string, any>[]>([]);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [ setLastDoc] = useState<any>(null);
  const [searchText, setSearchText] = useState("");
  const [blDate, setBlDate] = useState<string | null>(null);
  const [coDate, setCoDate] = useState<string | null>(null);
  const [rcvDate, setRcvDate] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobsConverted, setJobsConverted] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Initial data fetch (uses utils)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // ensure Job fields converted in DB (util function)
        await utilConvertJobs(db);
        setJobsConverted(true);

        const result = await utilFetchRows(
          db,
          page,
          PAGE_SIZE,
          sanitizeKey("Job"),
          "desc",
        );
        setRows(result.rows);
        setLastDoc(result.lastDoc);
      } catch (err) {
        console.error("Error fetching employee data:", err, jobsConverted);
      } finally {
        setLoading(false);
      }
    })();
    // intentionally runs when page changes
  }, [page, jobsConverted, setLastDoc]);

  // Filtering & sorting (uses util)
  useEffect(() => {
    const filtered = filterAndSortRows(
      rows,
      { searchText, blDate, coDate, rcvDate },
      sortField,
      sortDirection,
    );
    setFilteredRows(filtered);
    setTotalRows(filtered.length);
  }, [rows, searchText, blDate, coDate, rcvDate, sortField, sortDirection]);

  const handleExportNewExcel = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one row to export.");
      return;
    }
    const exportRows = selectedRows.map((i) => rows[i]);
    const blob = createExcelBlobFromRows(exportRows, columns);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ExportedData.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportToGoogleDrive = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one row to export.");
      return;
    }

    setLoading(true);
    try {
      await exportSelectedRowsAndUpload(
        rows,
        selectedRows,
        columns,
        process.env.REACT_APP_GOOGLE_CLIENT_ID ||
        "756046169704-piuq4qipnshpv1bqe2jt4327pisccbvv.apps.googleusercontent.com",
      );
      alert('File uploaded to Google Drive as "1.Clearance Follow Up SAMPLE.xlsx"');
    } catch (err: any) {
      console.error(err);
      alert("Export/upload failed: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Row click navigation
  const handleRowClick = (row: Record<string, any>) => {
    if (row.id) {
      navigate(`/home/customs-form/${row.id}`);
    }
  };

  // Sort handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <Box sx={{ maxWidth: "100%", mx: "auto", mt: 4, position: "relative" }}>
      <Paper sx={{ mb: 4, p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Shipment Records
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleExportNewExcel}
              disabled={selectedRows.length === 0}
            >
              Download Excel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleExportToGoogleDrive}
              disabled={selectedRows.length === 0}
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

        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedRows.length === filteredRows.length && filteredRows.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(filteredRows.map((_, idx) => idx));
                      } else {
                        setSelectedRows([]);
                      }
                    }}
                    indeterminate={selectedRows.length > 0 && selectedRows.length < filteredRows.length}
                  />
                </TableCell>

                {columns.filter((col) => !isMobile || columns.includes(col)).map((col, colIndex) => (
                  <TableCell
                    key={`${col}-${colIndex}`}
                    onClick={() => handleSort(col)}
                    sx={{ fontWeight: 600, cursor: "pointer", userSelect: "none" }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {col}
                      {sortField === col && (
                        <SortIcon
                          fontSize="small"
                          sx={{ ml: 0.5, transform: sortDirection === "desc" ? "rotate(180deg)" : "none", fontSize: "16px", opacity: 0.7 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredRows.map((row, idx) => (
                <TableRow
                  key={idx}
                  onClick={() => handleRowClick(row)}
                  sx={{ cursor: "pointer", "&:hover": { backgroundColor: "#f9f9fb" } }}
                >
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedRows.includes(idx)}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedRows([...selectedRows, idx]);
                        } else {
                          setSelectedRows(selectedRows.filter((i) => i !== idx));
                        }
                      }}
                    />
                  </TableCell>

                  {columns.filter((col) => !isMobile || columns.includes(col)).map((col) => (
                    <TableCell key={col}>{row[col]}</TableCell>
                  ))}
                </TableRow>
              ))}

              {filteredRows.length === 0 && !loading && (
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

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination
            count={Math.max(1, Math.ceil(totalRows / PAGE_SIZE))}
            page={page}
            onChange={(_, value) => setPage(value)}
            size="small"
          />
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
