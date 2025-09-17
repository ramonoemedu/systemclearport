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
  writeBatch,
} from "firebase/firestore";
import dayjs from "dayjs";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Pagination from "@mui/material/Pagination";
import * as XLSX from "xlsx";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Paper from "@mui/material/Paper";
import LinearProgress from "@mui/material/LinearProgress";
import { columns, dateFields, dropdownFields, PAGE_SIZE, sanitizeKey, unsanitizeKey } from "../../utils/KeySanitizer";




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




const EmployeeDataFormContainer: React.FC = () => {
  const [rows, setRows] = useState<Record<string, string | number>[]>([]);
  const [form, setForm] = useState<Record<string, string>>(initialForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [setLastDoc] = useState<any>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [filteredRows, setFilteredRows] = useState(rows);
  const [blDate, setBlDate] = useState<string | null>(null);
  const [coDate, setCoDate] = useState<string | null>(null);
  const [rcvDate, setRcvDate] = useState<string | null>(null);
  const [importProgress] = useState<number | null>(null);
  const [jobsConverted, setJobsConverted] = useState(false);

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
  // Optimized fetchRows function
  const fetchRows = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        // Then proceed with regular fetching with proper numeric sorting
        let q = query(
          collection(db, "employeeData"),
          orderBy(sanitizeKey("Job"), "desc"),
          limit(PAGE_SIZE)
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => {
          const raw = doc.data();
          // Create a properly typed mapping with index signature
          const mapped: { id: string; [key: string]: any } = { id: doc.id };

          // Only process the fields we need for display
          for (const key of Object.keys(raw)) {
            const originalKey = unsanitizeKey(key);
            mapped[originalKey] = raw[key];
          }

          return mapped;
        });

        setRows(data);
        setLastDoc(
          snapshot.docs.length > 0
            ? snapshot.docs[snapshot.docs.length - 1]
            : null
        );
      } catch (err) {
        console.error("Error fetching employee data:", err);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setRows, setLastDoc]
  );

  // Add this state to store dynamic dropdown options
  const [dropdownOptions, setDropdownOptions] = useState<
    Record<string, string[]>
  >({
    "Imp/Exp": [],
    "Ship'm Mode": [],
    "Vssl/Truck": [],
    // Add any other fields that should be dropdowns
  });

  // Add this function to fetch unique values for dropdown fields
  const fetchDropdownOptions = useCallback(async () => {
    try {
      const dropdownFields = ["Imp/Exp", "Ship'm Mode", "Vssl/Truck"];
      const snapshot = await getDocs(collection(db, "employeeData"));

      // Create object to store unique values for each field
      const uniqueValues: Record<string, Set<string>> = {};
      dropdownFields.forEach((field) => {
        uniqueValues[field] = new Set<string>();
      });

      // Extract unique values from all documents
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        dropdownFields.forEach((field) => {
          const sanitizedField = sanitizeKey(field);
          if (
            data[sanitizedField] &&
            typeof data[sanitizedField] === "string"
          ) {
            uniqueValues[field].add(data[sanitizedField] as string);
          }
        });
      });

      // Convert Sets to arrays and update state
      const options: Record<string, string[]> = {};
      dropdownFields.forEach((field) => {
        options[field] = Array.from(uniqueValues[field]).sort();
      });

      // Add default values to ensure basic options always exist
      const defaults = {
        "Imp/Exp": [
          "IMPORT",
          "EXPORT",
          "DOMESTIC",
          "OTHERS",
          "TRANSIT",
          "WAREHOUSE",
          "RE-EXPORT",
        ],
        "Ship'm_Mode": [
          "SEA",
          "AIR",
          "LAND",
          "LAND-LCL",
          "SEA-LCL",
          "MULTI-MODAL",
        ],
        Vssl_Truck: ["VSSL", "TRUCK", ""],
      };

      // Merge default values with ones from database
      // Use Object.entries instead of Object.keys for type safety
      Object.entries(defaults).forEach(([field, defaultValues]) => {
        const combined = new Set([...defaultValues, ...(options[field] || [])]);
        options[field] = Array.from(combined).sort();
      });

      setDropdownOptions(options);
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
    }
  }, []);

  useEffect(() => {
    fetchRows(page);
    fetchDropdownOptions();
  }, [page, fetchRows, fetchDropdownOptions]);

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

  // Add this function to get the next Job number
  const getNextJobNumber = useCallback(async () => {
    try {
      // Query to get the highest Job number
      const q = query(
        collection(db, "employeeData"),
        orderBy(sanitizeKey("Job"), "desc"),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return 1; // Start with 1 if no records exist
      }

      const highestJob = snapshot.docs[0].data()[sanitizeKey("Job")];
      // Convert to number and add 1
      const nextJob =
        (typeof highestJob === "number"
          ? highestJob
          : Number(highestJob) || 0) + 1;

      return nextJob;
    } catch (error) {
      console.error("Error getting next job number:", error);
      return new Date().getTime(); // Fallback to timestamp if error
    }
  }, []);

  const openAddDialog = async () => {
    const nextJobNumber = await getNextJobNumber();
    const newForm = { ...initialForm, Job: nextJobNumber.toString() };
    setForm(newForm);
    setForm(initialForm);
    setEditIndex(null);
    setDialogOpen(true);
  };

  const openEditDialog = (row: any, idx: number) => {
    console.log("Original row data:", row); // Debug: Check original data

    const { id, ...rowWithoutId } = row;
    const formWithDefaults = { ...initialForm, ...rowWithoutId };

    // Debug: Check if date fields exist
    console.log(
      "Date fields in form before formatting:",
      dateFields.map((field) => ({ field, value: formWithDefaults[field] }))
    );

    dateFields.forEach((field) => {
      if (formWithDefaults[field]) {
        try {
          // Try to parse the date in multiple formats
          const parsedDate = dayjs(formWithDefaults[field], [
            "YYYY-MM-DD",
            "DD-MM-YYYY",
            "MM/DD/YYYY",
            "MM-DD-YYYY",
          ]);

          if (parsedDate.isValid()) {
            formWithDefaults[field] = parsedDate.format("YYYY-MM-DD");
          } else {
            console.warn(
              `Invalid date format for ${field}: ${formWithDefaults[field]}`
            );
          }
        } catch (error) {
          console.error(`Error parsing date for ${field}:`, error);
        }
      }
    });

    // Debug: Check formatted dates
    console.log(
      "Date fields after formatting:",
      dateFields.map((field) => ({ field, value: formWithDefaults[field] }))
    );

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
          if (worksheet[cellAddr] && worksheet[cellAddr].v === key) {
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

// Add a quickFill function to create pre-populated entries
const quickFillForm = async () => {
  // Get the next job number for auto-increment
  const nextJobNumber = await getNextJobNumber();
  
  // Pre-populate with sample data
  const sampleData = {
    "Job": nextJobNumber.toString(),
    "B/L No": "JSDEXP-04002/KS",
    "B/L Date": "2021-04-02", // YYYY-MM-DD format for internal storage
    "Imp/Exp": "RE-EXPORT",
    "Ship'm Mode": "LAND-LCL",
    "Importer": "JI SHUN DA TRADING CO., LTD",
    "Client Name": "FULLWELL MR. KHEAMARA)",
    "Inv": "RE-KSJSD-21-0004/A",
    "PKL": "RE-KSJSD-21-0004/A",
    "INV & PKL Date": "2021-04-01",
    "POL": "SIBW",
    "Transit Port": "KREAL",
    "SCAN STATION": "KREAL",
    "Final Destination": "LAOS",
    "Commodity": "NEW CAR LAND ROVER DISCOVERY",
    "GW": "2446",
    "CBM/CIF": "",
    "Container No": "LCL",
    "Quantity": "1 UNIT",
    "20'": "0",
    "40'": "0",
    "Received Date": "2021-04-08",
    // Add current date for tracking fields
    "TP DATE": dayjs().format("YYYY-MM-DD"),
    "IM8 DATE": dayjs().format("YYYY-MM-DD"),
    // Set creation timestamp
    "Last Updated": dayjs().format("YYYY-MM-DD HH:mm:ss")
  };
  
  setForm(sampleData);
  setEditIndex(null);
  setDialogOpen(true);
};
  // const excelDateFields = [
  //   "B/L Date",
  //   "ETA/ETD",
  //   "CO Date",
  //   "INV & PKL Date",
  //   "Rcv Date",
  //   "IM8 DATE",
  //   "Received Date",
  //   "LOAD ON",
  //   "TP DATE",
  //   "IM7 DATE",
  //   "SR DATE",
  //   "CV DATE",
  //   "IM4 DATE",
  //   "EX3 DATE",
  // ];
  // const importExcelToFirestore = async () => {
  //   try {
  //     setImportProgress(0); // Start progress
  //     const response = await fetch("/assets/1.Clearance Follow Up SAMPLE.xlsx");
  //     const arrayBuffer = await response.arrayBuffer();
  //     const workbook = XLSX.read(arrayBuffer, { type: "array" });
  //     const worksheet = workbook.Sheets["DATA"];
  //     if (!worksheet) {
  //       alert("Sheet named 'DATA' not found!");
  //       setImportProgress(null);
  //       return;
  //     }
  //     const range = XLSX.utils.decode_range(worksheet["!ref"] || "");
  //     const header: string[] = [];
  //     for (let col = 0; col <= range.e.c; col++) {
  //       const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
  //       const cell = worksheet[cellAddress];
  //       header.push(cell ? cell.v : `Column${col + 1}`);
  //     }
  //     const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
  //       header: header,
  //       range: XLSX.utils.encode_range(
  //         { r: range.s.r + 1, c: 0 },
  //         { r: range.e.r, c: range.e.c }
  //       ),
  //       defval: "",
  //     });

  //     for (let i = 0; i < rows.length; i++) {
  //       const row = rows[i];
  //       const sanitizedRow: Record<string, any> = {};
  //       Object.entries(row).forEach(([key, value]) => {
  //         if (excelDateFields.includes(key) && value) {
  //           let formattedDate = "";
  //           if (typeof value === "number") {
  //             const date = new Date(Math.round((value - 25569) * 86400 * 1000));
  //             formattedDate = dayjs(date).format("DD-MM-YYYY");
  //           } else if (
  //             typeof value === "string" &&
  //             dayjs(value, ["YYYY-MM-DD", "DD-MM-YYYY", "MM/DD/YYYY"], true).isValid()
  //           ) {
  //             formattedDate = dayjs(value).format("DD-MM-YYYY");
  //           } else {
  //             formattedDate = value;
  //           }
  //           sanitizedRow[sanitizeKey(key)] = formattedDate;
  //         } else {
  //           sanitizedRow[sanitizeKey(key)] = value;
  //         }
  //       });
  //       await addDoc(collection(db, "employeeData"), sanitizedRow);
  //       setImportProgress(Math.round(((i + 1) / rows.length) * 100));
  //     }

  //     setImportProgress(null); // Hide progress bar
  //     alert(`Imported ${rows.length} rows from Excel to Firestore!`);
  //   } catch (err) {
  //     setImportProgress(null);
  //     console.error("Error importing Excel:", err);
  //     alert("Failed to import Excel data.");
  //   }
  // };

  return (
    <>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper
            sx={{
              p: 2,
              mb: 2,
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
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
                onChange={(date) =>
                  setBlDate(date ? date.format("YYYY-MM-DD") : null)
                }
                slotProps={{
                  textField: { size: "small", sx: { minWidth: 140 } },
                }}
              />
              <DatePicker
                label="CO Date"
                value={coDate ? dayjs(coDate) : null}
                onChange={(date) =>
                  setCoDate(date ? date.format("YYYY-MM-DD") : null)
                }
                slotProps={{
                  textField: { size: "small", sx: { minWidth: 140 } },
                }}
              />
              <DatePicker
                label="Rcv Date"
                value={rcvDate ? dayjs(rcvDate) : null}
                onChange={(date) =>
                  setRcvDate(date ? date.format("YYYY-MM-DD") : null)
                }
                slotProps={{
                  textField: { size: "small", sx: { minWidth: 140 } },
                }}
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
            {/* <Button
              variant="contained"
              color="primary"
              onClick={importExcelToFirestore}
              sx={{ mb: 2 }}
            >
              Import Excel to Firestore
            </Button> */}
            {importProgress !== null && (
              <Box sx={{ width: "100%", mb: 2 }}>
                <LinearProgress variant="determinate" value={importProgress} />
                <Box sx={{ textAlign: "center", mt: 1 }}>{importProgress}%</Box>
              </Box>
            )}
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
            dropdownOptions={dropdownOptions}
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={quickFillForm}
            sx={{ mb: 2 }}
          >
            Quick Fill Form
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
