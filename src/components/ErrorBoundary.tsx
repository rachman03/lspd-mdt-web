import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside MDT application:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetData = () => {
    if (window.confirm('Apakah Anda yakin ingin menyetel ulang seluruh data lokal MDT? Tindakan ini akan mengembalikan semua data ke pengaturan default.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-mono selection:bg-red-500/30 selection:text-red-200">
          <div className="max-w-2xl w-full bg-slate-900 border-2 border-red-900/60 rounded-xl p-6 md:p-8 shadow-2xl shadow-red-950/20 relative overflow-hidden">
            {/* Tech scanner lines or glowing background */}
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-red-500/5 to-transparent pointer-events-none"></div>
            
            <div className="flex items-center space-x-4 border-b border-red-950/80 pb-4 mb-6">
              <div className="p-3 bg-red-950/60 border border-red-900/50 text-red-500 rounded-lg animate-pulse">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-widest text-red-500 uppercase">
                  CRITICAL CORE DIAGNOSTIC FAILURE
                </h1>
                <p className="text-[11px] text-slate-405 text-slate-400 mt-1 uppercase">
                  LSPD MDT SECURE MAIN SYSTEM • FAULT DETECTED
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-350 leading-relaxed text-slate-300">
                Sistem mendeteksi adanya kegagalan rendering atau kesalahan runtime pada memori aplikasi. Kemungkinan besar disebabkan oleh sinkronisasi data lokal (<span className="text-sky-400">localStorage</span>) yang tidak valid atau kedaluwarsa.
              </p>

              <div className="bg-slate-950 border border-red-955 border-red-900/40 rounded p-4 text-[11px] text-red-400 overflow-x-auto max-h-48 custom-scrollbar">
                <div className="flex items-center gap-1.5 font-bold mb-1 border-b border-red-950/60 pb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>ERROR_STAMP_ID: {this.state.error?.name || 'RuntimeError'}</span>
                </div>
                <p className="font-bold">{this.state.error?.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-[9.5px] text-slate-500 leading-normal font-mono whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                )}
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-300">Rekomendasi Tindakan Pemulihan:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 mt-1">
                  <li>Coba muat ulang halaman terlebih dahulu (<span className="text-sky-400">Refresh</span>).</li>
                  <li>Jika kesalahan tetap berlanjut, lakukan reset data untuk menghapus konfigurasi lokal yang rusak (<span className="text-amber-500">Reset Data</span>).</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={this.handleReload}
                  className="w-full sm:w-auto px-5 py-2.5 bg-sky-950 hover:bg-sky-900 text-sky-400 border border-sky-850 hover:border-sky-700 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>MUAT ULANG SISTEM (REFRESH)</span>
                </button>
                
                <button
                  onClick={this.handleResetData}
                  className="w-full sm:w-auto px-5 py-2.5 bg-red-950/50 hover:bg-red-950 text-red-400 border border-red-900/60 hover:border-red-600 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>RESET SELURUH DATA LOKAL</span>
                </button>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-850/60 pt-3 text-[9px] text-slate-500 flex justify-between uppercase">
              <span>Security Auth System: SAN ANDREAS STATE</span>
              <span>LSPD MDT CORE v3.5</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
