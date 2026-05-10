// utils/calendar.js

// ===============================
// ETHIOPIAN CALENDAR UTILITIES
// FULLY FIXED VERSION
// ===============================

// Ethiopian month names
export const ETHIOPIAN_MONTHS = {
  en: [
    'Meskerem',
    'Tikimt',
    'Hidar',
    'Tahsas',
    'Tir',
    'Yekatit',
    'Megabit',
    'Miyazya',
    'Ginbot',
    'Sene',
    'Hamle',
    'Nehase',
    'Pagume'
  ],

  am: [
    'መስከረም',
    'ጥቅምት',
    'ህዳር',
    'ታህሳስ',
    'ጥር',
    'የካቲት',
    'መጋቢት',
    'ሚያዝያ',
    'ግንቦት',
    'ሰኔ',
    'ሐምሌ',
    'ነሐሴ',
    'ጳጉሜ'
  ]
};

// ===============================
// LEAP YEAR FUNCTIONS
// ===============================

export function isGregorianLeapYear(year) {
  return (
    year % 4 === 0 &&
    (year % 100 !== 0 || year % 400 === 0)
  );
}

// Ethiopian leap year
// Example:
// 2011 EC is leap because 2012 % 4 === 0
export function isEthiopianLeapYear(year) {
  return (year + 1) % 4 === 0;
}

export function getPagumeDays(year) {
  return isEthiopianLeapYear(year) ? 6 : 5;
}

// ===============================
// ETHIOPIAN NEW YEAR
// ===============================

// Ethiopian New Year:
//
// Normally: Sept 11
// Sept 12 if NEXT Gregorian year is leap
//
export function getEthiopianNewYear(gregorianYear) {
  const nextYear = gregorianYear + 1;

  const isNextLeap = isGregorianLeapYear(nextYear);

  return new Date(
    Date.UTC(
      gregorianYear,
      8,
      isNextLeap ? 12 : 11
    )
  );
}

// ===============================
// GREGORIAN -> ETHIOPIAN
// ===============================

export function gregorianToEthiopian(dateInput) {
  if (!dateInput) return null;

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) return null;

  const gcDate = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )
  );

  const gcYear = gcDate.getUTCFullYear();

  const newYearThisGC = getEthiopianNewYear(gcYear);

  let etYear;
  let etNewYear;

  if (gcDate < newYearThisGC) {
    etYear = gcYear - 8;
    etNewYear = getEthiopianNewYear(gcYear - 1);
  } else {
    etYear = gcYear - 7;
    etNewYear = newYearThisGC;
  }

  const diffDays = Math.floor(
    (gcDate - etNewYear) / (1000 * 60 * 60 * 24)
  );

  let remainingDays = diffDays;

  let etMonth = 1;

  for (let i = 1; i <= 13; i++) {
    const daysInMonth =
      i === 13
        ? getPagumeDays(etYear)
        : 30;

    if (remainingDays < daysInMonth) {
      etMonth = i;
      break;
    }

    remainingDays -= daysInMonth;
  }

  const etDay = remainingDays + 1;

  return {
    year: etYear,
    month: etMonth,
    day: etDay,

    monthNameEn:
      ETHIOPIAN_MONTHS.en[etMonth - 1],

    monthNameAm:
      ETHIOPIAN_MONTHS.am[etMonth - 1],

    formattedEc:
      `${etYear}-${String(etMonth).padStart(2, '0')}-${String(etDay).padStart(2, '0')}`,

    formattedDisplay: {
      en:
        `${ETHIOPIAN_MONTHS.en[etMonth - 1]} ${etDay}, ${etYear}`,

      am:
        `${ETHIOPIAN_MONTHS.am[etMonth - 1]} ${etDay}, ${etYear}`
    }
  };
}

// ===============================
// ETHIOPIAN -> GREGORIAN
// ===============================

