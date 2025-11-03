export interface ImportTransactionDto {
  date: string;
  amount: number;
  note: string;
}

export interface ImportOptionsDto {
  targetAccountId: string;
  dateFormat: 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY';
  amountFormat: 'de' | 'en' | 'simple';
  skipFirstRow: boolean;
}

export interface ImportRequestDto {
  data: ImportTransactionDto[];
  mapping: {
    date: string;
    amount: string;
    note: string;
  };
  options: ImportOptionsDto;
}

export interface ImportResultDto {
  total: number;
  successful: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  createdTransactions?: any[];
}
