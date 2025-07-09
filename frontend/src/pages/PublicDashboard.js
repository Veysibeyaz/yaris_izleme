import React, { useState, useEffect, useCallback } from 'react';

const PublicDashboard = () => {
  const [detailData, setDetailData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const itemsPerPage = 12;

  // Filtre state'leri
  const [filters, setFilters] = useState({
    siparisNo: '',
    startDate: '',
    endDate: '',
    minParca: '',
    maxParca: ''
  });

  // Dark mode toggle fonksiyonu
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Süre formatı
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

  // Tarih formatı
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

  // Filtreleme fonksiyonu - GÜVENLİ
  const applyFilters = useCallback((data) => {
    if (!data || !Array.isArray(data)) {
      console.warn('⚠️ Filtre: Geçersiz veri');
      return [];
    }

    return data.filter(item => {
      if (!item) return false;

      // Sipariş no filtresi - GÜVENLİ
      if (filters.siparisNo && filters.siparisNo.trim() !== '') {
        try {
          const siparisNo = (item.siparisNo || '').toString().toLowerCase();
          const searchTerm = filters.siparisNo.toLowerCase().trim();
          
          if (!siparisNo.includes(searchTerm)) {
            // Console'da filtrelenen sipariş numaralarını göster
            console.log(`🔍 Filtrelendi: "${item.siparisNo}" (arama: "${filters.siparisNo}")`);
            return false;
          } else {
            // Console'da bulunan sipariş numaralarını göster
            console.log(`✅ Eşleşme: "${item.siparisNo}" (arama: "${filters.siparisNo}")`);
          }
        } catch (error) {
          console.error('❌ Sipariş no filtre hatası:', error, item);
          return false;
        }
      }

      // Tarih filtresi - GÜVENLİ
      if (filters.startDate || filters.endDate) {
        try {
          let itemDate = null;
          
          if (item.baslatmaSaati) {
            itemDate = new Date(item.baslatmaSaati);
            
            // Geçersiz tarih kontrolü
            if (isNaN(itemDate.getTime())) {
              itemDate = null;
            }
          }
          
          if (itemDate) {
            if (filters.startDate) {
              const startDate = new Date(filters.startDate);
              if (!isNaN(startDate.getTime()) && itemDate < startDate) {
                return false;
              }
            }
            
            if (filters.endDate) {
              const endDate = new Date(filters.endDate);
              if (!isNaN(endDate.getTime())) {
                endDate.setHours(23, 59, 59, 999);
                if (itemDate > endDate) {
                  return false;
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Tarih filtre hatası:', error, item);
          // Tarih hatası olursa öğeyi dahil et
        }
      }

      // Parça adeti filtresi - GÜVENLİ
      try {
        const parcaAdeti = parseInt(item.parcaAdeti) || 0;
        
        if (filters.minParca && !isNaN(parseInt(filters.minParca))) {
          if (parcaAdeti < parseInt(filters.minParca)) {
            return false;
          }
        }
        
        if (filters.maxParca && !isNaN(parseInt(filters.maxParca))) {
          if (parcaAdeti > parseInt(filters.maxParca)) {
            return false;
          }
        }
      } catch (error) {
        console.error('❌ Parça adeti filtre hatası:', error, item);
        // Hata olursa öğeyi dahil et
      }

      return true;
    });
  }, [filters]);

  // Filtre değişikliği - GÜVENLİ
  const handleFilterChange = (key, value) => {
    try {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      setCurrentPage(1);
    } catch (error) {
      console.error('❌ Filtre değişiklik hatası:', error);
    }
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

  // API'den veri çek - GÜVENLİ
  const fetchDetailData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/dashboard-detail');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setDetailData(result.data);
        console.log('✅ Veri başarıyla alındı:', result.data.length, 'kayıt');
      } else {
        console.warn('⚠️ API beklenmedik format döndü:', result);
        setDetailData([]);
      }
      
    } catch (err) {
      console.error('❌ API Hatası:', err);
      setError(err.message);
      setDetailData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect - Güvenli filtreleme
  useEffect(() => {
    try {
      const filtered = applyFilters(detailData);
      setFilteredData(filtered);
      console.log('🔍 Filtreleme tamamlandı:', filtered.length, 'kayıt');
    } catch (error) {
      console.error('❌ useEffect filtre hatası:', error);
      setFilteredData([]);
    }
  }, [detailData, applyFilters]);

  useEffect(() => {
    fetchDetailData();
    const interval = setInterval(fetchDetailData, 60000);
    return () => clearInterval(interval);
  }, [fetchDetailData]);

  // Sayfalama
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Theme colors
  const theme = {
    bg: isDarkMode ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    cardBg: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    text: isDarkMode ? '#f8fafc' : '#1a202c',
    textSecondary: isDarkMode ? '#cbd5e1' : '#64748b',
    border: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(255, 255, 255, 0.3)',
    headerBg: isDarkMode ? 'linear-gradient(135deg, #374151, #1f2937)' : 'linear-gradient(135deg, #1f2937, #374151)',
    tableBg: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    tableAltBg: isDarkMode ? 'rgba(55, 65, 81, 0.8)' : 'rgba(248, 250, 252, 0.8)',
    tableHeaderBg: isDarkMode ? 'linear-gradient(135deg, #4b5563, #374151)' : 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
    inputBg: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    inputBorder: isDarkMode ? '#4b5563' : '#e5e7eb',
    success: isDarkMode ? '#10b981' : '#166534',
    warning: isDarkMode ? '#f59e0b' : '#92400e',
    error: isDarkMode ? '#ef4444' : '#dc2626'
  };

  // Loading durumu
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: theme.bg,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '200px',
          height: '200px',
          background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '150px',
          height: '150px',
          background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>
        
        <div style={{ 
          textAlign: 'center',
          background: theme.cardBg,
          padding: '60px',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            border: '6px solid #DC2626',
            borderTop: '6px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1.5s linear infinite',
            margin: '0 auto 30px'
          }}></div>
          <h3 style={{ color: theme.text, margin: '0 0 10px 0', fontSize: '24px' }}>Veriler Yükleniyor</h3>
          <p style={{ color: theme.textSecondary, margin: 0, fontSize: '16px' }}>YARIŞ Üretim Sistemi hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  // Error durumu
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: theme.bg,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ 
          background: theme.cardBg,
          padding: '50px',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          textAlign: 'center',
          maxWidth: '500px',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: theme.error, marginBottom: '15px', fontSize: '28px' }}>Bağlantı Sorunu</h2>
          <p style={{ color: theme.textSecondary, marginBottom: '30px', fontSize: '16px', lineHeight: '1.6' }}>
            Sunucu ile bağlantı kurulamadı. Lütfen internet bağlantınızı kontrol edin.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #DC2626, #991B1B)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 15px 40px rgba(220, 38, 38, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 30px rgba(220, 38, 38, 0.3)';
            }}
          >
            🔄 Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme.bg,
      position: 'relative',
      transition: 'all 0.3s ease'
    }}>
      
      {/* Arka plan sanat efektleri */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          top: '5%',
          right: '5%',
          width: '300px',
          height: '300px',
          background: isDarkMode ? 
            'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)' :
            'radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 20s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '8%',
          width: '200px',
          height: '200px',
          background: isDarkMode ? 
            'radial-gradient(circle, rgba(220, 38, 38, 0.06) 0%, transparent 70%)' :
            'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 25s ease-in-out infinite reverse'
        }}></div>
      </div>

      {/* Header */}
      <header style={{ 
        background: theme.cardBg,
        backdropFilter: 'blur(20px)',
        padding: '20px 30px', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
        border: `1px solid ${theme.border}`,
        borderBottom: `1px solid ${theme.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '15px',
            background: 'linear-gradient(135deg, #DC2626, #991B1B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '20px',
            boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)'
          }}>
            <span style={{ fontSize: '30px', color: 'white', fontWeight: 'bold' }}>Y</span>
          </div>
          <div>
            <h1 style={{ 
              margin: 0, 
              color: theme.text, 
              fontSize: '28px',
              fontWeight: '700',
              letterSpacing: '-0.5px'
            }}>
              YARIŞ
            </h1>
            <p style={{ 
              margin: 0, 
              color: theme.textSecondary, 
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Üretim İzleme Sistemi
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          {/* Dark Mode Toggle - Daha büyük ve görünür */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: theme.text,
              userSelect: 'none'
            }}>
              {isDarkMode ? '🌙' : '☀️'} {isDarkMode ? 'Karanlık' : 'Aydınlık'}
            </span>
            <button
              onClick={toggleDarkMode}
              style={{
                width: '70px',
                height: '36px',
                borderRadius: '18px',
                background: isDarkMode ? 
                  'linear-gradient(135deg, #1e3a8a, #1e40af)' : 
                  'linear-gradient(135deg, #fbbf24, #f59e0b)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: isDarkMode ? 
                  '0 6px 20px rgba(30, 64, 175, 0.4)' : 
                  '0 6px 20px rgba(245, 158, 11, 0.4)',
                outline: 'none'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = isDarkMode ? 
                  '0 8px 30px rgba(30, 64, 175, 0.5)' : 
                  '0 8px 30px rgba(245, 158, 11, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = isDarkMode ? 
                  '0 6px 20px rgba(30, 64, 175, 0.4)' : 
                  '0 6px 20px rgba(245, 158, 11, 0.4)';
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '14px',
                background: 'white',
                position: 'absolute',
                top: '4px',
                left: isDarkMode ? '38px' : '4px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
              }}>
                {isDarkMode ? '🌙' : '☀️'}
              </div>
            </button>
          </div>
          
          <div style={{ 
            textAlign: 'right',
            background: isDarkMode ? 
              'rgba(16, 185, 129, 0.2)' : 
              'rgba(16, 185, 129, 0.1)',
            padding: '12px 20px',
            borderRadius: '12px',
            border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`
          }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: theme.text, fontWeight: '600' }}>
              Son Güncelleme: {new Date().toLocaleTimeString('tr-TR')}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: '#10B981', 
                borderRadius: '50%',
                marginRight: '8px',
                animation: 'pulse 2s infinite'
              }}></div>
              <p style={{ margin: 0, fontSize: '13px', color: '#10B981', fontWeight: '600' }}>
                Canlı • {filteredData.length} kayıt
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Ana İçerik */}
      <main style={{ padding: '30px', position: 'relative', zIndex: 5 }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          
          {/* Filtre Paneli */}
          <div style={{
            background: theme.cardBg,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${theme.border}`
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '25px',
              paddingBottom: '20px',
              borderBottom: `2px solid ${isDarkMode ? '#374151' : '#f1f5f9'}`
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '15px'
              }}>
                <span style={{ fontSize: '18px' }}>🔍</span>
              </div>
              <h4 style={{ 
                margin: 0, 
                color: theme.text, 
                fontSize: '20px',
                fontWeight: '700'
              }}>
                Akıllı Filtreler
              </h4>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              marginBottom: '25px'
            }}>
              
              {/* Sipariş No Arama */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  marginBottom: '8px', 
                  color: theme.text
                }}>
                  Sipariş Numarası
                </label>
                <input
                  type="text"
                  value={filters.siparisNo}
                  onChange={(e) => handleFilterChange('siparisNo', e.target.value)}
                  placeholder="Sipariş ara..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${theme.inputBorder}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    background: theme.inputBg,
                    color: theme.text
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.inputBorder;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Başlangıç Tarihi */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  marginBottom: '8px', 
                  color: theme.text
                }}>
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${theme.inputBorder}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    background: theme.inputBg,
                    color: theme.text
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.inputBorder;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Bitiş Tarihi */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  marginBottom: '8px', 
                  color: theme.text
                }}>
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${theme.inputBorder}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    background: theme.inputBg,
                    color: theme.text
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.inputBorder;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Min Parça */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  marginBottom: '8px', 
                  color: theme.text
                }}>
                  Min Parça
                </label>
                <input
                  type="number"
                  value={filters.minParca}
                  onChange={(e) => handleFilterChange('minParca', e.target.value)}
                  placeholder="0"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${theme.inputBorder}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    background: theme.inputBg,
                    color: theme.text
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.inputBorder;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Max Parça */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  marginBottom: '8px', 
                  color: theme.text
                }}>
                  Max Parça
                </label>
                <input
                  type="number"
                  value={filters.maxParca}
                  onChange={(e) => handleFilterChange('maxParca', e.target.value)}
                  placeholder="∞"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${theme.inputBorder}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    background: theme.inputBg,
                    color: theme.text
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.inputBorder;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Filtre Butonları */}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                background: filteredData.length !== detailData.length ? 
                  isDarkMode ? 'linear-gradient(135deg, #1e3a8a, #1e40af)' : 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' : 
                  isDarkMode ? 'linear-gradient(135deg, #374151, #4b5563)' : 'linear-gradient(135deg, #F9FAFB, #F3F4F6)',
                borderRadius: '12px',
                border: `2px solid ${filteredData.length !== detailData.length ? '#3B82F6' : theme.inputBorder}`,
              }}>
                <span style={{ 
                  fontSize: '16px',
                  marginRight: '10px'
                }}>
                  {filteredData.length !== detailData.length ? '🔍' : '📊'}
                </span>
                <span style={{ 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: filteredData.length !== detailData.length ? '#3B82F6' : theme.textSecondary
                }}>
                  {filteredData.length !== detailData.length ? 
                    `${filteredData.length}/${detailData.length} kayıt filtrelendi` :
                    `${detailData.length} toplam kayıt`
                  }
                </span>
              </div>
              
              <button
                onClick={clearFilters}
                style={{
                  padding: '12px 24px',
                  background: isDarkMode ? 
                    'linear-gradient(135deg, #4b5563, #374151)' : 
                    'linear-gradient(135deg, #6B7280, #4B5563)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(107, 114, 128, 0.2)'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(107, 114, 128, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(107, 114, 128, 0.2)';
                }}
              >
                🗑️ Filtreleri Temizle
              </button>
            </div>
          </div>
          
          {/* Tablo */}
          <div style={{
            background: theme.cardBg,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${theme.border}`
          }}>
            <div style={{ 
              background: theme.headerBg,
              color: 'white',
              padding: '25px 30px',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '15px'
                }}>
                  <span style={{ fontSize: '18px' }}>📋</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>
                  Üretim Verileri
                </h3>
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.8)',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '8px 16px',
                borderRadius: '20px'
              }}>
                Sayfa {currentPage}/{totalPages}
              </div>
            </div>
            
            {filteredData.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 40px',
                color: theme.textSecondary
              }}>
                <div style={{ 
                  fontSize: '80px', 
                  marginBottom: '20px',
                  opacity: 0.5
                }}>
                  {detailData.length === 0 ? '📄' : '🔍'}
                </div>
                <h3 style={{ 
                  color: theme.text, 
                  marginBottom: '15px',
                  fontSize: '24px',
                  fontWeight: '600'
                }}>
                  {detailData.length === 0 ? 'Henüz Veri Yok' : 'Sonuç Bulunamadı'}
                </h3>
                <p style={{ 
                  fontSize: '16px',
                  lineHeight: '1.6',
                  maxWidth: '400px',
                  margin: '0 auto'
                }}>
                  {detailData.length === 0 ?
                  'Excel dosyası yüklendiğinde veriler burada görünecek.' :
                   'Filtre kriterlerinizi değiştirerek tekrar deneyin.'
                 }
               </p>
             </div>
           ) : (
             <div style={{ padding: '0' }}>
               <div style={{ overflowX: 'auto' }}>
                 <table style={{ 
                   width: '100%', 
                   borderCollapse: 'collapse', 
                   fontSize: '14px'
                 }}>
                   <thead>
                     <tr style={{ 
                       background: theme.tableHeaderBg
                     }}>
                       <th style={{ 
                         padding: '20px 24px', 
                         textAlign: 'left', 
                         fontWeight: '700',
                         color: theme.text,
                         fontSize: '13px',
                         textTransform: 'uppercase',
                         letterSpacing: '0.5px',
                         borderBottom: `2px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`,
                         minWidth: '140px'
                       }}>
                         Sipariş No
                       </th>
                       <th style={{ 
                         padding: '20px 24px', 
                         textAlign: 'center',
                         fontWeight: '700',
                         color: theme.text,
                         fontSize: '13px',
                         textTransform: 'uppercase',
                         letterSpacing: '0.5px',
                         borderBottom: `2px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`,
                         minWidth: '130px'
                       }}>
                         Başlangıç
                       </th>
                       <th style={{ 
                         padding: '20px 24px', 
                         textAlign: 'center',
                         fontWeight: '700',
                         color: theme.text,
                         fontSize: '13px',
                         textTransform: 'uppercase',
                         letterSpacing: '0.5px',
                         borderBottom: `2px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`,
                         minWidth: '130px'
                       }}>
                         Bitiş
                       </th>
                       <th style={{ 
                         padding: '20px 24px', 
                         textAlign: 'center',
                         fontWeight: '700',
                         color: theme.text,
                         fontSize: '13px',
                         textTransform: 'uppercase',
                         letterSpacing: '0.5px',
                         borderBottom: `2px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`,
                         minWidth: '100px'
                       }}>
                         Süre
                       </th>
                       <th style={{ 
                         padding: '20px 24px', 
                         textAlign: 'center',
                         fontWeight: '700',
                         color: theme.text,
                         fontSize: '13px',
                         textTransform: 'uppercase',
                         letterSpacing: '0.5px',
                         borderBottom: `2px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`,
                         minWidth: '90px'
                       }}>
                         Üretilen
                       </th>
                       <th style={{ 
                         padding: '20px 24px', 
                         textAlign: 'center',
                         fontWeight: '700',
                         color: theme.text,
                         fontSize: '13px',
                         textTransform: 'uppercase',
                         letterSpacing: '0.5px',
                         borderBottom: `2px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`,
                         minWidth: '90px'
                       }}>
                         Hurda
                       </th>
                       <th style={{ 
                         padding: '20px 24px', 
                         textAlign: 'center',
                         fontWeight: '700',
                         color: theme.text,
                         fontSize: '13px',
                         textTransform: 'uppercase',
                         letterSpacing: '0.5px',
                         borderBottom: `2px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`,
                         minWidth: '100px'
                       }}>
                         Verimlilik
                       </th>
                     </tr>
                   </thead>
                   <tbody>
                     {currentData.map((item, index) => {
                       const hurdaOrani = item.parcaAdeti > 0 ? 
                         ((item.hurdaAdeti / (item.parcaAdeti + item.hurdaAdeti)) * 100).toFixed(1) : '0';
                       
                       const siparisNoStr = (item.siparisNo || '').toString();
                       const highlightedSiparisNo = filters.siparisNo && siparisNoStr.toLowerCase().includes(filters.siparisNo.toLowerCase()) ?
                         siparisNoStr.replace(
                           new RegExp(filters.siparisNo, 'gi'),
                           (match) => `<mark style="background: linear-gradient(135deg, #FEF3C7, #FDE68A); padding: 3px 6px; border-radius: 6px; font-weight: 600;">${match}</mark>`
                         ) : siparisNoStr;
                       
                       return (
                         <tr key={index} style={{ 
                           background: index % 2 === 0 ? 
                             theme.tableBg : 
                             theme.tableAltBg,
                           transition: 'all 0.3s ease'
                         }}
                         onMouseOver={(e) => {
                           e.currentTarget.style.background = isDarkMode ? 
                             'rgba(59, 130, 246, 0.1)' : 
                             'rgba(59, 130, 246, 0.05)';
                           e.currentTarget.style.transform = 'scale(1.01)';
                         }}
                         onMouseOut={(e) => {
                           e.currentTarget.style.background = index % 2 === 0 ? 
                             theme.tableBg : 
                             theme.tableAltBg;
                           e.currentTarget.style.transform = 'scale(1)';
                         }}>
                           
                           {/* Sipariş No */}
                           <td style={{ 
                             padding: '20px 24px',
                             fontWeight: '600',
                             color: theme.text,
                             fontSize: '15px'
                           }}>
                             <span dangerouslySetInnerHTML={{ __html: highlightedSiparisNo || '-' }} />
                           </td>
                           
                           {/* Başlangıç */}
                           <td style={{ 
                             padding: '20px 24px',
                             textAlign: 'center',
                             fontSize: '14px',
                             fontWeight: '600',
                             color: theme.text,
                             fontFamily: 'monospace'
                           }}>
                             {formatDateTime(item.baslatmaSaati)}
                           </td>
                           
                           {/* Bitiş */}
                           <td style={{ 
                             padding: '20px 24px',
                             textAlign: 'center',
                             fontSize: '14px',
                             fontWeight: '600',
                             color: theme.text,
                             fontFamily: 'monospace'
                           }}>
                             {formatDateTime(item.bitirmeSaati)}
                           </td>
                           
                           {/* Toplam Süre */}
                           <td style={{ 
                             padding: '20px 24px',
                             textAlign: 'center',
                             fontWeight: '600',
                             fontFamily: 'monospace',
                             fontSize: '14px',
                             color: theme.text
                           }}>
                             {formatDuration(item.toplamSure)}
                           </td>
                           
                           {/* Üretilen Parça */}
                           <td style={{ 
                             padding: '20px 24px',
                             textAlign: 'center'
                           }}>
                             <span style={{
                               padding: '8px 16px',
                               borderRadius: '12px',
                               fontSize: '14px',
                               fontWeight: '700',
                               background: item.parcaAdeti > 0 ? 
                                 isDarkMode ? 'linear-gradient(135deg, #065f46, #047857)' : 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : 
                                 isDarkMode ? 'linear-gradient(135deg, #374151, #4b5563)' : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                               color: item.parcaAdeti > 0 ? 
                                 isDarkMode ? '#a7f3d0' : '#166534' : 
                                 theme.textSecondary,
                               border: `2px solid ${item.parcaAdeti > 0 ? '#22c55e' : theme.inputBorder}`
                             }}>
                               {item.parcaAdeti || '0'}
                             </span>
                           </td>
                           
                           {/* Hurda */}
                           <td style={{ 
                             padding: '20px 24px',
                             textAlign: 'center'
                           }}>
                             <span style={{
                               padding: '8px 16px',
                               borderRadius: '12px',
                               fontSize: '14px',
                               fontWeight: '700',
                               background: item.hurdaAdeti > 0 ? 
                                 isDarkMode ? 'linear-gradient(135deg, #7f1d1d, #991b1b)' : 'linear-gradient(135deg, #fecaca, #fca5a5)' : 
                                 isDarkMode ? 'linear-gradient(135deg, #374151, #4b5563)' : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                               color: item.hurdaAdeti > 0 ? 
                                 isDarkMode ? '#fca5a5' : '#dc2626' : 
                                 theme.textSecondary,
                               border: `2px solid ${item.hurdaAdeti > 0 ? '#ef4444' : theme.inputBorder}`
                             }}>
                               {item.hurdaAdeti || '0'}
                             </span>
                           </td>
                           
                           {/* Verimlilik */}
                           <td style={{ 
                             padding: '20px 24px',
                             textAlign: 'center'
                           }}>
                             <div style={{
                               display: 'inline-flex',
                               alignItems: 'center',
                               padding: '10px 18px',
                               borderRadius: '15px',
                               fontSize: '14px',
                               fontWeight: '700',
                               background: parseFloat(hurdaOrani) < 5 ? 
                                 isDarkMode ? 'linear-gradient(135deg, #065f46, #047857)' : 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : 
                                 parseFloat(hurdaOrani) < 10 ? 
                                   isDarkMode ? 'linear-gradient(135deg, #92400e, #b45309)' : 'linear-gradient(135deg, #fef3c7, #fde68a)' : 
                                   isDarkMode ? 'linear-gradient(135deg, #7f1d1d, #991b1b)' : 'linear-gradient(135deg, #fecaca, #fca5a5)',
                               color: parseFloat(hurdaOrani) < 5 ? 
                                      isDarkMode ? '#a7f3d0' : '#166534' :
                                      parseFloat(hurdaOrani) < 10 ? 
                                        isDarkMode ? '#fde68a' : '#92400e' : 
                                        isDarkMode ? '#fca5a5' : '#dc2626',
                               border: `2px solid ${parseFloat(hurdaOrani) < 5 ? '#22c55e' : 
                                                   parseFloat(hurdaOrani) < 10 ? '#f59e0b' : '#ef4444'}`,
                               minWidth: '70px',
                               justifyContent: 'center'
                             }}>
                               <span style={{ marginRight: '6px' }}>
                                 {parseFloat(hurdaOrani) < 5 ? '🟢' : 
                                  parseFloat(hurdaOrani) < 10 ? '🟡' : '🔴'}
                               </span>
                               {100 - parseFloat(hurdaOrani)}%
                             </div>
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
                   padding: '30px',
                   background: theme.tableHeaderBg,
                   borderTop: `1px solid ${isDarkMode ? '#4b5563' : 'rgba(226, 232, 240, 0.5)'}`
                 }}>
                   <div style={{
                     display: 'flex', 
                     justifyContent: 'center', 
                     alignItems: 'center',
                     gap: '15px'
                   }}>
                     <button
                       onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                       disabled={currentPage === 1}
                       style={{
                         padding: '12px 20px',
                         background: currentPage === 1 ? 
                           isDarkMode ? 'linear-gradient(135deg, #374151, #4b5563)' : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' : 
                           'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                         color: currentPage === 1 ? theme.textSecondary : 'white',
                         border: 'none',
                         borderRadius: '12px',
                         fontSize: '14px',
                         fontWeight: '600',
                         cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                         transition: 'all 0.3s ease',
                         boxShadow: currentPage === 1 ? 'none' : '0 6px 20px rgba(59, 130, 246, 0.3)'
                       }}
                       onMouseOver={(e) => {
                         if (currentPage !== 1) {
                           e.target.style.transform = 'translateY(-2px)';
                           e.target.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.4)';
                         }
                       }}
                       onMouseOut={(e) => {
                         if (currentPage !== 1) {
                           e.target.style.transform = 'translateY(0)';
                           e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.3)';
                         }
                       }}
                     >
                       ◀ Önceki
                     </button>
                     
                     <div style={{
                       padding: '12px 24px',
                       background: theme.cardBg,
                       borderRadius: '12px',
                       fontSize: '14px',
                       fontWeight: '600',
                       color: theme.text,
                       border: `2px solid ${theme.inputBorder}`
                     }}>
                       {currentPage} / {totalPages}
                     </div>
                     
                     <button
                       onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                       disabled={currentPage === totalPages}
                       style={{
                         padding: '12px 20px',
                         background: currentPage === totalPages ? 
                           isDarkMode ? 'linear-gradient(135deg, #374151, #4b5563)' : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' : 
                           'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                         color: currentPage === totalPages ? theme.textSecondary : 'white',
                         border: 'none',
                         borderRadius: '12px',
                         fontSize: '14px',
                         fontWeight: '600',
                         cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                         transition: 'all 0.3s ease',
                         boxShadow: currentPage === totalPages ? 'none' : '0 6px 20px rgba(59, 130, 246, 0.3)'
                       }}
                       onMouseOver={(e) => {
                         if (currentPage !== totalPages) {
                           e.target.style.transform = 'translateY(-2px)';
                           e.target.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.4)';
                         }
                       }}
                       onMouseOut={(e) => {
                         if (currentPage !== totalPages) {
                           e.target.style.transform = 'translateY(0)';
                           e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.3)';
                         }
                       }}
                     >
                       Sonraki ▶
                     </button>
                   </div>
                 </div>
               )}
             </div>
           )}
         </div>
       </div>
     </main>

     {/* CSS Animasyonları */}
     <style>{`
       @keyframes spin {
         0% { transform: rotate(0deg); }
         100% { transform: rotate(360deg); }
       }
       @keyframes pulse {
         0%, 100% { opacity: 1; }
         50% { opacity: 0.5; }
       }
       @keyframes float {
         0%, 100% { transform: translateY(0px) rotate(0deg); }
         50% { transform: translateY(-20px) rotate(5deg); }
       }
     `}</style>
   </div>
 );
};

export default PublicDashboard;