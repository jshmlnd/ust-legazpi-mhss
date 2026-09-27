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
  'gusto ko mag bigti' : 'i want to hang myself',
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
  'ayaw ko pa mamatay' : 'i dont want to die',
  'ayaw ko nang mamatay' : 'i dont want to die',
  'hindi ako magpapakamatay' : 'i will not kill myself',
  'hindi ako sasaktan' : 'i will not hurt myself',
  // ── spelling/connector variants (longest-first matching handles overlaps) ──
  'ayoko na ng buhay': 'i dont want to live anymore',
  'ayoko nang mabuhay': 'i dont want to live anymore',
  'ayaw ko nang mabuhay': 'i dont want to live anymore',
  'ayaw ko ng buhay': 'i dont want to live anymore',
  'gusto ko nang mamatay': 'i want to die',
  'gusto ko ng mamatay': 'i want to die',
  'gusto kong magbigti': 'i want to hang myself',
  'gusto kong mag bigti': 'i want to hang myself',
  'gusto kong magpakamatay': 'i want to kill myself',
  'gusto kong patayin ang sarili ko': 'i want to kill myself',
  'patayin ko ang sarili ko': 'kill myself',
  'magsasaktan ako ng sarili ko': 'i will hurt myself',
  'sasaktan ko ang sarili ko na': 'i will hurt myself',
  'sasaktan ko sarili ko': 'i will hurt myself',
  'pinuputol ko ang buhay ko': 'cutting myself',
  'laslas pulso': 'cut my wrists',
  'laslasin ko ang sarili ko': 'cut my wrists',
  'naglaslas ako': 'cutting myself',
  'nagbigti ako': 'hanged myself',
  'magbigti': 'hang myself',
  'bigtin ko ang sarili ko': 'hang myself',
  'tumalon sa tulay': 'jumped off a bridge',
  'tumalon sa gusali': 'jumped off a building',
  'tumalon sa bubong': 'jumped off a roof',
  'naglason ako': 'i poisoned myself',
  'inom ng lason': 'drank poison',
  'lumunok ng lason': 'swallowed poison',
  'nagoverdose ako': 'i overdosed',
  'sobrang gamot': 'overdose',
  'gumamit ng baril': 'used a weapon',
  'kutsilyo': 'weapon',
  'panghiwa': 'blade',
  'tali': 'rope',
  'bigla na lang akong mawawala': 'i will disappear forever',
  'mawawala na ako': 'i will disappear forever',
  'paalam na': 'final goodbye',
  'paalam': 'saying goodbye',
  'ito na ang huling mensahe ko': 'last message',
  'huling mensahe': 'last message',
  'tulungan ninyo ako': 'help me please',
  'tulungan mo ako': 'help me please',
  'kailangan ko ng tulong': 'i need help',
  'tulong': 'help me',
  'wala nang pag-asa': 'no hope',
  'walang pag asa': 'no hope',
  'sana wala na lang ako': 'wish i was dead',
  'mabuti pa mamatay na lang ako': 'better off dead',
  'mas mabuti pang mamatay': 'better off dead',
  'wala nang dahilan para mabuhay': 'no reason to live',
  'pagod na pagod na ako sa buhay': 'tired of living',
  'sawang sawa na ako sa buhay': 'tired of living',
  'sawa na ako sa buhay': 'tired of living',
  'hindi ko na kaya': 'cant take it anymore',
  'di ko na kaya': 'cant take it anymore',  'hindi ko na kering': 'cant take it anymore',
  'hindi ko na keri': 'cant take it anymore',
  'sakit na ng buhay ko': 'pain is too much',
  'ang sakit sakit na': 'pain is too much',
  'wala akong kwenta': 'worthless',
  'walang kwenta ako': 'worthless',
  'pabigat lang ako': 'i am a burden',
  'pabigat ako': 'i am a burden',
  'bigat ko': 'i am a burden',
  'walang nagmamahal sa akin': 'nobody cares about me',
  'walang nagmamahal sakin': 'nobody cares about me',
  'wala akong kaibigan': 'all alone',
  'mag isa lang ako': 'all alone',
  'nagiisa lang ako': 'all alone',
  'papatayin ko ang sarili ko': 'kill myself',
  'papakamatay ako': 'kill myself',
  'magpapakamatay na ako': 'kill myself',
  'magpapakamatay ako': 'kill myself',
};

