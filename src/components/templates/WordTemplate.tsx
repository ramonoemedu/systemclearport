import React from 'react';

const WordTemplate: React.FC<{ data: any }> = ({ data }) => {
    return (
        <div>
            <h1>Word Document Template</h1>
            <p>{data.title}</p>
            <p>{data.content}</p>
            {/* Add more fields as necessary */}
        </div>
    );
};

export default WordTemplate;