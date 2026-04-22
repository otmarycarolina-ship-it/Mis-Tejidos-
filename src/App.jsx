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

// --- Configuración de Firebase Corregida para Vercel ---
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'mis-tejidos-v1'; // ID único para tu base de datos

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

  // Autenticación anónima para que Firestore funcione
  useEffect(() => {
    signInAnonymously(auth).catch((error) => {
      console.error("Error de autenticación:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Escucha en tiempo real de los productos
  useEffect(() => {
    if (!user) return;
    
    const itemsCol = collection(db, 'catalog', appId, 'products');
    
    const unsubscribe = onSnapshot(itemsCol, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      const sortedData = data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setItems(sortedData);
      setLoading(false);
    }, (err) => {
      console.error("Error al cargar productos:", err);
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
      alert("PIN Incorrecto");
      setAdminPass('');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1000000) {
        alert("La foto es muy pesada. Intenta con una más pequeña.");
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
    } catch (err) { 
      console.error("Error al publicar:", err);
      alert("No se pudo publicar. Revisa tu conexión.");
    }
  };

  const deleteItem = async (id) => {
    try { 
      await deleteDoc(doc(db, 'catalog', appId, 'products', id)); 
      setShowDeleteConfirm(null);
    } catch (err) { console.error(err); }
  };

  const handleWhatsApp = (item) => {
    const phone = "584226388324";
    const message = encodeURIComponent(`¡Hola! Me interesa este diseño:\n\n✨ Producto: ${item.category}\n💰 Precio: ${formatPrice(item.price)}\n\n¿Tienes disponibilidad? 😊`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: COLORS.champagne, color: COLORS.text }}>
      <header className="sticky top-0 z-30 p-5 flex justify-between items-center rounded-b-[2.5rem] shadow-lg" style={{ backgroundColor: COLORS.tickleMePink }}>
        <div className="flex items-center gap-2">
          <Heart size={24} fill="white" color="white" />
          <h1 className="text-xl font-black text-white">Mis Tejidos ♡</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowInfo(true)} className="p-2 text-white"><Info size={24} /></button>
          <button onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} className="p-2 text-white">
            {isAdmin ? <Unlock size={24} /> : <Lock size={24} />}
          </button>
        </div>
      </header>

      <div className="flex overflow-x-auto p-4 gap-2 no-scrollbar">
        <button onClick={() => setFilter('Todos')} className={`px-4 py-2 rounded-full font-bold ${filter === 'Todos' ? 'bg-pink-500 text-white' : 'bg-white text-gray-500'}`}>Todos</button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 rounded-full font-bold whitespace-nowrap ${filter === cat ? 'bg-pink-500 text-white' : 'bg-white text-gray-500'}`}>{cat}</button>
        ))}
      </div>

      <main className="p-4 grid grid-cols-1 gap-6 max-w-md mx-auto">
        {loading ? <p className="text-center font-bold opacity-50">Cargando...</p> : 
         filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-[2rem] p-4 shadow-md overflow-hidden">
            <div className="aspect-square rounded-2xl overflow-hidden bg-pink-50 mb-4 relative">
              {item.image && <img src={item.image} className="w-full h-full object-cover" />}
              {isAdmin && (
                <button onClick={() => setShowDeleteConfirm(item.id)} className="absolute top-2 right-2 bg-white/80 p-2 rounded-xl text-red-500"><Trash2 size={18} /></button>
              )}
            </div>
            <h3 className="text-xl font-black mb-1" style={{ color: COLORS.raspberryRose }}>{item.category}</h3>
            <p className="text-lg font-bold mb-4">{formatPrice(item.price)}</p>
            <button onClick={() => handleWhatsApp(item)} className="w-full py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2" style={{ backgroundColor: COLORS.tickleMePink }}>
              <MessageCircle size={20} /> Encargar
            </button>
          </div>
        ))}
      </main>

      {isAdmin && (
        <button onClick={() => setShowAddModal(true)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl" style={{ backgroundColor: COLORS.raspberryRose }}>
          <Plus size={30} />
        </button>
      )}

      {/* Modal Agregar */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm">
            <h2 className="text-xl font-black mb-4">Nuevo Diseño</h2>
            <form onSubmit={addItem} className="space-y-4">
              <select className="w-full p-3 bg-pink-50 rounded-xl" value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="Precio COP" className="w-full p-3 bg-pink-50 rounded-xl" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
              <button type="submit" className="w-full py-3 bg-pink-500 text-white rounded-xl font-bold">Publicar</button>
              <button type="button" onClick={() => setShowAddModal(false)} className="w-full text-gray-400">Cerrar</button>
            </form>
          </div>
        </div>
      )}

      {/* Login Admin */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form onSubmit={handleLogin} className="bg-white p-6 rounded-[2rem] w-full max-w-xs text-center">
            <h2 className="font-black mb-4">Modo Administradora</h2>
            <input type="password" placeholder="PIN" className="w-full p-3 bg-pink-50 rounded-xl text-center mb-4" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} />
            <button type="submit" className="w-full py-3 bg-pink-500 text-white rounded-xl font-bold">Entrar</button>
          </form>
        </div>
      )}

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-xs">
            <h3 className="font-black text-center mb-4">Condiciones de Pedido</h3>
            <div className="text-sm space-y-3">
              <p>🌸 Anticipo del 50% inicial.</p>
              <p>🚫 No se devuelve anticipo en cancelaciones.</p>
              <p>⏳ Tiempo varía según el diseño.</p>
            </div>
            <button onClick={() => setShowInfo(false)} className="w-full mt-4 py-2 bg-pink-100 text-pink-600 rounded-xl font-bold">Cerrar</button>
          </div>
        </div>
      )}

      {/* Eliminar Confirmar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 rounded-3xl text-center">
            <p className="font-bold mb-4">¿Borrar este diseño?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 p-2 bg-gray-100 rounded-xl">No</button>
              <button onClick={() => deleteItem(showDeleteConfirm)} className="flex-1 p-2 bg-red-500 text-white rounded-xl">Borrar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        body { font-family: 'Quicksand', sans-serif; }
      `}</style>
    </div>
  );
}
