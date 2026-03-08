import { useEffect, useState } from "react";

export default function App() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [loadingAi, setLoadingAi] = useState({});

  useEffect(() => {
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
      } catch (error) {
        console.error('Gagal mengambil berita');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleAiSummary = async (title, index) => {
    if (summary[index]) return;
    setLoadingAi(prev => ({ ...prev, [index]: true }));
    try {
      const prompt = `Ringkas berita ini secara formal dalam 2 kalimat: ${title}`;
      const res = await fetch(`https://api.nexray.web.id/ai/gpt-3.5-turbo?text=${encodeURIComponent(prompt)}`);
      const data = await res.json();
      setSummary(prev => ({ ...prev, [index]: data.result }));
    } catch (err) {
      setSummary(prev => ({ ...prev, [index]: "Gagal memuat ringkasan." }));
    }
    setLoadingAi(prev => ({ ...prev, [index]: false }));
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans">
      {/* Header / Navbar */}
      <nav className="glass-card sticky top-4 z-50 p-6 rounded-[32px] flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter flex items-center">
            <span className="text-white">Indo</span>
            <span className="text-green-500">Sawi</span>
            {/* Logo Custom SVG/PNG */}
            <div className="relative inline-flex items-center justify-center w-8 h-8 -ml-1 -mt-1">
              <div className="absolute inset-0 bg-green-500 blur-md opacity-40 animate-pulse rounded-full"></div>
              <img 
                src="https://j.top4top.io/p_37192jn0n0.png" 
                alt="t" 
                className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" 
              />
            </div>
            <span className="text-gray-500 ml-0.5">.news</span>
          </h1>
          <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] mt-1 font-bold pl-1">Aggregator Kabar Terkini</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Server Optimal</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Berita Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-72 glass-card rounded-[32px] animate-pulse"></div>
            ))
          ) : news.length > 0 ? (
            news.map((item, i) => (
              <div key={i} className="glass-card rounded-[32px] overflow-hidden group hover:border-green-500/30 transition-all duration-500 flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <img src={item.image} alt="Thumbnail" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050705] to-transparent"></div>
                  <span className="absolute top-4 left-4 text-[10px] bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-green-400 font-bold uppercase tracking-widest border border-green-500/30 shadow-lg">
                    {item.source}
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold leading-snug group-hover:text-green-400 transition-colors">{item.title}</h3>
                    <p className="text-[10px] text-gray-500 mt-2 font-mono">{item.time}</p>
                  </div>
                  
                  {/* AI Summary Section */}
                  <div className="mt-4 pt-4 border-t border-white/5">
                    {!summary[i] ? (
                      <div className="flex justify-between items-center">
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-white underline tracking-widest font-bold">BACA FULL →</a>
                        <button 
                          onClick={() => handleAiSummary(item.title, i)}
                          disabled={loadingAi[i]}
                          className="text-[10px] px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 hover:bg-green-500/20 transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                        >
                          {loadingAi[i] ? "Menganalisa..." : "✨ Ringkas AI"}
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner">
                        <span className="font-bold text-green-400">AI Summary: </span>{summary[i]}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-gray-500 font-mono text-sm border border-dashed border-white/10 rounded-[32px]">
              Gagal memanen berita. Coba refresh bentar 🗿
            </div>
          )}
        </div>

        {/* Sidebar Developer */}
        <aside className="lg:col-span-1">
          <div className="glass-card p-6 rounded-[40px] sticky top-28">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
              <img src="https://res.cloudinary.com/dwiozm4vz/image/upload/v1772959730/ootglrvfmykn6xsto7rq.png" alt="Avatar" className="relative w-24 h-24 rounded-full border-2 border-green-500/50 object-cover shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-center text-white drop-shadow-md">Rahmat</h2>
            <p className="text-[10px] text-green-400 font-mono mt-1 text-center">@rAi-engine</p>
            
            {/* Sosmed Links */}
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              <a href="https://github.com/rahmat-369" target="_blank" rel="noreferrer" className="glass-card px-3 py-1.5 rounded-lg text-[9px] font-bold hover:bg-white/10 hover:text-green-400 transition uppercase tracking-widest">GitHub</a>
              <a href="https://t.me/rAi_engine" target="_blank" rel="noreferrer" className="glass-card px-3 py-1.5 rounded-lg text-[9px] font-bold hover:bg-white/10 hover:text-green-400 transition uppercase tracking-widest">Telegram</a>
              <a href="https://whatsapp.com/channel/0029VbBjyjlJ93wa6hwSWa0p" target="_blank" rel="noreferrer" className="glass-card px-3 py-1.5 rounded-lg text-[9px] font-bold hover:bg-white/10 hover:text-green-400 transition uppercase tracking-widest">WhatsApp</a>
            </div>

            {/* Proyek Lainnya */}
            <div className="mt-8 pt-6 border-t border-white/5 text-left">
              <h3 className="text-[10px] text-green-500 uppercase tracking-widest font-bold mb-4 text-center">Sirkuit Proyek</h3>
              <ul className="text-[11px] text-gray-400 space-y-3 px-2">
                <li className="flex items-center gap-2 hover:text-white transition-colors cursor-default"><span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span> Flora Scan AI</li>
                <li className="flex items-center gap-2 hover:text-white transition-colors cursor-default"><span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span> WatchNime</li>
                <li className="flex items-center gap-2 hover:text-white transition-colors cursor-default"><span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span> Ramadhan Lantern</li>
              </ul>
            </div>
            
            <div className="mt-8 pt-4 border-t border-white/5 text-center">
              <p className="text-[8px] text-gray-600 uppercase tracking-widest">Powered by NexRay API Endpoint</p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
                                       } 
