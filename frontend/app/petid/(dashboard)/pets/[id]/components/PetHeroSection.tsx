interface PetHeroSectionProps {
  pet: any;
  age: { years: number; months: number } | null;
}

export default function PetHeroSection({ pet, age }: PetHeroSectionProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-8 text-white">
      <div className="flex items-center gap-6">
        {/* Фото питомца */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center text-6xl backdrop-blur-sm border-4 border-white/30">
            {pet.species_name === 'Собака' ? '🐕' : '🐈'}
          </div>
        </div>

        {/* Основная информация */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">{pet.name}</h1>
            <span className="text-2xl">{pet.gender === 'male' ? '♂' : '♀'}</span>
          </div>

          <div className="flex flex-wrap gap-4 text-lg">
            <div className="flex items-center gap-2">
              <span className="opacity-80">Вид:</span>
              <span className="font-semibold">{pet.species_name}</span>
            </div>

            {pet.breed_name && (
              <div className="flex items-center gap-2">
                <span className="opacity-80">•</span>
                <span className="opacity-80">Порода:</span>
                <span className="font-semibold">{pet.breed_name}</span>
              </div>
            )}

            {age && (
              <div className="flex items-center gap-2">
                <span className="opacity-80">•</span>
                <span className="opacity-80">Возраст:</span>
                <span className="font-semibold">
                  {age.years} {age.years === 1 ? 'год' : age.years < 5 ? 'года' : 'лет'}{' '}
                  {age.months} {age.months === 1 ? 'мес' : 'мес'}
                </span>
              </div>
            )}
          </div>

          {/* Дополнительные бейджи */}
          <div className="flex gap-2 mt-4">
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">
              {pet.relationship === 'owner' ? '👤 Владелец' : '🔧 Куратор'}
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">
              ID: #{pet.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
