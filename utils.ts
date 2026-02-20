
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
// This allows us to compare "Now" in that location vs Prayer Time strings
export const getCurrentTimeInZone = (timezone: string): Date => {
    try {
        // Create a date string in the target timezone (e.g., "2/18/2026, 10:00:00 AM")
        const str = new Date().toLocaleString('en-US', { timeZone: timezone });
        return new Date(str);
    } catch (e) {
        // Fallback to local time if timezone is invalid
        return new Date();
    }
};

// Helper to add minutes to a time string "HH:MM"
const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + minutesToAdd, 0, 0);
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
};

// --- Real API Fetcher (Aladhan.com) ---
export const getPrayerTimes = async (latitude: number, longitude: number): Promise<PrayerSchedule> => {
    try {
        // Fetch data for today
        const date = new Date();
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        
        // Method 20 is Kemenag RI
        const response = await fetch(`https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${latitude}&longitude=${longitude}&method=20`);
        const data = await response.json();

        if (data.code !== 200) throw new Error("Failed to fetch timings");

        const timings = data.data.timings;
        const timezone = data.data.meta.timezone || "Asia/Jakarta"; // Default fallback
        
        // "Now" in the target timezone
        const nowInZone = getCurrentTimeInZone(timezone);

        // Calculate Dhuha (Approx 20 mins after Sunrise/Syuruq)
        const dhuhaTime = addMinutesToTime(timings.Sunrise, 20);

        // Map API response to our app structure
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
        
        // If found, use it. If not, next is Subuh (index 0) tomorrow.
        const nextPrayerBase = foundPrayer || rawPrayers[0];
        
        // Construct the full next prayer object with isNext flag
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

    } catch (error) {
        console.error("Error fetching prayer times:", error);
        throw error;
    }
};

// Updated to accept month and year explicitly
export const getMonthlyPrayerTimes = async (latitude: number, longitude: number, month: number, year: number): Promise<any[]> => {
    try {
        const response = await fetch(`https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=20`);
        const data = await response.json();
        if (data.code !== 200) return [];
        return data.data;
    } catch (error) {
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

/**
 * Ramadhan Day Calculator (Hybrid: Date-based OR Timezone-based)
 * @param startDateStr - Tanggal 1 Ramadhan (YYYY-MM-DD)
 * @param dateOrTimezone - BISA berupa string Tanggal (YYYY-MM-DD) ATAU string Timezone (Asia/Jakarta)
 */
export const calculateRamadhanDay = (startDateStr: string, dateOrTimezone: string = 'Asia/Jakarta'): number => {
    if (!startDateStr) return 1;
    
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    let check: Date;
    
    // Cek apakah parameter kedua adalah Tanggal (format YYYY-MM-DD atau DD-MM-YYYY)
    // Timezone (Asia/Jakarta) biasanya akan menghasilkan Invalid Date atau NaN jika diparse langsung tanpa konteks,
    // atau kita cek karakter "/" dan "-" untuk membedakan.
    const isDateString = !isNaN(Date.parse(dateOrTimezone)) && (dateOrTimezone.includes('-') || dateOrTimezone.includes('/')) && !dateOrTimezone.includes('Asia') && !dateOrTimezone.includes('GMT');

    if (isDateString) {
        // Kasus: Menghitung hari untuk baris tabel jadwal (Tracker.tsx)
        check = new Date(dateOrTimezone);
    } else {
        // Kasus: Menghitung hari "Hari Ini" berdasarkan jam lokasi (Dashboard / Context)
        check = getCurrentTimeInZone(dateOrTimezone);
    }

    check.setHours(0, 0, 0, 0);
    const diffTime = check.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    return diffDays + 1;
};
