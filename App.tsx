
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList, PieChart, Pie, Cell, Legend
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
  Navigation
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ReadingData, NotaData, DashboardStats, AppSection } from './types';
import { parseGoogleSheetUrl, fetchSheetData } from './services/sheetService';

const COLORS = ['#10b981', '#ef4444']; // Emerald-500, Red-500

const DEFAULT_URL_TRANSMISSAO = 'https://docs.google.com/spreadsheets/d/10iINVBkcQQ4LuY7LXq66UQmSIH7nmqU3WfvgOb9TmOE/edit?pli=1&gid=0#gid=0';
const DEFAULT_URL_NOTAS = 'https://docs.google.com/spreadsheets/d/10iINVBkcQQ4LuY7LXq66UQmSIH7nmqU3WfvgOb9TmOE/edit?pli=1&gid=1027234200#gid=1027234200';
const DEFAULT_URL_NOTAS_TRIANGULO = 'https://docs.google.com/spreadsheets/d/10iINVBkcQQ4LuY7LXq66UQmSIH7nmqU3WfvgOb9TmOE/edit?pli=1&gid=566285946#gid=566285946';
const DEFAULT_URL_NOTAS_MANTIQUEIRA = 'https://docs.google.com/spreadsheets/d/10iINVBkcQQ4LuY7LXq66UQmSIH7nmqU3WfvgOb9TmOE/edit?gid=548357481#gid=548357481';

