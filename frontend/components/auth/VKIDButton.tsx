'use client';

import { useEffect, useRef, useState } from 'react';

interface VKIDButtonProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  mode?: 'login' | 'link';
  linkEndpoint?: string;
  showAlternativeLogin?: boolean;
  oauthList?: Array<'mail_ru' | 'ok_ru'>;
}

declare global {
  interface Window {
    VKIDSDK: any;
  }
}

// Проверка: запущены ли мы на localhost/dev-окружении
// VK ID SDK не может загрузиться на localhost из-за CSP ограничений со стороны VK
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.'));

// Плейсхолдер для dev-режима: не грузит SDK, не создаёт ошибок в консоли
function VKIDLocalPlaceholder({ mode }: { mode: 'login' | 'link' }) {
  if (mode === 'link') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400 cursor-not-allowed select-none">
        <svg className="w-4 h-4 opacity-40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.574-1.496c.586-.19 1.341 1.26 2.138 1.815.605.421 1.064.329 1.064.329l2.137-.03s1.117-.071.587-.968c-.044-.074-.31-.665-1.597-1.88-1.349-1.273-1.168-1.067.457-3.271.99-1.341 1.387-2.16 1.263-2.51-.118-.334-.844-.246-.844-.246l-2.406.015s-.178-.025-.31.056c-.13.079-.213.263-.213.263s-.382 1.037-.89 1.92c-1.07 1.86-1.499 1.96-1.674 1.844-.408-.267-.306-1.072-.306-1.644 0-1.786.265-2.53-.517-2.724-.26-.064-.452-.107-1.118-.114-.854-.009-1.577.003-1.986.208-.272.136-.482.44-.354.458.158.022.516.099.706.363.245.341.236 1.107.236 1.107s.141 2.102-.329 2.364c-.324.18-.768-.187-1.722-1.865-.488-.864-.857-1.82-.857-1.82s-.071-.178-.198-.274c-.154-.116-.37-.153-.37-.153l-2.286.015s-.343.01-.469.162c-.112.135-.009.413-.009.413s1.797 4.289 3.831 6.453c1.867 1.986 3.986 1.854 3.986 1.854h.961z" />
        </svg>
        <span>VK ID недоступен на localhost</span>
      </div>
    );
  }
  return (
    <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400 cursor-not-allowed select-none">
      <svg className="w-5 h-5 opacity-40" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.574-1.496c.586-.19 1.341 1.26 2.138 1.815.605.421 1.064.329 1.064.329l2.137-.03s1.117-.071.587-.968c-.044-.074-.31-.665-1.597-1.88-1.349-1.273-1.168-1.067.457-3.271.99-1.341 1.387-2.16 1.263-2.51-.118-.334-.844-.246-.844-.246l-2.406.015s-.178-.025-.31.056c-.13.079-.213.263-.213.263s-.382 1.037-.89 1.92c-1.07 1.86-1.499 1.96-1.674 1.844-.408-.267-.306-1.072-.306-1.644 0-1.786.265-2.53-.517-2.724-.26-.064-.452-.107-1.118-.114-.854-.009-1.577.003-1.986.208-.272.136-.482.44-.354.458.158.022.516.099.706.363.245.341.236 1.107.236 1.107s.141 2.102-.329 2.364c-.324.18-.768-.187-1.722-1.865-.488-.864-.857-1.82-.857-1.82s-.071-.178-.198-.274c-.154-.116-.37-.153-.37-.153l-2.286.015s-.343.01-.469.162c-.112.135-.009.413-.009.413s1.797 4.289 3.831 6.453c1.867 1.986 3.986 1.854 3.986 1.854h.961z" />
      </svg>
      <span>VK ID · недоступен на localhost</span>
    </div>
  );
}

