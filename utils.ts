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

// --- Simple Prayer Time Logic (Approximation) ---
// Note: accurate astronomical calculation requires complex math. 
// This logic provides a robust approximation based on longitude offsets relative to a timezone reference.

interface PrayerSchedule {
  list: { name: string; time: string; raw: Date; id: string; isNext: boolean }[];
  next: { name: string; time: string; raw: Date; id: string; isNext: boolean } | undefined;
  imsak: string;
}

const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000);
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export const getPrayerTimes = (latitude: number, longitude: number): PrayerSchedule => {
    // Reference: Jakarta (Lat -6.2, Long 106.8) GMT+7
    const refLat = -6.2;
    const refLong = 106.8;
    
    // Base times for reference date (Average Ramadhan times)
    const baseTimes = {
        fajr: '04:40',
        dhuhr: '12:00',
        asr: '15:15',
        maghrib: '18:05',
        isha: '19:15'
    };

    // 1 degree longitude difference ~= 4 minutes time difference
    // If longitude is greater (East), time comes earlier (subtract minutes from base relative to GMT)
    // Actually simpler: Just shift base time. 
    // If I am at 107.8 (1 deg East of Jakarta), Maghrib is 4 mins earlier.
    const longDiff = refLong - longitude;
    const timeShiftMinutes = longDiff * 4; 

    const now = new Date();
    const createTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return addMinutes(d, timeShiftMinutes);
    };

    const fajr = createTime(baseTimes.fajr);
    const dhuhr = createTime(baseTimes.dhuhr);
    const asr = createTime(baseTimes.asr);
    const maghrib = createTime(baseTimes.maghrib);
    const isha = createTime(baseTimes.isha);
    const imsak = addMinutes(fajr, -10);

    const prayers = [
        { name: 'Subuh', time: formatTime(fajr), raw: fajr, id: 'fajr' },
        { name: 'Dzuhur', time: formatTime(dhuhr), raw: dhuhr, id: 'dhuhr' },
        { name: 'Ashar', time: formatTime(asr), raw: asr, id: 'asr' },
        { name: 'Maghrib', time: formatTime(maghrib), raw: maghrib, id: 'maghrib' },
        { name: 'Isya', time: formatTime(isha), raw: isha, id: 'isha' },
    ];

    // Determine Next Prayer
    let nextPrayer = prayers.find(p => p.raw > now);
    if (!nextPrayer) {
        // If all passed, next is Fajr tomorrow
        nextPrayer = { ...prayers[0], time: prayers[0].time, raw: addMinutes(prayers[0].raw, 24*60) }; 
    }

    return {
        list: prayers.map(p => ({ ...p, isNext: p.id === nextPrayer?.id })),
        next: { ...nextPrayer, isNext: true },
        imsak: formatTime(imsak)
    };
};