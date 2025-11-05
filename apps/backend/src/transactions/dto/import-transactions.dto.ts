import { ApiProperty } from '@nestjs/swagger';

export class ImportTransactionDto {
  @ApiProperty({
    description: 'Datum der Transaktion',
    example: '05.11.2025',
  })
  date!: string;

  @ApiProperty({
    description: 'Betrag der Transaktion',
    example: 45.99,
  })
  amount!: number;

  @ApiProperty({
    description: 'Notiz zur Transaktion',
    example: 'Supermarkt Einkauf',
  })
  note!: string;
}

export class ImportOptionsDto {
  @ApiProperty({
    description: 'Ziel-Konto-ID',
    example: '1',
  })
  targetAccountId!: string;

  @ApiProperty({
    description: 'Datumsformat',
    enum: ['DD.MM.YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'],
    example: 'DD.MM.YYYY',
  })
  dateFormat!: 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY';

  @ApiProperty({
    description: 'Betragsformat',
    enum: ['de', 'en', 'simple'],
    example: 'de',
  })
  amountFormat!: 'de' | 'en' | 'simple';

  @ApiProperty({
    description: 'Erste Zeile überspringen (Header)',
    example: true,
  })
  skipFirstRow!: boolean;
}

export class ImportMappingDto {
  @ApiProperty({
    description: 'Spaltenname für Datum',
    example: 'Datum',
  })
  date!: string;

  @ApiProperty({
    description: 'Spaltenname für Betrag',
    example: 'Betrag',
  })
  amount!: string;

  @ApiProperty({
    description: 'Spaltenname für Notiz',
    example: 'Beschreibung',
  })
  note!: string;
}

export class ImportRequestDto {
  @ApiProperty({
    description: 'Array der zu importierenden Transaktionen',
    type: [ImportTransactionDto],
  })
  data!: ImportTransactionDto[];

  @ApiProperty({
    description: 'Mapping der Spalten',
    type: ImportMappingDto,
  })
  mapping!: ImportMappingDto;

  @ApiProperty({
    description: 'Import-Optionen',
    type: ImportOptionsDto,
  })
  options!: ImportOptionsDto;
}

export class ImportErrorDetailDto {
  @ApiProperty({
    description: 'Zeilennummer mit Fehler',
    example: 5,
  })
  row!: number;

  @ApiProperty({
    description: 'Fehlerhafte Daten',
    example: { date: '32.13.2025', amount: 'invalid' },
  })
  data!: any;

  @ApiProperty({
    description: 'Fehlermeldung',
    example: 'Ungültiges Datum',
  })
  error!: string;
}

export class ImportResultDto {
  @ApiProperty({
    description: 'Gesamtanzahl der Transaktionen',
    example: 100,
  })
  total!: number;

  @ApiProperty({
    description: 'Erfolgreich importierte Transaktionen',
    example: 95,
  })
  successful!: number;

  @ApiProperty({
    description: 'Übersprungene Transaktionen',
    example: 2,
  })
  skipped!: number;

  @ApiProperty({
    description: 'Fehlerhafte Transaktionen',
    example: 3,
  })
  errors!: number;

  @ApiProperty({
    description: 'Details zu Fehlern',
    type: [ImportErrorDetailDto],
  })
  errorDetails!: ImportErrorDetailDto[];

  @ApiProperty({
    description: 'Erstellte Transaktionen (optional)',
    required: false,
  })
  createdTransactions?: any[];
}
