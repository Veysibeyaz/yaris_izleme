import React, { useState } from 'react';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([
    // Demo veriler
    { id: 1, name: 'Online_İzleme_Veri_Dosyası.csv', date: '07.07.2025 14:30', status: 'Başarılı', size: '2.3 MB' },
    { id: 2, name: 'Üretim_Verileri_Haziran.xlsx', date: '30.06.2025 16:45', status: 'Başarılı', size: '1.8 MB' },
    { id: 3, name: 'Performans_Raporu.csv', date: '25.06.2025 09:15', status: 'Hata', size: '934 KB' },
  ]);

  // Admin şifresi (gerçek projede backend'den gelecek)
  const ADMIN_PASSWORD = 'admin123';

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      alert('Hatalı şifre!');
      setPassword('');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Dosya tipini kontrol et
      const allowedTypes = ['.xlsx', '.xls', '.csv'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        alert('Sadece Excel (.xlsx, .xls) ve CSV dosyaları yükleyebilirsiniz!');
        return;
      }

      // Yeni dosyayı listeye ekle
      const newFile = {
        id: Date.now(),
        name: file.name,
        date: new Date().toLocaleString('tr-TR'),
        status: 'Başarılı',
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      };
      
      setUploadedFiles([newFile, ...uploadedFiles]);
      
      // Başarı mesajı
      alert(`${file.name} başarıyla yüklendi! Dashboard güncellenecek.`);
      
      // Input'u temizle
      event.target.value = '';
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
  };

  // Şifre Ekranı
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          
          {/* Logo */}
          <img 
            src="/yaris_logo.png" 
            alt="Yarış Logo" 
            style={{
              width: '80px',
              height: 'auto',
              marginBottom: '20px',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }}
          />
          
          <h1 style={{ fontSize: '24px', margin: '0 0 10px 0', color: '#333' }}>
            🛡️ Admin Panel
          </h1>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '30px' }}>
            Lütfen admin şifresini girin
          </p>

          {/* Şifre Formu */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                marginBottom: '16px',
                boxSizing: 'border-box',
                textAlign: 'center'
              }}
              placeholder="Admin şifresi"
              autoFocus
            />
            
            <button 
              className="btn-primary"
              onClick={handleLogin}
              style={{ width: '100%', fontSize: '16px' }}
            >
              🔓 Giriş Yap
            </button>
          </div>

          {/* Demo Bilgisi */}
          <div style={{
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#666'
          }}>
            <strong>Demo Şifre:</strong> admin123
          </div>
        </div>
      </div>
    );
  }

  // Admin Panel Ana Ekranı
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      
      {/* Header */}
      <header style={{ 
        backgroundColor: '#1f2937', 
        color: 'white',
        padding: '15px 20px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/yaris_logo.png" 
            alt="Yarış" 
            style={{ width: '40px', marginRight: '15px', filter: 'brightness(0) invert(1)' }} 
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '20px' }}>🛡️ YARIŞ Admin Panel</h1>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Veri Yönetim Sistemi</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          style={{
            background: '#DC2626',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🚪 Çıkış
        </button>
      </header>

      {/* Content */}
      <main style={{ padding: '30px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Upload Section */}
          <div className="card" style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              color: '#333', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📤 Excel Dosyası Yükle
            </h2>
            
            {/* Upload Area */}
            <div style={{
              border: '2px dashed #DC2626',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#fef2f2',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#DC2626',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '15px'
                }}>
                  <span style={{ color: 'white', fontSize: '24px' }}>📊</span>
                </div>
                <h3 style={{ color: '#333', marginBottom: '8px' }}>
                  Excel Dosyasını Sürükleyin veya Seçin
                </h3>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Desteklenen formatlar: .xlsx, .xls, .csv
                </p>
              </div>
              
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                className="btn-primary"
                style={{ cursor: 'pointer', display: 'inline-block' }}
              >
                📁 Dosya Seç
              </label>
            </div>
          </div>

          {/* File List */}
          <div className="card">
            <h3 style={{ 
              color: '#333', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📋 Yüklenen Dosyalar
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Dosya Adı</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Boyut</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Tarih</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedFiles.map((file) => (
                    <tr key={file.id}>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: '500' }}>
                        📄 {file.name}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6', color: '#666' }}>
                        {file.size}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6', color: '#666' }}>
                        {file.date}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: file.status === 'Başarılı' ? '#dcfce7' : '#fecaca',
                          color: file.status === 'Başarılı' ? '#166534' : '#dc2626'
                        }}>
                          {file.status === 'Başarılı' ? '✅' : '❌'} {file.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminPanel;