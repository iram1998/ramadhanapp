
// Utilities for Ramadhan Tracker

// --- Hijri Date Helper (Timezone Aware) ---
export const getHijriDate = (timezone: string = 'Asia/Jakarta'): string => {
  try {
    return new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: timezone
    }).format(new Date());
  } catch (e) {
    return "Ramadhan 1447H";
  }
};

// --- Prayer Time Types ---
export interface PrayerSchedule {
  list: { name: string; time: string; id: string; isNext: boolean }[];
  next: { name: string; time: string; id: string; isNext: boolean } | undefined;
  imsak: string;
  sunrise: string;
  dhuha: string; // Calculated
  locationName: string;
  timezone: string; // New: IANA Timezone string
  times: Record<string, string>; // Raw dictionary for easy lookup
}

export interface CityResult {
    name: string;
    lat: number;
    lon: number;
}

// Helper: Get Current Date Object shifted to specific Timezone
export const getCurrentTimeInZone = (timezone: string): Date => {
    try {
        const str = new Date().toLocaleString('en-US', { timeZone: timezone });
        return new Date(str);
    } catch (e) {
        return new Date();
    }
};

// Helper to add minutes to a time string "HH:MM"
export const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
    if (!timeStr) return '--:--';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + minutesToAdd, 0, 0);
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
};

// --- Real API Fetcher (Aladhan.com) with Offline Caching ---
export const getPrayerTimes = async (latitude: number, longitude: number): Promise<PrayerSchedule> => {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const cacheKey = `prayer_schedule_${yyyy}-${mm}-${dd}_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;

    let data;

    try {
        // Method 20 is Kemenag RI
        const response = await fetch(`https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${latitude}&longitude=${longitude}&method=20`);
        const json = await response.json();

        if (json.code !== 200) throw new Error("Failed to fetch timings");
        
        data = json.data;
        
        // Save to Cache
        localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
        console.warn("Offline or API Error, trying cache...", error);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            data = JSON.parse(cached);
        } else {
            // Fallback hardcoded logic or throw if strictly needed
             console.error("No cache available.");
             throw error;
        }
    }

    const timings = data.timings;
    const timezone = data.meta.timezone || "Asia/Jakarta"; 
    
    // "Now" in the target timezone
    const nowInZone = getCurrentTimeInZone(timezone);

    // Calculate Dhuha (Approx 20 mins after Sunrise/Syuruq)
    const dhuhaTime = addMinutesToTime(timings.Sunrise, 20);

    // Map API response
    const rawPrayers = [
        { id: 'subuh', name: 'Subuh', time: timings.Fajr },
        { id: 'dhuha', name: 'Dhuha', time: dhuhaTime },
        { id: 'dzuhur', name: 'Dzuhur', time: timings.Dhuhr },
        { id: 'ashar', name: 'Ashar', time: timings.Asr },
        { id: 'maghrib', name: 'Maghrib', time: timings.Maghrib },
        { id: 'isya', name: 'Isya', time: timings.Isha },
    ];

    // Format current time as HH:MM for string comparison
    const currentH = String(nowInZone.getHours()).padStart(2, '0');
    const currentM = String(nowInZone.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentH}:${currentM}`;

    // Find Next Prayer
    const foundPrayer = rawPrayers.find(p => p.time > currentTimeStr);
    
    const nextPrayerBase = foundPrayer || rawPrayers[0];
    
    const nextPrayer = {
        ...nextPrayerBase,
        isNext: true
    };

    const list = rawPrayers.map(p => ({
        ...p,
        isNext: p.id === nextPrayer.id
    }));

    return {
        list: list,
        next: nextPrayer,
        imsak: timings.Imsak,
        sunrise: timings.Sunrise,
        dhuha: dhuhaTime,
        locationName: timezone.split('/')[1]?.replace('_', ' ') || "My Location",
        timezone: timezone,
        times: {
            imsak: timings.Imsak,
            subuh: timings.Fajr,
            terbit: timings.Sunrise,
            dhuha: dhuhaTime,
            dzuhur: timings.Dhuhr,
            ashar: timings.Asr,
            maghrib: timings.Maghrib,
            isya: timings.Isha
        }
    };
};

