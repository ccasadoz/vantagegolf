import React, { useState, useEffect } from 'react';
import { BarChart3, Lock, Plus, Trash2, Save, LogOut, Package, ShoppingCart } from 'lucide-react';
import { API_BASE_URL } from './config.js';

const AdminPanel = ({ onProductsChange }) => {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin_token') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingStock, setEditingStock] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ category: '', name: '', price: '', stock: '', img: '', specs: '' });
  const [activeTab, setActiveTab] = useState('inventory');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    try {
      const [pRes, oRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/products`, { headers }),
        fetch(`${API_BASE_URL}/admin/orders`, { headers }),
      ]);
      if (pRes.status === 401) { logout(); return; }
      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const login = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) { setLoginError('Contraseña incorrecta'); return; }
      const { token: t } = await res.json();
      sessionStorage.setItem('admin_token', t);
      setToken(t);
      setPassword('');
    } catch { setLoginError('Error de conexión'); }
  };

  const logout = () => {
    sessionStorage.removeItem('admin_token');
    setToken('');
    setProducts([]);
  };

  const updateStock = async (id) => {
    const newStock = editingStock[id];
    if (newStock === undefined) return;
    await fetch(`${API_BASE_URL}/admin/products/${id}/stock`, {
      method: 'PUT', headers, body: JSON.stringify({ stock: parseInt(newStock) }),
    });
    setEditingStock({ ...editingStock, [id]: undefined });
    fetchData();
    onProductsChange();
  };

  const addProduct = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE_URL}/admin/products`, {
      method: 'POST', headers,
      body: JSON.stringify({
        ...newProduct,
        price: parseInt(newProduct.price),
        stock: parseInt(newProduct.stock),
        specs: newProduct.specs.split(',').map(s => s.trim()).filter(Boolean),
      }),
    });
    setNewProduct({ category: '', name: '', price: '', stock: '', img: '', specs: '' });
    setShowAddForm(false);
    fetchData();
    onProductsChange();
  };

  const deleteProduct = async (id, name) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    await fetch(`${API_BASE_URL}/admin/products/${id}`, { method: 'DELETE', headers });
    fetchData();
    onProductsChange();
  };

  // Login screen
  if (!token) {
    return (
      <div className="pt-[76px] px-8 bg-slate-900 text-white pb-10 border-b-4 border-emerald-500">
        <div className="max-w-sm mx-auto pt-8">
          <div className="flex items-center gap-2 mb-6 text-emerald-400 font-bold uppercase tracking-widest text-sm">
            <Lock size={18} /> Acceso Administrador
          </div>
          <form onSubmit={login} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña de admin"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button type="submit" className="w-full bg-emerald-600 py-3 rounded-lg font-bold hover:bg-emerald-500 transition cursor-pointer">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  const inputClass = "bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 w-full";

  return (
    <div className="pt-[76px] px-8 bg-slate-900 text-white pb-10 border-b-4 border-emerald-500">
      <div className="max-w-7xl mx-auto pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-sm">
            <BarChart3 size={18} /> Panel de Administración
          </div>
          <button onClick={logout} className="flex items-center gap-1 text-slate-400 hover:text-white text-xs cursor-pointer">
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`text-sm font-bold uppercase tracking-wider cursor-pointer pb-1 ${activeTab === 'inventory' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-white'}`}
          >
            <Package size={14} className="inline mr-1" /> Inventario
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`text-sm font-bold uppercase tracking-wider cursor-pointer pb-1 ${activeTab === 'orders' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-white'}`}
          >
            <ShoppingCart size={14} className="inline mr-1" /> Pedidos ({orders.filter(o => o.status === 'confirmed').length})
          </button>
        </div>

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <>
            <div className="space-y-3">
              {products.map(p => (
                <div key={p.id} className="bg-white/5 p-4 rounded-lg flex items-center gap-4">
                  <img src={p.img} alt={p.name} className="w-12 h-12 rounded object-cover" />
                  <div className="flex-grow">
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-[10px] text-emerald-500 uppercase">{p.category} · ${p.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${p.stock === 0 ? 'text-red-500' : p.stock <= 3 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                      {p.stock} und
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={editingStock[p.id] !== undefined ? editingStock[p.id] : p.stock}
                      onChange={(e) => setEditingStock({ ...editingStock, [p.id]: e.target.value })}
                      className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20 text-center outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => updateStock(p.id)}
                      disabled={editingStock[p.id] === undefined}
                      className={`p-2 rounded cursor-pointer ${editingStock[p.id] !== undefined ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-white/5 text-slate-600'}`}
                    >
                      <Save size={14} />
                    </button>
                    <button onClick={() => deleteProduct(p.id, p.name)} className="p-2 rounded bg-white/5 hover:bg-red-600 text-slate-400 hover:text-white cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Product */}
            <div className="mt-6">
              {!showAddForm ? (
                <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 text-emerald-400 text-sm font-bold cursor-pointer hover:text-emerald-300">
                  <Plus size={16} /> Agregar Producto
                </button>
              ) : (
                <form onSubmit={addProduct} className="bg-white/5 p-6 rounded-lg space-y-4">
                  <p className="font-bold text-sm mb-2">Nuevo Producto</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} placeholder="Categoría" className={inputClass} />
                    <input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Nombre" className={inputClass} />
                    <input required type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="Precio ($)" className={inputClass} />
                    <input required type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} placeholder="Stock" className={inputClass} />
                  </div>
                  <input value={newProduct.img} onChange={e => setNewProduct({...newProduct, img: e.target.value})} placeholder="URL de imagen" className={inputClass} />
                  <input value={newProduct.specs} onChange={e => setNewProduct({...newProduct, specs: e.target.value})} placeholder="Specs separados por coma (ej: Acero, Grafito)" className={inputClass} />
                  <div className="flex gap-3">
                    <button type="submit" className="bg-emerald-600 px-6 py-2 rounded text-sm font-bold hover:bg-emerald-500 cursor-pointer">Guardar</button>
                    <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 text-sm cursor-pointer hover:text-white">Cancelar</button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-8 text-center">No hay pedidos aún.</p>
            ) : (
              orders.map(o => (
                <div key={o.id} className="bg-white/5 p-4 rounded-lg flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${o.status === 'confirmed' ? 'bg-emerald-500' : o.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <div className="flex-grow">
                    <p className="font-bold text-sm font-mono">{o.id.slice(-12)}</p>
                    <p className="text-[10px] text-slate-400">{o.customer_email || 'Sin email'} · {o.created_at}</p>
                  </div>
                  <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${o.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : o.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {o.status}
                  </span>
                  <span className="font-bold">${(o.total / 100).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
