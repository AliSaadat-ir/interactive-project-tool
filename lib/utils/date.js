// === DATE UTILITIES ===
// Handles date formatting with timezone support

// Get formatted timestamp with timezone
function getFormattedDateTime() {
  const now = new Date();
  
  // Get local time components
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  // Get timezone offset
  const offset = -now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetSign = offset >= 0 ? '+' : '-';
  const offsetString = `UTC${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
  
  // Format full datetime with timezone
  const fullDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (${offsetString})`;
  
  return {
    full: fullDateTime,
    filenameSafe: `${year}${month}${day}_${hours}${minutes}${seconds}`, // Added seconds
    isoLocal: `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`,
    timezone: offsetString,
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}:${seconds}`
  };
}

// Get timezone name (e.g., "Tehran" for +03:30)
function getTimezoneName() {
  const offset = -new Date().getTimezoneOffset();
  
  // Common timezone mappings
  const timezones = {
    '-720': 'Pacific/Auckland',
    '-660': 'Pacific/Sydney',
    '-600': 'Australia/Sydney',
    '-570': 'Australia/Adelaide',
    '-540': 'Asia/Tokyo',
    '-480': 'Asia/Shanghai',
    '-420': 'Asia/Bangkok',
    '-390': 'Asia/Yangon',
    '-360': 'Asia/Dhaka',
    '-345': 'Asia/Kathmandu',
    '-330': 'Asia/Kolkata',
    '-300': 'Asia/Karachi',
    '-270': 'Asia/Kabul',
    '-240': 'Asia/Dubai',
    '-210': 'Asia/Tehran',
    '-180': 'Europe/Moscow',
    '-120': 'Europe/Athens',
    '-60': 'Europe/Paris',
    '0': 'Europe/London',
    '60': 'America/New_York',
    '120': 'America/Chicago',
    '180': 'America/Denver',
    '240': 'America/Los_Angeles',
    '300': 'America/Anchorage',
    '360': 'Pacific/Honolulu'
  };
  
  // Special case for Tehran timezone (+03:30)
  if (offset === 210) {
    return 'Tehran';
  }
  
  const city = timezones[offset.toString()];
  return city ? city.split('/').pop() : 'Local';
}

// Format date for display with timezone
function formatDateTimeForDisplay() {
  const dt = getFormattedDateTime();
  const city = getTimezoneName();
  
  if (city === 'Tehran') {
    return `${dt.date} ${dt.time} (Tehran +03:30)`;
  }
  
  return `${dt.date} ${dt.time} (${dt.timezone})`;
}

// Get filename-safe timestamp with seconds
function getExportFilename(prefix = 'export') {
  const dt = getFormattedDateTime();
  return `${prefix}_${dt.filenameSafe}.txt`;
}

// Get report filename with seconds
function getReportFilename(baseName, extension) {
  const dt = getFormattedDateTime();
  return `${baseName}_${dt.filenameSafe}.${extension}`;
}

module.exports = {
  getFormattedDateTime,
  getTimezoneName,
  formatDateTimeForDisplay,
  getExportFilename,
  getReportFilename
};