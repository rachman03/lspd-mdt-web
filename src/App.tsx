import React, { useState, useEffect } from 'react';
import { MdtProvider, useMdt } from './context/MdtContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfficerRank } from './types';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Citizens } from './components/Citizens';
import { Vehicles } from './components/Vehicles';
import { Reports } from './components/Reports';
import { PenalCodeEditor } from './components/PenalCodeEditor';
import { OfficerRoster } from './components/OfficerRoster';
import { CasesArchive } from './components/CasesArchive';
import { EvidenceManagement } from './components/EvidenceManagement';
import { PerformanceBoard } from './components/PerformanceBoard';
import { ActivityLogView } from './components/ActivityLogView';
import { Shield, Clock, LogOut, LayoutDashboard, Landmark, FileText, Car, Globe, User, Terminal, Scale, Users, FolderArchive, Menu, X, ChevronLeft, ChevronRight, Archive, Home, Compass, Sun, Plus, AlertTriangle, Trophy, ClipboardList, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import lspdLogo from './assets/images/lspd_logo_1781980741624.jpg';
import lspdTacticalBadge from './assets/images/lspd_tactical_badge_1784039151998.jpg';

const AppContent: React.FC = () => {
  const { currentOfficer, logoutOfficer, language, setLanguage, registeredOfficers } = useMdt();
  const activeOnDutyCount = registeredOfficers ? registeredOfficers.filter(o => o.onDuty).length : 0;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tabs, setTabs] = useState<{ id: string; label: string }[]>([
    { id: 'dashboard', label: 'MDT Dashboard' }
  ]);
  const [selectedCitizenId, setSelectedCitizenId] = useState<string | null>(null);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  // Sidebar collapsible and responsive drawer states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Time States
  const [tickerTime, setTickerTime] = useState<string>('');
  const [tickerDate, setTickerDate] = useState<string>('');

  useEffect(() => {
    const clockInterval = setInterval(() => {
      const now = new Date();
      setTickerTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setTickerDate(now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }));
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const isGovernment = currentOfficer?.rank === OfficerRank.GOVERNMENT;

  useEffect(() => {
    if (isGovernment) {
      const forbiddenIds = ['cases', 'reports', 'evidence'];
      const filteredTabs = tabs.filter(t => !forbiddenIds.includes(t.id));
      if (filteredTabs.length !== tabs.length) {
        setTabs(filteredTabs.length > 0 ? filteredTabs : [{ id: 'dashboard', label: 'MDT Dashboard' }]);
      }
      if (forbiddenIds.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [currentOfficer, isGovernment, tabs, activeTab]);

  if (!currentOfficer) {
    return <Login />;
  }

  const openTab = (id: string, label: string) => {
    if (!tabs.some(t => t.id === id)) {
      setTabs([...tabs, { id, label }]);
    }
    setActiveTab(id);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTab === id) {
      setActiveTab(newTabs[newTabs.length - 1].id);
    }
  };

  // Navigation tabs config
  const allNavItems = [
    {
      id: 'dashboard',
      label: 'MDT Dashboard',
      icon: Home,
      action: () => openTab('dashboard', 'MDT Dashboard')
    },
    {
      id: 'performance',
      label: 'Div. Performance',
      icon: Trophy,
      action: () => openTab('performance', 'Div. Performance')
    },
    {
      id: 'roster',
      label: 'Active Roster',
      icon: User,
      action: () => openTab('roster', 'Active Roster')
    },
    {
      id: 'vehicles',
      label: 'Vehicle DMV',
      icon: Car,
      action: () => openTab('vehicles', 'Vehicle DMV')
    },
    {
      id: 'cases',
      label: 'Incident Cases',
      icon: FolderArchive,
      action: () => openTab('cases', 'Incident Cases')
    },
    {
      id: 'reports',
      label: 'Field Reports',
      icon: FileText,
      action: () => {
        setEditingReportId(null);
        openTab('reports', 'Field Reports');
      }
    },
    {
      id: 'evidence',
      label: 'Evidence Locker',
      icon: Archive,
      action: () => openTab('evidence', 'Evidence Locker')
    },
    {
      id: 'citizens',
      label: 'Citizen Index',
      icon: Users,
      action: () => openTab('citizens', 'Citizen Index')
    },
    {
      id: 'penal-codes',
      label: 'Penal Codes',
      icon: Scale,
      action: () => openTab('penal-codes', 'Penal Codes')
    },
    {
      id: 'activity-logs',
      label: 'Audit Logs',
      icon: ClipboardList,
      action: () => openTab('activity-logs', 'Audit Logs')
    }
  ];

  const navItems = allNavItems.filter(item => {
    if (isGovernment) {
      return !['cases', 'reports', 'evidence'].includes(item.id);
    }
    return true;
  });

  return (
    <div className="h-screen bg-[#07080b] text-slate-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-300 overflow-hidden">
      
      {/* 1. TOP SECURE INTEGRATION HEADER BAR */}
      <header className="bg-[#0b0c10] border-b border-[#14161f] shrink-0 sticky top-0 z-40 shadow-lg">
        <div className="px-5 py-3.5 flex items-center justify-between gap-3">
          
          {/* LSPD Emblem block */}
          <div className="flex items-center space-x-3 text-left">
            {/* Hamburger Button on mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800 rounded focus:outline-none cursor-pointer shrink-0"
              title="Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-xl font-black font-sans tracking-tight text-white select-none">Police</span>
              <img 
                src={lspdTacticalBadge} 
                alt="LSPD Seal" 
                className="w-5 h-5 object-cover rounded-full border border-sky-500/30" 
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* BRAND / DEVELOPMENT BADGE */}
          <div className="hidden lg:flex items-center space-x-2.5 bg-[#050508]/90 px-4 py-1.5 rounded-md border border-sky-950/40 text-xs font-mono tracking-wider shadow-[0_0_15px_rgba(14,165,233,0.05)]">
            <Terminal className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="text-slate-400 text-[10px] uppercase font-medium">
              Secure Terminal &bull; <span className="text-sky-400 font-extrabold hover:text-sky-300 transition-colors cursor-default tracking-widest">RCHCREATION</span>
            </span>
          </div>

          {/* ACTIVE ON-DUTY COUNT INDICATOR */}
          <div className="hidden md:flex items-center space-x-2.5 bg-[#050508]/90 px-3 py-1.5 rounded-md border border-emerald-950/30 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 text-[10px] uppercase font-medium">
              On-Duty: <span className="text-emerald-400 font-extrabold">{activeOnDutyCount} Active</span>
            </span>
          </div>

          {/* Right Active Officer Account widget */}
          <div className="flex items-center justify-end gap-3 font-mono text-xs">
            <div className="flex flex-col items-end text-right leading-none">
              <div className="flex items-center gap-1.5">
                {currentOfficer.division && (
                  <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.2 rounded text-[7.5px] font-bold tracking-wide uppercase">
                    {currentOfficer.division}
                  </span>
                )}
                <span className="text-xs font-black tracking-wide text-white font-sans">{currentOfficer.rank} {currentOfficer.name}</span>
              </div>
              <span className="text-[9.5px] text-slate-400 mt-1.5 font-mono">{tickerDate}, {tickerTime}</span>
            </div>
            
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-sky-400 shadow uppercase select-none">
                {currentOfficer.name[0]}
              </div>
              <span 
                className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-[#0b0c10] ${currentOfficer.onDuty ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} 
                title={currentOfficer.onDuty ? "Status: ON-DUTY (Aktif)" : "Status: OFF-DUTY (Tidak Aktif)"}
              ></span>
            </div>

            {/* Logout sign-off */}
            <button
              onClick={logoutOfficer}
              id="logout-btn"
              title="Keluar Tugas (10-42)"
              className="p-2.5 bg-[#050508] hover:bg-rose-950/40 border border-[#14161f] hover:border-rose-900 rounded text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER: Flex row for Left Sidebar and Right Main Content */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* MOBILE SIDEBAR OVERLAY DRAWER */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside 
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transform md:hidden transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile Sidebar Brand/Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-sky-405">MENU NAVIGASI</span>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-100 bg-slate-800 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links inside Mobile Drawer */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`mob-tab-${item.id}`}
                  onClick={() => {
                    item.action();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-md text-xs font-bold font-mono tracking-wider cursor-pointer border-l-2 transition-all ${
                    isActive
                      ? 'border-sky-505 text-sky-405 bg-slate-950 shadow shadow-sky-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.id === 'roster' && activeOnDutyCount > 0 && (
                    <span className="ml-auto flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-mono border border-emerald-500/20">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      <span>{activeOnDutyCount} ON DUTY</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile bottom panel */}
          <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
            {/* Language switch */}
            <div className="flex items-center justify-center space-x-2 text-slate-500 font-mono text-xs">
              <Globe className="w-4 h-4" />
              <button
                onClick={() => setLanguage('id')}
                className={`hover:text-slate-100 transition-colors cursor-pointer ${language === 'id' ? 'text-sky-405 font-bold' : ''}`}
              >
                ID
              </button>
              <span>/</span>
              <button
                onClick={() => setLanguage('en')}
                className={`hover:text-slate-100 transition-colors cursor-pointer ${language === 'en' ? 'text-sky-405 font-bold' : ''}`}
              >
                EN
              </button>
            </div>
            <p className="text-[9px] text-slate-650 text-center font-mono uppercase">LSPD DIGITAL RAIL</p>
          </div>
        </aside>


        {/* DESKTOP SIDEBAR (COLLAPSIBLE) */}
        <aside 
          className={`hidden md:flex md:flex-col shrink-0 bg-[#0b0c10] border-r border-[#14161f] transition-all duration-300 relative ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Navigation Links */}
          <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  onClick={item.action}
                  className={`w-full flex items-center py-2.5 rounded-md text-xs font-bold font-mono tracking-wider cursor-pointer transition-all group relative ${
                    isSidebarCollapsed ? 'justify-center px-0' : 'px-3 space-x-3'
                  } ${
                    isActive
                      ? 'bg-[#181a24] text-white border-l-2 border-sky-400 font-extrabold shadow shadow-sky-500/5'
                      : 'border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-sky-400 scale-105' : 'text-slate-450 group-hover:scale-105'}`} />
                  
                  {!isSidebarCollapsed && (
                    <span className="truncate whitespace-nowrap transition-opacity duration-300">
                      {item.label}
                    </span>
                  )}
                  {!isSidebarCollapsed && item.id === 'roster' && activeOnDutyCount > 0 && (
                    <span className="ml-auto flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}

                  {/* Tooltip on collapse */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-16 bg-slate-950 text-slate-200 text-[10px] font-mono border border-slate-800 px-2.5 py-1.5 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-lg shadow-black/40">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Collapsible toggle & lang footer */}
          <div className="p-3 border-t border-[#14161f] bg-[#050508]/60 flex flex-col space-y-3">
            {/* Collapsible Chevron Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="flex items-center justify-center p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-[#14161f] rounded cursor-pointer transition-colors"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Language selection */}
            {!isSidebarCollapsed && (
              <div className="flex items-center justify-center space-x-2 text-slate-500 font-mono text-[10.5px] pt-1">
                <Globe className="w-3.5 h-3.5" />
                <button
                  id="lang-toggle-id"
                  onClick={() => setLanguage('id')}
                  className={`hover:text-slate-100 transition-colors cursor-pointer ${language === 'id' ? 'text-sky-400 font-bold' : ''}`}
                >
                  ID
                </button>
                <span>/</span>
                <button
                  id="lang-toggle-en"
                  onClick={() => setLanguage('en')}
                  className={`hover:text-slate-100 transition-colors cursor-pointer ${language === 'en' ? 'text-sky-405 font-bold' : ''}`}
                >
                  EN
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT AREA: MAIN CONTENT CONTAINER */}
        <main className="flex-1 overflow-hidden bg-[#07080b] flex flex-col">
          
          {/* TAB SYSTEM NAVIGATION HEADER (Chrome-like) */}
          <div className="bg-[#0b0c10] border-b border-[#14161f] px-5 pt-3 pb-0 flex items-center space-x-1 select-none overflow-x-auto scrollbar-none shrink-0">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              const item = navItems.find(n => n.id === t.id);
              const Icon = item?.icon || FileText;
              return (
                <div
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-t-md text-xs font-mono font-bold cursor-pointer transition-all border-t-2 ${
                    isActive
                      ? 'bg-[#07080b] text-white border-sky-400 border-x border-[#14161f] -mb-[1px] pb-[10px] z-10'
                      : 'bg-transparent text-slate-450 border-transparent hover:bg-slate-900/30 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => closeTab(t.id, e)}
                      className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
            
            <button
              onClick={() => {
                setEditingReportId(null);
                openTab('reports', 'Field Reports');
              }}
              className="p-1 hover:bg-slate-900 border border-dashed border-slate-800 hover:border-slate-700 rounded text-slate-500 hover:text-slate-300 cursor-pointer transition-colors mb-1 ml-2"
              title="Buat Laporan Baru"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SCROLLABLE INNER CONTENT */}
          <div className="w-full flex-1 overflow-y-auto px-5 py-6 flex flex-col">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  setActiveTab={setActiveTab} 
                  setSelectedCitizenId={setSelectedCitizenId} 
                  setEditingReportId={setEditingReportId}
                />
              )}

              {activeTab === 'performance' && (
                <PerformanceBoard />
              )}

              {activeTab === 'citizens' && (
                <Citizens 
                  selectedId={selectedCitizenId} 
                  setSelectedId={setSelectedCitizenId} 
                  setEditingReportId={setEditingReportId}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'cases' && (
                <CasesArchive 
                  setActiveTab={setActiveTab} 
                  setEditingReportId={setEditingReportId}
                  setSelectedCitizenId={setSelectedCitizenId}
                />
              )}

              {activeTab === 'vehicles' && (
                <Vehicles 
                  setSelectedCitizenId={setSelectedCitizenId} 
                  setActiveTab={setActiveTab} 
                />
              )}

              {activeTab === 'reports' && (
                <Reports 
                  setActiveTab={setActiveTab} 
                  editingReportId={editingReportId}
                  setEditingReportId={setEditingReportId}
                />
              )}

              {activeTab === 'penal-codes' && (
                <PenalCodeEditor />
              )}

              {activeTab === 'roster' && (
                <OfficerRoster />
              )}

              {activeTab === 'evidence' && (
                <EvidenceManagement />
              )}

              {activeTab === 'activity-logs' && (
                <ActivityLogView />
              )}
            </motion.div>
          </div>

          {/* 4. FOOTER REGULATORY NOTATIONAL CREDIT */}
          <footer className="bg-[#0b0c10] border-t border-[#14161f] shrink-0 py-3.5 text-center">
            <div className="max-w-7xl mx-auto px-6 text-[10.5px] font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>SISTEM INFORMASI DATA TERPADU KEPOLISIAN</span>
              <span>© 2026 DEPT IT LSPD INDONESIA &bull; SYSTEM POWERED BY <span className="text-sky-400 font-extrabold tracking-widest uppercase hover:text-sky-300 transition-colors">RCHCREATION</span> &bull; ALL SYSTEM LOGS SECURED</span>
            </div>
          </footer>
        </main>

      </div>

    </div>
  );
};

export default function App() {
  return (
    <MdtProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </MdtProvider>
  );
}
