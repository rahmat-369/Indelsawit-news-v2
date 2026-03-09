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
      
      {/* Header */}
      <nav className="sticky top-4 z-50 mx-4 md:mx-8 p-5 rounded-[28px] flex justify-between items-center mb-8 bg-white/[0.03] backdrop-blur-xl border border-white/5 shadow-2xl">
        <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter flex items-center gap-1">
          <span className="text-white">Indo</span>
          {/* Teks "Sawi" dengan Glow Hijau Tipis */}
          <span className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]">Sawi</span>
          <div className="relative w-8 h-8 -ml-1">
            {/* Glow Oranye pada Pohon Sawit tetap dipertahankan */}
            <div className="absolute inset-0 bg-orange-500/30 blur-[6px] rounded-full animate-pulse"></div>
            <img src="https://j.top4top.io/p_37192jn0n0.png" alt="logo" className="relative z-10 w-full h-full object-contain" />
          </div>
          <span className="text-gray-200 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">.news</span>
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

      {/* Hamburger Menu (Quick Nav Only) */}
      {isMenuOpen && (
        <div className="mx-4 md:mx-8 glass-card rounded-3xl p-6 mb-6 animate-in slide-in-from-top duration-300 border border-white/5 bg-white/[0.02] backdrop-blur-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Status Sistem</h3>
            <span className="flex items-center gap-1 text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><CheckCircle2 size={10}/> Link Aktif</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => { setIsMenuOpen(false); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-3 bg-white/5 rounded-2xl text-[11px] font-bold border border-white/5 text-center">Berita Terbaru</button>
             <button onClick={() => { setIsMenuOpen(false); window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'}); }} className="p-3 bg-white/5 rounded-2xl text-[11px] font-bold border border-white/5 text-center">Info Developer</button>
          </div>
        </div>
      )}

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

      {/* Main News Grid */}
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
                {/* Judul Berita - Hover memunculkan garis bawah biru tanpa mengubah warna teks */}
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
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">BACA FULL <ExternalLink size={10}/></a>
                    <button onClick={() => handleAiSummary(item.title)} disabled={loadingAi[item.title] || cooldownRemaining[item.title] > 0}
                      className={`text-[10px] px-4 py-2 rounded-full border transition-all font-bold ${
                        cooldownRemaining[item.title] > 0 ? "text-gray-500 border-white/10" : "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                      }`}>
                      {loadingAi[item.title] ? "Menganalisa..." : cooldownRemaining[item.title] > 0 ? `⏳ ${cooldownRemaining[item.title]}s` : "✨ Ringkas AI"}
                    </button>
                  </div>
                ) : (
                  // Efek Fade-In Smooth (muncul perlahan sekaligus)
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

      {/* FOOTER PREMIUM - INFO DEV */}
      <footer className="mt-20 border-t border-white/5 bg-white/[0.01] backdrop-blur-sm p-10 md:p-16">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
            <img src="https://res.cloudinary.com/dwiozm4vz/image/upload/v1772959730/ootglrvfmykn6xsto7rq.png" alt="Dev" className="relative w-24 h-24 rounded-full border-2 border-white/10 object-cover shadow-2xl" />
          </div>
          
          <h2 className="text-2xl font-black tracking-tighter text-white">Rahmat</h2>
          <p className="text-blue-400 font-mono text-[11px] font-bold uppercase tracking-[0.3em] mb-4">Developer & AI Prompting Engine</p>
          
          <p className="text-gray-400 text-xs leading-relaxed max-w-md mb-8 italic">
            "Membangun ekosistem informasi cerdas berbasis AI untuk masa depan digital Indonesia."
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <a href="https://github.com/rahmat-369" target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-2xl hover:text-white text-gray-400 transition-all border border-white/5 hover:border-white/20"><Github size={20}/></a>
            <a href="https://t.me/rAi_engine" target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-2xl hover:text-blue-400 text-gray-400 transition-all border border-white/5 hover:border-blue-400/20"><Send size={20}/></a>
            <a href="https://www.instagram.com/rahmt_nhw?igsh=MWQwcnB3bTA2ZnVidg==" target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-2xl hover:text-pink-500 text-gray-400 transition-all border border-white/5 hover:border-pink-500/20"><Instagram size={20}/></a>
            <a href="https://www.tiktok.com/@r_hmtofc?_r=1&_t=ZS-94KRfWQjeUu" target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-2xl hover:text-white text-gray-400 transition-all border border-white/5 hover:border-white/20"><PlayCircle size={20}/></a>
          </div>

          <a href="https://whatsapp.com/channel/0029VbBjyjlJ93wa6hwSWa0p" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-[#25D366]/10 px-8 py-4 rounded-full text-xs font-bold text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all mb-12 shadow-lg shadow-[#25D366]/5">
            <MessageCircle size={18} /> JOIN WHATSAPP CHANNEL
          </a>

          <div className="pt-8 border-t border-white/5 w-full flex flex-col md:flex-row justify-between items-center gap-4 opacity-40">
            <p className="text-[10px] font-mono">© 2026 INDOSAWIT.NEWS - KARYA DILINDUNGI</p>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
              <span>Privacy</span>
              <span>Terms</span>
              <span>v2.4 Final</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
         }
