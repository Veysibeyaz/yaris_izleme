const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

console.log('Server.js dosyası okunuyor...');

const app = express();
const PORT = 5000;

console.log('Express app oluşturuluyor...');

// Middleware
app.use(cors());
app.use(express.json());

console.log('Middleware eklendi...');

// Auto-import klasörünü oluştur
const autoImportDir = './auto-import';
if (!fs.existsSync(autoImportDir)) {
  fs.mkdirSync(autoImportDir);
  console.log('📁 Auto-import klasörü oluşturuldu');
}

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

let detailDataList = [];

// ========== OTOMATIK DOSYA İZLEME SİSTEMİ ==========

class FileWatcher {
  constructor() {
    this.watchPath = path.join(__dirname, 'auto-import', 'production_data.xlsx');
    this.lastModified = null;
    this.isWatching = false;
    this.watcher = null;
  }

  startWatching() {
    console.log('🔍 Dosya izleme sistemi başlatılıyor...');
    
    // Dosya değişikliklerini izle
    this.watcher = chokidar.watch(this.watchPath, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });
    
    this.watcher.on('add', (filePath) => {
      console.log('📁 Yeni dosya tespit edildi:', filePath);
      this.processFile('add');
    });

    this.watcher.on('change', (filePath) => {
      console.log('📝 Dosya değişikliği tespit edildi:', filePath);
      this.processFile('change');
    });

    this.watcher.on('error', (error) => {
      console.error('❌ Dosya izleme hatası:', error);
    });

    // Periyodik kontrol (5 dakikada bir)
    setInterval(() => {
      this.checkFileUpdate();
    }, 5 * 60 * 1000); // 5 dakika

    this.isWatching = true;
    console.log('✅ Dosya izleme aktif:', this.watchPath);
    
    // İlk başlangıçta dosyayı kontrol et
    if (fs.existsSync(this.watchPath)) {
      console.log('🔍 Mevcut dosya tespit edildi, işleniyor...');
      setTimeout(() => this.processFile('initial'), 1000);
    } else {
      console.log('📋 Henüz otomatik dosya yok. Bekleniyor...');
    }
  }

  async checkFileUpdate() {
    try {
      if (!fs.existsSync(this.watchPath)) return;

      const stats = fs.statSync(this.watchPath);
      const currentModified = stats.mtime.getTime();

      if (this.lastModified !== currentModified) {
        console.log('⏰ Periyodik kontrol: Dosya değişikliği tespit edildi');
        this.lastModified = currentModified;
        await this.processFile('periodic');
      }
    } catch (error) {
      console.error('❌ Periyodik dosya kontrol hatası:', error);
    }
  }

  async processFile(source = 'unknown') {
    try {
      console.log(`🔄 Dosya işleniyor (kaynak: ${source})...`);
      
      if (!fs.existsSync(this.watchPath)) {
        console.log('⚠️ Dosya bulunamadı:', this.watchPath);
        return;
      }

      // Dosya bilgilerini al
      const stats = fs.statSync(this.watchPath);
      this.lastModified = stats.mtime.getTime();

      // Excel dosyasını parse et
      const parseResult = parseExcelFile(this.watchPath, 'production_data.xlsx');
      
      if (parseResult.success) {
        // Otomatik dosya listesine ekle/güncelle
        const existingAutoFile = uploadedFilesList.find(f => f.source === 'auto');
        
        const autoFileInfo = {
          id: existingAutoFile ? existingAutoFile.id : Date.now(),
          name: '🤖 production_data.xlsx (Otomatik)',
          filename: 'production_data.xlsx',
          uploadDate: new Date().toISOString(),
          size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
          status: 'processed',
          rowCount: parseResult.rowCount,
          columns: parseResult.columns,
          source: 'auto',
          lastUpdate: new Date().toISOString()
        };

        if (existingAutoFile) {
          Object.assign(existingAutoFile, autoFileInfo);
          console.log('🔄 Otomatik dosya güncellendi');
        } else {
          uploadedFilesList.unshift(autoFileInfo);
          console.log('✅ Yeni otomatik dosya eklendi');
        }

        console.log(`✅ Otomatik dosya başarıyla işlendi (${parseResult.rowCount} kayıt)`);
        console.log('📊 Yeni Dashboard İstatistikleri:', dashboardStats);
        
      } else {
        console.error('❌ Otomatik dosya parse hatası:', parseResult.error);
      }
      
    } catch (error) {
      console.error('❌ Otomatik dosya işleme hatası:', error);
    }
  }

  getStatus() {
    return {
      isWatching: this.isWatching,
      watchPath: this.watchPath,
      lastModified: this.lastModified,
      fileExists: fs.existsSync(this.watchPath),
      lastUpdate: this.lastModified ? new Date(this.lastModified).toISOString() : null
    };
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.isWatching = false;
      console.log('🛑 Dosya izleme durduruldu');
    }
  }
}