// Updated to accept month and year explicitly
export const getMonthlyPrayerTimes = async (latitude: number, longitude: number, month: number, year: number): Promise<any[]> => {
    const cacheKey = `monthly_schedule_${year}_${month}_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
    try {
        const response = await fetch(`https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=20`);
        const data = await response.json();
        if (data.code !== 200) return [];
        
        localStorage.setItem(cacheKey, JSON.stringify(data.data));
        return data.data;
    } catch (error) {
        console.warn("Offline monthly fetch, checking cache");
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
        
        console.error("Error fetching monthly prayers:", error);
        return [];
    }
};

// --- Search City API ---
export const searchCity = async (query: string): Promise<CityResult[]> => {
    if (!query || query.length < 3) return [];
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
        const data = await response.json();
        return data.map((item: any) => ({
            name: item.display_name.split(',')[0] + ', ' + (item.address.city || item.address.state || item.address.country),
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
        }));
    } catch (error) {
        console.error("Error searching city:", error);
        return [];
    }
};

export const calculateRamadhanDay = (startDateStr: string, dateOrTimezone: string = 'Asia/Jakarta'): number => {
    if (!startDateStr) return 1;
    
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    let check: Date;
    
    const isDateString = !isNaN(Date.parse(dateOrTimezone)) && (dateOrTimezone.includes('-') || dateOrTimezone.includes('/')) && !dateOrTimezone.includes('Asia') && !dateOrTimezone.includes('GMT');

    if (isDateString) {
        check = new Date(dateOrTimezone);
    } else {
        check = getCurrentTimeInZone(dateOrTimezone);
    }

    check.setHours(0, 0, 0, 0);
    const diffTime = check.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    return diffDays + 1;
};

// --- QURAN API FUNCTIONS (Added) ---

// Helper Clean Bismillah
const cleanAyahText = (text: string, surahNumber: number, numberInSurah: number) => {
    // If Surah is NOT Al-Fatihah (1) AND NOT At-Tawbah (9), and it's Ayah 1
    if (surahNumber !== 1 && surahNumber !== 9 && numberInSurah === 1) {
        const basmalahVariations = [
            "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
            "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", 
            "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
            "بسم الله الرحمن الرحيم"
        ];

        for (const prefix of basmalahVariations) {
            if (text.startsWith(prefix)) {
                return text.slice(prefix.length).trim();
            }
        }
    }
    return text;
};

// 1. Get List of Surahs
export const getSurahList = async (): Promise<any[]> => {
    const cacheKey = 'quran_surah_list';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const json = await response.json();
        if (json.code === 200) {
            localStorage.setItem(cacheKey, JSON.stringify(json.data));
            return json.data;
        }
        return [];
    } catch (e) {
        console.error("Failed to fetch surah list", e);
        return [];
    }
}

// 2. Get Surah Details (Arabic + Translation + Audio)
export const getSurahDetail = async (surahNumber: number): Promise<any> => {
    const cacheKey = `quran_surah_${surahNumber}_v2`; 
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,id.indonesian,ar.alafasy`);
        const json = await response.json();
        
        if (json.code === 200 && json.data.length >= 3) {
            const arabicData = json.data[0];
            const transData = json.data[1];
            const audioData = json.data[2];

            const mergedAyahs = arabicData.ayahs.map((ayah: any, index: number) => ({
                ...ayah,
                text: cleanAyahText(ayah.text, surahNumber, ayah.numberInSurah),
                translation: transData.ayahs[index] ? transData.ayahs[index].text : '',
                audio: audioData.ayahs[index] ? audioData.ayahs[index].audio : '',
            }));
            
            const result = { ...arabicData, ayahs: mergedAyahs };
            try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch (e) {}
            return result;
        }
        return null;
    } catch (e) {
        console.error("Failed getSurahDetail", e);
        return null;
    }
}

