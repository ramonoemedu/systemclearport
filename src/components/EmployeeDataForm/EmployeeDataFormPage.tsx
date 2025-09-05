import React from "react";
import {
  Box,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import Stack from "@mui/material/Stack";

const formatDisplayDate = (value: string) => {
  if (!value) return "";
  // Try to parse and format as dd-MM-yyyy
  const d = dayjs(value, ["YYYY-MM-DD", "DD-MM-YYYY"]);
  return d.isValid() ? d.format("DD-MM-YYYY") : value;
};

type Props = {
  columns: string[];
  rows: Record<string, string | number>[];
  form: Record<string, string>;
  dialogOpen: boolean;
  editIndex: number | null;
  openEditDialog: (row: any, idx: number) => void;
  openAddDialog: () => void;
  handleDialogClose: () => void;
  handleDialogSave: () => void;
  handleChange: (col: string, value: string) => void;
  loading: boolean;
  handleExportWithTemplate: () => void;
};

const EmployeeDataFormPage: React.FC<Props> = ({
  columns,
  rows,
  form,
  dialogOpen,
  editIndex,
  openEditDialog,
  openAddDialog,
  handleDialogClose,
  handleDialogSave,
  handleChange,
  loading,
}) => {
  const dateFields = [
    "B/L Date",
    "INV & PKL Date",
    "CO Date",
    "CO Date",
    "Rcv Date",
    "ETA/ETD",
    "Received Date",
    "LOAD ON",
  ];

  const dropdownFields: Record<string, string[]> = {
    "Imp/Exp": ["IMPORT", "EXPORT"],
    "Ship'm Mode": ["SEA", "AIR", "LAND"],
    "Vssl/Truck": ["VSSL", "TRUCK"],
  };

  return (
    <Box sx={{ maxWidth: "100%", mx: "auto", mt: 4, position: "relative" }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Employee Data Management
      </Typography>

      <Paper sx={{ mb: 4, p: 2 }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col}
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
                    {col}
                  </TableCell>
                ))}
                <TableCell
                  sx={{
                    fontWeight: 700,
                    bgcolor: "#f5f5f5",
                    whiteSpace: "nowrap",
                    minWidth: 80,
                    textAlign: "center",
                    borderRight: "none",
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    align="center"
                    sx={{ color: "text.secondary" }}
                  >
                    No employee data found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow
                    key={idx}
                    sx={{ bgcolor: idx % 2 ? "#fafafa" : "inherit" }}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col}
                        sx={{
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          maxWidth: 140,
                          ...(col === "B/L No" ||
                          col === "Quantity" ||
                          col === "CBM/CIF"
                            ? { textAlign: "right" }
                            : {}),
                        }}
                      >
                        {dateFields.includes(col)
                          ? formatDisplayDate(row[col] as string)
                          : row[col]}
                      </TableCell>
                    ))}
                    <TableCell sx={{ textAlign: "center", maxWidth: 80 }}>
                      <Tooltip title="Edit">
                        <IconButton
                          onClick={() => openEditDialog(row, idx)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Tooltip title="Add Employee Data">
        <Fab
          color="primary"
          sx={{ position: "fixed", bottom: 32, right: 32, zIndex: 1000 }}
          onClick={openAddDialog}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: "#f9f9fb" },
        }}
      >
        <DialogTitle>
          {editIndex !== null ? "Edit Employee Data" : "Add Employee Data"}
        </DialogTitle>
        <DialogContent dividers>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ width: "100%" }}>
              {/* Shipment Details */}
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
                Shipment Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {[
                  "B/L No", "B/L Date", "Imp/Exp", "Ship'm Mode", "Importer", "Client Name",
                  "Inv", "PKL", "INV & PKL Date", "CO", "CO Date", "Rcv Date", "Shipping Line",
                  "MBL #", "Vssl/Truck", "ETA/ETD", "LOAD ON", "POL", "Transit Port", "SCAN STATION",
                  "Final Destination"
                ].map((col) => (
                  <Box key={col} sx={{ flex: "1 1 260px", minWidth: 220 }}>
                    {dropdownFields[col] ? (
                      <FormControl fullWidth size="small" required>
                        <InputLabel>{col}</InputLabel>
                        <Select
                          label={col}
                          value={form[col] || ""}
                          onChange={(e) => handleChange(col, e.target.value)}
                        >
                          {dropdownFields[col].map((opt) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : dateFields.includes(col) ? (
                      <DatePicker
                        label={col}
                        value={form[col] ? dayjs(form[col]) : null}
                        onChange={(date) =>
                          handleChange(col, date ? date.format("YYYY-MM-DD") : "")
                        }
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                            required: true,
                            helperText: "Format: dd-mm-yyyy",
                          },
                        }}
                      />
                    ) : (
                      <TextField
                        label={col}
                        value={form[col] || ""}
                        onChange={(e) => handleChange(col, e.target.value)}
                        size="small"
                        fullWidth
                        required
                      />
                    )}
                  </Box>
                ))}
              </Stack>

              {/* Commodity & Container Details */}
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 4, fontWeight: 600 }}>
                Commodity & Container Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {[
                  "Commodity", "NW", "GW", "CBM/CIF", "FOB", "Container No", "Quantity",
                  "20'", "40'", "CONT SIZE", "Shipper Name", "Received Date", "SR NAME"
                ].map((col) => (
                  <Box key={col} sx={{ flex: "1 1 260px", minWidth: 220 }}>
                    {dateFields.includes(col) ? (
                      <DatePicker
                        label={col}
                        value={form[col] ? dayjs(form[col]) : null}
                        onChange={(date) =>
                          handleChange(col, date ? date.format("YYYY-MM-DD") : "")
                        }
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                            required: true,
                            helperText: "Format: dd-mm-yyyy",
                          },
                        }}
                      />
                    ) : (
                      <TextField
                        label={col}
                        value={form[col] || ""}
                        onChange={(e) => handleChange(col, e.target.value)}
                        size="small"
                        fullWidth
                        required
                      />
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={handleDialogSave}
            variant="contained"
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeDataFormPage;