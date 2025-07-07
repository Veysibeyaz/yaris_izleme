import React, { useState } from 'react';
import YarisLogo from './YarisLogo';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true); // true = giriş, false = kayıt
  const [userType, setUserType] = useState('user');
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    confirmPassword: '', // Kayıt için
    fullName: '',        // Kayıt için
    email: ''           // Kayıt için
  });

  const handleSubmit = () => {
    if (isLogin) {
      // Giriş işlemi
      console.log('Giriş yapılıyor:', userType, credentials);
      alert(`${userType} olarak giriş yapıldı!`);
    } else {
      // Kayıt işlemi
      if (credentials.password !== credentials.confirmPassword) {
        alert('Şifreler eşleşmiyor!');
        return;
      }
      if (!credentials.fullName || !credentials.email) {
        alert('Lütfen tüm alanları doldurun!');
        return;
      }
      console.log('Kayıt oluşturuluyor:', credentials);
      alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
      setIsLogin(true); // Kayıt sonrası giriş ekranına dön
      setCredentials({ username: '', password: '', confirmPassword: '', fullName: '', email: '' });
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setCredentials({ username: '', password: '', confirmPassword: '', fullName: '', email: '' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <YarisLogo />
        
        {/* Başlık */}
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          color: '#333',
          fontSize: '24px'
        }}>
          {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
        </h2>

        {/* Kullanıcı Tipi Seçimi - Sadece Giriş'te */}
        {isLogin && (
          <div style={{
            display: 'flex',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            padding: '4px',
            marginBottom: '24px'
          }}>
            <button
              onClick={() => setUserType('user')}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: userType === 'user' ? 'white' : 'transparent',
                color: userType === 'user' ? '#333' : '#666',
                cursor: 'pointer',
                fontWeight: userType === 'user' ? '600' : 'normal'
              }}
            >
              👤 Kullanıcı
            </button>
            <button
              onClick={() => setUserType('admin')}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: userType === 'admin' ? 'white' : 'transparent',
                color: userType === 'admin' ? '#333' : '#666',
                cursor: 'pointer',
                fontWeight: userType === 'admin' ? '600' : 'normal'
              }}
            >
              🛡️ Admin
            </button>
          </div>
        )}

        {/* Form Alanları */}
        <div style={{ marginBottom: '20px' }}>
          
          {/* Ad Soyad - Sadece Kayıt'ta */}
          {!isLogin && (
            <>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Ad Soyad
              </label>
              <input
                type="text"
                value={credentials.fullName}
                onChange={(e) => setCredentials({...credentials, fullName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="Adınızı ve soyadınızı girin"
              />

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                E-posta
              </label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="E-posta adresinizi girin"
              />
            </>
          )}

          {/* Kullanıcı Adı */}
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Kullanıcı Adı
          </label>
          <input
            type="text"
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              marginBottom: '16px',
              boxSizing: 'border-box'
            }}
            placeholder="Kullanıcı adınızı girin"
          />
          
          {/* Şifre */}
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Şifre
          </label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              marginBottom: '16px',
              boxSizing: 'border-box'
            }}
            placeholder="Şifrenizi girin"
          />

          {/* Şifre Tekrar - Sadece Kayıt'ta */}
          {!isLogin && (
            <>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Şifre Tekrar
              </label>
              <input
                type="password"
                value={credentials.confirmPassword}
                onChange={(e) => setCredentials({...credentials, confirmPassword: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="Şifrenizi tekrar girin"
              />
            </>
          )}
        </div>

        {/* Ana Buton */}
        <button 
          className="btn-primary"
          onClick={handleSubmit}
          style={{ width: '100%', fontSize: '16px', marginBottom: '16px' }}
        >
          {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
        </button>

        {/* Geçiş Butonu */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
            {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
          </p>
          <button
            onClick={toggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: '#DC2626',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        </div>

        {/* Demo Bilgileri - Sadece Giriş'te */}
        {isLogin && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#666'
          }}>
            <strong>Demo Hesaplar:</strong><br/>
            Kullanıcı: kullanici / 123456<br/>
            Admin: admin / admin123
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;