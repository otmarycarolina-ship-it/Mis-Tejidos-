import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Info, Lock, Unlock, Camera, MessageCircle, 
  Heart, Sparkles, Clock, Wallet, AlertCircle 
} from 'lucide-react';

// --- TUS CREDENCIALES DE AIRTABLE ---
const AIRTABLE_TOKEN = "PatiCO2pgfZdCBlbO.ef033cf483063ade401d8548ad105f941ca2155536d09bec9e36add7dbb7d903";
const BASE_ID = "app7V3iZvWH8gVQlO";
const TABLE_NAME = "Productos"; // Si en Airtable la pestaña se llama distinto, cámbialo aquí.

const CATEGORIES = ["Blusas", "Flores", "Llaveros", "Vestidos de Bebé", "Tapetes", "Bolsos", "Otros"];
const COLORS = {
  tickleMePink: '#F283AF',
  champagne: '#FBF4EB',
  raspberryRose: '#C43670',
  blush: '#FBD9E5',
  text: '#5D4037'
};

export default function App() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPass, setAdminPass] = useState('');

  // Función para leer datos de Airtable
  const fetchItems = async () => {
    try {
      const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`, {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
      });
      const data = await response.json();
      const formattedData = data.records.map(record => ({
        id: record.id,
        nombre: record.fields.Nombre,
        price: record.fields.Precio,
        image: record.fields.Fotos ? record.fields.Fotos[0].url : null,
        category: record.fields.Categoría || 'Otros'
      }));
      setItems(formattedData);
      setLoading(false);
    } catch (error) {
      console.error("Error cargando Airtable:", error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filteredItems = useMemo(() => {
    if (filter === 'Todos') return items;
    return items.filter(item => item.category === filter);
  }, [items, filter]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
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
    const message = encodeURIComponent(`¡Hola Otmary! Me interesa este diseño:\n\n✨ ${item.nombre}\n💰 Precio: ${formatPrice(item.price)}`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: COLORS.champagne, color: COLORS.text, fontFamily: 'Quicksand, sans-serif' }}>
      <header className="sticky top-0 z-30 p-5 flex justify-between items-center rounded-b-[2.5rem] shadow-lg border-b-4 border-white" style={{ backgroundColor: COLORS.tickleMePink }}>
        <div className="flex items-center gap-2">
          <div className="bg-white/90 p-2 rounded-2xl"><Heart size={24} fill={COLORS.raspberryRose} color={COLORS.raspberryRose} /></div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">Mis Tejidos ♡</h1>
            <span className="text-[10px] uppercase font-bold text-white/80 tracking-widest text-center">Catálogo de Otmary</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowInfo(true)} className="p-3 bg-white/30 rounded-2xl text-white"><Info size={22} /></button>
          <button onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} className="p-3 bg-white/30 rounded-2xl text-white">
            {isAdmin ? <Unlock size={22} /> : <Lock size={22} />}
          </button>
        </div>
      </header>

      <div className="flex overflow-x-auto p-5 gap-3 no-scrollbar sticky top-[88px] z-20 backdrop-blur-md bg-white/30">
        <button onClick={() => setFilter('Todos')} className={`px-6 py-3 rounded-3xl font-bold shadow-md border-2 border-white ${filter === 'Todos' ? 'bg-[#C43670] text-white' : 'bg-white text-gray-500'}`}>Todos</button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-6 py-3 rounded-3xl font-bold shadow-md border-2 border-white whitespace-nowrap ${filter === cat ? 'bg-[#C43670] text-white' : 'bg-white text-gray-500'}`}>{cat}</button>
        ))}
      </div>

      <main className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {loading ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <div className="animate-bounce mb-4"><Heart size={48} fill={COLORS.tickleMePink} color={COLORS.tickleMePink} /></div>
            <p className="font-bold opacity-50">Abriendo el taller...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white/50 rounded-[3rem] p-10 border-2 border-dashed border-pink-200">
            <p className="font-bold text-lg text-pink-300">Próximamente más diseños ✨</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-[3rem] p-5 shadow-xl transition-all overflow-hidden border-b-8 border-pink-100">
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-pink-50 relative mb-5">
                {item.image ? <img src={item.image} className="w-full h-full object-cover" alt={item.nombre} /> : <div className="w-full h-full flex items-center justify-center opacity-20"><Camera size={40} /></div>}
              </div>
              <div className="px-2">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-black" style={{ color: COLORS.raspberryRose }}>{item.nombre}</h3>
                  <p className="text-xl font-black">{formatPrice(item.price)}</p>
                </div>
                <button onClick={() => handleWhatsApp(item)} className="w-full py-4 rounded-[1.8rem] text-white font-black flex items-center justify-center gap-2 shadow-lg" style={{ backgroundColor: COLORS.tickleMePink }}>
                  <MessageCircle size={20} fill="white" /> Consultar disponibilidad
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl border-4 border-white">
            <div className="p-8 text-center" style={{ backgroundColor: COLORS.blush }}>
              <h2 className="text-2xl font-black" style={{ color: COLORS.raspberryRose }}>Información</h2>
            </div>
            <div className="p-8 space-y-5">
              <div className="flex gap-4 items-start"><Wallet size={20} className="text-pink-400" /><p className="text-sm font-medium">Pedidos con <b>anticipo del 50%</b>.</p></div>
              <div className="flex gap-4 items-start"><AlertCircle size={20} className="text-red-400" /><p className="text-sm font-medium">No se devuelve el anticipo en cancelaciones.</p></div>
              <div className="flex gap-4 items-start"><Clock size={20} className="text-amber-400" /><p className="text-sm font-medium">Tiempo de entrega según el diseño.</p></div>
            </div>
            <button onClick={() => setShowInfo(false)} className="w-full py-5 text-white font-black" style={{ backgroundColor: COLORS.raspberryRose }}>Cerrar ♡</button>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xs text-center">
            <h2 className="text-xl font-black mb-6">Modo Admin</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="password" placeholder="Pin" className="w-full p-4 bg-pink-50 rounded-2xl text-center font-bold" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} />
              <button type="submit" className="w-full py-3 text-white rounded-2xl font-black" style={{ backgroundColor: COLORS.raspberryRose }}>Entrar</button>
            </form>
            <button onClick={() => setShowAdminLogin(false)} className="mt-4 text-xs opacity-40">Cerrar</button>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;700;900&display=swap');
      `}</style>
    </div>
  );
}
