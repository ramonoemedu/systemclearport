import React from 'react';
import CreateDataForm from './CreateDataForm';
import ImportData from './ImportData';
import ExportData from './ExportData';
import OutcomeDetails from './OutcomeDetails';

const PortalPage: React.FC = () => {
    return (
        <div>
            <h1>Data Management Portal</h1>
            <CreateDataForm />
            <ImportData />
            <ExportData />
            <OutcomeDetails />
        </div>
    );
};

export default PortalPage;