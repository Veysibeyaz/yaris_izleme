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

// Auto-import ana klasörünü oluştur
const autoImportDir = String.raw`C:\Users\veysi\OneDrive\Masaüstü\veysi1\makineverileri`;

if (!fs.existsSync(autoImportDir)) {
  fs.mkdirSync(autoImportDir);
  console.log('Auto-import klasörü oluşturuldu');
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
let machinesList = [
  { id: 1, name: 'Makine-1', isActive: true, createdAt: new Date().toISOString() },
  { id: 2, name: 'Makine-2', isActive: true, createdAt: new Date().toISOString() },
  { id: 3, name: 'Makine-3', isActive: true, createdAt: new Date().toISOString() }
];

let machineData = {
  all: {
    stats: { totalProduction: 3741, machinePerformance: 89, activeOperators: 12, pendingOrders: 8 },
    uploadedFiles: [],
    detailData: []
  }
};

// Her makine için başlangıç verilerini oluştur
machinesList.forEach(machine => {
  const machineId = `makine-${machine.id}`;
  machineData[machineId] = {
    stats: { totalProduction: 1247, machinePerformance: 87, activeOperators: 4, pendingOrders: 3 },
    uploadedFiles: [],
    detailData: []
  };
  
  // Makine klasörünü oluştur
  const machineDir = path.join(autoImportDir, machineId);
  if (!fs.existsSync(machineDir)) {
    fs.mkdirSync(machineDir);
    console.log(`${machineId} klasörü oluşturuldu`);
  }
});

// ========== COK MAKINELI DOSYA IZLEME SISTEMI ==========

class MultiMachineFileWatcher {
  constructor() {
    this.watchers = new Map();
    this.isWatching = false;
  }

  startWatching() {
    console.log('Coklu makine dosya izleme sistemi baslatiliyor...');
    
    machinesList.forEach(machine => {
      this.startMachineWatcher(machine.id);
    });
    
    this.isWatching = true;
    console.log('Tum makineler icin dosya izleme aktif');
  }

  startMachineWatcher(machineId) {
    const machineKey = `makine-${machineId}`;
    const watchPath = path.join(autoImportDir, machineKey, 'production_data.xlsx');
    
    console.log(`${machineKey} izleme baslatiliyor:`, watchPath);
    
    const watcher = chokidar.watch(watchPath, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });
    
    watcher.on('add', (filePath) => {
      console.log(`${machineKey} - Yeni dosya tespit edildi:`, filePath);
      this.processMachineFile(machineId, 'add');
    });

    watcher.on('change', (filePath) => {
      console.log(`${machineKey} - Dosya degisikligi tespit edildi:`, filePath);
      this.processMachineFile(machineId, 'change');
    });

    watcher.on('error', (error) => {
      console.error(`${machineKey} - Dosya izleme hatasi:`, error);
    });

    this.watchers.set(machineId, {
      watcher,
      watchPath,
      lastModified: null
    });
  }

  async processMachineFile(machineId, source = 'unknown') {
    try {
      const machineKey = `makine-${machineId}`;
      const watcherInfo = this.watchers.get(machineId);
      
      if (!watcherInfo) return;
      
      const { watchPath } = watcherInfo;
      
      console.log(`${machineKey} dosyasi isleniyor (kaynak: ${source})...`);
      
      if (!fs.existsSync(watchPath)) {
        console.log(`${machineKey} dosyasi bulunamadi:`, watchPath);
        return;
      }

      // Dosya bilgilerini al
      const stats = fs.statSync(watchPath);
      watcherInfo.lastModified = stats.mtime.getTime();

      // Excel dosyasını parse et
      const parseResult = parseExcelFile(watchPath, 'production_data.xlsx', machineId);
      
      if (parseResult.success) {
        console.log(`${machineKey} dosyasi basariyla islendi (${parseResult.rowCount} kayit)`);
        this.updateGlobalStats(); // Tümü istatistiklerini güncelle
      } else {
        console.error(`${machineKey} dosya parse hatasi:`, parseResult.error);
      }
      
    } catch (error) {
      console.error(`${machineKey} dosya isleme hatasi:`, error);
    }
  }

  updateGlobalStats() {
    // Tüm makinelerin istatistiklerini topla
    let totalProduction = 0;
    let totalPerformance = 0;
    let totalOperators = 0;
    let totalPendingOrders = 0;
    let activeMachines = 0;
    
    machinesList.forEach(machine => {
      const machineKey = `makine-${machine.id}`;
      const machineStats = machineData[machineKey]?.stats;
      
      if (machineStats) {
        totalProduction += machineStats.totalProduction || 0;
        totalPerformance += machineStats.machinePerformance || 0;
        totalOperators += machineStats.activeOperators || 0;
        totalPendingOrders += machineStats.pendingOrders || 0;
        activeMachines++;
      }
    });
    
    machineData.all.stats = {
      totalProduction,
      machinePerformance: activeMachines > 0 ? Math.round(totalPerformance / activeMachines) : 0,
      activeOperators: totalOperators,
      pendingOrders: totalPendingOrders
    };
    
    console.log('Global istatistikler guncellendi:', machineData.all.stats);
  }

  addMachine(machineId) {
    // Yeni makine için klasör oluştur
    const machineKey = `makine-${machineId}`;
    const machineDir = path.join(autoImportDir, machineKey);
    
    if (!fs.existsSync(machineDir)) {
      fs.mkdirSync(machineDir);
      console.log(`Yeni makine klasörü oluşturuldu: ${machineKey}`);
    }
    
    // Makine verileri initialize et
    machineData[machineKey] = {
      stats: { totalProduction: 0, machinePerformance: 0, activeOperators: 0, pendingOrders: 0 },
      uploadedFiles: [],
      detailData: []
    };
    
    // Dosya izlemeyi başlat
    if (this.isWatching) {
      this.startMachineWatcher(machineId);
    }
  }

  removeMachine(machineId) {
    const machineKey = `makine-${machineId}`;
    
    // Watcher'ı durdur
    const watcherInfo = this.watchers.get(machineId);
    if (watcherInfo) {
      watcherInfo.watcher.close();
      this.watchers.delete(machineId);
      console.log(`${machineKey} dosya izleme durduruldu`);
    }
    
    // Makine verisini sil
    delete machineData[machineKey];
    
    // Global stats'ı güncelle
    this.updateGlobalStats();
  }

  getStatus() {
    const machineStatuses = {};
    
    machinesList.forEach(machine => {
      const machineKey = `makine-${machine.id}`;
      const watcherInfo = this.watchers.get(machine.id);
      const watchPath = watcherInfo ? watcherInfo.watchPath : null;
      
      machineStatuses[machineKey] = {
        isWatching: !!watcherInfo,
        watchPath,
        lastModified: watcherInfo?.lastModified,
        fileExists: watchPath ? fs.existsSync(watchPath) : false,
        lastUpdate: watcherInfo?.lastModified ? new Date(watcherInfo.lastModified).toISOString() : null
      };
    });
    
    return {
      isWatching: this.isWatching,
      machines: machineStatuses,
      totalMachines: machinesList.length
    };
  }

  stop() {
    this.watchers.forEach((watcherInfo, machineId) => {
      watcherInfo.watcher.close();
      console.log(`Makine-${machineId} izleme durduruldu`);
    });
    
    this.watchers.clear();
    this.isWatching = false;
    console.log('Tum makine dosya izleme durduruldu');
  }
}