// 3. Get Juz Details (Arabic + Translation + Audio)
export const getJuzDetail = async (juzNumber: number): Promise<any> => {
    const cacheKey = `quran_juz_${juzNumber}_v3`; // Cache Key v3
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
        // Fetch Arabic, Translation, and Audio independently in parallel
        // because /editions/ endpoint is not supported for Juz
        const [arabicRes, transRes, audioRes] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}/quran-uthmani`),
            fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}/id.indonesian`),
            fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}/ar.alafasy`)
        ]);

        const arabicJson = await arabicRes.json();
        const transJson = await transRes.json();
        const audioJson = await audioRes.json();
        
        if (arabicJson.code === 200 && transJson.code === 200 && audioJson.code === 200) {
            const arabicData = arabicJson.data;
            const transData = transJson.data;
            const audioData = audioJson.data;
            
            const mergedAyahs = arabicData.ayahs.map((ayah: any, index: number) => {
                const surahNum = ayah.surah ? ayah.surah.number : 0;
                
                // Safety check for indices
                const translation = transData.ayahs[index] ? transData.ayahs[index].text : '';
                const audio = audioData.ayahs[index] ? audioData.ayahs[index].audio : '';

                return {
                    ...ayah,
                    text: cleanAyahText(ayah.text, surahNum, ayah.numberInSurah),
                    translation: translation,
                    audio: audio,
                    surah: ayah.surah // Preserve surah info for headers
                };
            });

            const result = { ...arabicData, ayahs: mergedAyahs };
            try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch (e) {}
            return result;
        }
        return null;
    } catch (e) {
        console.error("Failed getJuzDetail", e);
        return null;
    }
}

// 4. Get Page Details (Arabic + Translation + Audio)
export const getPageDetail = async (pageNumber: number): Promise<any> => {
    const cacheKey = `quran_page_${pageNumber}_v3`; // Cache Key v3
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
        // Fetch Arabic, Translation, and Audio independently in parallel
        // because /editions/ endpoint is not supported for Page
        const [arabicRes, transRes, audioRes] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`),
            fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/id.indonesian`),
            fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/ar.alafasy`)
        ]);

        const arabicJson = await arabicRes.json();
        const transJson = await transRes.json();
        const audioJson = await audioRes.json();
        
        if (arabicJson.code === 200 && transJson.code === 200 && audioJson.code === 200) {
            const arabicData = arabicJson.data;
            const transData = transJson.data;
            const audioData = audioJson.data;
            
            const mergedAyahs = arabicData.ayahs.map((ayah: any, index: number) => {
                const surahNum = ayah.surah ? ayah.surah.number : 0;
                
                const translation = transData.ayahs[index] ? transData.ayahs[index].text : '';
                const audio = audioData.ayahs[index] ? audioData.ayahs[index].audio : '';

                return {
                    ...ayah,
                    text: cleanAyahText(ayah.text, surahNum, ayah.numberInSurah),
                    translation: translation,
                    audio: audio,
                    surah: ayah.surah // Preserve surah info for headers
                };
            });

            const result = { ...arabicData, ayahs: mergedAyahs };
            try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch (e) {}
            return result;
        }
        return null;
    } catch (e) {
        console.error("Failed getPageDetail", e);
        return null;
    }
}


// --- QIBLA CALCULATION ---
export const calculateQiblaDirection = (lat: number, lon: number): number => {
    // Kaaba Coordinates
    const kaabaLat = 21.422487;
    const kaabaLon = 39.826206;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const lat1 = toRad(lat);
    const lat2 = toRad(kaabaLat);
    const dLon = toRad(kaabaLon - lon);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let bearing = toDeg(Math.atan2(y, x));
    return (bearing + 360) % 360; // Normalize to 0-360
};
