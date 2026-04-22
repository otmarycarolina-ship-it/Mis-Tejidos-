```react
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
  signInWithCustomToken,
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

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'crochet-alegre-app';

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

  // Autenticación inicial obligatoria para Firestore
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Escucha en tiempo real de los productos
  useEffect(() => {
    if (!user) return;
    
    const itemsCol = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    
    const unsubscribe = onSnapshot(itemsCol, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      const sortedData = data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setItems(sortedData);
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredItems = useMemo(() => {
    if (filter === 'Todos') return items;
    return items.filter(item => item.category === filter);
  }, [items, filter]);

  const formatPrice = (price) => {
    const formatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace(/\s/g, ' ');
    
    return `${formatted} COP`;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPass === '1206') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPass('');
    } else {
      setAdminPass('');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 800000) return; 
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
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', id);
      await setDoc(docRef, {
        ...newItem,
        id,
        price: parseFloat(newItem.price),
        createdAt: new Date().toISOString()
      });
      setNewItem({ price: '', category: 'Blusas', image: '' });
      setShowAddModal(false);
    } catch (err) { console.error(err); }
  };

  const deleteItem = async (id) => {
    if (!user) return;
    try { 
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id)); 
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
          <div className="bg-white/90 p-2 rounded-2xl shadow-inner">
            <Heart size={24} fill={COLORS.raspberryRose} color={COLORS.raspberryRose} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">Mis Tejidos ♡</h1>
            <span className="text-[10px] uppercase font-bold text-white/80 tracking-widest">Hecho a mano</span>
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
            <p className="font-bold opacity-50">Cargando catálogo...</p>
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
                  <img src={item.image} alt={item.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center opacity-20"><Camera size={40} /></div>
                )}
                {isAdmin && (
                  <button onClick={() => setShowDeleteConfirm(item.id)} className="absolute top-4 right-4 bg-white/90 p-3 rounded-2xl text-red-500 shadow-xl hover:bg-red-500 hover:text-white transition-all z-10">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
              
              <div className="px-2">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Diseño</p>
                    <h3 className="text-2xl font-black" style={{ color: COLORS.raspberryRose }}>{item.category}</h3>
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

      {isAdmin && (
        <button onClick={() => setShowAddModal(true)} className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl text-white flex items-center justify-center hover:scale-110 active:rotate-90 transition-all z-40 border-4 border-white" style={{ backgroundColor: COLORS.raspberryRose }}>
          <Plus size={32} strokeWidth={3} />
        </button>
      )}

      {/* Modal: Información con textos actualizados */}
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
                <p className="text-sm font-medium leading-relaxed">Todos los pedidos se realizan con un <b>anticipo del 50%</b> para asegurar tu Lugar en la agenda.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-red-400 text-white"><AlertCircle size={16} /></div>
                <p className="text-sm font-medium leading-relaxed">En caso de cancelación de algún pedido <b>no se devolverá el anticipo</b>.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-amber-400 text-white"><Clock size={16} /></div>
                <p className="text-sm font-medium leading-relaxed">Como son piezas hechas a mano, el <b>tiempo de entrega varía</b> según el diseño.</p>
              </div>
            </div>
            <button onClick={() => setShowInfo(false)} className="w-full py-5 text-white font-black text-lg" style={{ backgroundColor: COLORS.raspberryRose }}>
              ¡Entendido! ♡
            </button>
          </div>
        </div>
      )}

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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-md p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black flex items-center gap-2"><Sparkles size={24} className="text-pink-400" /> Nuevo Diseño</h2>
              <button onClick={() => setShowAddModal(false)} className="bg-gray-100 p-2 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={addItem} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-pink-300 block mb-2 px-1">Categoría</label>
                <select className="w-full p-4 bg-pink-50 rounded-2xl font-bold" value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-pink-300 block mb-2 px-1">Precio (COP)</label>
                <input type="number" placeholder="Ej: 80000" required className="w-full p-4 bg-pink-50 rounded-2xl font-black" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-pink-300 block mb-2 px-1">Foto</label>
                <label className="w-full h-48 bg-pink-50 rounded-[2rem] border-4 border-dashed border-pink-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                  {newItem.image ? <img src={newItem.image} className="w-full h-full object-cover" alt="Pre" /> : <Upload size={32} className="text-pink-300" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <button type="submit" className="w-full py-5 rounded-[2rem] text-white font-black text-lg shadow-xl mt-4" style={{ backgroundColor: COLORS.raspberryRose }}>Publicar ✨</button>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xs shadow-2xl text-center">
            <Trash2 size={40} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-black mb-2">¿Eliminar diseño?</h2>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold text-gray-500">No</button>
              <button onClick={() => deleteItem(showDeleteConfirm)} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold">Sí, borrar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;700;900&display=swap');
        body { font-family: 'Quicksand', sans-serif; overscroll-behavior-y: contain; }
      `}</style>
    </div>
  );
}

```
