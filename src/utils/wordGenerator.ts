import { Document, Packer, Paragraph, TextRun } from 'docx';

export const generateWord = async (data: any) => {
    const doc = new Document({
        sections: [
            {
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Title: ${data.title}`,
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph(`Description: ${data.description}`),
                    new Paragraph(`Date: ${data.date}`),
                ],
            },
        ],
    });

    // Generate the Word document
    const buffer = await Packer.toBuffer(doc);
    return buffer;
};