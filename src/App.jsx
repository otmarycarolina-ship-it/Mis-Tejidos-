import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Info, 
  Lock, 
  Unlock, 
  Camera, 
  MessageCircle, 
  X,
  Heart,
  Sparkles,
  Clock,
  Wallet,
  AlertCircle
} from 'lucide-react';

// --- CONFIGURACIÓN DE AIRTABLE (TUS LLAVES) ---
const AIRTABLE_TOKEN = "PatiCO2pgfZdCBlbO.ef033cf483063ade401d8548ad105f941ca2155536d09bec9e36add7dbb7d903";
const BASE_ID = "app7V3iZvWH8gVQlO";
const TABLE_NAME = "Productos"; // Asegúrate de que en Airtable la pestaña se llame exactamente así

const CATEGORIES = [
  "Blusas", "Flores", "Llaveros", "Vestidos de Bebé", "Tapetes", "Bolsos", "Otros"
];

const COLORS = {
  tickleMePink: '#F283AF',
  champagne: '#FBF4EB',
  blush: '#FBD9E5',
  raspberryRose: '#C43670',
  text: '#5D4037'
};

export default function App() {
  const [items, setItems] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [filter, setFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);

  // Función para traer los datos desde Airtable
  const fetchAirtableData = async () => {
    try {
      const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`, {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
      });
      const data = await response.json();
      
      const formattedData = data.records.map(record => ({
        id: record.id,
        nombre: record.fields.Nombre || "Sin nombre",
        price: record.fields.Precio || 0,
        category: record.fields.Categoría || "Otros",
        image: record.fields.Fotos ? record.fields.Fotos[0].url : null
      }));

      setItems(formattedData);
      setLoading(false);
    } catch (error) {
      console.error("Error al conectar con Airtable:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAirtableData();
  }, []);

  const filteredItems = useMemo(() => {
    if (filter === 'Todos') return items;
    return items.filter(item => item.category === filter);
  }, [items, filter]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price) + " COP";
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPass === '1206') {
      setIsAdmin(true);
      setShowAdminLogin(false);
    } else {
      alert("Pin incorrecto");
    }
    setAdminPass('');
  };

  const handleWhatsApp = (item) => {
    const phone = "584226388324";
    const message = encodeURIComponent(`¡Hola! Me interesa encargar este diseño:\n\n✨ Producto: ${item.nombre}\n💰 Precio: ${formatPrice(item.price)}\n\nMe gustaría consultar sobre medidas y disponibilidad de colores. 😊`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: COLORS.champagne, color: COLORS.text }}>
      <header className="sticky top-0 z-30 p-5 flex justify-between items-center rounded-b-[2.5rem] shadow-lg border-b-4 border-white" style={{ backgroundColor: COLORS.tickleMePink }}>
        <div className="flex items-center gap-2">
          <div className="bg-white/90 p-2 rounded-2xl shadow-inner">
            <Heart size={24} fill={COLORS.raspberryRose} color={COLORS.raspberryRose} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">Mis Tejidos ♡</h1>
            <span className="text-[10px] uppercase font-bold text-white/80 tracking-widest text-center">Hecho a mano por Otmary</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowInfo(true)} className="p-3 bg-white/30 rounded-2xl text-white hover:bg-white/40 transition-colors">
            <Info size={22} />
          </button>
          <button onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} className="p-3 bg-white/30 rounded-2xl text-white hover:bg-white/40 transition-colors">
            {isAdmin ? <Unlock size={22} /> : <Lock size={22} />}
          </button>
        </div>
      </header>

      {/* Filtros de Categoría */}
      <div className="flex overflow-x-auto p-5 gap-3 no-scrollbar sticky top-[88px] z-20 backdrop-blur-md bg-white/30">
        <button 
          onClick={() => setFilter('Todos')}
          className={`px-6 py-3 rounded-3xl font-bold transition-all shadow-md border-2 border-white ${filter === 'Todos' ? 'text-white' : 'bg-white text-gray-500'}`}
          style={{ backgroundColor: filter === 'Todos' ? COLORS.raspberryRose : 'white' }}
        >Todos</button>
        {CATEGORIES.map(cat => (
          <button 
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-6 py-3 rounded-3xl font-bold transition-all shadow-md border-2 border-white whitespace-nowrap ${filter === cat ? 'text-white' : 'bg-white text-gray-500'}`}
            style={{ backgroundColor: filter === cat ? COLORS.raspberryRose : 'white' }}
          >{cat}</button>
        ))}
      </div>

      <main className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {loading ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <div className="animate-bounce mb-4"><Heart size={48} fill={COLORS.tickleMePink} color={COLORS.tickleMePink} className="opacity-50" /></div>
            <p className="font-bold opacity-50">Abriendo el catálogo...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white/50 rounded-[3rem] p-10 border-2 border-dashed border-pink-200">
            <p className="font-bold text-lg text-pink-300">No hay diseños en esta categoría aún ✨</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-[3rem] p-5 shadow-xl border-t-8 border-transparent hover:border-pink-100 transition-all group overflow-hidden">
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-pink-50 relative mb-5 shadow-inner">
                {item.image ? (
                  <img src={item.image} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center opacity-20"><Camera size={40} /></div>
                )}
              </div>
              
              <div className="px-2">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{item.category}</p>
                    <h3 className="text-2xl font-black" style={{ color: COLORS.raspberryRose }}>{item.nombre}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black">{formatPrice(item.price)}</p>
                  </div>
                </div>

                <p className="text-[11px] text-center mb-4 font-bold opacity-60 italic">✨ Personalizable en color y medidas.</p>
                
                <button onClick={() => handleWhatsApp(item)} className="w-full py-4 rounded-[1.8rem] text-white font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all" style={{ backgroundColor: COLORS.tickleMePink }}>
                  <MessageCircle size={20} fill="white" />
                  Encargar por WhatsApp
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Botón flotante para ir a Airtable (Solo Admin) */}
      {isAdmin && (
        <a href="https://airtable.com" target="_blank" rel="noreferrer" className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl text-white flex items-center justify-center hover:scale-110 active:rotate-90 transition-all z-40 border-4 border-white" style={{ backgroundColor: COLORS.raspberryRose }}>
          <Plus size={32} strokeWidth={3} />
        </a>
      )}

      {/* Modal: Información */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl border-4 border-white">
            <div className="p-8 text-center" style={{ backgroundColor: COLORS.blush }}>
              <Heart size={32} fill={COLORS.tickleMePink} color={COLORS.tickleMePink} className="mx-auto mb-3" />
              <h2 className="text-2xl font-black leading-tight" style={{ color: COLORS.raspberryRose }}>¿Cómo encargar tu pedido?</h2>
            </div>
            <div className="p-8 space-y-5">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-pink-400 text-white"><Wallet size={16} /></div>
                <p className="text-sm font-medium leading-relaxed">Pedidos con <b>anticipo del 50%</b> para asegurar tu lugar.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-red-400 text-white"><AlertCircle size={16} /></div>
                <p className="text-sm font-medium leading-relaxed">En cancelaciones <b>no se devolverá el anticipo</b>.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-amber-400 text-white"><Clock size={16} /></div>
                <p className="text-sm font-medium leading-relaxed">Piezas hechas a mano: el <b>tiempo varía</b> según el diseño.</p>
              </div>
            </div>
            <button onClick={() => setShowInfo(false)} className="w-full py-5 text-white font-black text-lg" style={{ backgroundColor: COLORS.raspberryRose }}>
              ¡Entendido! ♡
            </button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xs shadow-2xl text-center relative">
            <button onClick={() => setShowAdminLogin(false)} className="absolute top-4 right-4 text-gray-300"><X size={24} /></button>
            <h2 className="text-xl font-black mb-6">Modo Admin</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="password" placeholder="Pin" className="w-full p-4 bg-pink-50 rounded-2xl text-center font-bold" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} autoFocus />
              <button type="submit" className="w-full py-3 text-white rounded-2xl font-black shadow-lg" style={{ backgroundColor: COLORS.raspberryRose }}>Entrar</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;700;900&display=swap');
        body { font-family: 'Quicksand', sans-serif; }
      `}</style>
    </div>
  );
}
