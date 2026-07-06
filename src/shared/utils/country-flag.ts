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

const COUNTRY_NAMES: Record<CountryCode, string> = {
  TW: "Taiwan",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  HK: "Hong Kong",
  MO: "Macau",
  MN: "Mongolia",
  TH: "Thailand",
  VN: "Vietnam",
  SG: "Singapore",
  MY: "Malaysia",
  ID: "Indonesia",
  PH: "Philippines",
  KH: "Cambodia",
  LA: "Laos",
  MM: "Myanmar",
  BN: "Brunei",
  TL: "Timor-Leste",
  IN: "India",
  PK: "Pakistan",
  BD: "Bangladesh",
  LK: "Sri Lanka",
  NP: "Nepal",
  BT: "Bhutan",
  MV: "Maldives",
  KZ: "Kazakhstan",
  UZ: "Uzbekistan",
  KG: "Kyrgyzstan",
  TJ: "Tajikistan",
  TM: "Turkmenistan",
  TR: "Türkiye",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  QA: "Qatar",
  KW: "Kuwait",
  BH: "Bahrain",
  OM: "Oman",
  IL: "Israel",
  JO: "Jordan",
  LB: "Lebanon",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  NZ: "New Zealand",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  BR: "Brazil",
  MX: "Mexico",
};

export type CountryOption = {
  code: CountryCode;
  name: string;
  flag: string;
};

/** 供國家選單使用：依名稱排序的 { code, name, flag } 清單 */
export const COUNTRIES: CountryOption[] = (
  Object.keys(COUNTRY_FLAG_MAP) as CountryCode[]
)
  .map((code) => ({
    code,
    name: COUNTRY_NAMES[code],
    flag: COUNTRY_FLAG_MAP[code],
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