export function ethiopianToGregorian(input) {
  if (!input) return null;

  let year, month, day;

  // String input
  if (typeof input === 'string') {
    const parts = input.split('-');

    if (parts.length !== 3) return null;

    year = parseInt(parts[0]);
    month = parseInt(parts[1]);
    day = parseInt(parts[2]);
  }

  // Object input
  else {
    year = input.year;
    month = input.month;
    day = input.day;
  }

  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day)
  ) {
    return null;
  }

  // Validation
  if (month < 1 || month > 13) {
    return null;
  }

  const maxDays =
    month === 13
      ? getPagumeDays(year)
      : 30;

  if (day < 1 || day > maxDays) {
    return null;
  }

  // GC year mapping
  const gcYear =
    month <= 4
      ? year + 7
      : year + 8;

  const newYear = getEthiopianNewYear(gcYear);

  let totalDays = 0;

  for (let i = 1; i < month; i++) {
    totalDays +=
      i === 13
        ? getPagumeDays(year)
        : 30;
  }

  totalDays += day - 1;

  const result = new Date(newYear);

  result.setUTCDate(
    result.getUTCDate() + totalDays
  );

  return {
    year: result.getUTCFullYear(),

    month:
      result.getUTCMonth() + 1,

    day:
      result.getUTCDate(),

    formatted:
      `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(result.getUTCDate()).padStart(2, '0')}`,

    formattedDisplay: {
      en:
        result.toLocaleDateString(
          'en-US',
          {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }
        ),

      am:
        result.toLocaleDateString(
          'am-ET',
          {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }
        )
    }
  };
}

// ===============================
// CURRENT ETHIOPIAN DATE
// ===============================

export function getCurrentEthiopianDate() {
  return gregorianToEthiopian(new Date());
}

// ===============================
// FORMAT FUNCTIONS
// ===============================

export function formatEthiopianDate(
  ecDate,
  language = 'en'
) {
  if (!ecDate) return '';

  let year, month, day;

  if (typeof ecDate === 'string') {
    const parts = ecDate.split('-');

    if (parts.length !== 3) return ecDate;

    year = parts[0];
    month = parseInt(parts[1]);
    day = parseInt(parts[2]);
  } else {
    year = ecDate.year;
    month = ecDate.month;
    day = ecDate.day;
  }

  return `${ETHIOPIAN_MONTHS[language][month - 1]} ${day}, ${year}`;
}

export function formatGregorianDate(
  gcDate,
  language = 'en'
) {
  if (!gcDate) return '';

  const date = new Date(gcDate);

  if (isNaN(date.getTime())) {
    return gcDate;
  }

  const locale =
    language === 'am'
      ? 'am-ET'
      : 'en-US';

  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ===============================
// DATE COMPARISON
// ===============================

export function compareEthiopianDates(
  date1,
  date2
) {
  const gc1 =
    ethiopianToGregorian(date1);

  const gc2 =
    ethiopianToGregorian(date2);

  const d1 =
    new Date(gc1.formatted);

  const d2 =
    new Date(gc2.formatted);

  if (d1 < d2) return -1;

  if (d1 > d2) return 1;

  return 0;
}

// ===============================
// ADD DAYS
// ===============================

export function addDaysToEthiopianDate(
  ecDate,
  days
) {
  const gc =
    ethiopianToGregorian(ecDate);

  if (!gc) return null;

  const date = new Date(
    Date.UTC(
      gc.year,
      gc.month - 1,
      gc.day
    )
  );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return gregorianToEthiopian(date);
}

// ===============================
// EXPIRY DATE
// ===============================

export function calculateExpiryDate(
  issueDateGc
) {
  if (!issueDateGc) return null;

  const issueDate =
    new Date(issueDateGc);

  const expiry =
    new Date(issueDate);

  expiry.setFullYear(
    expiry.getFullYear() + 4
  );

  const ec =
    gregorianToEthiopian(expiry);

  return {
    gc:
      expiry.toISOString().split('T')[0],

    ec:
      ec.formattedEc,

    ecDisplay:
      ec.formattedDisplay
  };
}

// ===============================
// HELPERS
// ===============================

export function getEthiopianMonthName(
  month,
  language = 'en'
) {
  if (month < 1 || month > 13) {
    return '';
  }

  return ETHIOPIAN_MONTHS[language][month - 1];
}

export function getEthiopianYearDays(
  year
) {
  return isEthiopianLeapYear(year)
    ? 366
    : 365;
}

export function ethiopianToGregorianFromComponents(
  year,
  month,
  day
) {
  return ethiopianToGregorian({
    year,
    month,
    day
  });
}

export function getCurrentEthiopianDateFormatted(
  language = 'en'
) {
  const ec =
    getCurrentEthiopianDate();

  return {
    full:
      ec.formattedDisplay[language],

    year:
      ec.year,

    month:
      ec.monthNameEn,

    monthAm:
      ec.monthNameAm,

    day:
      ec.day,

    formattedEc:
      ec.formattedEc
  };
}