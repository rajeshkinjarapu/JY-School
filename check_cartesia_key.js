const API_KEY = 'sk_car_VmJaxwjhRyrkvLUCRip9TZ';

async function checkCartesiaKey() {
  console.log('====================================================');
  console.log('🔍 CARTESIA AI - API KEY లైవ్ వెరిఫికేషన్ ప్రారంభం...');
  console.log('🔑 Key Prefix:', API_KEY.slice(0, 10) + '...' + API_KEY.slice(-4));
  console.log('====================================================\n');

  try {
    // 1. Voices Endpoint Test
    console.log('1️⃣ API కీ ప్రామాణికత & అందుబాటులో ఉన్న వాయిస్‌ల తనిఖీ...');
    const res = await fetch('https://api.cartesia.ai/voices', {
      headers: {
        'X-API-Key': API_KEY,
        'Cartesia-Version': '2024-06-10',
      },
    });

    console.log(`📡 Response Status: ${res.status} ${res.statusText}`);

    if (res.status === 200) {
      const voices = await res.json();
      console.log('✅ [STATUS: ACTIVE & VALID] ఈ API కీ 100% సరైనది మరియు ప్రస్తుతం యాక్టివ్‌గా ఉంది!');
      console.log(`📊 మొత్తం వాయిస్‌లు (Total Voices): ${voices.length}`);

      const customVoices = voices.filter((v) => !v.is_public);
      const publicVoices = voices.filter((v) => v.is_public);

      console.log(`🔹 అకౌంట్‌లోని కస్టమ్ / క్లోన్డ్ వాయిస్‌లు (Custom Voices): ${customVoices.length}`);
      console.log(`🔹 పబ్లిక్ లైబ్రరీ వాయిస్‌లు (Public Voices): ${publicVoices.length}`);

      if (customVoices.length > 0) {
        console.log('\n🎙️ మీ అకౌంట్‌లో క్రియేట్ చేసిన కస్టమ్ వాయిస్‌ల జాబితా:');
        customVoices.forEach((v, idx) => {
          console.log(`   ${idx + 1}. పేరు: "${v.name}"`);
          console.log(`      Voice ID: ${v.id}`);
          console.log(`      భాష/మోడల్: ${v.language || 'multilingual'}`);
          console.log(`      వివరణ: ${v.description || 'No description'}\n`);
        });
      }
    } else if (res.status === 401 || res.status === 403) {
      console.log('❌ [STATUS: INVALID / UNAUTHORIZED]');
      console.log('ఈ API కీ చెల్లదు లేదా గడువు ముగిసింది / తొలగించబడింది.');
      const err = await res.text();
      console.log('Error Details:', err);
      return;
    } else {
      console.log(`⚠️ Status: ${res.status}`);
      const err = await res.text();
      console.log('Details:', err);
    }

    // 2. TTS Audio Generation Test
    console.log('\n2️⃣ ఆడియో జనరేషన్ (TTS Credits & Quota) తనిఖీ...');
    const ttsRes = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'sonic-multilingual',
        transcript: 'Test',
        voice: {
          mode: 'id',
          id: 'b276ec78-cf3b-49b4-ba17-b046ef7d4f52',
        },
        language: 'en',
        output_format: {
          container: 'mp3',
          sample_rate: 44100,
        },
      }),
    });

    if (ttsRes.status === 200) {
      console.log('✅ [TTS AUDIO TEST: SUCCESS]');
      console.log('ఈ అకౌంట్‌లో వాయిస్ జనరేషన్ పర్ఫెక్ట్‌గా పనిచేస్తోంది, క్రెడిట్స్ యాక్టివ్‌గా ఉన్నాయి!');
    } else {
      console.log(`⚠️ TTS Status: ${ttsRes.status} ${ttsRes.statusText}`);
      const ttsErr = await ttsRes.text();
      console.log('TTS Message:', ttsErr);
    }

  } catch (error) {
    console.error('❌ నెట్‌వర్క్ ఎర్రర్:', error.message);
  }

  console.log('\n====================================================');
  console.log('🏁 తనిఖీ పూర్తయింది.');
  console.log('====================================================');
}

checkCartesiaKey();