// ── Crisis keyword dictionary with severity weights ──
// weight: 1-10 (10 = most severe)
const CRISIS_DICT = [
  // Direct suicidal ideation (weight: 9-10)
  { phrase: 'kill myself', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'end my life', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'want to die', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'dont want to live anymore', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'going to die', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'wish i was dead', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'better off dead', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'not worth living', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'no reason to live', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'end it all', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'i will end it', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'end this life', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'disappear forever', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'suicide', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'commit suicide', weight: 10, category: 'suicidal_ideation' },
  { phrase: 'i want to hang myself', weight: 10, category: 'suicidal_ideation' },

  // Self-harm (weight: 7-9)
  { phrase: 'hurt myself', weight: 10, category: 'self_harm' },
  { phrase: 'self harm', weight: 8, category: 'self_harm' },
  { phrase: 'self-harm', weight: 8, category: 'self_harm' },
  { phrase: 'cutting myself', weight: 10, category: 'self_harm' },
  { phrase: 'cut my wrists', weight: 10, category: 'self_harm' },
  { phrase: 'scratch myself', weight: 7, category: 'self_harm' },
  { phrase: 'punish myself', weight: 7, category: 'self_harm' },
  { phrase: 'bleeding myself', weight: 10, category: 'self_harm' },
  { phrase: 'hang myself', weight: 10, category: 'self_harm' },

  // Means/method (weight: 8-10)
  { phrase: 'jump off', weight: 9, category: 'means' },
  { phrase: 'jumped off', weight: 10, category: 'means' },
  { phrase: 'poison', weight: 8, category: 'means' },
  { phrase: 'overdose', weight: 9, category: 'means' },
  { phrase: 'poisoned myself', weight: 10, category: 'means' },
  { phrase: 'overdosed', weight: 10, category: 'means' },
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
  { regex: /\b(?:goodbye|bye|farewell|see you never|paalam)\b/i, weight: 4, category: 'intent_indirect' },
  { regex: /\b(?:sorry for|apologize for|forgive me for)\s+(?:everything|being a burden|all of this)\b/i, weight: 7, category: 'intent_indirect' },
];

// ── Text normalization ──
const CONTRACTIONS = {
  "i'm": 'i am', "i've": 'i have', "i'll": 'i will', "i'd": 'i would',
  "can't": 'cannot', "won't": 'will not', "don't": 'do not', "doesn't": 'does not',
  "didn't": 'did not', "wasn't": 'was not', "weren't": 'were not', "isn't": 'is not', "aren't": 'are not',
};

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/\w+'\w+/g, (m) => CONTRACTIONS[m] || m)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Language detection (simple heuristic) ──
// NOTE: the /g flag matters — without it, String.match reports only the first
// hit, so a short mixed message with several Tagalog markers would count as 1
// match and fall below the Filipino threshold.
const TAGALOG_MARKERS = /\b(?:ako|ikaw|siya|kami|kayo|sila|ito|iyan|ang|ng|sa|na|pa|ba|po|ho|opo|kung|dahil|pero|at|o|mga|ni|ko|mo|niya|namin|ninyo|nila|para|kasi|kaya|habang|pag|kapag|bago|pagkatapos|malapit|malayo|malaki|maliit|bagong|luma|mabuti|masama|maganda|mahirap|madali|mabilis|mabagal|masaya|malungkot|galit|takot|pagod|gutom|uhaw|lamig|init|sakit|ganda|pangit|tao|bata|matanda|lalaki|babae|asawa|anak|magulang|kapatid|kaibigan|kapitbahay|guro|doktor|nurse|pulis|sundalo|gobyerno|paaralan|ospital|bahay|simbahan|palengke|tindahan|opisina|pabrika|bukid|dagat|bundok|ilog|lawa|lupa|langit|araw|buwan|bituin|ulap|ulan|hangin|apoy|tubig|ginto|pilak|bakal|kahoy|bato|damo|punso|halaman|hayop|pagong|manok|baboy|baka|karne|isda|bigas|kanin|tinapay|gatas|kape|tsaa|juice|soda|beer|wine|bigti|ayaw|ayoko|hindi|huwag|wag|naman|din|rin|lang|nang|kong|kita|bakit|ganito|ganyan|gaano|doon|dito|ngayon|bukas|kahapon|talaga|ulit|sobra|totoo)\b/gi;

