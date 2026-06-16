import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import AIBuilder from "@/pages/ai-builder";
import FileManager from "@/pages/file-manager";
import Permissions from "@/pages/permissions";
import GithubDeploy from "@/pages/github-deploy";
import AIAssistant from "@/pages/ai-assistant";
import { cn } from "@/lib/utils";
import {
  Bot, Cpu, FolderOpen, Shield, Github, Menu, X,
  LayoutDashboard, Zap, Radio, Eye, BrainCircuit,
} from "lucide-react";
import { useGetBotStatus } from "@workspace/api-client-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

type Page = "dashboard" | "ai-builder" | "file-manager" | "permissions" | "github" | "ai-assistant";

const NAV_ITEMS: { id: Page; label: string; labelAr: string; icon: React.ReactNode }[] = [
  { id: "dashboard",     label: "Dashboard",    labelAr: "لوحة التحكم",     icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "ai-assistant",  label: "AI Dev",       labelAr: "مساعد المطور",    icon: <BrainCircuit className="h-4 w-4" /> },
  { id: "ai-builder",    label: "Commands",     labelAr: "بناء الأوامر",    icon: <Cpu className="h-4 w-4" /> },
  { id: "file-manager",  label: "Files",        labelAr: "الملفات",         icon: <FolderOpen className="h-4 w-4" /> },
  { id: "permissions",   label: "Permissions",  labelAr: "الصلاحيات",       icon: <Shield className="h-4 w-4" /> },
  { id: "github",        label: "Deploy",       labelAr: "GitHub نشر",      icon: <Github className="h-4 w-4" /> },
];

function StatusDot({ online }: { online: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {online && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
      )}
      <span className={cn(
        "relative inline-flex rounded-full h-2.5 w-2.5 border",
        online ? "bg-green-400 border-green-400/50" : "bg-zinc-600 border-zinc-500"
      )} />
    </span>
  );
}

function PageContent({ page }: { page: Page }) {
  switch (page) {
    case "dashboard":    return <Dashboard />;
    case "ai-assistant": return <AIAssistant />;
    case "ai-builder":   return <AIBuilder />;
    case "file-manager": return <FileManager />;
    case "permissions":  return <Permissions />;
    case "github":       return <GithubDeploy />;
  }
}

function AppShell() {
  const [page, setPage]               = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime]               = useState(new Date());

  const { data: status } = useGetBotStatus({ query: { refetchInterval: 6000 } });
  const isOnline = !!status?.online;

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={cn(
        "fixed top-0 right-0 h-full w-64 z-40 flex flex-col transition-transform duration-300",
        "lg:static lg:translate-x-0",
        "border-l border-white/5",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )} style={{
        background: "linear-gradient(180deg, #050f1a 0%, #010d1a 40%, #020810 100%)"
      }}>

        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            {/* Kaneki eye icon */}
            <div className="kaneki-glow h-10 w-10 rounded-full border border-primary/60 bg-black flex items-center justify-center shrink-0">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold font-mono tracking-tight text-white truncate">
                ヽ.KANEKI ぐ愛
              </p>
              <p className="text-[10px] text-primary/60 font-mono">Control Panel v3</p>
            </div>
            <button
              className="lg:hidden text-zinc-500 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Bot status row */}
          <div className="mt-3 flex items-center gap-2 px-1">
            <StatusDot online={isOnline} />
            <span className={cn(
              "text-[11px] font-mono",
              isOnline ? "text-green-400" : "text-zinc-500"
            )}>
              {isOnline ? "البوت متصل" : "غير متصل"}
            </span>
            <span className="mr-auto text-[10px] font-mono text-zinc-600">{timeStr}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-right",
                  "font-mono relative overflow-hidden",
                  active
                    ? "bg-primary/10 text-white border border-primary/40"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200 border border-transparent"
                )}
              >
                {/* Active indicator */}
                {active && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-l" />
                )}
                <span className={cn(
                  "shrink-0 p-1.5 rounded-md transition-colors",
                  active ? "bg-primary/20 text-primary" : "bg-white/5 text-zinc-500"
                )}>
                  {item.icon}
                </span>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xs uppercase tracking-wider">{item.label}</span>
                  <span className="text-[10px] mt-0.5 opacity-50">{item.labelAr}</span>
                </div>
                {item.id === "ai-assistant" && (
                  <span className="mr-auto text-[8px] bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded font-mono">NEW</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-white/5 space-y-2">
          {/* Uptime pill */}
          {status && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/5 border border-white/5">
              <Radio className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[10px] font-mono text-zinc-400">
                uptime&nbsp;
                {String(Math.floor(status.uptime / 3600)).padStart(2, "0")}h&nbsp;
                {String(Math.floor((status.uptime % 3600) / 60)).padStart(2, "0")}m
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 px-1">
            <Zap className="h-3 w-3 text-primary/40" />
            <span className="text-[10px] font-mono text-zinc-600">
              Kaneki Bot © 2025
            </span>
          </div>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-20 h-14 border-b border-white/5 flex items-center px-4 gap-3"
          style={{ background: "rgba(2,8,18,0.88)", backdropFilter: "blur(16px)" }}>
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Page title */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-primary shrink-0">
              {NAV_ITEMS.find(n => n.id === page)?.icon}
            </span>
            <span className="text-sm font-mono font-medium truncate text-zinc-100">
              {NAV_ITEMS.find(n => n.id === page)?.labelAr}
            </span>
          </div>

          {/* Right side: status + mobile tabs */}
          <div className="mr-auto flex items-center gap-3">
            {/* Online pill */}
            <div className={cn(
              "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border",
              isOnline
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-zinc-800/50 border-zinc-700 text-zinc-500"
            )}>
              <StatusDot online={isOnline} />
              {isOnline ? "ONLINE" : "OFFLINE"}
            </div>

            {/* Mobile quick nav */}
            <div className="flex lg:hidden gap-0.5">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    page === item.id
                      ? "text-primary bg-primary/10"
                      : "text-zinc-500 hover:text-zinc-200"
                  )}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl w-full mx-auto">
          <PageContent page={page} />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppShell />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
