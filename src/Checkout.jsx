import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, CreditCard, CheckCircle, ArrowLeft, Package, Truck, Store, MapPin } from 'lucide-react';
import { API_BASE_URL } from './config.js';
import { countries } from './countries.js';

const formatCLP = (n) => '$' + n.toLocaleString('es-CL');

const CheckoutForm = ({ cart, subtotal, onBack, onPurchaseComplete }) => {
  const [form, setForm] = useState({ email: '', name: '', address: '', apt: '', city: '', state: '', zip: '', country: 'CL', notes: '' });
  const [deliveryMethod, setDeliveryMethod] = useState('shipping');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [postalError, setPostalError] = useState('');

  const selectedCountry = countries.find(c => c.code === form.country);
  const validatePostal = (zip) => {
    if (!selectedCountry || !zip) { setPostalError(''); return; }
    if (!selectedCountry.postalPattern.test(zip)) {
      setPostalError(`Formato inválido. Ej: ${selectedCountry.postalExample}`);
    } else {
      setPostalError('');
    }
  };

  const shipping = deliveryMethod === 'pickup' ? 0 : (subtotal > 500000 ? 0 : 5000);
  const tax = Math.round(subtotal * 0.19);
  const total = subtotal + shipping + tax;

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  // Check if returning from MercadoPago
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const oid = params.get('order_id');

    if (status && oid) {
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);

      if (status === 'approved') {
        fetch(`${API_BASE_URL}/confirm-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: oid }),
        }).then(() => {
          setOrderId(oid);
          setIsSuccess(true);
          if (onPurchaseComplete) onPurchaseComplete();
        });
      } else if (status === 'rejected') {
        fetch(`${API_BASE_URL}/cancel-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: oid }),
        });
        setPaymentError('El pago fue rechazado. Intenta con otro medio de pago.');
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ id: i.id, qty: i.qty })),
          customer_email: form.email,
          delivery_method: deliveryMethod,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setPaymentError(err.detail || 'Error al crear el pago.');
        setIsProcessing(false);
        return;
      }

      const data = await res.json();
      // Redirect to MercadoPago checkout
      window.location.href = data.init_point;
    } catch (err) {
      setPaymentError('Error inesperado. Intenta de nuevo.');
      setIsProcessing(false);
    }
  };

  // Success screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Pago Confirmado</h1>
          <p className="text-slate-500 mb-2">Orden #{orderId}</p>
          <p className="text-slate-400 text-sm mb-8">
            Recibirás un email de confirmación con los detalles de tu pedido.
          </p>

          <div className="bg-white border border-slate-100 rounded-xl p-6 mb-6 text-left">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-4">
              <Package size={16} /> Resumen del Pedido
            </div>
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                <span className="text-slate-600">{item.name} <span className="text-slate-400">x{item.qty}</span></span>
                <span className="font-medium">{formatCLP(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-slate-200">
              <span>Total cobrado</span>
              <span>{formatCLP(total)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-6">
            <ShieldCheck size={14} /> Pago procesado por Mercado Pago
          </div>
          <button onClick={onBack} className="text-emerald-700 font-bold underline underline-offset-4 cursor-pointer hover:text-emerald-600 transition">
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tighter">
          VANTAGE<span className="text-emerald-700">GOLF</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Lock size={14} /> Pago Seguro · Mercado Pago
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition text-sm mb-8 cursor-pointer">
          <ArrowLeft size={16} /> Volver al carrito
        </button>

        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3">
            <h1 className="text-2xl font-bold mb-8">Información de Envío</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input type="email" required value={form.email} onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="tu@email.com" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nombre completo</label>
                <input type="text" required value={form.name} onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Tu nombre" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
              </div>

              {/* Delivery method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Método de entrega</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setDeliveryMethod('shipping')}
                    className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${deliveryMethod === 'shipping' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <Truck size={20} className={deliveryMethod === 'shipping' ? 'text-emerald-600' : 'text-slate-400'} />
                    <p className="font-bold text-sm mt-2">Envío a Domicilio</p>
                    <p className="text-xs text-slate-500 mt-1">{subtotal > 500000 ? 'Gratis (+$500.000)' : '$5.000 envío'}</p>
                  </button>
                  <button type="button" onClick={() => setDeliveryMethod('pickup')}
                    className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${deliveryMethod === 'pickup' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <Store size={20} className={deliveryMethod === 'pickup' ? 'text-emerald-600' : 'text-slate-400'} />
                    <p className="font-bold text-sm mt-2">Retiro en Tienda</p>
                    <p className="text-xs text-slate-500 mt-1">Gratis · Pro-Shop</p>
                  </button>
                </div>
              </div>

              {/* Shipping address */}
              {deliveryMethod === 'shipping' && (
                <div className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">País</label>
                    <select value={form.country} onChange={(e) => handleChange('country', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white">
                      {countries.map(c => (<option key={c.code} value={c.code}>{c.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Dirección (calle y número)</label>
                    <input type="text" required value={form.address} onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Av. Vitacura 2900" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Depto / Oficina / Piso <span className="text-slate-400 font-normal">(opcional)</span></label>
                    <input type="text" value={form.apt} onChange={(e) => handleChange('apt', e.target.value)}
                      placeholder="Depto 1402, Torre B" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Ciudad</label>
                      <input type="text" required value={form.city} onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="Santiago" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Región / Estado</label>
                      <input type="text" required value={form.state} onChange={(e) => handleChange('state', e.target.value)}
                        placeholder="RM" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Código Postal</label>
                      <input type="text" required value={form.zip} onChange={(e) => handleChange('zip', e.target.value)}
                        onBlur={(e) => validatePostal(e.target.value)} placeholder={selectedCountry?.postalExample || '7500000'}
                        className={`w-full border rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white ${postalError ? 'border-red-400' : 'border-slate-200'}`} />
                      {postalError && <p className="text-red-500 text-[10px] mt-1">{postalError}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Indicaciones de entrega <span className="text-slate-400 font-normal">(opcional)</span></label>
                    <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder="Ej: Dejar con el conserje, tocar timbre 2 veces..." rows={2}
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white resize-none" />
                  </div>
                </div>
              )}

              {deliveryMethod === 'pickup' && (
                <div className="flex items-start gap-3 p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <MapPin size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-emerald-800">Pro-Shop Vantage Golf</p>
                    <p className="text-sm text-emerald-700">Av. Vitacura 2900, Santiago</p>
                    <p className="text-xs text-emerald-600 mt-1">Lun-Sáb 9:00 - 19:00</p>
                  </div>
                </div>
              )}

              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{paymentError}</div>
              )}

              <button type="submit" disabled={isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl cursor-pointer ${
                  isProcessing ? 'bg-slate-400 text-white cursor-wait' : 'bg-[#009ee3] text-white hover:bg-[#007eb5] active:scale-[0.98]'
                }`}>
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Redirigiendo a Mercado Pago...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} /> Pagar {formatCLP(total)} con Mercado Pago
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 pt-2 text-slate-400 text-xs">
                <div className="flex items-center gap-1"><ShieldCheck size={12} /> Pago seguro</div>
                <div className="flex items-center gap-1"><Lock size={12} /> Datos encriptados</div>
                <div className="flex items-center gap-1"><CreditCard size={12} /> Mercado Pago</div>
              </div>
            </form>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-100 rounded-2xl p-8 sticky top-24">
              <h2 className="text-lg font-bold mb-6">Resumen del Pedido</h2>
              <div className="space-y-4 mb-6">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="relative">
                      <img src={item.img} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                      <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{item.qty}</span>
                    </div>
                    <div className="flex-grow">
                      <p className="font-bold text-sm">{item.name}</p>
                      {item.selectedSpec && <p className="text-[10px] text-emerald-700 font-bold uppercase">{item.selectedSpec}</p>}
                    </div>
                    <p className="font-medium text-sm">{formatCLP(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-4 space-y-3 text-sm">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCLP(subtotal)}</span></div>
                <div className="flex justify-between text-slate-500">
                  <span>{deliveryMethod === 'pickup' ? 'Retiro en tienda' : 'Envío Premium'}</span>
                  <span className={shipping === 0 ? 'text-emerald-600 font-bold' : ''}>{shipping === 0 ? 'GRATIS' : formatCLP(shipping)}</span>
                </div>
                <div className="flex justify-between text-slate-500"><span>IVA (19%)</span><span>{formatCLP(tax)}</span></div>
                <div className="flex justify-between text-xl font-black pt-4 border-t border-slate-200"><span>Total</span><span>{formatCLP(total)}</span></div>
              </div>
              <div className="mt-6 bg-blue-50 rounded-lg p-4 text-xs text-blue-800 flex items-start gap-2">
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <span>Pago procesado por Mercado Pago. No almacenamos datos de tarjeta.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
