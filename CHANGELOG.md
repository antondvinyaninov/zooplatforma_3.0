# Changelog (Technical)
Все заметные технические и архитектурные изменения в проекте будут задокументированы в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/).

## [Unreleased]

## [3.1.1] - 2026-03-28
### Changed
- **Frontend / Cabinet:** Рефакторинг дашбордов Владельца и Зоопомощника. Убраны избыточные плашки со статистикой и независимая страница дашборда; внедрен прямой редирект с `/(dashboard)/dashboard` на `/(dashboard)/pets` для сокращения пользовательского пути.
- **Frontend / Layout:** Снят жесткий ограничитель ширины контейнеров `max-w-7xl` (`PetsListLayout`), теперь рабочие области и таблицы платформы (B2B/B2C) адаптивно применяют full-width Edge-to-Edge рендеринг на widescreen мониторах.

### Removed
- **Frontend / Cabinet:** Из `app/owner` и `app/pethelper` удалены неиспользуемые и блокирующие UI вызовы API `/organizations`, а также дублирующая вкладка "Главная" из бокового меню `layout`.

## [3.1.0] - 2026-03-27
### Added
- **Frontend / Feed:** Реализован интеллектуальный механизм инжектирования виджетов внутрь `virtualizer` бесконечной ленты постов (smart feed injections).
- **Frontend / Feed:** Добавлена врезка `PetCatalogCarousel` (карусель каталога) на индекс 2 для кросс-опыления с каталогом питомцев `looking_for_home`.
- **Frontend / Feed:** Добавлена нативная CTA-врезка `PromoActionCard` на индекс 6 для конвертации гостей во владельцев и волонтеров.
- **Frontend / Feed:** Разрешена "Проблема холодного старта" (Cold Start) — если для `activeFilter === 'city'` API возвращает пустой массив на нулевом offset, клиент принудительно запрашивает глобальную ленту без фильтра и выводит информационный баннер `isFallbackActivated`.
- **Frontend / Feed:** Внедрено сокращение длинных текстов постов (`line-clamp-5`) с кнопкой "Показать полностью..." для разгрузки UI ленты.
- **Frontend:** Добавлено отображение `org_pet_number` во внутренних и публичных карточках.
- **Frontend:** Добавлена новая ленивая вкладка "Инфо" для мобильной навигации (`PetNavMenu.tsx`).
- **Frontend:** Добавлена поддержка `as="textarea"` в компоненте `EditableRow`.
- **Architecture / Backlog:** Утверждена Глобальная Стратегия Роста (Virality + Tool-Led Growth). В `BACKLOG.md` интегрированы новые архитектурные модули (ЗооАкадемия, PetPassport, Сборы, NPS, User Telemetry и др.).
- **Frontend / Sharing:** Внедрена система нативного шэринга карточек через `Web Share API` (`navigator.share`) с graceful fallback'ом.
- **Backend / Next.js:** Развёрнут Edge API роут `app/api/og/route.tsx` с использованием `@vercel/og` для динамической генерации 1200x630 OpenGraph-превью постов (Vercel Satori).
- **Frontend / SEO:** Добавлена динамическая генерация `generateMetadata` в корневом `page.tsx` для автоматической сборки `<meta property="og:image">` при глубоком связывании (deeplinking) по параметру `?metka=`.
- **Backend:** В SQL-запрос `GET /:orgId/pets/:petId` (файл `org/router.go`) добавлены колонки `city` и `actual_city`.

### Changed
- **Frontend / Messenger:** Выполнен полный редизайн UI/UX мессенджера (Apple UI / Telegram style). Заменены плоские списки на плавающие карточки (floating chips) в `ChatList`. Поле ввода переработано в отделенный `Floating Dock` с эффектом матового стекла `backdrop-blur-xl`.
- **Frontend / Messenger:** Улучшен рендеринг бабблов сообщений в `MessageList`. Внедрены градиентные фоны, объемные тени `shadow` и усовершенствована типографика.
- **Frontend / Messenger:** Оптимизирован рендеринг медиа-вложений (Edge-to-Edge). При отправке standalone фото/видео синий контейнер баббла скрывается, медиа принимает радиус `rounded-[24px]` с абсолютным оверлеем прозрачного таймстемпа.
- **Frontend / Messenger:** Устранен визуальный баг "double-bubble" для файловых вложений (DOCX/PDF). Файлы рендерятся нативно внутри основного пузыря. Компонент прикрепленного питомца обновлен до премиального Rich-preview формата.
- **Frontend / UI:** Внедрена унифицированная дизайн-система `Post-Card` для всех карточек (посты, виджеты, профили, модальные окна). Произведен отказ от агрессивного glassmorphism и скруглений `rounded-2xl` в пользу строгого стандарта: `rounded-lg` (8px), `border-gray-200`, `shadow-sm`.
- **Frontend / Profile:** Стили внутренних карточек питомца (`PetNavMenu`, `PetGeneralInfo`, `PetGuardianCard`, `AddPetModal`) синхронизированы с единым стандартом UI.
- **Frontend / Home:** Редизайн Hero-блока и сайдбара (`HomeClient.tsx`, `FeedFilters.tsx`) приведен к единому Post-Card интерфейсу.
- **Frontend:** Полный рефакторинг `PetInfoCard` c переходом от вертикального списка к адаптивной двухколоночной сетке виджетов.
- **Frontend:** Реорганизация DOM-структуры `PetPageClient.tsx` (кондициональный рендеринг) для спуска ленты публикаций (`PublicationsList`) под информационные блоки на мобильных устройствах.
- **Frontend:** В `MobilePetProfileLayout` удален статический блок "Главное", инфо-поля инкапсулированы в динамическую вкладку.

### Removed
- **Frontend:** Исключена устаревшая дублирующаяся вкладка "Место содержания" из мобильного представления модулей.
- **Frontend:** Удалена заглушка `defaultDescription` из `DescriptionCard.tsx` (если поле пустое, блок скрывается).

### Fixed
- **Frontend:** Исправлен баг со сбросом локального стейта поля "Город" (очистка после обновления страницы).
- **Frontend:** Устранены проблемы с переполнением Tailwind-сеток (grids) в карточках информации и таблицах на узких экранах.
- **Frontend:** Восстановлено исчезнувшее поле редактирования "Описание питомца (для каталога)" во внутренней конфигурации профиля (`PetGeneralInfo.tsx`).

[Unreleased]: https://github.com/antondvinyaninov/zooplatforma_3.0/compare/v3.1.1...HEAD
[3.1.1]: https://github.com/antondvinyaninov/zooplatforma_3.0/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/antondvinyaninov/zooplatforma_3.0/releases/tag/v3.1.0
