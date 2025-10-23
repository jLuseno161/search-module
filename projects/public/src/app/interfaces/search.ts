export interface Search {
    applicant: Applicant;
    searchType: 'PARCEL_SEARCH' | 'TITLE_SEARCH';
    parcels: string[];
    purpose: string;
    scope: 'ACTIVE' | 'ALL';
    documents: Document[];
}

export interface Applicant {
    name: string;
    identification: string;
}

export interface Faqs {
    question: string;
    answer: string;
    expanded: boolean;
}

export interface CountyRegistryData {
    county: string;
    registries: string[];
}

export interface Parcel {
    id: number;
    parcel_number: string;
}

export interface Document {
    id: number;
    name: string;
    file: File;
}

export interface SearchApplication {
    id: number;
    reference_number: string;
    date_created: Date;
    elapsed: string;
    status: string;
}