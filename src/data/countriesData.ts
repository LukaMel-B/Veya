/**
 * ISO 3166-1 Alpha-2 Complete Worldwide Country Dataset
 * 
 * Source: ISO 3166-1 Standard published by the International Organization for Standardization
 * and United Nations Statistics Division (UN M49 Standard Country and Area Codes).
 * License: Public Domain / Open Data (CC0 equivalent for statistical standard codes).
 * Completely bundled locally — 100% offline, zero remote lookups or paid APIs.
 */

export interface CountryData {
  code: string;       // ISO 3166-1 alpha-2 uppercase code (e.g. "JP", "CH", "US")
  name: string;       // Canonical English country name
  flag: string;       // Native Unicode flag emoji
  aliases: string[];  // Common alternative spellings, native names, and abbreviations
}

/**
 * Computes official ISO 3166-1 flag emoji from 2-letter alpha-2 code
 * using Unicode Regional Indicator Symbol pairs.
 */
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const clean = countryCode.toUpperCase();
  const first = clean.charCodeAt(0) - 65;
  const second = clean.charCodeAt(1) - 65;
  if (first < 0 || first > 25 || second < 0 || second > 25) return '🌍';
  return String.fromCodePoint(0x1f1e6 + first, 0x1f1e6 + second);
}

/**
 * Complete list of countries and territories worldwide (ISO 3166-1)
 */
