const express = require('express');
const app = express();

app.use(express.json());

// In-memory saklama alanları
let liveMatches = [];
let upcomingMatches = [];

// PUT endpoint: /live 
// Sadece status değeri "live" olan maç verilerini güncellemek için
app.put('/live', (req, res) => {
  const games = req.body;
  if (!Array.isArray(games)) {
    return res.status(400).json({ error: 'Veri, maç bilgilerini içeren bir dizi olmalıdır.' });
  }
  
  // Sadece "live" olan maçları filtreleyelim
  const validGames = games.filter(game => game.status === 'live');
  liveMatches = validGames;
  console.log(`Güncellenen canlı maç sayısı: ${liveMatches.length}`);
  
  res.json({ message: 'Canlı maç bilgileri başarıyla güncellendi.', count: liveMatches.length });
});

// GET endpoint: /live
// Güncel canlı maç verilerini döner
app.get('/live', (req, res) => {
  res.json({ liveMatches });
});

// PUT endpoint: /upcoming 
// Sadece status değeri "upcoming" olan maç verilerini güncellemek için
app.put('/upcoming', (req, res) => {
  const games = req.body;
  if (!Array.isArray(games)) {
    return res.status(400).json({ error: 'Veri, maç bilgilerini içeren bir dizi olmalıdır.' });
  }
  
  // Sadece "upcoming" olan maçları filtreleyelim
  const validGames = games.filter(game => game.status === 'upcoming');
  upcomingMatches = validGames;
  console.log(`Güncellenen upcoming maç sayısı: ${upcomingMatches.length}`);
  
  res.json({ message: 'Upcoming maç bilgileri başarıyla güncellendi.', count: upcomingMatches.length });
});

// GET endpoint: /upcoming
// Güncel upcoming maç verilerini döner
app.get('/upcoming', (req, res) => {
  res.json({ upcomingMatches });
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portu üzerinde çalışıyor.`);
});
