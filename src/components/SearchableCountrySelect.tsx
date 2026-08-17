import React, { useState, useEffect, useMemo, useRef } from 'react';
import { safeJson } from '@/lib/utils';
import { Search, ChevronDown, Check, Globe } from 'lucide-react';

export interface CountryItem {
  id?: string;
  name: string;
  iso_code: string;
  phone_code: string;
  is_active?: number;
}

export const FALLBACK_COUNTRIES: CountryItem[] = [
  { name: "Afghanistan", iso_code: "AF", phone_code: "+93" },
  { name: "Albania", iso_code: "AL", phone_code: "+355" },
  { name: "Algeria", iso_code: "DZ", phone_code: "+213" },
  { name: "Andorra", iso_code: "AD", phone_code: "+376" },
  { name: "Angola", iso_code: "AO", phone_code: "+244" },
  { name: "Argentina", iso_code: "AR", phone_code: "+54" },
  { name: "Armenia", iso_code: "AM", phone_code: "+374" },
  { name: "Australia", iso_code: "AU", phone_code: "+61" },
  { name: "Austria", iso_code: "AT", phone_code: "+43" },
  { name: "Azerbaijan", iso_code: "AZ", phone_code: "+994" },
  { name: "Bahamas", iso_code: "BS", phone_code: "+1" },
  { name: "Bahrain", iso_code: "BH", phone_code: "+973" },
  { name: "Bangladesh", iso_code: "BD", phone_code: "+880" },
  { name: "Barbados", iso_code: "BB", phone_code: "+1" },
  { name: "Belarus", iso_code: "BY", phone_code: "+375" },
  { name: "Belgium", iso_code: "BE", phone_code: "+32" },
  { name: "Belize", iso_code: "BZ", phone_code: "+501" },
  { name: "Benin", iso_code: "BJ", phone_code: "+229" },
  { name: "Bhutan", iso_code: "BT", phone_code: "+975" },
  { name: "Bolivia", iso_code: "BO", phone_code: "+591" },
  { name: "Bosnia and Herzegovina", iso_code: "BA", phone_code: "+387" },
  { name: "Botswana", iso_code: "BW", phone_code: "+267" },
  { name: "Brazil", iso_code: "BR", phone_code: "+55" },
  { name: "Brunei", iso_code: "BN", phone_code: "+673" },
  { name: "Bulgaria", iso_code: "BG", phone_code: "+359" },
  { name: "Burkina Faso", iso_code: "BF", phone_code: "+226" },
  { name: "Burundi", iso_code: "BI", phone_code: "+257" },
  { name: "Cambodia", iso_code: "KH", phone_code: "+855" },
  { name: "Cameroon", iso_code: "CM", phone_code: "+237" },
  { name: "Canada", iso_code: "CA", phone_code: "+1" },
  { name: "Chad", iso_code: "TD", phone_code: "+235" },
  { name: "Chile", iso_code: "CL", phone_code: "+56" },
  { name: "China", iso_code: "CN", phone_code: "+86" },
  { name: "Colombia", iso_code: "CO", phone_code: "+57" },
  { name: "Costa Rica", iso_code: "CR", phone_code: "+506" },
  { name: "Croatia", iso_code: "HR", phone_code: "+385" },
  { name: "Cuba", iso_code: "CU", phone_code: "+53" },
  { name: "Cyprus", iso_code: "CY", phone_code: "+357" },
  { name: "Czech Republic", iso_code: "CZ", phone_code: "+420" },
  { name: "Denmark", iso_code: "DK", phone_code: "+45" },
  { name: "Dominican Republic", iso_code: "DO", phone_code: "+1" },
  { name: "Ecuador", iso_code: "EC", phone_code: "+593" },
  { name: "Egypt", iso_code: "EG", phone_code: "+20" },
  { name: "El Salvador", iso_code: "SV", phone_code: "+503" },
  { name: "Estonia", iso_code: "EE", phone_code: "+372" },
  { name: "Ethiopia", iso_code: "ET", phone_code: "+251" },
  { name: "Fiji", iso_code: "FJ", phone_code: "+679" },
  { name: "Finland", iso_code: "FI", phone_code: "+358" },
  { name: "France", iso_code: "FR", phone_code: "+33" },
  { name: "Gabon", iso_code: "GA", phone_code: "+241" },
  { name: "Gambia", iso_code: "GM", phone_code: "+220" },
  { name: "Georgia", iso_code: "GE", phone_code: "+995" },
  { name: "Germany", iso_code: "DE", phone_code: "+49" },
  { name: "Ghana", iso_code: "GH", phone_code: "+233" },
  { name: "Greece", iso_code: "GR", phone_code: "+30" },
  { name: "Guatemala", iso_code: "GT", phone_code: "+502" },
  { name: "Guyana", iso_code: "GY", phone_code: "+592" },
  { name: "Haiti", iso_code: "HT", phone_code: "+509" },
  { name: "Honduras", iso_code: "HN", phone_code: "+504" },
  { name: "Hong Kong", iso_code: "HK", phone_code: "+852" },
  { name: "Hungary", iso_code: "HU", phone_code: "+36" },
  { name: "Iceland", iso_code: "IS", phone_code: "+354" },
  { name: "India", iso_code: "IN", phone_code: "+91" },
  { name: "Indonesia", iso_code: "ID", phone_code: "+62" },
  { name: "Iran", iso_code: "IR", phone_code: "+98" },
  { name: "Iraq", iso_code: "IQ", phone_code: "+964" },
  { name: "Ireland", iso_code: "IE", phone_code: "+353" },
  { name: "Israel", iso_code: "IL", phone_code: "+972" },
  { name: "Italy", iso_code: "IT", phone_code: "+39" },
  { name: "Ivory Coast", iso_code: "CI", phone_code: "+225" },
  { name: "Jamaica", iso_code: "JM", phone_code: "+1" },
  { name: "Japan", iso_code: "JP", phone_code: "+81" },
  { name: "Jordan", iso_code: "JO", phone_code: "+962" },
  { name: "Kazakhstan", iso_code: "KZ", phone_code: "+7" },
  { name: "Kenya", iso_code: "KE", phone_code: "+254" },
  { name: "Kuwait", iso_code: "KW", phone_code: "+965" },
  { name: "Kyrgyzstan", iso_code: "KG", phone_code: "+996" },
  { name: "Laos", iso_code: "LA", phone_code: "+856" },
  { name: "Latvia", iso_code: "LV", phone_code: "+371" },
  { name: "Lebanon", iso_code: "LB", phone_code: "+961" },
  { name: "Lesotho", iso_code: "LS", phone_code: "+266" },
  { name: "Liberia", iso_code: "LR", phone_code: "+231" },
  { name: "Libya", iso_code: "LY", phone_code: "+218" },
  { name: "Liechtenstein", iso_code: "LI", phone_code: "+423" },
  { name: "Lithuania", iso_code: "LT", phone_code: "+370" },
  { name: "Luxembourg", iso_code: "LU", phone_code: "+352" },
  { name: "Macau", iso_code: "MO", phone_code: "+853" },
  { name: "Madagascar", iso_code: "MG", phone_code: "+261" },
  { name: "Malawi", iso_code: "MW", phone_code: "+265" },
  { name: "Malaysia", iso_code: "MY", phone_code: "+60" },
  { name: "Maldives", iso_code: "MV", phone_code: "+960" },
  { name: "Mali", iso_code: "ML", phone_code: "+223" },
  { name: "Malta", iso_code: "MT", phone_code: "+356" },
  { name: "Mauritius", iso_code: "MU", phone_code: "+230" },
  { name: "Mexico", iso_code: "MX", phone_code: "+52" },
  { name: "Moldova", iso_code: "MD", phone_code: "+373" },
  { name: "Monaco", iso_code: "MC", phone_code: "+377" },
  { name: "Mongolia", iso_code: "MN", phone_code: "+976" },
  { name: "Montenegro", iso_code: "ME", phone_code: "+382" },
  { name: "Morocco", iso_code: "MA", phone_code: "+212" },
  { name: "Mozambique", iso_code: "MZ", phone_code: "+258" },
  { name: "Myanmar", iso_code: "MM", phone_code: "+95" },
  { name: "Namibia", iso_code: "NA", phone_code: "+264" },
  { name: "Nepal", iso_code: "NP", phone_code: "+977" },
  { name: "Netherlands", iso_code: "NL", phone_code: "+31" },
  { name: "New Zealand", iso_code: "NZ", phone_code: "+64" },
  { name: "Nicaragua", iso_code: "NI", phone_code: "+505" },
  { name: "Niger", iso_code: "NE", phone_code: "+227" },
  { name: "Nigeria", iso_code: "NG", phone_code: "+234" },
  { name: "North Macedonia", iso_code: "MK", phone_code: "+389" },
  { name: "Norway", iso_code: "NO", phone_code: "+47" },
  { name: "Oman", iso_code: "OM", phone_code: "+968" },
  { name: "Pakistan", iso_code: "PK", phone_code: "+92" },
  { name: "Panama", iso_code: "PA", phone_code: "+507" },
  { name: "Papua New Guinea", iso_code: "PG", phone_code: "+675" },
  { name: "Paraguay", iso_code: "PY", phone_code: "+595" },
  { name: "Peru", iso_code: "PE", phone_code: "+51" },
  { name: "Philippines", iso_code: "PH", phone_code: "+63" },
  { name: "Poland", iso_code: "PL", phone_code: "+48" },
  { name: "Portugal", iso_code: "PT", phone_code: "+351" },
  { name: "Qatar", iso_code: "QA", phone_code: "+974" },
  { name: "Romania", iso_code: "RO", phone_code: "+40" },
  { name: "Russia", iso_code: "RU", phone_code: "+7" },
  { name: "Rwanda", iso_code: "RW", phone_code: "+250" },
  { name: "Saudi Arabia", iso_code: "SA", phone_code: "+966" },
  { name: "Senegal", iso_code: "SN", phone_code: "+221" },
  { name: "Serbia", iso_code: "RS", phone_code: "+381" },
  { name: "Seychelles", iso_code: "SC", phone_code: "+248" },
  { name: "Sierra Leone", iso_code: "SL", phone_code: "+232" },
  { name: "Singapore", iso_code: "SG", phone_code: "+65" },
  { name: "Slovakia", iso_code: "SK", phone_code: "+421" },
  { name: "Slovenia", iso_code: "SI", phone_code: "+386" },
  { name: "Somalia", iso_code: "SO", phone_code: "+252" },
  { name: "South Africa", iso_code: "ZA", phone_code: "+27" },
  { name: "South Korea", iso_code: "KR", phone_code: "+82" },
  { name: "South Sudan", iso_code: "SS", phone_code: "+211" },
  { name: "Spain", iso_code: "ES", phone_code: "+34" },
  { name: "Sri Lanka", iso_code: "LK", phone_code: "+94" },
  { name: "Sudan", iso_code: "SD", phone_code: "+249" },
  { name: "Suriname", iso_code: "SR", phone_code: "+597" },
  { name: "Sweden", iso_code: "SE", phone_code: "+46" },
  { name: "Switzerland", iso_code: "CH", phone_code: "+41" },
  { name: "Syria", iso_code: "SY", phone_code: "+963" },
  { name: "Taiwan", iso_code: "TW", phone_code: "+886" },
  { name: "Tajikistan", iso_code: "TJ", phone_code: "+992" },
  { name: "Tanzania", iso_code: "TZ", phone_code: "+255" },
  { name: "Thailand", iso_code: "TH", phone_code: "+66" },
  { name: "Togo", iso_code: "TG", phone_code: "+228" },
  { name: "Trinidad and Tobago", iso_code: "TT", phone_code: "+1" },
  { name: "Tunisia", iso_code: "TN", phone_code: "+216" },
  { name: "Turkey", iso_code: "TR", phone_code: "+90" },
  { name: "Turkmenistan", iso_code: "TM", phone_code: "+993" },
  { name: "Uganda", iso_code: "UG", phone_code: "+256" },
  { name: "Ukraine", iso_code: "UA", phone_code: "+380" },
  { name: "United Arab Emirates", iso_code: "AE", phone_code: "+971" },
  { name: "United Kingdom", iso_code: "GB", phone_code: "+44" },
  { name: "United States", iso_code: "US", phone_code: "+1" },
  { name: "Uruguay", iso_code: "UY", phone_code: "+598" },
  { name: "Uzbekistan", iso_code: "UZ", phone_code: "+998" },
  { name: "Venezuela", iso_code: "VE", phone_code: "+58" },
  { name: "Vietnam", iso_code: "VN", phone_code: "+84" },
  { name: "Yemen", iso_code: "YE", phone_code: "+967" },
  { name: "Zambia", iso_code: "ZM", phone_code: "+260" },
  { name: "Zimbabwe", iso_code: "ZW", phone_code: "+263" }
];