const CustomTooltip = ({ active, payload, label, section }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isTransmissao = section === 'transmissao';
    return (
      <div className="bg-white p-4 border border-gray-200 shadow-2xl rounded-xl text-sm min-w-[180px]">
        <p className="font-black text-gray-800 mb-3 text-base border-b pb-2">{label || data.name}</p>
        <div className="space-y-2">
          <p className="flex justify-between gap-6 text-blue-700 font-bold">
            <span>{isTransmissao ? 'A Realizar:' : 'Geradas:'}</span> 
            <span>{data.aRealizar?.toLocaleString()}</span>
          </p>
          <p className="flex justify-between gap-6 text-emerald-700 font-bold">
            <span>{isTransmissao ? 'Realizadas:' : 'Concluídas:'}</span> 
            <span>{data.realizadas?.toLocaleString()}</span>
          </p>
          <p className="flex justify-between gap-6 text-red-700 font-black border-t pt-2 mt-2">
            <span>Pendências:</span> 
            <span>{data.value?.toLocaleString()}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const DonutTooltip = ({ active, payload, baseBreakdown }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const statusType = data.name; 
    const isOK = statusType === 'OK';
    
    return (
      <div className="bg-white p-5 border border-gray-100 shadow-2xl rounded-2xl text-xs min-w-[240px]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
          <span className={`font-black uppercase tracking-widest text-sm ${isOK ? 'text-emerald-600' : 'text-red-600'}`}>
            Status: {statusType}
          </span>
          <span className="font-bold text-gray-500">Total: {data.value.toLocaleString()}</span>
        </div>
        <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.entries(baseBreakdown).map(([base, stats]: [string, any]) => {
            const count = isOK ? stats.ok : stats.nok;
            if (count === 0) return null;
            return (
              <div key={base} className="flex justify-between items-center gap-4">
                <span className="text-gray-600 font-bold truncate max-w-[140px]">{base}</span>
                <span className={`font-black text-sm ${isOK ? 'text-emerald-600' : 'text-red-600'}`}>{count.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const ProcedenciaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-gray-200 shadow-2xl rounded-xl text-sm min-w-[200px]">
        <p className="font-black text-gray-800 mb-2 border-b pb-1 uppercase text-xs tracking-wider">{label}</p>
        <div className="space-y-1">
          <p className="flex justify-between text-blue-600 font-bold">
            <span>Total Reclamações:</span> 
            <span>{data.total}</span>
          </p>
          <div className="pt-2 mt-2 border-t border-gray-50 space-y-1">
            <p className="flex justify-between text-rose-600 font-bold">
              <span>Procedente (Sim):</span> 
              <span className="font-black">{data.sim}</span>
            </p>
            <p className="flex justify-between text-red-700 font-bold">
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

  const [transmissaoUrl, setTransmissaoUrl] = useState(DEFAULT_URL_TRANSMISSAO);
  const [notasUrl, setNotasUrl] = useState(DEFAULT_URL_NOTAS);
  const [notasTrianguloUrl, setNotasTrianguloUrl] = useState(DEFAULT_URL_NOTAS_TRIANGULO);
  const [notasMantiqueiraUrl, setNotasMantiqueiraUrl] = useState(DEFAULT_URL_NOTAS_MANTIQUEIRA);
  const [transmissaoRawData, setTransmissaoRawData] = useState<ReadingData[]>([]);
  const [notasRawData, setNotasRawData] = useState<NotaData[]>([]);
  const [notasTrianguloRawData, setNotasTrianguloRawData] = useState<NotaData[]>([]);
  const [notasMantiqueiraRawData, setNotasMantiqueiraRawData] = useState<NotaData[]>([]);
  const [transmissaoMeta, setTransmissaoMeta] = useState<{ lastUpdate: string | null }>({ lastUpdate: null });
  const [notasMeta, setNotasMeta] = useState<{ lastUpdate: string | null }>({ lastUpdate: null });
  const [notasTrianguloMeta, setNotasTrianguloMeta] = useState<{ lastUpdate: string | null }>({ lastUpdate: null });
  const [notasMantiqueiraMeta, setNotasMantiqueiraMeta] = useState<{ lastUpdate: string | null }>({ lastUpdate: null });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fContrato, setFContrato] = useState('Tudo');
  const [fMes, setFMes] = useState('Tudo');
  const [fAno, setFAno] = useState('Tudo');
  const [fBase, setFBase] = useState('Tudo');
  const [fTipo, setFTipo] = useState('Tudo');
  const [fRota, setFRota] = useState('Tudo');
  const [fLeiturista, setFLeiturista] = useState('Tudo');
  const [fRazao, setFRazao] = useState('Tudo');
  const [fStatus, setFStatus] = useState('Tudo');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const currentRawData = activeSection === 'transmissao' ? transmissaoRawData : (activeSection === 'notas' ? notasRawData : (activeSection === 'notas_triangulo' ? notasTrianguloRawData : notasMantiqueiraRawData));
  const currentUrl = activeSection === 'transmissao' ? transmissaoUrl : (activeSection === 'notas' ? notasUrl : (activeSection === 'notas_triangulo' ? notasTrianguloUrl : notasMantiqueiraUrl));
  const currentMeta = activeSection === 'transmissao' ? (transmissaoMeta.lastUpdate) : (activeSection === 'notas' ? notasMeta.lastUpdate : (activeSection === 'notas_triangulo' ? notasTrianguloMeta.lastUpdate : notasMantiqueiraMeta.lastUpdate));

  const isNotas = activeSection === 'notas' || activeSection === 'notas_triangulo' || activeSection === 'notas_mantiqueira';
  const sectionTitle = activeSection === 'transmissao' ? 'Transmissão' : (activeSection === 'notas' ? 'Notas AM: Contrato de Divinopolis' : (activeSection === 'notas_triangulo' ? 'Notas AM: contrato do Triângulo' : 'Notas AM: Contrato da Mantiqueira'));

  const handleLoadData = useCallback(async (sectionOverride?: AppSection) => {
    const targetSection = sectionOverride || activeSection;
    const url = targetSection === 'transmissao' ? transmissaoUrl : 
                (targetSection === 'notas' ? notasUrl : 
                (targetSection === 'notas_triangulo' ? notasTrianguloUrl : notasMantiqueiraUrl));
    
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
          "STATUS": row.STATUS,
          "PROCEDENCIA": row.PROCEDENCIA
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
    setFBase('Tudo'); setFTipo('Tudo'); setFRota('Tudo'); 
    setFLeiturista('Tudo'); setFRazao('Tudo'); setFStatus('Tudo');
    setCurrentPage(1); setError(null);
  }, [activeSection]);

  // Resetar Rota se o Tipo não for CNV
  useEffect(() => {
    if (fTipo !== 'CNV') {
      setFRota('Tudo');
    }
  }, [fTipo]);

  const contratos = useMemo(() => ['Tudo', ...Array.from(new Set(currentRawData.map((d: any) => d.CONTRATO).filter(Boolean))).sort()], [currentRawData]);
  const dataContrato = useMemo(() => currentRawData.filter(d => fContrato === 'Tudo' || d.CONTRATO === fContrato), [currentRawData, fContrato]);
  
  const meses = useMemo(() => ['Tudo', ...Array.from(new Set(dataContrato.map(d => d.MES).filter(Boolean))).sort()], [dataContrato]);
  const dataMes = useMemo(() => dataContrato.filter(d => fMes === 'Tudo' || d.MES === fMes), [dataContrato, fMes]);
  
  const anos = useMemo(() => ['Tudo', ...Array.from(new Set(dataMes.map(d => d.ANO).filter(Boolean))).sort()], [dataMes]);
  const dataAno = useMemo(() => dataMes.filter(d => fAno === 'Tudo' || d.ANO === fAno), [dataMes, fAno]);
  
  const bases = useMemo(() => ['Tudo', ...Array.from(new Set(dataAno.map(d => d.BASE).filter(Boolean))).sort()], [dataAno]);
  const dataBase = useMemo(() => dataAno.filter(d => fBase === 'Tudo' || d.BASE === fBase), [dataAno, fBase]);

  const tipos = useMemo(() => ['Tudo', ...Array.from(new Set(dataBase.map((d: any) => d.TIPO).filter(Boolean))).sort()], [dataBase]);
  const dataTipo = useMemo(() => dataBase.filter((d: any) => fTipo === 'Tudo' || d.TIPO === fTipo), [dataBase, fTipo]);
  
  const rotas = useMemo(() => {
    if (fTipo === 'CNV') return ['Tudo', '96', '97', '98', '99'];
    return ['Tudo'];
  }, [fTipo]);
  const dataRota = useMemo(() => dataTipo.filter((d: any) => fRota === 'Tudo' || String(d.ROTA) === fRota), [dataTipo, fRota]);

  const leituristas = useMemo(() => ['Tudo', ...Array.from(new Set(dataRota.map(d => (d as any).LEITURISTA).filter(Boolean))).sort()], [dataRota]);
  const dataLeiturista = useMemo(() => dataRota.filter(d => fLeiturista === 'Tudo' || (d as any).LEITURISTA === fLeiturista), [dataRota, fLeiturista]);
  
  const razoes = useMemo(() => ['Tudo', ...Array.from(new Set(dataLeiturista.map(d => d.RAZAO).filter(Boolean))).sort()], [dataLeiturista]);
  const dataRazao = useMemo(() => dataLeiturista.filter(d => fRazao === 'Tudo' || d.RAZAO === fRazao), [dataLeiturista, fRazao]);
  
  const statuses = useMemo(() => ['Tudo', ...Array.from(new Set(dataRazao.map((d: any) => d.STATUS).filter(Boolean))).sort()], [dataRazao]);
  const filteredData = useMemo(() => dataRazao.filter((d: any) => fStatus === 'Tudo' || d.STATUS === fStatus), [dataRazao, fStatus]);

  const stats = useMemo<DashboardStats>(() => {
    if (!filteredData.length) return { totalToPerform: 0, totalPerformed: 0, totalPending: 0, successRate: 0, pendingRate: 0 };
    let tP = 0, tR = 0, tPend = 0;
    if (activeSection === 'transmissao') {
      filteredData.forEach((d: any) => { tP += d.LEITURAS_A_REALIZAR; tR += (d.LEITURAS_100 + d.LEITURAS_30); tPend += d.LEITURAS_NAO_REALIZADAS; });
    } else {
      filteredData.forEach((d: any) => { tP += d.NOTAS_GERADAS; tR += d.NOTAS_CONCLUIDAS; tPend += d.NOTAS_PENDENTES; });
    }
    return { totalToPerform: tP, totalPerformed: tR, totalPending: tPend, successRate: tP > 0 ? (tR / tP) * 100 : 0, pendingRate: tP > 0 ? (tPend / tP) * 100 : 0 };
  }, [filteredData, activeSection]);

  const baseChartData = useMemo(() => {
    const map: Record<string, any> = {};
    filteredData.forEach((d: any) => {
      if (!map[d.BASE]) map[d.BASE] = { name: d.BASE, value: 0, aRealizar: 0, realizadas: 0 };
      if (activeSection === 'transmissao') { map[d.BASE].value += d.LEITURAS_NAO_REALIZADAS; map[d.BASE].aRealizar += d.LEITURAS_A_REALIZAR; map[d.BASE].realizadas += (d.LEITURAS_100 + d.LEITURAS_30); }
      else { map[d.BASE].value += d.NOTAS_PENDENTES; map[d.BASE].aRealizar += d.NOTAS_GERADAS; map[d.BASE].realizadas += d.NOTAS_CONCLUIDAS; }
    });
    return Object.values(map).sort((a: any, b: any) => b.value - a.value);
  }, [filteredData, activeSection]);

  const contratoChartData = useMemo(() => {
    const map: Record<string, any> = {};
    filteredData.forEach((d: any) => {
      const name = d.CONTRATO || 'Não Informado';
      if (!map[name]) map[name] = { name, value: 0, aRealizar: 0, realizadas: 0 };
      if (activeSection === 'transmissao') { 
        map[name].value += (d.LEITURAS_NAO_REALIZADAS || 0); 
        map[name].aRealizar += (d.LEITURAS_A_REALIZAR || 0); 
        map[name].realizadas += ((d.LEITURAS_100 || 0) + (d.LEITURAS_30 || 0)); 
      }
      else { 
        map[name].value += (d.NOTAS_PENDENTES || 0); 
        map[name].aRealizar += (d.NOTAS_GERADAS || 0); 
        map[name].realizadas += (d.NOTAS_CONCLUIDAS || 0); 
      }
    });
    return Object.values(map).sort((a: any, b: any) => b.value - a.value);
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

  const statusDonutData = useMemo(() => [
    { name: 'OK', value: stats.totalPerformed },
    { name: 'N-OK', value: stats.totalPending }
  ], [stats]);

  const baseBreakdown = useMemo(() => {
    const map: Record<string, { ok: number, nok: number }> = {};
    filteredData.forEach((d: any) => {
      const baseName = d.BASE || 'Outros';
      if (!map[baseName]) map[baseName] = { ok: 0, nok: 0 };
      if (activeSection === 'transmissao') {
        map[baseName].ok += (d.LEITURAS_100 + d.LEITURAS_30);
        map[baseName].nok += d.LEITURAS_NAO_REALIZADAS;
      } else {
        map[baseName].ok += d.NOTAS_CONCLUIDAS;
        map[baseName].nok += d.NOTAS_PENDENTES;
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
    if (fTipo !== 'Tudo') parts.push(`Tipo: ${fTipo}`);
    if (fRota !== 'Tudo') parts.push(`Rota: ${fRota}`);
    if (fLeiturista !== 'Tudo') parts.push(`Leiturista: ${fLeiturista}`);
    if (fRazao !== 'Tudo') parts.push(`Razão: ${fRazao}`);
    if (fStatus !== 'Tudo') parts.push(`Status: ${fStatus}`);
    return parts.length > 0 ? parts.join(' | ') : 'Visualizando Todos os Dados';
  }, [fContrato, fMes, fAno, fBase, fTipo, fRota, fLeiturista, fRazao, fStatus]);

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans relative">
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

      <aside className={`fixed md:relative z-50 h-full bg-white border-r border-gray-100 transition-all duration-300 flex flex-col shadow-xl md:shadow-none ${isSidebarOpen ? 'w-80' : 'w-0 md:w-0'} overflow-hidden no-print`}>
        <div className="p-6 w-80 h-full flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3 text-blue-600">
              <Zap className="w-8 h-8 fill-current" />
              <div className="flex flex-col">
                <span className="text-sm font-black text-gray-800 uppercase leading-none">SAT: Sistema de</span>
                <span className="text-sm font-black text-gray-800 uppercase leading-none mt-1">Acompanhamento de Transmissão</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400"><X /></button>
          </div>
          <nav className="space-y-4 flex-1">
             <div className="space-y-1">
                <button onClick={() => setIsTransmissionOpen(!isTransmissionOpen)} className="w-full px-4 py-3 flex items-center justify-between text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                  <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase"><ClipboardList className="w-4 h-4"/> TRANSMISSÃO</div>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isTransmissionOpen ? '' : '-rotate-90'}`} />
                </button>
                <div className={`space-y-1 pl-4 overflow-hidden transition-all ${isTransmissionOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <button onClick={() => { setActiveSection('transmissao'); setView('dashboard'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'transmissao' && view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Dashboard</button>
                  <button onClick={() => { setActiveSection('transmissao'); setView('table'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'transmissao' && view === 'table' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Base de Dados</button>
                </div>
             </div>
              <div className="space-y-1">
                <button onClick={() => setIsNotasOpen(!isNotasOpen)} className="w-full px-4 py-3 flex items-center justify-between text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                  <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase"><MessageSquareWarning className="w-4 h-4"/> Notas AM: Contrato de Divinopolis</div>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isNotasOpen ? '' : '-rotate-90'}`} />
                </button>
                <div className={`space-y-1 pl-4 overflow-hidden transition-all ${isNotasOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <button onClick={() => { setActiveSection('notas'); setView('dashboard'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'notas' && view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Dashboard</button>
                  <button onClick={() => { setActiveSection('notas'); setView('table'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'notas' && view === 'table' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Base de Dados</button>
                </div>
             </div>
             <div className="space-y-1">
                <button onClick={() => setIsNotasTrianguloOpen(!isNotasTrianguloOpen)} className="w-full px-4 py-3 flex items-center justify-between text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                  <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase"><MessageSquareWarning className="w-4 h-4"/> Notas AM: contrato do Triângulo</div>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isNotasTrianguloOpen ? '' : '-rotate-90'}`} />
                </button>
                <div className={`space-y-1 pl-4 overflow-hidden transition-all ${isNotasTrianguloOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <button onClick={() => { setActiveSection('notas_triangulo'); setView('dashboard'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'notas_triangulo' && view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Dashboard</button>
                  <button onClick={() => { setActiveSection('notas_triangulo'); setView('table'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'notas_triangulo' && view === 'table' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Base de Dados</button>
                </div>
             </div>
             <div className="space-y-1">
                <button onClick={() => setIsNotasMantiqueiraOpen(!isNotasMantiqueiraOpen)} className="w-full px-4 py-3 flex items-center justify-between text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                  <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase"><MessageSquareWarning className="w-4 h-4"/> Notas AM: Contrato da Mantiqueira</div>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isNotasMantiqueiraOpen ? '' : '-rotate-90'}`} />
                </button>
                <div className={`space-y-1 pl-4 overflow-hidden transition-all ${isNotasMantiqueiraOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <button onClick={() => { setActiveSection('notas_mantiqueira'); setView('dashboard'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'notas_mantiqueira' && view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Dashboard</button>
                  <button onClick={() => { setActiveSection('notas_mantiqueira'); setView('table'); }} className={`w-full text-left px-4 py-2 text-sm font-bold rounded-lg ${activeSection === 'notas_mantiqueira' && view === 'table' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Base de Dados</button>
                </div>
             </div>
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex flex-col gap-4 z-40 shadow-sm no-print">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-500">
                {isSidebarOpen ? <ChevronFirst /> : <Menu />}
              </button>
              <div className="flex flex-col">
                {currentMeta && (
                  <span className="text-[10px] font-black text-emerald-600 uppercase mb-1">
                    Última atualização: {currentMeta}
                  </span>
                )}
                <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                  {sectionTitle}
                </h1>
              </div>
            </div>
            
            <div className="flex-1 max-w-2xl flex flex-col gap-1">
               <label className="text-[10px] font-black text-blue-500 uppercase ml-1">
                  Link: Caso queira tratar outra planilha, cole aqui e depois clique em sincronizar
               </label>
               <div className="bg-blue-600 p-1 rounded-2xl flex items-center flex-1 shadow-lg transition-all focus-within:ring-4 focus-within:ring-blue-100">
                  <input 
                    type="text" 
                    value={currentUrl} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (activeSection === 'transmissao') setTransmissaoUrl(val);
                      else if (activeSection === 'notas') setNotasUrl(val);
                      else if (activeSection === 'notas_triangulo') setNotasTrianguloUrl(val);
                      else setNotasMantiqueiraUrl(val);
                    }}
                    placeholder="Link da aba do Google Sheets (Opcional)..."
                    className="flex-1 px-5 py-2 text-sm bg-transparent text-white placeholder-blue-200 border-none focus:ring-0 outline-none"
                  />
                  <button 
                    onClick={() => handleLoadData()} 
                    disabled={loading} 
                    className="px-6 py-2.5 bg-white text-blue-600 text-[11px] font-black rounded-xl hover:bg-blue-50 disabled:bg-gray-300 uppercase flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Sincronizar Dados'}
                  </button>
               </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
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
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 no-print">
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Menus de Seleção de Dados</span>
                  </div>
                  <button 
                    onClick={() => handleLoadData()} 
                    className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Atualizar Planilha
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-9 gap-6">
                  <FilterDropdown label="Contrato" value={fContrato} onChange={setFContrato} options={contratos} icon={<Database className="w-3 h-3"/>}/>
                  <FilterDropdown label="Mês" value={fMes} onChange={setFMes} options={meses} icon={<CalendarDays className="w-3 h-3"/>}/>
                  <FilterDropdown label="Ano" value={fAno} onChange={setFAno} options={anos} icon={<CalendarDays className="w-3 h-3"/>}/>
                  <FilterDropdown label="Base" value={fBase} onChange={setFBase} options={bases} icon={<MapPin className="w-3 h-3"/>}/>
                  <FilterDropdown label="Tipo" value={fTipo} onChange={setFTipo} options={tipos} icon={<Tag className="w-3 h-3"/>}/>
                  <FilterDropdown label="Rota" value={fRota} onChange={setFRota} options={rotas} icon={<Navigation className="w-3 h-3"/>}/>
                  <FilterDropdown label="Leiturista" value={fLeiturista} onChange={setFLeiturista} options={leituristas} icon={<User className="w-3 h-3"/>}/>
                  <FilterDropdown label="Razão" value={fRazao} onChange={setFRazao} options={razoes} icon={<FileText className="w-3 h-3"/>}/>
                  <FilterDropdown label="Status" value={fStatus} onChange={setFStatus} options={statuses} icon={<Activity className="w-3 h-3"/>}/>
                </div>

                <div className="pt-6 border-t border-gray-50">
                   <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Resumo da Seleção Atual:</p>
                   <div className="flex items-center gap-3">
                      <div className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-md flex items-center gap-3">
                        <Info className="w-4 h-4"/> {summaryText}
                      </div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 no-print">
                <KpiCard title={activeSection === 'transmissao' ? "A Realizar" : "Geradas"} value={stats.totalToPerform.toLocaleString()} icon={<Clock className="text-blue-600"/>} trend="+2.4%"/>
                <KpiCard title={activeSection === 'transmissao' ? "Realizadas" : "Concluídas"} value={stats.totalPerformed.toLocaleString()} icon={<CheckCircle2 className="text-emerald-600"/>} label={`${stats.successRate.toFixed(1)}% Efic.`}/>
                <KpiCard title={activeSection === 'transmissao' ? "Pendências" : "Pendentes"} value={stats.totalPending.toLocaleString()} icon={<AlertCircle className="text-red-600"/>} label={`${stats.pendingRate.toFixed(1)}% Pend.`}/>
              </div>

              {view === 'dashboard' ? (
                <div className="space-y-10 pb-12 no-print">
                  <div className="grid grid-cols-1 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[500px] relative">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Pendências por Base</h3>
                        <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100 flex items-center gap-3">
                          <span className="text-xs font-black text-red-600 uppercase">Pendências em Geral:</span>
                          <span className="text-base font-black text-red-700">{stats.totalPending.toLocaleString()}</span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={baseChartData} margin={{ bottom: 100, top: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            interval={0}
                            tick={{ 
                              fontSize: 9, 
                              fontWeight: 900, 
                              fill: '#64748b', 
                              angle: -45, 
                              textAnchor: 'end',
                              dy: 10
                            }} 
                          />
                          <YAxis axisLine={false} tickLine={false} tick={false} />
                          <Tooltip content={<CustomTooltip section={activeSection} />} cursor={{fill: '#f8fafc'}} />
                          <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={45}>
                            <LabelList dataKey="value" position="top" style={{ fontSize: '13px', fontWeight: 900, fill: '#1e40af' }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[500px] relative">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Pendências por Contrato</h3>
                        <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100 flex items-center gap-3">
                          <span className="text-xs font-black text-red-600 uppercase">Pendências em Geral:</span>
                          <span className="text-base font-black text-red-700">{stats.totalPending.toLocaleString()}</span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height="80%">
                        <BarChart layout="vertical" data={contratoChartData}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} width={140} />
                          <Tooltip content={<CustomTooltip section={activeSection} />} cursor={{fill: '#f8fafc'}} />
                          <Bar dataKey="value" fill="#ef4444" radius={[0, 8, 8, 0]} barSize={18}>
                            <LabelList dataKey="value" position="right" style={{ fontSize: '13px', fontWeight: 900, fill: '#b91c1c' }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[500px] flex flex-col items-center">
                      <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest self-start mb-10">Relação de Status</h3>
                      <ResponsiveContainer width="100%" height="65%">
                        <PieChart>
                          <Pie
                            data={statusDonutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            paddingAngle={10}
                            dataKey="value"
                          >
                            {statusDonutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<DonutTooltip baseBreakdown={baseBreakdown} />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-8 flex gap-8">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-md"></div>
                            <span className="text-xl font-black text-gray-800">{stats.totalPerformed.toLocaleString()}</span>
                          </div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">OK</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-red-500 shadow-md"></div>
                            <span className="text-xl font-black text-gray-800">{stats.totalPending.toLocaleString()}</span>
                          </div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">N-OK</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GRÁFICO: Procedência da Reclamação por Leiturista - ATUALIZADO COM CORES VERMELHO CLARO */}
                  {isNotas && (
                    <div className="grid grid-cols-1 gap-8">
                      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl min-h-[550px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full -mr-32 -mt-32 opacity-20 pointer-events-none transition-transform group-hover:scale-110"></div>
                        <div className="flex justify-between items-start mb-10">
                          <div className="space-y-1">
                            <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-3">
                              <Frown className="w-5 h-5 text-red-400" />
                              Procedência da Reclamação por Leiturista
                            </h3>
                            <p className="text-[10px] uppercase tracking-tighter text-gray-500">
                               <b className="italic font-bold">Passar cursor e ver análise</b>
                            </p>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-xl">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#fecaca]"></div>
                              <span className="text-[10px] font-black text-rose-700 uppercase">Sim</span>
                            </div>
                            <div className="flex items-center gap-2 bg-red-100 px-3 py-1.5 rounded-xl">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#fca5a5]"></div>
                              <span className="text-[10px] font-black text-red-800 uppercase">Não</span>
                            </div>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height="80%">
                          <BarChart data={procedenciaChartData} margin={{ bottom: 120, top: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              interval={0}
                              tick={{ 
                                fontSize: 9, 
                                fontWeight: 900, 
                                fill: '#475569', 
                                angle: -45, 
                                textAnchor: 'end',
                                dy: 10
                              }} 
                            />
                            <YAxis axisLine={false} tickLine={false} tick={false} />
                            <Tooltip content={<ProcedenciaTooltip />} cursor={{fill: 'rgba(254, 226, 226, 0.4)'}} />
                            <Bar dataKey="sim" stackId="a" fill="#fecaca" radius={[0, 0, 0, 0]} barSize={40} />
                            <Bar dataKey="nao" stackId="a" fill="#fca5a5" radius={[8, 8, 0, 0]} barSize={40}>
                              <LabelList 
                                dataKey="total" 
                                position="top" 
                                style={{ fontSize: '12px', fontWeight: 900, fill: '#991b1b' }} 
                                formatter={(val: any) => val}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="absolute bottom-6 right-8 flex items-center gap-2">
                           <Info className="w-4 h-4 text-red-300" />
                           <span className="text-[10px] font-black text-gray-400 uppercase italic">Dados extraídos da coluna PROCEDÊNCIA</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mb-10 print-full-table">
                   <div className="p-6 border-b border-gray-50 flex justify-between items-center no-print">
                     <h2 className="font-black text-gray-900 text-xs uppercase tracking-widest">Base de Dados - {sectionTitle.toUpperCase()}</h2>
                     <div className="flex gap-2">
                        <button onClick={exportToPDF} title="Exportar para PDF" className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100"><Printer className="w-4 h-4 text-gray-400"/></button>
                        <button onClick={exportToExcel} title="Exportar para Excel" className="p-2.5 bg-emerald-50 rounded-xl hover:bg-emerald-100"><FileSpreadsheet className="w-4 h-4 text-emerald-600"/></button>
                     </div>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left whitespace-nowrap table-auto">
                        {isNotas ? (
                          <thead className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest">
                            <tr>
                              <th className="px-4 py-4">MÊS</th>
                              <th className="px-4 py-4">ANO</th>
                              <th className="px-4 py-4">CONTRATO</th>
                              <th className="px-4 py-4">TIPO</th>
                              <th className="px-4 py-4">Nota</th>
                              <th className="px-4 py-4">Instalação</th>
                              <th className="px-4 py-4">RAZAO</th>
                              <th className="px-4 py-4">Unidade de leitura</th>
                              <th className="px-4 py-4">Base</th>
                              <th className="px-4 py-4">Leiturista</th>
                              <th className="px-4 py-4">Procedência</th>
                              <th className="px-4 py-4 text-center">Status</th>
                            </tr>
                          </thead>
                        ) : (
                          <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
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
                        <tbody className="divide-y divide-gray-50 text-[12px] font-bold">
                          {(view === 'table' ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize) : filteredData).map((row: any, i) => (
                            <tr key={i} className="hover:bg-blue-50/10 transition-colors">
                              {isNotas ? (
                                <>
                                  <td className="px-4 py-4 text-gray-500">{row.MES}</td>
                                  <td className="px-4 py-4 text-gray-500">{row.ANO}</td>
                                  <td className="px-4 py-4 text-blue-600 font-black">{row.CONTRATO}</td>
                                  <td className="px-4 py-4 text-gray-500 italic">{row.TIPO || '-'}</td>
                                  <td className="px-4 py-4 text-gray-600">{row.NOTA || '-'}</td>
                                  <td className="px-4 py-4 text-gray-600">{row.INSTALACAO || '-'}</td>
                                  <td className="px-4 py-4 text-gray-700 truncate max-w-[200px]">{row.RAZAO}</td>
                                  <td className="px-4 py-4 text-gray-500">{row.UL || '-'}</td>
                                  <td className="px-4 py-4 text-blue-600 font-black">{row.BASE}</td>
                                  <td className="px-4 py-4 text-purple-600 uppercase font-black">{row.LEITURISTA || '-'}</td>
                                  <td className="px-4 py-4 text-gray-500">{row.PROCEDENCIA || '-'}</td>
                                  <td className="px-4 py-4 text-center">
                                    <span className={`px-2 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest ${row.STATUS === 'OK' ? 'bg-emerald-100 text-emerald-600' : row.STATUS === 'N-OK' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                      {row.STATUS || '-'}
                                    </span>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-8 py-5 text-gray-400">{row.MES}/{row.ANO}</td>
                                  <td className="px-8 py-5 text-blue-600 font-black">{row.BASE}</td>
                                  <td className="px-8 py-5 text-gray-600">{row.CIDADE}</td>
                                  <td className="px-8 py-5 text-gray-500 truncate max-w-[250px]">{row.RAZAO}</td>
                                  <td className="px-8 py-5 text-blue-600 font-black">{row.UL || '-'}</td>
                                  <td className="px-8 py-5 text-center">{row.LEITURAS_A_REALIZAR}</td>
                                  <td className="px-8 py-5 text-center text-emerald-600">{(row.LEITURAS_100 + row.LEITURAS_30)}</td>
                                  <td className="px-8 py-5 text-center text-red-600 font-black">{row.LEITURAS_NAO_REALIZADAS}</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                   <div className="p-6 border-t border-gray-50 flex items-center justify-between bg-gray-50/20 no-print">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registros: {filteredData.length}</span>
                      <div className="flex gap-2">
                         <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50"><ChevronLeft className="w-4 h-4"/></button>
                         <div className="px-6 py-3 bg-white border border-gray-100 rounded-xl text-xs font-black shadow-sm">PÁG {currentPage} / {Math.ceil(filteredData.length / pageSize) || 1}</div>
                         <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredData.length / pageSize), p+1))} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50"><ChevronRight className="w-4 h-4"/></button>
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
        </div>
      </main>
    </div>
  );
}

function FilterDropdown({ label, value, onChange, options, icon }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black text-blue-500 uppercase tracking-tighter flex items-center gap-1.5 ml-1 truncate">
        {icon} {label}
      </label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full text-xs font-bold border border-gray-100 rounded-2xl px-4 py-3 bg-[#fdfdfd] focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:bg-white shadow-sm appearance-none bg-no-repeat bg-right"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%233b82f6\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundSize: '1em', backgroundPosition: 'right 0.75rem center' }}
      >
        <option value="Tudo">Filtrar {label}</option>
        {options.filter((o: string) => o !== 'Tudo').map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function KpiCard({ title, value, icon, label, trend }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-gray-50 rounded-2xl">{icon}</div>
        {trend && <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase">{trend}</span>}
        {label && !trend && <span className="text-[10px] font-black text-gray-400 border border-gray-100 px-3 py-1.5 rounded-xl uppercase tracking-widest">{label}</span>}
      </div>
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{title}</p>
      <h4 className="text-4xl font-black text-gray-900 tracking-tighter">{value}</h4>
    </div>
  );
}
