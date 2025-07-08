const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

console.log('Server.js dosyası okunuyor...');

const app = express(); // ← APP BURADA TANIMLANMALI
const PORT = 5000;

console.log('Express app oluşturuluyor...');

// Middleware
app.use(cors());
app.use(express.json());

console.log('Middleware eklendi...');

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece Excel (.xlsx, .xls) ve CSV dosyaları kabul edilir!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

console.log('Multer konfigürasyonu tamamlandı...');

// Global değişkenler
let dashboardStats = {
  totalProduction: 1247,
  machinePerformance: 87,
  activeOperators: 12,
  pendingOrders: 8
};

let uploadedFilesList = [
  {
    id: 1,
    name: 'Online_İzleme_Veri_Dosyası.csv',
    uploadDate: '2025-07-08T14:30:00Z',
    size: '2.3 MB',
    status: 'processed'
  }
];

let detailDataList = []; // Detay veriler için

// Detay verileri iş
// ... (yukarıdaki kodların devamı)

// Detay verileri işleme fonksiyonu
function processDetailData(data) {
  console.log('🔍 Detay verileri işleniyor...');
  
  try {
    detailDataList = data.map((row, index) => {
      // Sütun isimlerini normalize et
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key.trim().replace(/\s+/g, ' ');
        normalizedRow[cleanKey] = row[key];
      });
      
      // Tarih parse etme fonksiyonu
      const parseDateTime = (dateTimeStr) => {
        if (!dateTimeStr || dateTimeStr.toString().trim() === '') return null;
        
        try {
          const str = dateTimeStr.toString().trim();
          const parts = str.split(' ');
          
          if (parts.length >= 2) {
            const datePart = parts[0];
            const timePart = parts[1];
            
            const [day, month, year] = datePart.split('.');
            const [hour, minute] = timePart.split(':');
            
            const isoDate = new Date(
              parseInt(year), 
              parseInt(month) - 1, 
              parseInt(day),
              parseInt(hour),
              parseInt(minute || 0)
            );
            
            return isoDate.toISOString();
          }
        } catch (e) {
          console.warn('Tarih parse hatası:', dateTimeStr, e);
        }
        
        return null;
      };
      
      return {
        id: index + 1,
        siparisNo: normalizedRow['SIPARIS NUMARASI'] || '-',
        baslatmaSaati: parseDateTime(normalizedRow['IS BASLATMA SAATI']),
        bitirmeSaati: parseDateTime(normalizedRow['IS BITIRME SAATI']),
        toplamSure: normalizedRow['TOPLAM IS SURESI'] || '-',
        parcaAdeti: parseInt(normalizedRow['BASILAN PARCA ADETI']) || 0,
        hurdaAdeti: parseInt(normalizedRow['HURDA ADETI']) || 0,
        makinaPerformans: parseInt(normalizedRow['MAKINA PERFORMANSI']) || 0,
        operatorPerformans: parseInt(normalizedRow['OPERATOR PERFORMANSI']) || 0
      };
    }).filter(item => 
      item.siparisNo !== '-' || item.parcaAdeti > 0
    );
    
    console.log('✅ İşlenen detay kayıt sayısı:', detailDataList.length);
    
  } catch (error) {
    console.error('❌ Detay veri işleme hatası:', error);
    detailDataList = [];
  }
}

