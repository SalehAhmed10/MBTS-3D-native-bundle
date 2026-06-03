import * as THREE from "three";
import { TalkingHead } from "../modules/talkinghead.mjs";

const avatarEl = document.getElementById("avatar");
const statusEl = document.getElementById("status");
const query = new URLSearchParams(window.location.search);
const FALLBACK_AVATAR_KEY = "prithi";
const AVATAR_MANIFEST_URL = new URL("./avatars/manifest.json", window.location.href).href;
const persons = await loadAvatarManifest();
const defaultAvatarKey = getDefaultAvatarKey();
const avatarPreloadPromises = new Map();

let head = null;
let currentAvatarKey = normalizeAvatar(query.get("avatar") || defaultAvatarKey);
let currentMood = normalizeMood(query.get("mood") || "happy");
let currentBackground = query.get("background") || "none";
let speechSequence = 0;
let ready = false;

async function loadAvatarManifest() {
  try {
    const response = await fetch(AVATAR_MANIFEST_URL, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Avatar manifest failed with ${response.status}`);
    }

    const manifest = await response.json();
    return manifest?.avatars || {};
  } catch (error) {
    console.warn("Failed to load avatar manifest, using fallback avatars", error);
    return {
      prithi: {
        label: "Prithi",
        url: "./avatars/prithi.glb",
        body: "F",
        defaultMood: "happy",
        scale: 0.75,
        view: {
          cameraY: 1.2,
          cameraX: 0.0,
          cameraFOV: 5,
          cameraRotateX: -0.2,
          cameraRotateY: 0.0,
          cameraRotateZ: 2,
        },
        voice: {
          id: "prithi-default",
          label: "Prithi Default",
        },
      },
      camilia: {
        label: "Camilia",
        url: "./avatars/Camilia.glb",
        body: "F",
        defaultMood: "neutral",
        scale: 0.75,
        view: {
          cameraY: 1.0,
          cameraX: 0.0,
          cameraFOV: 6,
          cameraRotateX: -0.1,
          cameraRotateY: 0.0,
          cameraRotateZ: 2,
        },
        voice: {
          id: "camilia-default",
          label: "Camilia Default",
        },
      },
    };
  }
}

function getDefaultAvatarKey() {
  return persons[FALLBACK_AVATAR_KEY] ? FALLBACK_AVATAR_KEY : Object.keys(persons)[0] || FALLBACK_AVATAR_KEY;
}

function normalizeVoiceList(person) {
  if (Array.isArray(person?.voices) && person.voices.length > 0) {
    return person.voices.filter((voice) => voice?.id && voice?.label);
  }

  if (person?.voice?.id && person?.voice?.label) {
    return [person.voice];
  }

  return [];
}

function getDefaultVoice(person) {
  const voices = normalizeVoiceList(person);
  if (!voices.length) {
    return null;
  }

  if (person?.defaultVoiceId) {
    return voices.find((voice) => voice.id === person.defaultVoiceId) || voices[0];
  }

  return voices[0];
}

function normalizeAvatar(value) {
  const normalized = String(value || defaultAvatarKey).trim().toLowerCase();
  if (normalized === "camille") {
    return "camilia";
  }
  return persons[normalized] ? normalized : defaultAvatarKey;
}

function normalizeMood(value) {
  const normalized = String(value || "neutral").trim().toLowerCase();
  return normalized || "neutral";
}

function postToHost(payload) {
  if (window.ReactNativeWebView?.postMessage) {
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }
}

function setStatus(state, message) {
  if (!statusEl) {
    return;
  }

  statusEl.dataset.state = state;
  statusEl.textContent = message;
}

function makeMaterialsPBR() {
  if (!head?.scene) {
    return;
  }

  head.scene.traverse((child) => {
    if (!child.isMesh || !child.material) {
      return;
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const updatedMaterials = materials.map((material) => {
      if (!material?.map) {
        return material;
      }

      const pbrMaterial = new THREE.MeshStandardMaterial({
        map: material.map,
        normalMap: material.normalMap || null,
        roughnessMap: material.roughnessMap || null,
        metalnessMap: material.metalnessMap || null,
        alphaMap: material.alphaMap || null,
        transparent: material.transparent ?? true,
        alphaTest: material.alphaTest || 0,
        side: material.side ?? THREE.FrontSide,
        color: material.color || new THREE.Color(0xffffff),
        emissive: material.emissive || new THREE.Color(0x000000),
        emissiveIntensity: material.emissiveIntensity ?? 1,
        skinning: material.skinning ?? true,
        morphTargets: material.morphTargets ?? true,
        morphNormals: material.morphNormals ?? true,
      });

      if (pbrMaterial.map) {
        pbrMaterial.map.minFilter = THREE.LinearFilter;
        pbrMaterial.map.magFilter = THREE.LinearFilter;
        pbrMaterial.map.generateMipmaps = false;
        pbrMaterial.map.needsUpdate = true;
      }

      if (pbrMaterial.normalMap) {
        pbrMaterial.normalMap.minFilter = THREE.LinearFilter;
        pbrMaterial.normalMap.magFilter = THREE.LinearFilter;
        pbrMaterial.normalMap.generateMipmaps = false;
        pbrMaterial.normalMap.needsUpdate = true;
      }

      if (pbrMaterial.roughnessMap) {
        pbrMaterial.roughnessMap.minFilter = THREE.LinearFilter;
        pbrMaterial.roughnessMap.magFilter = THREE.LinearFilter;
        pbrMaterial.roughnessMap.generateMipmaps = false;
        pbrMaterial.roughnessMap.needsUpdate = true;
      }

      if (pbrMaterial.metalnessMap) {
        pbrMaterial.metalnessMap.minFilter = THREE.LinearFilter;
        pbrMaterial.metalnessMap.magFilter = THREE.LinearFilter;
        pbrMaterial.metalnessMap.generateMipmaps = false;
        pbrMaterial.metalnessMap.needsUpdate = true;
      }

      return pbrMaterial;
    });

    child.material = Array.isArray(child.material) ? updatedMaterials : updatedMaterials[0];
  });
}

function applyRendererSettings() {
  if (!head?.renderer) {
    return;
  }

  head.renderer.setPixelRatio(Math.min(window.devicePixelRatio * 2, 3));
  head.renderer.antialias = true;
  head.renderer.physicallyCorrectLights = true;
  head.renderer.outputColorSpace = THREE.SRGBColorSpace;
  head.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  head.renderer.toneMappingExposure = 0.5;
}

function applyBackground(backgroundId = currentBackground) {
  currentBackground = backgroundId || "none";

  if (!currentBackground || currentBackground === "none") {
    avatarEl.style.backgroundImage = "";
    return;
  }

  const backgroundUrl = new URL(`./backgrounds/${currentBackground}`, window.location.href).href;
  avatarEl.style.backgroundImage = `url('${backgroundUrl}')`;
}

async function applyMood(mood = currentMood) {
  currentMood = normalizeMood(mood);

  if (!head?.avatar) {
    return;
  }

  if (currentMood === "suggestive") {
    try {
      await head.setMood("love");
      head.playGesture("😉", 1);
    } catch (error) {
      head.playGesture("😉", 1);
    }
    return;
  }

  try {
    await head.setMood(currentMood);
  } catch (error) {
    console.warn("setMood failed", error);
  }
}

async function loadAvatar(avatarKey = currentAvatarKey) {
  currentAvatarKey = normalizeAvatar(avatarKey);
  const person = persons[currentAvatarKey];
  if (!person) {
    throw new Error(`Unknown avatar: ${avatarKey}`);
  }

  const avatarConfig = {
    url: person.url,
    body: person.body || "F",
    avatarMood: currentMood === "suggestive" ? "love" : currentMood || person.defaultMood || "neutral",
  };

  await head.showAvatar(avatarConfig);

  if (person.scale && head.scene) {
    head.scene.traverse((child) => {
      if (child.isMesh || child.isGroup) {
        child.scale.multiplyScalar(person.scale);
      }
    });
  }

  head.setView(head.viewName, person.view || {});
  head.cameraClock = 999;

  if (person.view?.cameraFOV !== undefined && head.camera) {
    head.camera.fov = person.view.cameraFOV;
    head.camera.updateProjectionMatrix();
  }

  applyRendererSettings();
  makeMaterialsPBR();
  applyBackground(currentBackground);
  await applyMood(currentMood);
}

function preloadAvatarAsset(avatarKey) {
  const normalizedKey = normalizeAvatar(avatarKey);
  if (avatarPreloadPromises.has(normalizedKey)) {
    return avatarPreloadPromises.get(normalizedKey);
  }

  const person = persons[normalizedKey];
  if (!person?.url) {
    return Promise.resolve();
  }

  const preloadPromise = fetch(new URL(person.url, window.location.href).href, {
    cache: "force-cache",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to preload ${normalizedKey} with ${response.status}`);
      }
      return response.arrayBuffer();
    })
    .then(() => {
      postToHost({
        type: "avatar_prefetched",
        avatar: normalizedKey,
      });
    })
    .catch((error) => {
      console.warn(`Avatar preload failed for ${normalizedKey}`, error);
    });

  avatarPreloadPromises.set(normalizedKey, preloadPromise);
  return preloadPromise;
}

