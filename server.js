const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// MongoDB bağlantısı için URI (Cluster "QQ")
const uri = "mongodb+srv://utkutez:Utk3131!!@qq.lctss.mongodb.net/Matches?retryWrites=true&w=majority&appName=QQ";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Maç verilerini temsil edecek Mongoose şemaları
const matchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  data: { type: Object, required: true }
});

const Live = mongoose.model('Live', matchSchema);
const Upcoming = mongoose.model('Upcoming', matchSchema);
const Ended = mongoose.model('Ended', matchSchema);

// PUT endpoint: /live
// Gelen live maç verilerini günceller; DB'de Live koleksiyonunda olan ve yeni listede bulunmayan maçlar Ended koleksiyonuna taşınır.
app.put('/live', async (req, res) => {
  try {
    const games = req.body;
    if (!Array.isArray(games)) {
      return res.status(400).json({ error: 'Veri, maç bilgilerini içeren bir dizi olmalıdır.' });
    }
    
    // Gelen veriden status "live" olanları filtreleyelim.
    const newLiveMatches = games.filter(game => game.status === 'live');
    const newLiveIds = newLiveMatches.map(game => game.id);
    
    // Mevcut Live koleksiyonundaki maçları alalım.
    const currentLiveMatches = await Live.find({});
    
    // Mevcut maçlardan, yeni listede yer almayanları Ended olarak işaretleyip Ended koleksiyonuna ekleyelim.
    const endedMatches = currentLiveMatches.filter(match => !newLiveIds.includes(match.id));
    for (const match of endedMatches) {
      await Live.deleteOne({ id: match.id });
      // Statüyü 'ended' yapıp, Ended koleksiyonunda upsert edelim.
      const endedMatch = new Ended({ id: match.id, status: 'ended', data: match.data });
      await endedMatch.save();
      console.log(`Match ${match.id} ended and moved to Ended collection`);
    }
    
    // Yeni live maçları Live koleksiyonuna upsert yöntemiyle ekleyelim veya güncelleyelim.
    for (const game of newLiveMatches) {
      await Live.updateOne(
        { id: game.id },
        { $set: { data: game, status: 'live' } },
        { upsert: true }
      );
    }
    
    const updatedLiveMatches = await Live.find({});
    res.json({
      message: 'Canlı maç bilgileri güncellendi.',
      liveCount: updatedLiveMatches.length,
      endedCount: endedMatches.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// GET endpoint: /live
// Live koleksiyonundaki maçların data alanlarını döndürür.
app.get('/live', async (req, res) => {
  try {
    const liveMatches = await Live.find({});
    res.json(liveMatches.map(match => match.data));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// PUT endpoint: /upcoming
// Gelen upcoming maç verilerini alır; mevcut Upcoming koleksiyonunu temizleyip yenilerini ekler.
app.put('/upcoming', async (req, res) => {
  try {
    const games = req.body;
    if (!Array.isArray(games)) {
      return res.status(400).json({ error: 'Veri, maç bilgilerini içeren bir dizi olmalıdır.' });
    }
    
    const newUpcomingMatches = games.filter(game => game.status === 'upcoming');
    
    // Mevcut Upcoming koleksiyonunu temizleyelim.
    await Upcoming.deleteMany({});
    
    if (newUpcomingMatches.length > 0) {
      const upcomingDocs = newUpcomingMatches.map(game => ({
        id: game.id,
        status: 'upcoming',
        data: game
      }));
      await Upcoming.insertMany(upcomingDocs);
    }
    
    const updatedUpcoming = await Upcoming.find({});
    res.json({ message: 'Upcoming maç bilgileri güncellendi.', count: updatedUpcoming.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// GET endpoint: /upcoming
// Upcoming koleksiyonundaki maçların data alanlarını döndürür.
app.get('/upcoming', async (req, res) => {
  try {
    const upcomingMatches = await Upcoming.find({});
    res.json(upcomingMatches.map(match => match.data));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// GET endpoint: /ended
// Ended koleksiyonundaki maçların data alanlarını döndürür.
app.get('/ended', async (req, res) => {
  try {
    const endedMatches = await Ended.find({});
    res.json(endedMatches.map(match => match.data));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portu üzerinde çalışıyor.`);
});
