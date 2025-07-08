import React, { useState, useEffect, useCallback } from 'react'; // useCallback ekledik

const PublicDashboard = () => {
  const [detailData, setDetailData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filtre state'leri
  const [filters, setFilters] = useState({
    siparisNo: '',
    startDate: '',
    endDate: '',
    minParca: '',
    maxParca: ''
  });

  // Süre formatı (aynı kalıyor)
  const formatDuration = (timeStr) => {
    if (!timeStr || timeStr.toString().trim() === '') return '-';
    
    try {
      const str = timeStr.toString().trim();
      
      const hourMatch = str.match(/(\d+)\s*S/);
      const minuteMatch = str.match(/(\d+)\s*dk/);
      const secondMatch = str.match(/(\d+)\s*sn/);
      
      const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
      const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
      const seconds = secondMatch ? parseInt(secondMatch[1]) : 0;
      
      if (hours === 0 && minutes === 0 && seconds === 0) return '-';
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else if (minutes > 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      } else {
        return `0:${seconds.toString().padStart(2, '0')}`;
      }
      
    } catch (error) {
      return timeStr;
    }
  };

  // Tarih formatı (aynı kalıyor)
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      }) + ' ' + date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '-';
    }
  };

  // Filtreleme fonksiyonu - NULL kontrolü eklendi
  const applyFilters = useCallback((data) => {
    return data.filter(item => {
      // Sipariş no filtresi - NULL kontrolü
      if (filters.siparisNo) {
        const siparisNo = item.siparisNo || ''; // NULL ise boş string
        if (!siparisNo.toString().toLowerCase().includes(filters.siparisNo.toLowerCase())) {
          return false;
        }
      }

      // Tarih filtreleri
      if (filters.startDate || filters.endDate) {
        const itemDate = item.baslatmaSaati ? new Date(item.baslatmaSaati) : null;
        
        if (itemDate) {
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            if (itemDate < startDate) return false;
          }
          
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59);
            if (itemDate > endDate) return false;
          }
        }
      }

      // Parça adeti filtreleri
      if (filters.minParca && item.parcaAdeti < parseInt(filters.minParca)) {
        return false;
      }
      
      if (filters.maxParca && item.parcaAdeti > parseInt(filters.maxParca)) {
        return false;
      }

      return true;
    });
  }, [filters]); // filters dependency eklendi

  // Filtre değişikliği
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Filtreleri temizle
  const clearFilters = () => {
    setFilters({
      siparisNo: '',
      startDate: '',
      endDate: '',
      minParca: '',
      maxParca: ''
    });
    setCurrentPage(1);
  };

  // API'den veri çek - useCallback ile optimize edildi
  const fetchDetailData = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:5000/api/dashboard-detail');
      if (response.ok) {
        const result = await response.json();
        const data = result.data || [];
        setDetailData(data);
      } else {
        throw new Error('Veri alınamadı');
      }
      
      setError(null);
      
    } catch (err) {
      console.error('API Hatası:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []); // Boş dependency array

  // Veriler değiştiğinde filtreleri uygula
  useEffect(() => {
    const filtered = applyFilters(detailData);
    setFilteredData(filtered);
  }, [detailData, applyFilters]); // applyFilters dependency eklendi

  useEffect(() => {
    fetchDetailData();
    const interval = setInterval(fetchDetailData, 60000);
    return () => clearInterval(interval);
  }, [fetchDetailData]); // fetchDetailData dependency eklendi

  // Filtrelenmiş verilerin sayfalanması
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Loading durumu (aynı kalıyor)
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '5px solid #DC2626',
            borderTop: '5px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#666' }}>Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error durumu (aynı kalıyor)
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: '#DC2626', marginBottom: '10px' }}>⚠️ Bağlantı Hatası</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Backend server'a bağlanılamıyor: {error}
          </p>
          <button 
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            🔄 Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      
      {/* Header (aynı kalıyor) */}
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
            Son Güncelleme: {new Date().toLocaleTimeString('tr-TR')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '5px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#10B981', 
              borderRadius: '50%',
              marginRight: '5px',
              animation: 'pulse 2s infinite'
            }}></div>
            <p style={{ margin: 0, fontSize: '12px', color: '#10B981' }}>
              Canlı Veri ({filteredData.length}/{detailData.length} kayıt)
            </p>
          </div>
        </div>
      </header>

      {/* Ana İçerik */}
      <main style={{ padding: '20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Filtre Paneli (aynı kalıyor ama sipariş no vurgulama düzeltildi) */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔍 Filtreler
            </h4>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '15px'
            }}>
              
              {/* Sipariş No Arama */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px', color: '#555' }}>
                  Sipariş No
                </label>
                <input
                  type="text"
                  value={filters.siparisNo}
                  onChange={(e) => handleFilterChange('siparisNo', e.target.value)}
                  placeholder="Sipariş no ara..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Başlangıç Tarihi */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px', color: '#555' }}>
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Bitiş Tarihi */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px', color: '#555' }}>
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Parça Adeti Min */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px', color: '#555' }}>
                  Min Parça
                </label>
                <input
                  type="number"
                  value={filters.minParca}
                  onChange={(e) => handleFilterChange('minParca', e.target.value)}
                  placeholder="Min değer"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Parça Adeti Max */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px', color: '#555' }}>
                  Max Parça
                </label>
                <input
                  type="number"
                  value={filters.maxParca}
                  onChange={(e) => handleFilterChange('maxParca', e.target.value)}
                  placeholder="Max değer"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Filtre Butonları */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={clearFilters}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🗑️ Temizle
              </button>
              
              <span style={{ 
                padding: '8px 12px',
                backgroundColor: filteredData.length !== detailData.length ? '#EFF6FF' : '#F3F4F6',
                color: filteredData.length !== detailData.length ? '#1D4ED8' : '#6B7280',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {filteredData.length !== detailData.length ? 
                  `${filteredData.length}/${detailData.length} kayıt gösteriliyor` :
                  `${detailData.length} kayıt`
                }
              </span>
            </div>
          </div>
          
          {/* Tablo */}
          <div className="card">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#333', margin: 0, fontSize: '20px' }}>
                📋 Üretim Verileri
              </h3>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Sayfa {currentPage}/{totalPages}
              </div>
            </div>
            
            {filteredData.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px',
                color: '#666'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                  {detailData.length === 0 ? '📄' : '🔍'}
                </div>
                <h3 style={{ color: '#333', marginBottom: '10px' }}>
                  {detailData.length === 0 ? 'Henüz veri yok' : 'Filtre sonucu bulunamadı'}
                </h3>
                <p>
                  {detailData.length === 0 ? 
                    'Excel dosyası yüklendiğinde veriler burada görünecek.' :
                    'Filtre kriterlerinizi değiştirerek tekrar deneyin.'
                  }
                </p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '15px 10px', textAlign: 'left', border: '1px solid #dee2e6', minWidth: '130px' }}>
                          Sipariş No
                        </th>
                        <th style={{ padding: '15px 10px', textAlign: 'center', border: '1px solid #dee2e6', minWidth: '120px' }}>
                          Başlangıç
                        </th>
                        <th style={{ padding: '15px 10px', textAlign: 'center', border: '1px solid #dee2e6', minWidth: '120px' }}>
                          Bitiş
                        </th>
                        <th style={{ padding: '15px 10px', textAlign: 'center', border: '1px solid #dee2e6', minWidth: '90px' }}>
                          Toplam Süre
                        </th>
                        <th style={{ padding: '15px 10px', textAlign: 'center', border: '1px solid #dee2e6', minWidth: '80px' }}>
                          Üretilen
                        </th>
                        <th style={{ padding: '15px 10px', textAlign: 'center', border: '1px solid #dee2e6', minWidth: '80px' }}>
                          Hurda
                        </th>
                        <th style={{ padding: '15px 10px', textAlign: 'center', border: '1px solid #dee2e6', minWidth: '90px' }}>
                          Verimlilik
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.map((item, index) => {
                        const hurdaOrani = item.parcaAdeti > 0 ? 
                          ((item.hurdaAdeti / (item.parcaAdeti + item.hurdaAdeti)) * 100).toFixed(1) : '0';
                        
                        // Sipariş no için güvenli string kontrolü
                        const siparisNoStr = (item.siparisNo || '').toString();
                        const highlightedSiparisNo = filters.siparisNo && siparisNoStr.toLowerCase().includes(filters.siparisNo.toLowerCase()) ?
                          siparisNoStr.replace(
                            new RegExp(filters.siparisNo, 'gi'),
                            `<mark style="background-color: #FEF3C7; padding: 2px 4px; border-radius: 3px;">$&</mark>`
                          ) : siparisNoStr;
                        
                        return (
                          <tr key={index} style={{ 
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                          }}>
                            {/* Sipariş No */}
                            <td style={{ 
                              padding: '15px 10px', 
                              border: '1px solid #dee2e6',
                              fontWeight: '500'
                            }}>
                              <span dangerouslySetInnerHTML={{ __html: highlightedSiparisNo || '-' }} />
                            </td>
                            
                            {/* Başlangıç */}
                            <td style={{ 
                              padding: '15px 10px', 
                              border: '1px solid #dee2e6',
                              textAlign: 'center',
                              fontSize: '13px'
                            }}>
                              {formatDateTime(item.baslatmaSaati)}
                            </td>
                            
                            {/* Bitiş */}
                            <td style={{ 
                              padding: '15px 10px', 
                              border: '1px solid #dee2e6',
                              textAlign: 'center',
                              fontSize: '13px'
                            }}>
                              {formatDateTime(item.bitirmeSaati)}
                            </td>
                            
                            {/* Toplam Süre */}
                            <td style={{ 
                              padding: '15px 10px', 
                              border: '1px solid #dee2e6',
                              textAlign: 'center',
                              fontWeight: '500',
                              fontFamily: 'monospace'
                            }}>
                              {formatDuration(item.toplamSure)}
                            </td>
                            
                            {/* Üretilen Parça */}
                            <td style={{ 
                              padding: '15px 10px', 
                              border: '1px solid #dee2e6',
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: item.parcaAdeti > 0 ? '#059669' : '#6B7280'
                            }}>
                              {item.parcaAdeti || '0'}
                            </td>
                            
                            {/* Hurda */}
                            <td style={{ 
                              padding: '15px 10px', 
                              border: '1px solid #dee2e6',
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: item.hurdaAdeti > 0 ? '#DC2626' : '#6B7280'
                            }}>
                              {item.hurdaAdeti || '0'}
                            </td>
                            
                            {/* Verimlilik */}
                            <td style={{ 
                              padding: '15px 10px', 
                              border: '1px solid #dee2e6',
                              textAlign: 'center'
                            }}>
                              <span style={{
                                padding: '5px 10px',
                                borderRadius: '15px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: parseFloat(hurdaOrani) < 5 ? '#dcfce7' : 
                                                parseFloat(hurdaOrani) < 10 ? '#fef3c7' : '#fecaca',
                                color: parseFloat(hurdaOrani) < 5 ? '#166534' : 
                                       parseFloat(hurdaOrani) < 10 ? '#92400e' : '#dc2626'
                              }}>
                                {100 - parseFloat(hurdaOrani)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Sayfalama */}
                {totalPages > 1 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    marginTop: '25px',
                    gap: '15px'
                  }}>
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '10px 15px',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        backgroundColor: currentPage === 1 ? '#f5f5f5' : 'white',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      ◀ Önceki
                    </button>
                    
                    <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                      Sayfa {currentPage} / {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '10px 15px',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        backgroundColor: currentPage === totalPages ? '#f5f5f5' : 'white',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Sonraki ▶
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* CSS Animasyonları */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default PublicDashboard;