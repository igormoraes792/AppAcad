import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Smartphone, Download, Check } from 'lucide-react';

export const InstallPromptModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Verifica se já está rodando como PWA instalado (Standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    // 2. Verifica se o usuário já fechou nesta sessão
    const dismissed = sessionStorage.getItem('pwa_install_dismissed');
    if (dismissed === 'true') {
      return;
    }

    // 3. Detecta se é iOS (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Captura evento de instalação do Chrome / Android
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 5. Detecta se foi instalado com sucesso
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setIsOpen(false);
    });

    // Para iOS ou navegadores móveis, abre o prompt após 1.2 segundos para não colidir com o carregamento inicial
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1200);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('pwa_install_dismissed', 'true');
    setIsOpen(false);
  };

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setIsOpen(false);
    }
    setDeferredPrompt(null);
  };

  if (!isOpen || installed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 pb-safe shadow-2xl space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-white">Instalar FitTrack PRO</h3>
                <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                  App PWA
                </span>
              </div>
              <p className="text-xs text-zinc-400">Instale na tela de início para acesso rápido</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informações de Vantagens */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>Tela cheia sem barras de navegação do navegador</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>Acesso instantâneo como um aplicativo da App Store</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>Sincronização contínua de treinos e cargas</span>
          </div>
        </div>

        {/* Passos para iOS Safari */}
        {isIOS ? (
          <div className="space-y-3 bg-purple-950/20 border border-purple-500/30 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Como adicionar no iPhone:</span>
            </h4>

            <ol className="space-y-3 text-xs text-zinc-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  No Safari, toque no botão{' '}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-800 rounded font-semibold text-white text-[11px]">
                    <Share className="w-3.5 h-3.5 text-blue-400 inline" /> Compartilhar
                  </span>{' '}
                  na barra inferior.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  Role as opções e toque em{' '}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-800 rounded font-semibold text-white text-[11px]">
                    <PlusSquare className="w-3.5 h-3.5 text-purple-400 inline" /> Adicionar à Tela de Início
                  </span>
                  .
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  Toque em <span className="font-bold text-white">"Adicionar"</span> no canto superior direito para concluir.
                </div>
              </li>
            </ol>
          </div>
        ) : (
          /* Android / Chrome */
          <div className="space-y-3">
            {deferredPrompt ? (
              <button
                onClick={handleNativeInstall}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/30 text-xs flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Aplicativo Agora</span>
              </button>
            ) : (
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 text-xs text-zinc-300 space-y-1.5">
                <p className="font-semibold text-white">Como instalar no seu navegador:</p>
                <p>
                  Toque no menu do navegador (três pontinhos <span className="font-bold text-white">⋮</span>) e selecione{' '}
                  <span className="font-bold text-purple-400">"Instalar aplicativo"</span> ou{' '}
                  <span className="font-bold text-purple-400">"Adicionar à tela inicial"</span>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botão de Fechar / Continuar */}
        <button
          onClick={handleDismiss}
          className="w-full py-2.5 text-center text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          Continuar no navegador
        </button>
      </div>
    </div>
  );
};
