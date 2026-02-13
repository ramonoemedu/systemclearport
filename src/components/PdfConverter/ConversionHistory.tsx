import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { auth } from '../../firebase/config';
import { conversionService, ConversionRecord } from '../../utils/conversionService';

const ConversionHistory: React.FC = () => {
  const [history, setHistory] = useState<ConversionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const records = await conversionService.getConversionHistory(userId);
          setHistory(records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const handleDelete = async (conversionId: string) => {
    try {
      await conversionService.deleteConversion(conversionId);
      setHistory(history.filter(h => h.id !== conversionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversion');
    }
  };

  if (loading) return <CircularProgress />;

  if (error) return <Alert severity="error">{error}</Alert>;

  if (history.length === 0) {
    return (
      <Alert severity="info">
        No conversions yet. Start by uploading a PDF file above.
      </Alert>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Conversion History
      </Typography>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell>File Name</TableCell>
            <TableCell align="right">Pages</TableCell>
            <TableCell align="right">Size (MB)</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.fileName}</TableCell>
              <TableCell align="right">{record.pageCount}</TableCell>
              <TableCell align="right">{(record.pdfSize / 1024 / 1024).toFixed(2)}</TableCell>
              <TableCell>
                {new Date(record.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell align="center">
                <IconButton size="small" title="Download files">
                  <DownloadIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(record.id!)}
                  title="Delete conversion"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ConversionHistory;
