import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  buildAvatarBridgeMessage,
  buildAvatarInjection,
  buildAvatarWebViewUrl,
  defaultAvatarWebViewUrl,
  normalizeAvatarName,
  summarizeAvatarBridgePayload,
} from './avatarBridge';
import {
  downloadAvatarGlb,
  downloadCoreBundle,
  getLocalBundleUri,
  isBundleCached,
  isAvatarGlbCached,
} from '../../services/avatarBundleManager';

let NativeWebView = null;

try {
  NativeWebView = require('react-native-webview').WebView;
} catch (error) {
  NativeWebView = null;
}

const buildEmbedBootstrapScript = (avatarName, backgroundId = 'none') => `
  (function () {
    var avatar = ${JSON.stringify(normalizeAvatarName(avatarName))};
    var desiredLabel = avatar === 'camilia' ? 'Camille' : avatar === 'prithi' ? 'Prithi' : avatar === 'benjamin' ? 'Benjamin' : 'John';
    var background = ${JSON.stringify(backgroundId || 'none')};

    function hideDemoChrome() {
      try {
        var style = document.getElementById('rn-avatar-embed-style');
        if (!style) {
          style = document.createElement('style');
          style.id = 'rn-avatar-embed-style';
          style.textContent = [
            'html, body { margin: 0 !important; padding: 0 !important; background: transparent !important; overflow: hidden !important; }',
            'header, .menu-overlay, .chat-area, .emotion-buttons, .input-bar, .divider, #info, #subtitles, #currentAnim, #characterName { display: none !important; }',
            '.main-container, .avatar-section, #avatar { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; min-height: 100vh !important; height: 100vh !important; }',
            '.main-container, .avatar-section { background: transparent !important; }',
            '#avatar { background-color: transparent !important; }',
            '.avatar-section { display: flex !important; align-items: stretch !important; justify-content: center !important; }',
            '#avatar canvas { width: 100% !important; height: 100% !important; }'
          ].join('\\n');
          document.head && document.head.appendChild(style);
        }
      } catch (error) {}
    }

    function syncAvatarSelection() {
      try {
        window.__rnDesiredAvatar = avatar;
        var personSelect = document.getElementById('person');
        var needsReload = false;

        if (personSelect && personSelect.value !== avatar) {
          personSelect.value = avatar;
          needsReload = true;
        }

        var nameEl = document.getElementById('characterName');
        if (nameEl) {
          if (nameEl.textContent !== desiredLabel) {
            nameEl.textContent = desiredLabel;
          }
        }

        if (needsReload) {
          if (typeof window.loadPerson === 'function') {
            window.loadPerson();
          } else if (personSelect) {
            personSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      } catch (error) {}
    }

    function syncBackgroundSelection() {
      try {
        var backgroundSelect = document.getElementById('background');
        var avatarSurface = document.getElementById('avatar');
        if (backgroundSelect && backgroundSelect.value !== background) {
          backgroundSelect.value = background;
        }

        if (avatarSurface) {
          avatarSurface.style.backgroundColor = 'transparent';
          if (!background || background === 'none') {
            avatarSurface.style.backgroundImage = '';
          } else {
            var backgroundUrl = new URL('./backgrounds/' + background, window.location.href).href;
            avatarSurface.style.backgroundImage = "url('" + backgroundUrl + "')";
            avatarSurface.style.backgroundRepeat = 'no-repeat';
            avatarSurface.style.backgroundPosition = 'center center';
            avatarSurface.style.backgroundSize = 'cover';
          }
        }

        if (typeof window.applyBackground === 'function') {
          window.applyBackground(background);
        } else if (backgroundSelect) {
          backgroundSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } catch (error) {}
    }

    function install() {
      hideDemoChrome();
      syncAvatarSelection();
      syncBackgroundSelection();
    }

    install();
    document.addEventListener('DOMContentLoaded', install);
    window.addEventListener('load', install);
    setTimeout(install, 0);
    setTimeout(install, 300);
    setTimeout(install, 1200);
    setTimeout(install, 2500);
  })();
  true;
`;

