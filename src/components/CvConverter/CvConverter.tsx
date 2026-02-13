import React, { useState } from 'react';
import { Box, Button, Typography, Stack, Paper, CircularProgress, List, ListItem, ListItemText, Divider, Alert, LinearProgress } from '@mui/material';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { createWorker } from 'tesseract.js';
import { saveAs } from 'file-saver';

type ConvertedFile = { name: string; url: string; blob: Blob };

const ImageToWordCv: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [converted, setConverted] = useState<ConvertedFile[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setConverted([]);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    try {
      setExtracting(true);
      setError(null);
      setStatus('Initializing OCR engine...');

      const worker = await createWorker('eng');

      setStatus('Recognizing text from image...');
      const ret = await worker.recognize(file);

      setStatus('Processing extracted text...');
      const lines = ret.data.lines;
      await worker.terminate();

      if (!lines || lines.length === 0) {
        throw new Error('No text detected in the image.');
      }

      // Filter and clean lines
      const cleanLines = lines
        .map((line: any) => line.text.trim())
        .filter((text: string) => text.length > 0);

      if (cleanLines.length === 0) {
        throw new Error('No readable text found after cleanup.');
      }

      setStatus('Generating Word document...');

      // Dynamic identity (e.g., finding a name-like string at the top)
      // Heuristic: First line that isn't a common header and has reasonable length
      const dynamicName = cleanLines.find((l: string) =>
        l.length > 3 && l.length < 50 && !/CV|RESUME|CURRICULUM/i.test(l)
      ) || "PROFESSIONAL CV";

      const createHeader = (title: string) => new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 },
        border: { bottom: { color: "2E74B5", space: 1, style: BorderStyle.SINGLE, size: 8 } },
        children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 24, font: "Arial", color: "2E74B5" })],
      });

      const doc = new Document({
        sections: [{
          properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
          children: [
            // Header
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: dynamicName, bold: true, size: 44, font: "Arial", color: "2B3A67" })],
            }),

            // Contact Info (Heuristic: Take next few lines)
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
              children: [new TextRun({ text: cleanLines.slice(1, 5).join(" | "), size: 18, font: "Calibri", color: "666666" })],
            }),

            // Content Sections
            ...cleanLines.slice(5).map((text: string) => {
              // Identify potential section headers
              const isSectionHeader = /EDUCATION|EXPERIENCE|SKILLS|CONTACT|PROFILE|REFERENCE|LANGUAGES|SUMMARY/i.test(text) && text.length < 30;

              if (isSectionHeader) return createHeader(text);

              return new Paragraph({
                spacing: { before: 80 },
                children: [
                  new TextRun({
                    text: text,
                    size: 21,
                    font: "Calibri",
                    bold: text.includes(':') // Bold keys in key-value pairs
                  })
                ],
              });
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `${file.name.replace(/\.[^/.]+$/, "")}_Modern_CV.docx`;
      const url = URL.createObjectURL(blob);

      setConverted(prev => [{ name: fileName, url, blob }, ...prev]);
      saveAs(blob, fileName);
      setStatus('Done!');
    } catch (err) {
      console.error("Image conversion failed:", err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred during conversion.');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 850, mx: 'auto' }}>
      <Paper elevation={0} sx={{ p: 5, borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Modern CV Designer</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Convert CV images (PNG/JPG) to editable Word documents.
        </Typography>

        <Stack direction="column" spacing={2} sx={{ mb: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button variant="contained" component="label" disableElevation sx={{ bgcolor: '#2e74b5' }}>
              Choose Image
              <input hidden type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
            </Button>
            {file && <Typography variant="body2">{file.name}</Typography>}
          </Stack>

          <Button
            variant="outlined"
            onClick={handleConvert}
            disabled={!file || extracting}
            fullWidth
            sx={{ py: 1.5 }}
          >
            {extracting ? "Converting..." : "Convert to Word"}
          </Button>
        </Stack>

        {extracting && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress />
            <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
              {status}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {converted.length > 0 && (
          <>
            <Divider />
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Converted Files</Typography>
            <List>
              {converted.map((c, i) => (
                <ListItem key={i} sx={{ border: '1px solid #f7fafc', mb: 1, borderRadius: 2, bgcolor: '#f0f9ff' }} secondaryAction={
                  <Button size="small" variant="contained" color="success" onClick={() => saveAs(c.blob, c.name)}>Download DOCX</Button>
                }>
                  <ListItemText primary={c.name} secondary="Ready for download" />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ImageToWordCv;