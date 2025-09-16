import React, { useEffect, useState, useCallback, useRef } from 'react';
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
} from '@mui/material';
import {
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { unsanitizeKey, sanitizeKey, columns } from '../../utils/KeySanitizer';
import TextField from '@mui/material/TextField';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Paper from '@mui/material/Paper';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { useNavigate } from 'react-router-dom';
import SortIcon from '@mui/icons-material/Sort';
import { gapi } from 'gapi-script';

// Add global declaration for window.google to avoid TypeScript error
declare global {
  interface Window {
    google?: any;
  }
}

// Define your columns here (should match unsanitized keys)

const PAGE_SIZE = 20;

const ReportPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [filteredRows, setFilteredRows] = useState<Record<string, any>[]>([]);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [blDate, setBlDate] = useState<string | null>(null);
  const [coDate, setCoDate] = useState<string | null>(null);
  const [rcvDate, setRcvDate] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobsConverted, setJobsConverted] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [tokenClient, setTokenClient] = useState<any>(null);
  const googleScriptLoaded = useRef(false);
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);

  // Function to convert Job fields from string to number
  const convertJobs = async () => {
    if (jobsConverted) return; // Skip if already done

    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'employeeData'));
      let updatedCount = 0;
      const batch = writeBatch(db);

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const jobKey = sanitizeKey('Job');

        if (
          data[jobKey] &&
          typeof data[jobKey] === 'string' &&
          !isNaN(Number(data[jobKey]))
        ) {
          batch.update(doc(db, 'employeeData', docSnapshot.id), {
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
      console.error('Error converting jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch rows with pagination and sorting
  const fetchRows = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        // First ensure all jobs are converted to numbers
        await convertJobs();

        // Then proceed with regular fetching with proper numeric sorting
        const q = query(
          collection(db, 'employeeData'),
          orderBy(sanitizeKey('Job'), 'desc'),
          limit(PAGE_SIZE)
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => {
          const raw = doc.data();
          // Create a properly typed mapping with index signature
          const mapped: { id: string; [key: string]: any } = { id: doc.id };

          // Process the fields we need for display
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
        console.error('Error fetching employee data:', err);
      } finally {
        setLoading(false);
      }
    },
    [jobsConverted]
  );

  // Apply filtering to rows
  useEffect(() => {
    if (!document.getElementById('google-identity')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.id = 'google-identity';
      document.body.appendChild(script);
    }
    let filtered = [...rows];

    if (searchText) {
      filtered = filtered.filter((row) =>
        columns.some((col) =>
          String(row[col] ?? '')
            .toLowerCase()
            .includes(searchText.toLowerCase())
        )
      );
    }

    if (blDate) {
      filtered = filtered.filter((row) => row['B/L Date'] === blDate);
    }

    if (coDate) {
      filtered = filtered.filter((row) => row['CO Date'] === coDate);
    }

    if (rcvDate) {
      filtered = filtered.filter((row) => row['Rcv Date'] === rcvDate);
    }

    // Apply sorting if a sort field is selected
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField] || '';
        const bValue = b[sortField] || '';

        // Handle numeric fields differently
        if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
          return sortDirection === 'asc'
            ? Number(aValue) - Number(bValue)
            : Number(bValue) - Number(aValue);
        }

        // Handle string comparison
        return sortDirection === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    setFilteredRows(filtered);
    setTotalRows(filtered.length);
  }, [rows, searchText, blDate, coDate, rcvDate, sortField, sortDirection]);

  // Initial data fetch
  useEffect(() => {
    if (!googleScriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleIdentity;
      document.body.appendChild(script);
      googleScriptLoaded.current = true;
    }

    // Initialize Google Identity Services
    function initializeGoogleIdentity() {
      window.google.accounts.oauth2.initTokenClient({
        client_id:
          '756046169704-piuq4qipnshpv1bqe2jt4327pisccbvv.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            console.log('Token received successfully');
            // Store the token client for later use
            setTokenClient(tokenResponse);
          }
        },
      });
    }
    fetchRows(page);
  }, [fetchRows, page]);

  // Google API initialization

  const initGoogleApi = useCallback(async () => {
    try {
      await new Promise<void>((resolve) => {
        gapi.load('client:auth2', resolve);
      });

      await gapi.client.init({
        apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        discoveryDocs: [
          'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        ],
        scope: 'https://www.googleapis.com/auth/drive.file',
      });

      const authInstance = gapi.auth2.getAuthInstance();
      authInstance.isSignedIn.listen((isSignedIn: boolean) => {
        console.log('Auth status changed:', isSignedIn);
        setIsGoogleAuthenticated(isSignedIn);
      });

      setIsGoogleAuthenticated(authInstance.isSignedIn.get());
      console.log('Google API initialized successfully');
    } catch (error) {
      console.error('Error initializing Google API:', error);
    }
  }, []);

  function loadGoogleScript(): void {
    if (!document.getElementById('google-identity')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.id = 'google-identity';
      document.body.appendChild(script);
    }
  }
  useEffect(() => {
    // Only initialize once when component mounts
    initGoogleApi();
    loadGoogleScript();
  }, [initGoogleApi, loadGoogleScript]);

  const handleExportNewExcel = async () => {
    // Only export the selected rows
    const exportRows =
      selectedRows.length > 0 ? selectedRows.map((idx) => rows[idx]) : [];

    if (exportRows.length === 0) {
      alert('Please select at least one row to export.');
      return;
    }

    /// Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    // Add header row
    const headerRow = worksheet.addRow(columns);

    // Style header
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF1F4E79' }, size: 12 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEFEFEF' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });

    // Freeze header
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Add data rows
    exportRows.forEach((row, rowIdx) => {
      const valueRow = worksheet.addRow(columns.map((key) => row[key] ?? ''));
      valueRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF9F9F9' },
        };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      });
    });

    // Auto width
    (worksheet.columns as ExcelJS.Column[]).forEach((column) => {
      if (!column) return;
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = maxLength + 2;
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ExportedData.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Add function to handle row click and navigation
  const handleRowClick = (row: Record<string, any>) => {
    if (row.id) {
      // Fix: Use the correct nested path under /home
      navigate(`/home/customs-form/${row.id}`);
    }
  };

  // Sort handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Replace the Google API initialization code with this improved version

  // Inside your component, replace the Google API initialization with this:
  // Create a more reliable initialization function

  useEffect(() => {
    // Only initialize once when component mounts
    initGoogleApi();
  }, [initGoogleApi]);

  // Replace the handleGoogleAuth function
  const handleGoogleAuth = async () => {
    try {
      // Load the auth2 library if not loaded
      if (!gapi.auth2) {
        console.log('Auth2 not initialized, loading gapi...');
        await new Promise<void>((resolve) => {
          gapi.load('client:auth2', resolve);
        });

        // Initialize the client
        await gapi.client.init({
          apiKey: 'AIzaSyBrv7EsmH7ic6Y7854ysCAFkiy8qgo_bm8',
          clientId:
            '756046169704-piuq4qipnshpv1bqe2jt4327pisccbvv.apps.googleusercontent.com',
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
          ],
          scope: 'https://www.googleapis.com/auth/drive.file',
        });
      }

      const authInstance = gapi.auth2.getAuthInstance();
      console.log('Auth instance:', authInstance);
      console.log('Is signed in:', authInstance.isSignedIn.get());

      if (!authInstance.isSignedIn.get()) {
        console.log('User not signed in, requesting sign-in...');
        // Use Promise to handle async sign-in
        await new Promise<void>((resolve, reject) => {
          authInstance
            .signIn()
            .then(() => {
              console.log('Sign in successful');
              setIsGoogleAuthenticated(true);
              resolve();
            })
            .catch((error: any) => {
              console.error('Sign in failed:', error);
              reject(error);
            });
        });
      }

      return true;
    } catch (error) {
      console.error('Error during Google authentication:', error);
      return false;
    }
  };

  // Replace the Google Drive export function with this improved version
  // Replace the handleExportToGoogleDrive function with this simpler version

  // Update the handleExportToGoogleDrive function for direct upload

  const handleExportToGoogleDrive = async () => {
    const exportRows =
      selectedRows.length > 0 ? selectedRows.map((idx) => rows[idx]) : [];

    if (exportRows.length === 0) {
      alert('Please select at least one row to export.');
      return;
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    // Add header row (once only)
    const headerRow = worksheet.addRow(columns);

    // Apply header style
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF1F4E79' }, size: 12 }; // Dark blue text
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEFEFEF' }, // Light gray background
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Add data rows
    exportRows.forEach((row, rowIdx) => {
      const valueRow = worksheet.addRow(columns.map((key) => row[key] ?? ''));

      // Optional: zebra striping (alternate row colors)
      valueRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF9F9F9' },
        };
      });
    });

    // Generate the Excel file as a Blob
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    if (
      !window.google ||
      !window.google.accounts ||
      !window.google.accounts.oauth2
    ) {
      alert('Google API not loaded. Please try again in a few seconds.');
      return;
    }

    window.google.accounts.oauth2
      .initTokenClient({
        client_id:
          '756046169704-piuq4qipnshpv1bqe2jt4327pisccbvv.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (tokenResponse: { access_token: any }) => {
          if (!tokenResponse?.access_token) {
            alert('Google authentication failed.');
            return;
          }

          const accessToken = tokenResponse.access_token;
          const fileName = '1.Clearance Follow Up SAMPLE.xlsx';

          try {
            // STEP 1: Check if file already exists
            const searchRes = await fetch(
              `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false&fields=files(id,name)`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const searchData = await searchRes.json();

            const existingFile = searchData.files?.[0];
            const metadata = {
              name: fileName,
              mimeType:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };

            const formData = new FormData();
            formData.append(
              'metadata',
              new Blob([JSON.stringify(metadata)], { type: 'application/json' })
            );
            formData.append('file', blob);

            let uploadUrl =
              'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
            let method = 'POST'; // default = create

            if (existingFile) {
              // STEP 2: If file exists, update it instead of creating
              uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
              method = 'PATCH';
            }

            // STEP 3: Upload or update file
            const uploadRes = await fetch(uploadUrl, {
              method,
              headers: { Authorization: `Bearer ${accessToken}` },
              body: formData,
            });

            if (uploadRes.ok) {
              alert(
                existingFile
                  ? 'File replaced successfully in Google Drive.'
                  : 'File uploaded successfully to Google Drive.'
              );
            } else {
              const errorData = await uploadRes.json();
              alert(
                'Upload failed: ' +
                  (errorData.error?.message || uploadRes.statusText)
              );
            }
          } catch (err) {
            console.error('Drive upload error:', err);
            alert('An error occurred while uploading to Google Drive.');
          }
        },
      })
      .requestAccessToken();
  };

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto', mt: 4, position: 'relative' }}>
      {/* Header Paper similar to EmployeeDataFormPage */}
      <Paper sx={{ mb: 4, p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Shipment Records
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
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
              startIcon={
                <img src="/gdrive-icon.png" alt="" width="16" height="16" />
              }
            >
              Save to Google Drive
            </Button>
          </Box>
        </Box>

        {/* Filter section */}
        <Divider sx={{ my: 2 }} />
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2,
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              minWidth: '200px',
              maxWidth: isMobile ? '100%' : '220px',
            }}
          >
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
            <Box
              sx={{
                flexGrow: 1,
                minWidth: '200px',
                maxWidth: isMobile ? '100%' : '220px',
              }}
            >
              <DatePicker
                label="B/L Date"
                value={blDate ? dayjs(blDate) : null}
                onChange={(date) =>
                  setBlDate(date ? date.format('YYYY-MM-DD') : null)
                }
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Box>
            <Box
              sx={{
                flexGrow: 1,
                minWidth: '200px',
                maxWidth: isMobile ? '100%' : '220px',
              }}
            >
              <DatePicker
                label="CO Date"
                value={coDate ? dayjs(coDate) : null}
                onChange={(date) =>
                  setCoDate(date ? date.format('YYYY-MM-DD') : null)
                }
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Box>
            <Box
              sx={{
                flexGrow: 1,
                minWidth: '200px',
                maxWidth: isMobile ? '100%' : '220px',
              }}
            >
              <DatePicker
                label="Rcv Date"
                value={rcvDate ? dayjs(rcvDate) : null}
                onChange={(date) =>
                  setRcvDate(date ? date.format('YYYY-MM-DD') : null)
                }
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Box>
          </LocalizationProvider>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={() => {
                setSearchText('');
                setBlDate(null);
                setCoDate(null);
                setRcvDate(null);
              }}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        {/* Table section with cleaner design */}
        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      selectedRows.length === filteredRows.length &&
                      filteredRows.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(filteredRows.map((_, idx) => idx));
                      } else {
                        setSelectedRows([]);
                      }
                    }}
                    indeterminate={
                      selectedRows.length > 0 &&
                      selectedRows.length < filteredRows.length
                    }
                  />
                </TableCell>

                {/* Only show important columns on mobile */}
                {columns
                  .filter((col) => !isMobile || columns.includes(col))
                  .map((col, colIndex) => (
                    <TableCell
                      key={`${col}-${colIndex}`}
                      onClick={() => handleSort(col)}
                      sx={{
                        fontWeight: 600,
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {col}
                        {sortField === col && (
                          <SortIcon
                            fontSize="small"
                            sx={{
                              ml: 0.5,
                              transform:
                                sortDirection === 'desc'
                                  ? 'rotate(180deg)'
                                  : 'none',
                              fontSize: '16px',
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
              {filteredRows.map((row, idx) => (
                <TableRow
                  key={idx}
                  onClick={() => handleRowClick(row)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#f9f9fb' },
                  }}
                >
                  <TableCell
                    padding="checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedRows.includes(idx)}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedRows([...selectedRows, idx]);
                        } else {
                          setSelectedRows(
                            selectedRows.filter((i) => i !== idx)
                          );
                        }
                      }}
                    />
                  </TableCell>

                  {columns
                    .filter((col) => !isMobile || columns.includes(col))
                    .map((col) => (
                      <TableCell key={col}>{row[col]}</TableCell>
                    ))}
                </TableRow>
              ))}

              {filteredRows.length === 0 && !loading && (
                <TableRow>
                  <TableCell
                    colSpan={
                      columns.filter(
                        (col) => !isMobile || columns.includes(col)
                      ).length + 1
                    }
                    sx={{ textAlign: 'center', py: 3 }}
                  >
                    <Typography variant="body2">No records found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={Math.ceil(totalRows / PAGE_SIZE)}
            page={page}
            onChange={(_, value) => setPage(value)}
            size="small"
          />
        </Box>
      </Paper>

      {/* Loading indicator */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
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
