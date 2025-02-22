const express = require('express');
const app = express();

app.use(express.json());

// In-memory saklama alanları
let liveMatches = [];
let upcomingMatches = [];
let endedMatches = [];

// PUT endpoint: /live 
// Gelen canlı maç listesini günceller.
// Eğer mevcut liveMatches'ten bir maç, yeni listede yoksa o maç sona ermiş sayılarak endedMatches'e eklenir.
app.put('/live', (req, res) => {
  const games = req.body;
  if (!Array.isArray(games)) {
    return res.status(400).json({ error: 'Veri, maç bilgilerini içeren bir dizi olmalıdır.' });
  }
  
  // Yeni canlı maç listesini status "live" olanlardan oluşturuyoruz.
  const newLiveMatches = games.filter(game => game.status === 'live');
  
  // Yeni listede yer almayan maçlar sona ermiş sayılır.
  const newLiveIds = newLiveMatches.map(game => game.id);
  
  liveMatches.forEach(match => {
    if (!newLiveIds.includes(match.id)) {
      endedMatches.push(match);
      console.log(`Match ${match.id} ended and moved to endedMatches`);
    }
  });
  
  // liveMatches dizisini yeni canlı maç listesiyle güncelliyoruz.
  liveMatches = newLiveMatches;
  
  res.json({
    message: 'Canlı maç bilgileri güncellendi.',
    liveCount: liveMatches.length,
    endedCount: endedMatches.length
  });
});

// GET endpoint: /live
// Güncel canlı maç verilerini direkt dizi olarak döner.
app.get('/live', (req, res) => {
  res.json(liveMatches);
});

// PUT endpoint: /upcoming 
// Gelen verideki status değeri "upcoming" olan maçları saklar.
app.put('/upcoming', (req, res) => {
  const games = req.body;
  if (!Array.isArray(games)) {
    return res.status(400).json({ error: 'Veri, maç bilgilerini içeren bir dizi olmalıdır.' });
  }
  
  const validGames = games.filter(game => game.status === 'upcoming');
  upcomingMatches = validGames;
  console.log(`Güncellenen upcoming maç sayısı: ${upcomingMatches.length}`);
  
  res.json({ message: 'Upcoming maç bilgileri başarıyla güncellendi.', count: upcomingMatches.length });
});

// GET endpoint: /upcoming
// Güncel upcoming maç verilerini direkt dizi olarak döner.
app.get('/upcoming', (req, res) => {
  res.json(upcomingMatches);
});

// GET endpoint: /ended
// Ended olarak işaretlenmiş maç verilerini direkt dizi olarak döner.
app.get('/ended', (req, res) => {
  res.json(endedMatches);
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portu üzerinde çalışıyor.`);
});
