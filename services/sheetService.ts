
import { ReadingData, NotaData, SheetResponse } from '../types';

export const parseGoogleSheetUrl = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return null;
  const id = match[1];
  
  const gidMatch = url.match(/[#&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
};

const normalizeHeader = (str: string): string => {
  return str
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/\s+/g, '_');
};

export const fetchSheetData = async (csvUrl: string, section: AppSection): Promise<SheetResponse> => {
  const response = await fetch(csvUrl);
  
  if (!response.ok) {
    throw new Error('Não foi possível acessar a planilha. Verifique o compartilhamento.');
  }

  const text = await response.text();
  
  if (text.trim().toLowerCase().startsWith('<!doctype html') || text.trim().toLowerCase().startsWith('<html')) {
    throw new Error('Acesso negado: Certifique-se que a planilha está compartilhada como "Qualquer pessoa com o link" ou foi "Publicada na Web".');
  }

  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 1) throw new Error('A planilha está vazia.');

  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  // Extrair W1 da primeira linha (índice 22)
  const firstLineCells = lines[0].split(delimiter);
  const cellW1 = firstLineCells.length > 22 ? firstLineCells[22].trim() : null;

  const rawHeaders = lines[0].split(delimiter).map(h => h.trim());
  const normalizedHeaders = rawHeaders.map(normalizeHeader);
  
  const transmissionMap: Record<string, string> = {
    'MES': 'MES', 'ANO': 'ANO', 'CONTRATO': 'CONTRATO', 'BASE': 'BASE', 'CIDADE': 'CIDADE',
    'UL': 'UL', 'RAZAO': 'RAZAO', 'RAZAO_SOCIAL': 'RAZAO', 'LOCAL': 'LOCAL', 'ROTA': 'ROTA', 'TIPO': 'TIPO',
    'LEITURISTA': 'LEITURISTA', 'NOME_LEITURISTA': 'LEITURISTA',
    'LEITURAS_A_REALIZAR': 'LEITURAS_A_REALIZAR', 'LEITURAS_100%': 'LEITURAS_100', 'LEITURAS_30%': 'LEITURAS_30',
    'TELEMETRIA': 'TELEMETRIA', 'LEITURAS': 'LEITURAS', 'AUTO_RURAL': 'AUTO_RURAL',
    'LEITURAS_NAO_REALIZADAS': 'LEITURAS_NAO_REALIZADAS', 'LEITURAS_N_REALIZADAS': 'LEITURAS_NAO_REALIZADAS',
    'STATUS': 'STATUS'
  };

  const notasMap: Record<string, string> = {
    'MES': 'MES', 'ANO': 'ANO', 'CONTRATO': 'CONTRATO', 'BASE': 'BASE', 'CIDADE': 'CIDADE',
    'RAZAO': 'RAZAO', 'RAZAO_SOCIAL': 'RAZAO', 'TIPO': 'TIPO', 'LEITURISTA': 'LEITURISTA',
    'NOME_LEITURISTA': 'LEITURISTA', 'NOTAS_GERADAS': 'NOTAS_GERADAS', 'NOTAS_CONCLUIDAS': 'NOTAS_CONCLUIDAS',
    'NOTAS_CONCLUIDAS_': 'NOTAS_CONCLUIDAS', 'NOTAS_PENDENTES': 'NOTAS_PENDENTES', 'PRAZO_MEDIO': 'PRAZO_MEDIO',
    'STATUS': 'STATUS', 'INSTALACAO': 'INSTALACAO', 'INSTALACAO_': 'INSTALACAO', 'UL': 'UL', 'UNIDADE_DE_LEITURA': 'UL',
    'NOTA': 'NOTA', 'N_NOTA': 'NOTA', 'NOTAS': 'NOTA', 'PROCEDENCIA': 'PROCEDENCIA', 'PRAZO': 'PRAZO'
  };

  const headerMap = section === 'transmissao' ? transmissionMap : notasMap;

  const data: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim());
    if (values.length < 3) continue;

    const row: any = {};
    normalizedHeaders.forEach((normHeader, index) => {
      const targetKey = headerMap[normHeader] || normHeader;
      const val = values[index];
      const numericFields = [
        'LEITURAS_A_REALIZAR', 'LEITURAS_100', 'LEITURAS_30', 'TELEMETRIA', 
        'LEITURAS', 'AUTO_RURAL', 'LEITURAS_NAO_REALIZADAS', 'NOTAS_GERADAS', 
        'NOTAS_CONCLUIDAS', 'NOTAS_PENDENTES', 'PRAZO_MEDIO'
      ];

      if (numericFields.includes(targetKey)) {
        const cleanedVal = (val || '0').replace(/\./g, '').replace(',', '.');
        row[targetKey] = parseFloat(cleanedVal) || 0;
      } else {
        row[targetKey] = val || '';
      }
    });

    if (section === 'notas' || section === 'notas_triangulo' || section === 'notas_mantiqueira') {
      // Geradas: contar a quantidade de registros (1 se a coluna E não estiver vazia)
      const valE = values.length > 4 ? values[4].trim() : '';
      row.NOTAS_GERADAS = valE.length > 0 ? 1 : 0;

      // Se a coluna V (índice 21) existir, usamos ela como Status prioritário
      const statusBruto = values.length > 21 ? values[21] : row.STATUS;
      row.STATUS = statusBruto; // Atualiza o status para exibição na tabela também
      
      const statusNormalizado = (statusBruto || '').toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (statusNormalizado === 'OK' || statusNormalizado === 'CONCLUIDO' || statusNormalizado === 'CONCLUIDA') {
        row.NOTAS_CONCLUIDAS = 1;
        row.NOTAS_PENDENTES = 0;
      } else if (statusNormalizado === 'N-OK' || statusNormalizado === 'PENDENTE') {
        row.NOTAS_CONCLUIDAS = 0;
        row.NOTAS_PENDENTES = 1;
      } else {
        row.NOTAS_CONCLUIDAS = 0;
        row.NOTAS_PENDENTES = 0;
      }
    }

    data.push(row);
  }

  return { data, lastUpdate: cellW1, cellC2: null, cellT1: null };
};
