export type CountryCode =
  // East Asia
  | "TW"
  | "JP"
  | "KR"
  | "CN"
  | "HK"
  | "MO"
  | "MN"

  // Southeast Asia
  | "TH"
  | "VN"
  | "SG"
  | "MY"
  | "ID"
  | "PH"
  | "KH"
  | "LA"
  | "MM"
  | "BN"
  | "TL"

  // South Asia
  | "IN"
  | "PK"
  | "BD"
  | "LK"
  | "NP"
  | "BT"
  | "MV"

  // Central Asia
  | "KZ"
  | "UZ"
  | "KG"
  | "TJ"
  | "TM"

  // Middle East / West Asia
  | "TR"
  | "AE"
  | "SA"
  | "QA"
  | "KW"
  | "BH"
  | "OM"
  | "IL"
  | "JO"
  | "LB"

  // Common non-Asia
  | "US"
  | "GB"
  | "CA"
  | "AU"
  | "NZ"
  | "FR"
  | "DE"
  | "IT"
  | "ES"
  | "NL"
  | "SE"
  | "NO"
  | "DK"
  | "FI"
  | "BR"
  | "MX";

const COUNTRY_FLAG_MAP: Record<CountryCode, string> = {
  // East Asia
  TW: "🇹🇼",
  JP: "🇯🇵",
  KR: "🇰🇷",
  CN: "🇨🇳",
  HK: "🇭🇰",
  MO: "🇲🇴",
  MN: "🇲🇳",

  // Southeast Asia
  TH: "🇹🇭",
  VN: "🇻🇳",
  SG: "🇸🇬",
  MY: "🇲🇾",
  ID: "🇮🇩",
  PH: "🇵🇭",
  KH: "🇰🇭",
  LA: "🇱🇦",
  MM: "🇲🇲",
  BN: "🇧🇳",
  TL: "🇹🇱",

  // South Asia
  IN: "🇮🇳",
  PK: "🇵🇰",
  BD: "🇧🇩",
  LK: "🇱🇰",
  NP: "🇳🇵",
  BT: "🇧🇹",
  MV: "🇲🇻",

  // Central Asia
  KZ: "🇰🇿",
  UZ: "🇺🇿",
  KG: "🇰🇬",
  TJ: "🇹🇯",
  TM: "🇹🇲",

  // Middle East / West Asia
  TR: "🇹🇷",
  AE: "🇦🇪",
  SA: "🇸🇦",
  QA: "🇶🇦",
  KW: "🇰🇼",
  BH: "🇧🇭",
  OM: "🇴🇲",
  IL: "🇮🇱",
  JO: "🇯🇴",
  LB: "🇱🇧",

  // Common non-Asia
  US: "🇺🇸",
  GB: "🇬🇧",
  CA: "🇨🇦",
  AU: "🇦🇺",
  NZ: "🇳🇿",
  FR: "🇫🇷",
  DE: "🇩🇪",
  IT: "🇮🇹",
  ES: "🇪🇸",
  NL: "🇳🇱",
  SE: "🇸🇪",
  NO: "🇳🇴",
  DK: "🇩🇰",
  FI: "🇫🇮",
  BR: "🇧🇷",
  MX: "🇲🇽",
};

export function getCountryFlag(countryCode?: string | null): string {
  if (!countryCode) {
    return "🏳️";
  }

  const normalizedCountryCode = countryCode.trim().toUpperCase();

  if (normalizedCountryCode in COUNTRY_FLAG_MAP) {
    return COUNTRY_FLAG_MAP[normalizedCountryCode as CountryCode];
  }

  return "🏳️";
}
