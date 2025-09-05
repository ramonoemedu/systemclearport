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
} from "@mui/material";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../firebase/config";
import * as XLSX from "xlsx";
import { unsanitizeKey } from "../../utils/KeySanitizer";
import TextField from "@mui/material/TextField";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import Paper from "@mui/material/Paper";
import dayjs from "dayjs";
import ExcelJS from "exceljs";

// Define your columns here (should match unsanitized keys)
const columns = [
  "Client Name", "B/L No", "Importer", "Commodity", "B/L Date", "CO Date", "Rcv Date"
  // Add all columns you want to display/export
];

const PAGE_SIZE = 20;

const ReportPage: React.FC = () => {
  const [dbRows, setDbRows] = useState<Record<string, any>[]>([]);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [blDate, setBlDate] = useState<string | null>(null);
  const [coDate, setCoDate] = useState<string | null>(null);
  const [rcvDate, setRcvDate] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      let q = collection(db, "employeeData");
      let allSnapshot = await getDocs(q);
      let allRows = allSnapshot.docs.map((doc) => {
        const raw = doc.data();
        const mapped: Record<string, any> = {};
        Object.entries(raw).forEach(([key, value]) => {
          mapped[unsanitizeKey(key)] = value;
        });
        return mapped;
      });

      // Show all unique keys from DB
      const allKeys = new Set<string>();
      allRows.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key));
      });
      console.log("All keys from DB:", Array.from(allKeys));

      // Filter by search and date
      let filtered = allRows;
      if (searchText) {
        filtered = filtered.filter((row) =>
          columns.some((col) =>
            String(row[col] ?? "")
              .toLowerCase()
              .includes(searchText.toLowerCase())
          )
        );
      }
      if (blDate) filtered = filtered.filter((row) => row["B/L Date"] === blDate);
      if (coDate) filtered = filtered.filter((row) => row["CO Date"] === coDate);
      if (rcvDate) filtered = filtered.filter((row) => row["Rcv Date"] === rcvDate);

      setTotalRows(filtered.length);

      // Pagination (limit/offset)
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      setDbRows(filtered.slice(start, end));
    };
    fetchData();
  }, [page, searchText, blDate, coDate, rcvDate]);

const handleExportWithTemplate = async () => {
  const response = await fetch("/assets/report.xlsx");
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  // Prepare data for the new sheet
  // Use the first selected row or the first row if none selected
  const exportRows =
    selectedRows.length > 0
      ? selectedRows.map((idx) => dbRows[idx])
      : dbRows.length > 0
      ? [dbRows[0]]
      : [];

  if (exportRows.length > 0) {
    const rowData = exportRows[0];
    // Prepare header and value rows
    const headers = Object.keys(rowData);
    const values = Object.values(rowData);

    // Create a 2D array: first row is headers, second row is values
    const dataSheet = [headers, values];

    // Create a new worksheet
    const newWorksheet = XLSX.utils.aoa_to_sheet(dataSheet);

    // Add the new sheet to the workbook
    XLSX.utils.book_append_sheet(workbook, newWorksheet, "Data");
  }

  // Save the workbook
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "FilledReport.xlsx";
  a.click();
  window.URL.revokeObjectURL(url);
};

const excelHeaderOrder = [
  "S. No.", "File #", "B/L No", "B/L Date", "Imp/Exp", "Ship'm Mode", "Importer", "Client Name", "Inv", "PKL",
  "INV & PKL Date", "CO", "CO Date", "Rcv Date", "Shipping Line", "MBL #", "Vssl/Truck", "ETA/ETD", "LOAD ON",
  "POL", "Transit Port", "SCAN STATION", "Final Destination", "Commodity", "NW", "GW", "CBM/CIF", "FOB",
  "Container No", "Quantity", "20'", "40'", "CONT SIZE", "Shipper Name", "Received Date", "SR NAME"
];

