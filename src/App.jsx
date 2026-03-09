import { useEffect, useState, useRef } from "react";
import { Menu, X, Filter, User, ExternalLink, Github, Send, Instagram, CheckCircle2 } from "lucide-react";

// --- CUSTOM SVG ICONS UNTUK TIKTOK & WHATSAPP ASLI ---
const TikTokIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const WhatsAppIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

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

  const startCooldownTimer = (title, initialTime) => {
    setCooldownRemaining(prev => ({ ...prev, [title]: initialTime }));
    const timer = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev[title] <= 1) {
          clearInterval(timer);
          return { ...prev, [title]: 0 };
        }
        return { ...prev, [title]: prev[title] - 1 };
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
      const mergedNews = allResults.flat().sort(() => Math.random() - 0.5);
      
      setNews(mergedNews);
      setFilteredNews(activeFilter === "Semua" ? mergedNews : mergedNews.filter(n => n.source === activeFilter));
    } catch (error) {
      console.error('Gagal memuat berita terkini');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const savedCooldowns = JSON.parse(localStorage.getItem('indosawit_cooldowns') || '{}');
    const savedSummaries = JSON.parse(localStorage.getItem('indosawit_summaries') || '{}');
    setSummary(savedSummaries);

    const now = Date.now();
    Object.keys(savedCooldowns).forEach(title => {
      const timeLeft = Math.ceil((savedCooldowns[title] - now) / 1000);
      if (timeLeft > 0) startCooldownTimer(title, timeLeft);
    });

    intervalRef.current = setInterval(fetchNews, 300000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleFilter = (source) => {
    setActiveFilter(source);
    setFilteredNews(source === "Semua" ? news : news.filter(item => item.source === source));
  };

  const handleAiSummary = async (title) => {
    if (summary[title] || loadingAi[title] || cooldownRemaining[title] > 0) return;
    setLoadingAi(prev => ({ ...prev, [title]: true }));
    try {
      const prompt = `Analisis mendalam 1 paragraf utuh (3-4 kalimat) yang padat dan informatif: ${title}`;
      const res = await fetch(`https://api.nexray.web.id/ai/gpt-3.5-turbo?text=${encodeURIComponent(prompt)}`);
      const data = await res.json();
      
      setSummary(prev => {
        const newSummary = { ...prev, [title]: data.result };
        localStorage.setItem('indosawit_summaries', JSON.stringify(newSummary));
        return newSummary;
      });
      
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

  return (
    <div className="min-h-screen font-sans text-white bg-[#050705]">
      
      {/* HEADER STICKY CONTAINER - Menu Gak Bakal Tenggelam */}
      <header className="sticky top-4 z-50 mx-4 md:mx-8 mb-8">
        <nav className="p-5 rounded-[28px] flex justify-between items-center bg-white/[0.03] backdrop-blur-xl border border-white/5 shadow-2xl relative">
          
          {/* LOGO SUPER CLEAN - Fokus "Sawi" dan Pohon */}
          <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter flex items-center gap-1">
            <span className="text-white">Indo</span>
            {/* Glow Hijau Sawi */}
            <span className="text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]">Sawi</span>
            <div className="relative w-8 h-8 -ml-1">
              <div className="absolute inset-0 bg-orange-500/30 blur-[6px] rounded-full animate-pulse"></div>
              <img src="https://j.top4top.io/p_37192jn0n0.png" alt="logo" className="relative z-10 w-full h-full object-contain" />
            </div>
            {/* Bagian ".news" Dihapus Total */}
          </h1>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-green-400 uppercase tracking-widest">
               <CheckCircle2 size={14}/> Server Optimal
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-white/5 rounded-xl border border-white/10 text-blue-400 hover:bg-white/10">
              {isMenuOpen ? <X size={24}/> : <Menu size={24}/>}
            </button>
          </div>
        </nav>

        {/* Hamburger Menu (Absolute & Sticky) */}
        {isMenuOpen && (
          <div className="absolute top-[110%] left-0 w-full glass-card rounded-3xl p-6 animate-in slide-in-from-top duration-300 border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Status Sistem</h3>
              <span className="flex items-center gap-1 text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><CheckCircle2 size={10}/> Link Aktif</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => { setIsMenuOpen(false); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-3 bg-white/5 rounded-2xl text-[11px] font-bold border border-white/5 text-center text-gray-300">Terbaru</button>
               <button onClick={() => { setIsMenuOpen(false); window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'}); }} className="p-3 bg-white/5 rounded-2xl text-[11px] font-bold border border-white/5 text-center text-gray-300">Kontak Dev</button>
            </div>
          </div>
        )}
      </header>

      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto px-4 md:px-8 pb-6 no-scrollbar mb-4 items-center">
        <Filter size={16} className="text-gray-500 shrink-0"/>
        {["Semua", "CNBC", "CNN", "Kompas", "Sindo", "Suara"].map((source) => (
          <button
            key={source}
            onClick={() => handleFilter(source)}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${
              activeFilter === source ? "bg-blue-500/10 border-blue-400 text-blue-400" : "bg-white/5 border-white/5 text-gray-400"
            }`}
          >
            {source}
          </button>
        ))}
      </div>

      {/* Grid Berita */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
        {loading ? (
          Array(6).fill(0).map((_, i) => <div key={i} className="h-72 bg-white/[0.02] border border-white/5 rounded-[32px] animate-pulse"></div>)
        ) : filteredNews.map((item, i) => (
          <div key={i} className="bg-white/[0.02] backdrop-blur-xl rounded-[32px] overflow-hidden group hover:border-blue-500/30 transition-all duration-500 flex flex-col border border-white/5 shadow-xl">
            <div className="relative h-48 overflow-hidden">
              <img src={item.image} alt="News" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050705] via-[#050705]/40 to-transparent"></div>
              <span className="absolute top-4 left-4 text-[9px] bg-blue-500/20 backdrop-blur-md px-3 py-1 rounded-full text-blue-300 font-bold uppercase border border-blue-500/30">{item.source}</span>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="inline-block group-hover:border-b group-hover:border-blue-500/50 transition-all duration-300 pb-1">
                  <h3 className="text-sm font-bold leading-relaxed text-gray-100 inline">
                    {item.title}
                  </h3>
                </div>
                <p className="text-[10px] text-gray-500 mt-3 font-mono opacity-60">{item.time}</p>
              </div>
              
              <div className="mt-5 pt-5 border-t border-white/5">
                {!summary[item.title] ? (
                  <div className="flex justify-between items-center">
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-all">BACA FULL <ExternalLink size={10}/></a>
                    <button onClick={() => handleAiSummary(item.title)} disabled={loadingAi[item.title] || cooldownRemaining[item.title] > 0}
                      className={`text-[10px] px-4 py-2 rounded-full border transition-all font-bold ${
                        cooldownRemaining[item.title] > 0 ? "text-gray-500 border-white/10" : "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                      }`}>
                      {loadingAi[item.title] ? "Menganalisa..." : cooldownRemaining[item.title] > 0 ? `⏳ ${cooldownRemaining[item.title]}s` : "✨ Ringkas AI"}
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-300 leading-relaxed bg-white/[0.01] p-4 rounded-r-2xl border-l-2 border-l-blue-500 animate-in fade-in duration-1000">
                    <span className="font-bold text-blue-400 block mb-1 uppercase tracking-tighter">Deep Analysis</span>
                    {summary[item.title]}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER PREMIUM */}
      <footer className="mt-20 border-t border-white/5 bg-white/[0.01] backdrop-blur-sm p-10 md:p-16">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
            <img src="https://res.cloudinary.com/dwiozm4vz/image/upload/v1772959730/ootglrvfmykn6xsto7rq.png" alt="Dev" className="relative w-24 h-24 rounded-full border-2 border-white/10 object-cover shadow-2xl" />
          </div>
          
          {/* NAMA DEV DIUBAH */}
          <h2 className="text-2xl font-black tracking-tighter text-white">R_hmt ofc</h2>
          <p className="text-blue-400 font-mono text-[11px] font-bold uppercase tracking-[0.3em] mb-4">Developer & AI Prompting Engine</p>
          
          <p className="text-gray-400 text-xs leading-relaxed max-w-md mb-8 italic">
            "Membangun ekosistem informasi cerdas berbasis AI untuk masa depan digital Indonesia."
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <a href="https://github.com/rahmat-369" target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-2xl hover:text-white text-gray-400 border border-white/5 hover:border-white/20"><Github size={20}/></a>
            <a href="https://t.me/rAi_engine" target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-2xl hover:text-blue-400 text-gray-400 border border-white/5 hover:border-blue-400/20"><Send size={20}/></a>
            <a href="https://www.instagram.com/rahmt_nhw?igsh=MWQwcnB3bTA2ZnVidg==" target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-2xl hover:text-pink-500 text-gray-400 border border-white/5 hover:border-pink-500/20"><Instagram size={20}/></a>
            <a href="https://www.tiktok.com/@r_hmtofc?_r=1&_t=ZS-94KRfWQjeUu" target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-2xl hover:text-white text-gray-400 border border-white/5 hover:border-white/20">
              {/* IKON TIKTOK ASLI */}
              <TikTokIcon size={20} />
            </a>
          </div>

          <a href="https://whatsapp.com/channel/0029VbBjyjlJ93wa6hwSWa0p" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-[#25D366]/10 px-8 py-4 rounded-full text-xs font-bold text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all mb-12 shadow-lg shadow-[#25D366]/5">
            {/* IKON WHATSAPP ASLI */}
            <WhatsAppIcon size={18} /> JOIN WHATSAPP CHANNEL
          </a>

          <div className="pt-8 border-t border-white/5 w-full flex flex-col md:flex-row justify-between items-center gap-4 opacity-40">
            <p className="text-[10px] font-mono">© 2026 INDOSAWIT - KARYA DILINDUNGI</p>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
              <span>Privacy</span>
              <span>Terms</span>
              <span>v2.5 Final</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
    }