export default function VKIDButton({
  onSuccess,
  onError,
  mode = 'login',
  linkEndpoint = '/api/profile/social-links/vk/link',
  showAlternativeLogin = mode === 'login',
  oauthList = mode === 'login' ? ['mail_ru', 'ok_ru'] : [],
}: VKIDButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef<typeof onSuccess>(onSuccess);
  const onErrorRef = useRef<typeof onError>(onError);
  const initializedRef = useRef(false);
  const oauthListKey = oauthList.join(',');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    // На localhost VK SDK не загружаем — он заблокирован CORS/CSP со стороны VK
    if (isLocalhost) return;

    let isCancelled = false;
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const initWidget = () => {
      try {
        if (isCancelled || !window.VKIDSDK || !containerRef.current) return;
        const VKID = window.VKIDSDK;
        containerRef.current.innerHTML = '';

        // VK OAuth requires strictly matched redirect URLs, often with trailing slashes.
        // We use window.location.origin + '/' to produce 'https://zooplatforma.ru/'
        const redirectUrl = window.location.origin + '/';

        // Инициализация VK ID
        VKID.Config.init({
          app: 54481712,
          redirectUrl,
          responseMode: VKID.ConfigResponseMode.Callback,
          source: VKID.ConfigSource.LOWCODE,
          scope: 'phone email',
        });


        // Создаем OneTap виджет
        const oneTap = new VKID.OneTap();

        oneTap
          .render({
            container: containerRef.current,
            showAlternativeLogin,
            oauthList,
          })
          .on(VKID.WidgetEvents.ERROR, (error: any) => {
            console.error('VK ID Error:', error);
            try { console.error('Error Details:', JSON.stringify(error)); } catch (e) {}
            // Частые timeout-события у виджета не должны заспамливать UI.
            if (error?.code === 0 && error?.text === 'timeout') {
              return;
            }
            if (onErrorRef.current) onErrorRef.current(error);
          })
          .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
            try {
              const code = payload.code;
              const deviceId = payload.device_id;

              // Обмениваем code на токен
              let authData;
              try {
                authData = await VKID.Auth.exchangeCode(code, deviceId);
              } catch (exchangeError) {
                console.error('VK ID Exchange Error:', exchangeError);
                if (onErrorRef.current) onErrorRef.current(exchangeError);
                return;
              }

              // Получаем расширенный профиль пользователя из VK ID
              let userInfoData: any = null;
              try {
                const userInfoResult = await VKID.Auth.userInfo(authData.access_token);
                userInfoData = userInfoResult?.user || null;
              } catch (userInfoError) {
                // Не прерываем логин, если userInfo временно недоступен
              }

              // Отправляем данные на наш backend
              const profile =
                userInfoData ||
                authData?.user ||
                authData?.user_info ||
                authData?.userData ||
                payload?.user ||
                payload?.user_info ||
                {};

              const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
              const callbackPath =
                mode === 'link' ? linkEndpoint : '/api/auth/vk/sdk-callback';

              const response = await fetch(`${apiBase}${callbackPath}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  access_token: authData.access_token,
                  user_id: authData.user_id,
                  expires_in: authData.expires_in,
                  email: authData.email || '', // Добавлен email
                  first_name: profile.first_name || profile.firstName || '',
                  last_name: profile.last_name || profile.lastName || '',
                  avatar_url:
                    profile.avatar_url ||
                    profile.avatar ||
                    profile.photo_200 ||
                    profile.photo ||
                    '',
                  phone: profile.phone || '',
                }),
              });

              if (!response.ok) {
                const errorBody = await response.text();
                let parsed: any = null;
                try {
                  parsed = JSON.parse(errorBody);
                } catch (_e) {}
                console.error('Backend returned non-200 status:', response.status, errorBody);
                if (onErrorRef.current) {
                  const enhancedError = Object.assign(
                    parsed?.error
                      ? new Error(parsed.error)
                      : new Error(errorBody || `HTTP ${response.status}`),
                    {
                      merge_required: parsed?.merge_required,
                      linked_user_id: parsed?.linked_user_id,
                      current_user_id: parsed?.current_user_id,
                      status: response.status,
                    },
                  );
                  onErrorRef.current(enhancedError);
                }
                return;
              }

              const result = await response.json();

              if (result.success) {
                // Сохраняем маркер авторизации для корректной инициализации AuthContext после редиректа.
                // Backend уже ставит HttpOnly cookie, но localStorage нужен для текущей клиентской логики.
                if (mode === 'login') {
                  const token = result?.data?.token;
                  if (token) {
                    localStorage.setItem('auth_token', token);
                  } else {
                    localStorage.setItem('auth_token', 'authenticated');
                  }
                }

                if (onSuccessRef.current) onSuccessRef.current(result);
              } else {
                console.error('Backend returned logic error:', result);
                if (onErrorRef.current) onErrorRef.current(result.error);
              }
            } catch (error) {
              console.error('VK ID Flow Error:', error);
              if (onErrorRef.current) onErrorRef.current(error);
            }
          });
      } catch (err) {
        console.warn('VKID initialization caught an error (likely due to localhost CORS or adblock):', err);
      }
    };

    if (window.VKIDSDK) {
      initWidget();
    } else {
      // Загружаем VK ID SDK
      const existingScript = document.querySelector(
        'script[data-vkid-sdk="true"]',
      ) as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', initWidget, { once: true });
      } else {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
        script.async = true;
        script.dataset.vkidSdk = 'true';
        script.onload = initWidget;
        document.head.appendChild(script);
      }
    }

    return () => {
      isCancelled = true;
      initializedRef.current = false;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [mode, linkEndpoint, showAlternativeLogin, oauthListKey]);

  // На localhost показываем нейтральный плейсхолдер вместо SDK
  // Используем mounted для предотвращения ошибки гидратации (mismatch server/client)
  if (mounted && isLocalhost) {
    return <VKIDLocalPlaceholder mode={mode} />;
  }

  return <div ref={containerRef} className="vkid-container"></div>;
}
