import * as FileSystem from 'expo-file-system/legacy';
import { AVATAR_WEB_VIEW_URL } from '@/config';

// Bump this string whenever avatar-web content changes (forces re-download on next launch).
const BUNDLE_VERSION = '1.2.0';

const BASE_URL = AVATAR_WEB_VIEW_URL.endsWith('/')
  ? AVATAR_WEB_VIEW_URL
  : AVATAR_WEB_VIEW_URL + '/';

const LOCAL_DIR = FileSystem.documentDirectory + 'avatar-web/';
const VERSION_FILE = LOCAL_DIR + '.bundle-version';

// Core files downloaded on first launch (~5 MB).
const CORE_FILES = [
  'index.html',
  'app.js',
  'playback-worklet.js',
  'avatars/manifest.json',
  'backgrounds/bg_beijing.jpg',
  'backgrounds/bg_dubai.jpg',
  'backgrounds/bg_glasgow.jpg',
  'backgrounds/bg_hongkong.jpg',
  'backgrounds/bg_honolulu.jpg',
  'backgrounds/bg_munich.jpg',
  'backgrounds/bg_nyc2.jpg',
  'backgrounds/bg_spaceship.jpg',
];

// GLBs downloaded lazily per-avatar on first use.
const AVATAR_GLBS = {
  camilia:  'avatars/Camilia.glb',
  prithi:   'avatars/prithi.glb',
  benjamin: 'avatars/Benji.glb',
  john:     'avatars/john.glb',
};

async function ensureDir(dir) {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export async function isBundleCached() {
  const info = await FileSystem.getInfoAsync(VERSION_FILE);
  if (!info.exists) return false;
  const v = await FileSystem.readAsStringAsync(VERSION_FILE);
  return v.trim() === BUNDLE_VERSION;
}

// Returns the local file:// URI for the WebView — same on Android and iOS.
export function getLocalBundleUri() {
  return LOCAL_DIR + 'index.html';
}

// Downloads core bundle (no GLBs). onProgress(0..1) called after each file.
export async function downloadCoreBundle(onProgress) {
  await ensureDir(LOCAL_DIR);
  await ensureDir(LOCAL_DIR + 'avatars/');
  await ensureDir(LOCAL_DIR + 'backgrounds/');

  for (let i = 0; i < CORE_FILES.length; i++) {
    const file = CORE_FILES[i];
    await FileSystem.downloadAsync(BASE_URL + file, LOCAL_DIR + file);
    onProgress?.((i + 1) / CORE_FILES.length);
  }

  await FileSystem.writeAsStringAsync(VERSION_FILE, BUNDLE_VERSION);
}

// Returns true if the GLB for this avatar is already cached locally.
export async function isAvatarGlbCached(avatarId) {
  const rel = AVATAR_GLBS[avatarId];
  if (!rel) return false;
  const info = await FileSystem.getInfoAsync(LOCAL_DIR + rel, { size: true });
  if (!info.exists || (info.size !== undefined && info.size < 50000)) {
    if (info.exists) {
      await FileSystem.deleteAsync(LOCAL_DIR + rel, { idempotent: true });
    }
    return false;
  }
  return true;
}

// Downloads one avatar GLB with progress. No-ops if already cached.
// onProgress(0..1) is called during download.
export function downloadAvatarGlb(avatarId, onProgress) {
  const rel = AVATAR_GLBS[avatarId];
  if (!rel) return Promise.resolve();

  const localUri = LOCAL_DIR + rel;
  const remoteUri = BASE_URL + rel;

  return FileSystem.getInfoAsync(localUri).then(info => {
    if (info.exists) return;

    if (!onProgress) {
      return FileSystem.downloadAsync(remoteUri, localUri);
    }

    return new Promise((resolve, reject) => {
      const task = FileSystem.createDownloadResumable(
        remoteUri,
        localUri,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            onProgress(totalBytesWritten / totalBytesExpectedToWrite);
          }
        },
      );
      task.downloadAsync().then(resolve).catch(reject);
    });
  });
}

// Wipes the local bundle (useful for dev reset or forced update).
export async function clearBundle() {
  const info = await FileSystem.getInfoAsync(LOCAL_DIR);
  if (info.exists) {
    await FileSystem.deleteAsync(LOCAL_DIR, { idempotent: true });
  }
}
