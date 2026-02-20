// Utilities for Ramadhan Tracker

// --- Hijri Date Helper ---
export const getHijriDate = (): string => {
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  } catch (e) {
    return "Ramadhan 1447H";
  }
};

// --- Prayer Time Types ---
export interface PrayerSchedule {
  list: { name: string; time: string; raw: Date; id: string; isNext: boolean }[];
  next: { name: string; time: string; raw: Date; id: string; isNext: boolean } | undefined;
  imsak: string;
  sunrise: string;
  dhuha: string; // Calculated
  locationName: string;
  times: Record<string, string>; // Raw dictionary for easy lookup
}

export interface CityResult {
    name: string;
    lat: number;
    lon: number;
}

// Helper to format time string "HH:MM" to Date object for today
const timeStringToDate = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
};

// Helper to add minutes to a time string "HH:MM"
const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
    const date = timeStringToDate(timeStr);
    date.setMinutes(date.getMinutes() + minutesToAdd);
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
        const now = new Date();

        // Calculate Dhuha (Approx 20 mins after Sunrise/Syuruq)
        const dhuhaTime = addMinutesToTime(timings.Sunrise, 20);

        // Map API response to our app structure
        const rawPrayers = [
            { id: 'subuh', name: 'Subuh', time: timings.Fajr },
            { id: 'dhuha', name: 'Dhuha', time: dhuhaTime }, // Added Dhuha
            { id: 'dzuhur', name: 'Dzuhur', time: timings.Dhuhr },
            { id: 'ashar', name: 'Ashar', time: timings.Asr },
            { id: 'maghrib', name: 'Maghrib', time: timings.Maghrib },
            { id: 'isya', name: 'Isya', time: timings.Isha },
        ];

        const list = rawPrayers.map(p => ({
            ...p,
            raw: timeStringToDate(p.time),
            isNext: false
        }));

        // Determine Next Prayer
        let nextPrayer = list.find(p => p.raw > now);
        
        // If all prayers passed today, next is Fajr tomorrow
        if (!nextPrayer) {
            const tomorrowFajr = new Date(list[0].raw);
            tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
            nextPrayer = { 
                ...list[0], 
                raw: tomorrowFajr,
                isNext: true 
            };
        } else {
            nextPrayer.isNext = true;
        }

        // Update list 'isNext' status
        const finalList = list.map(p => ({
            ...p,
            isNext: p.id === nextPrayer?.id
        }));

        const timezone = data.data.meta.timezone || "Detected Location";

        return {
            list: finalList,
            next: nextPrayer,
            imsak: timings.Imsak,
            sunrise: timings.Sunrise,
            dhuha: dhuhaTime,
            locationName: timezone.split('/')[1]?.replace('_', ' ') || "My Location",
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
        // Aladhan API expects month (1-12) and year (YYYY)
        const response = await fetch(`https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=20`);
        const data = await response.json();
        
        if (data.code !== 200) return [];
        return data.data;
    } catch (error) {
        console.error("Error fetching monthly prayers:", error);
        return [];
    }
};

// --- Search City API (Nominatim) ---
export const searchCity = async (query: string): Promise<CityResult[]> => {
    if (!query || query.length < 3) return [];
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
        const data = await response.json();
        
        return data.map((item: any) => ({
            name: item.display_name.split(',')[0] + ', ' + (item.address.city || item.address.state || item.address.country), // Simplifikasi nama
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
        }));
    } catch (error) {
        console.error("Error searching city:", error);
        return [];
    }
};

// --- Ramadhan Day Calculator ---
export const calculateRamadhanDay = (startDateStr: string, checkDateStr?: string): number => {
    if (!startDateStr) return 1;
    
    const start = new Date(startDateStr);
    const check = checkDateStr ? new Date(checkDateStr) : new Date();
    
    // Reset hours to compare dates only
    start.setHours(0,0,0,0);
    check.setHours(0,0,0,0);
    
    const diffTime = check.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // Day 1 is the start date itself, so +1.
    return diffDays + 1;
};