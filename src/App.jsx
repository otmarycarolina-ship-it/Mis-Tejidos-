import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy, updateDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  Plus, Trash2, Info, Lock, Unlock, MessageCircle, Heart, Sparkles, X, Camera, Pencil, Wallet, Clock, AlertCircle, CheckCircle
} from 'lucide-react';

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

const CATEGORIES = ["Blusas", "Flores", "Llaveros", "Bebé", "Tapetes", "Bolsos", "Otros"];
const CLOTHES_SIZES = ["XS", "S", "M", "L", "XL"];
const BABY_SIZES = ["0-3 Meses", "3-6 Meses", "6-9 Meses", "9-12 Meses", "2 Años", "3 Años"];
const OBJECT_SIZES = ["Pequeño", "Mediano", "Grande"];

const COLORS = {
  sakuraPink: '#F283AF',
  softCream: '#FBF4EB',
  deepRose: '#C43670',
  blush: '#FBD9E5',
  text: '#5D4037'
};

const ProductCard = ({ item, isAdmin, openEdit, sendWhatsApp, isLocked, preselectedSize }) => {
  const hasSizes = item.sizes && Object.keys(item.sizes).length > 0;
  const sizeOrder = [...BABY_SIZES, ...CLOTHES_SIZES, ...OBJECT_SIZES];
  const sortedSizes = hasSizes 
    ? sizeOrder.filter(size => Object.keys(item.sizes).includes(size))
    : [];

  const [selectedSize, setSelectedSize] = useState(preselectedSize || (hasSizes ? sortedSizes[0] : null));
  const currentPrice = hasSizes ? (item.sizes[selectedSize]?.price || item.sizes[selectedSize] || 0) : (item.price || 0);
  const currentCm = (hasSizes && item.sizes[selectedSize]?.cm) ? ` (${item.sizes[selectedSize].cm})` : '';

  return (
    <div className="bg-white rounded-[3rem] p-4 shadow-xl transition-all">
      <div className="relative aspect-square rounded-[2.2rem] overflow-hidden bg-[#FAF7F2] mb-4 border border-pink-50">
        <img src={item.image} className="w-full h-full object-contain p-2" alt={item.category} />
        {isAdmin && !isLocked && (
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button onClick={() => openEdit(item)} className="bg-white/90 p-3 rounded-2xl text-blue-500 shadow-lg"><Pencil size={20} /></button>
            <button onClick={() => deleteDoc(doc(db, 'products', item.id))} className="bg-white/90 p-3 rounded-2xl text-red-500 shadow-lg"><Trash2 size={20} /></button>
          </div>
        )}
      </div>
      <div className="px-2 text-center">
        <h3 className="text-2xl font-black mb-1" style={{ color: COLORS.deepRose }}>{item.category}</h3>
        
        {hasSizes && (
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {sortedSizes.map(size => (
              <button
                key={size}
                disabled={isLocked}
                onClick={() => setSelectedSize(size)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition-all
                  ${selectedSize === size ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-pink-100 text-pink-300'}
                  ${isLocked && selectedSize !== size ? 'opacity-30' : ''}`}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        <p className="text-xl font-bold mb-4">
          {currentPrice ? currentPrice.toLocaleString() : '0'} COP 
          <span className="text-sm text-pink-400 ml-1">
            {item.isPerUnit ? 'c/u' : ''} {selectedSize ? `(${selectedSize}${currentCm})` : ''}
          </span>
        </p>

        {!isLocked && (
          <button onClick={() => sendWhatsApp(item, selectedSize, currentPrice, currentCm)}
            className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 shadow-pink-200"
            style={{ backgroundColor: COLORS.sakuraPink }}
          >
            <MessageCircle size={20} fill="white" /> Pedir por WhatsApp
          </button>
        )}
        
        {isLocked && (
          <div className="py-2 px-4 bg-pink-50 rounded-xl text-pink-600 font-bold text-sm">
            ✨ Opción seleccionada para el pedido
          </div>
        )}
      </div>
    </div>
  );
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
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [sizeType, setSizeType] = useState('none');
  const [newItem, setNewItem] = useState({ price: '', category: 'Blusas', image: '', sizes: {}, isPerUnit: false });

  const [lockedItem, setLockedItem] = useState(null);
  const [lockedSize, setLockedSize] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const productSize = params.get('size');
    if (productId && items.length > 0) {
      const specificItem = items.find(i => i.id === productId);
      if (specificItem) {
        setLockedItem(specificItem);
        setLockedSize(productSize);
      }
    }
  }, [items]);

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
    if (!newItem.image) return alert("Sube una imagen");
    
    const finalData = {
      ...newItem,
      price: sizeType !== 'none' ? 0 : parseFloat(newItem.price || 0),
      sizes: sizeType !== 'none' ? newItem.sizes : {}
    };

    try {
      if (isEditing) {
        await updateDoc(doc(db, 'products', editId), finalData);
      } else {
        const id = Date.now().toString();
        await setDoc(doc(db, 'products', id), { ...finalData, id, createdAt: new Date().toISOString() });
      }
      closeModal();
    } catch (err) { console.error(err); }
  };

  const openEdit = (item) => {
    setNewItem({ 
        price: item.price || '', 
        category: item.category, 
        image: item.image, 
        sizes: item.sizes || {},
        isPerUnit: item.isPerUnit || false 
    });
    if (item.sizes && Object.keys(item.sizes).length > 0) {
      const keys = Object.keys(item.sizes);
      if (keys.some(k => BABY_SIZES.includes(k))) setSizeType('baby');
      else if (keys.includes('XS')) setSizeType('clothes');
      else setSizeType('objects');
    } else {
      setSizeType('none');
    }
    setEditId(item.id);
    setIsEditing(true);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setIsEditing(false);
    setSizeType('none');
    setNewItem({ price: '', category: 'Blusas', image: '', sizes: {}, isPerUnit: false });
  };

  const sendWhatsApp = (item, selectedSize, currentPrice, currentCm) => {
    const phoneNumber = "584226388324";
    const baseUrl = window.location.origin + window.location.pathname;
    const productLink = `${baseUrl}?id=${item.id}${selectedSize ? `&size=${encodeURIComponent(selectedSize)}` : ''}`;
    const tallaInfo = selectedSize ? `\n*Talla/Tamaño:* ${selectedSize}${currentCm}` : '';
    const unitInfo = item.isPerUnit ? ' (por unidad)' : '';
    const precioFinal = currentPrice ? currentPrice.toLocaleString() : '0';
    
    const message = `¡Hola Otmary! ✨ Me interesa encargar este diseño:\n\n*Producto:* ${item.category}${unitInfo}${tallaInfo}\n*Precio:* ${precioFinal} COP\n\nLink del pedido:\n${productLink}`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: COLORS.softCream, color: COLORS.text, fontFamily: "'Quicksand', sans-serif" }}>
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b-4 border-white p-5 flex justify-between items-center rounded-b-[2.5rem] shadow-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Heart size={22} fill={COLORS.sakuraPink} color={COLORS.sakuraPink} />
            <h1 className="text-xl font-black" style={{ color: COLORS.deepRose }}>Mis Tejidos</h1>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold ml-7 text-pink-400">Hechos con amor</span>
        </div>
        {!lockedItem && (
          <div className="flex gap-3">
            <button onClick={() => setShowInfo(true)} className="p-2 bg-pink-100 rounded-xl text-pink-500"><Info size={22} /></button>
            <button onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} className="p-2 bg-pink-100 rounded-xl text-pink-500">
              {isAdmin ? <Unlock size={22} /> : <Lock size={22} />}
            </button>
          </div>
        )}
        {lockedItem && (
          <button onClick={() => window.location.href = window.location.pathname} className="p-2 bg-pink-500 rounded-xl text-white">
            <X size={22} />
          </button>
        )}
      </header>

      {!lockedItem && (
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
      )}

      <main className="p-4 flex justify-center">
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-8">
          {loading ? (
            <div className="col-span-full text-center py-20 text-pink-300">Cargando tus tejidos...</div>
          ) : lockedItem ? (
            <div className="col-span-full max-w-md mx-auto w-full">
              <h2 className="text-center font-bold text-pink-400 mb-4 uppercase tracking-widest text-sm">Resumen de tu pedido</h2>
              <ProductCard item={lockedItem} isAdmin={false} isLocked={true} preselectedSize={lockedSize} sendWhatsApp={sendWhatsApp} />
              <button onClick={() => window.location.href = window.location.pathname} className="w-full mt-6 text-pink-400 font-bold py-2">Ver todo el catálogo</button>
            </div>
          ) : filteredItems.map(item => (
            <ProductCard key={item.id} item={item} isAdmin={isAdmin} openEdit={openEdit} sendWhatsApp={sendWhatsApp} />
          ))}
        </div>
      </main>

      {isAdmin && !lockedItem && (
        <button onClick={() => setShowAddModal(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 border-4 border-white">
          <Plus size={32} />
        </button>
      )}

      {/* Modal: ¿Cómo encargar? */}
      {showInfo && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
            <div className="p-5 text-center bg-pink-50">
              <Sparkles size={28} color={COLORS.sakuraPink} className="mx-auto mb-1" />
              <h2 className="text-lg font-black text-pink-600 leading-tight">¿Cómo encargar tu pedido?</h2>
            </div>
            <div className="p-6 space-y-4 text-center">
              <div className="space-y-1">
                <Wallet className="mx-auto text-pink-400" size={20}/>
                <p className="text-[14px] leading-relaxed">Todos los pedidos se realizan con un <b>anticipo del 50%</b> para asegurar tu lugar en la agenda.</p>
              </div>
              <div className="space-y-1">
                <CheckCircle className="mx-auto text-green-400" size={20}/>
                <p className="text-[14px] leading-relaxed">Se entrega el pedido cuando se termine de cancelar la otra parte, es decir, <b>el otro 50%</b>.</p>
              </div>
              <div className="space-y-1">
                <AlertCircle className="mx-auto text-red-300" size={20}/>
                <p className="text-[14px] leading-relaxed">En caso de cancelación de algún pedido <b>no se devolverá el anticipo</b>.</p>
              </div>
              <div className="space-y-1">
                <Clock className="mx-auto text-amber-300" size={20}/>
                <p className="text-[14px] leading-relaxed">Como son piezas hechas a mano, el <b>tiempo de entrega varía</b> según el diseño.</p>
              </div>
              <button onClick={() => setShowInfo(false)} className="w-full py-3.5 bg-pink-500 text-white rounded-2xl font-bold mt-2 shadow-lg shadow-pink-100 transition-transform active:scale-95">¡Entendido! ♡</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl my-auto">
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: COLORS.deepRose }}>{isEditing ? 'Editar Diseño' : 'Nueva Creación'}</h2>
            
            <div className="space-y-4">
              <label className="block w-full h-40 bg-pink-50 rounded-3xl border-4 border-dashed border-pink-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
                {newItem.image ? <img src={newItem.image} className="w-full h-full object-contain" /> : <Camera className="text-pink-200" size={40} />}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-500" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Botón Switch de Precio por Unidad (COMO EN TU IMAGEN) */}
              <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 flex items-center justify-between">
                <span className="font-bold text-pink-600 text-sm">¿Precio por unidad (c/u)?</span>
                <button 
                  onClick={() => setNewItem({...newItem, isPerUnit: !newItem.isPerUnit})}
                  className={`w-14 h-7 rounded-full transition-all relative ${newItem.isPerUnit ? 'bg-pink-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${newItem.isPerUnit ? 'left-8' : 'left-1'}`} />
                </button>
              </div>

              {/* Selector de Escala de Tallas (ESTILO CUADRÍCULA DE TUS IMÁGENES) */}
              <div className="bg-pink-50/30 p-5 rounded-[2rem] border border-pink-100">
                <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-4">Escala de tallas:</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'none', label: 'Único' },
                    { id: 'clothes', label: 'Ropa' },
                    { id: 'baby', label: 'Bebé' },
                    { id: 'objects', label: 'Accesorios' }
                  ].map(type => (
                    <button 
                      key={type.id}
                      onClick={() => setSizeType(type.id)}
                      className={`py-4 px-2 rounded-xl font-bold transition-all border-2 text-sm
                        ${sizeType === type.id 
                          ? 'bg-pink-500 border-pink-500 text-white shadow-md' 
                          : 'bg-white border-white text-pink-200'}`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs de Precios Dinámicos */}
              <div className="space-y-3">
                {sizeType === 'none' ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold ml-2 text-pink-400 uppercase">Precio único</p>
                    <input type="number" placeholder="0" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {(sizeType === 'clothes' ? CLOTHES_SIZES : sizeType === 'baby' ? BABY_SIZES : OBJECT_SIZES).map(size => (
                      <div key={size} className="space-y-1">
                        <p className="text-[10px] font-bold ml-2 text-pink-400 uppercase">{size}</p>
                        <div className="flex flex-col gap-1">
                          <input 
                            type="number" 
                            placeholder="0" 
                            className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold" 
                            value={newItem.sizes[size]?.price || newItem.sizes[size] || ''} 
                            onChange={e => setNewItem({ ...newItem, sizes: { ...newItem.sizes, [size]: { ...(newItem.sizes[size] || {}), price: parseFloat(e.target.value) } }})} 
                          />
                          {sizeType === 'objects' && (
                            <input 
                              type="text" 
                              placeholder="cm" 
                              className="w-full p-2 bg-pink-50/50 rounded-lg text-[10px] font-bold text-pink-400" 
                              value={newItem.sizes[size]?.cm || ''} 
                              onChange={e => setNewItem({ ...newItem, sizes: { ...newItem.sizes, [size]: { ...(newItem.sizes[size] || {}), cm: e.target.value } }})} 
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={saveItem} className="w-full py-5 bg-pink-600 text-white rounded-[1.5rem] font-bold shadow-xl shadow-pink-100 mt-4 active:scale-95 transition-transform">
                {isEditing ? 'Guardar Cambios' : 'Publicar Diseño'}
              </button>
              <button onClick={closeModal} className="w-full text-gray-400 font-bold py-2 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 z-[60] bg-pink-50/90 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleLogin} className="bg-white p-8 rounded-[2.5rem] w-full max-w-xs text-center shadow-xl border border-pink-100">
            <h2 className="text-xl font-bold mb-6">Acceso Admin</h2>
            <input type="password" placeholder="PIN" className="w-full p-4 bg-gray-50 rounded-2xl text-center mb-4 focus:ring-2 focus:ring-pink-300 border-none font-bold" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
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
