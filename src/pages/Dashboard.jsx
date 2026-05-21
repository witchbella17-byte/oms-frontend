import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, ShoppingCart, PlusCircle, LogOut, CheckCircle, UploadCloud, Image as ImageIcon, Download, Trash2, CheckSquare, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const IMGBB_API_KEY = '3d635117224d27a7daab1c692a2aa2ab'; // <--- এখানে আপনার API Key বসান

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('products'); // products, add_product, orders, completed
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('adminToken');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchProducts = () => {
    axios.get('https://oms-backend-b5o2.onrender.com/api/products', axiosConfig).then(res => setProducts(res.data.products)).catch(console.error);
  };
  const fetchOrders = () => {
    axios.get('https://oms-backend-b5o2.onrender.com/api/orders', axiosConfig).then(res => setOrders(res.data.orders)).catch(console.error);
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  // Image Upload Handler
  const handleImageUpload = async (e, stateSetter, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData);
      stateSetter(prev => ({ ...prev, [fieldName]: res.data.data.url }));
    } catch (err) {
      alert('ইমেজ আপলোড ফেইল হয়েছে!');
    } finally {
      setUploadingImage(false);
    }
  };

  // Delete Handlers
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`https://oms-backend-b5o2.onrender.com/api/products/${id}`, axiosConfig);
      fetchProducts();
    } catch (err) { alert('Failed to delete.'); }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Delete this order? (If completed, QTY will not be restored)')) return;
    try {
      await axios.delete(`https://oms-backend-b5o2.onrender.com/api/orders/${id}`, axiosConfig);
      fetchOrders();
      fetchProducts();
    } catch (err) { alert('Failed to delete order.'); }
  };

  // Product Add Form
  const [newProduct, setNewProduct] = useState({ product_image: '', product_link: '', keyword: '', store_name: '', product_price: '', order_qty: '' });
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://oms-backend-b5o2.onrender.com/api/products', newProduct, axiosConfig);
      alert('Product added!');
      setNewProduct({ product_image: '', product_link: '', keyword: '', store_name: '', product_price: '', order_qty: '' });
      setActiveTab('products');
    } catch (err) { alert('Failed to add.'); }
  };

  // Order Add Form
  const [newOrder, setNewOrder] = useState({ product_id: '', order_number: '', order_screenshot_1: '', order_screenshot_2: '', paypal_email: '' });
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://oms-backend-b5o2.onrender.com/api/orders', newOrder, axiosConfig);
      alert('Order submitted!');
      setNewOrder({ product_id: '', order_number: '', order_screenshot_1: '', order_screenshot_2: '', paypal_email: '' });
      fetchOrders(); fetchProducts();
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit.'); }
  };

  // Review Form
  const [reviewForm, setReviewForm] = useState({ orderId: null, review_screenshot_1: '', review_screenshot_2: '' });
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`https://oms-backend-b5o2.onrender.com/api/orders/${reviewForm.orderId}/review`, reviewForm, axiosConfig);
      alert('Review added!');
      setReviewForm({ orderId: null, review_screenshot_1: '', review_screenshot_2: '' });
      fetchOrders();
    } catch (err) { alert('Failed to review.'); }
  };

  const handleDownloadExcel = async () => {
    try {
      const res = await axios.get('https://oms-backend-b5o2.onrender.com/api/orders/export', { ...axiosConfig, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `Reviews_Export_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
      alert('Excel downloaded!'); fetchOrders();
    } catch (err) { alert('No pending reviews ready for export!'); }
  };

  // Helpers for UI
  const selectedProductForOrder = products.find(p => p.id === parseInt(newOrder.product_id));
  const reviewOrderData = orders.find(o => o.id === reviewForm.orderId);
  const reviewProductData = reviewOrderData ? products.find(p => p.id === reviewOrderData.product_id) : null;
  
  // Grouping completed orders by product
  const completedOrders = orders.filter(o => o.status === 'completed');
  const productsWithCompleted = products.map(p => ({
    ...p,
    completedList: completedOrders.filter(o => o.product_id === p.id)
  })).filter(p => p.completedList.length > 0);

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      
      {/* Top Header (Mobile) */}
      <header className="bg-blue-800 text-white p-4 shadow-md flex justify-between items-center md:hidden z-10 sticky top-0">
        <h1 className="text-xl font-bold tracking-wider">OMS Admin</h1>
        <button onClick={handleLogout} className="text-red-300 hover:text-red-100"><LogOut size={22} /></button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar (Hidden on Mobile) */}
        <aside className="hidden md:flex w-64 bg-blue-900 text-white flex-col shadow-lg z-10">
          <div className="p-6 text-2xl font-bold border-b border-blue-800 text-center tracking-wider">OMS Admin</div>
          <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
            <p className="text-xs text-blue-300 font-semibold mb-2 uppercase">Inventory</p>
            <button onClick={() => setActiveTab('products')} className={`w-full flex items-center space-x-3 p-3 rounded-md transition ${activeTab === 'products' ? 'bg-blue-600' : 'hover:bg-blue-800'}`}><Home size={20} /> <span>All Products</span></button>
            <button onClick={() => setActiveTab('add_product')} className={`w-full flex items-center space-x-3 p-3 rounded-md transition ${activeTab === 'add_product' ? 'bg-blue-600' : 'hover:bg-blue-800'}`}><PlusCircle size={20} /> <span>Add Product</span></button>
            <p className="text-xs text-blue-300 font-semibold mb-2 mt-6 uppercase">Operations</p>
            <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center space-x-3 p-3 rounded-md transition ${activeTab === 'orders' ? 'bg-blue-600' : 'hover:bg-blue-800'}`}><ShoppingCart size={20} /> <span>Active Orders</span></button>
            <button onClick={() => setActiveTab('completed')} className={`w-full flex items-center space-x-3 p-3 rounded-md transition ${activeTab === 'completed' ? 'bg-blue-600' : 'hover:bg-blue-800'}`}><CheckSquare size={20} /> <span>Completed</span></button>
          </nav>
          <div className="p-4 border-t border-blue-800">
            <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 p-3 rounded-md transition font-medium"><LogOut size={20} /> <span>Logout</span></button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-gray-50">
          
          {/* TAB: PRODUCTS (Card Layout) */}
          {activeTab === 'products' && (
            <div className="max-w-5xl mx-auto">
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Inventory List</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-white rounded-xl shadow-sm border p-4 flex flex-col relative">
                    <button onClick={() => handleDeleteProduct(p.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                    <div className="flex space-x-4 items-center mb-3">
                      <div className="w-16 h-16 shrink-0 bg-gray-100 rounded-lg overflow-hidden border">
                        {p.product_image ? <img src={p.product_image} alt="" className="w-full h-full object-cover"/> : <ImageIcon className="m-auto text-gray-400 mt-4"/>}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">{p.store_name}</h3>
                        <p className="text-xs text-gray-500">{p.keyword}</p>
                        <p className="text-sm font-bold text-blue-600 mt-1">${p.product_price}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded mt-auto border text-sm">
                      <span className="font-medium text-gray-700">Qty: {p.order_qty}</span>
                      <span className={`px-2 py-1 text-xs font-bold rounded-md ${p.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.status.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
                {products.length === 0 && <p className="text-gray-500 text-center col-span-full mt-10">No products found.</p>}
              </div>
            </div>
          )}

          {/* TAB: ADD PRODUCT */}
          {activeTab === 'add_product' && (
            <div className="max-w-lg mx-auto bg-white p-5 md:p-8 rounded-xl shadow-sm border-t-4 border-blue-600">
              <h2 className="text-xl font-bold mb-5 text-gray-800">Add New Product</h2>
              <form onSubmit={handleAddProduct} className="space-y-4 text-sm">
                <div className="flex space-x-3 items-center bg-gray-50 p-3 rounded-lg border">
                  <div className="flex-1">
                    <label className="block text-gray-700 mb-1 font-semibold flex items-center"><UploadCloud size={16} className="mr-1"/> Image</label>
                    <input type="file" accept="image/*" className="w-full text-xs" onChange={e => handleImageUpload(e, setNewProduct, 'product_image')} />
                  </div>
                  {newProduct.product_image && <img src={newProduct.product_image} alt="Preview" className="w-14 h-14 object-cover rounded border bg-white" />}
                </div>
                <div><label className="block font-semibold mb-1">Product Link</label><input type="url" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" value={newProduct.product_link} onChange={e => setNewProduct({...newProduct, product_link: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block font-semibold mb-1">Keyword</label><input type="text" required className="w-full border p-2 rounded outline-none" value={newProduct.keyword} onChange={e => setNewProduct({...newProduct, keyword: e.target.value})} /></div>
                  <div><label className="block font-semibold mb-1">Store</label><input type="text" required className="w-full border p-2 rounded outline-none" value={newProduct.store_name} onChange={e => setNewProduct({...newProduct, store_name: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block font-semibold mb-1">Price ($)</label><input type="number" step="0.01" required className="w-full border p-2 rounded outline-none" value={newProduct.product_price} onChange={e => setNewProduct({...newProduct, product_price: e.target.value})} /></div>
                  <div><label className="block font-semibold mb-1">Qty</label><input type="number" required className="w-full border p-2 rounded outline-none" value={newProduct.order_qty} onChange={e => setNewProduct({...newProduct, order_qty: e.target.value})} /></div>
                </div>
                <button type="submit" disabled={uploadingImage} className={`w-full text-white py-3 rounded-lg font-bold shadow-md transition ${uploadingImage ? 'bg-gray-400' : 'bg-blue-600 active:bg-blue-700'}`}>{uploadingImage ? 'Uploading...' : 'Save Product'}</button>
              </form>
            </div>
          )}

          {/* TAB: ACTIVE ORDERS (App Style) */}
          {activeTab === 'orders' && (
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-5 border-b pb-3 gap-3">
                <h2 className="text-xl font-bold text-gray-800">Active Orders</h2>
                <button onClick={handleDownloadExcel} className="w-full sm:w-auto flex justify-center items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow font-medium active:scale-95 transition">
                  <Download size={18} /> <span className="text-sm">Export Ready (Excel)</span>
                </button>
              </div>

              {/* Order Entry Card */}
              <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-indigo-500 mb-6">
                <h3 className="font-bold mb-4 flex items-center text-indigo-700"><PlusCircle size={18} className="mr-2"/> New Order Entry</h3>
                <form onSubmit={handleSubmitOrder} className="space-y-4 text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <label className="block font-semibold mb-1">Select Product</label>
                      <select required className="w-full border p-2 rounded bg-gray-50 outline-none" value={newOrder.product_id} onChange={e => setNewOrder({...newOrder, product_id: e.target.value})}>
                        <option value="">-- Choose Product --</option>
                        {products.filter(p => p.status === 'available').map(p => (
                          <option key={p.id} value={p.id}>{p.store_name} ({p.keyword}) - Qty: {p.order_qty}</option>
                        ))}
                      </select>
                    </div>
                    {/* Show selected product image */}
                    {selectedProductForOrder?.product_image && (
                       <img src={selectedProductForOrder.product_image} alt="" className="w-12 h-12 rounded border object-cover shrink-0 mt-5"/>
                    )}
                  </div>
                  <div><label className="block font-semibold mb-1">Order Number</label><input type="text" required className="w-full border p-2 rounded outline-none" value={newOrder.order_number} onChange={e => setNewOrder({...newOrder, order_number: e.target.value})} /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 border rounded bg-gray-50">
                      <label className="block text-xs font-bold mb-1">Screenshot 1</label>
                      <input type="file" accept="image/*" className="w-full text-xs" onChange={e => handleImageUpload(e, setNewOrder, 'order_screenshot_1')} />
                    </div>
                    <div className="p-3 border rounded bg-gray-50">
                      <label className="block text-xs font-bold mb-1">Screenshot 2 (Opt)</label>
                      <input type="file" accept="image/*" className="w-full text-xs" onChange={e => handleImageUpload(e, setNewOrder, 'order_screenshot_2')} />
                    </div>
                  </div>
                  <div><label className="block font-semibold mb-1">PayPal Email</label><input type="email" required className="w-full border p-2 rounded outline-none" value={newOrder.paypal_email} onChange={e => setNewOrder({...newOrder, paypal_email: e.target.value})} /></div>
                  <button type="submit" disabled={uploadingImage} className={`w-full text-white py-3 rounded-lg font-bold shadow ${uploadingImage ? 'bg-gray-400' : 'bg-indigo-600 active:bg-indigo-700'}`}>Submit Order</button>
                </form>
              </div>

              {/* Pending/Review Submitted Orders List */}
              <h3 className="font-bold text-gray-700 mb-3 text-lg">Pending & Ready for Export</h3>
              <div className="space-y-3">
                {orders.filter(o => o.status !== 'completed').map(order => {
                  const p = products.find(prod => prod.id === order.product_id);
                  return (
                    <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row gap-4 items-start sm:items-center relative">
                      <button onClick={() => handleDeleteOrder(order.id)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
                      <div className="flex items-center space-x-3">
                        <img src={p?.product_image || ''} alt="" className="w-12 h-12 rounded object-cover border bg-gray-100 shrink-0"/>
                        <div>
                          <p className="text-sm font-bold text-gray-800">#{order.order_number}</p>
                          <p className="text-xs text-gray-500">{order.paypal_email}</p>
                        </div>
                      </div>
                      <div className="flex-1 flex justify-between items-center w-full sm:w-auto mt-2 sm:mt-0">
                        <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md ${order.status === 'review_submitted' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                        {order.status === 'pending' && (
                          <button onClick={() => setReviewForm({ orderId: order.id, review_screenshot_1: '', review_screenshot_2: '' })} className="text-xs bg-yellow-500 text-white px-3 py-2 rounded-lg font-bold shadow-sm active:scale-95">Add Review</button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {orders.filter(o => o.status !== 'completed').length === 0 && <p className="text-center text-gray-500 py-6">No active orders.</p>}
              </div>

              {/* Mobile Review Modal / Inline Form */}
              {reviewForm.orderId && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h4 className="font-bold text-gray-800">Submit Review</h4>
                      <button onClick={() => setReviewForm({ orderId: null, review_screenshot_1: '', review_screenshot_2: '' })} className="text-red-500 text-sm font-bold">Close</button>
                    </div>
                    {/* Show product image on review */}
                    <div className="flex items-center space-x-3 mb-4 bg-gray-50 p-2 rounded border">
                      <img src={reviewProductData?.product_image} alt="" className="w-10 h-10 rounded object-cover"/>
                      <p className="text-xs font-bold">#{reviewOrderData?.order_number}</p>
                    </div>
                    <form onSubmit={handleSubmitReview} className="space-y-3">
                      <div className="p-3 border rounded bg-gray-50">
                         <label className="block text-xs font-bold mb-1">Review SS 1</label>
                         <input type="file" accept="image/*" required className="w-full text-xs" onChange={e => handleImageUpload(e, setReviewForm, 'review_screenshot_1')} />
                      </div>
                      <div className="p-3 border rounded bg-gray-50">
                         <label className="block text-xs font-bold mb-1">Review SS 2 (Opt)</label>
                         <input type="file" accept="image/*" className="w-full text-xs" onChange={e => handleImageUpload(e, setReviewForm, 'review_screenshot_2')} />
                      </div>
                      <button type="submit" disabled={uploadingImage} className="w-full py-3 rounded-xl text-sm font-bold shadow bg-yellow-500 text-white active:bg-yellow-600 mt-2">Save Review</button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: COMPLETED ORDERS (Grouped by Product) */}
          {activeTab === 'completed' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold mb-5 text-gray-800 border-b pb-2">Completed History</h2>
              
              {productsWithCompleted.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No completed orders yet.</p>
              ) : (
                <div className="space-y-6">
                  {productsWithCompleted.map(product => (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      {/* Product Header inside card */}
                      <div className="bg-gray-100 p-3 flex items-center justify-between border-b">
                        <div className="flex items-center space-x-3">
                          <img src={product.product_image} alt="" className="w-10 h-10 rounded object-cover border bg-white"/>
                          <div>
                            <h3 className="font-bold text-sm text-gray-800 leading-tight">{product.store_name}</h3>
                            <p className="text-[10px] text-gray-500 font-medium">Qty Set: {product.order_qty + product.completedList.length}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-lg font-bold">Done: {product.completedList.length}</span>
                        </div>
                      </div>
                      
                      {/* Completed Orders List for this product */}
                      <div className="p-2 space-y-2">
                        {product.completedList.map(order => (
                          <div key={order.id} className="flex justify-between items-center p-2 bg-green-50/50 rounded border border-green-100">
                            <div>
                              <p className="text-xs font-bold text-gray-800">#{order.order_number}</p>
                              <p className="text-[10px] text-gray-500">{new Date(order.created_at).toLocaleDateString()} • {order.paypal_email}</p>
                            </div>
                            <button onClick={() => handleDeleteOrder(order.id)} className="p-2 text-red-400 hover:text-red-600 bg-white rounded-lg border shadow-sm active:scale-95 transition">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 pb-4 text-xs font-medium text-gray-500 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('products')} className={`flex flex-col items-center p-2 rounded-xl w-16 ${activeTab === 'products' ? 'text-blue-600 bg-blue-50' : 'active:bg-gray-100'}`}><Home size={22} className="mb-1"/>Products</button>
        <button onClick={() => setActiveTab('add_product')} className={`flex flex-col items-center p-2 rounded-xl w-16 ${activeTab === 'add_product' ? 'text-blue-600 bg-blue-50' : 'active:bg-gray-100'}`}><PlusCircle size={22} className="mb-1"/>Add</button>
        <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center p-2 rounded-xl w-16 ${activeTab === 'orders' ? 'text-indigo-600 bg-indigo-50' : 'active:bg-gray-100'}`}><ShoppingCart size={22} className="mb-1"/>Active</button>
        <button onClick={() => setActiveTab('completed')} className={`flex flex-col items-center p-2 rounded-xl w-16 ${activeTab === 'completed' ? 'text-green-600 bg-green-50' : 'active:bg-gray-100'}`}><CheckSquare size={22} className="mb-1"/>Done</button>
      </nav>

    </div>
  );
};

export default Dashboard;