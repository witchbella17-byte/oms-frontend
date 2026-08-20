import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, PlusCircle, LogOut, CheckCircle, UploadCloud, Image as ImageIcon, Download, Trash2, CheckSquare, Home, Eye, Clock, List, ExternalLink, RotateCcw, X, Copy, Check, Search, Edit, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SUPABASE_URL = 'https://nqiqfxcohyzaltepgvjt.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaXFmeGNvaHl6YWx0ZXBndmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODUyOTUsImV4cCI6MjA5NDk2MTI5NX0.k46b8JxhGOEh1SDo3xP1A85Bm7vMlsaaRHxLySjkvuA'; 

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('products'); 
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  const [viewOrderModal, setViewOrderModal] = useState(null); 
  const [editOrderModal, setEditOrderModal] = useState(null); 
  const [selectedExportOrders, setSelectedExportOrders] = useState([]); 
  
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState(''); 
  const [readySearchQuery, setReadySearchQuery] = useState(''); 
  const [completedSearchQuery, setCompletedSearchQuery] = useState(''); 
  
  const [copiedItem, setCopiedItem] = useState(null);
  const [inventoryTab, setInventoryTab] = useState('active'); 
  const [selectedCompletedProducts, setSelectedCompletedProducts] = useState([]);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('orders'); 
  const [exportFileName, setExportFileName] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Buyer Request (BR) States
  const [buyersRequests, setBuyersRequests] = useState([]);
  const [brSearchQuery, setBrSearchQuery] = useState('');
  const [showBRModal, setShowBRModal] = useState(null);
  const [buyerNameInput, setBuyerNameInput] = useState('');
  const [isSubmittingBR, setIsSubmittingBR] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
  const today = new Date().toISOString().split('T')[0];

  const fetchProducts = () => {
    axios.get('https://oms-backend-b5o2.onrender.com/api/products', axiosConfig).then(res => setProducts(res.data.products)).catch(console.error);
  };
  const fetchOrders = () => {
    axios.get('https://oms-backend-b5o2.onrender.com/api/orders', axiosConfig).then(res => setOrders(res.data.orders)).catch(console.error);
  };
  const fetchBuyersRequests = () => {
    axios.get('https://oms-backend-b5o2.onrender.com/api/buyers-requests', axiosConfig).then(res => setBuyersRequests(res.data.requests)).catch(console.error);
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchBuyersRequests();
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleImageUpload = async (e, stateSetter, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    try {
      await axios.post(
        `${SUPABASE_URL}/storage/v1/object/oms-images/${fileName}`,
        file,
        { headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': file.type } }
      );
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/oms-images/${fileName}`;
      stateSetter(prev => ({ ...prev, [fieldName]: publicUrl }));
    } catch (err) {
      alert('ইমেজ আপলোড ফেইল হয়েছে!');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? (All related orders will be permanently deleted!)')) return;
    try {
      await axios.delete(`https://oms-backend-b5o2.onrender.com/api/products/${id}`, axiosConfig);
      fetchProducts(); fetchOrders();
    } catch (err) { alert('Failed to delete.'); }
  };

  const handleCompleteProduct = async (id) => {
    if (!window.confirm('Move this product to Completed Inventory?')) return;
    try {
      await axios.put(`https://oms-backend-b5o2.onrender.com/api/products/${id}/complete`, {}, axiosConfig);
      fetchProducts();
    } catch (err) { alert('Failed to move product.'); }
  };

  const handleBulkDeleteProducts = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedCompletedProducts.length} products?`)) return;
    try {
      await axios.post('https://oms-backend-b5o2.onrender.com/api/products/bulk-delete', { productIds: selectedCompletedProducts }, axiosConfig);
      alert('Products deleted successfully!');
      setSelectedCompletedProducts([]);
      fetchProducts(); fetchOrders();
    } catch (err) { alert('Failed to bulk delete products.'); }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await axios.delete(`https://oms-backend-b5o2.onrender.com/api/orders/${id}`, axiosConfig);
      fetchOrders(); fetchProducts();
    } catch (err) { alert('Failed to delete order.'); }
  };

  const handleUndoOrder = async (id) => {
    if (!window.confirm('Are you sure you want to undo this order back to Ready list?')) return;
    try {
      await axios.put(`https://oms-backend-b5o2.onrender.com/api/orders/${id}/undo`, {}, axiosConfig);
      fetchOrders();
    } catch (err) { alert('Failed to undo order.'); }
  };

  const handleCreateBR = async (e) => {
    e.preventDefault();
    if(!buyerNameInput.trim()) return alert('Please enter buyer name');
    setIsSubmittingBR(true);
    try {
      await axios.post('https://oms-backend-b5o2.onrender.com/api/buyers-requests', {
        product_id: showBRModal.id,
        buyer_name: buyerNameInput.trim()
      }, axiosConfig);
      alert('Buyer Request added successfully!');
      setBuyerNameInput('');
      setShowBRModal(null);
      fetchProducts(); fetchBuyersRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create Buyer Request');
    } finally {
      setIsSubmittingBR(false);
    }
  };

  const handleDeleteBR = async (id) => {
    if(!window.confirm('Are you sure you want to delete this buyer request? Inventory qty will be restored (+1).')) return;
    try {
      await axios.delete(`https://oms-backend-b5o2.onrender.com/api/buyers-requests/${id}`, axiosConfig);
      alert('Request deleted and stock restored!');
      fetchProducts(); fetchBuyersRequests();
    } catch (err) {
      alert('Failed to delete Buyer Request');
    }
  };

  const [newProduct, setNewProduct] = useState({ product_image: '', product_link: '', keyword: '', store_name: '', product_price: '', order_qty: '' });
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if(isSubmittingProduct) return;
    setIsSubmittingProduct(true);
    try {
      await axios.post('https://oms-backend-b5o2.onrender.com/api/products', newProduct, axiosConfig);
      alert('Product added!');
      setNewProduct({ product_image: '', product_link: '', keyword: '', store_name: '', product_price: '', order_qty: '' });
      e.target.reset(); setActiveTab('products');
    } catch (err) { alert('Failed to add. If the server is waking up, it might be added automatically soon. Please refresh and check before trying again!'); }
    finally { setIsSubmittingProduct(false); }
  };

  // UPDATED: Added buyer_request_id to state
  const [newOrder, setNewOrder] = useState({ product_id: '', buyer_request_id: '', order_number: '', order_screenshot_1: '', order_screenshot_2: '', paypal_email: '', current_price: '', order_date: today });
  
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if(isSubmittingOrder) return; 
    if(!newOrder.product_id) return alert('Please select a product!');
    
    setIsSubmittingOrder(true); 
    try {
      await axios.post('https://oms-backend-b5o2.onrender.com/api/orders', newOrder, axiosConfig);
      alert('Order submitted successfully!');
      setNewOrder({ product_id: '', buyer_request_id: '', order_number: '', order_screenshot_1: '', order_screenshot_2: '', paypal_email: '', current_price: '', order_date: today });
      e.target.reset(); fetchOrders(); fetchProducts(); fetchBuyersRequests();
    } catch (err) { 
      alert(err.response?.data?.message || 'Failed to submit. If the server is waking up, it might be added automatically soon. Please refresh and check before trying again!'); 
    } finally {
      setIsSubmittingOrder(false); 
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`https://oms-backend-b5o2.onrender.com/api/orders/${editOrderModal.id}`, editOrderModal, axiosConfig);
      alert('Order updated successfully!');
      setEditOrderModal(null); fetchOrders();
    } catch (err) { alert('Failed to update order.'); }
  };

  const [reviewForm, setReviewForm] = useState({ orderId: null, review_screenshot_1: '', review_screenshot_2: '' });
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (isSubmittingReview) return; 
    setIsSubmittingReview(true); 
    try {
      await axios.put(`https://oms-backend-b5o2.onrender.com/api/orders/${reviewForm.orderId}/review`, reviewForm, axiosConfig);
      alert('Review added!');
      setReviewForm({ orderId: null, review_screenshot_1: '', review_screenshot_2: '' });
      e.target.reset(); fetchOrders();
    } catch (err) { alert('Failed to review.'); } {
      setIsSubmittingReview(false); 
    }
  };

  const openExportModal = (type) => {
    setExportType(type);
    if (type === 'orders' && selectedExportOrders.length === 0) return alert('Please select at least one order to export.');
    if (type === 'products' && selectedCompletedProducts.length === 0) return alert('Please select at least one product to export.');
    setExportFileName(type === 'orders' ? `Reviews_Export_${today}` : `Inventory_Export_${today}`);
    setShowExportModal(true);
  };

  const confirmDownloadExcel = async (e) => {
    e.preventDefault();
    setIsExporting(true);
    try {
      const endpoint = exportType === 'orders' ? '/api/orders/export' : '/api/products/export';
      const payload = exportType === 'orders' ? { orderIds: selectedExportOrders } : { productIds: selectedCompletedProducts };

      const res = await axios.post(`https://oms-backend-b5o2.onrender.com${endpoint}`, payload, { ...axiosConfig, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; 
      let finalName = exportFileName.trim() || `Export_${new Date().getTime()}`;
      if (!finalName.toLowerCase().endsWith('.xlsx')) finalName += '.xlsx';
      link.setAttribute('download', finalName);
      document.body.appendChild(link); link.click(); link.remove();
      alert('Excel downloaded successfully!'); 
      if (exportType === 'orders') setSelectedExportOrders([]);
      else setSelectedCompletedProducts([]);
      setShowExportModal(false); fetchOrders();
    } catch (err) { alert('Failed to export excel!'); } finally { setIsExporting(false); }
  };

  const handleMarkAsDone = async () => {
    if (selectedExportOrders.length === 0) return alert('Please select at least one order to export.');
    if (!window.confirm(`Are you sure you want to mark ${selectedExportOrders.length} order(s) as completed?`)) return;
    try {
      await axios.put('https://oms-backend-b5o2.onrender.com/api/orders/mark-done', { orderIds: selectedExportOrders }, axiosConfig);
      alert('Orders marked as completed!');
      setSelectedExportOrders([]); fetchOrders();
    } catch (err) { alert('Failed to mark orders as completed.'); }
  };

  const formatHash = (str) => `#${(str || '').replace(/^#+/, '')}`;
  const getFormattedDate = (dateStr) => {
    if (!dateStr) return '';
    try { return new Date(dateStr).toISOString().split('T')[0]; } catch(e) { return ''; }
  };

  const handleToggleProductSelect = (id) => {
    if (selectedCompletedProducts.includes(id)) {
      setSelectedCompletedProducts(selectedCompletedProducts.filter(pid => pid !== id));
    } else {
      setSelectedCompletedProducts([...selectedCompletedProducts, id]);
    }
  };

  const selectedProductForOrder = products.find(p => p.id === parseInt(newOrder.product_id));
  const reviewOrderData = orders.find(o => o.id === reviewForm.orderId);
  const reviewProductData = reviewOrderData ? products.find(p => p.id === reviewOrderData.product_id) : null;
  
  // Find BRs specifically for the selected product in New Order form
  const relatedBRs = buyersRequests.filter(br => br.product_id === parseInt(newOrder.product_id));

  const filteredActiveInventory = products.filter(p => p.status !== 'completed');
  const filteredCompletedInventory = products.filter(p => p.status === 'completed');
  const filteredDeletableInventory = products.filter(p => {
    // Product must be completed or out of stock
    if (p.status !== 'completed' && p.status !== 'not_available' && p.order_qty > 0) return false;
    
    // All orders for this product must be completed
    const productOrders = orders.filter(o => o.product_id === p.id);
    const hasUnfinishedOrders = productOrders.some(o => o.status !== 'completed');
    
    return !hasUnfinishedOrders;
  });

  const filteredPendingOrders = orders.filter(o => {
    if (o.status !== 'pending') return false;
    if (!searchQuery) return true;
    return o.order_number.toLowerCase().replace(/^#+/, '').includes(searchQuery.toLowerCase().replace(/^#+/, ''));
  });

  const filteredReadyOrders = orders.filter(o => {
    if (o.status !== 'review_submitted') return false;
    if (!readySearchQuery) return true;
    return o.order_number.toLowerCase().replace(/^#+/, '').includes(readySearchQuery.toLowerCase().replace(/^#+/, ''));
  });

  const filteredCompletedOrders = orders.filter(o => {
    if (o.status !== 'completed') return false;
    if (!completedSearchQuery) return true;
    return o.order_number.toLowerCase().replace(/^#+/, '').includes(completedSearchQuery.toLowerCase().replace(/^#+/, ''));
  });

  const productsWithCompleted = products.map(p => ({
    ...p,
    completedList: filteredCompletedOrders.filter(o => o.product_id === p.id)
  })).filter(p => p.completedList.length > 0);

  const filteredBRs = buyersRequests.filter(br => {
    if (!brSearchQuery) return true;
    const q = brSearchQuery.toLowerCase();
    return br.buyer_name.toLowerCase().includes(q) || br.store_name.toLowerCase().includes(q) || br.keyword.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      
      <header className="bg-blue-800 text-white p-4 shadow-md flex justify-between items-center md:hidden z-10 sticky top-0">
        <h1 className="text-xl font-bold tracking-wider">OMS Admin</h1>
        <button onClick={handleLogout} className="text-red-300 hover:text-red-100"><LogOut size={22} /></button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="hidden md:flex w-64 bg-blue-900 text-white flex-col shadow-lg z-10">
          <div className="p-6 text-2xl font-bold border-b border-blue-800 text-center tracking-wider">OMS Admin</div>
          <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
            <p className="text-xs text-blue-300 font-semibold mb-2 uppercase">Inventory</p>
            <button onClick={() => setActiveTab('products')} className={`w-full flex items-center space-x-3 p-3 rounded-md transition ${activeTab === 'products' ? 'bg-blue-600' : 'hover:bg-blue-800'}`}><Home size={20} /> <span>All Products</span></button>
            <button onClick={() => setActiveTab('add_product')} className={`w-full flex items-center space-x-3 p-3 rounded-md transition ${activeTab === 'add_product' ? 'bg-blue-600' : 'hover:bg-blue-800'}`}><PlusCircle size={20} /> <span>Add Product</span></button>
            
            <p className="text-xs text-blue-300 font-semibold mb-2 mt-6 uppercase">Operations</p>
            <button onClick={() => setActiveTab('new_order')} className={`w-full flex items-center space-x-3 p-3 rounded-md transition ${activeTab === 'new_order' ? 'bg-blue-600' : 'hover:bg-blue-800'}`}><ShoppingCart size={20} /> <span>New Order</span></button>
            <button onClick={() => setActiveTab('buyers_request')} className={`w-full flex items-center space-x-3 p-3 rounded-md transition ${activeTab === 'buyers_request' ? 'bg-blue-600' : 'hover:bg-blue-800'}`}><Clock size={20} /> <span>Buyer Requests (BR)</span></button>
            <button onClick={() => setActiveTab('pending')} className={`w-full flex items-center space-x-3 p-3 rounded-md transition ${activeTab === 'pending' ? 'bg-blue-600' : 'hover:bg-blue-800'}`}><Clock size={20} /> <span>Pending Reviews</span></button>
            <button onClick={() => setActiveTab('ready')} className={`w-full flex items-center space-x-3 p-3 rounded-md transition ${activeTab === 'ready' ? 'bg-blue-600' : 'hover:bg-blue-800'}`}><List size={20} /> <span>Ready for Export</span></button>
            <button onClick={() => setActiveTab('completed')} className={`w-full flex items-center space-x-3 p-3 rounded-md transition ${activeTab === 'completed' ? 'bg-blue-600' : 'hover:bg-blue-800'}`}><CheckSquare size={20} /> <span>Completed</span></button>
          </nav>
          <div className="p-4 border-t border-blue-800">
            <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 p-3 rounded-md transition font-medium"><LogOut size={20} /> <span>Logout</span></button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-gray-50">
          
          {/* TAB: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-3 gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Inventory List</h2>
                <div className="flex bg-gray-200 p-1 rounded-lg">
                  <button onClick={() => setInventoryTab('active')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${inventoryTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Active Inventory</button>
                  <button onClick={() => setInventoryTab('completed')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${inventoryTab === 'completed' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Completed Inventory</button>
                  <button onClick={() => setInventoryTab('deletable')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${inventoryTab === 'deletable' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Ready to Delete</button>
                </div>
              </div>

              {(inventoryTab === 'completed' || inventoryTab === 'deletable') && (() => {
                const currentList = inventoryTab === 'completed' ? filteredCompletedInventory : filteredDeletableInventory;
                const isAllSelected = currentList.length > 0 && selectedCompletedProducts.length === currentList.length;
                return (
                <div className="flex justify-between items-center mb-5 bg-green-50 p-3 rounded-lg border border-green-200 shadow-sm">
                   <div className="flex items-center gap-2">
                      <input type="checkbox" id="selectAllProds" checked={isAllSelected} onChange={(e) => e.target.checked ? setSelectedCompletedProducts(currentList.map(p=>p.id)) : setSelectedCompletedProducts([])} className="w-4 h-4 text-green-600 rounded cursor-pointer border-gray-300 focus:ring-green-500" />
                      <label htmlFor="selectAllProds" className="text-sm font-bold text-green-800 cursor-pointer">Select All ({selectedCompletedProducts.length})</label>
                   </div>
                   <div className="flex gap-2">
                      {inventoryTab === 'completed' && <button onClick={() => openExportModal('products')} disabled={selectedCompletedProducts.length===0} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg shadow-sm flex items-center gap-1 font-bold transition active:scale-95"><Download size={14}/> Export Excel</button>}
                      <button onClick={handleBulkDeleteProducts} disabled={selectedCompletedProducts.length===0} className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-lg shadow-sm flex items-center gap-1 font-bold transition active:scale-95"><Trash2 size={14}/> Delete</button>
                   </div>
                </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(inventoryTab === 'active' ? filteredActiveInventory : inventoryTab === 'completed' ? filteredCompletedInventory : filteredDeletableInventory).map(p => {
                  const isChecked = selectedCompletedProducts.includes(p.id);
                  return (
                    <div key={p.id} className={`bg-white rounded-xl shadow-sm border p-4 flex flex-col relative transition ${(inventoryTab === 'completed' || inventoryTab === 'deletable') && isChecked ? 'ring-2 ring-green-400 border-green-400 bg-green-50/20' : ''}`}>
                      {(inventoryTab === 'completed' || inventoryTab === 'deletable') && (
                        <input type="checkbox" checked={isChecked} onChange={() => handleToggleProductSelect(p.id)} className="absolute top-4 left-3 w-5 h-5 text-green-600 cursor-pointer z-10" />
                      )}

                      <button onClick={() => handleDeleteProduct(p.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition" title="Delete Product"><Trash2 size={16}/></button>
                      
                      <div className={`flex space-x-4 items-center mb-3 pr-10 ${(inventoryTab === 'completed' || inventoryTab === 'deletable') ? 'pl-7' : ''}`}>
                        <div className="w-16 h-16 shrink-0 bg-gray-100 rounded-lg overflow-hidden border">
                          {p.product_image ? <img src={p.product_image} alt="" className="w-full h-full object-cover"/> : <ImageIcon className="m-auto text-gray-400 mt-4"/>}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h3 className="font-bold text-gray-800 text-sm truncate" title={p.store_name}>{p.store_name}</h3>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <span className="truncate max-w-[120px]" title={p.keyword}>{p.keyword}</span>
                            <button onClick={() => handleCopy(p.keyword, `kw-${p.id}`)} className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 p-1 rounded transition">
                              {copiedItem === `kw-${p.id}` ? <Check size={12}/> : <Copy size={12}/>}
                            </button>
                          </div>
                          <p className="text-sm font-bold text-blue-600 mt-1">${p.product_price}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded mt-auto border text-sm">
                        <span className="font-medium text-gray-700">Qty Set: {p.order_qty}</span>
                        <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md ${(inventoryTab === 'completed' || inventoryTab === 'deletable') ? 'bg-gray-200 text-gray-600' : p.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{(inventoryTab === 'completed' || inventoryTab === 'deletable') ? 'Archived' : p.status}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {inventoryTab === 'active' && (
                          <>
                            <button onClick={() => handleCompleteProduct(p.id)} className="flex items-center justify-center space-x-1 bg-green-50 text-green-600 px-2 py-1 rounded-lg text-xs font-bold border border-green-200 hover:bg-green-100 transition active:scale-95" title="Archive Inventory"><CheckCircle size={14}/> <span>Archive</span></button>
                            <button onClick={() => setShowBRModal(p)} disabled={p.order_qty <= 0} className="flex items-center justify-center space-x-1 bg-purple-600 disabled:bg-gray-300 text-white px-2 py-1 rounded-lg text-xs font-bold hover:bg-purple-700 transition active:scale-95">
                              <UserPlus size={14}/> <span>Assign BR</span>
                            </button>
                          </>
                        )}
                        {p.product_link && (
                          <div className="flex-1 flex gap-1">
                            <a href={p.product_link} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center space-x-1 bg-blue-50 text-blue-600 py-1 rounded-lg text-xs font-bold border border-blue-100 hover:bg-blue-100 transition"><ExternalLink size={14}/> <span>Link</span></a>
                            <button onClick={() => handleCopy(p.product_link, `link-${p.id}`)} className="bg-gray-50 text-gray-600 py-1 px-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-200 transition active:scale-95">
                              {copiedItem === `link-${p.id}` ? <Check size={14} className="text-green-600"/> : <Copy size={14}/>}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                    <label className="block text-gray-700 mb-1 font-semibold flex items-center"><UploadCloud size={16} className="mr-1"/> Image (Supabase)</label>
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
                <button type="submit" disabled={uploadingImage || isSubmittingProduct} className={`w-full text-white py-3 rounded-lg font-bold shadow-md transition ${uploadingImage || isSubmittingProduct ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 active:bg-blue-700'}`}>{isSubmittingProduct ? 'Adding Product...' : uploadingImage ? 'Uploading...' : 'Save Product'}</button>
              </form>
            </div>
          )}

          {/* TAB: NEW ORDER ENTRY */}
          {activeTab === 'new_order' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-indigo-500">
                <h3 className="font-bold mb-4 flex items-center text-indigo-700 text-lg"><PlusCircle size={20} className="mr-2"/> New Order Entry</h3>
                <form onSubmit={handleSubmitOrder} className="space-y-5 text-sm">
                  <div>
                    <label className="block font-semibold mb-1">Select Product</label>
                    <div className="relative">
                      <div className="w-full border p-3 rounded-lg bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        {selectedProductForOrder ? (
                          <div className="flex items-center space-x-2">
                            <img src={selectedProductForOrder.product_image} className="w-8 h-8 rounded object-cover border bg-white" />
                            <span className="font-medium text-gray-700">{selectedProductForOrder.store_name} - Qty: {selectedProductForOrder.order_qty}</span>
                          </div>
                        ) : ( <span className="text-gray-500">-- Choose Product --</span> )}
                      </div>
                      {isDropdownOpen && (
                        <div className="absolute z-20 w-full bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1">
                          {products.map(p => (
                            <div key={p.id} className="p-3 border-b hover:bg-indigo-50 flex items-center space-x-3 cursor-pointer transition" onClick={() => { setNewOrder({...newOrder, product_id: p.id, current_price: p.product_price, buyer_request_id: ''}); setIsDropdownOpen(false); }}>
                              <img src={p.product_image} className="w-10 h-10 rounded object-cover border bg-white" />
                              <div>
                                <p className="text-sm font-bold text-gray-800">{p.store_name}</p>
                                <p className="text-xs text-gray-500 font-medium">Available Qty: {p.order_qty}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* NEW: BUYER REQUEST DROPDOWN SELECTION */}
                    {newOrder.product_id && relatedBRs.length > 0 && (
                      <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <label className="block font-semibold mb-1 text-purple-800">Select Assigned Buyer (Optional)</label>
                        <select 
                          className="w-full border p-2 rounded outline-none focus:border-purple-400 bg-white"
                          value={newOrder.buyer_request_id}
                          onChange={e => setNewOrder({...newOrder, buyer_request_id: e.target.value})}
                        >
                          <option value="">-- Direct Order (No Assigned Buyer) --</option>
                          {relatedBRs.map(br => (
                            <option key={br.id} value={br.id}>{br.buyer_name} (Assigned: {new Date(br.created_at).toLocaleDateString()})</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-purple-600 mt-1.5 font-semibold">If you select a buyer, their request will be marked complete. Stock won't be deducted twice.</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold mb-1">Order Date</label>
                      <input type="date" required className="w-full border p-2 rounded outline-none bg-blue-50 focus:bg-white" value={newOrder.order_date} onChange={e => setNewOrder({...newOrder, order_date: e.target.value})} />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Order Number</label>
                      <input type="text" required className="w-full border p-2 rounded outline-none focus:border-indigo-400" value={newOrder.order_number} onChange={e => setNewOrder({...newOrder, order_number: e.target.value})} placeholder="e.g. 2000048" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Current Price ($)</label>
                      <input type="number" step="0.01" required className="w-full border p-2 rounded outline-none bg-yellow-50 focus:bg-white focus:border-yellow-400" value={newOrder.current_price} onChange={e => setNewOrder({...newOrder, current_price: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg bg-gray-50">
                      <label className="block text-xs font-bold mb-1">Screenshot 1</label>
                      <input type="file" accept="image/*" className="w-full text-xs cursor-pointer" onChange={e => handleImageUpload(e, setNewOrder, 'order_screenshot_1')} />
                    </div>
                    <div className="p-3 border rounded-lg bg-gray-50">
                      <label className="block text-xs font-bold mb-1">Screenshot 2 (Opt)</label>
                      <input type="file" accept="image/*" className="w-full text-xs cursor-pointer" onChange={e => handleImageUpload(e, setNewOrder, 'order_screenshot_2')} />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">PayPal Email</label>
                    <input type="email" required className="w-full border p-2 rounded outline-none focus:border-indigo-400" value={newOrder.paypal_email} onChange={e => setNewOrder({...newOrder, paypal_email: e.target.value})} />
                  </div>
                  
                  <button type="submit" disabled={uploadingImage || isSubmittingOrder} className={`w-full text-white py-3 rounded-lg font-bold shadow-md transition ${uploadingImage || isSubmittingOrder ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'}`}>
                    {isSubmittingOrder ? 'Submitting Order...' : uploadingImage ? 'Uploading Image...' : 'Submit Order'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: BUYER REQUESTS (BR) */}
          {activeTab === 'buyers_request' && (
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 border-b pb-3 gap-3">
                <h3 className="font-bold text-gray-800 text-xl flex items-center gap-2">Buyer Requests (BR) <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{filteredBRs.length} Active</span></h3>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" placeholder="Search buyer name or product..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400" value={brSearchQuery} onChange={(e) => setBrSearchQuery(e.target.value)} />
                </div>
              </div>

              <div className="space-y-4">
                {filteredBRs.length > 0 ? (
                  filteredBRs.map(br => (
                    <div key={br.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row md:items-center md:justify-between relative pr-12">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <img src={br.product_image || ''} alt="" className="w-12 h-12 rounded object-cover border bg-gray-100 shrink-0"/>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-800">{br.buyer_name}</p>
                            <button onClick={() => handleCopy(br.buyer_name, `br-name-${br.id}`)} className="text-gray-400 hover:text-indigo-600 p-0.5 rounded transition">
                              {copiedItem === `br-name-${br.id}` ? <Check size={14} className="text-green-600"/> : <Copy size={14}/>}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{br.store_name} ({br.keyword})</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Assigned: {new Date(br.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <button onClick={() => handleDeleteBR(br.id)} className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400 hover:text-red-500 p-1.5 rounded-md transition" title="Delete Request & Restore Stock">
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-10 bg-white rounded-xl border border-dashed">No active buyer requests found.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: PENDING REVIEWS */}
          {activeTab === 'pending' && (
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 border-b pb-3 gap-3">
                <h3 className="font-bold text-gray-800 text-xl">Pending Reviews</h3>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" placeholder="Search order number..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>

              <div className="space-y-4">
                {filteredPendingOrders.length > 0 ? (
                  filteredPendingOrders.map(order => {
                    const p = products.find(prod => prod.id === order.product_id);
                    return (
                      <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col relative pr-12">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <img src={p?.product_image || ''} alt="" className="w-12 h-12 rounded object-cover border bg-gray-100 shrink-0"/>
                            <div className="overflow-hidden pr-2">
                              <p className="text-sm font-bold text-gray-800 truncate">{formatHash(order.order_number)}</p>
                              <p className="text-[11px] text-gray-500 truncate">{order.paypal_email}</p>
                            </div>
                          </div>
                        </div>
                        
                        <button onClick={() => handleDeleteOrder(order.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"><Trash2 size={18}/></button>

                        <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                          <button onClick={() => setEditOrderModal(order)} className="text-xs flex items-center space-x-1 text-gray-600 hover:text-blue-600 bg-gray-100 px-3 py-2 rounded-lg font-bold transition"><Edit size={14}/> <span>Edit</span></button>
                          <button onClick={() => setViewOrderModal(order)} className="text-xs flex items-center space-x-1 text-gray-600 hover:text-blue-600 bg-gray-100 px-3 py-2 rounded-lg font-bold transition"><Eye size={14}/> <span>View</span></button>
                          <button onClick={() => setReviewForm({ orderId: order.id, review_screenshot_1: '', review_screenshot_2: '' })} className="text-xs bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold shadow-sm active:scale-95 transition">Add Review</button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500 py-10 bg-white rounded-xl border border-dashed">No orders found matching your search.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: READY FOR EXPORT */}
          {activeTab === 'ready' && (() => {
            const isAllSelected = filteredReadyOrders.length > 0 && selectedExportOrders.length === filteredReadyOrders.length;
            const handleSelectAll = (e) => {
              if (e.target.checked) setSelectedExportOrders(filteredReadyOrders.map(o => o.id));
              else setSelectedExportOrders([]);
            };
            const handleToggleSelect = (id) => {
              if (selectedExportOrders.includes(id)) setSelectedExportOrders(selectedExportOrders.filter(orderId => orderId !== id));
              else setSelectedExportOrders([...selectedExportOrders, id]);
            };

            return (
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-5 border-b pb-3 gap-3">
                  <div className="flex items-center space-x-3 shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">Ready for Export</h2>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">{selectedExportOrders.length} Selected</span>
                  </div>

                  <div className="relative w-full lg:max-w-[200px] xl:max-w-xs">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" placeholder="Search order number..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400" value={readySearchQuery} onChange={(e) => setReadySearchQuery(e.target.value)} />
                  </div>

                  <div className="flex space-x-2 w-full lg:w-auto shrink-0">
                    <button onClick={() => openExportModal('orders')} disabled={selectedExportOrders.length === 0} className="flex-1 lg:flex-none flex justify-center items-center space-x-2 bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg shadow font-medium transition">
                      <Download size={18} /> <span className="text-sm">Export Excel</span>
                    </button>
                    <button onClick={handleMarkAsDone} disabled={selectedExportOrders.length === 0} className="flex-1 lg:flex-none flex justify-center items-center space-x-2 bg-indigo-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg shadow font-medium transition">
                      <CheckCircle size={18} /> <span className="text-sm">Mark as Done</span>
                    </button>
                  </div>
                </div>

                {filteredReadyOrders.length > 0 && (
                  <div className="flex items-center mb-3 px-2">
                    <input type="checkbox" id="selectAll" checked={isAllSelected} onChange={handleSelectAll} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                    <label htmlFor="selectAll" className="ml-2 text-sm font-semibold text-gray-700 cursor-pointer">Select All ({filteredReadyOrders.length})</label>
                  </div>
                )}

                <div className="space-y-4">
                  {filteredReadyOrders.length > 0 ? (
                    filteredReadyOrders.map(order => {
                      const p = products.find(prod => prod.id === order.product_id);
                      const isChecked = selectedExportOrders.includes(order.id);
                      return (
                        <div key={order.id} className={`bg-white p-4 rounded-xl shadow-sm border flex flex-col relative transition ${isChecked ? 'ring-2 ring-blue-400 border-blue-400 bg-blue-50/10' : ''}`}>
                          <div className="flex justify-between items-start pr-8">
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <input type="checkbox" checked={isChecked} onChange={() => handleToggleSelect(order.id)} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer mr-2" />
                              <img src={p?.product_image || ''} alt="" className="w-12 h-12 rounded object-cover border bg-gray-100 shrink-0"/>
                              <div className="overflow-hidden pr-2">
                                <p className="text-sm font-bold text-gray-800 truncate">{formatHash(order.order_number)}</p>
                                <p className="text-[11px] text-gray-500 truncate">{order.paypal_email}</p>
                              </div>
                            </div>
                          </div>
                          
                          <button onClick={() => handleDeleteOrder(order.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition"><Trash2 size={18}/></button>
                          
                          <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                            <span className="px-3 py-1 text-[10px] uppercase font-bold rounded-md bg-blue-100 text-blue-700 mr-auto">Ready</span>
                            <button onClick={() => setEditOrderModal(order)} className="text-xs flex items-center space-x-1 text-gray-600 hover:text-blue-600 bg-gray-100 px-3 py-2 rounded-lg font-bold transition"><Edit size={14}/> <span>Edit</span></button>
                            <button onClick={() => setViewOrderModal(order)} className="text-xs flex items-center space-x-1 text-white hover:text-white bg-blue-600 px-4 py-2 rounded-lg font-bold shadow-sm transition"><Eye size={14}/> <span>View Details</span></button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-500 py-10 bg-white rounded-xl border border-dashed">No reviews ready for export.</p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB: COMPLETED ORDERS */}
          {activeTab === 'completed' && (
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 border-b pb-3 gap-3">
                <h2 className="text-xl font-bold text-gray-800 shrink-0">Completed History</h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" placeholder="Search order number..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400" value={completedSearchQuery} onChange={(e) => setCompletedSearchQuery(e.target.value)} />
                </div>
              </div>

              <div className="space-y-6">
                {productsWithCompleted.length > 0 ? (
                  productsWithCompleted.map(product => (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="bg-gray-100 p-3 flex items-center justify-between border-b">
                        <div className="flex items-center space-x-3">
                          <img src={product.product_image} alt="" className="w-10 h-10 rounded object-cover border bg-white"/>
                          <div><h3 className="font-bold text-sm text-gray-800 leading-tight">{product.store_name}</h3></div>
                        </div>
                        <div className="text-right"><span className="bg-green-600 text-white text-xs px-2 py-1 rounded-lg font-bold">Done: {product.completedList.length}</span></div>
                      </div>
                      <div className="p-2 space-y-2">
                        {product.completedList.map(order => (
                          <div key={order.id} className="flex justify-between items-center p-2 bg-green-50/50 rounded border border-green-100">
                            <div className="overflow-hidden pr-2">
                              <p className="text-xs font-bold text-gray-800 truncate">{formatHash(order.order_number)}</p>
                              <p className="text-[10px] text-gray-500 truncate">{new Date(order.order_date || order.created_at).toLocaleDateString()} • {order.paypal_email}</p>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <button onClick={() => setViewOrderModal(order)} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold transition">View</button>
                              <button onClick={() => setEditOrderModal(order)} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold flex items-center gap-1"><Edit size={10} /> Edit</button>
                              <button onClick={() => handleUndoOrder(order.id)} className="text-[10px] bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded font-bold flex items-center gap-1"><RotateCcw size={10} /> Undo</button>
                              <button onClick={() => handleDeleteOrder(order.id)} className="p-1 text-red-400 hover:text-red-600 ml-1"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-10 bg-white rounded-xl border border-dashed">No completed orders found.</p>
                )}
              </div>
            </div>
          )}

          {/* ASSIGN BUYER REQUEST MODAL */}
          {showBRModal && (
            <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h4 className="font-bold text-lg text-gray-800 mb-2 border-b pb-2">Assign Buyer Request</h4>
                <p className="text-xs text-gray-500 mb-4">Product: <span className="font-bold text-gray-700">{showBRModal.store_name}</span></p>
                <form onSubmit={handleCreateBR}>
                  <div className="mb-5">
                    <label className="block text-sm font-bold mb-2 text-gray-700">Buyer Name</label>
                    <input type="text" autoFocus required className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-purple-500 transition" value={buyerNameInput} onChange={e => setBuyerNameInput(e.target.value)} placeholder="Enter Buyer Name..." />
                  </div>
                  <div className="flex space-x-3">
                    <button type="button" onClick={() => { setShowBRModal(null); setBuyerNameInput(''); }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">Cancel</button>
                    <button type="submit" disabled={isSubmittingBR} className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold shadow-md disabled:bg-purple-300">{isSubmittingBR ? 'Submitting...' : 'Confirm'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT ORDER MODAL */}
          {editOrderModal && (
            <div className="fixed inset-0 bg-black/60 z-[60] overflow-y-auto flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 w-full max-w-lg shadow-xl mt-10 md:mt-0">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h4 className="font-bold text-lg text-gray-800">Edit Order Details</h4>
                  <button onClick={() => setEditOrderModal(null)} className="text-red-500 text-sm font-bold bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100">Close</button>
                </div>
                <form onSubmit={handleUpdateOrder} className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1">Order Date</label>
                      <input type="date" required className="w-full border p-2 rounded outline-none" value={getFormattedDate(editOrderModal.order_date || editOrderModal.created_at)} onChange={e => setEditOrderModal({...editOrderModal, order_date: e.target.value})} />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Order Number</label>
                      <input type="text" required className="w-full border p-2 rounded outline-none" value={editOrderModal.order_number} onChange={e => setEditOrderModal({...editOrderModal, order_number: e.target.value})} />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Current Price ($)</label>
                      <input type="number" step="0.01" required className="w-full border p-2 rounded outline-none" value={editOrderModal.current_price || ''} onChange={e => setEditOrderModal({...editOrderModal, current_price: e.target.value})} />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">PayPal Email</label>
                      <input type="email" required className="w-full border p-2 rounded outline-none" value={editOrderModal.paypal_email} onChange={e => setEditOrderModal({...editOrderModal, paypal_email: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg bg-gray-50">
                      <label className="block text-xs font-bold mb-2">Order Screenshot 1</label>
                      {editOrderModal.order_screenshot_1 && <img src={editOrderModal.order_screenshot_1} className="h-16 w-16 object-cover border rounded mb-2" />}
                      <input type="file" accept="image/*" className="w-full text-xs" onChange={e => handleImageUpload(e, setEditOrderModal, 'order_screenshot_1')} />
                    </div>
                    <div className="p-3 border rounded-lg bg-gray-50">
                      <label className="block text-xs font-bold mb-2">Order Screenshot 2 (Opt)</label>
                      {editOrderModal.order_screenshot_2 && <img src={editOrderModal.order_screenshot_2} className="h-16 w-16 object-cover border rounded mb-2" />}
                      <input type="file" accept="image/*" className="w-full text-xs" onChange={e => handleImageUpload(e, setEditOrderModal, 'order_screenshot_2')} />
                    </div>
                  </div>
                  
                  {/* REVIEW SCREENSHOTS EDIT (Only show if review submitted or completed) */}
                  {(editOrderModal.status === 'review_submitted' || editOrderModal.status === 'completed' || editOrderModal.review_screenshot_1) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg bg-blue-50">
                        <label className="block text-xs font-bold mb-2">Review Screenshot 1</label>
                        {editOrderModal.review_screenshot_1 && <img src={editOrderModal.review_screenshot_1} className="h-16 w-16 object-cover border rounded mb-2" />}
                        <input type="file" accept="image/*" className="w-full text-xs" onChange={e => handleImageUpload(e, setEditOrderModal, 'review_screenshot_1')} />
                      </div>
                      <div className="p-3 border rounded-lg bg-blue-50">
                        <label className="block text-xs font-bold mb-2">Review Screenshot 2 (Opt)</label>
                        {editOrderModal.review_screenshot_2 && <img src={editOrderModal.review_screenshot_2} className="h-16 w-16 object-cover border rounded mb-2" />}
                        <input type="file" accept="image/*" className="w-full text-xs" onChange={e => handleImageUpload(e, setEditOrderModal, 'review_screenshot_2')} />
                      </div>
                    </div>
                  )}
                  <button type="submit" disabled={uploadingImage} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md">{uploadingImage ? 'Uploading Image...' : 'Save Changes'}</button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW DETAILS MODAL */}
          {viewOrderModal && (() => {
            const p = products.find(prod => prod.id === viewOrderModal.product_id);
            return (
              <div className="fixed inset-0 bg-gray-50 z-[60] overflow-y-auto flex flex-col w-full h-full pb-10">
                <div className="bg-white px-4 py-3 border-b flex justify-between items-center sticky top-0 z-20 shadow-sm">
                  <h4 className="font-bold text-lg text-gray-800">Order Details</h4>
                  <button onClick={() => setViewOrderModal(null)} className="flex items-center gap-1 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg font-bold"><X size={18} /> Close</button>
                </div>
                <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
                  <div className="flex items-center space-x-4 mb-6 bg-white p-4 rounded-xl border shadow-sm">
                    <img src={p?.product_image} alt="" className="w-16 h-16 rounded object-cover border"/>
                    <div className="overflow-hidden">
                      <p className="font-bold text-lg text-gray-800 truncate">{p?.store_name}</p>
                      <p className="text-sm text-gray-500 font-medium truncate">{formatHash(viewOrderModal.order_number)} • {viewOrderModal.paypal_email}</p>
                      <p className="text-xs text-blue-600 mt-1 font-bold">Price: ${viewOrderModal.current_price || p?.product_price}</p>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div>
                      <h5 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 border-b pb-2">Order Screenshots</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewOrderModal.order_screenshot_1 ? <a href={viewOrderModal.order_screenshot_1} target="_blank" rel="noreferrer"><img src={viewOrderModal.order_screenshot_1} className="w-full h-auto max-h-[400px] object-contain bg-white rounded-lg border shadow-sm" /></a> : <div className="w-full h-32 bg-white border rounded-lg flex items-center justify-center text-sm text-gray-400">No Image</div>}
                        {viewOrderModal.order_screenshot_2 ? <a href={viewOrderModal.order_screenshot_2} target="_blank" rel="noreferrer"><img src={viewOrderModal.order_screenshot_2} className="w-full h-auto max-h-[400px] object-contain bg-white rounded-lg border shadow-sm" /></a> : null}
                      </div>
                    </div>
                    {(viewOrderModal.review_screenshot_1 || viewOrderModal.review_screenshot_2) && (
                      <div>
                        <h5 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 border-b pb-2">Review Screenshots</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {viewOrderModal.review_screenshot_1 ? <a href={viewOrderModal.review_screenshot_1} target="_blank" rel="noreferrer"><img src={viewOrderModal.review_screenshot_1} className="w-full h-auto max-h-[400px] object-contain bg-white rounded-lg border shadow-sm" /></a> : <div className="w-full h-32 bg-white border rounded-lg flex items-center justify-center text-sm text-gray-400">No Image</div>}
                          {viewOrderModal.review_screenshot_2 ? <a href={viewOrderModal.review_screenshot_2} target="_blank" rel="noreferrer"><img src={viewOrderModal.review_screenshot_2} className="w-full h-auto max-h-[400px] object-contain bg-white rounded-lg border shadow-sm" /></a> : null}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* EXPORT EXCEL MODAL */}
          {showExportModal && (
            <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h4 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Export to Excel</h4>
                <form onSubmit={confirmDownloadExcel}>
                  <div className="mb-5">
                    <label className="block text-sm font-bold mb-2 text-gray-700">File Name</label>
                    <input type="text" autoFocus required className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-green-500" value={exportFileName} onChange={e => setExportFileName(e.target.value)} />
                  </div>
                  <div className="flex space-x-3">
                    <button type="button" onClick={() => setShowExportModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">Cancel</button>
                    <button type="submit" disabled={isExporting} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold shadow-md disabled:bg-green-400">{isExporting ? 'Exporting...' : 'Download'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ADD REVIEW MODAL */}
          {reviewForm.orderId && (
            <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h4 className="font-bold text-gray-800">Submit Review</h4>
                  <button onClick={() => setReviewForm({ orderId: null, review_screenshot_1: '', review_screenshot_2: '' })} className="text-red-500 text-sm font-bold">Close</button>
                </div>
                <div className="flex items-center space-x-3 mb-4 bg-gray-50 p-2 rounded border">
                  <img src={reviewProductData?.product_image} alt="" className="w-10 h-10 rounded object-cover"/>
                  <p className="text-xs font-bold truncate">{formatHash(reviewOrderData?.order_number)}</p>
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
                  <button type="submit" disabled={uploadingImage || isSubmittingReview} className="w-full py-3 rounded-xl text-sm font-bold shadow bg-yellow-500 text-white">{isSubmittingReview ? 'Saving Review...' : 'Save Review'}</button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MOBILE SCROLLABLE NAV */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex overflow-x-auto whitespace-nowrap py-2 pb-4 text-[9px] font-bold text-gray-500 z-[50] scrollbar-none">
        <button onClick={() => setActiveTab('products')} className={`flex flex-col items-center px-4 py-1 rounded-lg shrink-0 ${activeTab === 'products' ? 'text-blue-600 bg-blue-50' : ''}`}><Home size={18} className="mb-1"/>Products</button>
        <button onClick={() => setActiveTab('add_product')} className={`flex flex-col items-center px-4 py-1 rounded-lg shrink-0 ${activeTab === 'add_product' ? 'text-blue-600 bg-blue-50' : ''}`}><PlusCircle size={18} className="mb-1"/>Add Prod</button>
        <button onClick={() => setActiveTab('new_order')} className={`flex flex-col items-center px-4 py-1 rounded-lg shrink-0 ${activeTab === 'new_order' ? 'text-indigo-600 bg-indigo-50' : ''}`}><ShoppingCart size={18} className="mb-1"/>Order</button>
        <button onClick={() => setActiveTab('buyers_request')} className={`flex flex-col items-center px-4 py-1 rounded-lg shrink-0 ${activeTab === 'buyers_request' ? 'text-purple-600 bg-purple-50' : ''}`}><Clock size={18} className="mb-1"/>BR List</button>
        <button onClick={() => setActiveTab('pending')} className={`flex flex-col items-center px-4 py-1 rounded-lg shrink-0 ${activeTab === 'pending' ? 'text-indigo-600 bg-indigo-50' : ''}`}><Clock size={18} className="mb-1"/>Pending</button>
        <button onClick={() => setActiveTab('ready')} className={`flex flex-col items-center px-4 py-1 rounded-lg shrink-0 ${activeTab === 'ready' ? 'text-indigo-600 bg-indigo-50' : ''}`}><List size={18} className="mb-1"/>Ready</button>
        <button onClick={() => setActiveTab('completed')} className={`flex flex-col items-center px-4 py-1 rounded-lg shrink-0 ${activeTab === 'completed' ? 'text-green-600 bg-green-50' : ''}`}><CheckSquare size={18} className="mb-1"/>Done</button>
      </nav>

    </div>
  );
};

export default Dashboard;