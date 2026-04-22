import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Plus, 
  Trash2, 
  Info, 
  Lock, 
  Unlock, 
  Camera, 
  MessageCircle, 
  X,
  Upload,
  Heart,
  Sparkles,
  Clock,
  Wallet,
  AlertCircle
} from 'lucide-react';

// --- Configuración Reparada para Vercel ---
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'mis-tejidos-otmary'; // Identificador único de tu base de datos

const CATEGORIES = [
  "Blusas", "Flores", "Llaveros", "Vestidos de Bebé", "Tapetes", "Bolsos", "Otros"
];

const COLORS = {
  tickleMePink: '#F283AF',
  champagne: '#FBF4EB',
  blush: '#FBD9E5',
  raspberryRose: '#C43670',
  sunset: '#F3CC97',
  text: '#5D4037'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const [newItem, setNewItem] = useState({
    price: '',
    category: 'Blusas',
    image: ''
  });

  // Autenticación automática para habilitar Firestore
  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Error Auth:", err));
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Escucha en tiempo real de los productos en tu base de datos
  useEffect(() => {
    if (!user) return;
    const itemsCol = collection(db, 'catalog', appId, 'products');
    const unsubscribe = onSnapshot(itemsCol, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
      setLoading(false);
    }, (err) => {
      console.error("Error Firestore:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredItems = useMemo(() => {
    if (filter === 'Todos') return items;
    return items.filter(item => item.category === filter);
  }, [items, filter]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPass === '1206') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPass('');
    } else {
      alert("Pin incorrecto");
      setAdminPass('');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 900000) {
        alert("La imagen es muy pesada, intenta con otra.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setNewItem(prev => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.price || !user) return;
    try {
      const id = Date.now().toString();
      const docRef = doc(db, 'catalog', appId, 'products', id);
      await setDoc(docRef, {
        ...newItem,
        id,
        price: parseFloat(newItem.price),
        createdAt: new Date().toISOString()
      });
      setNewItem({ price: '', category: 'Blusas', image: '' });
      setShowAddModal(false);
    } catch (err) { alert("Error al publicar: " + err.message); }
  };

  const deleteItem = async (id) => {
    try { 
      await deleteDoc(doc(db, 'catalog', appId, 'products', id)); 
      setShowDeleteConfirm(null);
    } catch (err) { console.error(err); }
  };

  const handleWhatsApp = (item) => {
    const phone = "584226388324";
    const message = encodeURIComponent(`¡Hola! Me interesa encargar este diseño:\n\n✨ Producto: ${item.category}\n💰 Precio: ${formatPrice(item.price)}\n\nMe gustaría consultar sobre medidas y disponibilidad de colores. 😊`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: COLORS.champagne, color: COLORS.text }}>
      <header className="sticky top-0 z-30 p-5 flex justify-between items-center rounded-b-[2.5rem] shadow-lg border-b-4 border-white" style={{ backgroundColor: COLORS.tickleMePink }}>
        <div className="flex items-center gap-2">
          <div className="bg-white/90 p-2 rounded-2xl">
            <Heart size={24} fill={COLORS.raspberryRose} color={COLORS.raspberryRose} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">Mis Tejidos ♡</h1>
            <span className="text-[10px] uppercase font-bold text-white/80 tracking-widest">Hecho a mano</span>
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
            <p className="font-bold opacity-50">Cargando catálogo...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white/50 rounded-[3rem] p-10 border-2 border-dashed border-pink-200">
            <p className="font-bold text-lg text-pink-300">No hay diseños aquí aún ✨</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-[3rem] p-5 shadow-xl border-t-8 border-transparent hover:border-pink-100 transition-all group overflow-hidden">
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-pink-50 relative mb-5">
                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><Camera size={40} /></div>}
                {isAdmin && <button onClick={() => setShowDeleteConfirm(item.id)} className="absolute top-4 right-4 bg-white/90 p-3 rounded-2xl text-red-500 shadow-xl"><Trash2 size={20} /></button>}
              </div>
              <div className="px-2">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black" style={{ color: COLORS.raspberryRose }}>{item.category}</h3>
                  </div>
                  <p className="text-xl font-black">{formatPrice(item.price)}</p>
                </div>
                <p className="text-[11px] text-center mb-4 font-bold opacity-60 italic">✨ Personalizable en color y medidas.</p>
                <button onClick={() => handleWhatsApp(item)} className="w-full py-4 rounded-[1.8rem] text-white font-black flex items-center justify-center gap-2 shadow-lg" style={{ backgroundColor: COLORS.tickleMePink }}>
                  <MessageCircle size={20} fill="white" /> Encargar por WhatsApp
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {isAdmin && (
        <button onClick={() => setShowAddModal(true)} className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl text-white flex items-center justify-center border-4 border-white" style={{ backgroundColor: COLORS.raspberryRose }}>
          <Plus size={32} />
        </button>
      )}

      {/* Modal Info: Anticipo del 50% */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl border-4 border-white">
            <div className="p-8 text-center" style={{ backgroundColor: COLORS.blush }}>
              <h2 className="text-2xl font-black" style={{ color: COLORS.raspberryRose }}>¿Cómo encargar?</h2>
            </div>
            <div className="p-8 space-y-5">
              <div className="flex gap-4 items-start"><Wallet size={20} className="text-pink-400" /><p className="text-sm font-medium">Pedidos con <b>anticipo del 50%</b> para agendar.</p></div>
              <div className="flex gap-4 items-start"><AlertCircle size={20} className="text-red-400" /><p className="text-sm font-medium">En cancelaciones <b>no se devuelve el anticipo</b>.</p></div>
              <div className="flex gap-4 items-start"><Clock size={20} className="text-amber-400" /><p className="text-sm font-medium">Tiempo de entrega varía según el diseño.</p></div>
            </div>
            <button onClick={() => setShowInfo(false)} className="w-full py-5 text-white font-black" style={{ backgroundColor: COLORS.raspberryRose }}>¡Entendido! ♡</button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xs text-center relative">
            <h2 className="text-xl font-black mb-6">Modo Admin</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="password" placeholder="Pin" className="w-full p-4 bg-pink-50 rounded-2xl text-center font-bold" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} />
              <button type="submit" className="w-full py-3 text-white rounded-2xl font-black" style={{ backgroundColor: COLORS.raspberryRose }}>Entrar</button>
            </form>
            <button onClick={() => setShowAdminLogin(false)} className="mt-4 text-xs opacity-40">Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal Agregar Pedido */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-md p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black mb-6 flex gap-2"><Sparkles className="text-pink-400" /> Nuevo Diseño</h2>
            <form onSubmit={addItem} className="space-y-5">
              <select className="w-full p-4 bg-pink-50 rounded-2xl font-bold" value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="Precio (COP)" required className="w-full p-4 bg-pink-50 rounded-2xl font-black" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
              <label className="w-full h-48 bg-pink-50 rounded-[2rem] border-4 border-dashed border-pink-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                {newItem.image ? <img src={newItem.image} className="w-full h-full object-cover" /> : <Upload size={32} className="text-pink-300" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              <button type="submit" className="w-full py-5 rounded-[2rem] text-white font-black text-lg shadow-xl" style={{ backgroundColor: COLORS.raspberryRose }}>Publicar ✨</button>
              <button type="button" onClick={() => setShowAddModal(false)} className="w-full text-center text-gray-400 font-bold">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xs text-center">
            <h2 className="text-xl font-black mb-6">¿Eliminar diseño?</h2>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold">No</button>
              <button onClick={() => deleteItem(showDeleteConfirm)} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold">Sí, borrar</button>
            </div>
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