// FileWatcher instance'ı oluştur
const fileWatcher = new FileWatcher();

// Detay verileri işleme fonksiyonu - GÜNCELLENMIŞ
function processDetailData(data) {
  console.log('🔍 Detay verileri işleniyor...');
  console.log('📊 Ham veri örneği:', data.slice(0, 2));
  
  try {
    // Tarih parse fonksiyonu - GÜNCELLENMİŞ
    const parseDateTime = (dateTimeStr) => {
      if (!dateTimeStr || dateTimeStr.toString().trim() === '') return null;
      
      try {
        const str = dateTimeStr.toString().trim();
        console.log('🔍 Parse ediliyor:', str);
        
        // 1. Normal Türk tarihi formatı: "14.12.2021 11:50"
        if (str.includes('.') && str.includes(' ')) {
          const parts = str.split(' ');
          
          if (parts.length >= 2) {
            const datePart = parts[0]; // "14.12.2021"
            const timePart = parts[1]; // "11:50"
            
            const [day, month, year] = datePart.split('.');
            const [hour, minute] = timePart.split(':');
            
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);
            const dayNum = parseInt(day);
            const hourNum = parseInt(hour);
            const minuteNum = parseInt(minute || 0);
            
            if (yearNum && monthNum && dayNum && hourNum !== undefined) {
              const isoDate = new Date(
                yearNum, 
                monthNum - 1,
                dayNum,
                hourNum,
                minuteNum
              );
              
              console.log('✅ Türk tarihi parse edildi:', isoDate.toISOString());
              return isoDate.toISOString();
            }
          }
        }
        
        // 2. Excel Serial Number formatı: "44450.71314814815"
        const numValue = parseFloat(str);
        if (!isNaN(numValue) && numValue > 40000 && numValue < 50000) {
          // Excel epoch: 1 Ocak 1900 = 1
          // JavaScript epoch: 1 Ocak 1970
          
          // Excel'in hatalı leap year hesabı düzeltmesi
          const excelEpoch = new Date(1900, 0, 1);
          const daysSinceEpoch = numValue - 2; // Excel'in bug'ı için -2
          
          const jsDate = new Date(excelEpoch.getTime() + (daysSinceEpoch * 24 * 60 * 60 * 1000));
          
          console.log('✅ Excel serial number parse edildi:', jsDate.toISOString());
          return jsDate.toISOString();
        }
        
        console.warn('⚠️ Tarih formatı tanınamadı:', str);
        return null;
        
      } catch (e) {
        console.error('❌ Tarih parse hatası:', dateTimeStr, e);
        return null;
      }
    };

    detailDataList = data.map((row, index) => {
      // Sütun isimlerini normalize et
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key.trim().replace(/\s+/g, ' ');
        normalizedRow[cleanKey] = row[key];
      });
      
      // Debug: İlk birkaç satırın ham verilerini göster
      if (index < 3) {
        console.log(`📝 Satır ${index + 1} ham veri:`, {
          'IS BASLATMA SAATI': normalizedRow['IS BASLATMA SAATI'],
          'IS BITIRME SAATI': normalizedRow['IS BITIRME SAATI'],
          'SIPARIS NUMARASI': normalizedRow['SIPARIS NUMARASI']
        });
      }
      
      const processedItem = {
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
      
      // Debug: İlk birkaç satırın işlenmiş verilerini göster
      if (index < 3) {
        console.log(`📋 Satır ${index + 1} işlenmiş veri:`, processedItem);
      }
      
      return processedItem;
    }).filter(item => 
      item.siparisNo !== '-' || item.parcaAdeti > 0
    );
    
    console.log('✅ İşlenen detay kayıt sayısı:', detailDataList.length);
    console.log('📅 İlk kaydın tarih bilgileri:', {
      baslatma: detailDataList[0]?.baslatmaSaati,
      bitirme: detailDataList[0]?.bitirmeSaati
    });
    
  } catch (error) {
    console.error('❌ Detay veri işleme hatası:', error);
    detailDataList = [];
  }
}

