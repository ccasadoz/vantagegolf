import React, { useState } from 'react';
import { ShoppingCart, X, Plus, ChevronRight, Target, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

const GolfApp = () => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const products = [
    { id: 1, name: "Hierros Apex Forged", price: 1250, image: "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&q=80&w=400", desc: "Set 4-PW, Vara de Grafito" },
    { id: 2, name: "Driver Vantage Z1", price: 599, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=400", desc: "Ajustable, 9.5 grados" },
    { id: 3, name: "Putter Precision Blade", price: 349, image: "https://images.unsplash.com/photo-1592919010384-d730d2ed1f1e?auto=format&fit=crop&q=80&w=400", desc: "Balanceado por fresado CNC" },
  ];

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">

      {/* Navbar con Carrito Real */}
      <nav className="flex justify-between items-center px-8 py-6 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
        <div className="text-2xl font-bold tracking-tighter text-slate-900">
          VANTAGE<span className="text-emerald-700">GOLF</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium uppercase tracking-widest">
          <a href="#tecnologia" className="hover:text-emerald-700 transition">Tecnología</a>
          <a href="#catalogo" className="hover:text-emerald-700 transition">Colecciones</a>
          <a href="#fitting" className="hover:text-emerald-700 transition">Fitting Custom</a>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <ShoppingCart size={24} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
              {cart.reduce((a, b) => a + b.qty, 0)}
            </span>
          )}
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80"
            alt="Campo de golf al atardecer"
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
            <a href="#catalogo" className="bg-emerald-600 text-white px-10 py-4 text-lg font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 transition shadow-xl cursor-pointer">
              EXPLORAR CATÁLOGO <ChevronRight size={20} />
            </a>
            <a href="#tecnologia" className="border border-white/30 text-white px-10 py-4 text-lg font-bold backdrop-blur-sm hover:bg-white/10 transition cursor-pointer text-center">
              VER TECNOLOGÍA
            </a>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section id="tecnologia" className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-emerald-600 font-bold tracking-[0.2em] uppercase text-sm">Ingeniería de Élite</span>
          <h2 className="text-3xl md:text-5xl font-light mt-4">
            Tecnología que se <strong className="font-bold">siente</strong> en cada golpe
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-16">
          <div className="flex flex-col items-start">
            <div className="p-4 bg-emerald-50 rounded-2xl mb-6 text-emerald-700">
              <Target size={32} />
            </div>
            <h3 className="text-xl font-bold mb-4">Punto Dulce Expandido</h3>
            <p className="text-slate-600 leading-relaxed">
              Nuestra tecnología de cara variable mantiene la velocidad de bola incluso en impactos fuera del centro. Más consistencia, menos frustraciones.
            </p>
          </div>
          <div className="flex flex-col items-start">
            <div className="p-4 bg-emerald-50 rounded-2xl mb-6 text-emerald-700">
              <Zap size={32} />
            </div>
            <h3 className="text-xl font-bold mb-4">Aerodinámica de Élite</h3>
            <p className="text-slate-600 leading-relaxed">
              Reducción del 12% en la resistencia al aire, traduciéndose en un aumento inmediato de la velocidad de cabeza. Yardas extra sin esfuerzo extra.
            </p>
          </div>
          <div className="flex flex-col items-start">
            <div className="p-4 bg-emerald-50 rounded-2xl mb-6 text-emerald-700">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold mb-4">Garantía Pro-Performance</h3>
            <p className="text-slate-600 leading-relaxed">
              Cada set es calibrado individualmente por maestros artesanos para asegurar specs de tour. Certificado de autenticidad incluido.
            </p>
          </div>
        </div>
      </section>

      {/* Catálogo de Productos */}
      <section id="catalogo" className="py-20 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-emerald-600 font-bold tracking-[0.2em] uppercase text-sm">Colección 2026</span>
          <h2 className="text-3xl md:text-5xl font-light mt-4">
            Nuestra <strong className="font-bold">Selección Curada</strong>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {products.map(product => (
            <div key={product.id} className="group border border-slate-100 bg-white p-6 rounded-xl hover:shadow-2xl transition-all duration-300">
              <div className="aspect-square bg-slate-50 rounded-lg mb-6 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">{product.name}</h3>
              <p className="text-slate-500 text-sm mb-4">{product.desc}</p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-light">${product.price.toLocaleString()}</span>
                <button
                  onClick={() => addToCart(product)}
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} /> AÑADIR
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-white py-20 px-8 border-y border-slate-100">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-emerald-600 font-bold tracking-[0.2em] uppercase text-sm">Trusted by Pros</span>
          <h2 className="text-3xl md:text-4xl font-light mt-4 mb-12">
            La elección de quienes <strong className="font-bold">compiten para ganar</strong>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { text: "Desde que cambié a Vantage, mi dispersión en hierros 7 bajó 15 yardas. La sensación al impacto es incomparable.", name: "Carlos M.", club: "Handicap 6 · Club de Golf Valderrama" },
              { text: "El fitting personalizado marcó la diferencia. Nunca había tenido hierros que se adaptaran así a mi swing.", name: "Andrea L.", club: "Handicap 12 · Real Club de Golf El Prat" },
              { text: "Material de nivel tour a un precio que tiene sentido. La garantía Pro-Performance da una confianza total.", name: "Javier R.", club: "Handicap 3 · PGA Catalunya Resort" },
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

      {/* CTA Final */}
      <section id="fitting" className="bg-slate-900 py-20 px-8 text-center text-white">
        <span className="text-emerald-400 font-bold tracking-[0.2em] uppercase text-sm block mb-4">
          Fitting Personalizado
        </span>
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

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 px-8 text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-bold tracking-tighter text-white">
            VANTAGE<span className="text-emerald-500">GOLF</span>
          </div>
          <div className="flex gap-8 text-sm">
            <a href="#" className="hover:text-white transition">Privacidad</a>
            <a href="#" className="hover:text-white transition">Términos</a>
            <a href="#" className="hover:text-white transition">Contacto</a>
          </div>
          <p className="text-sm">© 2026 Vantage Golf. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Sidebar Carrito */}
      <div className={`fixed inset-0 z-50 transition-all ${isCartOpen ? 'visible' : 'invisible'}`}>
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${isCartOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsCartOpen(false)}
        />
        <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-500 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">TU BOLSA DE GOLF</h2>
              <button onClick={() => setIsCartOpen(false)} className="cursor-pointer hover:text-slate-500 transition">
                <X size={28} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingCart size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 mb-4">Tu bolsa está vacía.</p>
                  <button onClick={() => setIsCartOpen(false)} className="text-emerald-700 font-bold underline underline-offset-4 cursor-pointer">
                    Empezar a comprar
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 mb-6 border-b pb-6 border-slate-100">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                    <div className="flex-grow">
                      <h4 className="font-bold">{item.name}</h4>
                      <p className="text-sm text-slate-500">${item.price.toLocaleString()} x {item.qty}</p>
                      <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 mt-2 font-medium cursor-pointer hover:text-red-700 transition">
                        ELIMINAR
                      </button>
                    </div>
                    <p className="font-bold text-lg">${(item.price * item.qty).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-8 border-t border-slate-200">
                <div className="flex justify-between text-xl font-bold mb-6">
                  <span>TOTAL EST.</span>
                  <span>${total.toLocaleString()}</span>
                </div>
                <button className="w-full bg-emerald-600 text-white py-5 font-black tracking-widest hover:bg-emerald-700 transition shadow-lg flex items-center justify-center gap-3 cursor-pointer">
                  FINALIZAR COMPRA <ChevronRight />
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-4 uppercase tracking-wide">
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

export default GolfApp;