// Excel parse fonksiyonunu güncelle
function parseExcelFile(filePath, originalName) {
  console.log('📊 Excel dosyası parse ediliyor:', originalName);
  
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('📋 Toplam satır sayısı:', jsonData.length);
    
    // Dashboard istatistiklerini hesapla
    calculateDashboardStats(jsonData);
    
    // Detay verilerini işle
    processDetailData(jsonData);
    
    return {
      success: true,
      rowCount: jsonData.length,
      data: jsonData,
      columns: Object.keys(jsonData[0] || {})
    };
    
  } catch (error) {
    console.error('❌ Excel parse hatası:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Dashboard istatistik hesaplama (mevcut fonksiyon aynı kalıyor)
function calculateDashboardStats(data) {
  console.log('🧮 Dashboard istatistikleri hesaplanıyor...');
  
  try {
    const processedData = data.map(row => {
      const processedRow = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key.trim().replace(/\s+/g, ' ');
        processedRow[cleanKey] = row[key];
      });
      return processedRow;
    });
    
    const totalProduction = processedData.reduce((sum, row) => {
      const parcaAdeti = parseInt(row['BASILAN PARCA ADETI']) || 0;
      return sum + parcaAdeti;
    }, 0);
    
    const performanceValues = processedData
      .map(row => parseInt(row['MAKINA PERFORMANSI']) || 0)
      .filter(val => val > 0);
    
    const avgMachinePerformance = performanceValues.length > 0 
      ? Math.round(performanceValues.reduce((a, b) => a + b) / performanceValues.length)
      : 0;
    
    const operators = new Set();
    ['OPERATOR 1', 'OPERATOR 2', 'OPERATOR 3', 'OPERATOR 4', 'OPERATOR 5', 'OPERATOR 6'].forEach(opField => {
      processedData.forEach(row => {
        if (row[opField] && row[opField].toString().trim() !== '') {
          operators.add(row[opField].toString().trim());
        }
      });
    });
    
    const pendingOrders = processedData.filter(row => {
      const parcaAdeti = parseInt(row['BASILAN PARCA ADETI']) || 0;
      return parcaAdeti === 0;
    }).length;
    
    dashboardStats = {
      totalProduction,
      machinePerformance: avgMachinePerformance,
      activeOperators: operators.size,
      pendingOrders
    };
    
    console.log('✅ Hesaplanan istatistikler:', dashboardStats);
    
  } catch (error) {
    console.error('❌ İstatistik hesaplama hatası:', error);
  }
}

// ========== API ENDPOINTS ==========

// Ana route
app.get('/', (req, res) => {
  console.log('Ana route çağrıldı');
  res.json({ 
    message: 'Yarış İzleme API çalışıyor! 🚀',
    version: '1.0.0',
    endpoints: [
      'GET / - Bu mesaj',
      'GET /api/dashboard-data - Dashboard verileri', 
      'POST /api/upload - Excel yükleme',
      'GET /api/files - Yüklenen dosyalar',
      'GET /api/dashboard-detail - Detay veriler'
    ]
  });
});

// Dashboard verileri
app.get('/api/dashboard-data', (req, res) => {
  console.log('📊 Dashboard API çağrıldı');
  
  const dashboardData = {
    stats: dashboardStats,
    lastUpdate: new Date().toISOString(),
    status: 'success',
    dataSource: uploadedFilesList.length > 1 ? 'excel' : 'demo'
  };
  
  res.json(dashboardData);
});

// Dashboard detay verileri - YENİ ENDPOINT
app.get('/api/dashboard-detail', (req, res) => {
  console.log('📋 Dashboard detay verisi istendi');
  
  try {
    res.json({
      success: true,
      data: detailDataList,
      totalRecords: detailDataList.length
    });
    
  } catch (error) {
    console.error('❌ Detay veri gönderme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Detay veriler alınamadı',
      error: error.message
    });
  }
});

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  console.log('📤 File upload isteği geldi');
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Dosya yüklenmedi!'
    });
  }
  
  console.log('📁 Yüklenen dosya:', req.file.originalname);
  
  const parseResult = parseExcelFile(req.file.path, req.file.originalname);
  
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Excel dosyası okunamadı: ' + parseResult.error
    });
  }
  
  const fileInfo = {
    id: Date.now(),
    name: req.file.originalname,
    filename: req.file.filename,
    uploadDate: new Date().toISOString(),
    size: (req.file.size / 1024 / 1024).toFixed(2) + ' MB',
    status: 'processed',
    rowCount: parseResult.rowCount,
    columns: parseResult.columns
  };
  
  uploadedFilesList.unshift(fileInfo);
  
  console.log('✅ Dosya başarıyla işlendi');
  
  res.json({
    success: true,
    message: 'Dosya başarıyla yüklendi ve işlendi!',
    file: fileInfo,
    stats: dashboardStats,
    detailRecords: detailDataList.length
  });
});

// Dosya listesi
app.get('/api/files', (req, res) => {
  console.log('📁 Files API çağrıldı');
  
  res.json({ 
    files: uploadedFilesList, 
    total: uploadedFilesList.length,
    totalDetailRecords: detailDataList.length
  });
});

console.log('Routes tanımlandı...');

// Server başlat
app.listen(PORT, () => {
  console.log(`🚀 Server başarıyla başladı!`);
  console.log(`📍 Adres: http://localhost:${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard-data`);
  console.log(`📁 Files API: http://localhost:${PORT}/api/files`);
  console.log(`📤 Upload API: http://localhost:${PORT}/api/upload`);
  console.log(`📋 Detail API: http://localhost:${PORT}/api/dashboard-detail`);
  console.log(`📅 Zaman: ${new Date().toLocaleString('tr-TR')}`);
});

console.log('Server başlatılıyor...');