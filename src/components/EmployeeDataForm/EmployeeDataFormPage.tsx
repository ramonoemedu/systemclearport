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
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Avatar,
  useTheme
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import Stack from "@mui/material/Stack";
import { dateFields, formatDisplayDate } from "../../utils/KeySanitizer";



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
  dropdownOptions: Record<string, string[]>;
  openDetailDialog: (row: any) => void;
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
  openDetailDialog,
  dropdownOptions,
}) => {



  return (
    <Box sx={{ maxWidth: "100%", mx: "auto", mt: 4, position: "relative" }}>
      <Paper sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          Employee Data Management
        </Typography>

        <Paper sx={{ mb: 4, p: 2 }}>
          <TableContainer>
            <Table stickyHeader sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell
                      key={col}
                      sx={{
                        fontWeight: 700,
                        bgcolor: "#f0f2f5",
                        color: "#444",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        maxWidth: 160,
                        minWidth: 100,
                        fontSize: 13,
                        py: 1.5,
                        borderBottom: "2px solid #e0e0e0",
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
                      bgcolor: "#f0f2f5",
                      color: "#444",
                      whiteSpace: "nowrap",
                      minWidth: 80,
                      textAlign: "center",
                      py: 1.5,
                      borderBottom: "2px solid #e0e0e0",
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
                      hover
                      sx={{
                        '&:nth-of-type(odd)': { bgcolor: '#fafafa' },
                        '&:hover': { bgcolor: '#f5f9ff !important' },
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => openDetailDialog(row)}
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
          <DialogContent dividers sx={{ backgroundColor: "#f5f7fa", p: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Card elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
                    <CardHeader
                      avatar={<Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}><LocalShippingIcon fontSize="small" /></Avatar>}
                      title="Shipment Details"
                      titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                      sx={{ borderBottom: "1px solid #f0f0f0", py: 1.5, px: 2 }}
                    />
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Grid container spacing={2}>
                        {[
                          "Job", "B/L No", "B/L Date", "Imp/Exp", "Ship'm Mode", "Importer",
                          "Client Name", "Inv", "PKL", "INV & PKL Date", "CO", "CO Date",
                          "Rcv Date", "Shipping Line", "MBL #", "Vssl/Truck", "ETA/ETD",
                          "LOAD ON", "POL", "Transit Port", "SCAN STATION", "Final Destination",
                        ].map((col) => (
                          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={col}>
                            {Object.keys(dropdownOptions).includes(col) ? (
                              <FormControl fullWidth size="small" required variant="outlined">
                                <InputLabel>{col}</InputLabel>
                                <Select
                                  label={col}
                                  value={form[col] || ""}
                                  onChange={(e) => handleChange(col, e.target.value)}
                                >
                                  {dropdownOptions[col].map((opt) => (
                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : dateFields.includes(col) ? (
                              <DatePicker
                                label={col}
                                value={form[col] ? dayjs(form[col]) : null}
                                onChange={(date) => handleChange(col, date ? date.format("YYYY-MM-DD") : "")}
                                slotProps={{
                                  textField: { size: "small", fullWidth: true, required: true, variant: "outlined" },
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
                                variant="outlined"
                              />
                            )}
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Commodity & Container Details Section */}
                <Grid size={{ xs: 12 }}>
                  <Card elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
                    <CardHeader
                      avatar={<Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}><InventoryIcon fontSize="small" /></Avatar>}
                      title="Commodity & Container"
                      titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                      sx={{ borderBottom: "1px solid #f0f0f0", py: 1.5, px: 2 }}
                    />
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Grid container spacing={2}>
                        {[
                          "Commodity", "NW", "GW", "CBM/CIF", "FOB", "Container No",
                          "Quantity", "20'", "40'", "CONT SIZE", "Shipper Name",
                          "Received Date", "SR NAME",
                        ].map((col) => (
                          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={col}>
                            {dateFields.includes(col) ? (
                              <DatePicker
                                label={col}
                                value={form[col] ? dayjs(form[col]) : null}
                                onChange={(date) => handleChange(col, date ? date.format("YYYY-MM-DD") : "")}
                                slotProps={{
                                  textField: { size: "small", fullWidth: true, required: true },
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
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Customs & Tracking Details Section */}
                <Grid size={{ xs: 12 }}>
                  <Card elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
                    <CardHeader
                      avatar={<Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}><DescriptionIcon fontSize="small" /></Avatar>}
                      title="Customs & Tracking"
                      titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
                      sx={{ borderBottom: "1px solid #f0f0f0", py: 1.5, px: 2 }}
                    />
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Grid container spacing={2}>
                        {[
                          "TP", "TP DATE", "IM8", "IM8 DATE", "GATE IN DP/BW/SEZ",
                          "IM7", "IM7 DATE", "SR", "SR DATE", "CV", "CV DATE",
                          "CO", "CO DATE", "IM4", "IM4 DATE", "EX3", "EX3 DATE",
                          "GATE OUT DP/BW/SEZ", "INV",
                        ].map((col) => (
                          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={col}>
                            {dateFields.includes(col) ? (
                              <DatePicker
                                label={col}
                                value={form[col] ? dayjs(form[col]) : null}
                                onChange={(date) => handleChange(col, date ? date.format("YYYY-MM-DD") : "")}
                                slotProps={{
                                  textField: { size: "small", fullWidth: true, required: true },
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
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
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
      </Paper>
    </Box>
  );
};

export default EmployeeDataFormPage;