export const COUNTRIES_DATA: CountryData[] = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', aliases: ['Afganistan'] },
  { code: 'AL', name: 'Albania', flag: '🇦🇱', aliases: ['Shqipëri', 'Shqiperia'] },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', aliases: ['Algérie', 'Al-Jazā\'ir'] },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩', aliases: [] },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', aliases: [] },
  { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬', aliases: ['Antigua & Barbuda'] },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', aliases: [] },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲', aliases: ['Hayastan'] },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', aliases: ['Aussie', 'Oz'] },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', aliases: ['Österreich', 'Oesterreich'] },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', aliases: ['Azərbaycan'] },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸', aliases: ['The Bahamas'] },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', aliases: [] },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', aliases: [] },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧', aliases: [] },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾', aliases: ['Belorussia'] },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', aliases: ['Belgique', 'België'] },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿', aliases: [] },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', aliases: [] },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹', aliases: [] },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', aliases: ['Bolivia, Plurinational State of'] },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦', aliases: ['Bosnia', 'Herzegovina', 'BiH'] },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', aliases: [] },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', aliases: ['Brasil'] },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳', aliases: ['Brunei Darussalam'] },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', aliases: ['България'] },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', aliases: [] },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮', aliases: [] },
  { code: 'CV', name: 'Cabo Verde', flag: '🇨🇻', aliases: ['Cape Verde'] },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', aliases: ['Kampuchea'] },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', aliases: ['Cameroun'] },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', aliases: [] },
  { code: 'CF', name: 'Central African Republic', flag: '🇨🇫', aliases: ['CAR'] },
  { code: 'TD', name: 'Chad', flag: '🇹🇩', aliases: ['Tchad'] },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', aliases: [] },
  { code: 'CN', name: 'China', flag: '🇨🇳', aliases: ['PRC', 'People\'s Republic of China', 'Zhongguo'] },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', aliases: [] },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲', aliases: [] },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', aliases: ['Congo-Brazzaville', 'Republic of the Congo'] },
  { code: 'CD', name: 'Congo (DRC)', flag: '🇨🇩', aliases: ['DRC', 'Democratic Republic of the Congo', 'Zaire'] },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', aliases: [] },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', aliases: ['Hrvatska'] },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺', aliases: [] },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', aliases: ['Kypros'] },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', aliases: ['Czechia', 'Česko', 'Cesko'] },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', aliases: ['Danmark'] },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', aliases: [] },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲', aliases: [] },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', aliases: ['Dom Rep'] },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', aliases: [] },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', aliases: ['Misr', 'Masr'] },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', aliases: [] },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶', aliases: [] },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷', aliases: [] },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', aliases: ['Eesti'] },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', aliases: ['Swaziland'] },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', aliases: [] },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', aliases: [] },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', aliases: ['Suomi'] },
  { code: 'FR', name: 'France', flag: '🇫🇷', aliases: ['French Republic'] },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', aliases: [] },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲', aliases: ['The Gambia'] },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪', aliases: ['Sakartvelo'] },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', aliases: ['Deutschland', 'BRD'] },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', aliases: [] },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', aliases: ['Hellas', 'Ellada'] },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩', aliases: [] },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', aliases: [] },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', aliases: ['Guinea-Conakry'] },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', aliases: [] },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾', aliases: [] },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹', aliases: [] },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳', aliases: [] },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', aliases: ['Magyarország', 'Magyarorszag'] },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸', aliases: ['Ísland', 'Island'] },
  { code: 'IN', name: 'India', flag: '🇮🇳', aliases: ['Bharat', 'Hindustan'] },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', aliases: [] },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', aliases: ['Persia', 'Islamic Republic of Iran'] },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', aliases: [] },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', aliases: ['Éire', 'Eire', 'Republic of Ireland'] },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', aliases: [] },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', aliases: ['Italia'] },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', aliases: [] },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', aliases: ['Nippon', 'Nihon'] },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', aliases: [] },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', aliases: ['Kazakstan', 'Qazaqstan'] },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', aliases: [] },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮', aliases: [] },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', aliases: [] },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', aliases: ['Kirghizia'] },
  { code: 'LA', name: 'Laos', flag: '🇱🇦', aliases: ['Lao PDR', 'Lao People\'s Democratic Republic'] },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', aliases: ['Latvija'] },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', aliases: ['Lubnan'] },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸', aliases: [] },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷', aliases: [] },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', aliases: [] },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮', aliases: [] },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', aliases: ['Lietuva'] },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', aliases: ['Luxemburg'] },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', aliases: [] },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', aliases: [] },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', aliases: [] },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻', aliases: [] },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', aliases: [] },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', aliases: [] },
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭', aliases: [] },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷', aliases: [] },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺', aliases: [] },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', aliases: ['México'] },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲', aliases: ['Federated States of Micronesia'] },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩', aliases: ['Republic of Moldova'] },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨', aliases: [] },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳', aliases: [] },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪', aliases: ['Crna Gora'] },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', aliases: ['Maroc', 'Al-Maghrib'] },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', aliases: [] },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', aliases: ['Burma'] },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦', aliases: [] },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷', aliases: [] },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', aliases: [] },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', aliases: ['Holland', 'The Netherlands', 'Nederland'] },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', aliases: ['Aotearoa'] },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', aliases: [] },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', aliases: [] },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', aliases: [] },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵', aliases: ['DPRK', 'Democratic People\'s Republic of Korea'] },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰', aliases: ['Macedonia', 'FYROM'] },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', aliases: ['Norge', 'Noreg'] },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', aliases: [] },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', aliases: [] },
  { code: 'PW', name: 'Palau', flag: '🇵🇼', aliases: [] },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸', aliases: ['State of Palestine'] },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', aliases: ['Panamá'] },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', aliases: ['PNG'] },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', aliases: [] },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', aliases: ['Perú'] },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', aliases: ['Pilipinas'] },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', aliases: ['Polska'] },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', aliases: [] },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', aliases: [] },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', aliases: ['România'] },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', aliases: ['Russian Federation', 'Rossiya'] },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', aliases: [] },
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳', aliases: ['St Kitts'] },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨', aliases: ['St Lucia'] },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨', aliases: ['St Vincent'] },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸', aliases: [] },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲', aliases: [] },
  { code: 'ST', name: 'Sao Tome and Principe', flag: '🇸🇹', aliases: ['São Tomé and Príncipe'] },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', aliases: ['KSA'] },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', aliases: [] },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸', aliases: ['Srbija'] },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨', aliases: [] },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', aliases: [] },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', aliases: ['Singapura'] },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', aliases: ['Slovak Republic', 'Slovensko'] },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', aliases: ['Slovenija'] },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧', aliases: [] },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴', aliases: [] },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', aliases: ['RSA'] },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', aliases: ['Korea', 'Republic of Korea', 'ROK'] },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸', aliases: [] },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', aliases: ['España', 'Espana'] },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', aliases: ['Ceylon'] },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩', aliases: [] },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷', aliases: [] },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', aliases: ['Sverige'] },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', aliases: ['Schweiz', 'Suisse', 'Svizzera', 'Swiss Confederation'] },
  { code: 'SY', name: 'Syria', flag: '🇸🇾', aliases: ['Syrian Arab Republic'] },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', aliases: ['ROC', 'Republic of China'] },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', aliases: [] },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', aliases: ['United Republic of Tanzania'] },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', aliases: ['Siam'] },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱', aliases: ['East Timor'] },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', aliases: [] },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴', aliases: [] },
  { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹', aliases: ['Trinidad & Tobago'] },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', aliases: [] },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', aliases: ['Türkiye', 'Turkiye'] },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲', aliases: [] },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻', aliases: [] },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', aliases: [] },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', aliases: ['Ukrayina'] },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', aliases: ['UAE', 'Emirates', 'Dubai', 'Abu Dhabi', 'U.A.E.'] },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', aliases: ['UK', 'Great Britain', 'Britain', 'England', 'Scotland', 'Wales', 'U.K.'] },
  { code: 'US', name: 'United States', flag: '🇺🇸', aliases: ['USA', 'United States of America', 'America', 'US', 'U.S.', 'U.S.A.'] },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', aliases: [] },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', aliases: [] },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺', aliases: [] },
  { code: 'VA', name: 'Vatican City', flag: '🇻🇦', aliases: ['Holy See'] },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', aliases: ['Bolivarian Republic of Venezuela'] },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', aliases: ['Viet Nam'] },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪', aliases: [] },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', aliases: [] },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', aliases: [] },
  // Associated territories & dependencies frequently visited by travelers
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', aliases: ['HK'] },
  { code: 'MO', name: 'Macau', flag: '🇲🇴', aliases: ['Macao'] },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷', aliases: [] },
  { code: 'GL', name: 'Greenland', flag: '🇬🇱', aliases: ['Kalaallit Nunaat'] },
  { code: 'FO', name: 'Faroe Islands', flag: '🇫🇴', aliases: ['Faeroe Islands'] },
  { code: 'AW', name: 'Aruba', flag: '🇦🇼', aliases: [] },
  { code: 'CW', name: 'Curaçao', flag: '🇨🇼', aliases: ['Curacao'] },
  { code: 'BM', name: 'Bermuda', flag: '🇧🇲', aliases: [] },
  { code: 'KY', name: 'Cayman Islands', flag: '🇰🇾', aliases: [] },
  { code: 'PF', name: 'French Polynesia', flag: '🇵🇫', aliases: ['Tahiti', 'Bora Bora'] },
  { code: 'RE', name: 'Réunion', flag: '🇷🇪', aliases: ['Reunion'] },
  { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵', aliases: [] },
  { code: 'MQ', name: 'Martinique', flag: '🇲🇶', aliases: [] },
  { code: 'GU', name: 'Guam', flag: '🇬🇺', aliases: [] },
  { code: 'NC', name: 'New Caledonia', flag: '🇳🇨', aliases: [] },
  { code: 'IM', name: 'Isle of Man', flag: '🇮🇲', aliases: ['Mann'] },
  { code: 'JE', name: 'Jersey', flag: '🇯🇪', aliases: [] },
  { code: 'GG', name: 'Guernsey', flag: '🇬🇬', aliases: [] },
  { code: 'GI', name: 'Gibraltar', flag: '🇬🇮', aliases: [] },
  { code: 'VI', name: 'U.S. Virgin Islands', flag: '🇻🇮', aliases: ['US Virgin Islands', 'Virgin Islands (US)'] },
  { code: 'VG', name: 'British Virgin Islands', flag: '🇻🇬', aliases: ['BVI', 'Virgin Islands (British)'] },
  { code: 'TC', name: 'Turks and Caicos Islands', flag: '🇹🇨', aliases: ['Turks and Caicos', 'Turks & Caicos'] },
  { code: 'SX', name: 'Sint Maarten', flag: '🇸🇽', aliases: [] },
  { code: 'MF', name: 'Saint Martin', flag: '🇲🇫', aliases: ['St. Martin'] },
  { code: 'BL', name: 'Saint Barthélemy', flag: '🇧🇱', aliases: ['St. Barts', 'St. Barth', 'Saint Barthelemy'] },
  { code: 'PM', name: 'Saint Pierre and Miquelon', flag: '🇵🇲', aliases: [] },
  { code: 'FK', name: 'Falkland Islands', flag: '🇫🇰', aliases: ['Islas Malvinas'] },
  { code: 'SH', name: 'Saint Helena', flag: '🇸🇭', aliases: ['St. Helena'] },
  { code: 'AI', name: 'Anguilla', flag: '🇦🇮', aliases: [] },
  { code: 'MS', name: 'Montserrat', flag: '🇲🇸', aliases: [] },
  { code: 'AS', name: 'American Samoa', flag: '🇦🇸', aliases: [] },
  { code: 'CK', name: 'Cook Islands', flag: '🇨🇰', aliases: [] },
  { code: 'NU', name: 'Niue', flag: '🇳🇺', aliases: [] },
  { code: 'TK', name: 'Tokelau', flag: '🇹🇰', aliases: [] },
  { code: 'WF', name: 'Wallis and Futuna', flag: '🇼🇫', aliases: ['Wallis & Futuna'] },
  { code: 'MP', name: 'Northern Mariana Islands', flag: '🇲🇵', aliases: ['Saipan'] },
  { code: 'YT', name: 'Mayotte', flag: '🇾🇹', aliases: [] },
  { code: 'GF', name: 'French Guiana', flag: '🇬🇫', aliases: [] },
  { code: 'AX', name: 'Åland Islands', flag: '🇦🇽', aliases: ['Aland Islands', 'Aland'] },
  { code: 'SJ', name: 'Svalbard and Jan Mayen', flag: '🇸🇯', aliases: ['Svalbard'] },
  { code: 'NF', name: 'Norfolk Island', flag: '🇳🇫', aliases: [] },
  { code: 'CX', name: 'Christmas Island', flag: '🇨🇽', aliases: [] },
  { code: 'CC', name: 'Cocos (Keeling) Islands', flag: '🇨🇨', aliases: ['Cocos Islands'] },
  { code: 'PN', name: 'Pitcairn Islands', flag: '🇵🇳', aliases: ['Pitcairn'] },
  { code: 'AQ', name: 'Antarctica', flag: '🇦🇶', aliases: [] },
  { code: 'EH', name: 'Western Sahara', flag: '🇪🇭', aliases: ['Sahrawi'] },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸', aliases: ['State of Palestine'] },
  { code: 'XK', name: 'Kosovo', flag: '🇽🇰', aliases: [] },
  { code: 'BQ', name: 'Bonaire, Sint Eustatius and Saba', flag: '🇧🇶', aliases: ['Bonaire', 'Caribbean Netherlands'] },
  { code: 'IO', name: 'British Indian Ocean Territory', flag: '🇮🇴', aliases: [] },
  { code: 'TF', name: 'French Southern Territories', flag: '🇹🇫', aliases: [] },
  { code: 'GS', name: 'South Georgia and the South Sandwich Islands', flag: '🇬🇸', aliases: [] },
  { code: 'UM', name: 'United States Minor Outlying Islands', flag: '🇺🇲', aliases: [] },
];

