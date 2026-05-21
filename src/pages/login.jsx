import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ব্যাকএন্ডের API তে লগইন রিকোয়েস্ট পাঠানো (আপনার লোকালহোস্ট পোর্ট 5000)
      const response = await axios.post('https://oms-backend-b5o2.onrender.com/api/admin/login', {
        email,
        password,
      });

      if (response.data.success) {
        // টোকেনটি লোকাল স্টোরেজে সেভ করা
        localStorage.setItem('adminToken', response.data.token);
        // লগইন সফল হলে ড্যাশবোর্ডে পাঠিয়ে দেওয়া
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'লগইন ফেইল হয়েছে। ইমেইল বা পাসওয়ার্ড চেক করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full text-white">
            <Lock size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">অ্যাডমিন লগইন</h2>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">ইমেইল</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@jaman.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">পাসওয়ার্ড</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-medium flex justify-center items-center"
          >
            {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;