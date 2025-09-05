import React, { useState, useEffect, useCallback } from "react";
import EmployeeDataFormPage from "./EmployeeDataFormPage";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import dayjs from "dayjs";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Pagination from "@mui/material/Pagination";
import * as XLSX from "xlsx";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import Paper from "@mui/material/Paper";


const columns = [
  "B/L No", "B/L Date", "Imp/Exp", "Ship'm Mode", "Importer", "Client Name",
  "Inv", "PKL", "INV & PKL Date", "CO", "CO Date", "Rcv Date", "Shipping Line",
  "MBL #", "Vssl/Truck", "ETA/ETD", "LOAD ON", "POL", "Transit Port", "SCAN STATION",
  "Final Destination", "Commodity", "NW", "GW", "CBM/CIF", "FOB", "Container No",
  "Quantity", "20'", "40'", "CONT SIZE", "Shipper Name", "Received Date", "SR NAME"
];

const dateFields = [
  "B/L Date", "INV & PKL Date", "CO Date", "Rcv Date", "ETA/ETD", "Received Date", "LOAD ON"
];

const dropdownFields: Record<string, string[]> = {
  "Imp/Exp": ["IMPORT", "EXPORT"],
  "Ship'm Mode": ["SEA", "AIR", "LAND"],
  "Vssl/Truck": ["VSSL", "TRUCK"],
};

const initialForm = columns.reduce((acc, col) => {
  if (dateFields.includes(col)) {
    acc[col] = dayjs().format("YYYY-MM-DD");
  } else if (dropdownFields[col]) {
    acc[col] = dropdownFields[col][0];
  } else {
    acc[col] = "";
  }
  return acc;
}, {} as Record<string, string>);

const sanitizeKey = (key: string) =>
  key
    .replace(/[.~*/[\] ]/g, "_")
    .replace("B/L", "B_L")
    .replace("CBM/CIF", "CBM_CIF")
    .replace("ETA/ETD", "ETA_ETD")
    .replace("INV & PKL Date", "INV_PKL_Date")
    .replace("Imp/Exp", "Imp_Exp")
    .replace("Vssl/Truck", "Vssl_Truck");

const unsanitizeKey = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace("BL No", "B/L No")
    .replace("B L Date", "B/L Date")
    .replace("CBM CIF", "CBM/CIF")
    .replace("ETA ETD", "ETA/ETD")
    .replace("INV PKL Date", "INV & PKL Date")
    .replace("Imp Exp", "Imp/Exp")
    .replace("Vssl Truck", "Vssl/Truck");

const PAGE_SIZE = 20;

