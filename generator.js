// Güçlü şifre üretici.
// ÖNEMLİ: Math.random() kullanmıyoruz! Math.random tahmin edilebilir bir sayı üreticidir,
// güvenlik için uygun değildir. crypto.getRandomValues ise işletim sisteminin
// kriptografik olarak güvenli rastgelelik kaynağını kullanır.

const GEN_CHARSETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digit: '0123456789',
  symbol: '!@#$%^&*()-_=+[]{};:,.?/~',
};

// 0 ile max-1 arasında eşit olasılıklı rastgele sayı.
// "Rejection sampling": Doğrudan "% max" alırsak bazı sayılar diğerlerinden
// biraz daha sık çıkar (modulo yanlılığı). Bunu önlemek için sınırı aşan değerleri atıp tekrar çekeriz.
function secureRandomInt(max) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

function generatePassword(length) {
  const all = Object.values(GEN_CHARSETS).join('');
  // Her karakter türünden en az bir tane olana kadar yeniden üret
  while (true) {
    let pw = '';
    for (let i = 0; i < length; i++) pw += all[secureRandomInt(all.length)];
    const hasEvery = Object.values(GEN_CHARSETS).every(set => [...pw].some(c => set.includes(c)));
    if (hasEvery) return pw;
  }
}
