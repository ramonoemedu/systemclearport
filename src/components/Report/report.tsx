import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Divider, Paper, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../firebase/config";
import * as XLSX from "xlsx";

const columns = [
  "clientName", "blNo"
  // Add all your columns here, matching EmployeeDataForm and your template
];

const templatePath = "/assets/report.xlsx";

const ReportPage: React.FC = () => {
  const [dbRows, setDbRows] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "employeeData"));
      const rows = querySnapshot.docs.map(doc => doc.data());
      setDbRows(rows);
    };
    fetchData();
  }, []);

  const handleExportWithTemplate = async () => {
    const response = await fetch(templatePath);
    const arrayBuffer = await response.arrayBuffer();
    // Debug: Check if the response is valid
    console.log("ArrayBuffer length:", arrayBuffer.byteLength);
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Use your first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Replace placeholders in the sheet
    if (dbRows.length > 0) {
      const rowData = dbRows[0];
      Object.keys(rowData).forEach((key) => {
        // Find and replace all cells with the key name
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

    // Export the modified workbook
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "FilledReport.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Export Excel Report (Template)
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Paper sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell key={col} sx={{ fontWeight: 700 }}>{col}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {dbRows.map((row, idx) => (
              <TableRow key={idx}>
                {columns.map(col => (
                  <TableCell key={col}>{row[col]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Button variant="contained" color="primary" onClick={handleExportWithTemplate}>
        Export to Excel (Template)
      </Button>
    </Box>
  );
};

export default ReportPage;