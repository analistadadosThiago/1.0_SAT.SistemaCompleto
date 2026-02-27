
export interface ReadingData {
  MES: string;
  ANO: string;
  CONTRATO: string;
  BASE: string;
  CIDADE: string;
  UL: string;
  RAZAO: string;
  LOCAL: string;
  ROTA: string;
  TIPO: string;
  LEITURISTA?: string;
  LEITURAS_A_REALIZAR: number;
  LEITURAS_100: number;
  LEITURAS_30: number;
  TELEMETRIA: number;
  LEITURAS: number;
  AUTO_RURAL: number;
  LEITURAS_NAO_REALIZADAS: number;
}

export interface NotaData {
  MES: string;
  ANO: string;
  CONTRATO: string;
  NOTA: string;
  INSTALACAO: string;
  RAZAO: string;
  UL: string;
  BASE: string;
  CIDADE: string;
  TIPO: string;
  LEITURISTA: string;
  NOTAS_GERADAS: number;
  NOTAS_CONCLUIDAS: number;
  NOTAS_PENDENTES: number;
  PRAZO_MEDIO?: number;
  STATUS?: string;
  PROCEDENCIA?: string;
  PRAZO?: string;
  DATA_DA_NOTA?: string;
}

export interface DashboardStats {
  totalToPerform: number;
  totalPerformed: number;
  totalPending: number;
  successRate: number;
  pendingRate: number;
}

export interface SheetResponse {
  data: any[];
  lastUpdate: string | null;
  cellC2: string | null;
  cellT1: string | null;
}

export type AppSection = 'transmissao' | 'notas' | 'notas_triangulo' | 'notas_mantiqueira';