// MultiMachineFileWatcher instance'ı oluştur
const fileWatcher = new MultiMachineFileWatcher();

// Detay verileri işleme fonksiyonu
function processDetailData(data, machineId) {
  const machineKey = machineId ? `makine-${machineId}` : 'all';
  console.log(`${machineKey} detay verileri isleniyor...`);
  
  try {
    const parseDateTime = (dateTimeStr) => {
      if (!dateTimeStr || dateTimeStr.toString().trim() === '') return null;
      
      try {
        const str = dateTimeStr.toString().trim();
        
        if (str.includes('.') && str.includes(' ')) {
          const parts = str.split(' ');
          
          if (parts.length >= 2) {
            const datePart = parts[0];
            const timePart = parts[1];
            
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
              
              return isoDate.toISOString();
            }
          }
        }
        
        const numValue = parseFloat(str);
        if (!isNaN(numValue) && numValue > 40000 && numValue < 50000) {
          const excelEpoch = new Date(1900, 0, 1);
          const daysSinceEpoch = numValue - 2;
          
          const jsDate = new Date(excelEpoch.getTime() + (daysSinceEpoch * 24 * 60 * 60 * 1000));
          
          return jsDate.toISOString();
        }
        
        return null;
        
      } catch (e) {
        console.error('Tarih parse hatasi:', dateTimeStr, e);
        return null;
      }
    };

    const detailDataList = data.map((row, index) => {
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key.trim().replace(/\s+/g, ' ');
        normalizedRow[cleanKey] = row[key];
      });
      
      // Find the machine name based on machineId
      const currentMachine = machinesList.find(m => `makine-${m.id}` === machineKey);
      const machineName = currentMachine ? currentMachine.name : 'Genel'; // Default to 'Genel' or 'Bilinmiyor'

      return {
        id: index + 1,
        siparisNo: normalizedRow['SIPARIS NUMARASI'] || '-',
        baslatmaSaati: parseDateTime(normalizedRow['IS BASLATMA SAATI']),
        bitisSaati: parseDateTime(normalizedRow['IS BITIRME SAATI']),
        sure: normalizedRow['TOPLAM IS SURESI'] || '-',
        parcaAdeti: parseInt(normalizedRow['BASILAN PARCA ADETI']) || 0,
        hurdaSayisi: parseInt(normalizedRow['HURDA ADETI']) || 0,
        makinaPerformans: parseInt(normalizedRow['MAKINA PERFORMANSI']) || 0,
        operatorPerformans: parseInt(normalizedRow['OPERATOR PERFORMANSI']) || 0,
        machineId: machineId || 'all',
        makineAdi: machineName 
      };
    }).filter(item => 
      item.siparisNo !== '-' || item.parcaAdeti > 0
    );
    
    // Makine verisini güncelle
    if (!machineData[machineKey]) {
      machineData[machineKey] = { stats: {}, uploadedFiles: [], detailData: [] };
    }
    
    machineData[machineKey].detailData = detailDataList;
    
    console.log(`${machineKey} islenen detay kayit sayisi:`, detailDataList.length);
    
  } catch (error) {
    console.error(`${machineKey} detay veri isleme hatasi:`, error);
    if (!machineData[machineKey]) {
      machineData[machineKey] = { stats: {}, uploadedFiles: [], detailData: [] };
    }
    machineData[machineKey].detailData = [];
  }
}

