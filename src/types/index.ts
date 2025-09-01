export interface User {
    id: string;
    email: string;
    displayName?: string;
}

export interface DataEntry {
    id: string;
    title: string;
    description: string;
    createdAt: Date;
}

export interface Outcome {
    id: string;
    dataEntryId: string;
    result: string;
    createdAt: Date;
}

export interface Template {
    id: string;
    name: string;
    content: string;
}