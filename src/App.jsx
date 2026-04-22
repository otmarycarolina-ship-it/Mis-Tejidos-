import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy, updateDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  Plus, Trash2, Info, Lock, Unlock, MessageCircle, Heart, Sparkles, X, Camera, Pencil, Wallet, Clock, AlertCircle
} from 'lucide-react';

// Configuración de Firebase
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
  sakuraPink: '#F283AF',
  softCream: '#FBF4EB',
  deepRose: '#C43670',
  blush: '#FBD9E5',
  text: '#5D4037'
};

export default function SakuraApp() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [filter, setFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);
  
  // Estados para Edición
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [newItem, setNewItem] = useState({ price: '', category: 'Blusas', image: '' });

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

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

  const saveItem = async (e) => {
    e.preventDefault();
    if (!newItem.image || !newItem.price) return alert("Completa los datos");
    
    try {
      if (isEditing) {
        const docRef = doc(db, 'products', editId);
        await updateDoc(docRef, {
          price: parseFloat(newItem.price),
          category: newItem.category,
          image: newItem.image
        });
      } else {
        const id = Date.now().toString();
        await setDoc(doc(db, 'products', id), { 
          ...newItem, 
          id, 
          price: parseFloat(newItem.price), 
          createdAt: new Date().toISOString() 
        });
      }
      closeModal();
    } catch (err) { console.error(err); }
  };

  const openEdit = (item) => {
    setNewItem({ price: item.price, category: item.category, image: item.image });
    setEditId(item.id);
    setIsEditing(true);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setIsEditing(false);
    setEditId(null);
    setNewItem({ price: '', category: 'Blusas', image: '' });
  };

  const sendWhatsApp = (item) => {
    const phoneNumber = "584226388324";
    // Usamos el link de la página actual para que tú puedas entrar y ver el catálogo
    const pageLink = window.location.href;
    const message = `¡Hola Otmary! ✨ Me interesa encargar este diseño:\n\n*Producto:* ${item.category}\n*Precio:* ${item.price.toLocaleString()} COP\n\nLink del catálogo: ${pageLink}`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: COLORS.softCream, color: COLORS.text, fontFamily: "'Quicksand', sans-serif" }}>
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b-4 border-white p-5 flex justify-between items-center rounded-b-[2.5rem] shadow-sm">
        <div className="flex items-center gap-2">
          <Heart size={24} fill={COLORS.sakuraPink} color={COLORS.sakuraPink} />
          <h1 className="text-xl font-black" style={{ color: COLORS.deepRose }}>Mis Tejidos</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowInfo(true)} className="p-2 bg-pink-100 rounded-xl text-pink-500">
            <Info size={22} />
          </button>
          <button onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} className="p-2 bg-pink-100 rounded-xl text-pink-500">
            {isAdmin ? <Unlock size={22} /> : <Lock size={22} />}
          </button>
        </div>
      </header>

      {/* Categorías */}
      <div className="flex overflow-x-auto p-4 gap-3 no-scrollbar">
        {['Todos', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-6 py-2 rounded-full font-bold transition-all shadow-sm border-2 border-white
              ${filter === cat ? 'bg-pink-500 text-white' : 'bg-white text-pink-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <main className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-full text-center py-20 text-pink-300">Cargando...</div>
        ) : filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-[3rem] p-4 shadow-xl border-t-8 border-transparent hover:border-pink-100 transition-all">
            <div className="relative aspect-[4/5] rounded-[2.2rem] overflow-hidden bg-pink-50 mb-4">
              <img src={item.image} className="w-full h-full object-cover" />
              {isAdmin && (
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button onClick={() => openEdit(item)} className="bg-white/90 p-3 rounded-2xl text-blue-500 shadow-lg">
                    <Pencil size={20} />
                  </button>
                  <button onClick={() => deleteDoc(doc(db, 'products', item.id))} className="bg-white/90 p-3 rounded-2xl text-red-500 shadow-lg">
                    <Trash2 size={20} />
                  </button>
                </div>
              )}
            </div>
            <div className="px-2 text-center">
              <h3 className="text-2xl font-black mb-1" style={{ color: COLORS.deepRose }}>{item.category}</h3>
              <p className="text-xl font-bold mb-4">{item.price.toLocaleString()} COP</p>
              <button onClick={() => sendWhatsApp(item)}
                className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                style={{ backgroundColor: COLORS.sakuraPink }}
              >
                <MessageCircle size={20} fill="white" /> Pedir por WhatsApp
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Botón Flotante Admin */}
      {isAdmin && (
        <button onClick={() => setShowAddModal(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 border-4 border-white"
        >
          <Plus size={32} />
        </button>
      )}

      {/* Modal: Info Encargos */}
      {showInfo && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm p-6 flex items-center justify-center">
          <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
            <div className="p-8 text-center bg-pink-100">
              <Heart size={32} fill={COLORS.sakuraPink} color={COLORS.sakuraPink} className="mx-auto mb-2" />
              <h2 className="text-2xl font-black text-pink-600">¿Cómo encargar?</h2>
            </div>
            <div className="p-8 space-y-4">
              <div className="flex gap-3"><Wallet className="text-pink-400"/> <p className="text-sm">Anticipo del <b>50%</b> para agendar.</p></div>
              <div className="flex gap-3"><AlertCircle className="text-red-400"/> <p className="text-sm">No hay devolución de anticipo por cancelación.</p></div>
              <div className="flex gap-3"><Clock className="text-amber-400"/> <p className="text-sm">Tiempo de entrega varía según el diseño.</p></div>
              <button onClick={() => setShowInfo(false)} className="w-full py-4 bg-pink-500 text-white rounded-2xl font-bold mt-4">¡Entendido! ♡</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar/Editar */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center">{isEditing ? 'Editar Diseño' : 'Nueva Creación'}</h2>
            <div className="space-y-4">
              <label className="block w-full h-40 bg-pink-50 rounded-3xl border-4 border-dashed border-pink-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                {newItem.image ? <img src={newItem.image} className="w-full h-full object-cover" /> : <Camera className="text-pink-200" size={40} />}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              <select className="w-full p-4 bg-gray-50 rounded-2xl border-none" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="Precio COP" className="w-full p-4 bg-gray-50 rounded-2xl border-none" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
              <button onClick={saveItem} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold shadow-xl">
                {isEditing ? 'Guardar Cambios' : 'Publicar'}
              </button>
              <button onClick={closeModal} className="w-full text-gray-400 font-bold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Login */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[60] bg-pink-50/90 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleLogin} className="bg-white p-8 rounded-[2.5rem] w-full max-w-xs text-center shadow-xl border border-pink-100">
            <h2 className="text-xl font-bold mb-6">Acceso Admin</h2>
            <input type="password" placeholder="PIN" className="w-full p-4 bg-gray-50 rounded-2xl text-center mb-4" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
            <button className="w-full py-4 bg-pink-500 text-white rounded-2xl font-bold shadow-lg">Entrar</button>
            <button type="button" onClick={() => setShowAdminLogin(false)} className="mt-4 text-gray-300">Cerrar</button>
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
