// ── Two-step NLP Crisis Detection Pipeline ──
// Step 1: Language detection → Translate → Normalize → Keyword screening
// Step 2: Intent pattern matching → Severity scoring

// ── Filipino/Tagalog crisis terms → English equivalents ──
const FILIPINO_MAP = {
  'pumatay sa sarili': 'kill myself',
  'pakamatay': 'suicide',
  'mamamatay na ako': 'i am going to die',
  'gusto kong mamatay': 'i want to die',
  'ayaw ko na ng buhay': 'i dont want to live anymore',
  'ayoko na mabuhay' : 'i dont want to live anymore',
  'masakit ang buhay': 'life is painful',
  'sakit ng loob': 'emotional pain',
  'nalulungkot': 'feeling sad',
  'nadidepress': 'feeling depressed',
  'walang pag-asa': 'no hope',
  'wala nang saysay': 'nothing matters anymore',
  'gusto ko ng tulong': 'i need help',
  'tulungan niyo ako': 'help me please',
  'huwag niyo akong iwan': 'dont leave me',
  'nasaktan ko ang sarili ko': 'i hurt myself',
  'sinaktan ko ang sarili ko': 'i hurt myself',
  'tinusok ko ang sarili ko': 'i stabbed myself',
  'bumili ng gamot': 'bought medicine',
  'nainom na ako': 'i already took medicine',
  'lason': 'poison',
  'tali sa leeg': 'rope on neck',
  'tumalon': 'jumped off',
  'bigti' : 'hang myself',
  'hindi na kaya': 'cant take it anymore',
  'pagod na ako sa buhay': 'tired of living',
  'ayoko na': 'i dont want this anymore',
  'mabuti pang mawala': 'better to disappear',
  'sana mamatay na lang ako': 'i wish i would just die',
  'wala na akong pakialam': 'i dont care anymore',
  'sasaktan ko ang sarili ko': 'i will hurt myself',
  'tatapusin ko na': 'i will end it',
  'end na natin to': 'end this now',
  'self harm': 'self harm',
  'cutting': 'cutting myself',
  'pinaparusahan ko ang sarili ko': 'i punish myself',
  'sana mamatay na ako' : 'i wish i would die',
  'laslas' : 'cutting myself',
  'tapusin sarili ko' : 'end my life',
};

// ── Crisis keyword dictionary with severity weights ──
// weight: 1-10 (10 = most severe)
const CRISIS_DICT = [
  // Direct suicidal ideation (weight: 9-10)
  { phrase: 'kill myself', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'end my life', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'want to die', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'going to die', weight: 9, category: 'suicidal_ideation' },
  { phrase: 'wish i was dead', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'better off dead', weight: 9, category: 'suicidal_ideation' },
  { phrase: 'not worth living', weight: 9, category: 'suicidal_ideation' },
  { phrase: 'no reason to live', weight: 9, category: 'suicidal_ideation' },
  { phrase: 'end it all', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'i will end it', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'end this life', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'disappear forever', weight: 8, category: 'suicidal_ideation' },
  { phrase: 'suicide', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'commit suicide', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'hang myself', weight: 10, category: 'suicidal_ideation' },

  // Self-harm (weight: 7-9)
  { phrase: 'hurt myself', weight: 9, category: 'self_harm' },
  { phrase: 'self harm', weight: 8, category: 'self_harm' },
  { phrase: 'self-harm', weight: 8, category: 'self_harm' },
  { phrase: 'cutting myself', weight: 8, category: 'self_harm' },
  { phrase: 'cut my wrists', weight: 9, category: 'self_harm' },
  { phrase: 'scratch myself', weight: 7, category: 'self_harm' },
  { phrase: 'punish myself', weight: 7, category: 'self_harm' },
  { phrase: 'bleeding myself', weight: 8, category: 'self_harm' },

  // Means/method (weight: 8-10)
  { phrase: 'jump off', weight: 9, category: 'means' },
  { phrase: 'jumped off', weight: 10, category: 'means' },
  { phrase: 'poison', weight: 8, category: 'means' },
  { phrase: 'overdose', weight: 9, category: 'means' },
  { phrase: 'rope', weight: 7, category: 'means' },
  { phrase: 'noose', weight: 9, category: 'means' },
  { phrase: 'weapon', weight: 7, category: 'means' },
  { phrase: 'blade', weight: 7, category: 'means' },

  // Emotional distress (weight: 4-6)
  { phrase: 'no hope', weight: 6, category: 'distress' },
  { phrase: 'hopeless', weight: 5, category: 'distress' },
  { phrase: 'nothing matters', weight: 5, category: 'distress' },
  { phrase: 'cant take it', weight: 5, category: 'distress' },
  { phrase: 'cannot go on', weight: 6, category: 'distress' },
  { phrase: 'cant go on', weight: 6, category: 'distress' },
  { phrase: 'tired of living', weight: 6, category: 'distress' },
  { phrase: 'pain is too much', weight: 6, category: 'distress' },
  { phrase: 'suffering', weight: 4, category: 'distress' },
  { phrase: 'worthless', weight: 4, category: 'distress' },
  { phrase: 'burden', weight: 4, category: 'distress' },
  { phrase: 'nobody cares', weight: 5, category: 'distress' },
  { phrase: 'all alone', weight: 4, category: 'distress' },

  // Urgency/crisis (weight: 7-9)
  { phrase: 'help me', weight: 7, category: 'crisis' },
  { phrase: 'help me please', weight: 8, category: 'crisis' },
  { phrase: 'emergency', weight: 7, category: 'crisis' },
  { phrase: 'crisis', weight: 7, category: 'crisis' },
  { phrase: 'not safe', weight: 8, category: 'crisis' },
  { phrase: 'in danger', weight: 8, category: 'crisis' },
  { phrase: 'about to', weight: 5, category: 'crisis' },
  { phrase: 'do it tonight', weight: 9, category: 'crisis' },
  { phrase: 'do it now', weight: 9, category: 'crisis' },
  { phrase: 'final goodbye', weight: 9, category: 'crisis' },
  { phrase: 'last message', weight: 7, category: 'crisis' },
  { phrase: 'saying goodbye', weight: 8, category: 'crisis' },
];

