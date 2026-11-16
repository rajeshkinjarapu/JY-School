const fs = require('fs');
const path = require('path');

const CARTESIA_API_KEY = 'sk_car_xg9hN7rt93L4SB5ChZMGL3';
const VOICE_ID = 'b276ec78-cf3b-49b4-ba17-b046ef7d4f52';
const OUTPUT_FILE = path.join(__dirname, 'converted_voice.mp3');

// మీరు అప్‌లోడ్ చేసిన ఆడియోలోని ఒరిజినల్ తెలుగు ప్రసంగం
const transcript = `పెద్ద బొరిగెవలస గ్రామ ప్రజలందరికీ, నా అక్కచెల్లెమ్మలకు, అన్నదమ్ములకు, అందరికీ హృదయపూర్వక నమస్కారాలు. ఈరోజు నేను మీ ముందు ఒక రాజకీయ నాయకుడిగా నిలబడలేదు. ఈ మట్టిలో పుట్టి, ఈ ఊరి మనుషుల మధ్య పెరిగిన మీ బిడ్డగా, మీ సొంత మనిషిగా నిలబడ్డాను. మన ఊరికి సేవ చేసే అవకాశం ఇవ్వమని, మిమ్మల్ని చేతులు జోడించి అడగడానికి వచ్చాను. మన ఊరి అభివృద్ధి కోసం, మీకు నిరంతరం సేవ చేయడం కోసం, ఈ వస్తున్న సర్పంచ్ ఎలక్షన్స్ లో నా భార్య తంగి లావణ్య సర్పంచ్ అభ్యర్థిగా పోటీ చేస్తుంది. లావణ్యను గెలిపించడం అంటే మీ తారక్ ను గెలిపించుకున్నట్టే. ఏ అర్ధరాత్రి కష్టం వచ్చినా, మీ కోసం నా తలుపులు తెరిచే ఉంటాయి. లావణ్యను సర్పంచ్ గా గెలిపిస్తే, ఇంటింటికి శుభ్రమైన తాగునీరు, వీధుల్లో సిమెంట్ రోడ్లు, డ్రైనేజీలు, అర్హులైన ప్రతి ఒక్కరికి పింఛన్లు, ప్రభుత్వ పథకాలు, ఎవరి కాళ్లూ పట్టుకునే అవసరం లేకుండా మీ ఇంటికే చేరేలా నేను దగ్గరుండి చూసుకుంటాను. దయచేసి ఈ ఎన్నికల్లో నా భార్య లావణ్యను భారీ మెజారిటీతో ఆశీర్వదించండి. మన ఊరిని కలిసి అభివృద్ధి చేసుకుందాం. ధన్యవాదాలు.`;

async function generateVoice() {
  console.log('🎙️ Cartesia AI ద్వారా సరికొత్త Voice ID తో ఆడియో జనరేషన్ ప్రారంభమైంది...');
  console.log('Voice ID:', VOICE_ID);

  const payload = {
    model_id: 'sonic-3.6',
    transcript: transcript,
    voice: {
      mode: 'id',
      id: VOICE_ID,
    },
    language: 'te',
    output_format: {
      container: 'mp3',
      sample_rate: 44100,
    },
  };

  try {
    const response = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'Cartesia-Version': '2026-08-14',
        'X-API-Key': CARTESIA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      // ఒకవేళ sonic-3.6 కాకపోతే sonic-multilingual తో ప్రయత్నం
      console.warn('⚠️ sonic-3.6 నోటీస్, sonic-multilingual తో తిరిగి ప్రయత్నిస్తున్నాము...');
      payload.model_id = 'sonic-multilingual';
      const retryRes = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'Cartesia-Version': '2026-08-14',
          'X-API-Key': CARTESIA_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!retryRes.ok) {
        throw new Error(`Cartesia API Error: ${retryRes.status} - ${await retryRes.text()}`);
      }

      const buffer = Buffer.from(await retryRes.arrayBuffer());
      fs.writeFileSync(OUTPUT_FILE, buffer);
    } else {
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(OUTPUT_FILE, buffer);
    }

    console.log('========================================================');
    console.log('✅ విజవంతంగా పూర్తయింది! కొత్త వాయిస్ ఆడియో ఫైల్ రెడీ:');
    console.log('📁 పాత్:', OUTPUT_FILE);
    console.log('========================================================');
  } catch (error) {
    console.error('❌ ఎర్రర్ సంభవించింది:', error.message);
  }
}

generateVoice();

