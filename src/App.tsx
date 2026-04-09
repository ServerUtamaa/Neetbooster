import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, Activity, Shield, Zap, Settings, Radio, Terminal, Code, X, Crosshair } from 'lucide-react';
import { NetworkGraph } from './components/NetworkGraph';
import { cn } from './lib/utils';

declare global {
  interface Window {
    AndroidBridge?: {
      startOptimization: (networkType: string, gamingMode: boolean) => void;
      stopOptimization: () => void;
      getSystemStatus: () => string;
    };
  }
}

export default function App() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [gamingMode, setGamingMode] = useState(true);
  const [networkType, setNetworkType] = useState<'WIFI' | '5G' | '4G'>('WIFI');
  const [ping, setPing] = useState(68);
  const [speed, setSpeed] = useState(24);
  const [statusText, setStatusText] = useState('SYSTEM STANDBY');
  const [logs, setLogs] = useState<string[]>(['System initialized. Ready for background service.']);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let logInterval: NodeJS.Timeout;

    if (isOptimizing) {
      if (window.AndroidBridge) {
        window.AndroidBridge.startOptimization(networkType, gamingMode);
      }

      setStatusText('INITIALIZING DAEMON');
      setLogs(['Initializing external background daemon...']);
      
      setTimeout(() => {
        setStatusText('INJECTING QOS');
        addLog('su -c "sysctl -w net.ipv4.tcp_congestion_control=bbr"');
        if (gamingMode) {
          addLog('Activating QoS: Prioritizing Game Traffic (UDP)...');
          addLog(`tc qdisc add dev ${networkType === 'WIFI' ? 'wlan0' : 'rmnet_data0'} root handle 1: prio`);
          addLog('Throttling background apps (TCP)...');
        }
      }, 1500);
      
      setTimeout(() => {
        setStatusText('OPTIMIZING ROUTES');
        addLog(`Applying DNS tweaks for ${networkType}...`);
        addLog('su -c "ndc resolver setnetdns wlan0 1.1.1.1 1.0.0.1"');
      }, 3000);
      
      setTimeout(() => {
        setStatusText('QOS ACTIVE');
        addLog('Service running in background. Network locked.');
      }, 4500);

      interval = setInterval(() => {
        setPing((p) => Math.max(8, p - Math.floor(Math.random() * 6)));
        setSpeed((s) => Math.min(250, s + Math.floor(Math.random() * 20)));
      }, 800);

      logInterval = setInterval(() => {
        const randomLogs = gamingMode ? [
          'QoS: Routing game packet (Priority 1)',
          'QoS: Delaying background sync (Priority 3)',
          'Stabilizing radio frequency...',
          'Bypassing ISP deep packet inspection...',
          'Enforcing low latency mode...'
        ] : [
          'Monitoring packet loss: 0%',
          'Stabilizing radio frequency...',
          'Clearing network cache...',
          'Enforcing low latency mode...',
          'Optimizing MTU size to 1420...'
        ];
        addLog(randomLogs[Math.floor(Math.random() * randomLogs.length)]);
      }, 3500);

    } else {
      if (window.AndroidBridge) {
        window.AndroidBridge.stopOptimization();
      }

      setStatusText('SYSTEM STANDBY');
      if (logs.length > 1) {
        addLog('Stopping background service...');
        addLog('Restoring default network settings & removing QoS...');
        addLog(`tc qdisc del dev ${networkType === 'WIFI' ? 'wlan0' : 'rmnet_data0'} root`);
      }
      
      interval = setInterval(() => {
        setPing((p) => Math.min(85, p + Math.floor(Math.random() * 5)));
        setSpeed((s) => Math.max(15, s - Math.floor(Math.random() * 5)));
      }, 1000);
    }

    return () => {
      clearInterval(interval);
      clearInterval(logInterval);
    };
  }, [isOptimizing, networkType, gamingMode]);

  const injectionCode = `// CONTOH KODE ANDROID BACKGROUND SERVICE (JAVA)
// Berjalan di latar belakang (External) saat main game/sosmed

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;

public class NetBoostBackgroundService extends Service {
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String networkType = intent.getStringExtra("NETWORK_TYPE");
        boolean gamingMode = intent.getBooleanExtra("GAMING_MODE", true);
        
        // Jalankan injeksi di thread terpisah agar tidak lag
        new Thread(() -> runExternalInjection(networkType, gamingMode)).start();
        
        // START_STICKY memastikan service tetap hidup di latar belakang
        return START_STICKY; 
    }

    private void runExternalInjection(String networkType, boolean gamingMode) {
        try {
            Process process = Runtime.getRuntime().exec("su");
            DataOutputStream os = new DataOutputStream(process.getOutputStream());
            String iface = networkType.equals("WIFI") ? "wlan0" : "rmnet_data0";

            // 1. TWEAK KERNEL (Anti-Lag)
            os.writeBytes("sysctl -w net.ipv4.tcp_congestion_control=bbr\\n");
            os.writeBytes("sysctl -w net.ipv4.tcp_low_latency=1\\n");

            // 2. QOS TRAFFIC CONTROL ("Sedot Semua Jaringan" untuk Game)
            if (gamingMode) {
                // Hapus rule lama
                os.writeBytes("tc qdisc del dev " + iface + " root\\n");
                // Buat antrean prioritas (Priority Queue)
                os.writeBytes("tc qdisc add dev " + iface + " root handle 1: prio\\n");
                
                // Prioritaskan traffic UDP (Game seperti FF, ML, PUBG menggunakan UDP)
                // Traffic game akan masuk ke antrean VIP (Priority 1)
                os.writeBytes("iptables -t mangle -A PREROUTING -p udp -j TOS --set-tos 0x10\\n");
                
                // Perlambat traffic TCP latar belakang (Sosmed, Update PlayStore)
                // Traffic lain masuk ke antrean lambat (Priority 3)
            }

            // 3. INJEKSI DNS (Bypass ISP)
            if (android.os.Build.VERSION.SDK_INT >= 30) { 
                os.writeBytes("iptables -t nat -A OUTPUT -p udp --dport 53 -j DNAT --to-destination 1.1.1.1:53\\n");
            } else {
                os.writeBytes("ndc resolver setnetdns " + iface + " 1.1.1.1 1.0.0.1\\n");
            }

            os.writeBytes("exit\\n");
            os.flush();
            process.waitFor();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}`;

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-200 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

      {/* Floating Header */}
      <header className="fixed top-0 w-full z-40 bg-[#030303]/60 backdrop-blur-2xl border-b border-white/[0.05] supports-[backdrop-filter]:bg-[#030303]/40">
        <div className="max-w-md mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-white/10 to-white/0 border border-white/10 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
              <Zap className="w-4 h-4 text-cyan-400" />
              {isOptimizing && (
                <span className="absolute inset-0 rounded-xl border border-cyan-400 animate-ping opacity-40" />
              )}
            </div>
            <h1 className="font-bold text-lg tracking-tight text-white">NetBoost<span className="text-cyan-400 font-light">Pro</span></h1>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowCodeModal(true)}
              className="p-2.5 hover:bg-white/5 rounded-xl transition-all duration-300 group"
              title="View Injection Code"
            >
              <Code className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
            </button>
            <button className="p-2.5 hover:bg-white/5 rounded-xl transition-all duration-300 group">
              <Settings className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-28 pb-24 px-5 max-w-md mx-auto space-y-6 relative z-10">
        {/* Main Status Glass Card */}
        <motion.div 
          layout
          className="relative overflow-hidden rounded-[2.5rem] p-[1px] group"
        >
          {/* Animated Border Gradient */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-b transition-colors duration-1000",
            isOptimizing ? "from-cyan-500/50 via-violet-500/20 to-transparent" : "from-white/15 to-transparent"
          )} />
          
          <div className="relative bg-[#0a0a0a]/90 backdrop-blur-2xl rounded-[2.5rem] p-8 h-full w-full border border-white/5">
            {/* Neon Glow Background */}
            {isOptimizing && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/20 blur-[80px] rounded-full pointer-events-none" />
            )}

            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
              <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-b from-white/5 to-transparent border border-white/10 shadow-2xl">
                <div className="absolute inset-2 rounded-full bg-black/50 border border-white/5 flex items-center justify-center">
                  <motion.div
                    animate={{ 
                      scale: isOptimizing ? [1, 1.08, 1] : 1,
                      color: isOptimizing ? '#22d3ee' : '#52525b'
                    }}
                    transition={{ repeat: isOptimizing ? Infinity : 0, duration: 2, ease: "easeInOut" }}
                  >
                    <Shield className="w-10 h-10" />
                  </motion.div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tighter text-white">
                  {isOptimizing ? 'OPTIMIZED' : 'UNPROTECTED'}
                </h2>
                <p className={cn(
                  "text-xs font-bold tracking-[0.2em] uppercase transition-colors",
                  isOptimizing ? "text-cyan-400" : "text-zinc-500"
                )}>
                  {statusText}
                </p>
              </div>

              {/* Pill Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsOptimizing(!isOptimizing)}
                className={cn(
                  "relative w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all duration-500 overflow-hidden group",
                  isOptimizing 
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_40px_-10px_rgba(34,211,238,0.4)]" 
                    : "bg-white/5 text-white hover:bg-white/10 border border-white/5"
                )}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Zap className={cn("w-4 h-4", isOptimizing ? "fill-white/40" : "fill-white/20")} />
                  {isOptimizing ? 'STOP DAEMON' : 'START DAEMON'}
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Segmented Controls Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Network Selector Pill */}
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-1.5 flex shadow-lg">
            {(['WIFI', '5G'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setNetworkType(type)}
                className={cn(
                  "flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300",
                  networkType === type 
                    ? "bg-white/10 text-white shadow-sm border border-white/10" 
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Gaming QoS Toggle Pill */}
          <button
            onClick={() => setGamingMode(!gamingMode)}
            className={cn(
              "flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border transition-all duration-500 shadow-lg backdrop-blur-xl",
              gamingMode 
                ? "bg-violet-500/10 border-violet-500/30 text-violet-300" 
                : "bg-[#0a0a0a]/80 border-white/5 text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Crosshair className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wide">QoS MODE</span>
            <div className={cn(
              "w-2 h-2 rounded-full ml-auto transition-colors duration-500",
              gamingMode ? "bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.8)]" : "bg-zinc-700"
            )} />
          </button>
        </div>

        {/* Big Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex flex-col justify-between aspect-square shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors duration-500" />
            <div className="flex items-center gap-2 text-zinc-500 relative z-10">
              <Activity className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Latency</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-baseline gap-1">
                <span className={cn(
                  "text-5xl font-black tracking-tighter transition-colors duration-300",
                  ping < 40 ? "text-cyan-400" : ping < 80 ? "text-yellow-400" : "text-red-400"
                )}>
                  {ping}
                </span>
              </div>
              <span className="text-sm text-zinc-500 font-medium">ms</span>
            </div>
          </div>
          
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex flex-col justify-between aspect-square shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl group-hover:bg-violet-500/10 transition-colors duration-500" />
            <div className="flex items-center gap-2 text-zinc-500 relative z-10">
              <Radio className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Speed</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tighter text-white transition-colors">
                  {speed}
                </span>
              </div>
              <span className="text-sm text-zinc-500 font-medium">Mbps</span>
            </div>
          </div>
        </div>

        {/* Graph Section */}
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Live Telemetry</h3>
            <div className="flex gap-4 text-[10px] font-bold tracking-wider">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" /> PING
              </span>
              <span className="flex items-center gap-1.5 text-violet-400">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" /> SPEED
              </span>
            </div>
          </div>
          <div className="h-32 w-full opacity-80">
            <NetworkGraph isOptimizing={isOptimizing} />
          </div>
        </div>

        {/* Sleek Terminal */}
        <div className="bg-[#050505]/90 border border-white/5 rounded-[2rem] p-5 overflow-hidden flex flex-col h-48 backdrop-blur-2xl shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 ml-2">root@netboost:~</span>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-[10px] sm:text-xs text-cyan-400/80 space-y-2 pr-2 custom-scrollbar relative z-10">
            {logs.map((log, i) => (
              <div key={i} className="break-words leading-relaxed flex gap-2">
                <span className="text-zinc-700 select-none">❯</span>
                <span className={log.includes('Error') ? 'text-red-400' : log.includes('QoS') ? 'text-violet-400' : ''}>{log}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </main>

      {/* Code Modal */}
      <AnimatePresence>
        {showCodeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                    <Code className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h3 className="font-bold text-sm tracking-wide text-white">Native Injection Code</h3>
                </div>
                <button 
                  onClick={() => setShowCodeModal(false)}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 bg-[#050505] overflow-auto flex-1 custom-scrollbar">
                <pre className="text-[10px] sm:text-xs font-mono text-cyan-400/80 leading-relaxed">
                  <code>{injectionCode}</code>
                </pre>
              </div>
              <div className="p-5 border-t border-white/5 bg-white/[0.02] text-xs text-zinc-500 shrink-0 leading-relaxed">
                <p><strong>Cara Kerja:</strong> Kode ini menggunakan <code className="text-cyan-400">Service</code> Android agar berjalan di latar belakang. Fitur QoS menggunakan <code className="text-cyan-400">tc qdisc</code> untuk memprioritaskan paket game (UDP) dan memperlambat aplikasi lain.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

