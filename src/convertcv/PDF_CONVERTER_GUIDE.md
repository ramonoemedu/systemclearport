# PDF Converter Integration Guide

## Overview
The PDF Converter feature allows users to upload PDF files and automatically convert them to both Markdown (.md) and Word (.docx) formats. Files are automatically saved to Firebase Storage and conversion history is tracked in Firestore.

## Features
- ✅ Automatic PDF file upload
- ✅ Automatic text extraction from PDF
- ✅ Automatic OCR for image-based PDFs
- ✅ **Automatic export to Markdown format** ⭐
- ✅ **Automatic export to Word format** ⭐
- ✅ **Automatic cloud storage upload** ⭐
- ✅ **Conversion history tracking** ⭐
- ✅ Progress tracking during conversion
- ✅ File preview of extracted text
- ✅ Error handling
- ✅ Responsive design

## Installation

### Step 1: Dependencies Already Installed
Your project already has the required dependencies:
- `pdfjs-dist` - PDF extraction
- `tesseract.js` - OCR functionality
- `docx` - Word document generation
- `file-saver` - File download

### Step 2: Add Route to App.tsx
Update your `src/App.tsx` file to include the PDF Converter route:

```tsx
import PdfConverterPage from './components/PdfConverter/PdfConverterPage';

// Add this route inside the RequireAuth section:
<Route path="pdf-converter" element={<PdfConverterPage />} />
```

### Step 3: Add Navigation Link
Update your navigation/menu to include a link to the PDF Converter:

```tsx
<Link to="/home/pdf-converter">PDF Converter</Link>
```

## Component Structure

### PdfToMarkdownConverter.tsx
- Main component handling the conversion logic
- Tab interface for "Convert" and "History"
- Uses pdf.js for text extraction
- Uses Tesseract.js for OCR when text is unavailable
- Automatically exports to both Markdown and Word formats
- Uploads files to Firebase Storage
- Saves conversion records to Firestore

### ConversionHistory.tsx
- Displays user's conversion history
- Shows file information and dates
- Allows downloading and deleting conversions
- Fetches data from Firestore

### conversionService.ts
- Utility service for Firestore operations
- Methods:
  - `saveConversion()` - Save conversion record
  - `getConversionHistory()` - Fetch user's history
  - `deleteConversion()` - Delete conversion record

## Usage

1. Navigate to the PDF Converter page
2. Click "Choose PDF File" and select a PDF
3. Click "Convert PDF" to start the conversion
4. **Both .md and .docx files are automatically created and saved to the cloud**
5. View conversion history in the "History" tab
6. Download files from the history anytime

## What Happens Automatically

When you convert a PDF:
1. **Text Extraction** - Extracts text from PDF pages
2. **OCR Processing** - Uses Tesseract.js for scanned documents
3. **Markdown Creation** - Automatically creates .md file
4. **Word Creation** - Automatically creates formatted .docx file
5. **Cloud Upload** - Uploads both files to Firebase Storage
6. **History Recording** - Saves conversion record to Firestore database

## File Storage

Files are automatically organized in Firebase Storage:
```
conversions/
├── {userId}/
│   ├── {timestamp}_{filename}.md
│   └── {timestamp}_{filename}.docx
```

Conversion history is stored in Firestore:
```
pdf_conversions/
├── {conversionId}
│   ├── userId
│   ├── fileName
│   ├── pageCount
│   ├── pdfSize
│   ├── mdPath
│   ├── docxPath
│   ├── status
│   └── createdAt
```

## How It Works

### Text Extraction
1. Loads PDF using pdf.js
2. Attempts to extract text from each page
3. If text is found, uses that content
4. If no text (scanned/image-based PDF), uses OCR

### OCR Processing
- Converts PDF pages to canvas
- Uses Tesseract.js to recognize text from images
- Supports English language by default
- Can be extended to support other languages

### Export
- Markdown: Plain text format with page separators
- Word: Formatted document with proper headings and structure

## Performance Notes
- OCR processing may take longer for multi-page documents
- Large PDFs (100+ pages) may take several minutes
- Progress indicator shows conversion status

## Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Uses Web Workers for PDF processing

## Future Enhancements
- [ ] Batch PDF conversion
- [ ] Language selection for OCR
- [ ] PDF editing capabilities
- [ ] Share files with other users
- [ ] Email converted files
- [ ] Export to additional formats (Excel, Google Docs, etc.)
- [ ] Advanced text editing before export
- [ ] File compression options