// Excel parse fonksiyonu
function parseExcelFile(filePath, originalName, machineId = null) {
  const machineKey = machineId ? `makine-${machineId}` : 'manual';
  console.log(`${machineKey} Excel dosyasi parse ediliyor:`, originalName);
  
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`${machineKey} toplam satir sayisi:`, jsonData.length);
    
    // Dashboard istatistiklerini hesapla
    calculateDashboardStats(jsonData, machineId);
    
    // Detay verilerini isle
    processDetailData(jsonData, machineId);
    
    // Dosya bilgisini ekle
    if (machineId) {
      const machineKey = `makine-${machineId}`;
      const stats = fs.statSync(filePath);
      
      const existingAutoFile = machineData[machineKey].uploadedFiles.find(f => f.source === 'auto');
      
      const autoFileInfo = {
        id: existingAutoFile ? existingAutoFile.id : Date.now(),
        name: `production_data.xlsx (${machineKey.toUpperCase()})`,
        filename: 'production_data.xlsx',
        uploadDate: new Date().toISOString(),
        size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
        status: 'processed',
        rowCount: jsonData.length,
        columns: Object.keys(jsonData[0] || {}),
        source: 'auto',
        lastUpdate: new Date().toISOString(),
        machineId: machineId
      };

      if (existingAutoFile) {
        Object.assign(existingAutoFile, autoFileInfo);
      } else {
        machineData[machineKey].uploadedFiles.unshift(autoFileInfo);
      }
    }
    
    return {
      success: true,
      rowCount: jsonData.length,
      data: jsonData,
      columns: Object.keys(jsonData[0] || {})
    };
    
  } catch (error) {
    console.error(`${machineKey} Excel parse hatasi:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Dashboard istatistik hesaplama
function calculateDashboardStats(data, machineId = null) {
  const machineKey = machineId ? `makine-${machineId}` : 'all';
  console.log(`${machineKey} dashboard istatistikleri hesaplaniyor...`);
  
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
    
    const stats = {
      totalProduction,
      machinePerformance: avgMachinePerformance,
      activeOperators: operators.size,
      pendingOrders
    };
    
    if (!machineData[machineKey]) {
      machineData[machineKey] = { stats: {}, uploadedFiles: [], detailData: [] };
    }
    
    machineData[machineKey].stats = stats;
    
    console.log(`${machineKey} hesaplanan istatistikler:`, stats);
    
  } catch (error) {
    console.error(`${machineKey} istatistik hesaplama hatasi:`, error);
  }
}

// ========== API ENDPOINTS ==========

// Ana route
app.get('/', (req, res) => {
  console.log('Ana route cagrildi');
  res.json({ 
    message: 'Yaris Coklu Makine Izleme API calisiyor! ',
    version: '3.0.0',
    features: ['Manuel Upload', 'Coklu Makine Otomatik Izleme', 'Dinamik Makine Yonetimi'],
    machines: machinesList.length,
    endpoints: [
      'GET / - Bu mesaj',
      'GET /api/machines - Makine listesi',
      'POST /api/machines - Yeni makine ekle',
      'DELETE /api/machines/:id - Makine sil',
      'GET /api/dashboard-data/:machineKey - Dashboard verileri',
      'POST /api/upload - Excel yukleme',
      'GET /api/files/:machineKey - Yuklenen dosyalar',
      'GET /api/dashboard-detail/:machineKey - Detay veriler',
      'GET /api/auto-import-status - Otomatik import durumu'
    ]
  });
});

// Makine listesi
app.get('/api/machines', (req, res) => {
  console.log('Makine listesi istendi');
  
  res.json({
    success: true,
    machines: machinesList,
    totalMachines: machinesList.length
  });
});

// Yeni makine ekleme
app.post('/api/machines', (req, res) => {
  console.log('Yeni makine ekleme istegi');
  
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Makine adi gerekli!'
      });
    }
    
    const newId = Math.max(...machinesList.map(m => m.id)) + 1;
    const newMachine = {
      id: newId,
      name: name.trim(),
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    machinesList.push(newMachine);
    fileWatcher.addMachine(newId);
    
    console.log('Yeni makine eklendi:', newMachine.name);
    
    res.json({
      success: true,
      machine: newMachine,
      totalMachines: machinesList.length
    });
    
  } catch (error) {
    console.error('Makine ekleme hatasi:', error);
    res.status(500).json({
      success: false,
      message: 'Makine eklenirken hata olustu'
    });
  }
});

// Makine silme
app.delete('/api/machines/:id', (req, res) => {
  console.log('Makine silme istegi');
  
  try {
    const machineId = parseInt(req.params.id);
    
    if (machinesList.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'En az bir makine olmali!'
      });
    }
    
    const machineIndex = machinesList.findIndex(m => m.id === machineId);
    
    if (machineIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Makine bulunamadi!'
      });
    }
    
    const removedMachine = machinesList[machineIndex];
    machinesList.splice(machineIndex, 1);
    fileWatcher.removeMachine(machineId);
    
    console.log('Makine silindi:', removedMachine.name);
    
    res.json({
      success: true,
      removedMachine,
      totalMachines: machinesList.length
    });
    
  } catch (error) {
    console.error('Makine silme hatasi:', error);
    res.status(500).json({
      success: false,
      message: 'Makine silinirken hata olustu'
    });
  }
});

// Otomatik import durumu
app.get('/api/auto-import-status', (req, res) => {
  console.log('Otomatik import durumu sorgulandi');
  
  const status = fileWatcher.getStatus();
  
  res.json({
    success: true,
    ...status,
    instructions: {
      step1: 'Excel dosyalarinizi makine klasorlerine kopyalayin: auto-import/makine-X/production_data.xlsx',
      step2: 'Her makine icin ayri dosya sistemi calisir',
      step3: 'Manuel yukleme de hala kullanilabilir'
    }
  });
});

// Dashboard verileri (makine bazında)
app.get('/api/dashboard-data/:machineKey?', (req, res) => {
  console.log('Dashboard API cagrildi');
  
  const machineKey = req.params.machineKey || 'all';
  const machineData_ = machineData[machineKey];
  
  if (!machineData_) {
    return res.status(404).json({
      success: false,
      message: 'Makine bulunamadi!'
    });
  }
  
  const dashboardData = {
    stats: machineData_.stats,
    lastUpdate: new Date().toISOString(),
    status: 'success',
    machineKey,
    dataSource: machineData_.uploadedFiles.length > 0 ? 'excel' : 'demo',
    autoImportStatus: fileWatcher.getStatus()
  };
  
  res.json(dashboardData);
});

// Dashboard detay verileri (makine bazında)
app.get('/api/dashboard-detail/:machineKey?', (req, res) => {
  console.log('Dashboard detay verisi istendi');
  
  try {
    const machineKey = req.params.machineKey || 'all';
    
    let detailData = [];
    
    if (machineKey === 'all') {
      // Tum makinelerin dosyalarini birlestir
      machinesList.forEach(machine => {
        const mKey = `makine-${machine.id}`;
        if (machineData[mKey] && machineData[mKey].detailData) {
          detailData = detailData.concat(machineData[mKey].detailData);
        }
      });
    } else {
      const machineData_ = machineData[machineKey];
      if (machineData_) {
        detailData = machineData_.detailData || [];
      }
    }
    
    res.json({
      success: true,
      data: detailData,
      totalRecords: detailData.length,
      machineKey,
      autoImportActive: fileWatcher.isWatching
    });
    
  } catch (error) {
    console.error('Detay veri gonderme hatasi:', error);
    res.status(500).json({
      success: false,
      message: 'Detay veriler alinamadi',
      error: error.message
    });
  }
});

// Upload endpoint (Manuel yukleme - makine secilebilir)
app.post('/api/upload', upload.single('file'), (req, res) => {
  console.log('Manuel dosya upload istegi geldi');
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Dosya yuklenmedi!'
    });
  }
  
  const { machineId } = req.body;
  const targetMachineId = machineId ? parseInt(machineId) : null;
  
  console.log('Yuklenen dosya:', req.file.originalname, 'Hedef makine:', targetMachineId);
  
  const parseResult = parseExcelFile(req.file.path, req.file.originalname, targetMachineId);
  
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Excel dosyasi okunamadi: ' + parseResult.error
    });
  }
  
  const machineKey = targetMachineId ? `makine-${targetMachineId}` : 'all';
  
  const fileInfo = {
    id: Date.now(),
    name: req.file.originalname,
    filename: req.file.filename,
    uploadDate: new Date().toISOString(),
    size: (req.file.size / 1024 / 1024).toFixed(2) + ' MB',
    status: 'processed',
    rowCount: parseResult.rowCount,
    columns: parseResult.columns,
    source: 'manual',
    machineId: targetMachineId
  };
  
  if (!machineData[machineKey]) {
    machineData[machineKey] = { stats: {}, uploadedFiles: [], detailData: [] };
  }
  
  machineData[machineKey].uploadedFiles.unshift(fileInfo);
  
  // Global stats'ı güncelle
  if (targetMachineId) {
    fileWatcher.updateGlobalStats();
  }
  
  console.log('Manuel dosya basariyla islendi');
  
  res.json({
    success: true,
    message: 'Dosya basariyla yuklendi ve islendi!',
    file: fileInfo,
    stats: machineData[machineKey].stats,
    detailRecords: machineData[machineKey].detailData.length,
    machineKey,
    autoImportStatus: fileWatcher.getStatus()
  });
});

// Dosya listesi (makine bazında)
app.get('/api/files/:machineKey?', (req, res) => {
  console.log('Files API cagrildi');
  
  const machineKey = req.params.machineKey || 'all';
  
  let files = [];
  let totalDetailRecords = 0;
  
  if (machineKey === 'all') {
    // Tum makinelerin dosyalarini birlestir
    machinesList.forEach(machine => {
      const mKey = `makine-${machine.id}`;
      if (machineData[mKey]) {
        files = files.concat(machineData[mKey].uploadedFiles || []);
        totalDetailRecords += (machineData[mKey].detailData || []).length;
      }
    });
  } else {
    const machineData_ = machineData[machineKey];
    if (machineData_) {
      files = machineData_.uploadedFiles || [];
      totalDetailRecords = (machineData_.detailData || []).length;
    }
  }
  
  res.json({ 
    files, 
    total: files.length,
    totalDetailRecords,
    machineKey,
    autoImportStatus: fileWatcher.getStatus()
  });
});

console.log('Routes tanimlandi...');

// Server baslat
app.listen(PORT, () => {
  console.log(`Server basariyla basladi!`);
  console.log(`Adres: http://localhost:${PORT}`);
  console.log(`Dashboard API: http://localhost:${PORT}/api/dashboard-data/{machineKey}`);
  console.log(`Machines API: http://localhost:${PORT}/api/machines`);
  console.log(`Files API: http://localhost:${PORT}/api/files/{machineKey}`);
  console.log(`Upload API: http://localhost:${PORT}/api/upload`);
  console.log(`Detail API: http://localhost:${PORT}/api/dashboard-detail/{machineKey}`);
  console.log(`Auto Import Status: http://localhost:${PORT}/api/auto-import-status`);
  console.log(`Zaman: ${new Date().toLocaleString('tr-TR')}`);
  
  // Otomatik dosya izleme sistemini başlat
  setTimeout(() => {
    fileWatcher.startWatching();
  }, 2000);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nServer kapatiliyor...');
  fileWatcher.stop();
  process.exit(0);
});

console.log('Server baslatiliyor...');