const handleExportNewExcel = async () => {
  // Get selected rows (or all if none selected)
  const exportRows =
    selectedRows.length > 0
      ? selectedRows.map((idx) => dbRows[idx])
      : dbRows.length > 0
      ? [dbRows[0]]
      : [];

  if (exportRows.length === 0) return;

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data");

  // Add header row with style
  const headerRow = worksheet.addRow(excelHeaderOrder);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1976D2" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF1976D2" } },
      left: { style: "thin", color: { argb: "FF1976D2" } },
      bottom: { style: "thin", color: { argb: "FF1976D2" } },
      right: { style: "thin", color: { argb: "FF1976D2" } },
    };
  });

  // Add value rows with alternate background color
  exportRows.forEach((row, rowIdx) => {
    const valueRow = worksheet.addRow(
      excelHeaderOrder.map(key => {
        const value = row[key];
        if (key.toLowerCase().includes("date") && value) {
          return dayjs(value).format("DD/MM/YYYY");
        }
        return value ?? "";
      })
    );
    valueRow.eachCell((cell) => {
      cell.font = { color: { argb: "FF333333" }, size: 11 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowIdx % 2 === 0 ? "FFF9F9FB" : "FFFFFFFF" },
      };
      cell.alignment = { horizontal: "left", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
    });
  });

  // Auto width for columns
  worksheet.columns.forEach((column) => {
    if (!column) return;
    let maxLength = 10;
    if (typeof column.eachCell === "function") {
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, cellValue.length);
      });
    }
    column.width = maxLength + 2;
  });

  // Export to Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ExportedData.xlsx";
  a.click();
  window.URL.revokeObjectURL(url);
};
  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 6 }}>
      <Paper
        elevation={4}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          bgcolor: "#f5f7fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color: "#1976d2" }}>
            Data Export
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "#555", mt: 1 }}>
            Select rows and export to Excel with clean formatting
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleExportNewExcel}
          sx={{ borderRadius: 2, fontWeight: 600, boxShadow: 2 }}
        >
          Export Selected to Excel
        </Button>
      </Paper>
      <Divider sx={{ mb: 2 }} />
      <Paper sx={{ p: 2, mb: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          label="Keyword Search"
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
  label="B/L Date"
  value={blDate ? dayjs(blDate) : null}
  onChange={(date) => setBlDate(date ? date.format("YYYY-MM-DD") : null)}
  slotProps={{ textField: { size: "small", sx: { minWidth: 140 } } }}
/>
<DatePicker
  label="CO Date"
  value={coDate ? dayjs(coDate) : null}
  onChange={(date) => setCoDate(date ? date.format("YYYY-MM-DD") : null)}
  slotProps={{ textField: { size: "small", sx: { minWidth: 140 } } }}
/>
<DatePicker
  label="Rcv Date"
  value={rcvDate ? dayjs(rcvDate) : null}
  onChange={(date) => setRcvDate(date ? date.format("YYYY-MM-DD") : null)}
  slotProps={{ textField: { size: "small", sx: { minWidth: 140 } } }}
/>
        </LocalizationProvider>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => {
            setSearchText("");
            setBlDate(null);
            setCoDate(null);
            setRcvDate(null);
          }}
          sx={{ ml: 2 }}
        >
          Clear Filters
        </Button>
      </Paper>
      <Paper sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#e3eafc" }}>
              <TableCell padding="checkbox">
                <input
                  type="checkbox"
                  checked={selectedRows.length === dbRows.length && dbRows.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(dbRows.map((_, idx) => idx));
                    } else {
                      setSelectedRows([]);
                    }
                  }}
                />
              </TableCell>
              {columns.map((col) => (
                <TableCell key={col} sx={{ fontWeight: 700, color: "#1976d2" }}>
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {dbRows.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(idx)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows([...selectedRows, idx]);
                      } else {
                        setSelectedRows(selectedRows.filter((i) => i !== idx));
                      }
                    }}
                  />
                </TableCell>
                {columns.map((col) => (
                  <TableCell key={col}>{row[col]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Pagination
          count={Math.ceil(totalRows / PAGE_SIZE)}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Box>
 
    </Box>
  );
};

export default ReportPage;