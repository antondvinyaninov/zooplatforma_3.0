'use client';

import { useEffect, useRef } from 'react';

interface VKIDButtonProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  mode?: 'login' | 'link';
  linkEndpoint?: string;
}

declare global {
  interface Window {
    VKIDSDK: any;
  }
}

export default function VKIDButton({
  onSuccess,
  onError,
  mode = 'login',
  linkEndpoint = '/api/profile/social-links/vk/link',
}: VKIDButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef<typeof onSuccess>(onSuccess);
  const onErrorRef = useRef<typeof onError>(onError);
  const initializedRef = useRef(false);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    let isCancelled = false;
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const initWidget = () => {
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
            showAlternativeLogin: true,
            oauthList: ['mail_ru', 'ok_ru'],
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
                  onErrorRef.current(
                    parsed?.error
                      ? new Error(parsed.error)
                      : new Error(errorBody || `HTTP ${response.status}`),
                  );
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
  }, [mode, linkEndpoint]);

  return <div ref={containerRef} className="vkid-container"></div>;
}
