import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Lock } from 'lucide-react';

// আপনার Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDTYCGMJ0_PNlCYI8BW8RAt1eaNDmsjEwc",
  authDomain: "orderms-a4f49.firebaseapp.com",
  projectId: "orderms-a4f49",
  storageBucket: "orderms-a4f49.firebasestorage.app",
  messagingSenderId: "188894786569",
  appId: "1:188894786569:web:00eac8cebd60ad8d7f34d8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// শুধুমাত্র আপনার ইমেইলটি এখানে সেট করুন
const ADMIN_EMAIL = "witchbella17@gmail.com"; 

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // সিকিউরিটি চেক: ইমেইল না মিললে লগআউট
      if (user.email === ADMIN_EMAIL) {
        localStorage.setItem('adminToken', 'google-auth-success'); // সিম্পল টোকেন
        navigate('/');
      } else {
        setError('অ্যাক্সেস ডিনাইড! এই ইমেইলটি অনুমোদিত নয়।');
        await auth.signOut();
      }
    } catch (err) {
      setError('লগইন ফেইল হয়েছে। আবার চেষ্টা করুন।');
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

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition font-medium flex justify-center items-center gap-2"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          {loading ? 'লগইন হচ্ছে...' : 'Google দিয়ে লগইন করুন'}
        </button>
      </div>
    </div>
  );
};

export default Login;