// ── Intent pattern regex ──
const INTENT_PATTERNS = [
  { regex: /\b(?:i(?:'m| am| will| would| want to| plan to| am going to))\s+(?:kill|end|hurt|slice|cut|stab|jump|hang|poison|overdose|drown)\b/i, weight: 9, category: 'intent_direct' },
  { regex: /\b(?:want|wish|hope)\s+(?:to\s+)?(?:die|disappear|not exist|be dead|be gone)\b/i, weight: 9, category: 'intent_direct' },
  { regex: /\b(?:gonna|going to)\s+(?:end|kill|hurt|cut)\b/i, weight: 9, category: 'intent_direct' },
  { regex: /\b(?:ready to)\s+(?:die|end|leave)\b/i, weight: 8, category: 'intent_direct' },
  { regex: /\b(?:can'?t|cannot|can not)\s+(?:take|handle|deal with|bear)\s+(?:this|it|anymore|the pain)\b/i, weight: 6, category: 'intent_distress' },
  { regex: /\b(?:tired|sick|exhausted)\s+of\s+(?:living|life|everything|this)\b/i, weight: 7, category: 'intent_distress' },
  { regex: /\b(?:nobody|no one)\s+(?:cares|loves|wants|needs)\s+(?:about\s+)?me\b/i, weight: 6, category: 'intent_distress' },
  { regex: /\b(?:i(?:'m| am))\s+(?:a\s+)?(?:burden|worthless|useless|nothing)\b/i, weight: 5, category: 'intent_distress' },
  { regex: /\b(?:goodbye|bye|farewell|see you never)\b/i, weight: 4, category: 'intent_indirect' },
  { regex: /\b(?:sorry for|apologize for|forgive me for)\s+(?:everything|being a burden|all of this)\b/i, weight: 7, category: 'intent_indirect' },
];

// ── Text normalization ──
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/(?:i'm|i am|i've|i have|i'll|i will|i'd|i would)/g, (m) => {
      const map = { "i'm": 'i am', "i've": 'i have', "i'll": 'i will', "i'd": 'i would' };
      return map[m] || m;
    })
    .replace(/(?:can't|cannot|won't|don't|doesn't|didn't|wasn't|weren't|isn't|aren't)/g, (m) => {
      const map = { "can't": 'cannot', "won't": 'will not', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "wasn't": 'was not', "weren't": 'were not', "isn't": 'is not', "aren't": 'are not' };
      return map[m] || m;
    })
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Language detection (simple heuristic) ──
const TAGALOG_MARKERS = /\b(?:ako|ikaw|siya|kami|kayo|sila|ito|iyan|iyan|ang|ng|sa|na|pa|ba|po|ho|opo|kung|dahil|pero|at|o|mga|ni|ko|mo|niya|namin|ninyo|nila|ko|mo|niya|para|kasi|kaya|dahil|habang|pag|kapag|bago|pagkatapos|malapit|malayo|malaki|maliit|bagong|luma|mabuti|masama|maganda|mahirap|madali|mabilis|mabagal|masaya|malungkot|galit|takot|pagod|gutom|uhaw|lamig|init|sakit|ganda|pangit|tao|bata|matanda|lalaki|babae|asawa|anak|magulang|kapatid|kaibigan|kapitbahay|guro|doktor|nurse|pulis| sundalo|gobyerno|paaralan|ospital|bahay|simbahan|palengke|tindahan|opisina|pabrika|bukid|dagat|bundok|ilog|lawa|lupa|langit|araw|buwan|bituin|ulap|ulan|hangin|apoy|tubig|lupa|ginto|pilak|bakal|kahoy|bato|lupa|damo|punso|halaman|hayop|pagong|manok|baboy|baka|karne|isda|bigas|kanin|tinapay|gatas|kape|tsaa|tubig|juice|soda|beer|wine|bago|luma|bago|bata|matanda|bago|malaki|maliit|bago|mabuti|masama|bago|maganda|mahirap|bago|madali|mabilis|bago|mabagal|bago|masaya|malungkot|bago|galit|takot|bago|pagod|gutom|bago|uhaw|lamig|init|bago|sakit|ganda|pangit|bago)\b/i;

function detectLanguage(text) {
  const lower = text.toLowerCase();
  const tagalogMatches = (lower.match(TAGALOG_MARKERS) || []).length;
  const words = lower.split(/\s+/).filter(Boolean);
  const ratio = words.length > 0 ? tagalogMatches / words.length : 0;
  return ratio > 0.15 || tagalogMatches >= 2 ? 'filipino' : 'english';
}

// ── Filipino → English translation ──
function translateToEnglish(text) {
  const lower = text.toLowerCase();
  let result = lower;
  for (const [filipino, english] of Object.entries(FILIPINO_MAP)) {
    if (result.includes(filipino)) {
      result = result.replace(new RegExp(filipino, 'gi'), english);
    }
  }
  return result;
}

// ── Severity scoring ──
function calculateSeverity(score) {
  if (score >= 80) return { level: 'critical', label: 'Critical', color: 'red' };
  if (score >= 60) return { level: 'high', label: 'High', color: 'red' };
  if (score >= 40) return { level: 'medium', label: 'Medium', color: 'amber' };
  if (score >= 20) return { level: 'low', label: 'Low', color: 'yellow' };
  return { level: 'none', label: 'None', color: 'green' };
}

// ── Main detection pipeline ──
export function analyzeCrisis(text) {
  if (!text || typeof text !== 'string') {
    return { isCrisis: false, severity: calculateSeverity(0), score: 0, matches: [], language: 'english' };
  }

  // Step 1: Detect language
  const language = detectLanguage(text);

  // Step 2: Translate if Filipino
  const englishText = language === 'filipino' ? translateToEnglish(text) : text.toLowerCase();

  // Step 3: Normalize
  const normalized = normalize(englishText);

  const matches = [];
  let totalScore = 0;

  // Step 4: Keyword/phrase screening (fast pass)
  for (const entry of CRISIS_DICT) {
    if (normalized.includes(entry.phrase)) {
      matches.push({ type: 'keyword', phrase: entry.phrase, weight: entry.weight, category: entry.category });
      totalScore += entry.weight;
    }
  }

  // Step 5: Intent pattern matching
  for (const pattern of INTENT_PATTERNS) {
    if (pattern.regex.test(englishText) || pattern.regex.test(normalized)) {
      matches.push({ type: 'pattern', phrase: pattern.regex.source.slice(0, 40), weight: pattern.weight, category: pattern.category });
      totalScore += pattern.weight;
    }
  }

  // Step 6: Context modifiers
  const hasNegation = /\b(?:never|no|not|don'?t|doesn'?t|didn'?t|won'?t|can'?t|cannot|never)\b/.test(normalized);
  const hasIntensifier = /\b(?:really|very|extremely|absolutely|totally|completely|always|never)\b/.test(normalized);
  const hasTemporal = /\b(?:now|tonight|today|right now|immediately|soon|this week)\b/.test(normalized);

  if (hasIntensifier) totalScore = Math.min(100, totalScore * 1.15);
  if (hasTemporal) totalScore = Math.min(100, totalScore * 1.2);
  if (hasNegation && totalScore > 0) totalScore = Math.min(100, totalScore * 0.85);

  // Cap at 100
  totalScore = Math.min(100, Math.round(totalScore));

  // Deduplicate matches
  const seen = new Set();
  const uniqueMatches = matches.filter((m) => {
    const key = `${m.type}:${m.phrase}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    isCrisis: totalScore >= 10,
    severity: calculateSeverity(totalScore),
    score: totalScore,
    matches: uniqueMatches,
    language,
    normalizedText: normalized,
  };
}
