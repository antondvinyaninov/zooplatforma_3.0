import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, Handshake, Heart, UserSquare2, Stethoscope, UserCircle, 
  Home, Users, Search, Building2, LifeBuoy, PawPrint, CheckCircle2, 
  AlertTriangle, Lightbulb, Globe, BrainCircuit, Store, Hotel, Cross, 
  ClipboardList, CalendarDays, GraduationCap, MessageSquareWarning, 
  PhoneCall, BookOpen, Smartphone, HeartHandshake, FileSearch, ArrowRight, Activity, Target
} from 'lucide-react';
import Header from '@/components/main/layout/Header';
import { AuthProvider } from '../../contexts/AuthContext';

export const metadata = {
  title: 'О платформе | ZooPlatforma',
  description: 'ЗооПлатформа — единая цифровая среда, которая объединяет владельцев, волонтеров, приюты, клиники и государство.',
};

export default function AboutPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 selection:bg-blue-200">
        <Header />
      
      <main className="overflow-hidden">
        {/* 1. Hero Section - Glassmorphism & Animated Gradients */}
        <section className="relative pt-24 pb-32 lg:pt-32 lg:pb-40 overflow-hidden flex items-center justify-center">
          {/* Animated background elements */}
          <div className="absolute inset-0 z-0 bg-slate-50">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-blue-400/20 blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-emerald-400/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-400/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>

          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-slate-200 shadow-sm mb-8 hover:scale-105 transition-transform cursor-default">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <span className="text-sm font-medium text-slate-800 tracking-wide uppercase">О проекте</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 pb-2">ЗооПлатформа</span>
              — единая цифровая среда
            </h1>

            <p className="text-xl sm:text-2xl text-slate-600 leading-relaxed max-w-4xl mx-auto mb-12">
              которая объединяет любящих владельцев, неравнодушных волонтеров, заботливые приюты, ветклиники и государство.
            </p>

            <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl p-6 md:p-8 max-w-2xl mx-auto transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Lightbulb className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-lg font-semibold text-slate-800 leading-relaxed">
                  Самое простое объяснение того, что такое ЗооПлатформа — <span className="text-blue-600">это аналог Госуслуг для животных.</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Mission and Values - Light Grid */}
        <section className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-100 relative z-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center max-w-4xl mx-auto">
              <h2 className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-4">Миссия и ценности</h2>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-8">
                Главная цель — предотвращение появления новых бездомных животных на улице.
              </p>
              <p className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto font-medium">
                Уверен, этот вопрос можно решить гуманным способом. Опираясь на лучшие мировые практики зоозащиты и этический кодекс волонтеров, платформа строится на следующих принципах:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[
                { 
                  theme: { bg: "bg-blue-50/70", border: "border-blue-200", text: "text-blue-900", hover: "group-hover:bg-blue-100/50", glow: "bg-blue-300/20 group-hover:bg-blue-400/30" },
                  title: "Прозрачность и знания", 
                  desc: "Все данные, действия и судьбы хвостиков абсолютно подтверждаемы, мы следим за историей питомца от рождения до конца жизни, исключая «чёрные ящики» в сборах или пристройстве." 
                },
                { 
                  theme: { bg: "bg-emerald-50/70", border: "border-emerald-200", text: "text-emerald-900", hover: "group-hover:bg-emerald-100/50", glow: "bg-emerald-300/20 group-hover:bg-emerald-400/30" },
                  title: "Персональная ответственность и просвещение", 
                  desc: "Экосистема формирует культуру, где больше невозможно безнаказанно оставить питомца на улице. Мы активно противостоим бесконтрольному «черному» разведению, аргументированно призывая к зооответственности окружающих. В перспективе, благодаря авторизации через ЕСИА (Госуслуги), полностью исключается создание анонимных аккаунтов, что делает ответственность прозрачной и абсолютной." 
                },
                { 
                  theme: { bg: "bg-rose-50/70", border: "border-rose-200", text: "text-rose-900", hover: "group-hover:bg-rose-100/50", glow: "bg-rose-300/20 group-hover:bg-rose-400/30" },
                  title: "Уважение к животным и к людям", 
                  desc: "Мы признаем, что каждое животное обладает уникальными видоспецифичными потребностями и заслуживает бережного отношения. В равной степени мы относимся с достоинством и уважением ко всем людям — участникам платформы и тем, кто находится за ее пределами." 
                },
                { 
                  theme: { bg: "bg-purple-50/70", border: "border-purple-200", text: "text-purple-900", hover: "group-hover:bg-purple-100/50", glow: "bg-purple-300/20 group-hover:bg-purple-400/30" },
                  title: "Командная работа и сила сообщества", 
                  desc: "Зоозащита — это общее дело. Платформа превращает разобщенный путь спасения в скоординированную среду, где важны взаимопомощь, прозрачное сотрудничество команд и взаимоуважение." 
                },
                { 
                  theme: { bg: "bg-amber-50/70", border: "border-amber-200", text: "text-amber-900", hover: "group-hover:bg-amber-100/50", glow: "bg-amber-300/20 group-hover:bg-amber-400/30" },
                  title: "Постоянное развитие и инициатива", 
                  desc: "Платформа поощряет постоянное повышение квалификации, изучение лучших практик помощи животным и всегда открыта к новым идеям по совершенствованию системы от самих пользователей." 
                },
                { 
                  theme: { bg: "bg-teal-50/70", border: "border-teal-200", text: "text-teal-900", hover: "group-hover:bg-teal-100/50", glow: "bg-teal-300/20 group-hover:bg-teal-400/30" },
                  title: "Главный принцип — «Не навреди»", 
                  desc: "Любые решения, действия и новые инструменты платформы создаются и оцениваются через призму безопасности и безусловной пользы как для животных, так и для их опекунов или волонтеров." 
                }
              ].map((item, idx) => (
                <div key={idx} className={`rounded-3xl p-8 border hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group ${item.theme.bg} ${item.theme.border} ${item.theme.hover}`}>
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl transition-colors duration-500 transform translate-x-1/2 -translate-y-1/2 ${item.theme.glow}`}></div>
                  <h3 className={`text-xl font-bold mb-4 leading-snug relative z-10 ${item.theme.text}`}>{item.title}</h3>
                  <p className="text-slate-700 leading-relaxed text-sm lg:text-[15px] relative z-10 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Problems Section - Premium Alternating Layout */}
        <section className="py-24 lg:py-32 bg-slate-50 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Subtle background waves */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>

          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto mb-24">
              <h2 className="text-indigo-600 font-bold tracking-widest uppercase text-sm mb-4">Разбор ситуации</h2>
              <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-tight">Какие проблемы и задачи решает платформа в первую очередь</h3>
              <p className="text-xl text-slate-600 leading-relaxed font-medium">
                Проблем и задач в сфере домашних животных очень много, как, впрочем, и в любых других сферах. Но вместо бесконечной борьбы с последствиями, предлагается сконцентрироваться на предотвращении, и для этого выделены три основные причины, без устранения которых невозможно продвинуться в решении вопроса бездомных животных:
              </p>
            </div>

            <div className="space-y-24 lg:space-y-32">
              {/* Problem 1 */}
              <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                <div className="flex-1 w-full relative">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-rose-100 to-red-50 rounded-[3rem] transform -rotate-2"></div>
                  <div className="relative bg-white p-10 sm:p-12 rounded-[2.5rem] shadow-xl border border-red-100/50">
                    <div className="absolute -top-8 -left-8 w-24 h-24 bg-red-600 text-white rounded-3xl flex items-center justify-center font-black text-5xl shadow-lg transform rotate-3">1</div>
                    <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-8 ml-auto">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <span className="inline-block text-sm font-bold uppercase tracking-wider text-red-600 bg-red-50 px-4 py-2 rounded-full mb-6">А с кем боремся?</span>
                    <h4 className="text-3xl font-extrabold text-slate-900 mb-6 leading-tight">Свободный уход от ответственности</h4>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      Общество привыкло бороться с последствиями в виде бездомных животных на улицах, забывая об их первопричине — безответственных людях. Это те, кто допускает бесконтрольный выгул, отказывается от стерилизации или безответственно разводит животных ради выгоды, а затем избавляется от них.
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 w-full lg:pl-10">
                  <div className="bg-gradient-to-br from-red-600 to-rose-700 p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <h5 className="font-bold flex items-center gap-3 mb-6 text-lg uppercase tracking-wider text-red-100">
                      <CheckCircle2 className="w-6 h-6 text-white" /> Как мы это решаем
                    </h5>
                    <p className="text-2xl font-medium leading-relaxed">
                      Платформа делает такое поведение невозможным: благодаря единой электронной регистрации каждое животное навсегда привязано к конкретному человеку, и любой отказ немедленно фиксируется.
                    </p>
                  </div>
                </div>
              </div>

              {/* Problem 2 */}
              <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
                <div className="flex-1 w-full relative">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-amber-100 to-orange-50 rounded-[3rem] transform rotate-2"></div>
                  <div className="relative bg-white p-10 sm:p-12 rounded-[2.5rem] shadow-xl border border-amber-100/50">
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-amber-500 text-white rounded-3xl flex items-center justify-center font-black text-5xl shadow-lg transform -rotate-3">2</div>
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-8">
                      <Users className="w-8 h-8" />
                    </div>
                    <span className="inline-block text-sm font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-4 py-2 rounded-full mb-6">Лебедь, рак и щука</span>
                    <h4 className="text-3xl font-extrabold text-slate-900 mb-6 leading-tight">Разобщенность</h4>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      Огромное количество волонтеров, приютов, клиник и просто неравнодушных людей искренне хотят помочь, но все они тянут в разные стороны. Волонтеры разобщены, муниципалитеты не видят реальной картины отлова и содержания (ОСВВ), а обычным людям не хватает образовательных программ.
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 w-full lg:pr-10">
                  <div className="bg-gradient-to-bl from-amber-500 to-orange-600 p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                    <h5 className="font-bold flex items-center gap-3 mb-6 text-lg uppercase tracking-wider text-orange-100">
                      <CheckCircle2 className="w-6 h-6 text-white" /> Как мы это решаем
                    </h5>
                    <p className="text-2xl font-medium leading-relaxed">
                      Платформа создает прозрачную систему совместной работы, объединяя все разрозненные группы в единую среду, где усилия работают на общий, измеримый результат.
                    </p>
                  </div>
                </div>
              </div>

              {/* Problem 3 - Classic 2-Block Layout (Solution Left, Problem Right) */}
              <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mt-20 mb-20 max-w-[1200px] mx-auto">
                
                {/* Left Side: The Solution */}
                <div className="flex-1 w-full lg:max-w-md lg:mr-4 z-20">
                  <div className="bg-[#3b82f6] p-8 sm:p-10 rounded-[2.5rem] shadow-[0_15px_40px_-10px_rgba(59,130,246,0.3)] text-white relative lg:scale-105">
                    <h5 className="font-bold flex items-center gap-3 mb-6 text-xs uppercase tracking-widest text-[#e0e7ff]">
                      <CheckCircle2 className="w-5 h-5 text-white" /> КАК МЫ ЭТО РЕШАЕМ
                    </h5>
                    <p className="text-[16px] sm:text-[18px] leading-relaxed font-medium mb-6">
                      Единая система дает четкие цифры для государства и понятную прозрачность для общества, предоставляя механизм контроля, необходимый для того, чтобы правильные законы начали работать.
                    </p>
                    <p className="text-[14px] sm:text-[15px] leading-relaxed text-[#bfdbfe]">
                      Она объединяет разрозненные данные, позволяя перейти от слепого устранения последствий к системному управлению отраслью.
                    </p>
                  </div>
                </div>

                {/* Right Side: The Main Problem */}
                <div className="flex-[1.5] w-full relative z-10 pt-6 pr-6 lg:ml-8">
                  {/* Background Offset Card (Подложка) */}
                  <div className="absolute inset-x-0 inset-y-0 bg-blue-50/80 rounded-[3rem] -z-10 -mr-4 -mt-4 sm:-mr-8 sm:-mt-8 ml-4 mb-4 sm:ml-8 sm:mb-8 flex justify-end">
                    {/* Floating Number attached to background card (like screenshot) */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#3b82f6] text-white rounded-[1.5rem] rounded-bl-sm flex items-center justify-center font-black text-4xl sm:text-5xl shadow-xl transform translate-x-4 sm:translate-x-8 -translate-y-4 sm:-translate-y-8 absolute top-0 right-0 border-4 border-white">3</div>
                  </div>
                  
                  {/* Main White Card */}
                  <div className="bg-white p-10 sm:p-12 md:p-14 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-50 relative h-full">
                    <div className="mb-8 inline-block">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-[#3b82f6] bg-blue-50 px-4 py-2 rounded-full">ЛЕБЕДЬ, РАК И ЩУКА</span>
                    </div>
                    
                    <h4 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-8 leading-tight pr-10">Отсутствие цифр и контроля</h4>

                    {/* Integrated highlight block imitating the 2nd cloud content */}
                    <div className="bg-[#f0f6ff] p-6 rounded-2xl mb-6">
                      <h5 className="text-[16px] sm:text-[17px] text-[#1e40af] leading-relaxed font-bold">
                        На данный момент не существует ни единой методологии подсчета бездомных животных, ни организации, которая бы несла глобальную ответственность.
                      </h5>
                    </div>
                    
                    <p className="text-[15px] sm:text-[16px] text-slate-600 leading-relaxed font-medium">
                      Законов в сфере обращения с животными написано и принято уже немало, но на практике часто реализуются лишь самые негативные или радикальные меры. Базовые же понятия (обязательная регистрация, ответственность за животное) просто опускаются. При этом сама по себе регистрация не решает проблему бездомности — важен именно инструмент контроля, который делает эту ответственность реальной. Из-за его отсутствия законы оказываются малоприменимы, а самые "правдивые" цифры сейчас — это статистика укусов и отловов. Без понимания реального положения дел принимаются неэффективные решения.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* 4. Ecosystem Features - Bento Box Design */}
        <section className="bg-white py-24 lg:py-32 px-4 sm:px-6 lg:px-8 border-t border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20 text-center max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Предлагаемое решение</h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                Зооплатформа планируется как целая экосистема цифровых решений для любителей животных, которая собрала в себе все необходимое для ответственного обращения с домашними животными.
              </p>
            </div>

            <h3 className="text-3xl font-bold text-slate-900 mb-8 text-center">Что планируется на ресурсе:</h3>

            {/* Ядро и Граждане - Bento Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
              <div className="md:col-span-5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                  <BrainCircuit className="w-64 h-64" />
                </div>
                <h3 className="text-blue-200 font-bold tracking-widest uppercase text-sm mb-8">Ядро системы</h3>
                <div className="space-y-10 relative z-10">
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><PawPrint className="w-6 h-6" /></div>
                      <h4 className="text-2xl font-bold">ЗооБаза (PetID)</h4>
                    </div>
                    <p className="text-blue-50 text-base leading-relaxed">Центральная часть, вокруг которой строится вся система. Это не просто очередной реестр, а полноценная система, которая бережно сопровождает питомца на каждом этапе его пути — от самого рождения до момента утраты.</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><BrainCircuit className="w-6 h-6" /></div>
                      <h4 className="text-2xl font-bold">Зоопомощник (AI)</h4>
                    </div>
                    <p className="text-blue-50 text-base leading-relaxed">Умный бот для ответов на частые вопросы и круглосуточной поддержки всех участников.</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-7 bg-slate-100 rounded-3xl p-8 sm:p-10 border border-slate-200 group hover:bg-slate-50 transition-colors">
                <h3 className="text-slate-500 font-bold tracking-widest uppercase text-sm mb-8">Для граждан и волонтеров</h3>
                <div className="grid sm:grid-cols-2 gap-8 h-full">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 group-hover:shadow-md transition-all flex flex-col">
                    <UserCircle className="w-12 h-12 text-green-500 mb-6" />
                    <h4 className="font-bold text-2xl mb-4 text-slate-800">Кабинет владельца животного</h4>
                    <p className="text-slate-600 text-base leading-relaxed">Управление питомцами, электронная медкарта и напоминания.</p>
                  </div>
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 group-hover:shadow-md transition-all flex flex-col">
                    <HeartHandshake className="w-12 h-12 text-orange-500 mb-6" />
                    <h4 className="font-bold text-2xl mb-4 text-slate-800">Кабинет зооволонтера</h4>
                    <p className="text-slate-600 text-base leading-relaxed">Полноценное ведение подопечных, пристройство и координация сборов.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Бизнес - Bento Row 2 */}
            <div className="mb-16">
              <h3 className="text-slate-500 font-bold tracking-widest uppercase text-sm mb-6 text-center sm:text-left">Для специалистов и бизнеса</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                {[
                  { theme: { bg: "bg-purple-50/70", border: "border-purple-200", text: "text-purple-900", hover: "hover:bg-purple-100/50" }, title: "Система учета для ветклиник/услуг", desc: "Регистрация чипов, медицинская статистика и онлайн-запись." },
                  { theme: { bg: "bg-teal-50/70", border: "border-teal-200", text: "text-teal-900", hover: "hover:bg-teal-100/50" }, title: "Кабинет специалиста", desc: "Рабочая зона для узких экспертов: кинологов, грумеров, зоопсихологов." },
                  { theme: { bg: "bg-amber-50/70", border: "border-amber-200", text: "text-amber-900", hover: "hover:bg-amber-100/50" }, title: "Кабинет зоомагазина / Зоомаркет", desc: "Удобный маркетплейс товаров для животных и программы лояльности." },
                  { theme: { bg: "bg-pink-50/70", border: "border-pink-200", text: "text-pink-900", hover: "hover:bg-pink-100/50" }, title: "Зоогостиница", desc: "Сервис для бронирования передержек с отчетами о состоянии питомца." },
                  { theme: { bg: "bg-slate-100/70", border: "border-slate-300", text: "text-slate-900", hover: "hover:bg-slate-200/50" }, title: "Ритуальные услуги", desc: "Сертифицированные услуги кремации и официальная фиксация ухода из жизни." }
                ].map((item, idx) => (
                  <div key={idx} className={`flex flex-col text-left p-6 sm:p-8 rounded-[1.5rem] border hover:shadow-md transition-all cursor-default group ${item.theme.bg} ${item.theme.border} ${item.theme.hover}`}>
                    <h4 className={`font-bold mb-4 text-[17px] leading-snug ${item.theme.text}`}>{item.title}</h4>
                    <p className="text-[14px] text-slate-600 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Гос и Приюты - Bento Row 3 */}
            <div className="bg-slate-900 rounded-[2rem] p-8 sm:p-12 mb-6 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-blue-900/40 to-transparent rounded-full blur-3xl pointer-events-none"></div>
              <h3 className="text-slate-400 font-bold tracking-widest uppercase text-sm mb-10 relative z-10 text-center sm:text-left">Для приютов, государства и НКО</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 relative z-10">
                {[
                  { icon: ShieldCheck, title: "Кабинет Управления ветеринарии", desc: "Единый центр контроля эпизоотической обстановки, мониторинга вакцинаций (в т.ч. от бешенства) и масштабного надзора за исполнением законодательства в сфере обращения с животными." },
                  { icon: Building2, title: "Кабинет муниципалитета", desc: "Инструменты для отработки обращений граждан и мониторинга региональных программ." },
                  { icon: Home, title: "Система управления приютами", desc: "Реестр постояльцев, контроль за передачей в новые руки и работа с волонтёрами." },
                  { icon: ClipboardList, title: "Система управления отловом (ОСВВ)", desc: "Прозрачный контроль подрядчиков на каждом этапе: отлов, стерилизация, вакцинация и возврат." },
                  { icon: Handshake, title: "Система учета АНО", desc: "Прозрачный фундамент для работы благотворительных фондов и формирования прозрачной отчетности." },
                  { icon: PawPrint, title: "Система учета для РКФ, клубов и заводчиков", desc: "Легальный учет племенного разведения, выдача родословных и интеграция с официальными ассоциациями." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-5 group/item cursor-default">
                    <div className="mt-1 flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors duration-300">
                        <item.icon className="w-6 h-6" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-3 text-slate-100 leading-tight">{item.title}</h4>
                      <p className="text-slate-400 text-[15px] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Дополнительные сервисы - Bento Row 4 */}
            <div className="bg-[#f8fafc] border-t border-slate-200 py-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6 mt-16">
              <div className="max-w-7xl mx-auto">
                <h3 className="text-slate-500 font-bold tracking-widest uppercase text-sm mb-10 text-center sm:text-left">Общественные и дополнительные сервисы</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                  {[
                    { theme: { bg: "bg-rose-50/70", border: "border-rose-200", text: "text-rose-900", hover: "hover:bg-rose-100/50" }, title: "Единый каталог пристройства", desc: "Агрегатор всех животных, ищущих дом, от проверенных приютов и кураторов со всей страны в одном удобном интерфейсе." },
                    { theme: { bg: "bg-indigo-50/70", border: "border-indigo-200", text: "text-indigo-900", hover: "hover:bg-indigo-100/50" }, title: "Система поиска потерянных животных", desc: "Инструмент, который автоматически сопоставляет объявления по фото и приметам, ускоряя их возвращение домой." },
                    { theme: { bg: "bg-blue-50/70", border: "border-blue-200", text: "text-blue-900", hover: "hover:bg-blue-100/50" }, title: "Афиша", desc: "Единый региональный календарь зоо-событий, выставок и благотворительных акций." },
                    { theme: { bg: "bg-emerald-50/70", border: "border-emerald-200", text: "text-emerald-900", hover: "hover:bg-emerald-100/50" }, title: "Учебный центр (ЗооАкадемия)", desc: "Профессиональные курсы и обучение будущих или текущих владельцев." },
                    { theme: { bg: "bg-amber-50/70", border: "border-amber-200", text: "text-amber-900", hover: "hover:bg-amber-100/50" }, title: "Петиции", desc: "Платформа для выдвижения общественных инициатив в сфере защиты животных." },
                    { theme: { bg: "bg-red-50/70", border: "border-red-200", text: "text-red-900", hover: "hover:bg-red-100/50" }, title: "Горячая линия", desc: "Экстренный ресурс для консультаций при жестоком обращении или потере животного, заявки на отлов и в целом комплекс вопросов по мелкодомашним животным." },
                    { theme: { bg: "bg-orange-50/70", border: "border-orange-200", text: "text-orange-900", hover: "hover:bg-orange-100/50" }, title: "ЗооЖурнал (ЗооWiki)", desc: "База знаний, статьи и полезные материалы от экспертов по уходу и содержанию питомцев." },
                    { theme: { bg: "bg-purple-50/70", border: "border-purple-200", text: "text-purple-900", hover: "hover:bg-purple-100/50" }, title: "Мини-приложения (mini-apps) для соцсетей", desc: "Удобные сервисы внутри Telegram и VK для быстрой помощи без установки приложения." }
                  ].map((item, idx) => (
                    <div key={idx} className={`rounded-[1.5rem] p-6 sm:p-8 text-left transition-all hover:-translate-y-1 hover:shadow-md border cursor-default flex flex-col gap-4 ${item.theme.bg} ${item.theme.border} ${item.theme.hover}`}>
                      <h4 className={`font-bold text-[17px] leading-snug line-clamp-2 ${item.theme.text}`}>{item.title}</h4>
                      <p className="text-[14px] text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. How it helps (Conclusion) */}
        <section className="py-24 lg:py-32 bg-slate-50 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-8">Как это помогает обществу и государству?</h2>
              <p className="text-xl text-slate-600 leading-relaxed font-medium">
                ЗооПлатформа не просто оцифровывает разрозненные процессы, она меняет сам подход к обращению с животными, устраняя корень проблемы, а не борясь с ее последствиями.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
              
              {/* Гос */}
              <div className="bg-white rounded-[2rem] p-8 sm:p-12 shadow-md border border-slate-200 hover:shadow-xl transition-shadow flex flex-col">
                <div className="mb-10">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                    <span className="text-blue-600">Для государства</span> — это управляемость и планирование
                  </h3>
                </div>
                
                <ul className="space-y-8 flex-1">
                  {[
                    { title: "Реальные данные вместо слепой статистики", desc: "Появление точных цифр по количеству животных, приютам и эффективности программ отлова (ОСВВ) позволяет грамотно планировать бюджеты и принимать работающие законы." },
                    { title: "Цифры и контроль", desc: "Платформа предоставляет государству готовый инструмент надзора: прозрачный цифровой след делает невозможным анонимный отказ от животного, превращая ответственность из декларативной в реальную и неотвратимую." },
                    { title: "Прозрачность зоосферы", desc: "Поддержка высоких стандартов работы. Платформа помогает выделить добросовестных заводчиков и клиники, и отсеять недобросовестных, повышая тем самым общий стандарт качества услуг в зооиндустрии." },
                    { title: "Бесшовная интеграция (Open API)", desc: "Система не пытается отменить уже существующие зоо-реестры, а предусматривает возможность подключаться к ним через API, выступая в роли единой шины данных. Также платформа может предоставлять свой API для работы смежных государственных систем." }
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-4 sm:gap-5">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-900 mb-2">{item.title}</h4>
                        <p className="text-slate-600 leading-relaxed lg:text-[15px]">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Общество */}
              <div className="bg-white rounded-[2rem] p-8 sm:p-12 shadow-md border border-slate-200 flex flex-col">
                <div className="mb-10">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                    <span className="text-emerald-500">Для общества</span> — это безопасность и гуманность
                  </h3>
                </div>
                
                <ul className="space-y-8 flex-1">
                  {[
                    { title: "Выявление недобросовестных владельцев", desc: "Платформа помогает уверенно находить тех, у кого животные систематически \"теряются\" или не получают должного ухода, привлекая к ответственности и создавая среду, где подобное поведение становится невозможным." },
                    { title: "Прозрачная благотворительность", desc: "Возможность видеть реальную статистику пристройства каждого честного приюта или куратора. Это возвращает доверие к зоозащите и позволяет людям безопасно и адресно помогать." },
                    { title: "Защита питомцев от некачественных услуг", desc: "Выявление клиник, приютов и передержек с сомнительными практиками или подозрительно высокой смертностью." },
                    { title: "Признание работы волонтеров", desc: "Сейчас зоозащитники делают колоссальный труд, который часто остается невидимым, из-за чего его легко обесценивают. Платформа оцифровывает эти усилия, показывая реальный масштаб и значимость волонтерской работы, помогая им получать заслуженное уважение и поддержку." },
                    { title: "Системное просвещение (Уроки доброты)", desc: "Платформа не только дает инструменты работы с текущими животными, но и инвестирует в воспитание нового, ответственного поколения владельцев со школьной скамьи, поддерживая программы уроков гуманности." },
                    { title: "Безопасные улицы", desc: "Снижение количества безнадзорных животных на улицах прямо влияет на комфорт и безопасность в городах." }
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-4 sm:gap-5">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-900 mb-2">{item.title}</h4>
                        <p className="text-slate-600 leading-relaxed lg:text-[15px]">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

             {/* Final CTA / Statement */}
            <div className="relative rounded-[2rem] overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-800 pointer-events-none"></div>
              {/* Optional overlay for texture (removed missing noise.png) */}
              <div className="absolute inset-0 bg-blue-950 opacity-0 pointer-events-none"></div>
               <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20 mix-blend-overlay pointer-events-none transform translate-x-1/4">
                 <PawPrint className="w-[400px] h-[400px]" />
               </div>
               
               <div className="relative z-10 p-10 sm:p-16 text-center flex flex-col items-center justify-center">
                 <div className="max-w-4xl mx-auto">
                   <p className="text-white text-xl md:text-2xl leading-relaxed mb-8 font-medium">
                     В конечном итоге, ЗооПлатформа — это единый фундамент, на котором усилия волонтеров, бизнеса, государства и обычных владельцев наконец-то складываются в общую работающую структуру.
                   </p>
                   <div className="inline-block border-t-2 border-b-2 border-blue-400 py-4 px-8 mt-4">
                     <p className="font-extrabold text-blue-100 text-2xl md:text-3xl uppercase tracking-wider">
                       Это не просто реестр, это новый стандарт жизни с питомцем.
                     </p>
                   </div>
                 </div>
                 
                 <div className="mt-12">
                    <Link href="/" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-10 py-5 rounded-full shadow-2xl hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all duration-300 text-lg">
                      На главную <ArrowRight className="w-6 h-6" />
                    </Link>
                 </div>
               </div>
            </div>

          </div>
        </section>
      </main>
    </div>
    </AuthProvider>
  );
}
