declare module 'genbank-parser' {
  interface ParsedGenbank {
    name: string;
    sequence: string;
    circular: boolean;
    moleculeType: string;
    version?: string;
    keywords?: string;
    genbankDivision?: string;
    date: string;
    size: number;
    definition: string;
    accession: string;
    source: string;
    organism: string;
    references: {
      description: string;
      authors?: string;
      title?: string;
      journal?: string;
    }[];
    features: {
      name: string;
      start: number;
      end: number;
      strand: 1 | -1;
      type: string;
      notes: {
        [key: string]: string[];
      };
    }[];
  }

  export default function(str: string): ParsedGenbank[];
}
