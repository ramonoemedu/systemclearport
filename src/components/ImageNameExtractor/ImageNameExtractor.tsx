import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import Tesseract from 'tesseract.js';
import ExcelJS from 'exceljs';

interface ExtractedName {
  name: string;
  source: string;
}

const ImageNameExtractor: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [extractedNames, setExtractedNames] = useState<ExtractedName[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const imageFiles = Array.from(files).filter(file =>
        file.type.startsWith('image/')
      );
      setImages(prev => [...prev, ...imageFiles]);
      setError(null);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const extractNamesFromImages = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    const allNames: ExtractedName[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        setProgress(Math.round(((i + 1) / images.length) * 100));

        const { data: { text } } = await Tesseract.recognize(image, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const baseProgress = (i / images.length) * 100;
              const imageProgress = (m.progress / images.length) * 100;
              setProgress(Math.round(baseProgress + imageProgress));
            }
          },
        });

        // Extract names using the pattern that matches underscore-separated names
        const namePattern = /([A-Z]+_[A-Z]+(?:_[A-Z]+)?)/g;
        const matches = text.match(namePattern);

        if (matches) {
          const uniqueMatches = Array.from(new Set(matches));
          uniqueMatches.forEach(match => {
            // Convert underscores to spaces
            const name = match.replace(/_/g, ' ');

            // Check for duplicates across all images
            if (!allNames.some(n => n.name === name)) {
              allNames.push({ name, source: image.name });
            }
          });
        }
      }

      // Sort names alphabetically
      allNames.sort((a, b) => a.name.localeCompare(b.name));
      setExtractedNames(allNames);
      setProgress(100);
    } catch (err) {
      setError(`Error processing images: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadExcel = async () => {
    if (extractedNames.length === 0) {
      setError('No names to export');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Extracted Names');

      // Add headers
      worksheet.columns = [
        { header: 'No.', key: 'no', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Source Image', key: 'source', width: 30 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true, size: 12 };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Add data
      extractedNames.forEach((item, index) => {
        worksheet.addRow({
          no: index + 1,
          name: item.name,
          source: item.source,
        });
      });

      // Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Download file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `extracted_names_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Error creating Excel file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const clearAll = () => {
    setImages([]);
    setExtractedNames([]);
    setProgress(0);
    setError(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Image Name Extractor
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Upload Section */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload Images
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload one or more images containing names. Supported formats: PNG, JPG, JPEG
            </Typography>

            <Button
              variant="contained"
              component="label"
              startIcon={<CloudUploadIcon />}
              disabled={isProcessing}
            >
              Choose Images
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Button>

            {images.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Images ({images.length}):
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                  {images.map((image, index) => (
                    <Chip
                      key={index}
                      icon={<ImageIcon />}
                      label={image.name}
                      onDelete={() => removeImage(index)}
                      deleteIcon={<DeleteIcon />}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={extractNamesFromImages}
            disabled={isProcessing || images.length === 0}
            startIcon={isProcessing ? <CircularProgress size={20} /> : null}
          >
            {isProcessing ? `Processing... ${progress}%` : 'Extract Names'}
          </Button>

          <Button
            variant="outlined"
            color="success"
            onClick={downloadExcel}
            disabled={extractedNames.length === 0 || isProcessing}
            startIcon={<DownloadIcon />}
          >
            Download Excel
          </Button>

          <Button
            variant="outlined"
            color="error"
            onClick={clearAll}
            disabled={isProcessing}
          >
            Clear All
          </Button>
        </Stack>

        {/* Results Section */}
        {extractedNames.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Extracted Names ({extractedNames.length})
              </Typography>
              <Paper
                sx={{
                  maxHeight: 400,
                  overflow: 'auto',
                  bgcolor: 'background.default',
                }}
              >
                <List dense>
                  {extractedNames.map((item, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={`${index + 1}. ${item.name}`}
                        secondary={`From: ${item.source}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
};

export default ImageNameExtractor;
