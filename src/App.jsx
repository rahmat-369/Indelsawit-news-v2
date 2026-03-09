import { useEffect, useState, useRef } from "react";
import { Menu, X, Filter, User, ExternalLink, Github, Send, Instagram, PlayCircle, MessageCircle, CheckCircle2 } from "lucide-react";

export default function App() {
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [loadingAi, setLoadingAi] = useState({});
  const [cooldownRemaining, setCooldownRemaining] = useState({});
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const intervalRef = useRef(null);

  // Fungsi untuk menjalankan timer cooldown
  const startCooldownTimer = (title, initialTime) => {
    setCooldownRemaining(prev => ({ ...prev, [title]: initialTime }));
    const timer = setInterval(() => {
      setCooldownRemaining(prev => {
        const current = prev[title];
        if (current <= 1) {
          clearInterval(timer);
          return { ...prev, [title]: 0 };
        }
        return { ...prev, [title]: current - 1 };
      });
    }, 1000);
  };

  const fetchNews = async () => {
    const APIS = [
      { name: 'CNBC', url: 'https://api.nexray.web.id/berita/cnbcindonesia' },
      { name: 'CNN', url: 'https://api.nexray.web.id/berita/cnn' },
      { name: 'Kompas', url: 'https://api.nexray.web.id/berita/kompas' },
      { name: 'Sindo', url: 'https://api.nexray.web.id/berita/sindonews' },
      { name: 'Suara', url: 'https://api.nexray.web.id/berita/suara' }
    ];

    try {
      const fetchPromises = APIS.map(async (api) => {
        try {
          const res = await fetch(api.url);
          const data = await res.json();
          return (data.result || []).map((item) => ({
            title: item.title || 'Tanpa Judul',
            link: item.link || '#',
            image: item.image || item.image_thumbnail || item.imageUrl || 'https://via.placeholder.com/500x300?text=No+Image',
            source: api.name,
            time: item.date || item.timestamp || item.time || 'Baru saja',
          }));
        } catch (err) { return []; }
      });

      const allResults = await Promise.all(fetchPromises);
      // Diacak biar fresh
      const mergedNews = allResults.flat().sort(() => Math.random() - 0.5);
      
      setNews(mergedNews);
      setActiveFilter((currentFilter) => {
        if (currentFilter === "Semua") {
          setFilteredNews(mergedNews);
        } else {
          setFilteredNews(mergedNews.filter(item => item.source === currentFilter));
        }
        return currentFilter;
      });
    } catch (error) {
      console.error('Gagal memuat berita terkini');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    
    // --- SISTEM LOCALSTORAGE ANTI-REFRESH (Pake Judul Berita) ---
    const savedCooldowns = JSON.parse(localStorage.getItem('indosawit_cooldowns') || '{}');
    const savedSummaries = JSON.parse(localStorage.getItem('indosawit_summaries') || '{}');
    
    // Pulihkan ringkasan yang udah pernah diklik
    setSummary(savedSummaries);

    const now = Date.now();
    Object.keys(savedCooldowns).forEach(title => {
      const timeLeft = Math.ceil((savedCooldowns[title] - now) / 1000);
      if (timeLeft > 0) {
        startCooldownTimer(title, timeLeft);
      }
    });

    // Auto update 5 Menit
    intervalRef.current = setInterval(fetchNews, 300000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleFilter = (source) => {
    setActiveFilter(source);
    if (source === "Semua") {
      setFilteredNews(news);
    } else {
      setFilteredNews(news.filter(item => item.source === source));
    }
  };

  const handleAiSummary = async (title) => {
    // Cek berdasarkan judul berita, bukan index
    if (summary[title] || loadingAi[title] || cooldownRemaining[title] > 0) return;
    
    setLoadingAi(prev => ({ ...prev, [title]: true }));
    try {
      const prompt = `Analisis mendalam 1 paragraf utuh (sekitar 3-4 kalimat) yang padat, jelas, dan informatif: ${title}`;
      const res = await fetch(`https://api.nexray.web.id/ai/gpt-3.5-turbo?text=${encodeURIComponent(prompt)}`);
      const data = await res.json();
      
      // Simpan hasil ke state & LocalStorage biar gak ilang pas refresh
      setSummary(prev => {
        const newSummary = { ...prev, [title]: data.result };
        localStorage.setItem('indosawit_summaries', JSON.stringify(newSummary));
        return newSummary;
      });
      
      // Simpan Cooldown 20 Detik ke LocalStorage
      const expiry = Date.now() + 20000;
      const currentSaved = JSON.parse(localStorage.getItem('indosawit_cooldowns') || '{}');
      currentSaved[title] = expiry;
      localStorage.setItem('indosawit_cooldowns', JSON.stringify(currentSaved));

      startCooldownTimer(title, 20);

    } catch (err) {
      setSummary(prev => ({ ...prev, [title]: "Gagal memproses analisis AI." }));
    } finally {
      setLoadingAi(prev => ({ ...prev, [title]: false }));
    }
  };

  const scrollToDevInfo = () => {
    setIsMenuOpen(false);
    window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans transition-colors duration-500 text-white bg-[#050705]">
      
      {/* Header Glassmorphism */}
      <nav className="sticky top-4 z-50 p-5 rounded-[28px] flex justify-between items-center mb-8 bg-white/[0.03] backdrop-blur-xl border border-white/5 shadow-2xl">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter flex items-center gap-1">
            <span className="text-white">Indo</span>
            <span className="text-green-500">Sawi</span>
            <div className="relative inline-flex items-center justify-center w-8 h-8 -ml-1 -mt-1">
              <div className="absolute inset-0 bg-orange-500 opacity-50 blur-[10px] rounded-full animate-pulse"></div>
              <img src="https://j.top4top.io/p_37192jn0n0.png" alt="logo" className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            </div>
            <span className="text-gray-500">.news</span>
          </h1>
        </div>

        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-white bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition">
          {isMenuOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>

        <div className="hidden md:flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-green-400 uppercase tracking-widest">
             <CheckCircle2 size={14}/> Server Optimal
          </div>
          <button onClick={scrollToDevInfo} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest transition border border-white/5">
            <User size={14}/> Info Dev
          </button>
        </div>
      </nav>

      {/* Mobile Menu Premium */}
      {isMenuOpen && (
        <div className="md:hidden glass-card rounded-3xl p-6 mb-6 animate-in slide-in-from-top duration-300 border border-white/5 bg-white/[0.02] backdrop-blur-xl">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
            <h3 className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Navigasi Profil</h3>
            <span className="flex items-center gap-1 text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><CheckCircle2 size={10}/> Server Optimal</span>
          </div>
          
          <div className="flex flex-col items-center mb-6">
             <img src="https://res.cloudinary.com/dwiozm4vz/image/upload/v1772959730/ootglrvfmykn6xsto7rq.png" alt="Avatar" className="w-16 h-16 rounded-full border border-white/10 object-cover shadow-lg mb-2" />
             <h2 className="text-sm font-black tracking-tight text-white">Rahmat</h2>
             <p className="text-[10px] text-blue-400 font-mono font-bold">@R_hmt ofc</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
             <div className="grid grid-cols-4 gap-2">
                <a href="https://github.com/rahmat-369" className="flex justify-center p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-white"><Github size={16}/></a>
                <a href="https://t.me/rAi_engine" className="flex justify-center p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-[#3b82f6]"><Send size={16}/></a>
                <a href="#" className="flex justify-center p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-[#ec4899]"><Instagram size={16}/></a>
                <a href="#" className="flex justify-center p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-white"><PlayCircle size={16}/></a>
             </div>
             <a href="https://whatsapp.com/channel/0029VbBjyjlJ93wa6hwSWa0p" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366]/10 px-4 py-3 rounded-2xl text-[10px] font-bold text-[#25D366] border border-[#25D366]/20">
               <MessageCircle size={16} /> Join WhatsApp Channel
             </a>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar mb-4 items-center">
        <Filter size={16} className="text-gray-500 shrink-0 ml-2"/>
        {["Semua", "CNBC", "CNN", "Kompas", "Sindo", "Suara"].map((source) => (
          <button
            key={source}
            onClick={() => handleFilter(source)}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${
              activeFilter === source 
              ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
              : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
            }`}
          >
            {source}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Berita Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => <div key={i} className="h-72 bg-white/[0.02] border border-white/5 rounded-[32px] animate-pulse"></div>)
          ) : filteredNews.length > 0 ? (
            filteredNews.map((item, i) => (
              <div key={i} className="bg-white/[0.02] backdrop-blur-xl rounded-[32px] overflow-hidden group hover:border-blue-500/30 transition-all duration-500 flex flex-col border border-white/5 shadow-xl">
                <div className="relative h-48 overflow-hidden">
                  <img src={item.image} alt="Thumbnail" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050705] to-transparent"></div>
                  <span className="absolute top-4 left-4 text-[9px] bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-blue-400 font-bold uppercase tracking-[0.2em] border border-blue-500/20 shadow-lg">
                    {item.source}
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold leading-tight group-hover:text-blue-400 transition-colors duration-300">{item.title}</h3>
                    <p className="text-[10px] text-gray-500 mt-3 font-mono opacity-60">{item.time}</p>
                  </div>
                  
                  <div className="mt-5 pt-5 border-t border-white/5">
                    {!summary[item.title] ? (
                      <div className="flex justify-between items-center">
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-blue-400 font-bold flex items-center gap-1 transition-all">
                          BACA FULL <ExternalLink size={10}/>
                        </a>
                        <button 
                          onClick={() => handleAiSummary(item.title)}
                          disabled={loadingAi[item.title] || cooldownRemaining[item.title] > 0}
                          className={`text-[10px] px-4 py-2 rounded-full border transition-all flex items-center gap-2 font-bold ${
                            cooldownRemaining[item.title] > 0
                            ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed" 
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 active:scale-95"
                          }`}
                        >
                          {loadingAi[item.title] ? "Menganalisa..." : cooldownRemaining[item.title] > 0 ? `⏳ Wait ${cooldownRemaining[item.title]}s` : "✨ Ringkas AI"}
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-300 leading-relaxed bg-blue-500/[0.03] p-4 rounded-2xl border border-blue-500/10 shadow-inner animate-in fade-in duration-500">
                        <span className="font-bold text-blue-400">Deep Analysis: </span>{summary[item.title]}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-gray-500 font-mono text-xs border border-dashed border-white/10 rounded-[32px]">
              Belum ada berita dari sumber ini 🗿
            </div>
          )}
        </div>

        {/* Sidebar Developer (Tampil di Desktop & Muncul Paling Bawah di HP) */}
        <aside className="lg:col-span-1 mt-8 lg:mt-0">
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 p-8 rounded-[40px] sticky top-28 shadow-xl">
            <div className="relative w-28 h-28 mx-auto mb-6">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-xl animate-pulse"></div>
              <img src="https://res.cloudinary.com/dwiozm4vz/image/upload/v1772959730/ootglrvfmykn6xsto7rq.png" alt="Avatar" className="relative w-28 h-28 rounded-full border-2 border-white/10 object-cover shadow-2xl" />
            </div>
            
            <h2 className="text-xl font-black tracking-tight text-center text-white">Rahmat</h2>
            <p className="text-[11px] text-blue-400 font-mono mt-1 text-center font-bold">@R_hmt ofc</p>
            
            <div className="flex flex-col gap-3 mt-6">
              <div className="flex flex-wrap gap-2 justify-center">
                <a href="https://github.com/rahmat-369" target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-white/5 px-3 py-2 rounded-xl text-[10px] font-bold hover:bg-white/10 hover:text-white transition text-gray-400 border border-white/5"><Github size={14}/></a>
                <a href="https://t.me/rAi_engine" target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-white/5 px-3 py-2 rounded-xl text-[10px] font-bold hover:bg-white/10 hover:text-[#3b82f6] transition text-gray-400 border border-white/5"><Send size={14}/></a>
                <a href="#" target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-white/5 px-3 py-2 rounded-xl text-[10px] font-bold hover:bg-white/10 hover:text-[#ec4899] transition text-gray-400 border border-white/5"><Instagram size={14}/></a>
                <a href="#" target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-white/5 px-3 py-2 rounded-xl text-[10px] font-bold hover:bg-white/10 hover:text-white transition text-gray-400 border border-white/5"><PlayCircle size={14}/></a>
              </div>
              <a href="https://whatsapp.com/channel/0029VbBjyjlJ93wa6hwSWa0p" target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-2 bg-[#25D366]/10 px-4 py-3 rounded-xl text-[10px] font-bold hover:bg-[#25D366]/20 text-[#25D366] transition border border-[#25D366]/20 text-center leading-relaxed">
                <MessageCircle size={16} /> Join WhatsApp Channel
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 text-left">
              <h3 className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-4 text-center">Sirkuit Proyek</h3>
              <ul className="text-[11px] text-gray-300 space-y-3 px-2">
                <li className="flex items-center gap-3 hover:text-white transition-colors cursor-default"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6]"></span> Flora Scan AI</li>
                <li className="flex items-center gap-3 hover:text-white transition-colors cursor-default"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6]"></span> WatchNime</li>
                <li className="flex items-center gap-3 hover:text-white transition-colors cursor-default"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6]"></span> Ramadhan Lantern</li>
              </ul>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
          }