interface SearchableCountrySelectProps {
  value?: string;
  onChange: (country: CountryItem) => void;
  mode?: 'name' | 'phone' | 'iso';
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableCountrySelect({
  value,
  onChange,
  mode = 'name',
  placeholder = 'Select Country...',
  className = '',
  disabled = false
}: SearchableCountrySelectProps) {
  const [countries, setCountries] = useState<CountryItem[]>(FALLBACK_COUNTRIES);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/countries')
      .then(res => safeJson(res, { success: false, countries: [] }))
      .then(data => {
        if (data && data.success && Array.isArray(data.countries) && data.countries.length > 0) {
          setCountries(data.countries);
        }
      })
      .catch(err => {
        console.warn("Using fallback countries list:", err);
      });
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCountry = useMemo(() => {
    if (!value) return null;
    const valLower = value.trim().toLowerCase();
    if (mode === 'phone') {
      return countries.find(c => c.phone_code.toLowerCase() === valLower) ||
             countries.find(c => c.name.toLowerCase() === valLower);
    }
    if (mode === 'iso') {
      return countries.find(c => c.iso_code.toLowerCase() === valLower) ||
             countries.find(c => c.name.toLowerCase() === valLower);
    }
    return countries.find(c => c.name.toLowerCase() === valLower) ||
           countries.find(c => c.iso_code.toLowerCase() === valLower) ||
           countries.find(c => c.phone_code.toLowerCase() === valLower);
  }, [value, countries, mode]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;
    const q = searchQuery.toLowerCase().trim();
    return countries.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.iso_code.toLowerCase().includes(q) ||
      c.phone_code.toLowerCase().includes(q)
    );
  }, [countries, searchQuery]);

  const handleSelect = (country: CountryItem) => {
    onChange(country);
    setIsOpen(false);
    setSearchQuery('');
  };

  const displayLabel = useMemo(() => {
    if (selectedCountry) {
      if (mode === 'phone') return `${selectedCountry.phone_code} (${selectedCountry.iso_code})`;
      if (mode === 'iso') return `${selectedCountry.name} (${selectedCountry.iso_code})`;
      return selectedCountry.name;
    }
    return value || placeholder;
  }, [selectedCountry, value, mode, placeholder]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-3.5 py-2 bg-slate-900/80 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl text-slate-200 text-sm flex items-center justify-between shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <span className="flex items-center gap-2 truncate font-medium">
          <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[260px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in-50 zoom-in-95">
          {/* Search Bar */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/60">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Search by country or +dial code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 px-1 flex justify-between">
              <span>Showing {filteredCountries.length} countries</span>
              <span className="text-indigo-400">Type to search</span>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                No country found for "{searchQuery}"
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = selectedCountry?.iso_code === country.iso_code;
                return (
                  <button
                    key={country.iso_code}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full px-3 py-2 text-left text-xs rounded-lg flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                        : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/50 text-slate-300 font-semibold">
                        {country.iso_code}
                      </span>
                      <span className="truncate">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="font-mono text-[11px] text-emerald-400 font-medium">
                        {country.phone_code}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
