import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Admin şifresi (gerçek projede backend'den gelecek)
  const ADMIN_PASSWORD = 'admin123';

  // Component yüklendiğinde dosya listesini çek
  useEffect(() => {
    if (isAuthenticated) {
      fetchFileList();
    }
  }, [isAuthenticated]);

  // Dosya listesini API'den çek
  const fetchFileList = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/files');
      if (response.ok) {
        const data = await response.json();
        
        // API'den gelen veriyi frontend formatına çevir
        const formattedFiles = data.files.map(file => ({
          id: file.id,
          name: file.name,
          date: new Date(file.uploadDate).toLocaleString('tr-TR'),
          status: file.status === 'processed' ? 'Başarılı' : 'Hata',
          size: file.size,
          rowCount: file.rowCount
        }));
        
        setUploadedFiles(formattedFiles);
      }
    } catch (error) {
      console.error('Dosya listesi alınamadı:', error);
    }
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      alert('Hatalı şifre!');
      setPassword('');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📁 Dosya seçildi:', file.name);

    // Dosya tipini kontrol et
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert('Sadece Excel (.xlsx, .xls) ve CSV dosyaları yükleyebilirsiniz!');
      return;
    }

    // Upload işlemi başladı
    setLoading(true);

    // FormData oluştur
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('📤 Dosya backend\'e gönderiliyor...');
      
      // Backend'e gönder
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Upload başarılı:', result);
        
        // Dosya listesini yenile
        fetchFileList();
        
        // Detaylı başarı mesajı
        alert(`🎉 ${file.name} başarıyla yüklendi ve işlendi!\n\n` +
              `📊 İşlenen satır sayısı: ${result.file.rowCount}\n` +
              `📈 Dashboard otomatik güncellendi!\n\n` +
              `Yeni Dashboard İstatistikleri:\n` +
              `• Toplam Üretim: ${result.stats.totalProduction.toLocaleString('tr-TR')}\n` +
              `• Makina Performansı: ${result.stats.machinePerformance}%\n` +
              `• Aktif Operatör: ${result.stats.activeOperators}\n` +
              `• Beklemede: ${result.stats.pendingOrders}\n\n` +
              `Ana sayfayı yenileyin ve değişiklikleri görün!`);
        
      } else {
        throw new Error(result.message || 'Upload hatası');
      }
      
    } catch (error) {
      console.error('❌ Upload hatası:', error);
      alert(`❌ Dosya yükleme hatası:\n\n${error.message}\n\n` +
            `Olası çözümler:\n` +
            `• Backend server'ın çalıştığından emin olun (localhost:5000)\n` +
            `• Dosya formatının doğru olduğunu kontrol edin\n` +
            `• Dosya boyutunun 10MB'dan küçük olduğunu kontrol edin`);
    } finally {
      setLoading(false);
      // Input'u temizle
      event.target.value = '';
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setUploadedFiles([]);
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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* API Durum Göstergesi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#10B981', 
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>API Bağlı</span>
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
        </div>
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
              backgroundColor: loading ? '#f3f4f6' : '#fef2f2',
              marginBottom: '20px',
              opacity: loading ? 0.7 : 1
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
                  <span style={{ color: 'white', fontSize: '24px' }}>
                    {loading ? '⏳' : '📊'}
                  </span>
                </div>
                <h3 style={{ color: '#333', marginBottom: '8px' }}>
                  {loading ? 'Dosya Yükleniyor ve İşleniyor...' : 'Excel Dosyasını Sürükleyin veya Seçin'}
                </h3>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  {loading ? 'Lütfen bekleyin, dosya backend\'de parse ediliyor...' : 'Desteklenen formatlar: .xlsx, .xls, .csv (Max: 10MB)'}
                </p>
              </div>
              
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="fileInput"
                disabled={loading}
              />
              <label
                htmlFor="fileInput"
                className={loading ? '' : 'btn-primary'}
                style={{ 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  display: 'inline-block',
                  backgroundColor: loading ? '#9CA3AF' : '#DC2626',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                {loading ? '⏳ Yükleniyor...' : '📁 Dosya Seç'}
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
              📋 Yüklenen Dosyalar ({uploadedFiles.length})
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Dosya Adı</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Boyut</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Satır Sayısı</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Tarih</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedFiles.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ 
                        padding: '20px', 
                        textAlign: 'center', 
                        color: '#666',
                        border: '1px solid #dee2e6'
                      }}>
                        📄 Henüz dosya yüklenmedi. Excel dosyası yükleyerek başlayın!
                      </td>
                    </tr>
                  ) : (
                    uploadedFiles.map((file) => (
                      <tr key={file.id}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: '500' }}>
                          📄 {file.name}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', color: '#666' }}>
                          {file.size}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', color: '#666' }}>
                          {file.rowCount ? `${file.rowCount} satır` : '-'}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* CSS Animasyonları */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;