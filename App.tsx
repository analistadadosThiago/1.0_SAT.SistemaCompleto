
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList, PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart
} from 'recharts';
import { 
  LayoutDashboard, 
  Table as TableIcon, 
  AlertCircle, 
  Zap, 
  CheckCircle2, 
  Clock,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Printer,
  Database,
  Menu,
  ChevronFirst,
  RefreshCw,
  Filter,
  X,
  Info,
  ChevronDown,
  MessageSquareWarning,
  ClipboardList,
  User,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  CalendarDays,
  MapPin,
  FileText,
  Activity,
  RotateCw,
  Tag,
  Frown,
  Navigation,
  Moon,
  Sun,
  Cloud
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ReadingData, NotaData, DashboardStats, AppSection } from './types';
import { parseGoogleSheetUrl, fetchSheetData } from './services/sheetService';

const COLORS = ['#10b981', '#ef4444']; // Emerald-500, Red-500

const DEFAULT_URL_TRANSMISSAO = 'https://docs.google.com/spreadsheets/d/10iINVBkcQQ4LuY7LXq66UQmSIH7nmqU3WfvgOb9TmOE/edit?pli=1&gid=0#gid=0';
const DEFAULT_URL_NOTAS = 'https://docs.google.com/spreadsheets/d/10iINVBkcQQ4LuY7LXq66UQmSIH7nmqU3WfvgOb9TmOE/edit?pli=1&gid=1027234200#gid=1027234200';
const DEFAULT_URL_NOTAS_TRIANGULO = 'https://docs.google.com/spreadsheets/d/10iINVBkcQQ4LuY7LXq66UQmSIH7nmqU3WfvgOb9TmOE/edit?pli=1&gid=566285946#gid=566285946';
const DEFAULT_URL_NOTAS_MANTIQUEIRA = 'https://docs.google.com/spreadsheets/d/10iINVBkcQQ4LuY7LXq66UQmSIH7nmqU3WfvgOb9TmOE/edit?gid=548357481#gid=548357481';
const DEFAULT_URL_CONSISTENCIA = 'https://docs.google.com/spreadsheets/d/1NxhRlMdWQj5C-MLfIRD4KWbQiQ5RDAjNMTTykNGU_DE/edit?gid=437512748#gid=437512748';

const CustomTooltip = ({ active, payload, label, section, theme }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isTransmissao = section === 'transmissao';
    const isConsistencia = section === 'consistencia';
    const isDark = theme !== 'white';
    
    let labelRealizar = 'Geradas:';
    if (isTransmissao) labelRealizar = 'A Realizar:';
    if (isConsistencia) labelRealizar = 'Cons. a realizar:';

    let labelRealizadas = 'Concluídas:';
    if (isTransmissao) labelRealizadas = 'Realizadas:';
    if (isConsistencia) labelRealizadas = 'Realizada:';

    return (
      <div className={`${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'} p-4 border shadow-2xl rounded-xl text-sm min-w-[180px]`}>
        <p className={`font-black mb-3 text-base border-b pb-2 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>{label || data.name}</p>
        <div className="space-y-2">
          {isConsistencia ? (
            <>
              <p className={`flex justify-between gap-6 font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                <span>Cons. a realizar:</span> 
                <span>{data.aRealizar?.toLocaleString()}</span>
              </p>
              <p className={`flex justify-between gap-6 font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                <span>Realizada:</span> 
                <span>{data.realizadas?.toLocaleString()}</span>
              </p>
              <p className={`flex justify-between gap-6 font-black border-t pt-2 mt-2 ${isDark ? 'text-red-400 border-gray-700' : 'text-red-700 border-gray-100'}`}>
                <span>N-Realizada:</span> 
                <span>{data.nRealizadas?.toLocaleString()}</span>
              </p>
            </>
          ) : (
            <>
              <p className={`flex justify-between gap-6 font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                <span>{labelRealizar}</span> 
                <span>{data.aRealizar?.toLocaleString()}</span>
              </p>
              <p className={`flex justify-between gap-6 font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                <span>{labelRealizadas}</span> 
                <span>{data.realizadas?.toLocaleString()}</span>
              </p>
              <p className={`flex justify-between gap-6 font-black border-t pt-2 mt-2 ${isDark ? 'text-red-400 border-gray-700' : 'text-red-700 border-gray-100'}`}>
                <span>Pendências:</span> 
                <span>{data.value?.toLocaleString()}</span>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const DonutTooltip = ({ active, payload, breakdown, theme }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const statusType = data.name; 
    const isOK = statusType === 'OK' || statusType === 'Concluído' || statusType === 'Finalizado';
    const isDark = theme !== 'white';
    
    return (
      <div className={`${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-800'} p-5 border shadow-2xl rounded-2xl text-xs min-w-[240px]`}>
        <div className={`flex items-center justify-between mb-4 pb-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-50'}`}>
          <span className={`font-black uppercase tracking-widest text-sm ${isOK ? 'text-emerald-500' : 'text-red-500'}`}>
            Status: {statusType}
          </span>
          <span className={`font-bold ${isDark ? 'text-blue-300' : 'text-gray-500'}`}>Total: {data.value.toLocaleString()}</span>
        </div>
        <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
          {breakdown && Object.entries(breakdown).map(([name, stats]: [string, any]) => {
            const count = isOK ? stats.ok : stats.nok;
            if (count === 0) return null;
            return (
              <div key={name} className="flex justify-between items-center gap-4">
                <span className={`${isDark ? 'text-blue-200' : 'text-gray-600'} font-bold truncate max-w-[140px]`}>{name}</span>
                <span className={`font-black text-sm ${isOK ? 'text-emerald-500' : 'text-red-500'}`}>{count.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const ProcedenciaTooltip = ({ active, payload, label, theme }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isDark = theme !== 'white';
    return (
      <div className={`${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'} p-4 border shadow-2xl rounded-xl text-sm min-w-[200px]`}>
        <p className={`font-black mb-2 border-b pb-1 uppercase text-xs tracking-wider ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>{label}</p>
        <div className="space-y-1">
          <p className={`flex justify-between font-bold ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
            <span>Total Reclamações:</span> 
            <span>{data.total}</span>
          </p>
          <div className={`pt-2 mt-2 border-t space-y-1 ${isDark ? 'border-gray-700' : 'border-gray-50'}`}>
            <p className="flex justify-between text-rose-500 font-bold">
              <span>Procedente (Sim):</span> 
              <span className="font-black">{data.sim}</span>
            </p>
            <p className="flex justify-between text-red-600 font-bold">
              <span>Improcedente (Não):</span> 
              <span className="font-black">{data.nao}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('transmissao');
  const [view, setView] = useState<'dashboard' | 'table'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isTransmissionOpen, setIsTransmissionOpen] = useState(true);
  const [isNotasOpen, setIsNotasOpen] = useState(false);
  const [isNotasTrianguloOpen, setIsNotasTrianguloOpen] = useState(false);
  const [isNotasMantiqueiraOpen, setIsNotasMantiqueiraOpen] = useState(false);
  const [isConsistenciaOpen, setIsConsistenciaOpen] = useState(false);
  const [theme, setTheme] = useState<'white' | 'blue' | 'dark'>('white');

  const [transmissaoUrl, setTransmissaoUrl] = useState(DEFAULT_URL_TRANSMISSAO);
  const [notasUrl, setNotasUrl] = useState(DEFAULT_URL_NOTAS);
  const [notasTrianguloUrl, setNotasTrianguloUrl] = useState(DEFAULT_URL_NOTAS_TRIANGULO);
  const [notasMantiqueiraUrl, setNotasMantiqueiraUrl] = useState(DEFAULT_URL_NOTAS_MANTIQUEIRA);
  const [consistenciaUrl, setConsistenciaUrl] = useState(DEFAULT_URL_CONSISTENCIA);
  const [transmissaoRawData, setTransmissaoRawData] = useState<ReadingData[]>([]);
  const [notasRawData, setNotasRawData] = useState<NotaData[]>([]);
  const [notasTrianguloRawData, setNotasTrianguloRawData] = useState<NotaData[]>([]);
  const [notasMantiqueiraRawData, setNotasMantiqueiraRawData] = useState<NotaData[]>([]);
  const [consistenciaRawData, setConsistenciaRawData] = useState<any[]>([]);
  const [transmissaoMeta, setTransmissaoMeta] = useState<{ lastUpdate: string | null }>({ lastUpdate: null });
  const [notasMeta, setNotasMeta] = useState<{ lastUpdate: string | null }>({ lastUpdate: null });
  const [notasTrianguloMeta, setNotasTrianguloMeta] = useState<{ lastUpdate: string | null }>({ lastUpdate: null });
  const [notasMantiqueiraMeta, setNotasMantiqueiraMeta] = useState<{ lastUpdate: string | null }>({ lastUpdate: null });
  const [consistenciaMeta, setConsistenciaMeta] = useState<{ lastUpdate: string | null, tipo: string | null }>({ lastUpdate: null, tipo: null });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fContrato, setFContrato] = useState('Tudo');
  const [fMes, setFMes] = useState('Tudo');
  const [fAno, setFAno] = useState('Tudo');
  const [fBase, setFBase] = useState('Tudo');
  const [fRazao, setFRazao] = useState('Tudo');
  const [fStatus, setFStatus] = useState('Tudo');
  const [fPrazos, setFPrazos] = useState<string[]>([]);
  const [fPrazosPendente, setFPrazosPendente] = useState<string[]>([]);

  const isNotas = activeSection === 'notas' || activeSection === 'notas_triangulo' || activeSection === 'notas_mantiqueira';
  const isConsistencia = activeSection === 'consistencia';

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = isConsistencia ? 5 : 15;

  const currentRawData = activeSection === 'transmissao' ? transmissaoRawData : 
                     (activeSection === 'notas' ? notasRawData : 
                     (activeSection === 'notas_triangulo' ? notasTrianguloRawData : 
                     (activeSection === 'notas_mantiqueira' ? notasMantiqueiraRawData : consistenciaRawData)));
  
  const currentUrl = activeSection === 'transmissao' ? transmissaoUrl : 
                    (activeSection === 'notas' ? notasUrl : 
                    (activeSection === 'notas_triangulo' ? notasTrianguloUrl : 
                    (activeSection === 'notas_mantiqueira' ? notasMantiqueiraUrl : consistenciaUrl)));
  
  const currentMeta = activeSection === 'transmissao' ? (transmissaoMeta.lastUpdate) : 
                     (activeSection === 'notas' ? notasMeta.lastUpdate : 
                     (activeSection === 'notas_triangulo' ? notasTrianguloMeta.lastUpdate : 
                     (activeSection === 'notas_mantiqueira' ? notasMantiqueiraMeta.lastUpdate : consistenciaMeta.lastUpdate)));

  const sectionTitle = activeSection === 'transmissao' ? 'Transmissão' : 
                       (activeSection === 'notas' ? 'Notas AM: Contrato de Divinopolis' : 
                       (activeSection === 'notas_triangulo' ? 'Notas AM: contrato do Triângulo' : 
                       (activeSection === 'notas_mantiqueira' ? 'Notas AM: Contrato da Mantiqueira' : 
                       (activeSection === 'consistencia' ? 'Acompanhamento de Consistência' : 'Detalhamento de Transmissão'))));

  const handleLoadData = useCallback(async (sectionOverride?: AppSection) => {
    const targetSection = sectionOverride || activeSection;
    const url = targetSection === 'transmissao' ? transmissaoUrl : 
                (targetSection === 'notas' ? notasUrl : 
                (targetSection === 'notas_triangulo' ? notasTrianguloUrl : 
                (targetSection === 'notas_mantiqueira' ? notasMantiqueiraUrl : consistenciaUrl)));
    
    setLoading(true); setError(null);
    try {
      const csvUrl = parseGoogleSheetUrl(url);
      if (!csvUrl) throw new Error('Link inválido. Copie o endereço completo da aba do navegador.');
      const response = await fetchSheetData(csvUrl, targetSection);
      if (targetSection === 'transmissao') {
        setTransmissaoRawData(response.data);
        setTransmissaoMeta({ lastUpdate: response.lastUpdate });
      } else if (targetSection === 'notas') {
        setNotasRawData(response.data);
        setNotasMeta({ lastUpdate: response.lastUpdate });
      } else if (targetSection === 'notas_triangulo') {
        setNotasTrianguloRawData(response.data);
        setNotasTrianguloMeta({ lastUpdate: response.lastUpdate });
      } else if (targetSection === 'notas_mantiqueira') {
        setNotasMantiqueiraRawData(response.data);
        setNotasMantiqueiraMeta({ lastUpdate: response.lastUpdate });
      } else if (targetSection === 'consistencia') {
        setConsistenciaRawData(response.data);
        setConsistenciaMeta({ lastUpdate: response.cellO1, tipo: response.cellO1 });
      }
      setCurrentPage(1);
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  }, [activeSection, transmissaoUrl, notasUrl, notasTrianguloUrl, notasMantiqueiraUrl]);

  // Carregamento inicial automático
  useEffect(() => {
    handleLoadData('transmissao');
    handleLoadData('notas');
    handleLoadData('notas_triangulo');
    handleLoadData('notas_mantiqueira');
    handleLoadData('consistencia');
  }, []);

  const exportToExcel = () => {
    if (filteredData.length === 0) return;
    const dataToExport = filteredData.map((row: any) => {
      if (isNotas) {
        return {
          "MÊS": row.MES,
          "ANO": row.ANO,
          "CONTRATO": row.CONTRATO,
          "TIPO": row.TIPO,
          "NOTA": row.NOTA,
          "INSTALAÇÃO": row.INSTALACAO,
          "RAZÃO SOCIAL": row.RAZAO,
          "UNIDADE DE LEITURA": row.UL,
          "BASE": row.BASE,
          "LEITURISTA": row.LEITURISTA,
          "PRAZO": row.PRAZO,
          "STATUS": row.STATUS,
          "PROCEDENCIA": row.PROCEDENCIA
        };
      } else if (isConsistencia) {
        return {
          "MÊS": row.MES,
          "ANO": row.ANO,
          "RZ": row.RAZAO,
          "UL": row.UL,
          "BASE": row.BASE,
          "CONTRATO": row.CONTRATO,
          "CONS. A REALIZAR": row.CARD_A_REALIZAR,
          "REALIZADA": row.CARD_REALIZADAS,
          "N-REALIZADA": row.CARD_NAO_REALIZADAS,
          "PRAZO": row.PRAZO
        };
      } else {
        return {
          "MÊS": row.MES,
          "ANO": row.ANO,
          "CONTRATO": row.CONTRATO,
          "BASE": row.BASE,
          "CIDADE": row.CIDADE,
          "UL": row.UL,
          "RAZÃO": row.RAZAO,
          "A REALIZAR": row.LEITURAS_A_REALIZAR,
          "REALIZADAS": (row.LEITURAS_100 + row.LEITURAS_30),
          "PENDENTES": row.LEITURAS_NAO_REALIZADAS
        };
      }
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    XLSX.writeFile(wb, `Relatorio_SAT_${activeSection}.xlsx`);
  };

  const exportToPDF = () => {
    window.print();
  };

  useEffect(() => {
    setFContrato('Tudo'); setFMes('Tudo'); setFAno('Tudo');
    setFBase('Tudo'); setFRazao('Tudo'); setFStatus('Tudo');
    setFPrazos([]); setFPrazosPendente([]);
    setCurrentPage(1); setError(null);
  }, [activeSection]);

  const contratos = useMemo(() => ['Tudo', ...Array.from(new Set(currentRawData.map((d: any) => d.CONTRATO).filter(Boolean))).sort()], [currentRawData]);
  const dataContrato = useMemo(() => currentRawData.filter(d => fContrato === 'Tudo' || d.CONTRATO === fContrato), [currentRawData, fContrato]);
  
  const meses = useMemo(() => ['Tudo', ...Array.from(new Set(dataContrato.map(d => d.MES).filter(Boolean))).sort()], [dataContrato]);
  const dataMes = useMemo(() => dataContrato.filter(d => fMes === 'Tudo' || d.MES === fMes), [dataContrato, fMes]);
  
  const anos = useMemo(() => ['Tudo', ...Array.from(new Set(dataMes.map(d => d.ANO).filter(Boolean))).sort()], [dataMes]);
  const dataAno = useMemo(() => dataMes.filter(d => fAno === 'Tudo' || d.ANO === fAno), [dataMes, fAno]);
  
  const bases = useMemo(() => ['Tudo', ...Array.from(new Set(dataAno.map(d => d.BASE).filter(Boolean))).sort()], [dataAno]);
  const dataBase = useMemo(() => dataAno.filter(d => fBase === 'Tudo' || d.BASE === fBase), [dataAno, fBase]);

  const prazos = useMemo(() => Array.from(new Set(dataBase.map((d: any) => d.PRAZO).filter(Boolean))).sort(), [dataBase]);
  const dataPrazo = useMemo(() => {
    if (fPrazos.length === 0) return dataBase;
    return dataBase.filter((d: any) => fPrazos.includes(d.PRAZO));
  }, [dataBase, fPrazos]);
  
  const razoes = useMemo(() => ['Tudo', ...Array.from(new Set(dataPrazo.map(d => d.RAZAO).filter(Boolean))).sort()], [dataPrazo]);
  const dataRazao = useMemo(() => dataPrazo.filter(d => fRazao === 'Tudo' || d.RAZAO === fRazao), [dataPrazo, fRazao]);
  
  const statuses = useMemo(() => ['Tudo', ...Array.from(new Set(currentRawData.map((d: any) => d.STATUS).filter(Boolean))).sort()], [currentRawData]);
  const dataStatus = useMemo(() => dataRazao.filter((d: any) => fStatus === 'Tudo' || d.STATUS === fStatus), [dataRazao, fStatus]);

  const prazosPendenteDisponiveis = useMemo(() => {
    if (!isNotas || fStatus !== 'Pendente') return [];
    return Array.from(new Set(dataStatus.map((d: any) => d.PRAZO).filter(Boolean))).sort();
  }, [dataStatus, fStatus, isNotas]);

  const filteredData = useMemo(() => {
    if (isNotas && fStatus === 'Pendente' && fPrazosPendente.length > 0) {
      return dataStatus.filter((d: any) => fPrazosPendente.includes(d.PRAZO));
    }
    return dataStatus;
  }, [dataStatus, fStatus, fPrazosPendente, isNotas]);

  const tableData = useMemo(() => {
    if (!isConsistencia) return filteredData;
    
    const map: Record<string, any> = {};
    filteredData.forEach((d: any) => {
      const key = `${d.RAZAO}-${d.BASE}`;
      if (!map[key]) {
        map[key] = {
          MES: d.MES,
          ANO: d.ANO,
          RAZAO: d.RAZAO,
          UL: d.UL,
          BASE: d.BASE,
          CONTRATO: d.CONTRATO,
          CARD_A_REALIZAR: 0,
          CARD_REALIZADAS: 0,
          CARD_NAO_REALIZADAS: 0,
          PRAZO: d.PRAZO
        };
      }
      map[key].CARD_A_REALIZAR += (d.CARD_A_REALIZAR || 0);
      map[key].CARD_REALIZADAS += (d.CARD_REALIZADAS || 0);
      map[key].CARD_NAO_REALIZADAS += (d.CARD_NAO_REALIZADAS || 0);
    });
    return Object.values(map);
  }, [filteredData, isConsistencia]);

  const stats = useMemo<DashboardStats>(() => {
    if (!filteredData.length) return { totalToPerform: 0, totalPerformed: 0, totalPending: 0, totalNotSent: 0, successRate: 0, pendingRate: 0 };
    let tP = 0, tR = 0, tPend = 0, tNotSent = 0;
    if (activeSection === 'transmissao') {
      filteredData.forEach((d: any) => { 
        tP += (d.LEITURAS_A_REALIZAR || 0); 
        tR += (d.LEITURAS_100 || 0) + (d.LEITURAS_30 || 0); 
        tPend += (d.LEITURAS_NAO_REALIZADAS || 0);
        if (d.STATUS?.toString().toUpperCase() === 'NÃO ENVIADA') tNotSent++;
      });
    } else if (activeSection === 'consistencia') {
      filteredData.forEach((d: any) => { 
        tP += (d.CARD_A_REALIZAR || 0); 
        tR += (d.CARD_REALIZADAS || 0); 
        tPend += (d.CARD_NAO_REALIZADAS || 0);
        if (d.STATUS?.toString().toUpperCase() === 'NÃO ENVIADA') tNotSent++;
      });
    } else {
      filteredData.forEach((d: any) => { 
        tP += d.NOTAS_GERADAS; 
        tR += d.NOTAS_CONCLUIDAS; 
        tPend += d.NOTAS_PENDENTES;
        if (d.STATUS?.toString().toUpperCase() === 'NÃO ENVIADA') tNotSent++;
      });
    }
    return { 
      totalToPerform: tP, 
      totalPerformed: tR, 
      totalPending: tPend, 
      totalNotSent: tNotSent,
      successRate: tP > 0 ? (tR / tP) * 100 : 0, 
      pendingRate: tP > 0 ? (tPend / tP) * 100 : 0 
    };
  }, [filteredData, activeSection]);

  const baseChartData = useMemo(() => {
    const map: Record<string, any> = {};
    filteredData.forEach((d: any) => {
      if (!map[d.BASE]) map[d.BASE] = { name: d.BASE, value: 0, aRealizar: 0, realizadas: 0, nRealizadas: 0 };
      if (activeSection === 'transmissao') { 
        map[d.BASE].value += (d.LEITURAS_NAO_REALIZADAS || 0); 
        map[d.BASE].aRealizar += (d.LEITURAS_A_REALIZAR || 0); 
        map[d.BASE].realizadas += (d.LEITURAS_100 || 0) + (d.LEITURAS_30 || 0); 
      } else if (activeSection === 'consistencia') {
        map[d.BASE].value += (d.CARD_A_REALIZAR || 0); 
        map[d.BASE].aRealizar += (d.CARD_A_REALIZAR || 0); 
        map[d.BASE].realizadas += (d.CARD_REALIZADAS || 0);
        map[d.BASE].nRealizadas += (d.CARD_NAO_REALIZADAS || 0);
      }
      else { 
        map[d.BASE].value += d.NOTAS_PENDENTES; 
        map[d.BASE].aRealizar += d.NOTAS_GERADAS; 
        map[d.BASE].realizadas += d.NOTAS_CONCLUIDAS; 
      }
    });
    return Object.values(map).sort((a: any, b: any) => b.value - a.value);
  }, [filteredData, activeSection]);

  const contratoChartData = useMemo(() => {
    const map: Record<string, any> = {};
    filteredData.forEach((d: any) => {
      const name = d.CONTRATO || 'Não Informado';
      if (!map[name]) map[name] = { name, value: 0, aRealizar: 0, realizadas: 0, nRealizadas: 0 };
      if (activeSection === 'transmissao') { 
        map[name].value += (d.LEITURAS_NAO_REALIZADAS || 0); 
        map[name].aRealizar += (d.LEITURAS_A_REALIZAR || 0); 
        map[name].realizadas += ((d.LEITURAS_100 || 0) + (d.LEITURAS_30 || 0)); 
      } else if (activeSection === 'consistencia') {
        map[name].value += (d.CARD_A_REALIZAR || 0); 
        map[name].aRealizar += (d.CARD_A_REALIZAR || 0); 
        map[name].realizadas += (d.CARD_REALIZADAS || 0);
        map[name].nRealizadas += (d.CARD_NAO_REALIZADAS || 0);
      }
      else { 
        map[name].value += (d.NOTAS_PENDENTES || 0); 
        map[name].aRealizar += (d.NOTAS_GERADAS || 0); 
        map[name].realizadas += (d.NOTAS_CONCLUIDAS || 0); 
      }
    });
    return Object.values(map).sort((a: any, b: any) => b.value - a.value);
  }, [filteredData, activeSection]);

  const monthOrder: Record<string, number> = {
    'JANEIRO': 1, 'FEVEREIRO': 2, 'MARÇO': 3, 'ABRIL': 4, 'MAIO': 5, 'JUNHO': 6,
    'JULHO': 7, 'AGOSTO': 8, 'SETEMBRO': 9, 'OUTUBRO': 10, 'NOVEMBRO': 11, 'DEZEMBRO': 12,
    'JAN': 1, 'FEV': 2, 'MAR': 3, 'ABR': 4, 'MAI': 5, 'JUN': 6,
    'JUL': 7, 'AGO': 8, 'SET': 9, 'OUT': 10, 'NOV': 11, 'DEZ': 12
  };

  const trendChartData = useMemo(() => {
    const map: Record<string, any> = {};
    filteredData.forEach((d: any) => {
      const key = `${d.ANO}-${d.MES}`;
      if (!map[key]) map[key] = { name: key, mes: d.MES, ano: d.ANO, realizadas: 0, pendentes: 0 };
      if (activeSection === 'transmissao') {
        map[key].realizadas += ((d.LEITURAS_100 || 0) + (d.LEITURAS_30 || 0));
        map[key].pendentes += (d.LEITURAS_NAO_REALIZADAS || 0);
      } else if (activeSection === 'consistencia') {
        map[key].realizadas += (d.CARD_REALIZADAS || 0);
        map[key].pendentes += (d.CARD_NAO_REALIZADAS || 0);
      } else {
        map[key].realizadas += (d.NOTAS_CONCLUIDAS || 0);
        map[key].pendentes += (d.NOTAS_PENDENTES || 0);
      }
    });
    
    return Object.values(map).sort((a: any, b: any) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      const m1 = monthOrder[a.mes.toUpperCase()] || 0;
      const m2 = monthOrder[b.mes.toUpperCase()] || 0;
      return m1 - m2;
    });
  }, [filteredData, activeSection]);

  const procedenciaChartData = useMemo(() => {
    if (!isNotas) return [];
    const map: Record<string, { name: string, sim: number, nao: number, total: number }> = {};
    filteredData.forEach((d: any) => {
      const leiturista = d.LEITURISTA || 'NÃO INFORMADO';
      const procedencia = (d.PROCEDENCIA || '').toString().trim().toUpperCase();
      
      if (!map[leiturista]) map[leiturista] = { name: leiturista, sim: 0, nao: 0, total: 0 };
      
      if (procedencia === 'SIM') map[leiturista].sim += 1;
      else if (procedencia === 'NAO' || procedencia === 'NÃO') map[leiturista].nao += 1;
      
      map[leiturista].total += 1;
    });
    return Object.values(map)
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [filteredData, activeSection]);

  const statusDonutData = useMemo(() => {
    if (isConsistencia) {
      const map: Record<string, number> = {};
      filteredData.forEach((d: any) => {
        const s = (d.STATUS || '').toString().trim();
        if (s) {
          map[s] = (map[s] || 0) + 1;
        }
      });
      return Object.entries(map).map(([name, value]) => ({ name, value }));
    }
    return [
      { name: isNotas ? 'Concluído' : 'OK', value: stats.totalPerformed },
      { name: isNotas ? 'Pendente' : 'N-OK', value: stats.totalPending }
    ];
  }, [filteredData, stats, isNotas, isConsistencia]);

  const baseBreakdown = useMemo(() => {
    const map: Record<string, { ok: number, nok: number }> = {};
    filteredData.forEach((d: any) => {
      const baseName = d.BASE || 'Outros';
      if (!map[baseName]) map[baseName] = { ok: 0, nok: 0 };
      if (activeSection === 'transmissao') {
        map[baseName].ok += (d.LEITURAS_100 + d.LEITURAS_30);
        map[baseName].nok += d.LEITURAS_NAO_REALIZADAS;
      } else if (activeSection === 'consistencia') {
        map[baseName].ok += (d.CARD_REALIZADAS || 0);
        map[baseName].nok += (d.CARD_NAO_REALIZADAS || 0);
      } else {
        map[baseName].ok += d.NOTAS_CONCLUIDAS;
        map[baseName].nok += d.NOTAS_PENDENTES;
      }
    });
    return map;
  }, [filteredData, activeSection]);

  const contratoBreakdown = useMemo(() => {
    const map: Record<string, { ok: number, nok: number }> = {};
    filteredData.forEach((d: any) => {
      const name = d.CONTRATO || 'Não Informado';
      if (!map[name]) map[name] = { ok: 0, nok: 0 };
      if (activeSection === 'transmissao') {
        map[name].ok += (d.LEITURAS_100 + d.LEITURAS_30);
        map[name].nok += d.LEITURAS_NAO_REALIZADAS;
      } else if (activeSection === 'consistencia') {
        map[name].ok += (d.CARD_REALIZADAS || 0);
        map[name].nok += (d.CARD_NAO_REALIZADAS || 0);
      } else {
        map[name].ok += d.NOTAS_CONCLUIDAS;
        map[name].nok += d.NOTAS_PENDENTES;
      }
    });
    return map;
  }, [filteredData, activeSection]);

  const summaryText = useMemo(() => {
    const parts = [];
    if (fContrato !== 'Tudo') parts.push(`Contrato: ${fContrato}`);
    if (fMes !== 'Tudo') parts.push(`Mês: ${fMes}`);
    if (fAno !== 'Tudo') parts.push(`Ano: ${fAno}`);
    if (fBase !== 'Tudo') parts.push(`Base: ${fBase}`);
    if (fPrazos.length > 0) parts.push(`Prazos: ${fPrazos.join(', ')}`);
    if (fRazao !== 'Tudo') parts.push(`Razão: ${fRazao}`);
    if (fStatus !== 'Tudo') parts.push(`Status: ${fStatus}`);
    if (fPrazosPendente.length > 0) parts.push(`Prazos Sel.: ${fPrazosPendente.join(', ')}`);
    
    if (parts.length === 0) return 'Visualizando Todos os Dados';
    return `Selecionado: ${parts.join(' | ')}`;
  }, [fContrato, fMes, fAno, fBase, fPrazos, fRazao, fStatus, fPrazosPendente]);

  return (
    <div className={`min-h-screen flex font-sans relative transition-colors duration-500 ${theme === 'blue' ? 'bg-blue-400' : theme === 'dark' ? 'bg-black' : 'bg-[#f8fafc]'}`}>
      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          main { width: 100% !important; height: auto !important; overflow: visible !important; }
          .print-full-table { height: auto !important; overflow: visible !important; }
          table { width: 100% !important; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          th { background-color: #f97316 !important; color: white !important; -webkit-print-color-adjust: exact; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      <aside className={`fixed md:relative z-50 h-full border-r transition-all duration-300 flex flex-col shadow-xl md:shadow-none ${isSidebarOpen ? 'w-80' : 'w-0 md:w-0'} overflow-hidden no-print ${theme !== 'white' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <div className="p-6 w-80 h-full flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div className={`flex items-center gap-3 ${theme !== 'white' ? 'text-blue-300' : 'text-blue-600'}`}>
              <Zap className="w-8 h-8 fill-current" />
              <div className="flex flex-col">
                <span className={`text-sm font-black uppercase leading-none ${theme !== 'white' ? 'text-white' : 'text-gray-800'}`}>SAT: Sistema de</span>
                <span className={`text-sm font-black uppercase leading-none mt-1 ${theme !== 'white' ? 'text-white' : 'text-gray-800'}`}>Acompanhamento de Transmissão</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className={`md:hidden ${theme !== 'white' ? 'text-blue-300' : 'text-gray-400'}`}><X /></button>
          </div>
          <nav className="space-y-4 flex-1">
             <div className="space-y-1">
                <button onClick={() => setActiveSection('acompanhamento')} className={`w-full px-4 py-3 flex items-center gap-2 rounded-xl transition-all font-black text-[10px] tracking-widest uppercase ${activeSection === 'acompanhamento' ? 'bg-blue-600 text-white shadow-lg' : (theme !== 'white' ? 'text-blue-300 hover:bg-blue-800/50' : 'text-blue-600 hover:bg-blue-50')}`}>
                  <ExternalLink className="w-4 h-4"/> Detalhamento de Transmissão
                </button>
             </div>
             <div className="space-y-1">
                <button onClick={() => setIsTransmissionOpen(!isTransmissionOpen)} className={`w-full px-4 py-3 flex items-center justify-between rounded-xl transition-all ${theme !== 'white' ? 'text-blue-300 hover:bg-blue-800/50' : 'text-blue-600 hover:bg-blue-50'}`}>
                  <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase"><ClipboardList className="w-4 h-4"/> Acompanhamento de transmissão</div>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isTransmissionOpen ? '' : '-rotate-90'}`} />
                </button>
                <div className={`space-y-1 pl-4 overflow-hidden transition-all ${isTransmissionOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <button onClick={() => { setActiveSection('transmissao'); setView('dashboard'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'transmissao' && view === 'dashboard' ? 'bg-blue-600 text-white' : (theme !== 'white' ? 'text-blue-400 hover:bg-blue-800/30' : 'text-gray-500 hover:bg-gray-100')}`}>Dashboard</button>
                  <button onClick={() => { setActiveSection('transmissao'); setView('table'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'transmissao' && view === 'table' ? 'bg-blue-600 text-white' : (theme !== 'white' ? 'text-blue-400 hover:bg-blue-800/30' : 'text-gray-500 hover:bg-gray-100')}`}>Base de Dados</button>
                </div>
             </div>
              <div className="space-y-1">
                <button onClick={() => setIsNotasOpen(!isNotasOpen)} className={`w-full px-4 py-3 flex items-center justify-between rounded-xl transition-all ${theme !== 'white' ? 'text-blue-300 hover:bg-blue-800/50' : 'text-blue-600 hover:bg-blue-50'}`}>
                  <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase"><MessageSquareWarning className="w-4 h-4"/> Notas AM: Contrato de Divinopolis</div>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isNotasOpen ? '' : '-rotate-90'}`} />
                </button>
                <div className={`space-y-1 pl-4 overflow-hidden transition-all ${isNotasOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <button onClick={() => { setActiveSection('notas'); setView('dashboard'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'notas' && view === 'dashboard' ? 'bg-blue-600 text-white' : (theme !== 'white' ? 'text-blue-400 hover:bg-blue-800/30' : 'text-gray-500 hover:bg-gray-100')}`}>Dashboard</button>
                  <button onClick={() => { setActiveSection('notas'); setView('table'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'notas' && view === 'table' ? 'bg-blue-600 text-white' : (theme !== 'white' ? 'text-blue-400 hover:bg-blue-800/30' : 'text-gray-500 hover:bg-gray-100')}`}>Base de Dados</button>
                </div>
             </div>
             <div className="space-y-1">
                <button onClick={() => setIsNotasTrianguloOpen(!isNotasTrianguloOpen)} className={`w-full px-4 py-3 flex items-center justify-between rounded-xl transition-all ${theme !== 'white' ? 'text-blue-300 hover:bg-blue-800/50' : 'text-blue-600 hover:bg-blue-50'}`}>
                  <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase"><MessageSquareWarning className="w-4 h-4"/> Notas AM: contrato do Triângulo</div>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isNotasTrianguloOpen ? '' : '-rotate-90'}`} />
                </button>
                <div className={`space-y-1 pl-4 overflow-hidden transition-all ${isNotasTrianguloOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <button onClick={() => { setActiveSection('notas_triangulo'); setView('dashboard'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'notas_triangulo' && view === 'dashboard' ? 'bg-blue-600 text-white' : (theme !== 'white' ? 'text-blue-400 hover:bg-blue-800/30' : 'text-gray-500 hover:bg-gray-100')}`}>Dashboard</button>
                  <button onClick={() => { setActiveSection('notas_triangulo'); setView('table'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'notas_triangulo' && view === 'table' ? 'bg-blue-600 text-white' : (theme !== 'white' ? 'text-blue-400 hover:bg-blue-800/30' : 'text-gray-500 hover:bg-gray-100')}`}>Base de Dados</button>
                </div>
             </div>
             <div className="space-y-1">
                <button onClick={() => setIsNotasMantiqueiraOpen(!isNotasMantiqueiraOpen)} className={`w-full px-4 py-3 flex items-center justify-between rounded-xl transition-all ${theme !== 'white' ? 'text-blue-300 hover:bg-blue-800/50' : 'text-blue-600 hover:bg-blue-50'}`}>
                  <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase"><MessageSquareWarning className="w-4 h-4"/> Notas AM: Contrato da Mantiqueira</div>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isNotasMantiqueiraOpen ? '' : '-rotate-90'}`} />
                </button>
                <div className={`space-y-1 pl-4 overflow-hidden transition-all ${isNotasMantiqueiraOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <button onClick={() => { setActiveSection('notas_mantiqueira'); setView('dashboard'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'notas_mantiqueira' && view === 'dashboard' ? 'bg-blue-600 text-white' : (theme !== 'white' ? 'text-blue-400 hover:bg-blue-800/30' : 'text-gray-500 hover:bg-gray-100')}`}>Dashboard</button>
                  <button onClick={() => { setActiveSection('notas_mantiqueira'); setView('table'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'notas_mantiqueira' && view === 'table' ? 'bg-blue-600 text-white' : (theme !== 'white' ? 'text-blue-400 hover:bg-blue-800/30' : 'text-gray-500 hover:bg-gray-100')}`}>Base de Dados</button>
                </div>
             </div>
             <div className="space-y-1">
                <button onClick={() => setIsConsistenciaOpen(!isConsistenciaOpen)} className={`w-full px-4 py-3 flex items-center justify-between rounded-xl transition-all ${theme !== 'white' ? 'text-blue-300 hover:bg-blue-800/50' : 'text-blue-600 hover:bg-blue-50'}`}>
                  <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase"><ClipboardList className="w-4 h-4"/> Acompanhamento de Consistência</div>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isConsistenciaOpen ? '' : '-rotate-90'}`} />
                </button>
                <div className={`space-y-1 pl-4 overflow-hidden transition-all ${isConsistenciaOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <button onClick={() => { setActiveSection('consistencia'); setView('dashboard'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'consistencia' && view === 'dashboard' ? 'bg-blue-600 text-white' : (theme !== 'white' ? 'text-blue-400 hover:bg-blue-800/30' : 'text-gray-500 hover:bg-gray-100')}`}>Dashboard</button>
                  <button onClick={() => { setActiveSection('consistencia'); setView('table'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'consistencia' && view === 'table' ? 'bg-blue-600 text-white' : (theme !== 'white' ? 'text-blue-400 hover:bg-blue-800/30' : 'text-gray-500 hover:bg-gray-100')}`}>Base de Dados</button>
                </div>
             </div>
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className={`${theme !== 'white' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} px-8 py-4 flex flex-col gap-4 z-40 shadow-sm no-print`}>
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2.5 rounded-xl border transition-all ${theme !== 'white' ? 'bg-gray-800 border-gray-700 text-blue-200' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                {isSidebarOpen ? <ChevronFirst /> : <Menu />}
              </button>
              <div className="flex flex-col">
                {isConsistencia && (
                  <span className={`text-[10px] font-black uppercase mb-1 ${theme !== 'white' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    Acompanhamento de Consistência | Última Atualização: {consistenciaMeta.lastUpdate}
                  </span>
                )}
                {!isConsistencia && currentMeta && (
                  <span className={`text-[10px] font-black uppercase mb-1 ${theme !== 'white' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    Última atualização: {currentMeta}
                  </span>
                )}
                <h1 className={`text-xl font-black uppercase tracking-tighter ${theme !== 'white' ? 'text-white' : 'text-gray-900'}`}>
                  {sectionTitle}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setTheme(theme === 'white' ? 'blue' : theme === 'blue' ? 'dark' : 'white')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${
                  theme === 'white' 
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                    : theme === 'blue'
                    ? 'bg-blue-500 text-white border-blue-400 hover:bg-blue-600'
                    : 'bg-gray-800 text-white border-gray-700 hover:bg-gray-900'
                }`}
              >
                {theme === 'white' ? <Sun className="w-3 h-3" /> : theme === 'blue' ? <Cloud className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                Tema: {theme === 'white' ? 'Claro' : theme === 'blue' ? 'Azul' : 'Escuro'}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          {activeSection === 'acompanhamento' ? (
            <div className="flex flex-col gap-6 h-[calc(100vh-120px)] no-print">
              <div className="flex justify-center">
                <a 
                  href="https://ais-pre-y57rocsrv4n36yffd4nlz2-43530479359.us-east1.run.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 px-10 py-5 rounded-3xl text-sm font-black uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95 ${
                    theme !== 'white' 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-900/40' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                  }`}
                >
                  <ExternalLink className="w-5 h-5" /> Clique aqui e Veja Resultados em outra aba
                </a>
              </div>
              <div className="flex-1 rounded-[3rem] overflow-hidden border-4 shadow-2xl bg-gray-100 relative group cursor-pointer" 
                   style={{ borderColor: theme !== 'white' ? 'rgba(59, 130, 246, 0.3)' : '#f1f5f9' }}
                   onClick={() => window.open('https://ais-pre-y57rocsrv4n36yffd4nlz2-43530479359.us-east1.run.app/', '_blank')}
              >
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                   <div className="bg-white/20 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/30 text-white font-black uppercase tracking-widest text-sm">
                      Clique para Visualizar
                   </div>
                </div>
                <img 
                  src="https://picsum.photos/seed/dashboard-analytics/1920/1080?blur=2" 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                  alt="Preview Detalhamento"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-10 left-10 right-10 bg-white/90 backdrop-blur-sm p-8 rounded-3xl border border-white shadow-2xl">
                   <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">Sistema de Detalhamento</h4>
                   <p className="text-gray-500 text-sm font-bold leading-relaxed">Clique no botão acima ou nesta imagem para abrir o relatório completo de transmissão em uma nova aba do seu navegador.</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-2xl shadow-sm flex items-start gap-4 no-print">
                  <div className="p-2 bg-red-100 rounded-full"><AlertCircle className="w-6 h-6 text-red-600" /></div>
                  <div className="flex-1">
                    <p className="text-red-800 text-sm font-black uppercase mb-1">Erro de Sincronização</p>
                    <p className="text-red-600 text-xs font-bold leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              {currentRawData.length > 0 ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className={`p-8 rounded-[2.5rem] border shadow-sm space-y-8 no-print ${theme !== 'white' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-gray-100'}`}>
                <div className={`flex items-center justify-between border-b pb-4 ${theme !== 'white' ? 'border-gray-700/50' : 'border-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <Filter className={`w-5 h-5 ${theme !== 'white' ? 'text-blue-300' : 'text-blue-600'}`} />
                    <span className={`text-xs font-black uppercase tracking-widest ${theme !== 'white' ? 'text-blue-400' : 'text-gray-400'}`}>Menus de Seleção de Dados</span>
                  </div>
                  <button 
                    onClick={() => handleLoadData()} 
                    className={`flex items-center gap-2 text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all ${theme !== 'white' ? 'text-blue-300 hover:bg-blue-800/50' : 'text-blue-600 hover:bg-blue-50'}`}
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Atualizar Planilha
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-7 gap-6">
                  <FilterDropdown label="Contrato" value={fContrato} onChange={setFContrato} options={contratos} icon={<Database className="w-3 h-3"/>} theme={theme}/>
                  <FilterDropdown label="Mês" value={fMes} onChange={setFMes} options={meses} icon={<CalendarDays className="w-3 h-3"/>} theme={theme}/>
                  <FilterDropdown label="Ano" value={fAno} onChange={setFAno} options={anos} icon={<CalendarDays className="w-3 h-3"/>} theme={theme}/>
                  <FilterDropdown label="Base" value={fBase} onChange={setFBase} options={bases} icon={<MapPin className="w-3 h-3"/>} theme={theme}/>
                  <MultiSelectFilter label="Prazo" selected={fPrazos} onChange={setFPrazos} options={prazos} icon={<Clock className="w-3 h-3"/>} theme={theme}/>
                  <FilterDropdown label="Razão" value={fRazao} onChange={setFRazao} options={razoes} icon={<FileText className="w-3 h-3"/>} theme={theme}/>
                  <FilterDropdown label="Status" value={fStatus} onChange={setFStatus} options={statuses} icon={<Activity className="w-3 h-3"/>} theme={theme}/>
                </div>

                {isNotas && fStatus === 'Pendente' && prazosPendenteDisponiveis.length > 0 && (
                  <div className="pt-6 border-t border-gray-50 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filtrar por PRAZO (Pendentes)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {prazosPendenteDisponiveis.map(prazo => (
                        <button
                          key={prazo}
                          onClick={() => {
                            if (fPrazosPendente.includes(prazo)) {
                              setFPrazosPendente(fPrazosPendente.filter(p => p !== prazo));
                            } else {
                              setFPrazosPendente([...fPrazosPendente, prazo]);
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            fPrazosPendente.includes(prazo) 
                              ? 'bg-orange-500 text-white border-orange-600 shadow-md' 
                              : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          {prazo}
                        </button>
                      ))}
                      {fPrazosPendente.length > 0 && (
                        <button 
                          onClick={() => setFPrazosPendente([])}
                          className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-400 hover:bg-gray-200 transition-all"
                        >
                          Limpar Seleção
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-50">
                   <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Resumo da Seleção Atual:</p>
                   <div className="flex items-center gap-3">
                      <div className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-md flex items-center gap-3">
                        <Info className="w-4 h-4"/> {summaryText}
                      </div>
                   </div>
                </div>
              </div>

              <div className={`grid grid-cols-1 ${isConsistencia ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-8 no-print`}>
                <KpiCard 
                  title={isConsistencia ? "A Realizar" : (activeSection === 'transmissao' ? "A Realizar" : "Geradas")} 
                  value={stats.totalToPerform.toLocaleString()} 
                  icon={<Clock className={theme !== 'white' ? "text-blue-300" : "text-blue-600"}/>} 
                  trend="+2.4%" 
                  theme={theme}
                />
                <KpiCard 
                  title={isConsistencia ? "Realizadas" : (activeSection === 'transmissao' ? "Realizadas" : "Concluídas")} 
                  value={stats.totalPerformed.toLocaleString()} 
                  icon={<CheckCircle2 className={theme !== 'white' ? "text-emerald-400" : "text-emerald-600"}/>} 
                  label={`${stats.successRate.toFixed(1)}% Efic.`} 
                  theme={theme}
                />
                <KpiCard 
                  title={isConsistencia ? "Não-Realizadas" : (activeSection === 'transmissao' ? "Pendências" : "Pendentes")} 
                  value={stats.totalPending.toLocaleString()} 
                  icon={<AlertCircle className={theme !== 'white' ? "text-red-400" : "text-red-600"}/>} 
                  label={`${stats.pendingRate.toFixed(1)}% Pend.`} 
                  theme={theme}
                />
                {!isConsistencia && <KpiCard title="Não Enviada" value={stats.totalNotSent.toLocaleString()} icon={<MessageSquareWarning className={theme !== 'white' ? "text-orange-400" : "text-orange-600"}/>} theme={theme}/>}
              </div>

              {view === 'dashboard' ? (
                <div className="space-y-10 pb-12 no-print">
                  <div className="grid grid-cols-1 gap-8">
                    <div className={`${theme !== 'white' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-gray-100'} p-8 rounded-[2.5rem] border shadow-sm min-h-[500px] relative`}>
                      <div className="flex justify-between items-center mb-8">
                        <h3 className={`font-black text-sm uppercase tracking-widest ${theme !== 'white' ? 'text-white' : 'text-gray-900'}`}>Pendências por Base</h3>
                        <div className={`${theme !== 'white' ? 'bg-red-900/30 border-red-800/50' : 'bg-red-50 border-red-100'} px-4 py-2 rounded-xl border flex items-center gap-3`}>
                          <span className={`text-xs font-black uppercase ${theme !== 'white' ? 'text-red-300' : 'text-red-600'}`}>Pendências em Geral:</span>
                          <span className={`text-base font-black ${theme !== 'white' ? 'text-red-400' : 'text-red-700'}`}>{stats.totalPending.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={baseChartData} margin={{ bottom: 100, top: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme !== 'white' ? 'rgba(255,255,255,0.1)' : '#f1f5f9'} />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            interval={0}
                            tick={{ 
                              fontSize: 9, 
                              fontWeight: 900, 
                              fill: theme !== 'white' ? '#93c5fd' : '#64748b', 
                              angle: -45, 
                              textAnchor: 'end',
                              dy: 10
                            }} 
                          />
                          <YAxis axisLine={false} tickLine={false} tick={false} />
                          <Tooltip content={<CustomTooltip section={activeSection} theme={theme} />} cursor={{fill: theme !== 'white' ? 'rgba(255,255,255,0.05)' : '#f8fafc'}} />
                          <Bar dataKey="value" fill={isConsistencia ? "#3b82f6" : "#ef4444"} radius={[8, 8, 0, 0]} barSize={45}>
                            <LabelList dataKey="value" position="top" style={{ fontSize: '14px', fontWeight: 900, fill: theme !== 'white' ? '#93c5fd' : '#1e40af' }} offset={10} />
                          </Bar>
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                    {!isConsistencia && (
                      <div className={`${theme !== 'white' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-gray-100'} p-8 rounded-[2.5rem] border shadow-sm min-h-[400px] relative`}>
                        <h3 className={`font-black text-sm uppercase tracking-widest mb-8 ${theme !== 'white' ? 'text-white' : 'text-gray-900'}`}>Tendência Mensal</h3>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendChartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme !== 'white' ? 'rgba(255,255,255,0.1)' : '#f1f5f9'} />
                              <XAxis 
                                dataKey="mes" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 700, fill: theme !== 'white' ? '#93c5fd' : '#64748b' }}
                              />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: theme !== 'white' ? '#93c5fd' : '#64748b' }} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: theme !== 'white' ? '#111827' : '#fff', 
                                  borderColor: theme !== 'white' ? '#374151' : '#e2e8f0',
                                  color: theme !== 'white' ? '#fff' : '#000',
                                  borderRadius: '12px'
                                }}
                              />
                              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                              <Line type="monotone" dataKey="realizadas" name={activeSection === 'transmissao' ? "Realizadas" : "Concluídas"} stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                              <Line type="monotone" dataKey="pendentes" name="Pendências" stroke="#ef4444" strokeWidth={4} dot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className={`${theme !== 'white' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-gray-100'} p-8 rounded-[2.5rem] border shadow-sm min-h-[500px] relative`}>
                    <div className="flex justify-between items-center mb-8">
                      <h3 className={`font-black text-sm uppercase tracking-widest ${theme !== 'white' ? 'text-white' : 'text-gray-900'}`}>Pendências por Contrato</h3>
                      <div className={`${theme !== 'white' ? 'bg-red-900/30 border-red-800/50' : 'bg-red-50 border-red-100'} px-4 py-2 rounded-xl border flex items-center gap-3`}>
                        <span className={`text-xs font-black uppercase ${theme !== 'white' ? 'text-red-300' : 'text-red-600'}`}>Pendências em Geral:</span>
                        <span className={`text-base font-black ${theme !== 'white' ? 'text-red-400' : 'text-red-700'}`}>{stats.totalPending.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart layout="vertical" data={contratoChartData} margin={{ left: 20, right: 60 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: theme !== 'white' ? '#93c5fd' : '#64748b' }} width={140} />
                          <Tooltip content={<CustomTooltip section={activeSection} theme={theme} />} cursor={{fill: theme !== 'white' ? 'rgba(255,255,255,0.05)' : '#f8fafc'}} />
                          <Bar dataKey="value" fill={isConsistencia ? "#3b82f6" : "#ef4444"} radius={[0, 8, 8, 0]} barSize={18}>
                            <LabelList dataKey="value" position="right" style={{ fontSize: '14px', fontWeight: 900, fill: theme !== 'white' ? '#93c5fd' : '#1e40af' }} offset={10} />
                          </Bar>
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className={`${theme !== 'white' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-gray-100'} p-8 rounded-[2.5rem] border shadow-sm min-h-[500px] flex flex-col items-center`}>
                    <h3 className={`font-black text-sm uppercase tracking-widest self-start mb-10 ${theme !== 'white' ? 'text-white' : 'text-gray-900'}`}>Relação de Status</h3>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusDonutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={100}
                              outerRadius={150}
                              paddingAngle={10}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {statusDonutData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === 'OK' || entry.name === 'Concluído' || entry.name === 'Finalizado' ? '#10b981' : '#ef4444'} />
                              ))}
                            </Pie>
                            <Tooltip content={<DonutTooltip breakdown={isConsistencia ? contratoBreakdown : baseBreakdown} theme={theme} />} />
                          </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-6">
                      {isConsistencia ? (
                        statusDonutData.map((entry, index) => (
                          <div key={index} className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.name === 'Finalizado' ? '#10b981' : '#ef4444' }}></div>
                              <span className={`text-lg font-black ${theme !== 'white' ? 'text-white' : 'text-gray-800'}`}>{entry.value.toLocaleString()}</span>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${theme !== 'white' ? 'text-blue-300' : 'text-gray-400'}`}>{entry.name}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-md"></div>
                              <span className={`text-xl font-black ${theme !== 'white' ? 'text-white' : 'text-gray-800'}`}>{stats.totalPerformed.toLocaleString()}</span>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${theme !== 'white' ? 'text-blue-300' : 'text-gray-400'}`}>{isNotas ? 'Concluído' : 'OK'}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-red-500 shadow-md"></div>
                              <span className={`text-xl font-black ${theme !== 'white' ? 'text-white' : 'text-gray-800'}`}>{stats.totalPending.toLocaleString()}</span>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${theme !== 'white' ? 'text-blue-300' : 'text-gray-400'}`}>{isNotas ? 'Pendente' : 'N-OK'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                  {/* GRÁFICO: Procedência da Reclamação por Leiturista - ATUALIZADO COM CORES VERMELHO CLARO */}
                  {isNotas && (
                    <div className="grid grid-cols-1 gap-8">
                      <div className={`${theme !== 'white' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-gray-100'} p-8 rounded-[2.5rem] border shadow-xl min-h-[550px] relative overflow-hidden group`}>
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 opacity-20 pointer-events-none transition-transform group-hover:scale-110 ${theme !== 'white' ? 'bg-blue-400' : 'bg-red-50'}`}></div>
                        <div className="flex justify-between items-start mb-10">
                          <div className="space-y-1">
                            <h3 className={`font-black text-sm uppercase tracking-widest flex items-center gap-3 ${theme !== 'white' ? 'text-white' : 'text-gray-900'}`}>
                              <Frown className={`w-5 h-5 ${theme !== 'white' ? 'text-red-300' : 'text-red-400'}`} />
                              Procedência da Reclamação por Leiturista
                            </h3>
                            <p className={`text-[10px] uppercase tracking-tighter ${theme !== 'white' ? 'text-blue-300' : 'text-gray-500'}`}>
                               <b className="italic font-bold">Passar cursor e ver análise</b>
                            </p>
                          </div>
                          <div className="flex gap-4">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${theme !== 'white' ? 'bg-red-900/30' : 'bg-red-50'}`}>
                              <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
                              <span className={`text-[10px] font-black uppercase ${theme !== 'white' ? 'text-red-300' : 'text-rose-700'}`}>Sim</span>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${theme !== 'white' ? 'bg-red-950/50' : 'bg-red-100'}`}>
                              <div className="w-2.5 h-2.5 rounded-full bg-[#991b1b]"></div>
                              <span className={`text-[10px] font-black uppercase ${theme !== 'white' ? 'text-red-400' : 'text-red-800'}`}>Não</span>
                            </div>
                          </div>
                        </div>
                        <div className="h-[400px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={procedenciaChartData} margin={{ bottom: 120, top: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme !== 'white' ? 'rgba(255,255,255,0.1)' : '#f1f5f9'} />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              interval={0}
                              tick={{ 
                                fontSize: 9, 
                                fontWeight: 900, 
                                fill: theme !== 'white' ? '#93c5fd' : '#475569', 
                                angle: -45, 
                                textAnchor: 'end',
                                dy: 10
                              }} 
                            />
                            <YAxis axisLine={false} tickLine={false} tick={false} />
                            <Tooltip content={<ProcedenciaTooltip theme={theme} />} cursor={{fill: theme !== 'white' ? 'rgba(255,255,255,0.05)' : 'rgba(254, 226, 226, 0.4)'}} />
                            <Bar dataKey="sim" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} barSize={40} />
                            <Bar dataKey="nao" stackId="a" fill="#991b1b" radius={[8, 8, 0, 0]} barSize={40}>
                              <LabelList 
                                dataKey="total" 
                                position="top" 
                                style={{ fontSize: '16px', fontWeight: 900, fill: theme !== 'white' ? '#fca5a5' : '#991b1b' }} 
                                formatter={(val: any) => val}
                              />
                            </Bar>
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="absolute bottom-6 right-8 flex items-center gap-2">
                        <Info className={`w-4 h-4 ${theme !== 'white' ? 'text-red-300' : 'text-red-300'}`} />
                        <span className={`text-[10px] font-black uppercase italic ${theme !== 'white' ? 'text-blue-300' : 'text-gray-400'}`}>Dados extraídos da coluna PROCEDÊNCIA</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
                <div className={`rounded-[2.5rem] border shadow-sm overflow-hidden mb-10 print-full-table ${theme !== 'white' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-gray-100'}`}>
                   <div className={`p-6 border-b flex justify-between items-center no-print ${theme !== 'white' ? 'border-gray-700/50' : 'border-gray-50'}`}>
                     <h2 className={`font-black text-xs uppercase tracking-widest ${theme !== 'white' ? 'text-white' : 'text-gray-900'}`}>Base de Dados - {sectionTitle.toUpperCase()}</h2>
                     <div className="flex gap-3">
                        <button onClick={exportToExcel} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${theme !== 'white' ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-800/30' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                          <FileSpreadsheet className="w-4 h-4"/> Exportar em Excel
                        </button>
                        <button onClick={exportToPDF} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${theme !== 'white' ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                          <Printer className="w-4 h-4"/> Exportar em PDF
                        </button>
                     </div>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left whitespace-nowrap table-auto">
                        {isNotas ? (
                          <thead className={`${theme !== 'white' ? 'bg-gray-800 text-blue-300' : 'bg-orange-500 text-white'} text-[10px] font-black uppercase tracking-widest`}>
                            <tr>
                              <th className="px-4 py-4">MÊS</th>
                              <th className="px-4 py-4">ANO</th>
                              <th className="px-4 py-4">CONTRATO</th>
                              <th className="px-4 py-4">TIPO</th>
                              <th className="px-4 py-4">Nota</th>
                              <th className="px-4 py-4">Data Nota</th>
                              <th className="px-4 py-4">Instalação</th>
                              <th className="px-4 py-4">RAZAO</th>
                              <th className="px-4 py-4">Unidade de leitura</th>
                              <th className="px-4 py-4">Base</th>
                              <th className="px-4 py-4">Leiturista</th>
                              <th className="px-4 py-4">Prazo</th>
                              <th className="px-4 py-4">Procedência</th>
                              <th className="px-4 py-4 text-center">Status</th>
                            </tr>
                          </thead>
                        ) : isConsistencia ? (
                          <thead className={`${theme !== 'white' ? 'bg-gray-800 text-blue-300' : 'bg-gray-50/50 text-gray-400'} text-[10px] font-black uppercase tracking-widest`}>
                            <tr>
                              <th className="px-8 py-5">Mês</th>
                              <th className="px-8 py-5">Ano</th>
                              <th className="px-8 py-5">RZ</th>
                              <th className="px-8 py-5">UL</th>
                              <th className="px-8 py-5">Base</th>
                              <th className="px-8 py-5">Contrato</th>
                              <th className="px-8 py-5 text-center">Cons. a realizar</th>
                              <th className="px-8 py-5 text-center">Realizada</th>
                              <th className="px-8 py-5 text-center">N-Realizada</th>
                              <th className="px-8 py-5">Prazo</th>
                            </tr>
                          </thead>
                        ) : (
                          <thead className={`${theme !== 'white' ? 'bg-gray-800 text-blue-300' : 'bg-gray-50/50 text-gray-400'} text-[10px] font-black uppercase tracking-widest`}>
                            <tr>
                              <th className="px-8 py-5">Período</th>
                              <th className="px-8 py-5">Base</th>
                              <th className="px-8 py-5">Cidade</th>
                              <th className="px-8 py-5">Razão</th>
                              <th className="px-8 py-5">UL</th>
                              <th className="px-8 py-5 text-center">Leituras a Fazer</th>
                              <th className="px-8 py-5 text-center">Executadas</th>
                              <th className="px-8 py-5 text-center">Pendentes</th>
                            </tr>
                          </thead>
                        )}
                        <tbody className={`divide-y text-[12px] font-bold ${theme !== 'white' ? 'divide-blue-800/50' : 'divide-gray-50'}`}>
                          {(view === 'table' ? tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize) : tableData).map((row: any, i) => (
                            <tr key={i} className={`transition-colors ${theme !== 'white' ? 'hover:bg-blue-800/20' : 'hover:bg-blue-50/10'}`}>
                              {isNotas ? (
                                <>
                                  <td className={`px-4 py-4 ${theme !== 'white' ? 'text-blue-200' : 'text-gray-500'}`}>{row.MES}</td>
                                  <td className={`px-4 py-4 ${theme !== 'white' ? 'text-blue-200' : 'text-gray-500'}`}>{row.ANO}</td>
                                  <td className={`px-4 py-4 font-black ${theme !== 'white' ? 'text-blue-300' : 'text-blue-600'}`}>{row.CONTRATO}</td>
                                  <td className={`px-4 py-4 italic ${theme !== 'white' ? 'text-blue-400' : 'text-gray-500'}`}>{row.TIPO || '-'}</td>
                                  <td className={`px-4 py-4 ${theme !== 'white' ? 'text-blue-100' : 'text-gray-600'}`}>{row.NOTA || '-'}</td>
                                  <td className={`px-4 py-4 ${theme !== 'white' ? 'text-blue-100' : 'text-gray-600'}`}>{row.DATA_DA_NOTA || '-'}</td>
                                  <td className={`px-4 py-4 ${theme !== 'white' ? 'text-blue-100' : 'text-gray-600'}`}>{row.INSTALACAO || '-'}</td>
                                  <td className={`px-4 py-4 truncate max-w-[200px] ${theme !== 'white' ? 'text-white' : 'text-gray-700'}`}>{row.RAZAO}</td>
                                  <td className={`px-4 py-4 ${theme !== 'white' ? 'text-blue-200' : 'text-gray-500'}`}>{row.UL || '-'}</td>
                                  <td className={`px-4 py-4 font-black ${theme !== 'white' ? 'text-blue-300' : 'text-blue-600'}`}>{row.BASE}</td>
                                  <td className={`px-4 py-4 uppercase font-black ${theme !== 'white' ? 'text-purple-300' : 'text-purple-600'}`}>{row.LEITURISTA || '-'}</td>
                                  <td className={`px-4 py-4 ${theme !== 'white' ? 'text-blue-100' : 'text-gray-600'}`}>{row.PRAZO || '-'}</td>
                                  <td className={`px-4 py-4 ${theme !== 'white' ? 'text-blue-200' : 'text-gray-500'}`}>{row.PROCEDENCIA || '-'}</td>
                                  <td className="px-4 py-4 text-center">
                                    <span className={`px-2 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest ${
                                      (row.STATUS || '').toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 'OK' || 
                                      (row.STATUS || '').toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 'CONCLUIDO' ||
                                      (row.STATUS || '').toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 'CONCLUIDA'
                                      ? (theme !== 'white' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-600') : 
                                      (row.STATUS || '').toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 'N-OK' || 
                                      (row.STATUS || '').toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 'PENDENTE' 
                                      ? (theme !== 'white' ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600') : (theme !== 'white' ? 'bg-blue-800/50 text-blue-300' : 'bg-gray-100 text-gray-500')}`}>
                                      {row.STATUS || '-'}
                                    </span>
                                  </td>
                                </>
                              ) : isConsistencia ? (
                                <>
                                  <td className={`px-8 py-5 ${theme !== 'white' ? 'text-blue-400' : 'text-gray-400'}`}>{row.MES}</td>
                                  <td className={`px-8 py-5 ${theme !== 'white' ? 'text-blue-400' : 'text-gray-400'}`}>{row.ANO}</td>
                                  <td className={`px-8 py-5 truncate max-w-[200px] ${theme !== 'white' ? 'text-white' : 'text-gray-700'}`}>{row.RAZAO}</td>
                                  <td className={`px-8 py-5 font-black ${theme !== 'white' ? 'text-blue-300' : 'text-blue-600'}`}>{row.UL || '-'}</td>
                                  <td className={`px-8 py-5 font-black ${theme !== 'white' ? 'text-blue-300' : 'text-blue-600'}`}>{row.BASE}</td>
                                  <td className={`px-8 py-5 ${theme !== 'white' ? 'text-blue-100' : 'text-gray-600'}`}>{row.CONTRATO}</td>
                                  <td className={`px-8 py-5 text-center ${theme !== 'white' ? 'text-white' : 'text-gray-900'}`}>{row.CARD_A_REALIZAR}</td>
                                  <td className={`px-8 py-5 text-center font-black ${theme !== 'white' ? 'text-emerald-400' : 'text-emerald-600'}`}>{row.CARD_REALIZADAS}</td>
                                  <td className={`px-8 py-5 text-center font-black ${theme !== 'white' ? 'text-red-400' : 'text-red-600'}`}>{row.CARD_NAO_REALIZADAS}</td>
                                  <td className={`px-8 py-5 ${theme !== 'white' ? 'text-blue-200' : 'text-gray-500'}`}>{row.PRAZO || '-'}</td>
                                </>
                              ) : (
                                <>
                                  <td className={`px-8 py-5 ${theme !== 'white' ? 'text-blue-400' : 'text-gray-400'}`}>{row.MES}/{row.ANO}</td>
                                  <td className={`px-8 py-5 font-black ${theme !== 'white' ? 'text-blue-300' : 'text-blue-600'}`}>{row.BASE}</td>
                                  <td className={`px-8 py-5 ${theme !== 'white' ? 'text-blue-100' : 'text-gray-600'}`}>{row.CIDADE}</td>
                                  <td className={`px-8 py-5 truncate max-w-[250px] ${theme !== 'white' ? 'text-blue-200' : 'text-gray-500'}`}>{row.RAZAO}</td>
                                  <td className={`px-8 py-5 font-black ${theme !== 'white' ? 'text-blue-300' : 'text-blue-600'}`}>{row.UL || '-'}</td>
                                  <td className={`px-8 py-5 text-center ${theme !== 'white' ? 'text-white' : 'text-gray-900'}`}>{row.LEITURAS_A_REALIZAR}</td>
                                  <td className={`px-8 py-5 text-center font-black ${theme !== 'white' ? 'text-emerald-400' : 'text-emerald-600'}`}>{(row.LEITURAS_100 + row.LEITURAS_30)}</td>
                                  <td className={`px-8 py-5 text-center font-black ${theme !== 'white' ? 'text-red-400' : 'text-red-600'}`}>{row.LEITURAS_NAO_REALIZADAS}</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                   <div className={`p-6 border-t flex items-center justify-between no-print ${theme !== 'white' ? 'bg-gray-800/20 border-gray-700/50' : 'bg-gray-50/20 border-gray-50'}`}>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${theme !== 'white' ? 'text-blue-400' : 'text-gray-400'}`}>Registros: {tableData.length}</span>
                      <div className="flex gap-2">
                         <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} className={`p-3 border rounded-xl shadow-sm transition-all ${theme !== 'white' ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-blue-300' : 'bg-white border-gray-100 hover:bg-gray-50'}`}><ChevronLeft className="w-4 h-4"/></button>
                         <div className={`px-6 py-3 border rounded-xl text-xs font-black shadow-sm ${theme !== 'white' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100'}`}>PÁG {currentPage} / {Math.ceil(tableData.length / pageSize) || 1}</div>
                         <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(tableData.length / pageSize), p+1))} className={`p-3 border rounded-xl shadow-sm transition-all ${theme !== 'white' ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-blue-300' : 'bg-white border-gray-100 hover:bg-gray-50'}`}><ChevronRight className="w-4 h-4"/></button>
                      </div>
                   </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
               <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center text-blue-200 mb-10 border border-blue-50 shadow-sm"><HelpCircle className="w-16 h-16"/></div>
               <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tighter">
                {sectionTitle} Não Conectada
               </h3>
               <p className="text-gray-400 max-w-md text-base leading-relaxed mb-12">Para carregar o dashboard, clique em sincronizar ou cole o link direto da aba correspondente no campo superior.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 text-left shadow-sm">
                     <p className="text-[10px] font-black text-blue-600 uppercase mb-4 flex items-center gap-2"><ExternalLink className="w-4 h-4"/> 1. Acesse a Aba Correta</p>
                     <p className="text-sm text-gray-600 leading-relaxed">No Google Sheets, clique exatamente no nome da aba inferior <strong>{activeSection === 'transmissao' ? 'Transmissao' : sectionTitle}</strong>.</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 text-left shadow-sm">
                     <p className="text-[10px] font-black text-emerald-600 uppercase mb-4 flex items-center gap-2"><ExternalLink className="w-4 h-4"/> 2. Copie o Link da Aba</p>
                     <p className="text-sm text-gray-600 leading-relaxed">Cada aba tem um link próprio (gid). Copie todo o endereço que aparece no navegador e cole aqui.</p>
                  </div>
               </div>
            </div>
          )}
        </>
      )}
    </div>
  </main>
    </div>
  );
}

function FilterDropdown({ label, value, onChange, options, icon, theme }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className={`text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5 ml-1 truncate ${theme !== 'white' ? 'text-blue-300' : 'text-blue-500'}`}>
        {icon} {label}
      </label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className={`w-full text-xs font-bold border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm appearance-none bg-no-repeat bg-right ${
          theme !== 'white' ? 'bg-gray-800 border-gray-700 text-white' : 
          'bg-[#fdfdfd] border-gray-100 text-gray-800 hover:bg-white'
        }`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23${theme !== 'white' ? 'ffffff' : '3b82f6'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundSize: '1em', backgroundPosition: 'right 0.75rem center' }}
      >
        <option value="Tudo">Filtrar {label}</option>
        {options.filter((o: string) => o !== 'Tudo').map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function MultiSelectFilter({ label, selected, onChange, options, icon, theme }: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 relative">
      <label className={`text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5 ml-1 truncate ${theme !== 'white' ? 'text-blue-300' : 'text-blue-500'}`}>
        {icon} {label}
      </label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-xs font-bold border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm cursor-pointer flex justify-between items-center ${
          theme !== 'white' ? 'bg-gray-800 border-gray-700 text-white' : 
          'bg-[#fdfdfd] border-gray-100 text-gray-800 hover:bg-white'
        }`}
      >
        <span className="truncate">
          {selected.length === 0 ? `Filtrar ${label}` : `${selected.length} selecionado(s)`}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${theme !== 'white' ? 'text-white' : 'text-blue-500'}`} />
      </div>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className={`absolute top-full left-0 right-0 mt-2 border rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto p-2 custom-scrollbar ${
            theme !== 'white' ? 'bg-gray-800 border-gray-700' : 
            'bg-white border-gray-100'
          }`}>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => { onChange([]); setIsOpen(false); }}
                className={`text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${theme !== 'white' ? 'text-blue-200 hover:bg-blue-800' : 'text-blue-600 hover:bg-blue-50'}`}
              >
                Limpar Tudo
              </button>
              {options.map((option: string) => (
                <label key={option} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${theme !== 'white' ? 'hover:bg-blue-800' : 'hover:bg-gray-50'}`}>
                  <input 
                    type="checkbox" 
                    checked={selected.includes(option)}
                    onChange={() => {
                      if (selected.includes(option)) {
                        onChange(selected.filter((s: string) => s !== option));
                      } else {
                        onChange([...selected, option]);
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-xs font-bold ${theme !== 'white' ? 'text-blue-100' : 'text-gray-700'}`}>{option}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ title, value, icon, label, trend, theme }: any) {
  return (
    <div className={`${theme !== 'white' ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-100'} p-8 rounded-[2.5rem] border shadow-sm hover:shadow-xl transition-all duration-300`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${theme !== 'white' ? 'bg-gray-800' : 'bg-gray-50'}`}>{icon}</div>
        {trend && <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase ${theme !== 'white' ? 'text-emerald-400 bg-emerald-900/30' : 'text-emerald-500 bg-emerald-50'}`}>{trend}</span>}
        {label && !trend && <span className={`text-[10px] font-black border px-3 py-1.5 rounded-xl uppercase tracking-widest ${theme !== 'white' ? 'text-blue-300 border-gray-700 bg-gray-800/30' : 'text-gray-400 border-gray-100'}`}>{label}</span>}
      </div>
      <p className={`text-[11px] font-black uppercase tracking-[0.2em] mb-2 ${theme !== 'white' ? 'text-blue-300' : 'text-gray-400'}`}>{title}</p>
      <h4 className={`text-4xl font-black tracking-tighter ${theme !== 'white' ? 'text-white' : 'text-gray-900'}`}>{value}</h4>
    </div>
  );
}