/**
 * Normalizes a string by stripping accents/diacritics and lowercasing for reliable matching
 */
function normalizeString(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Fast offline country search matching against canonical name, ISO code, and aliases.
 * Ranks exact matches and prefix matches highest.
 */
export function searchCountries(query: string, maxResults: number = 30): CountryData[] {
  const q = normalizeString(query);
  if (!q) {
    // Return curated popular travel destinations first if query is empty
    const popularCodes = ['JP', 'CH', 'IT', 'IS', 'FR', 'ES', 'PT', 'TH', 'IN', 'US', 'GB', 'AU', 'CA', 'NO', 'GR', 'KZ', 'ID', 'VN', 'NZ', 'AE'];
    const popularMap = new Map(COUNTRIES_DATA.map((c) => [c.code, c]));
    const popularList = popularCodes.map((code) => popularMap.get(code)).filter((c): c is CountryData => Boolean(c));
    const popularSet = new Set(popularCodes);
    const others = COUNTRIES_DATA.filter((c) => !popularSet.has(c.code));
    return [...popularList, ...others].slice(0, maxResults);
  }

  const exactMatches: CountryData[] = [];
  const namePrefixMatches: CountryData[] = [];
  const aliasPrefixMatches: CountryData[] = [];
  const nameContainsMatches: CountryData[] = [];
  const aliasContainsMatches: CountryData[] = [];

  const seenCodes = new Set<string>();

  for (const country of COUNTRIES_DATA) {
    const codeNorm = country.code.toLowerCase();
    const nameNorm = normalizeString(country.name);
    const aliasesNorm = country.aliases.map(normalizeString);

    if (codeNorm === q || nameNorm === q || aliasesNorm.includes(q)) {
      if (!seenCodes.has(country.code)) {
        exactMatches.push(country);
        seenCodes.add(country.code);
      }
      continue;
    }

    if (nameNorm.startsWith(q)) {
      if (!seenCodes.has(country.code)) {
        namePrefixMatches.push(country);
        seenCodes.add(country.code);
      }
      continue;
    }

    if (aliasesNorm.some((a) => a.startsWith(q))) {
      if (!seenCodes.has(country.code)) {
        aliasPrefixMatches.push(country);
        seenCodes.add(country.code);
      }
      continue;
    }

    if (nameNorm.includes(q)) {
      if (!seenCodes.has(country.code)) {
        nameContainsMatches.push(country);
        seenCodes.add(country.code);
      }
      continue;
    }

    if (aliasesNorm.some((a) => a.includes(q))) {
      if (!seenCodes.has(country.code)) {
        aliasContainsMatches.push(country);
        seenCodes.add(country.code);
      }
      continue;
    }
  }

  return [
    ...exactMatches,
    ...namePrefixMatches,
    ...aliasPrefixMatches,
    ...nameContainsMatches,
    ...aliasContainsMatches,
  ].slice(0, maxResults);
}

/**
 * Resolves a country input (name, code, or alias) to its canonical CountryData
 */
export function findCountryByNameOrCode(nameOrCode?: string): CountryData | undefined {
  if (!nameOrCode || typeof nameOrCode !== 'string') return undefined;
  const q = normalizeString(nameOrCode);
  if (!q) return undefined;

  // 1. Direct ISO code match
  if (nameOrCode.length === 2) {
    const byCode = COUNTRIES_DATA.find((c) => c.code.toLowerCase() === q);
    if (byCode) return byCode;
  }

  // 2. Exact name or alias match
  for (const c of COUNTRIES_DATA) {
    if (normalizeString(c.name) === q) return c;
    if (c.aliases.some((a) => normalizeString(a) === q)) return c;
  }

  // 3. Fallback: starts with
  for (const c of COUNTRIES_DATA) {
    if (normalizeString(c.name).startsWith(q)) return c;
  }

  return undefined;
}

/**
 * Normalizes any country string to its canonical official name.
 * If not recognized, returns cleanly trimmed title-cased string.
 */
export function normalizeCountryName(input?: string): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  const found = findCountryByNameOrCode(trimmed);
  if (found) return found.name;

  // Fallback title-case
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Returns flag emoji for a given country name or code
 */
export function getCountryFlagEmoji(countryNameOrCode?: string): string {
  if (!countryNameOrCode) return '🌍';
  const found = findCountryByNameOrCode(countryNameOrCode);
  if (found) return found.flag;
  return '🌍';
}
