'use client';

import { useEffect, useRef, useState } from 'react';

type Provider = 'ok_ru' | 'mail_ru';

interface OAuthProviderLinkButtonProps {
  provider: Provider;
  endpoint: string;
  idField: 'ok_id' | 'mailru_id';
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

declare global {
  interface Window {
    VKIDSDK: any;
  }
}

const APP_ID = 54481712;

function extractSocialID(provider: Provider, payload: any, authData: any, userInfo: any): string {
  const user = userInfo?.user || userInfo || {};
  const providerKey = provider === 'ok_ru' ? 'ok' : 'mailru';

  const candidates = [
    payload?.oauth_user_id,
    payload?.oauth_uid,
    payload?.oauth_id,
    payload?.user_id,
    authData?.oauth_user_id,
    authData?.oauth_uid,
    authData?.oauth_id,
    authData?.user_id,
    authData?.[`${providerKey}_id`],
    user?.oauth_user_id,
    user?.oauth_uid,
    user?.oauth_id,
    user?.user_id,
    user?.id,
    user?.[`${providerKey}_id`],
  ];

  const found = candidates.find((v) => v !== null && v !== undefined && String(v).trim() !== '');
  return found ? String(found).trim() : '';
}

export default function OAuthProviderLinkButton({
  provider,
  endpoint,
  idField,
  onSuccess,
  onError,
}: OAuthProviderLinkButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef<typeof onSuccess>(onSuccess);
  const onErrorRef = useRef<typeof onError>(onError);
  const initializedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.'));

  useEffect(() => {
    if (isLocalhost) return;

    let isCancelled = false;
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const init = () => {
      if (isCancelled || !window.VKIDSDK || !containerRef.current) return;
      const VKID = window.VKIDSDK;

      containerRef.current.innerHTML = '';
      VKID.Config.init({
        app: APP_ID,
        redirectUrl: `${window.location.origin}/`,
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
      });

      const widget = new VKID.OAuthList();
      widget
        .render({
          container: containerRef.current,
          oauthList: [provider],
        })
        .on(VKID.WidgetEvents.ERROR, (error: any) => {
          if (error?.code === 0 && error?.text === 'timeout') return;
          onErrorRef.current?.('Ошибка OAuth. Попробуйте еще раз.');
        })
        .on(VKID.OAuthListInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
          try {
            const authData = await VKID.Auth.exchangeCode(payload.code, payload.device_id);
            let userInfo: any = null;
            try {
              userInfo = await VKID.Auth.userInfo(authData.access_token);
            } catch (_e) {
              // continue without userInfo
            }

            const socialID = extractSocialID(provider, payload, authData, userInfo);
            if (!socialID) {
              onErrorRef.current?.('Не удалось получить ID соцсети из OAuth ответа');
              return;
            }

            const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
            const response = await fetch(`${apiBase}${endpoint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                [idField]: socialID,
                access_token: authData?.access_token || '',
              }),
            });

            const body = await response.json().catch(() => ({}));
            if (!response.ok || !body?.success) {
              onErrorRef.current?.(body?.error || 'Не удалось привязать соцсеть');
              return;
            }

            onSuccessRef.current?.();
          } catch (_e) {
            onErrorRef.current?.('Не удалось завершить OAuth-привязку');
          }
        });
    };

    if (window.VKIDSDK) {
      init();
    } else {
      const existingScript = document.querySelector(
        'script[data-vkid-sdk="true"]',
      ) as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', init, { once: true });
      } else {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
        script.async = true;
        script.dataset.vkidSdk = 'true';
        script.onload = init;
        document.head.appendChild(script);
      }
    }

    return () => {
      isCancelled = true;
      initializedRef.current = false;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [provider, endpoint, idField]);

  if (mounted && isLocalhost) {
    return (
      <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400 cursor-not-allowed select-none">
        <svg className="w-5 h-5 opacity-40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
        <span>Недоступно (localhost)</span>
      </div>
    );
  }

  return <div ref={containerRef} className="vkid-container max-w-[320px]" />;
}

