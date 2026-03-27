import Link from 'next/link';
import { HomeIcon, HeartIcon } from '@heroicons/react/24/outline';

export default function PromoActionCard() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-sm border border-blue-100 p-5 mb-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-100 rounded-full opacity-50 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-purple-100 rounded-full opacity-50 blur-2xl pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
            <span className="text-xl">✨</span>
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-[17px] leading-tight">
              У вас есть питомец?
            </h3>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Откройте полезные функции Зооплатформы
            </p>
          </div>
        </div>
        
        <p className="text-[14px] text-gray-600 mb-4 leading-relaxed">
          Ведите электронную медкарту, сохраняйте историю прививок и общайтесь с другими владельцами в вашем городе.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link 
            href="/owner" 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 px-4 rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5"
          >
            Кабинет владельца
          </Link>
          <Link 
            href="/pethelper" 
            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-center py-2.5 px-4 rounded-xl text-sm font-bold border border-gray-200 shadow-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
          >
            <HeartIcon className="w-4 h-4 text-purple-500" />
            <span>Стать волонтером</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
