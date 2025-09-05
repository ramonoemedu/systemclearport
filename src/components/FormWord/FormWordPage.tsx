import React, { useRef } from "react";
import { Box, Paper, Typography, Button, Stack, IconButton, Divider } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";

const FormWordPage: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Toolbar actions
  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    contentRef.current?.focus();
  };

  // Export to Word (.doc)
  const handleExportToWord = () => {
    const content = contentRef.current?.innerHTML || "";
    const blob = new Blob(
      [
        `<html><head><meta charset="utf-8"></head><body>${content}</body></html>`
      ],
      { type: "application/msword" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Document.doc";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 6 }}>
      <Paper
        elevation={6}
        sx={{
          p: 0,
          borderRadius: 4,
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          bgcolor: "#f5f7fa",
        }}
      >
        {/* Toolbar */}
        <Box sx={{ px: 3, pt: 2, pb: 1, bgcolor: "#fff", borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" fontWeight={700} sx={{ color: "#1976d2", mr: 2 }}>
              Word-like Editor
            </Typography>
            <IconButton onClick={() => exec("bold")}><FormatBoldIcon /></IconButton>
            <IconButton onClick={() => exec("italic")}><FormatItalicIcon /></IconButton>
            <IconButton onClick={() => exec("underline")}><FormatUnderlinedIcon /></IconButton>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <IconButton onClick={() => exec("justifyLeft")}><FormatAlignLeftIcon /></IconButton>
            <IconButton onClick={() => exec("justifyCenter")}><FormatAlignCenterIcon /></IconButton>
            <IconButton onClick={() => exec("justifyRight")}><FormatAlignRightIcon /></IconButton>
          </Stack>
        </Box>
        {/* Document area */}
        <Box
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          sx={{
            minHeight: 500,
            bgcolor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            p: 4,
            fontSize: 18,
            lineHeight: 1.8,
            fontFamily: `"Calibri", "Arial", sans-serif`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            outline: "none",
            margin: 4,
          }}
        >
          Type your document here...
        </Box>
        {/* Footer */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", px: 4, pb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExportToWord}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Export to Word
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default FormWordPage;