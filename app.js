// Arayüz: analiz sonuçlarını sayfaya yazar.
// GÜVENLİK NOTU: Kullanıcı girdisini sayfaya her zaman textContent ile yazıyoruz, asla innerHTML ile değil.
// Aksi hâlde şifre kutusuna yazılan <script> gibi bir metin sayfada çalışabilirdi (XSS açığı).

const $ = id => document.getElementById(id);
const input = $('password');
const toggle = $('toggle');

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

const isVisible = () => input.type === 'text';
const mask = s => '•'.repeat(s.length);

toggle.addEventListener('click', () => {
  input.type = isVisible() ? 'password' : 'text';
  toggle.textContent = isVisible() ? 'Gizle' : 'Göster';
  render();
});
input.addEventListener('input', render);

// Şifre üretici
const lengthSlider = $('gen-length');
lengthSlider.addEventListener('input', () => {
  $('gen-length-value').textContent = lengthSlider.value;
});

$('generate').addEventListener('click', () => {
  input.value = generatePassword(Number(lengthSlider.value));
  input.type = 'text'; // üretilen şifreyi görebilesin
  toggle.textContent = 'Gizle';
  render();
});

const copyBtn = $('copy');
copyBtn.addEventListener('click', async () => {
  if (!input.value) return;
  try {
    await navigator.clipboard.writeText(input.value);
    copyBtn.textContent = 'Kopyalandı!';
  } catch {
    copyBtn.textContent = 'Kopyalanamadı';
  }
  setTimeout(() => { copyBtn.textContent = 'Kopyala'; }, 1500);
});

function render() {
  const pw = input.value;
  const fill = $('bar-fill');
  const label = $('label');

  if (!pw) {
    $('results').hidden = true;
    fill.style.width = '0';
    label.textContent = 'Analiz için bir şifre yaz';
    delete label.dataset.score;
    $('bits').textContent = '';
    return;
  }

  const r = analyzePassword(pw);
  $('results').hidden = false;

  // Güç çubuğu
  fill.style.width = Math.max(6, Math.min(100, r.bits)) + '%';
  fill.dataset.score = r.score;
  label.textContent = r.label;
  label.dataset.score = r.score;
  $('bits').textContent = r.bits.toFixed(1) + ' bit';

  // Entropi
  $('pool').textContent = r.pool + ' karakter';
  $('naive').textContent = r.naiveBits.toFixed(1) + ' bit';
  $('real').textContent = r.bits.toFixed(1) + ' bit';
  const lost = r.naiveBits - r.bits;
  $('entropy-note').textContent = lost > 0.5
    ? `Desenler yüzünden şifren formülün söylediğinden ${lost.toFixed(1)} bit daha zayıf. Yani yaklaşık ${formatBig(Math.pow(2, lost))} kat daha kolay kırılır.`
    : 'Belirgin bir desen bulunamadı, formül entropisi geçerli.';

  // Kırılma süreleri
  const crack = $('crack');
  crack.replaceChildren(...r.crackTimes.map(c => {
    const li = el('li');
    const info = el('div');
    info.append(el('div', 'crack-name', c.name), el('div', 'crack-desc', c.desc));
    li.append(info, el('strong', 'crack-time', c.time));
    return li;
  }));

  // Desenler: şifreyi renkli parçalara böl (yalnızca şifre görünürken)
  const segments = $('segments');
  segments.replaceChildren();
  if (isVisible()) {
    let pos = 0;
    const addPlain = end => {
      if (end > pos) segments.append(el('span', 'seg seg-plain', pw.slice(pos, end)));
    };
    for (const p of r.patterns) {
      addPlain(p.start);
      const chip = el('span', 'seg seg-' + p.type, p.token);
      chip.title = p.label;
      segments.append(chip);
      pos = p.end;
    }
    addPlain(pw.length);
  }
  segments.hidden = !isVisible() || r.patterns.length === 0;

  const patterns = $('patterns');
  if (r.patterns.length === 0) {
    patterns.replaceChildren(el('li', 'empty', 'Zayıf desen bulunamadı.'));
  } else {
    patterns.replaceChildren(...r.patterns.map(p => {
      const li = el('li');
      li.append(
        el('span', 'dot dot-' + p.type),
        el('span', 'pat-label', p.label),
        el('code', null, isVisible() ? p.token : mask(p.token)),
        el('span', 'pat-bits', p.bits.toFixed(1) + ' bit'),
      );
      return li;
    }));
  }

  // Kontrol listesi ve öneriler
  $('checks').replaceChildren(...r.checks.map(c => el('li', c.ok ? 'ok' : 'fail', c.text)));
  $('tips').replaceChildren(...r.tips.map(t => el('li', null, t)));
}