function preloadRemainingAvatars(activeAvatarKey) {
  const preload = () => {
    Object.keys(persons)
      .filter((avatarKey) => avatarKey !== activeAvatarKey)
      .forEach((avatarKey) => {
        void preloadAvatarAsset(avatarKey);
      });
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(preload, { timeout: 1500 });
    return;
  }

  window.setTimeout(preload, 600);
}

function decodeBase64Audio(audioBase64) {
  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

async function toSpeechAudio(payload) {
  if (!payload?.audioBase64) {
    throw new Error("Speech payload is missing audioBase64");
  }

  const decodedAudio = decodeBase64Audio(payload.audioBase64);
  const audioBuffer = await head.audioCtx.decodeAudioData(decodedAudio.slice(0));

  return {
    audio: audioBuffer,
    words: payload.words || [],
    wtimes: payload.wordTimes || payload.wtimes || [],
    wdurations: payload.wordDurations || payload.wdurations || [],
    visemes: payload.visemes || [],
    vtimes: payload.visemeTimes || payload.vtimes || [],
    vdurations: payload.visemeDurations || payload.vdurations || [],
  };
}

function estimateSpeechMs(audioPayload) {
  if (audioPayload?.audio?.duration) {
    return Math.ceil(audioPayload.audio.duration * 1000) + 120;
  }

  if (audioPayload?.vtimes?.length && audioPayload?.vdurations?.length) {
    const lastIndex = Math.min(audioPayload.vtimes.length, audioPayload.vdurations.length) - 1;
    return Math.ceil(audioPayload.vtimes[lastIndex] + audioPayload.vdurations[lastIndex] + 120);
  }

  return 1200;
}

async function speakPayload(payload) {
  if (!head) {
    throw new Error("Avatar runtime is not ready");
  }

  if (payload.avatar) {
    const requestedAvatar = normalizeAvatar(payload.avatar);
    if (requestedAvatar !== currentAvatarKey) {
      await loadAvatar(requestedAvatar);
    }
  }

  if (payload.background) {
    applyBackground(payload.background);
  }

  if (payload.mood) {
    await applyMood(payload.mood);
  }

  if (head.audioCtx.state === "suspended" || head.audioCtx.state === "interrupted") {
    try {
      await head.audioCtx.resume();
    } catch (error) {
      console.warn("AudioContext resume failed", error);
    }
  }

  const audioPayload = await toSpeechAudio(payload);
  const sequenceId = ++speechSequence;

  postToHost({
    type: "speech_started",
    avatar: currentAvatarKey,
    mood: currentMood,
  });

  head.speakAudio(audioPayload, {
    mood: currentMood === "suggestive" ? "love" : currentMood,
  });

  window.setTimeout(() => {
    if (sequenceId !== speechSequence) {
      return;
    }

    postToHost({
      type: "speech_finished",
      avatar: currentAvatarKey,
      mood: currentMood,
    });
  }, estimateSpeechMs(audioPayload));
}

async function handleReactNativeMessage(payload) {
  if (!payload || typeof payload !== "object") {
    return;
  }

  try {
    if (payload.type === "setAvatar") {
      await loadAvatar(payload.avatar || currentAvatarKey);
      return;
    }

    if (payload.type === "setMood") {
      await applyMood(payload.mood || "neutral");
      return;
    }

    if (payload.type === "setBackground") {
      applyBackground(payload.background || "none");
      return;
    }

    if (payload.type === "speakAudio") {
      await speakPayload(payload);
    }
  } catch (error) {
    postToHost({
      type: "avatar_error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

window.handleReactNativeMessage = handleReactNativeMessage;
window.applyBackground = applyBackground;
window.loadPerson = () => loadAvatar(currentAvatarKey);

document.addEventListener("message", (event) => {
  try {
    handleReactNativeMessage(JSON.parse(event.data));
  } catch (error) {
    postToHost({
      type: "avatar_error",
      error: "Invalid message payload",
    });
  }
});

window.addEventListener("message", (event) => {
  try {
    handleReactNativeMessage(typeof event.data === "string" ? JSON.parse(event.data) : event.data);
  } catch (error) {
    postToHost({
      type: "avatar_error",
      error: "Invalid window message payload",
    });
  }
});

async function boot() {
  head = new TalkingHead(avatarEl, {
    ttsEndpoint: "N/A",
    lipsyncModules: [],
    cameraView: "upper",
    mixerGainSpeech: 3,
    cameraRotateEnable: false,
    lightAmbientIntensity: 0,
    lightDirectIntensity: 0,
    lightSpotIntensity: 0,
  });

  applyRendererSettings();
  applyBackground(currentBackground);
  await loadAvatar(currentAvatarKey);
  preloadRemainingAvatars(currentAvatarKey);
  ready = true;
  setStatus("ready", "Avatar ready");

  postToHost({
    type: "avatar_ready",
    avatar: currentAvatarKey,
    mood: currentMood,
    background: currentBackground,
    supportedAvatars: Object.entries(persons).map(([key, person]) => ({
      id: key,
      label: person.label || key,
      voice: getDefaultVoice(person),
      voices: normalizeVoiceList(person),
      defaultVoiceId: getDefaultVoice(person)?.id || null,
    })),
  });
}

boot().catch((error) => {
  postToHost({
    type: "avatar_error",
    error: error instanceof Error ? error.message : String(error),
  });
  setStatus("error", error instanceof Error ? error.message : String(error));
});

document.addEventListener("visibilitychange", () => {
  if (!head || !ready) {
    return;
  }

  if (document.visibilityState === "visible") {
    head.start();
  } else {
    head.stop();
  }
});

window.addEventListener("error", (event) => {
  const message = event?.error?.message || event?.message || "Unknown page error";
  setStatus("error", message);
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event?.reason;
  const message =
    reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled promise rejection";
  setStatus("error", message);
});
