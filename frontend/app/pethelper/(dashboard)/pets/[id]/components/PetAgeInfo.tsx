interface PetAgeInfoProps {
  isEditing: boolean;
  pet: any;
  editData: any;
  setEditData: (data: any) => void;
  birthDateType: 'exact' | 'approximate';
  setBirthDateType: (type: 'exact' | 'approximate') => void;
  calculateBirthDate: (years: number, months: number) => void;
  age: { years: number; months: number } | null;
}

export default function PetAgeInfo({
  isEditing,
  pet,
  editData,
  setEditData,
  birthDateType,
  setBirthDateType,
  calculateBirthDate,
  age,
}: PetAgeInfoProps) {
  return (
    <div>
      <div className="space-y-4">
        {/* Дата рождения */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Дата рождения</label>
          {isEditing ? (
            <>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={birthDateType === 'exact'}
                    onChange={() => {
                      setBirthDateType('exact');
                      setEditData({
                        ...editData,
                        age_type: 'exact',
                        approximate_years: 0,
                        approximate_months: 0,
                      });
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">Точная дата</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={birthDateType === 'approximate'}
                    onChange={() => {
                      setBirthDateType('approximate');
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">Примерный возраст</span>
                </label>
              </div>

              {birthDateType === 'exact' ? (
                <input
                  type="date"
                  value={editData.birth_date}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      birth_date: e.target.value,
                      age_type: 'exact',
                      approximate_years: 0,
                      approximate_months: 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Лет</label>
                      <select
                        value={editData.approximate_years}
                        onChange={(e) => {
                          const years = Number(e.target.value);
                          setEditData({ ...editData, approximate_years: years });
                          calculateBirthDate(years, editData.approximate_months);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {[...Array(21)].map((_, i) => (
                          <option key={i} value={i}>
                            {i}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Месяцев</label>
                      <select
                        value={editData.approximate_months}
                        onChange={(e) => {
                          const months = Number(e.target.value);
                          setEditData({ ...editData, approximate_months: months });
                          calculateBirthDate(editData.approximate_years, months);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {[...Array(12)].map((_, i) => (
                          <option key={i} value={i}>
                            {i}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {(editData.approximate_years > 0 || editData.approximate_months > 0) && (
                    <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      📅 Примерная дата рождения:{' '}
                      {editData.birth_date
                        ? new Date(editData.birth_date).toLocaleDateString('ru-RU')
                        : '-'}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-lg text-gray-900 font-medium">
                📅{' '}
                {pet.birth_date
                  ? new Date(pet.birth_date).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Не указана'}
              </p>
              {pet.age_type === 'approximate' && (
                <p className="text-sm text-gray-500 mt-1">
                  ⚠️ Примерный возраст при регистрации: {pet.approximate_years}{' '}
                  {pet.approximate_years === 1 ? 'год' : 'лет'} {pet.approximate_months}{' '}
                  {pet.approximate_months === 1 ? 'месяц' : 'месяцев'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Текущий возраст */}
        {!isEditing && age && (
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Текущий возраст</label>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-2xl text-blue-900 font-bold">
                🎂 {age.years} {age.years === 1 ? 'год' : age.years < 5 ? 'года' : 'лет'}{' '}
                {age.months} {age.months === 1 ? 'месяц' : age.months < 5 ? 'месяца' : 'месяцев'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