const AvatarWebView = forwardRef(
  ({ avatar = 'Camilia', background = 'none', onAvatarEvent, sourceUrl, style }, ref) => {
    const webViewRef = useRef(null);
    const isReadyRef = useRef(false);
    const pendingMessagesRef = useRef([]);
    const loadStartRef = useRef(null);
    const initialAvatarRef = useRef(normalizeAvatarName(avatar));
    const t = (label) => {
      const now = Date.now();
      const elapsed = loadStartRef.current ? `+${now - loadStartRef.current}ms` : 'T+0';
      console.log(`[AVT] ${elapsed} ${label}`);
    };
    const [isReady, setIsReady] = useState(false);
    const [statusLabel, setStatusLabel] = useState('loading');
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [resolvedSourceUrl, setResolvedSourceUrl] = useState(sourceUrl || null);
    const avatarSourceUrl = buildAvatarWebViewUrl(
      Platform.OS,
      resolvedSourceUrl || defaultAvatarWebViewUrl(Platform.OS),
      initialAvatarRef.current,
    );

    const reportEvent = payload => {
      if (payload?.type) {
        console.log(
          '[AvatarWebView]',
          payload.type,
          summarizeAvatarBridgePayload(payload),
        );
      } else {
        console.log('[AvatarWebView]', summarizeAvatarBridgePayload(payload));
      }

      onAvatarEvent?.(payload);
    };

    const sendPayload = payload => {
      const normalizedPayload = buildAvatarBridgeMessage(payload);
      const logPayload = summarizeAvatarBridgePayload(normalizedPayload);

      if (!isReadyRef.current) {
        console.log('[AvatarWebView] queueing payload', logPayload);
        pendingMessagesRef.current.push(normalizedPayload);
        return;
      }

      console.log('[AvatarWebView] injecting payload', logPayload);
      webViewRef.current?.injectJavaScript(
        buildAvatarInjection(normalizedPayload),
      );
    };

    const flushPendingMessages = () => {
      if (!pendingMessagesRef.current.length) {
        return;
      }

      const pendingMessages = [...pendingMessagesRef.current];
      pendingMessagesRef.current = [];
      pendingMessages.forEach(sendPayload);
    };

    useImperativeHandle(ref, () => ({
      speak(payload) {
        sendPayload(payload);
      },
      speakAudio(payload) {
        sendPayload({
          type: 'speakAudio',
          ...payload,
        });
      },
      showText(payload) {
        sendPayload({
          type: 'displayText',
          text: payload.text || '',
          avatar: normalizeAvatarName(payload.avatar),
          mood: payload.mood || 'neutral',
        });
      },
      setAvatar(nextAvatar) {
        const normalizedAvatar = normalizeAvatarName(nextAvatar);
        const payload = { type: 'setAvatar', avatar: normalizedAvatar };
        isAvatarGlbCached(normalizedAvatar)
          .then(cached => cached ? null : downloadAvatarGlb(normalizedAvatar))
          .then(() => sendPayload(payload))
          .catch(err => console.warn('[AvatarWebView] GLB download failed for', normalizedAvatar, err?.message));
      },
      setMood(mood) {
        sendPayload({ type: 'setMood', mood: mood || 'neutral' });
      },
      setBackground(nextBackground) {
        sendPayload({
          type: 'setBackground',
          background: nextBackground || 'none',
        });
        webViewRef.current?.injectJavaScript(
          buildEmbedBootstrapScript(avatar, nextBackground || 'none'),
        );
      },
    }));

    useEffect(() => {
      webViewRef.current?.injectJavaScript(
        buildEmbedBootstrapScript(avatar, background),
      );

      if (isReady) {
        sendPayload({
          type: 'setAvatar',
          avatar: normalizeAvatarName(avatar),
        });
      }
    }, [avatar, background, isReady]);

    useEffect(() => {
      if (sourceUrl) {
        setResolvedSourceUrl(sourceUrl);
        return;
      }

      let cancelled = false;
      const initialAvatar = normalizeAvatarName(initialAvatarRef.current);

      async function prepareBundle() {
        try {
          const cached = await isBundleCached();
          console.log('[AvatarWebView] bundle cached:', cached);
          if (!cached) {
            setStatusLabel('downloading');
            setDownloadProgress(0);
            await downloadCoreBundle(p => {
              if (!cancelled) setDownloadProgress(p * 0.6);
            });
          }

          const glbCached = await isAvatarGlbCached(initialAvatar);
          if (!glbCached) {
            if (!cancelled) setStatusLabel('downloading');
            await downloadAvatarGlb(initialAvatar, p => {
              if (!cancelled) setDownloadProgress(0.6 + p * 0.4);
            });
          }

          if (!cancelled) {
            setDownloadProgress(1);
            setStatusLabel('loading');
            setResolvedSourceUrl(getLocalBundleUri());
          }
        } catch (err) {
          console.warn('[AvatarWebView] bundle prep failed, falling back to hosted URL', err?.message || err);
          if (!cancelled) {
            setStatusLabel('loading');
            setResolvedSourceUrl(defaultAvatarWebViewUrl('hosted'));
          }
        }
      }

      prepareBundle();
      return () => { cancelled = true; };
    }, [sourceUrl]);

    if (statusLabel === 'downloading') {
      const pct = Math.round(downloadProgress * 100);
      return (
        <View style={[styles.container, styles.downloadContainer, style]}>
          <Text style={styles.downloadText}>Preparing avatar…</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.downloadPct}>{pct}%</Text>
        </View>
      );
    }

    if (!NativeWebView) {
      return (
        <View style={[styles.container, styles.fallback, style]}>
          <Text style={styles.fallbackText}>
            Install `react-native-webview` to enable the talking avatar panel.
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.container, style]}>
        {resolvedSourceUrl ? (
          <NativeWebView
            ref={webViewRef}
            source={{
              uri: avatarSourceUrl,
            }}
            style={styles.webView}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            allowFileAccess
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            mixedContentMode="always"
            injectedJavaScriptBeforeContentLoaded={buildEmbedBootstrapScript(
              avatar,
              background,
            )}
            onLoadStart={() => {
              loadStartRef.current = Date.now();
              isReadyRef.current = false;
              setIsReady(false);
              setStatusLabel('loading');
              t('webview_load_start');
              reportEvent({
                type: 'webview_load_start',
                uri: avatarSourceUrl,
              });
            }}
            onLoadEnd={() => {
              t('webview_load_end (HTML parsed)');
              webViewRef.current?.injectJavaScript(
                buildEmbedBootstrapScript(avatar, background),
              );
              reportEvent({
                type: 'webview_load_end',
                uri: avatarSourceUrl,
              });
            }}
            onError={event => {
              setStatusLabel('error');
              reportEvent({
                type: 'webview_error',
                error:
                  event?.nativeEvent?.description || 'Unknown WebView error',
                url: event?.nativeEvent?.url,
              });
            }}
            onMessage={event => {
              try {
                const payload = JSON.parse(event.nativeEvent.data);

                if (payload?.type === 'avatar_ready') {
                  t('avatar_ready (3D loaded, speech can start)');
                  isReadyRef.current = true;
                  setIsReady(true);
                  setStatusLabel('ready');
                  flushPendingMessages();
                }

                if (payload?.type === 'speech_started') {
                  t('speech_started');
                  setStatusLabel('speaking');
                } else if (payload?.type === 'speech_finished') {
                  t('speech_finished');
                  setStatusLabel('ready');
                } else if (payload?.type === 'avatar_error') {
                  setStatusLabel('error');
                }

                reportEvent(payload);
              } catch (error) {
                setStatusLabel('error');
                reportEvent({
                  type: 'avatar_error',
                  error: 'Invalid avatar bridge message',
                });
              }
            }}
          />
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 350,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  webView: {
    backgroundColor: 'transparent',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f3fb',
    paddingHorizontal: 16,
  },
  fallbackText: {
    color: '#5b4d7a',
    fontSize: 14,
    textAlign: 'center',
  },
  downloadContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f3fb',
    gap: 12,
  },
  downloadText: {
    color: '#5b4d7a',
    fontSize: 14,
    fontWeight: '500',
  },
  progressTrack: {
    width: '60%',
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#208AEF',
    borderRadius: 2,
  },
  downloadPct: {
    color: '#999',
    fontSize: 12,
  },
});

export default AvatarWebView;
