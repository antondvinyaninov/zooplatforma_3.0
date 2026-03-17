'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type Provider = 'ok_ru' | 'mail_ru';

interface OAuthProviderLinkButtonProps {
  provider: Provider;
  endpoint: string;
  idField: 'ok_id' | 'mailru_id';
  label: string;
  icon: ReactNode;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

declare global {
  interface Window {
    VKIDSDK: any;
  }
}

const APP_ID = 54481712;

function extractSocialID(
  provider: Provider,
  payload: any,
  authData: any,
  userInfo: any,
): string {
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
  label,
  icon,
  onSuccess,
  onError,
}: OAuthProviderLinkButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef<typeof onSuccess>(onSuccess);
  const onErrorRef = useRef<typeof onError>(onError);
  const [ready, setReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
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
            setIsBusy(true);
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
          } finally {
            setIsBusy(false);
          }
        });

      setReady(true);
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

  const handleClick = () => {
    if (!containerRef.current) return;
    const button = containerRef.current.querySelector('button:not([disabled])') as
      | HTMLButtonElement
      | undefined;
    if (!button) {
      onErrorRef.current?.('OAuth-кнопка еще не готова. Попробуйте через секунду.');
      return;
    }
    button.click();
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        disabled={!ready || isBusy}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        {icon}
        {isBusy ? 'Подключение...' : label}
      </button>

      <div
        ref={containerRef}
        className="absolute -z-10 opacity-0 pointer-events-none w-0 h-0 overflow-hidden"
        aria-hidden="true"
      />
    </div>
  );
}
