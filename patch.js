const fs = require('fs');
const file = 'frontend/app/main/(main)/orgs/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('const [autoFilterDisabled, setAutoFilterDisabled] = useState(false); // Флаг отключения автофильтра\n  const isAutoSettingRef = useRef(false); // Используем ref вместо state',
`const [autoFilterDisabled, setAutoFilterDisabled] = useState(false);
  const isAutoSettingRef = useRef(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const FilterOptions = () => (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-gray-900 mb-3">Тип организации</h3>
        <div className="space-y-2">
          {['all', 'shelter', 'vet_clinic', 'pet_shop', 'foundation', 'kennel', 'other'].map(type => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" value={type} checked={filterType === type} onChange={(e) => setFilterType(e.target.value)} className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-700">
                {type === 'all' ? 'Все типы' : type === 'shelter' ? 'Приюты' : type === 'vet_clinic' ? 'Ветклиники' : type === 'pet_shop' ? 'Зоомагазины' : type === 'foundation' ? 'Фонды' : type === 'kennel' ? 'Кинологические центры' : 'Другое'}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-gray-900 mb-3">Местоположение</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Регион</label>
            <select value={filterRegion} onChange={(e) => { setFilterRegion(e.target.value); if (e.target.value === "all") setAutoFilterDisabled(true); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="all">Все регионы</option>
              {allRegions.map((region) => (<option key={region} value={region}>{region}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Город</label>
            <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} disabled={filterRegion === "all"} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-50 disabled:text-gray-400">
              <option value="all">Все города</option>
              {cities.filter((c) => c !== "all").map((city) => (<option key={city} value={city}>{city}</option>))}
            </select>
          </div>
        </div>
      </div>
    </>
  );`);

content = content.replace('    <div className="flex gap-4">\n      {/* Middle column - Organizations list */}\n      <div className="w-full xl:w-[600px] xl:flex-shrink-0">',
`    <div className="flex flex-col xl:flex-row gap-4">
      {/* Mobile Top Controls */}
      <div className="xl:hidden w-full space-y-2.5">
        <button onClick={() => router.push('/orgs/create')} className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm shadow-sm border border-blue-600">
          Создать организацию
        </button>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Поиск..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5m4.5 12h9.75M9 18a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5m11.25-6h2.25m-2.25 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5" /></svg>
              Фильтры
            </button>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Найдено: <span className="font-semibold text-gray-900">{filteredOrganizations.length}</span>
          </div>
        </div>
        
        {showMobileFilters && (
          <div className="space-y-2.5 animate-in slide-in-from-top-2 duration-200">
            <FilterOptions />
            <button onClick={() => setShowMobileFilters(false)} className="w-full py-2.5 bg-gray-800 text-white rounded-lg font-medium text-sm mt-2">Применить</button>
          </div>
        )}
      </div>

      {/* Middle column - Organizations list */}
      <div className="w-full xl:w-[600px] xl:flex-shrink-0">`);

// Replace the verbose Type/Location filters in aside with <FilterOptions />
let asideStart = content.indexOf('{/* Type Filter */}');
let asideEnd = content.indexOf('</aside>');
if (asideStart > -1 && asideEnd > -1) {
  content = content.substring(0, asideStart) + '<FilterOptions />\n        </div>\n      ' + content.substring(asideEnd);
}

fs.writeFileSync(file, content);
console.log("Done patching");
