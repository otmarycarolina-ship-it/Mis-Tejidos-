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
  Plus, Trash2, Info, Lock, Unlock, Camera, MessageCircle, X, Upload, Heart, Sparkles, Clock, Wallet, AlertCircle
} from 'lucide-react';

// --- TUS CREDENCIALES DE LA FOTO ---
const firebaseConfig = {
  apiKey: "AIzaSyC46KE_P0F7Vs382fpm1zyl3oUjxRPK9oI",
  authDomain: "mis-tejidos.firebaseapp.com",
  projectId: "mis-tejidos",
  storageBucket: "mis-tejidos.firebasestorage.app",
  messagingSenderId: "1034971710057",
  appId: "1:1034971710057:web:e501d5408f5f0e303718f8",
  measurementId: "G-Y6HL27L34Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'crochet-alegre-app';

const CATEGORIES = ["Blusas", "Flores", "Llaveros", "Vestidos de Bebé", "Tapetes", "Bolsos", "Otros"];

const COLORS = {
  tickleMePink: '#F283AF',
  champagne: '#FBF4EB',
  blush: '#FBD9E5',
  raspberryRose: '#C43670',
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

  const [newItem, setNewItem] = useState({ price: '', category: 'Blusas', image: '' });

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const itemsCol = collection(db, 'products'); // Simplificado para tu nueva base
    return onSnapshot(itemsCol, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
      setLoading(false);
    });
  }, [user]);

  const filteredItems = useMemo(() => 
    filter === 'Todos' ? items : items.filter(i => i.category === filter)
  , [items, filter]);

  const formatPrice = (p) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p) + " COP";

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPass === '1206') { setIsAdmin(true); setShowAdminLogin(false); setAdminPass(''); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 800000) {
      const reader = new FileReader();
      reader.onloadend = () => setNewItem(prev => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    const id = Date.now().toString();
    await setDoc(doc(db, 'products', id), { ...newItem, id, price: parseFloat(newItem.price), createdAt: new Date().toISOString() });
    setShowAddModal(false);
    setNewItem({ price: '', category: 'Blusas', image: '' });
  };

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, 'products', id));
    setShowDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: COLORS.champagne, color: COLORS.text, fontFamily: 'Quicksand, sans-serif' }}>
      {/* Cabecera */}
      <header className="sticky top-0 z-30 p-5 flex justify-between items-center rounded-b-[2.5rem] shadow-lg text-white" style={{ backgroundColor: COLORS.tickleMePink }}>
        <div className="flex items-center gap-2">
          <Heart size={24} fill="white" />
          <h1 className="text-xl font-black">Mis Tejidos ♡</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowInfo(true)} className="p-2 bg-white/20 rounded-xl"><Info /></button>
          <button onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} className="p-2 bg-white/20 rounded-xl">
            {isAdmin ? <Unlock /> : <Lock />}
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="flex overflow-x-auto p-4 gap-2 no-scrollbar">
        {['Todos', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 rounded-full font-bold whitespace-nowrap ${filter === cat ? 'bg-pink-500 text-white' : 'bg-white'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Productos */}
      <main className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-[2rem] p-4 shadow-md">
            <div className="aspect-square rounded-[1.5rem] overflow-hidden bg-gray-100 mb-4">
              <img src={item.image} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-bold">{item.category}</h3>
            <p className="text-xl font-black text-pink-600">{formatPrice(item.price)}</p>
            <button 
              onClick={() => window.open(`https://wa.me/584226388324?text=Hola! Me interesa el diseño: ${item.category}`)}
              className="w-full mt-3 py-3 rounded-xl bg-pink-400 text-white font-bold flex justify-center gap-2"
            >
              <MessageCircle size={20}/> Pedir por WhatsApp
            </button>
            {isAdmin && <button onClick={() => setShowDeleteConfirm(item.id)} className="mt-2 text-red-400 w-full text-sm">Eliminar</button>}
          </div>
        ))}
      </main>

      {/* Botón Flotante Admin */}
      {isAdmin && (
        <button onClick={() => setShowAddModal(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-pink-600 text-white rounded-full shadow-xl flex items-center justify-center">
          <Plus size={30} />
        </button>
      )}

      {/* Modal Agregar (Simplificado) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center">
          <div className="bg-white w-full rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-4">Nuevo Tejido</h2>
            <select className="w-full p-3 border rounded-xl mb-3" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" placeholder="Precio COP" className="w-full p-3 border rounded-xl mb-3" onChange={e => setNewItem({...newItem, price: e.target.value})} />
            <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-4" />
            <button onClick={addItem} className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold">Publicar ✨</button>
            <button onClick={() => setShowAddModal(false)} className="w-full mt-2 text-gray-500">Cancelar</button>
          </div>
        </div>
      )}

      {/* Login Admin */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleLogin} className="bg-white p-6 rounded-3xl w-full max-w-xs text-center">
            <h2 className="font-bold mb-4">Acceso Admin</h2>
            <input type="password" placeholder="PIN" className="w-full p-3 border rounded-xl mb-3 text-center" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
            <button className="w-full py-3 bg-pink-600 text-white rounded-xl">Entrar</button>
          </form>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;700;900&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
                                              }
