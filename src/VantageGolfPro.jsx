import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, CreditCard, BarChart3, ChevronRight, Target, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import CheckoutForm from './Checkout.jsx';
import AdminPanel from './AdminPanel.jsx';
import { API_BASE_URL } from './config.js';

const formatCLP = (n) => '$' + n.toLocaleString('es-CL');

const VantageGolfPro = () => {
  // --- PRODUCTOS DESDE API ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (res.ok) setProducts(await res.json());
    } catch (e) { console.error('Error fetching products:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // --- ESTADOS ---
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [view, setView] = useState('shop');

  // --- LÓGICA DE NEGOCIO (STOCK HARD-LIMIT) ---
  const getProductStock = (productId) => {
    const p = products.find(pr => pr.id === productId);
    return p ? p.stock : 0;
  };

  const getTotalQtyInCart = (productId) => {
    return cart.filter(i => i.id === productId).reduce((acc, i) => acc + i.qty, 0);
  };

  const addToCart = (product, spec) => {
    if (product.stock <= 0) return;
    const totalInCart = getTotalQtyInCart(product.id);
    if (totalInCart >= product.stock) return;

    const itemInCart = cart.find(i => i.id === product.id && i.selectedSpec === spec);
    if (itemInCart) {
      if (itemInCart.qty >= product.stock) return;
      setCart(cart.map(i => i === itemInCart ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { ...product, selectedSpec: spec, qty: 1 }]);
    }
    setIsCartOpen(true);
  };

  const updateQty = (cartIndex, delta) => {
    setCart(cart.map((i, idx) => {
      if (idx !== cartIndex) return i;
      const maxStock = getProductStock(i.id);
      const newQty = i.qty + delta;
      return { ...i, qty: Math.max(1, Math.min(newQty, maxStock)) };
    }));
  };

  const removeFromCart = (cartIndex) => setCart(cart.filter((_, idx) => idx !== cartIndex));

  const subtotal = useMemo(() => cart.reduce((acc, i) => acc + (i.price * i.qty), 0), [cart]);
  const shipping = subtotal > 500000 ? 0 : 5000;
  const cartCount = useMemo(() => cart.reduce((acc, i) => acc + i.qty, 0), [cart]);

  if (view === 'checkout') {
    return (
      <CheckoutForm
        cart={cart}
        subtotal={subtotal}
        onBack={() => { setView('shop'); setIsCartOpen(false); }}
        onPurchaseComplete={() => { setCart([]); fetchProducts(); }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl z-40 border-b border-slate-100 px-8 py-5 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tighter cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          VANTAGE<span className="text-emerald-700">GOLF</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium uppercase tracking-widest">
          <a href="#tecnologia" className="hover:text-emerald-700 transition">Tecnología</a>
          <a href="#catalogo" className="hover:text-emerald-700 transition">Colecciones</a>
          <a href="#fitting" className="hover:text-emerald-700 transition">Fitting</a>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* PANEL ADMIN */}
      {isAdminOpen && (
        <AdminPanel onProductsChange={fetchProducts} />
      )}

      {/* HERO SECTION */}
      <section className={`relative h-[90vh] flex items-center justify-center overflow-hidden bg-slate-900 ${isAdminOpen ? '' : 'mt-[76px]'}`}>
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80"
            alt="Campo de golf"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <span className="text-emerald-400 font-bold tracking-[0.3em] uppercase text-sm mb-4 block">
            Serie Limitada 2026
          </span>
          <h1 className="text-5xl md:text-7xl font-light text-white leading-tight mb-6">
            La Precisión es la única <br />
            <strong className="font-bold">Ventaja Real.</strong>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light">
            Diseñados con fibra de carbono forjada para quienes no aceptan menos que la perfección en cada swing.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a href="#catalogo" className="bg-emerald-600 text-white px-10 py-4 text-lg font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 transition shadow-xl">
              EXPLORAR CATÁLOGO <ChevronRight size={20} />
            </a>
            <a href="#tecnologia" className="border border-white/30 text-white px-10 py-4 text-lg font-bold backdrop-blur-sm hover:bg-white/10 transition text-center">
              VER TECNOLOGÍA
            </a>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section id="tecnologia" className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-emerald-600 font-bold tracking-[0.2em] uppercase text-sm">Ingeniería de Élite</span>
          <h2 className="text-3xl md:text-5xl font-light mt-4">
            Tecnología que se <strong className="font-bold">siente</strong> en cada golpe
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-16">
          <div className="flex flex-col items-start">
            <div className="p-4 bg-emerald-50 rounded-2xl mb-6 text-emerald-700"><Target size={32} /></div>
            <h3 className="text-xl font-bold mb-4">Punto Dulce Expandido</h3>
            <p className="text-slate-600 leading-relaxed">Nuestra tecnología de cara variable mantiene la velocidad de bola incluso en impactos fuera del centro.</p>
          </div>
          <div className="flex flex-col items-start">
            <div className="p-4 bg-emerald-50 rounded-2xl mb-6 text-emerald-700"><Zap size={32} /></div>
            <h3 className="text-xl font-bold mb-4">Aerodinámica de Élite</h3>
            <p className="text-slate-600 leading-relaxed">Reducción del 12% en la resistencia al aire, traduciéndose en un aumento inmediato de la velocidad de cabeza.</p>
          </div>
          <div className="flex flex-col items-start">
            <div className="p-4 bg-emerald-50 rounded-2xl mb-6 text-emerald-700"><ShieldCheck size={32} /></div>
            <h3 className="text-xl font-bold mb-4">Garantía Pro-Performance</h3>
            <p className="text-slate-600 leading-relaxed">Cada set es calibrado individualmente por maestros artesanos para asegurar specs de tour.</p>
          </div>
        </div>
      </section>

      {/* CATÁLOGO CON SPECS */}
      <section id="catalogo" className="py-20 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-emerald-600 font-bold tracking-[0.2em] uppercase text-sm">Colección 2026</span>
          <h2 className="text-3xl md:text-5xl font-light mt-4">
            Nuestra <strong className="font-bold">Selección Curada</strong>
          </h2>
          <p className="text-slate-500 mt-3 italic">Equipamiento verificado por la USGA. Envío gratis en pedidos +$500.000.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map(product => (
            <div
              key={product.id}
              className={`group bg-white border border-slate-200 rounded-2xl p-6 transition-all duration-300 ${product.stock === 0 ? 'opacity-60' : 'hover:shadow-2xl hover:-translate-y-1'}`}
            >
              <div className="relative aspect-square mb-6 overflow-hidden rounded-xl bg-slate-100">
                <img src={product.img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                    <span className="bg-white text-slate-900 px-4 py-2 font-black text-xs uppercase tracking-widest">Agotado</span>
                  </div>
                )}
                {product.stock > 0 && product.stock <= 3 && (
                  <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] px-3 py-1 font-bold uppercase tracking-wider rounded-full">
                    Últimas {product.stock} und
                  </span>
                )}
              </div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">{product.category}</span>
                  <h3 className="text-xl font-bold">{product.name}</h3>
                </div>
                <span className="text-2xl font-light">{formatCLP(product.price)}</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                {product.stock > 0 ? `${product.stock} en stock` : 'Sin stock'}
              </p>

              <div className="flex flex-wrap gap-2">
                {product.specs.map(spec => (
                  <button
                    key={spec}
                    disabled={product.stock === 0}
                    onClick={() => addToCart(product, spec)}
                    className={`flex-grow border py-2.5 px-3 text-xs font-bold uppercase tracking-tight transition cursor-pointer ${
                      product.stock === 0
                        ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                        : 'border-slate-200 bg-slate-50 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                    }`}
                  >
                    + {spec}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="bg-white py-20 px-8 border-y border-slate-100">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-emerald-600 font-bold tracking-[0.2em] uppercase text-sm">Trusted by Pros</span>
          <h2 className="text-3xl md:text-4xl font-light mt-4 mb-12">
            La elección de quienes <strong className="font-bold">compiten para ganar</strong>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { text: "Desde que cambié a Vantage, mi dispersión en hierros 7 bajó 15 yardas. La sensación al impacto es incomparable.", name: "Carlos M.", club: "Handicap 6 · Valderrama" },
              { text: "El fitting personalizado marcó la diferencia. Nunca había tenido hierros que se adaptaran así a mi swing.", name: "Andrea L.", club: "Handicap 12 · El Prat" },
              { text: "Material de nivel tour a un precio que tiene sentido. La garantía Pro-Performance da una confianza total.", name: "Javier R.", club: "Handicap 3 · PGA Catalunya" },
            ].map((review, i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-2xl text-left">
                <div className="flex gap-1 text-emerald-600 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-600 mb-4 italic leading-relaxed">"{review.text}"</p>
                <p className="font-bold text-sm">{review.name}</p>
                <p className="text-slate-400 text-sm">{review.club}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FITTING */}
      <section id="fitting" className="bg-slate-900 py-20 px-8 text-center text-white">
        <span className="text-emerald-400 font-bold tracking-[0.2em] uppercase text-sm block mb-4">Fitting Personalizado</span>
        <h2 className="text-3xl md:text-5xl font-light mb-4">¿Listo para dominar el campo?</h2>
        <p className="text-slate-400 max-w-xl mx-auto mb-10 font-light">
          Agenda una sesión de fitting con nuestros expertos certificados y descubre el set perfecto para tu juego.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <a href="#" className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-10 py-4 text-lg font-bold hover:bg-emerald-500 transition shadow-xl">
            AGENDA TU FITTING <ArrowRight size={20} />
          </a>
          <a href="#catalogo" className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-10 py-4 text-lg font-bold hover:bg-white/10 transition">
            EXPLORA LA COLECCIÓN
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 px-8 text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-bold tracking-tighter text-white">
            VANTAGE<span className="text-emerald-500">GOLF</span>
          </div>
          <div className="flex gap-8 text-sm">
            <a href="#" className="hover:text-white transition">Privacidad</a>
            <a href="#" className="hover:text-white transition">Términos</a>
            <a href="#" className="hover:text-white transition">Contacto</a>
            <button onClick={() => { setIsAdminOpen(!isAdminOpen); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition cursor-pointer">{isAdminOpen ? '×' : '·'}</button>
          </div>
          <p className="text-sm">© 2026 Vantage Golf. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* CARRITO SIDEBAR */}
      <div className={`fixed inset-0 z-50 transition-all ${isCartOpen ? 'visible' : 'invisible'}`}>
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${isCartOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsCartOpen(false)}
        />
        <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-500 ease-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">TU BOLSA DE GOLF</h2>
              <button onClick={() => setIsCartOpen(false)} className="hover:rotate-90 transition duration-300 cursor-pointer">
                <X size={28} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingCart size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 mb-4 italic">La bolsa está vacía.</p>
                  <button onClick={() => setIsCartOpen(false)} className="text-emerald-700 font-bold underline underline-offset-4 cursor-pointer">
                    Selecciona tu ventaja competitiva
                  </button>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const maxStock = getProductStock(item.id);
                  const atMax = item.qty >= maxStock;
                  return (
                  <div key={idx} className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <img src={item.img} alt={item.name} className="w-16 h-16 rounded-lg object-cover shadow-sm" />
                    <div className="flex-grow">
                      <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-emerald-700 font-bold uppercase">{item.selectedSpec}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => updateQty(idx, -1)}
                          disabled={item.qty <= 1}
                          className={`p-1 border rounded cursor-pointer ${item.qty <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white'}`}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold">{item.qty}</span>
                        <button
                          onClick={() => updateQty(idx, 1)}
                          disabled={atMax}
                          className={`p-1 border rounded cursor-pointer ${atMax ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white'}`}
                        >
                          <Plus size={12} />
                        </button>
                        {atMax && <span className="text-[9px] text-red-500 font-bold">MÁX</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCLP(item.price * item.qty)}</p>
                      <button onClick={() => removeFromCart(idx)} className="text-slate-300 hover:text-red-500 transition cursor-pointer mt-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t pt-6 mt-6 space-y-3">
                <div className="flex justify-between text-slate-500 text-sm">
                  <span>Subtotal</span>
                  <span>{formatCLP(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-sm">
                  <span>Envío Premium</span>
                  <span className={shipping === 0 ? 'text-emerald-600 font-bold' : ''}>
                    {shipping === 0 ? 'GRATIS' : formatCLP(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-2xl font-black border-t pt-4">
                  <span>TOTAL</span>
                  <span>{formatCLP(subtotal + shipping)}</span>
                </div>

                <button
                  onClick={() => { setIsCartOpen(false); setView('checkout'); window.scrollTo(0, 0); }}
                  className="w-full bg-emerald-600 text-white py-5 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl active:scale-95 cursor-pointer mt-2"
                >
                  <CreditCard size={20} /> FINALIZAR COMPRA
                </button>
                <p className="text-[10px] text-center text-slate-400 uppercase tracking-wide">
                  Envío asegurado vía FedEx International Premium
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VantageGolfPro;
