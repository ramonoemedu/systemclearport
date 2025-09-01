import React, { useState } from 'react';

const ImportData: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (file) {
            // Logic to handle file import goes here
            console.log('Importing file:', file.name);
            // You can add your Firebase logic here to upload the file
        }
    };

    return (
        <div>
            <h2>Import Data</h2>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleImport} disabled={!file}>
                Import
            </button>
        </div>
    );
};

export default ImportData;