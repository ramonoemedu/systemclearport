import React, { useState, useEffect } from "react";
import EmployeeDataFormPage from "./EmployeeDataFormPage";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import dayjs from "dayjs";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

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
    .replace("B L", "B/L")
    .replace("CBM CIF", "CBM/CIF")
    .replace("ETA ETD", "ETA/ETD")
    .replace("INV PKL Date", "INV & PKL Date")
    .replace("Imp Exp", "Imp/Exp")
    .replace("Vssl Truck", "Vssl/Truck");

const EmployeeDataFormContainer: React.FC = () => {
  const [rows, setRows] = useState<Record<string, string | number>[]>([]);
  const [form, setForm] = useState<Record<string, string>>(initialForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch data from Firestore
  const fetchRows = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "employeeData"));
      const data = snapshot.docs.map((doc) => {
        const raw = doc.data();
        const mapped: Record<string, any> = {};
        Object.entries(raw).forEach(([key, value]) => {
          mapped[unsanitizeKey(key)] = value;
        });
        return { id: doc.id, ...mapped };
      });
      setRows(data);
    } catch (err) {
      console.error("Error fetching employee data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, []);

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

  return (
    <>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <EmployeeDataFormPage
          columns={columns}
          rows={rows}
          form={form}
          dialogOpen={dialogOpen}
          editIndex={editIndex}
          openEditDialog={openEditDialog}
          openAddDialog={openAddDialog}
          handleDialogClose={handleDialogClose}
          handleDialogSave={handleDialogSave}
          handleChange={handleChange}
          loading={loading}
        />
      )}
    </>
  );
};

export default EmployeeDataFormContainer;