const EmployeeDataFormContainer: React.FC = () => {
  const [rows, setRows] = useState<Record<string, string | number>[]>([]);
  const [form, setForm] = useState<Record<string, string>>(initialForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [ setLastDoc] = useState<any>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [filteredRows, setFilteredRows] = useState(rows);
  const [blDate, setBlDate] = useState<string | null>(null);
  const [coDate, setCoDate] = useState<string | null>(null);
  const [rcvDate, setRcvDate] = useState<string | null>(null);

  // Fetch total count (optional, for pagination UI)
  useEffect(() => {
    const fetchTotal = async () => {
      const snapshot = await getDocs(collection(db, "employeeData"));
      setTotalRows(snapshot.size);
    };
    fetchTotal();
  }, []);

  // Fetch paginated rows
  const fetchRows = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      let q = query(collection(db, "employeeData"), orderBy("BL_No"), limit(PAGE_SIZE));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => {
        const raw = doc.data();
        const mapped: Record<string, any> = {};
        Object.entries(raw).forEach(([key, value]) => {
          mapped[unsanitizeKey(key)] = value;
        });
        return { id: doc.id, ...mapped };
      });
      setRows(data);
      setLastDoc(snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null);
    } catch (err) {
      console.error("Error fetching employee data:", err);
    }
    setLoading(false);
  }, [setLoading, setRows, setLastDoc]);

  useEffect(() => {
    fetchRows(page);
  }, [page, fetchRows]);

  useEffect(() => {
    let filtered = rows;

    if (searchText) {
      filtered = filtered.filter((row) =>
        columns.some((col) =>
          String(row[col] ?? "")
            .toLowerCase()
            .includes(searchText.toLowerCase())
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
  }, [rows, searchText, blDate, coDate, rcvDate]);

  const openAddDialog = () => {
    setForm(initialForm);
    setEditIndex(null);
    setDialogOpen(true);
  };

  const openEditDialog = (row: any, idx: number) => {
    const { id, ...rowWithoutId } = row;
    const formWithDefaults = { ...initialForm, ...rowWithoutId };
    dateFields.forEach((field) => {
      if (formWithDefaults[field]) {
        formWithDefaults[field] = dayjs(formWithDefaults[field]).format("YYYY-MM-DD");
      }
    });
    setForm(formWithDefaults);
    setEditIndex(idx);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setForm(initialForm);
    setEditIndex(null);
  };

  const handleDialogSave = async () => {
    try {
      const sanitizedForm: Record<string, any> = {};
      for (const [key, value] of Object.entries(form)) {
        if (value !== undefined) {
          const val =
            dateFields.includes(key) && value
              ? dayjs(value).format("YYYY-MM-DD")
              : value;
          sanitizedForm[sanitizeKey(key)] = val;
        }
      }
      if (editIndex !== null && rows[editIndex]?.id) {
        const docId = rows[editIndex].id as string;
        await updateDoc(doc(db, "employeeData", docId), sanitizedForm);
      } else {
        await addDoc(collection(db, "employeeData"), sanitizedForm);
      }
      await fetchRows();
      handleDialogClose();
    } catch (err) {
      console.error("Error saving employee data:", err);
    }
  };

  const handleChange = (col: string, value: string) => {
    setForm({ ...form, [col]: value });
  };

  const handleExportWithTemplate = async () => {
    const response = await fetch("/assets/report.xlsx");
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (rows.length > 0) {
      const rowData = rows[0];
      Object.keys(rowData).forEach((key) => {
        Object.keys(worksheet).forEach((cellAddr) => {
          if (
            worksheet[cellAddr] &&
            worksheet[cellAddr].v === key
          ) {
            worksheet[cellAddr].v = rowData[key];
          }
        });
      });
    }

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "FilledReport.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Call this function from a button or useEffect for testing
  const insertDummyRecords = async () => {
    for (let i = 1; i <= 40; i++) {
      const record: Record<string, any> = {
        "BL No": `BL${i.toString().padStart(3, "0")}`,
        "B/L Date": dayjs().format("YYYY-MM-DD"),
        "Imp/Exp": i % 2 === 0 ? "IMPORT" : "EXPORT",
        "Ship'm Mode": "SEA",
        "Importer": `Importer ${i}`,
        "Client Name": `Client ${i}`,
        "Inv": `INV${i}`,
        "PKL": `PKL${i}`,
        "INV & PKL Date": dayjs().format("YYYY-MM-DD"),
        "CO": `CO${i}`,
        "CO Date": dayjs().format("YYYY-MM-DD"),
        "Rcv Date": dayjs().format("YYYY-MM-DD"),
        "Shipping Line": `Line ${i}`,
        "MBL #": `MBL${i}`,
        "Vssl/Truck": "VSSL",
        "ETA/ETD": dayjs().format("YYYY-MM-DD"),
        "LOAD ON": dayjs().format("YYYY-MM-DD"),
        "POL": `POL${i}`,
        "Transit Port": `Port ${i}`,
        "SCAN STATION": `Station ${i}`,
        "Final Destination": `Destination ${i}`,
        "Commodity": `Commodity ${i}`,
        "NW": 100 + i,
        "GW": 200 + i,
        "CBM/CIF": 300 + i,
        "FOB": 400 + i,
        "Container No": `CONT${i}`,
        "Quantity": i,
        "20'": i % 2,
        "40'": i % 3,
        "CONT SIZE": "40HQ",
        "Shipper Name": `Shipper ${i}`,
        "Received Date": dayjs().format("YYYY-MM-DD"),
        "SR NAME": `SR${i}`,
      };

      // Use your sanitizeKey function for each key
      const sanitizedRecord: Record<string, any> = {};
      Object.entries(record).forEach(([key, value]) => {
        sanitizedRecord[sanitizeKey(key)] = value;
      });

      await addDoc(collection(db, "employeeData"), sanitizedRecord);
    }
    alert("Inserted 40 dummy records!");
  };

  return (
    <>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
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
          <EmployeeDataFormPage
            columns={columns}
            rows={filteredRows}
            form={form}
            dialogOpen={dialogOpen}
            editIndex={editIndex}
            openEditDialog={openEditDialog}
            openAddDialog={openAddDialog}
            handleDialogClose={handleDialogClose}
            handleDialogSave={handleDialogSave}
            handleChange={handleChange}
            loading={loading}
            handleExportWithTemplate={handleExportWithTemplate}
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={insertDummyRecords}
            sx={{ mb: 2 }}
          >
            Insert 40 Dummy Records
          </Button>
         
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            {totalRows > PAGE_SIZE && (
              <Pagination
                count={Math.ceil(totalRows / PAGE_SIZE)}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            )}
          </Box>
        </>
      )}
    </>
  );
};

export default EmployeeDataFormContainer;
