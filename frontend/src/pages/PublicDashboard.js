import React, { useState, useEffect, useCallback } from 'react';

const PublicDashboard = () => {
  const [detailData, setDetailData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [machinesList, setMachinesList] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('all');
  const [dashboardStats, setDashboardStats] = useState({
    totalProduction: 0,
    machinePerformance: 0,
    activeOperators: 0, // Bu stat artık kullanılmayabilir ama tutabiliriz.
    pendingOrders: 0
  });
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

  // Makine değiştirme fonksiyonu
  const handleMachineChange = (machineKey) => {
    console.log('🔄 Makine değiştirildi:', machineKey);
    setSelectedMachine(machineKey);
    setCurrentPage(1);
    // Filtreleri temizle
    setFilters({
      siparisNo: '',
      startDate: '',
      endDate: '',
      minParca: '',
      maxParca: ''
    });
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
            return false;
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

  // Makine listesini çek
  const fetchMachinesList = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/machines');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.machines)) {
        setMachinesList(result.machines);
        console.log('✅ Makine listesi alındı:', result.machines.length, 'makine');
      } else {
        console.warn('⚠️ Makine listesi API beklenmedik format döndü:', result);
        setMachinesList([]);
      }

    } catch (err) {
      console.error('❌ Makine listesi API Hatası:', err);
      setMachinesList([]);
    }
  }, []);

  // Dashboard istatistiklerini çek
  const fetchDashboardStats = useCallback(async (machineKey) => {
    try {
      const url = machineKey === 'all'
        ? 'http://localhost:5000/api/dashboard-data'
        : `http://localhost:5000/api/dashboard-data/${machineKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.stats) {
        setDashboardStats(result.stats);
        console.log('✅ Dashboard istatistikleri alındı:', result.stats);
      }

    } catch (err) {
      console.error('❌ Dashboard stats API Hatası:', err);
    }
  }, []);

  // API'den veri çek - GÜVENLİ
  const fetchDetailData = useCallback(async (machineKey = 'all') => {
    try {
      setLoading(true);
      setError(null);

      const url = machineKey === 'all'
        ? 'http://localhost:5000/api/dashboard-detail'
        : `http://localhost:5000/api/dashboard-detail/${machineKey}`;

      const response = await fetch(url);

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

  // Makine değişiminde veri yenile
  useEffect(() => {
    if (selectedMachine) {
      fetchDetailData(selectedMachine);
      fetchDashboardStats(selectedMachine);
    }
  }, [selectedMachine, fetchDetailData, fetchDashboardStats]);

  // İlk yükleme ve periyodik güncelleme
  useEffect(() => {
    fetchMachinesList();
    fetchDetailData(selectedMachine);
    fetchDashboardStats(selectedMachine);

    const interval = setInterval(() => {
      fetchDetailData(selectedMachine);
      fetchDashboardStats(selectedMachine);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchMachinesList, fetchDetailData, fetchDashboardStats, selectedMachine]);

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
              {selectedMachine === 'all' ? 'Tüm Makineler' : selectedMachine.replace('makine-', 'Makine-')} • Üretim İzleme
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          {/* İstatistikler Özeti */}
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center'
          }}>
            <div style={{
              textAlign: 'center',
              background: isDarkMode ?
                'rgba(16, 185, 129, 0.2)' :
                'rgba(16, 185, 129, 0.1)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`
            }}>
              <p style={{ margin: '0', fontSize: '16px', color: theme.success, fontWeight: '700' }}>
                {dashboardStats.totalProduction?.toLocaleString('tr-TR') || '0'}
              </p>
              <p style={{ margin: '0', fontSize: '11px', color: theme.textSecondary, fontWeight: '600' }}>
                Üretim
              </p>
            </div>

            <div style={{
              textAlign: 'center',
              background: isDarkMode ?
                'rgba(59, 130, 246, 0.2)' :
                'rgba(59, 130, 246, 0.1)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`
            }}>
              <p style={{ margin: '0', fontSize: '16px', color: '#3B82F6', fontWeight: '700' }}>
                %{dashboardStats.machinePerformance || '0'}
              </p>
              <p style={{ margin: '0', fontSize: '11px', color: theme.textSecondary, fontWeight: '600' }}>
                Performans
              </p>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: theme.text,
              userSelect: 'none'
            }}>
              {isDarkMode ? '🌙' : '☀️'}
            </span>
            <button
              onClick={toggleDarkMode}
              style={{
                width: '60px',
                height: '30px',
                borderRadius: '15px',
                background: isDarkMode ?
                  'linear-gradient(135deg, #1e3a8a, #1e40af)' :
                  'linear-gradient(135deg, #fbbf24, #f59e0b)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: isDarkMode ?
                  '0 4px 15px rgba(30, 64, 175, 0.4)' :
                  '0 4px 15px rgba(245, 158, 11, 0.4)',
                outline: 'none'
              }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '11px',
                background: 'white',
                position: 'absolute',
                top: '4px',
                left: isDarkMode ? '34px' : '4px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
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

          {/* Makine Seçici Tabları */}
          <div style={{
            background: theme.cardBg,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '25px 30px',
            marginBottom: '25px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${theme.border}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: `2px solid ${isDarkMode ? '#374151' : '#f1f5f9'}`
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '15px'
              }}>
                <span style={{ fontSize: '18px' }}>🏭</span>
              </div>
              <h4 style={{
                margin: 0,
                color: theme.text,
                fontSize: '20px',
                fontWeight: '700'
              }}>
                Makine Seçimi
              </h4>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              {/* Tümü Butonu */}
              <button
                onClick={() => handleMachineChange('all')}
                style={{
                  padding: '14px 24px',
                  borderRadius: '12px',
                  border: `2px solid ${selectedMachine === 'all' ? '#DC2626' : theme.inputBorder}`,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  background: selectedMachine === 'all' ?
                    'linear-gradient(135deg, #DC2626, #991B1B)' :
                    isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                  color: selectedMachine === 'all' ?
                    'white' :
                    theme.text,
                  boxShadow: selectedMachine === 'all' ?
                    '0 8px 25px rgba(220, 38, 38, 0.3)' :
                    `0 2px 10px ${isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                  transform: selectedMachine === 'all' ? 'translateY(-2px)' : 'translateY(0)'
                }}
                onMouseOver={(e) => {
                  if (selectedMachine !== 'all') {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedMachine !== 'all') {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = `0 2px 10px ${isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`;
                  }
                }}
              >
                <span style={{ marginRight: '8px' }}>🌐</span>
                Tümü ({dashboardStats.totalProduction?.toLocaleString('tr-TR') || '0'})
              </button>

              {/* Makine Butonları */}
              {machinesList.map((machine) => {
                const machineKey = `makine-${machine.id}`;
                const isSelected = selectedMachine === machineKey;

                return (
                  <button
                    key={machine.id}
                    onClick={() => handleMachineChange(machineKey)}
                    style={{
                      padding: '14px 24px',
                      borderRadius: '12px',
                      border: `2px solid ${isSelected ? '#3B82F6' : theme.inputBorder}`,
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      background: isSelected ?
                        'linear-gradient(135deg, #3B82F6, #1D4ED8)' :
                        isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                      color: isSelected ?
                        'white' :
                        theme.text,
                      boxShadow: isSelected ?
                        '0 8px 25px rgba(59, 130, 246, 0.3)' :
                        `0 2px 10px ${isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                      transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = `0 2px 10px ${isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`;
                      }
                    }}
                  >
                    <span style={{ marginRight: '8px' }}>🔧</span>
                    {machine.name}
                  </button>
                );
              })}
            </div>
          </div>

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

              {/* Min Parça Adeti */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: theme.text
                }}>
                  Min. Parça Adeti
                </label>
                <input
                  type="number"
                  value={filters.minParca}
                  onChange={(e) => handleFilterChange('minParca', e.target.value)}
                  placeholder="En az parça"
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

              {/* Max Parça Adeti */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: theme.text
                }}>
                  Max. Parça Adeti
                </label>
                <input
                  type="number"
                  value={filters.maxParca}
                  onChange={(e) => handleFilterChange('maxParca', e.target.value)}
                  placeholder="En fazla parça"
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button
                onClick={clearFilters}
                style={{
                  padding: '12px 25px',
                  borderRadius: '10px',
                  background: isDarkMode ? 'rgba(75, 85, 99, 0.6)' : '#e2e8f0',
                  color: theme.text,
                  border: `2px solid ${isDarkMode ? '#4b5563' : '#cbd5e1'}`,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'}`
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 6px 20px ${isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.08)'}`;
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = `0 4px 15px ${isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'}`;
                }}
              >
                <span style={{ marginRight: '8px' }}>🧹</span>
                Filtreleri Temizle
              </button>
            </div>
          </div>

          {/* Veri Tablosu */}
          <div style={{
            background: theme.tableBg,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            overflowX: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${theme.border}`,
            padding: '25px'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '0 10px',
              minWidth: '900px' // Hurda sayısı için genişliği artırdık
            }}>
              <thead style={{ background: theme.tableHeaderBg, borderRadius: '15px 15px 0 0' }}>
                <tr>
                  <th style={{
                    padding: '15px 20px',
                    textAlign: 'left',
                    color: isDarkMode ? '#e2e8f0' : '#475569',
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderTopLeftRadius: '10px',
                    borderBottomLeftRadius: '10px'
                  }}>Sipariş No</th>
                  <th style={{
                    padding: '15px 20px',
                    textAlign: 'left',
                    color: isDarkMode ? '#e2e8f0' : '#475569',
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Makine</th>
                  {/* Operatör sütunu kaldırıldı */}
                  <th style={{
                    padding: '15px 20px',
                    textAlign: 'left',
                    color: isDarkMode ? '#e2e8f0' : '#475569',
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Başlama Saati</th>
                  <th style={{
                    padding: '15px 20px',
                    textAlign: 'left',
                    color: isDarkMode ? '#e2e8f0' : '#475569',
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Bitiş Saati</th>
                  <th style={{
                    padding: '15px 20px',
                    textAlign: 'left',
                    color: isDarkMode ? '#e2e8f0' : '#475569',
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Süre</th>
                  <th style={{
                    padding: '15px 20px',
                    textAlign: 'right',
                    color: isDarkMode ? '#e2e8f0' : '#475569',
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Parça Adeti</th>
                  <th style={{ // Yeni Hurda Sayısı sütunu
                    padding: '15px 20px',
                    textAlign: 'right',
                    color: isDarkMode ? '#e2e8f0' : '#475569',
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderTopRightRadius: '10px',
                    borderBottomRightRadius: '10px'
                  }}>Hurda Sayısı</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ // colSpan Hurda Sayısı için 7 oldu
                      padding: '20px',
                      textAlign: 'center',
                      color: theme.textSecondary,
                      fontSize: '16px',
                      background: theme.tableAltBg,
                      borderRadius: '10px',
                      marginTop: '10px',
                      boxShadow: `0 2px 5px ${isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)'}`
                    }}>
                      Gösterilecek veri bulunamadı. Filtreleri değiştirmeyi deneyin.
                    </td>
                  </tr>
                ) : (
                  currentData.map((item, index) => (
                    <tr key={item.id || index} style={{
                      background: index % 2 === 0 ? theme.tableAltBg : theme.tableBg,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      boxShadow: `0 2px 5px ${isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)'}`
                    }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <td style={{
                        padding: '15px 20px',
                        color: theme.text,
                        fontSize: '14px',
                        fontWeight: '500',
                        borderTopLeftRadius: '10px',
                        borderBottomLeftRadius: '10px'
                      }}>
                        <span style={{
                          background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                          color: '#3B82F6',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '12px'
                        }}>
                          {item.siparisNo || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '15px 20px', color: theme.text, fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: '8px', fontSize: '16px' }}>🔧</span>
                          {item.makineAdi || '-'}
                        </div>
                      </td>
                      {/* Operatör hücresi kaldırıldı */}
                      <td style={{ padding: '15px 20px', color: theme.text, fontSize: '14px' }}>{formatDateTime(item.baslatmaSaati)}</td>
                      <td style={{ padding: '15px 20px', color: theme.text, fontSize: '14px' }}>{formatDateTime(item.bitisSaati)}</td>
                      <td style={{ padding: '15px 20px', color: theme.text, fontSize: '14px' }}>{formatDuration(item.sure)}</td>
                      <td style={{
                        padding: '15px 20px',
                        textAlign: 'right',
                        color: theme.text,
                        fontSize: '16px',
                        fontWeight: '700'
                      }}>
                        <span style={{
                          background: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                          color: theme.success,
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '14px'
                        }}>
                          {item.parcaAdeti?.toLocaleString('tr-TR') || '0'}
                        </span>
                      </td>
                      <td style={{ // Yeni Hurda Sayısı hücresi
                        padding: '15px 20px',
                        textAlign: 'right',
                        color: theme.text,
                        fontSize: '16px',
                        fontWeight: '700',
                        borderTopRightRadius: '10px',
                        borderBottomRightRadius: '10px'
                      }}>
                        <span style={{
                          background: isDarkMode ? 'rgba(234, 179, 8, 0.2)' : 'rgba(253, 224, 71, 0.5)',
                          color: theme.warning,
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '14px'
                        }}>
                          {item.hurdaSayisi?.toLocaleString('tr-TR') || '0'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Sayfalama Kontrolleri */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '30px',
              gap: '10px'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: `1px solid ${theme.inputBorder}`,
                  background: theme.cardBg,
                  color: theme.text,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                Önceki
              </button>
              <span style={{ color: theme.textSecondary, fontSize: '14px', fontWeight: '500' }}>
                Sayfa {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: `1px solid ${theme.inputBorder}`,
                  background: theme.cardBg,
                  color: theme.text,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                Sonraki
              </button>
            </div>
          )}
        </div>
      </main>

      {/* CSS Animations (defined in JS for inline styles) */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-10px) translateX(10px); }
          50% { transform: translateY(0px) translateX(0px); }
          75% { transform: translateY(10px) translateX(-10px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        /* Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#2d3748' : '#f1f1f1'};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#4a5568' : '#888'};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#6b7280' : '#555'};
        }
      `}</style>
    </div>
  );
};

export default PublicDashboard;