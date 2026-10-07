function getIndoDayOfWeek(dateStr?: string): number {
  if (!dateStr) return new Date().getDay();
  try {
    const parts = dateStr.split("-").map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    return d.getDay();
  } catch {
    return new Date().getDay();
  }
}

function getJakartaHour(): number {
  try {
    const jktTimeString = new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Jakarta",
      hour12: false,
    });
    return parseInt(jktTimeString.split(":")[0], 10) || 9;
  } catch {
    return new Date().getHours();
  }
}

const TEMPLATE_GENERATORS: ((name: string, url: string) => string)[] = [
  (name, url) =>
    `Selamat pagi *${name}*! \u2615\u{1F324}\uFE0F\nSambil menikmati kopi atau teh pagi sebelum tenggelam dalam kesibukan, yuk luangkan 5 detik untuk check-in kehadiranmu hari ini.\n\n\u{1F449} *Link Absen Mandiri:*\n${url}\n\n(Buka tautan ini saat sudah tiba di kantor Wisma NH ya).\nSemoga harimu lancar, pekerjaan dimudahkan, dan suasana hati selalu ceria! Salam semangat! \u{1F33B}\u2728`,
  (name, url) =>
    `\u26A1 *Checklist Pagi Karyawan NMSA*\nHalo rekan andalan, *${name}*! \u{1F4CB}\u2705\n\nTiga langkah mudah mengawali hari:\n1\uFE0F\u20E3 Tiba di kantor Wisma NH Pasar Minggu\n2\uFE0F\u20E3 Tap link presensi kilat ini:\n\u{1F449} ${url}\n3\uFE0F\u20E3 Siap raih target kerja terbaikmu hari ini!\n\nHak uang makanmu langsung terkunci otomatis di sistem keuangan. Mari melangkah dengan percaya diri! \u{1F680}\u{1F4BC}`,
  (name, url) =>
    `\u2728 *Bismillah, Semangat Pagi ${name}!* \u{1F932}\u{1F33F}\nAwali setiap ikhtiar hari ini dengan niat yang tulus dan hati yang lapang. Semoga Allah melancarkan pekerjaanmu, meluaskan rezeki yang halal lagi berkah, dan melindungi keselamatanmu saat bertugas.\n\nYuk amankan presensi harianmu melalui tautan resmi ini:\n\u{1F449} ${url}\n\nPastikan kamu sudah berada di lingkungan kantor Wisma NH agar GPS langsung mendeteksi kehadiranmu secara sah. Selamat beraktivitas penuh berkah! \u{1F31F}\u{1F91D}`,
  (name, url) =>
    `\u{1F525} *Bangkit & Raih Hasil Gemilang, ${name}!* \u{1F3C6}\u{1F48E}\nHari ini adalah lembaran baru untuk menorehkan prestasi dan memberikan kontribusi terbaik bagi kemajuan bersama. Disiplin hebat selalu diawali dari langkah pertama di pagi hari.\n\nKonfirmasikan kehadiranmu dengan satu sentuhan mantap:\n\u{1F449} ${url}\n\nTautan langsung mendeteksi lokasi kantor Wisma NH Pasar Minggu. Bekerjalah dengan bangga, jadikan hari ini penuh karya spektakuler! \u26A1\u{1F3E2}`,
  (name, url) =>
    `Halo *${name}*! \u{1F44B}\nPengingat kilat: Yuk langsung tap tautan absen mandiri hari ini agar uang makan harianmu tercatat rapi oleh admin:\n\n\u{1F449} ${url}\n\n(Cukup buka link saat sudah berada di area kantor Wisma NH ya).\nSelamat beraktivitas dan semoga harimu sangat produktif! \u{1F44D}\u{1F3AF}`,
  (name, url) =>
    `Halo rekan hebat, *${name}*! \u{1F91D}\u{1F31F}\nKontribusi dan kerja kerasmu adalah bagian berharga dari kemajuan PT Nusantara Mineral Sukses Abadi. Terima kasih atas dedikasi luar biasa yang selalu kamu tunjukkan!\n\nYuk pastikan presensi mandirimu hari ini sudah terkonfirmasi melalui tautan berikut:\n\u{1F449} ${url}\n\nSistem GPS otomatis memverifikasi kehadiranmu di Wisma NH Pasar Minggu. Mari terus maju dan sukses bersama! \u{1F3E2}\u2728`,
  (name, url) =>
    `\u{1F680} *Senin Semangat, Waktunya Mengawali Pekan dengan Gemilang!*\nSelamat pagi rekan tangguh, *${name}*! \u{1F305}\nLembaran pekan baru telah dibuka. Bawa energi positif, fokus tajam, dan semangat segar untuk mencapai target baru!\n\nAwali hari pertama pekan ini dengan presensi tepat waktu:\n\u{1F449} ${url}\n\nPastikan kamu sudah berada di area kantor Wisma NH Pasar Minggu ya. Semoga pekan ini membawa banyak keberhasilan untukmu! \u{1F4BC}\u{1F525}`,
  (name, url) =>
    `\u{1F54C} *Jumat Berkah Penuh Kebaikan, ${name}!* \u{1F338}\u{1F932}\nAlhamdulillah, kita sampai di penghujung hari kerja pekan ini. Semoga setiap lelah dan peluh perjuanganmu menjadi berkah berlipat ganda bagi keluarga.\n\nYuk selesaikan presensi penutup pekanmu di tautan berikut:\n\u{1F449} ${url}\n\nCukup satu klik di area kantor Wisma NH, hak uang makan langsung terdata lengkap. Selamat menuntaskan tugas dengan senyuman dan salam berkah! \u{1F33F}\u2764\uFE0F`,
  (name, url) =>
    `\u{1F324}\uFE0F *Selamat Hari Rabu, ${name}! Semangat Tengah Pekan!* \u26A1\u{1F3C3}\nSudah separuh jalan di pekan ini, ritme kerja makin mantap dan target makin dekat untuk diraih! Jaga stamina dan tetap terhidrasi ya.\n\nSebelum lanjut menuntaskan agenda penting, yuk amankan absen harianmu:\n\u{1F449} ${url}\n\nTautan aktif dan langsung tervalidasi di area Wisma NH Pasar Minggu. Mari jaga konsistensi dan performa terbaikmu! \u{1F3AF}\u{1F4AA}`,
  (name, url) =>
    `Halo *${name}*! Tahukah kamu? \u{1F914}\u{1F4A1}\nDengan sekali klik link presensi mandiri, kehadiranmu langsung masuk ke rekapitulasi uang makan otomatis tanpa perlu pencatatan manual.\n\nYuk langsung tap linknya sekarang:\n\u{1F449} ${url}\n\nOtomatis tervalidasi saat kamu sudah di area kantor Wisma NH Pasar Minggu. Praktis, cepat, dan aman. Selamat bertugas rekan andalan! \u2615\u{1F4F1}`,
  (name, url) =>
    `\u{1F3DB}\uFE0F *Pemberitahuan Presensi Harian \u2014 PT NMSA*\nYth. Rekan *${name}*,\n\nGuna memastikan kelancaran administrasi serta pencatatan hak tunjangan uang makan harian Anda, silakan melakukan presensi mandiri melalui tautan resmi berikut:\n\u{1F449} ${url}\n\nPresensi mandiri secara otomatis mendeteksi koordinat GPS aktif di lingkungan kantor Wisma NH Pasar Minggu.\n\nTerima kasih atas komitmen, integritas, dan dedikasi tinggi Anda bagi perusahaan. Selamat bertugas! \u{1F3E2}\u{1F454}`,
  (name, url) =>
    `\u{1F6E1}\uFE0F *Utamakan Keselamatan & Kesehatan Kerja, ${name}!* \u{1F9BA}\u{1FA7A}\nKeluarga tercinta menanti kepulanganmu di rumah dengan bangga. Selalu utamakan keselamatan dan jaga stamina dalam setiap tugas.\n\nSambil bersiap, yuk konfirmasi kehadiranmu hari ini:\n\u{1F449} ${url}\n\nSistem GPS mendeteksi area kantor Wisma NH Pasar Minggu. Semoga hari ini berjalan aman, lancar, dan penuh keberuntungan! \u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}\u{1F340}`,
  (name, url) =>
    `\u{1F338} *Hari yang Indah untuk Rekan Tersenyum, ${name}!* \u{1F308}\u{1F604}\nTersenyumlah, karena hari ini penuh dengan peluang dan kebaikan baru yang menanti untuk diwujudkan!\n\nSatu sentuhan kecil untuk mengawali jam kerja yang tertib dan menyenangkan:\n\u{1F449} ${url}\n\nBuka saat di kantor Wisma NH ya, uang makan harianmu langsung terekam otomatis. Semoga hari ini penuh kejutan manis dan berkah! \u{1F496}\u2728`,
  (name, url) =>
    `\u{1F525} *Semangat Membara untuk Pejuang Tangguh, ${name}!* \u{1F3D7}\uFE0F\u26A1\nTak ada tantangan yang terlalu besar jika dihadapi dengan tekad kuat dan kerja sama solid. Kamu adalah rekan kerja yang luar biasa!\n\nTunjukkan kedisiplinanmu pagi ini dengan sekali sentuh:\n\u{1F449} ${url}\n\nVerifikasi lokasi otomatis mendeteksi kantor Wisma NH Pasar Minggu. Mari buat hari ini sangat produktif dan memuaskan! \u{1F680}\u{1F48E}`,
  (name, url) =>
    `Burung gelatik terbang ke awan,\nPagi cerah penuh harapan! \u{1F426}\u{1F324}\uFE0F\n\nHalo rekan andalan kita *${name}*, yuk jangan sampai kelupaan absen harian:\n\u{1F449} ${url}\n\nCukup klik dari kantor Wisma NH Pasar Minggu, hak uang makan langsung aman terjaga. Selamat bekerja dengan riang gembira! \u{1F604}\u{1F91D}`,
  (name, url) =>
    `\u{1F324}\uFE0F *Selamat Menjelang Siang, ${name}!* \u2615\nSemoga seluruh agenda dan aktivitas pagi ini berjalan lancar tanpa kendala. Tetap terhidrasi dan jaga fokus ya!\n\nSistem mencatat presensi kehadiranmu hari ini belum terkonfirmasi nih. Yuk segera klik link ini:\n\u{1F449} ${url}\n\nSupaya hak tunjangan uang makan harianmu tetap aman tercatat rapi sebelum rekapitulasi harian ditutup (area kantor Wisma NH).\nSelamat melanjutkan tugas dan tetap bersemangat rekan tangguh! \u{1F6E1}\uFE0F\u2728`,
  (name, url) =>
    `\u{1F371} *Waktunya Rehat Siang, Rekan ${name}!* \u2600\uFE0F\u{1F957}\nWaktunya sejenak meregangkan otot dan menikmati istirahat makan siang agar stamina kembali prima!\n\nSambil santai, yuk pastikan presensi uang makan harianmu sudah beres hari ini melalui tautan berikut:\n\u{1F449} ${url}\n\nSangat cepat dan praktis, langsung terverifikasi oleh GPS kantor Wisma NH Pasar Minggu.\nSelamat menikmati rehat siang dan salam kompak selalu! \u{1F31F}\u{1F91D}`,
  (name, url) =>
    `\u23F0 *Presensi Tepat Waktu, Disiplin Maju!*\nSelamat pagi rekan *${name}*! \u{1F3AF}\nOrang sukses selalu menghargai waktu dan hal-hal mendasar. Mari awali jam kerja dengan presensi mandiri yang tertib:\n\n\u{1F449} ${url}\n\nLangsung diverifikasi via GPS Wisma NH Pasar Minggu.\nSemoga target-target kerjamu hari ini tercapai melampaui ekspektasi! \u{1F4C8}\u{1F3C6}`,
  (name, url) =>
    `Pagi sahabatku, *${name}*! \u{1F33B}\nSemoga pagi ini kamu dalam kondisi prima dan siap mengukir karya terbaik! Senyuman dan energi positifmu selalu menular ke seluruh tim.\n\nSebelum mulai fokus dengan rentetan pekerjaan, yuk amankan kehadiranmu dulu:\n\u{1F449} ${url}\n\nSatu tap saat tiba di Wisma NH, beres seketika!\nJaga kesehatan, utamakan keselamatan kerja, dan nikmati hari ini! \u2615\u2728`,
  (name, url) =>
    `\u{1F31F} *Langkah Nyata Menuju Sukses, ${name}!* \u{1F4BC}\nSetiap hari adalah investasi terbaik untuk masa depan karirmu. Tunjukkan komitmenmu dengan presensi harian yang konsisten:\n\n\u{1F449} ${url}\n\nTerverifikasi di area kantor Wisma NH Pasar Minggu.\nTerima kasih atas integritas dan dedikasimu bersama PT NMSA. Sukses selalu menyertaimu! \u{1F3DB}\uFE0F\u{1F48E}`,
  (name, url) =>
    `\u{1F33F} *Tenang, Fokus, & Tuntaskan Hari Ini, ${name}!* \u{1F343}\u2728\nTarik napas dalam, atur prioritas dengan bijak, dan selesaikan satu per satu tugas kerjamu dengan hasil memuaskan.\n\nLangkah pertamamu pagi ini:\n\u{1F449} ${url}\n\nKonfirmasi kehadiran fisik di Wisma NH Pasar Minggu untuk mencatat uang makan harianmu.\nSemoga harimu tenang, produktif, dan penuh berkah! \u2615`,
  (name, url) =>
    `\u{1F91D} *Bersama Kita Kuat, Hebat, dan Maju!*\nHalo rekan andalan, *${name}*! \u{1F3E2}\u{1F31F}\nKeberhasilan perusahaan ini terwujud berkat sinergi dari rekan-rekan terbaik seperti kamu.\n\nYuk konfirmasi kehadiranmu hari ini:\n\u{1F449} ${url}\n\nCukup buka tautan saat berada di kantor Wisma NH.\nSelamat bertugas, jaga kekompakan, dan mari torehkan hasil terbaik bersama! \u{1F680}\u2764\uFE0F`,
  (name, url) =>
    `\u26A1 *Sapaan Cepat untuk ${name}!* \u{1F4F1}\nHanya butuh 5 detik untuk mengamankan catatan kehadiran dan tunjangan uang makan harianmu:\n\n\u{1F449} ${url}\n\n(Buka saat sudah di area kantor Wisma NH Pasar Minggu).\nSemoga harimu menyenangkan dan bebas kendala! Tetap semangat pejuang hebat! \u2615\u{1F44D}`,
  (name, url) =>
    `\u{1F308} *Pagi Penuh Peluang & Rezeki Berlimpah, ${name}!* \u{1F48E}\u{1F932}\nYakinlah bahwa ikhtiar terbaik hari ini akan membuahkan hasil manis dan rezeki yang melimpah berkah.\n\nJangan lewatkan presensi harianmu ya:\n\u{1F449} ${url}\n\nSistem otomatis mendeteksi kehadiranmu di area kantor Wisma NH.\nSelamat berjuang rekan tangguh, sukses besar selalu menyertaimu hari ini! \u2600\uFE0F\u{1F525}`,
];

