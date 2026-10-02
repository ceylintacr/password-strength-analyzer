// En yaygın kullanılan (ve sızıntılarda en sık görülen) şifreler.
// Sıra önemli: listede ne kadar üstteyse saldırgan onu o kadar erken dener.
// Gerçek saldırganlar milyonlarca satırlık listeler kullanır (ör. "rockyou.txt");
// bu liste eğitim amaçlı küçük bir örnektir.
const COMMON_PASSWORDS = [
  '123456', 'password', '123456789', '12345678', '12345', 'qwerty', '1234567',
  '111111', '1234567890', '123123', 'abc123', '1234', 'password1', 'iloveyou',
  '000000', 'qwerty123', '1q2w3e4r', 'admin', 'qwertyuiop', '654321', '555555',
  'lovely', '7777777', 'welcome', '888888', 'princess', 'dragon', '123qwe',
  'sunshine', '666666', 'football', 'monkey', 'master', 'letmein', 'login',
  'starwars', 'shadow', 'superman', 'batman', 'trustno1', 'hello', 'freedom',
  'whatever', 'passw0rd', 'baseball', 'michael', 'charlie', 'jennifer', 'jordan',
  'hunter', 'ashley', 'daniel', 'thomas', 'jessica', 'pepper', 'killer',
  'secret', 'computer', 'internet', 'soccer', 'hockey', 'ranger', 'buster',
  'summer', 'winter', 'spring', 'autumn', 'flower', 'cookie', 'cheese', 'banana',
  'orange', 'purple', 'silver', 'golden', 'yellow', 'maggie', 'ginger', 'tigger',
  'matrix', 'mustang', 'harley', 'corvette', 'mercedes', 'ferrari', 'pokemon',
  'naruto', 'minecraft', 'fortnite', 'roblox', 'google', 'facebook', 'instagram',
  'youtube', 'samsung', 'apple', 'nokia', 'love', 'angel', 'baby', 'test',
  'guest', 'root', 'user', 'changeme', 'default', 'access', 'mypass', 'pass',
  'qazwsx', 'zaq12wsx', 'asdfgh', 'zxcvbnm', 'aaaaaa', 'abcdef', 'abcd1234',
  // Türkçe yaygın şifreler ve kelimeler
  'sifre', 'parola', 'sifre123', 'parola123', 'sifrem', 'galatasaray', 'fenerbahce',
  'besiktas', 'trabzonspor', 'cimbom', 'turkiye', 'istanbul', 'ankara', 'izmir',
  'bursa', 'antalya', 'askim', 'sevgilim', 'canim', 'hayatim', 'bebegim', 'kalbim',
  'annem', 'babam', 'kardesim', 'allah', 'yasemin', 'mehmet', 'ahmet', 'mustafa',
  'ayse', 'fatma', 'zeynep', 'elif', 'emre', 'burak', 'murat', 'kedi', 'kopek',
  'merhaba', 'selam', 'gunes', 'deniz', 'yildiz', 'ataturk', 'bilgisayar',
  'okul', 'ogrenci', 'ogretmen', 'futbol', 'oyun', 'kral', 'kralice', 'aslan',
];
