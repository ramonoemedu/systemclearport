import React from 'react';
import { useParams } from 'react-router-dom';
import { generatePdf } from '../../utils/pdfGenerator';
import { generateWord } from '../../utils/wordGenerator';

const OutcomeDetails: React.FC = () => {
    const { outcomeId } = useParams<{ outcomeId: string }>();
    const [outcomeData, setOutcomeData] = React.useState<any>(null);

    React.useEffect(() => {
        // Fetch outcome details based on outcomeId
        const fetchOutcomeDetails = async () => {
            // Replace with actual data fetching logic
            const data = await fetch(`/api/outcomes/${outcomeId}`).then(res => res.json());
            setOutcomeData(data);
        };

        fetchOutcomeDetails();
    }, [outcomeId]);

    const handleDownloadPdf = () => {
        if (outcomeData) {
            generatePdf(outcomeData);
        }
    };

    const handleDownloadWord = () => {
        if (outcomeData) {
            generateWord(outcomeData);
        }
    };

    if (!outcomeData) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Outcome Details</h1>
            <p>{JSON.stringify(outcomeData)}</p>
            <button onClick={handleDownloadPdf}>Download as PDF</button>
            <button onClick={handleDownloadWord}>Download as Word</button>
        </div>
    );
};

export default OutcomeDetails;