import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  Plus, Trash2, Info, Lock, Unlock, MessageCircle, Heart, Sparkles, X, Camera, ShoppingBag
} from 'lucide-react';

// Configuración obtenida de tus capturas
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

const CATEGORIES = ["Blusas", "Flores", "Llaveros", "Vestidos de Bebé", "Tapetes", "Bolsos", "Otros"];

const COLORS = {
  sakuraPink: '#F283AF', // El rosa de tu marca
  softCream: '#FBF4EB',
  deepRose: '#C43670',
  glassWhite: 'rgba(255, 255, 255, 0.8)'
};

export default function SakuraApp() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ price: '', category: 'Blusas', image: '' });

  // Autenticación Anónima para seguridad de Firebase
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Carga de productos en tiempo real
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
  }, [user]);

  const filteredItems = useMemo(() => 
    filter === 'Todos' ? items : items.filter(i => i.category === filter)
  , [items, filter]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPass === '1206') { 
      setIsAdmin(true); 
      setShowAdminLogin(false); 
      setAdminPass(''); 
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewItem(prev => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.image || !newItem.price) return alert("Por favor rellena todo");
    const id = Date.now().toString();
    await setDoc(doc(db, 'products', id), { 
      ...newItem, 
      id, 
      price: parseFloat(newItem.price), 
      createdAt: new Date().toISOString() 
    });
    setShowAddModal(false);
    setNewItem({ price: '', category: 'Blusas', image: '' });
  };

  // Función de WhatsApp mejorada con enlace de imagen
  const sendWhatsApp = (item) => {
    const phoneNumber = "584226388324";
    const message = `¡Hola Otmary! ✨ Me interesa este diseño:\n\n*Categoría:* ${item.category}\n*Precio:* ${item.price} COP\n*Ver imagen:* ${item.image.startsWith('data') ? '[Imagen adjunta en App]' : item.image}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: COLORS.softCream, fontFamily: "'Quicksand', sans-serif" }}>
      
      {/* Header Estilo "Sakura" */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-pink-100 p-5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-pink-100 p-2 rounded-full">
            <Heart size={20} fill={COLORS.sakuraPink} color={COLORS.sakuraPink} />
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: COLORS.deepRose }}>Mis Tejidos</h1>
        </div>
        <button 
          onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)}
          className="text-pink-300 hover:text-pink-500 transition-colors"
        >
          {isAdmin ? <Unlock size={22} /> : <Lock size={22} />}
        </button>
      </header>

      {/* Categorías (Pestañas suaves) */}
      <div className="flex overflow-x-auto p-4 gap-3 no-scrollbar">
        {['Todos', ...CATEGORIES].map(cat => (
          <button 
            key={cat} 
            onClick={() => setFilter(cat)}
            className={`px-5 py-2 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap shadow-sm
              ${filter === cat ? 'bg-pink-500 text-white scale-105' : 'bg-white text-pink-400 hover:bg-pink-50'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Productos - Diseño de Tarjetas */}
      <main className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 text-pink-300 animate-pulse">Cargando tus maravillas...</div>
        ) : filteredItems.map(item => (
          <div key={item.id} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-pink-50 hover:shadow-xl transition-all duration-500">
            <div className="relative aspect-square overflow-hidden">
              <img src={item.image} alt="Tejido" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-pink-600 shadow-sm">
                {item.category}
              </div>
              {isAdmin && (
                <button 
                  onClick={() => deleteDoc(doc(db, 'products', item.id))}
                  className="absolute top-4 right-4 bg-red-500/80 p-2 rounded-full text-white backdrop-blur-sm"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Disponible</p>
                  <p className="text-2xl font-black text-gray-800">{item.price.toLocaleString()} <span className="text-sm font-normal">COP</span></p>
                </div>
                <div className="bg-pink-50 p-2 rounded-xl text-pink-400">
                  <Sparkles size={20} />
                </div>
              </div>

              <button 
                onClick={() => sendWhatsApp(item)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold flex items-center justify-center gap-3 shadow-lg shadow-pink-200 active:scale-95 transition-transform"
              >
                <MessageCircle size={20} />
                Pedir por WhatsApp
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Botón Flotante para Otmary (Admin) */}
      {isAdmin && (
        <button 
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:rotate-90 transition-transform duration-500 z-50"
        >
          <Plus size={32} />
        </button>
      )}

      {/* Modal: Agregar Producto */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Nueva Creación ✨</h2>
              <button onClick={() => setShowAddModal(false)} className="bg-gray-100 p-2 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[150px] relative overflow-hidden">
                {newItem.image ? (
                  <img src={newItem.image} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="text-gray-300 mb-2" size={40} />
                    <p className="text-xs text-gray-400">Sube la foto del tejido</p>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>

              <select 
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-pink-300"
                value={newItem.category} 
                onChange={e => setNewItem({...newItem, category: e.target.value})}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <input 
                type="number" 
                placeholder="Precio en COP" 
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-pink-300"
                onChange={e => setNewItem({...newItem, price: e.target.value})} 
              />

              <button 
                onClick={addItem} 
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-colors"
              >
                Publicar en la Tienda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Login Admin */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[60] bg-pink-50/90 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleLogin} className="bg-white p-8 rounded-[2.5rem] w-full max-w-xs text-center shadow-xl border border-pink-100">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-500">
              <Lock size={30} />
            </div>
            <h2 className="text-xl font-bold mb-6 text-gray-800">Panel de Control</h2>
            <input 
              type="password" 
              placeholder="Ingresa el PIN" 
              className="w-full p-4 bg-gray-50 rounded-2xl border-none text-center mb-4 focus:ring-2 focus:ring-pink-300"
              value={adminPass} 
              onChange={e => setAdminPass(e.target.value)} 
            />
            <button className="w-full py-4 bg-pink-500 text-white rounded-2xl font-bold">Entrar</button>
            <button type="button" onClick={() => setShowAdminLogin(false)} className="mt-4 text-gray-400 text-sm">Cerrar</button>
          </form>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        body { margin: 0; padding: 0; overflow-x: hidden; }
      `}</style>
    </div>
  );
}
