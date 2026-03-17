'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface VKIDButtonProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    VKIDSDK: any;
  }
}

export default function VKIDButton({ onSuccess, onError }: VKIDButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let isCancelled = false;

    // Загружаем VK ID SDK
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
    script.async = true;

    script.onload = () => {
      if (isCancelled) return;
      if (window.VKIDSDK && containerRef.current) {
        const VKID = window.VKIDSDK;

        // VK OAuth requires strictly matched redirect URLs, often with trailing slashes.
        // We use window.location.origin + '/' to produce 'https://zooplatforma.ru/'
        const redirectUrl = window.location.origin + '/';

        // Инициализация VK ID
        VKID.Config.init({
          app: 54481712,
          redirectUrl,
          responseMode: VKID.ConfigResponseMode.Callback,
          source: VKID.ConfigSource.LOWCODE,
          scope: 'email',
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
            if (onError) onError(error);
          })
          .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
            try {
              const code = payload.code;
              const deviceId = payload.device_id;

              // Обмениваем code на токен
              const authData = await VKID.Auth.exchangeCode(code, deviceId);

              // Отправляем данные на наш backend
              const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
              const response = await fetch(`${apiBase}/api/auth/vk/sdk-callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  access_token: authData.access_token,
                  user_id: authData.user_id,
                  expires_in: authData.expires_in,
                  email: authData.email || '', // Добавлен email
                }),
              });

              const result = await response.json();

              if (result.success) {
                if (onSuccess) onSuccess(result);
              } else {
                if (onError) onError(result.error);
              }
            } catch (error) {
              console.error('VK ID Exchange Error:', error);
              if (onError) onError(error);
            }
          });
      }
    };

    document.head.appendChild(script);

    return () => {
      isCancelled = true;
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [router, onSuccess, onError]);

  return <div ref={containerRef} className="vkid-container"></div>;
}
