import React from 'react';

const PdfTemplate: React.FC<{ data: any }> = ({ data }) => {
    return (
        <div>
            <h1>{data.title}</h1>
            <p>{data.description}</p>
            <h2>Details</h2>
            <ul>
                {data.details.map((detail: string, index: number) => (
                    <li key={index}>{detail}</li>
                ))}
            </ul>
        </div>
    );
};

export default PdfTemplate;