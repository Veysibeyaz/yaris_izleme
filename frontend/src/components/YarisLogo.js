import React from 'react';

const YarisLogo = () => {
  return (
    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
      <img 
        src="/yaris_logo.png" 
        alt="Yarış Logo" 
        style={{
          width: '120px',
          height: 'auto',
          marginBottom: '10px',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
        }}
      />
      <h1 style={{ fontSize: '28px', margin: '10px 0 5px 0', color: '#333' }}>YARIŞ</h1>
      <p style={{ color: '#666', fontSize: '14px' }}>Üretim İzleme Sistemi</p>
    </div>
  );
};

export default YarisLogo;