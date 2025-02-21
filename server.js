const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();

app.use(express.json());

// MongoDB bağlantısı için URI (Cluster "QQ")
const uri = "mongodb+srv://utkutez:Utk3131!!@qq.lctss.mongodb.net/?retryWrites=true&w=majority&appName=QQ&tls=true&minTlsVersion=TLS1_2";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect()
  .then(() => {
    console.log('MongoDB connected');
    // "Matches" adlı veritabanını kullanıyoruz
    const db = client.db('Matches');
    const liveCollection = db.collection('Live');
    const upcomingCollection = db.collection('Upcoming');
    const endedCollection = db.collection('Ended');

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
        const currentLiveMatches = await liveCollection.find({}).toArray();
        
        // Mevcut maçlardan, yeni listede yer almayanları Ended olarak işaretleyip Ended koleksiyonuna ekleyelim.
        const endedMatches = currentLiveMatches.filter(match => !newLiveIds.includes(match.id));
        for (const match of endedMatches) {
          await liveCollection.deleteOne({ id: match.id });
          // Statüyü 'ended' yapıp, Ended koleksiyonunda upsert edelim.
          match.status = 'ended';
          await endedCollection.updateOne(
            { id: match.id },
            { $set: { data: match.data, status: 'ended' } },
            { upsert: true }
          );
          console.log(`Match ${match.id} ended and moved to Ended collection`);
        }
        
        // Yeni live maçları Live koleksiyonuna upsert yöntemiyle ekleyelim veya güncelleyelim.
        for (const game of newLiveMatches) {
          await liveCollection.updateOne(
            { id: game.id },
            { $set: { data: game, status: 'live' } },
            { upsert: true }
          );
        }
        
        const updatedLiveMatches = await liveCollection.find({}).toArray();
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
        const liveMatches = await liveCollection.find({}).toArray();
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
        await upcomingCollection.deleteMany({});
        
        if (newUpcomingMatches.length > 0) {
          const upcomingDocs = newUpcomingMatches.map(game => ({
            id: game.id,
            status: 'upcoming',
            data: game
          }));
          await upcomingCollection.insertMany(upcomingDocs);
        }
        
        const updatedUpcoming = await upcomingCollection.find({}).toArray();
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
        const upcomingMatches = await upcomingCollection.find({}).toArray();
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
        const endedMatches = await endedCollection.find({}).toArray();
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
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