export function getDynamicReminderMessage(
  name: string,
  workerId?: string,
  url: string = "",
  dateStr?: string,
  customHour?: number
): string {
  const cleanName = (name || "Rekan Kerja").trim();
  const cleanWorkerId = (workerId || cleanName).trim();
  const todayYMD = dateStr || new Date().toISOString().split("T")[0];
  const hour = customHour !== undefined ? customHour : getJakartaHour();
  const dayOfWeek = getIndoDayOfWeek(todayYMD);
  const isMidMorning = hour >= 10 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 15;

  const seedStr = `${cleanWorkerId}_${cleanName}_${todayYMD}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  if (dayOfWeek === 1 && absHash % 3 === 0) {
    return TEMPLATE_GENERATORS[6](cleanName, url);
  }
  if (dayOfWeek === 5 && absHash % 3 === 0) {
    return TEMPLATE_GENERATORS[7](cleanName, url);
  }
  if (dayOfWeek === 3 && absHash % 4 === 0) {
    return TEMPLATE_GENERATORS[8](cleanName, url);
  }
  if (isMidMorning && absHash % 2 === 0) {
    return TEMPLATE_GENERATORS[15](cleanName, url);
  }
  if (isAfternoon && absHash % 2 === 0) {
    return TEMPLATE_GENERATORS[16](cleanName, url);
  }

  let workerOffset = 0;
  for (let i = 0; i < cleanWorkerId.length; i++) {
    workerOffset += cleanWorkerId.charCodeAt(i) * (i + 1);
  }

  const chosenIndex = (absHash + workerOffset + dayOfWeek * 7) % TEMPLATE_GENERATORS.length;
  return TEMPLATE_GENERATORS[chosenIndex](cleanName, url);
}
