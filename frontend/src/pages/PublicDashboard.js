import React, { useState, useEffect } from 'react';

const PublicDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Her 30 saniyede bir zamanı güncelle (gerçek projede veri yenilenecek)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'white', 
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
            style={{ width: '50px', marginRight: '15px' }} 
          />
          <div>
            <h1 style={{ margin: 0, color: '#333', fontSize: '24px' }}>YARIŞ</h1>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Üretim İzleme Sistemi</p>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            Son Güncelleme: {currentTime.toLocaleTimeString('tr-TR')}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
            Otomatik yenileniyor...
          </p>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: '30px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Başlık */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '32px', color: '#333', marginBottom: '10px' }}>
              📊 Üretim Dashboard
            </h2>
            <p style={{ color: '#666', fontSize: '16px' }}>
              Anlık üretim verileri ve performans göstergeleri
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            
            {/* Kart 1 - Toplam Üretim */}
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#DC2626', fontSize: '18px', marginBottom: '10px' }}>
                📦 Toplam Üretim
              </h3>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#333', margin: '10px 0' }}>
                1,247
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>Bu ay</p>
            </div>

            {/* Kart 2 - Makina Performansı */}
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#059669', fontSize: '18px', marginBottom: '10px' }}>
                ⚙️ Makina Performansı
              </h3>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#333', margin: '10px 0' }}>
                87%
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>Ortalama</p>
            </div>

            {/* Kart 3 - Aktif Operatör */}
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#7C3AED', fontSize: '18px', marginBottom: '10px' }}>
                👥 Aktif Operatör
              </h3>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#333', margin: '10px 0' }}>
                12
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>Çalışan</p>
            </div>

            {/* Kart 4 - Beklemede */}
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#EA580C', fontSize: '18px', marginBottom: '10px' }}>
                ⏳ Beklemede
              </h3>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#333', margin: '10px 0' }}>
                8
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>Sipariş</p>
            </div>
          </div>

          {/* Bilgi Mesajı */}
          <div className="card" style={{ 
            backgroundColor: '#EFF6FF', 
            border: '1px solid #DBEAFE',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#1D4ED8', marginBottom: '10px' }}>
              🔄 Canlı Veri Akışı
            </h3>
            <p style={{ color: '#1E40AF', margin: 0 }}>
              Veriler admin panelinden yüklendiğinde otomatik olarak burada görünecektir.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default PublicDashboard;