export function detectLanguage(text) {
  const lower = text.toLowerCase();
  const tagalogMatches = (lower.match(TAGALOG_MARKERS) || []).length;
  const words = lower.split(/\s+/).filter(Boolean);
  const ratio = words.length > 0 ? tagalogMatches / words.length : 0;
  return ratio > 0.15 || tagalogMatches >= 2 ? 'filipino' : 'english';
}

// ── Filipino → English translation ──
// Phrases must be replaced longest-first: 'ayoko na mabuhay' contains
// 'ayoko na', and replacing the short entry first would destroy the longer
// one and yield a wrong translation. Escaped + \b so special chars and
// substring hits inside other words don't match.
const SORTED_FILIPINO_PHRASES = Object.entries(FILIPINO_MAP)
  .sort((a, b) => b[0].length - a[0].length)
  .map(([filipino, english]) => ({
    regex: new RegExp(`\\b${filipino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'),
    english,
  }));

export function translateToEnglish(text) {
  let result = text.toLowerCase();
  for (const { regex, english } of SORTED_FILIPINO_PHRASES) {
    if (regex.test(result)) {
      result = result.replace(regex, english);
    }
  }
  return result;
}

// ── Severity scoring ──
function calculateSeverity(score) {
  if (score >= 80) return { level: 'critical', label: 'Critical', color: 'red' };
  if (score >= 60) return { level: 'high', label: 'High', color: 'red' };
  if (score >= 40) return { level: 'medium', label: 'Medium', color: 'amber' };
  // ponytail: >=10 matches the isCrisis gate so a flagged message always has
  // a real severity — the frontend renders 'Flagged · low' from this value;
  // returning 'none' for a flagged message would render a broken badge.
  if (score >= 10) return { level: 'low', label: 'Low', color: 'yellow' };
  return { level: 'none', label: 'None', color: 'green' };
}

// ── Proximity negation check ──
// Returns true if a negation word appears within the last 5 words before `position` in `text`
function isNegated(text, position) {
  const before = text.slice(Math.max(0, position - 60), position);
  const words = before.split(/\s+/).filter(Boolean);
  const lastWords = words.slice(-5);
  return lastWords.some(w => /^(?:not|no|never|don'?t|doesn'?t|didn'?t|won'?t|can'?t|cannot|dont|never|ayaw|ayoko|hindi|huwag|wag|di)$/i.test(w));
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
      const idx = normalized.indexOf(entry.phrase);
      if (!isNegated(normalized, idx)) {
        matches.push({ type: 'keyword', phrase: entry.phrase, weight: entry.weight, category: entry.category });
        totalScore += entry.weight;
      }
    }
  }

  // Step 5: Intent pattern matching
  for (const pattern of INTENT_PATTERNS) {
    const match = pattern.regex.exec(englishText) || pattern.regex.exec(normalized);
    if (match && !isNegated(match.input, match.index)) {
      matches.push({ type: 'pattern', phrase: pattern.regex.source.slice(0, 40), weight: pattern.weight, category: pattern.category });
      totalScore += pattern.weight;
    }
  }

  // Step 6: Context modifiers (intensifiers / temporal urgency only)
  const hasIntensifier = /\b(?:really|very|extremely|absolutely|totally|completely|always|never)\b/.test(normalized);
  const hasTemporal = /\b(?:now|tonight|today|right now|immediately|soon|this week)\b/.test(normalized);

  if (hasIntensifier) totalScore = Math.min(100, totalScore * 1.15);
  if (hasTemporal) totalScore = Math.min(100, totalScore * 1.2);

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