// Excel parse fonksiyonu
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

// Dashboard istatistik hesaplama
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
    version: '2.0.0',
    features: ['Manuel Upload', 'Otomatik Dosya İzleme'],
    endpoints: [
      'GET / - Bu mesaj',
      'GET /api/dashboard-data - Dashboard verileri', 
      'POST /api/upload - Excel yükleme',
      'GET /api/files - Yüklenen dosyalar',
      'GET /api/dashboard-detail - Detay veriler',
      'GET /api/auto-import-status - Otomatik import durumu'
    ]
  });
});

// Otomatik import durumu
app.get('/api/auto-import-status', (req, res) => {
  console.log('🤖 Otomatik import durumu sorgulandı');
  
  const status = fileWatcher.getStatus();
  
  res.json({
    success: true,
    ...status,
    instructions: {
      step1: 'Excel dosyanızı şu konuma kopyalayın: auto-import/production_data.xlsx',
      step2: 'Dosyayı her güncelledikçe sistem otomatik algılayacak',
      step3: 'Manuel yükleme de hala kullanılabilir'
    }
  });
});

// Dashboard verileri
app.get('/api/dashboard-data', (req, res) => {
  console.log('📊 Dashboard API çağrıldı');
  
  const dashboardData = {
    stats: dashboardStats,
    lastUpdate: new Date().toISOString(),
    status: 'success',
    dataSource: uploadedFilesList.length > 1 ? 'excel' : 'demo',
    autoImportStatus: fileWatcher.getStatus()
  };
  
  res.json(dashboardData);
});

// Dashboard detay verileri
app.get('/api/dashboard-detail', (req, res) => {
  console.log('📋 Dashboard detay verisi istendi');
  
  try {
    res.json({
      success: true,
      data: detailDataList,
      totalRecords: detailDataList.length,
      autoImportActive: fileWatcher.isWatching
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

// Upload endpoint (Manuel yükleme)
app.post('/api/upload', upload.single('file'), (req, res) => {
  console.log('📤 Manuel dosya upload isteği geldi');
  
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
    columns: parseResult.columns,
    source: 'manual'
  };
  
  uploadedFilesList.unshift(fileInfo);
  
  console.log('✅ Manuel dosya başarıyla işlendi');
  
  res.json({
    success: true,
    message: 'Dosya başarıyla yüklendi ve işlendi!',
    file: fileInfo,
    stats: dashboardStats,
    detailRecords: detailDataList.length,
    autoImportStatus: fileWatcher.getStatus()
  });
});

// Dosya listesi
app.get('/api/files', (req, res) => {
  console.log('📁 Files API çağrıldı');
  
  res.json({ 
    files: uploadedFilesList, 
    total: uploadedFilesList.length,
    totalDetailRecords: detailDataList.length,
    autoImportStatus: fileWatcher.getStatus()
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
  console.log(`🤖 Auto Import Status: http://localhost:${PORT}/api/auto-import-status`);
  console.log(`📅 Zaman: ${new Date().toLocaleString('tr-TR')}`);
  
  // Otomatik dosya izleme sistemini başlat
  setTimeout(() => {
    fileWatcher.startWatching();
  }, 2000);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server kapatılıyor...');
  fileWatcher.stop();
  process.exit(0);
});

console.log('Server başlatılıyor...');