import React from 'react';

const ExportData: React.FC = () => {
    const handleExportPdf = () => {
        // Logic to export data as PDF
    };

    const handleExportWord = () => {
        // Logic to export data as Word document
    };

    return (
        <div>
            <h2>Export Data</h2>
            <button onClick={handleExportPdf}>Export as PDF</button>
            <button onClick={handleExportWord}>Export as Word</button>
        </div>
    );
};

export default ExportData;