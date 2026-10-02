// Şifre analiz motoru: entropi hesabı + zayıf desen tespiti + kırılma süresi tahmini.
// Hiçbir ağ isteği yapmaz; şifre bu dosyadaki fonksiyonların dışına çıkmaz.

// Saldırganların bildiği "leetspeak" dönüşümleri: P@ssw0rd -> password
const LEET = { '@': 'a', '4': 'a', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '$': 's', '5': 's', '7': 't', '+': 't' };

// Klavye ve alfabe dizileri (ters yönleri de aşağıda eklenir)
const SEQUENCES = ['abcdefghijklmnopqrstuvwxyz', '01234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const ALL_SEQUENCES = SEQUENCES.concat(SEQUENCES.map(s => s.split('').reverse().join('')));

// Listedeki sırası -> şifre. Sıra, saldırganın o şifreyi kaçıncı denemede bulacağını gösterir.
const COMMON_RANK = new Map(COMMON_PASSWORDS.map((p, i) => [p, i + 1]));

// Saldırı senaryoları: saniyede kaç tahmin yapılabilir?
const ATTACK_SCENARIOS = [
  { name: 'Çevrimiçi saldırı', desc: 'Sitenin giriş sayfasına deneme yapılır (saniyede 10)', rate: 10 },
  { name: 'Çevrimdışı, yavaş hash', desc: 'Çalınan veritabanı bcrypt ile korunuyor (saniyede 10 bin)', rate: 1e4 },
  { name: 'Çevrimdışı, hızlı hash', desc: 'Çalınan veritabanı MD5 ile, güçlü GPU (saniyede 10 milyar)', rate: 1e10 },
];

const STRENGTH_LABELS = ['Çok zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok güçlü'];

const PATTERN_LABELS = {
  dictionary: 'Yaygın şifre / kelime',
  sequence: 'Klavye / alfabe dizisi',
  repeat: 'Tekrar',
  year: 'Yıl',
};

// 1. ADIM: Karakter havuzu, yani şifrede kullanılan karakter türlerine göre olası karakter sayısı
function charPool(pw) {
  const has = {
    lower: /[a-zçğıöşü]/.test(pw),
    upper: /[A-ZÇĞİÖŞÜ]/.test(pw),
    digit: /[0-9]/.test(pw),
    symbol: /[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/.test(pw),
  };
  let pool = 0;
  if (has.lower) pool += 26;
  if (has.upper) pool += 26;
  if (has.digit) pool += 10;
  if (has.symbol) pool += 33;
  return { pool, has };
}

// Her karakteri küçült ama uzunluğu koru (Türkçe "İ" gibi harfler 2 karaktere dönüşmesin)
function toLowerChars(pw) {
  return pw.split('').map(c => {
    if (c === 'İ') return 'i';
    const l = c.toLowerCase();
    return l.length === 1 ? l : c;
  });
}

// 2. ADIM: Formülün göremediği zayıf desenleri bul.
// Her desen için "saldırgan bu parçayı kaç bitlik denemede bulur?" sorusunu cevaplarız.
function findPatterns(pw) {
  const n = pw.length;
  const lower = toLowerChars(pw);
  const leet = lower.map(c => LEET[c] || c);
  const lowerStr = lower.join('');
  const found = [];

  // a) Sözlük: yaygın şifre listesindeki kelimeler (normal veya leetspeak hâliyle)
  for (let i = 0; i < n; i++) {
    for (let j = n; j > i; j--) {
      const isWhole = i === 0 && j === n;
      if (j - i < 4 && !isWhole) continue; // çok kısa parçalar tesadüfen eşleşmesin
      const plain = lower.slice(i, j).join('');
      const normalized = leet.slice(i, j).join('');
      const rank = COMMON_RANK.get(plain) || COMMON_RANK.get(normalized);
      if (!rank) continue;
      const token = pw.slice(i, j);
      const usedLeet = !COMMON_RANK.has(plain);
      const usedUpper = token !== plain;
      // Bit değeri: listedeki sırası + leetspeak ve büyük harf için saldırganın ekstra birkaç denemesi
      const bits = Math.log2(rank + 1) + (usedLeet ? 1 : 0) + (usedUpper ? 1 : 0);
      found.push({ type: 'dictionary', start: i, end: j, bits, leet: usedLeet });
      break; // bu başlangıç için en uzun eşleşme yeterli
    }
  }

  // b) Diziler: abc, 123, qwerty, 987...
  const isSequence = s => ALL_SEQUENCES.some(seq => seq.includes(s));
  for (let i = 0; i < n;) {
    let j = i + 1;
    while (j < n && isSequence(lowerStr.slice(i, j + 1))) j++;
    if (j - i >= 3) {
      // saldırgan için: hangi karakterden başladığı + yön + uzunluk
      found.push({ type: 'sequence', start: i, end: j, bits: Math.log2(26 * 2) + Math.log2(j - i) });
      i = j;
    } else {
      i++;
    }
  }

  // c) Tekrarlar: aaaa, abcabc, 1212...
  const perChar = Math.log2(charPool(pw).pool);
  const repeatRe = /(.+?)\1+/g;
  let m;
  while ((m = repeatRe.exec(lowerStr)) !== null) {
    if (m[0].length < 3) continue;
    const count = m[0].length / m[1].length;
    found.push({ type: 'repeat', start: m.index, end: m.index + m[0].length, bits: m[1].length * perChar + Math.log2(count) });
  }

  // d) Yıllar: 1990, 2024... (doğum yılı en sık tahmin edilen şeylerden)
  const yearRe = /(19|20)\d\d/g;
  while ((m = yearRe.exec(pw)) !== null) {
    found.push({ type: 'year', start: m.index, end: m.index + 4, bits: Math.log2(130) });
  }

  return found;
}

// Çakışan desenlerden, entropiyi en çok düşürenleri seç (açgözlü yöntem)
function pickPatterns(found, n, perChar) {
  for (const p of found) p.saving = (p.end - p.start) * perChar - p.bits;
  found.sort((a, b) => b.saving - a.saving);
  const used = new Array(n).fill(false);
  const chosen = [];
  for (const p of found) {
    if (p.saving <= 0) continue;
    let free = true;
    for (let k = p.start; k < p.end; k++) if (used[k]) { free = false; break; }
    if (!free) continue;
    for (let k = p.start; k < p.end; k++) used[k] = true;
    chosen.push(p);
  }
  chosen.sort((a, b) => a.start - b.start);
  return { chosen, uncovered: used.filter(u => !u).length };
}

// 3. ADIM: Süreyi okunabilir Türkçeye çevir
function formatDuration(seconds) {
  if (seconds < 1) return 'anında';
  const YEAR = 31536000;
  if (seconds >= YEAR * 1e9) return 'milyarlarca yıl';
  const units = [['yıl', YEAR], ['ay', 2592000], ['gün', 86400], ['saat', 3600], ['dakika', 60], ['saniye', 1]];
  for (const [name, sec] of units) {
    if (seconds >= sec) return Math.round(seconds / sec).toLocaleString('tr-TR') + ' ' + name;
  }
}

function formatBig(x) {
  if (x >= 1e15) return 'katrilyonlarca';
  return x < 1e6
    ? Math.round(x).toLocaleString('tr-TR')
    : new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(x);
}

function scoreFromBits(bits) {
  if (bits < 25) return 0;
  if (bits < 40) return 1;
  if (bits < 60) return 2;
  if (bits < 80) return 3;
  return 4;
}

// ANA FONKSİYON: tüm adımları birleştirir
function analyzePassword(pw) {
  const n = pw.length;
  const { pool, has } = charPool(pw);
  const perChar = Math.log2(pool);
  const naiveBits = n * perChar; // entropi = uzunluk × log2(havuz)

  const { chosen, uncovered } = pickPatterns(findPatterns(pw), n, perChar);
  const realBits = Math.min(naiveBits, chosen.reduce((sum, p) => sum + p.bits, 0) + uncovered * perChar);

  // Ortalama durumda saldırgan, olasılıkların yarısını denedikten sonra doğru şifreyi bulur
  const guesses = Math.max(1, Math.pow(2, realBits) / 2);
  const crackTimes = ATTACK_SCENARIOS.map(s => ({ ...s, time: formatDuration(guesses / s.rate) }));

  const score = scoreFromBits(realBits);
  const types = new Set(chosen.map(p => p.type));

  const checks = [
    { ok: n >= 12, text: 'En az 12 karakter' },
    { ok: has.lower, text: 'Küçük harf' },
    { ok: has.upper, text: 'Büyük harf' },
    { ok: has.digit, text: 'Rakam' },
    { ok: has.symbol, text: 'Sembol (!@#$...)' },
    { ok: !types.has('dictionary'), text: 'Yaygın şifre veya kelime içermiyor' },
    { ok: !types.has('sequence'), text: 'Klavye/alfabe dizisi içermiyor' },
    { ok: !types.has('repeat'), text: 'Tekrar içermiyor' },
    { ok: !types.has('year'), text: 'Yıl içermiyor' },
  ];

  const tips = [];
  if (n < 12) tips.push('Şifreni en az 12 karaktere uzat. Her yeni karakter, kırılma süresini havuz boyutu kadar katlar.');
  const missing = [has.upper ? null : 'büyük harf', has.digit ? null : 'rakam', has.symbol ? null : 'sembol'].filter(Boolean);
  if (missing.length) tips.push(`Havuzu büyütmek için ${missing.join(', ')} ekle.`);
  if (types.has('dictionary')) tips.push('Yaygın şifreler ve kelimeler saldırganların listesinde ilk sıradadır. Onları kullanma.');
  if (chosen.some(p => p.leet)) tips.push('"@ yerine a", "0 yerine o" gibi değişiklikler saldırganları kandırmaz, çünkü bu dönüşümleri de denerler.');
  if (types.has('sequence')) tips.push('"qwerty", "1234", "abcd" gibi diziler ilk denenenler arasındadır.');
  if (types.has('repeat')) tips.push('Tekrarlanan karakterler ("aaaa", "abcabc") şifreye neredeyse hiç güç katmaz.');
  if (types.has('year')) tips.push('Doğum yılı gibi tarihler kolay tahmin edilir.');
  if (score < 3) tips.push('Birbiriyle ilgisiz 4-5 kelimeden uzun bir cümle dene, ör. "mavi-kedi-bahçede-uyur". Hatırlaması kolay, kırması zor.');
  if (score >= 3) tips.push('Güzel! Bu şifreyi başka hiçbir yerde kullanma ve bir şifre yöneticisinde sakla.');

  return {
    length: n,
    pool,
    naiveBits,
    bits: realBits,
    score,
    label: STRENGTH_LABELS[score],
    patterns: chosen.map(p => ({ ...p, label: PATTERN_LABELS[p.type], token: pw.slice(p.start, p.end) })),
    crackTimes,
    checks,
    tips,
  };
}
