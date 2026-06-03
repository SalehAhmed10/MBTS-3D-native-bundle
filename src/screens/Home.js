import {
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  FlatList,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import Message from '../components/Message';
import {
  emotionsCamille,
  emotionsJohn,
  emotionsDebbie,
  emotionsDan,
  emotionsMargie,
  emotionsVictoria,
  emotionsVanessa,
  emotionsProfessor,
  emotionsMuhammad,
  emotionsBenjamin,
  emotionsPrithi,
  emotionsCandy,
  packagesImages,
  lineItems,
  sortTodoList,
  getEmotionFromResponse,
} from '../services/HelperData';
import Ionicon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Modal from 'react-native-modal';
import { ListItem } from '@rneui/themed';
import { Image } from 'react-native';
import UpdateShoppingListModal from '../components/UpdateShoppingListModal';
import ViewShoppingListModal from '../components/ViewShoppingListModal';
import AddToShoppingListModal from '../components/AddToShoppingListModal';
import UpdateFulfillmentShoppingListModal from '../components/UpdateFulfillmentShoppingListModal';
import SelectDateAndStoreModal from '../components/SelectDateAndStoreModal';
import ViewTodoListModal from '../components/ViewTodoListModal';
import UpdateTodoListModal from '../components/UpdateTodoListModal';
import UpdateFulfillmentTodoListModal from '../components/UpdateFulfillmentTodoListModal';
import ScheduleModal from '../components/ScheduleModal';
import Geolocation from 'react-native-geolocation-service';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { baseURL } from '../utils/api';
import AddPhoneNumberModal from '../components/AddPhoneNumberModal';
import CategoryListModal from '../components/CategoryListModal';
import UnitListModal from '../components/UnitListModal';
import PostNeedForm from '../components/xshare/PostNeedForm';
import ActivityLedgerModal from '../components/ActivityLedgerModal';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { updatePerson1 } from '../redux/slices/personSlice';
import AvatarWebView from '../components/avatar/AvatarWebView';
import {
  buildAvatarSpeechEnvelope,
  denormalizeAvatarName,
  summarizeAvatarBridgePayload,
} from '../components/avatar/avatarBridge';
import { resolveInitialAvatarName } from '../components/avatar/avatarSession';
import {
  SPEECH_PROVIDER_LOCAL_WEBVIEW,
  SPEECH_PROVIDER_SERVICE,
} from '../components/avatar/speechProvider';

const parseIsoDate = isoDate => {
  if (typeof isoDate !== 'string') {
    return null;
  }

  const parts = isoDate.split('-');
  if (parts.length !== 3) {
    return null;
  }

  const [yearStr, monthStr, dayStr] = parts;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if ([year, month, day].some(value => Number.isNaN(value))) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const formatLedgerDatePhrases = entryDate => {
  if (!entryDate) {
    return { questionPhrase: 'today', summaryPhrase: 'today' };
  }

  const parsedDate = parseIsoDate(entryDate);

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return { questionPhrase: 'today', summaryPhrase: 'today' };
  }

  const toIso = date => date.toISOString().split('T')[0];
  const today = new Date();
  const todayIso = toIso(today);
  const targetIso = toIso(parsedDate);

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayIso = toIso(yesterday);

  if (targetIso === todayIso) {
    return { questionPhrase: 'today', summaryPhrase: 'today' };
  }

  if (targetIso === yesterdayIso) {
    return { questionPhrase: 'yesterday', summaryPhrase: 'yesterday' };
  }

  const formatted = parsedDate.toLocaleDateString();
  return {
    questionPhrase: `on ${formatted}`,
    summaryPhrase: formatted,
  };
};

const isYesResponse = input => {
  if (!input) return false;
  const normalized = input.trim().toLowerCase();
  return normalized === 'y' || normalized === 'yes';
};

const isNoResponse = input => {
  if (!input) return false;
  const normalized = input.trim().toLowerCase();
  return normalized === 'n' || normalized === 'no';
};

const getTimeOfDayPrompt = firstName => {
  const now = new Date();
  const hour = now.getHours();
  const nameToUse = firstName || 'there';

  if (hour >= 6 && hour < 12) {
    return {
      message: `${nameToUse}, what are you planning to do today?`,
      followUp: 'I hope you have a great experience.',
    };
  }

  if (hour >= 12 && hour < 18) {
    return {
      message: `${nameToUse}, what are you up to right now?`,
      followUp: 'I am glad you are having a good time. I will check in with you later.',
    };
  }

  return {
    message: `${nameToUse}, what did you do today?`,
    followUp: '',
  };
};

const Home = ({ updatePerson, route, navigation }) => {
  const dispatch = useDispatch();
  const person1 = useSelector(state => state.person.person);

  const { updatedAvatar, avatarMessage } = route.params || {};
  const initialAvatar = resolveInitialAvatarName({
    updatedAvatar,
    persistedAvatar: person1?.user?.avatarName,
  });

  const [avatar, setAvatar] = useState(initialAvatar);
  const [name, setName] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState({});
  const [person, setPerson] = useState({});
  const [srx, setSrx] = useState({});
  const [authProperties, setAuthProperties] = useState([
    'favoriteColor',
    'homeCountry',
    'homeState',
    'mothersMaidenName',
  ]);
  const [currentAuthProp, setCurrentAuthProp] = useState('');
  const [users, setUsers] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [type, setType] = useState(0);
  const [messages, setMessages] = useState([]);
  const [emotion, setEmotion] = useState('happy');
  const [packages, setPackages] = useState([]);
  const [showBotStore, setShowBotStore] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [showAddToShoppingListModal, setShowAddToShoppingListModal] =
    useState(false);
  const [showUpdateShoppingListModal, setShowUpdateShoppingListModal] =
    useState(false);
  const [showViewShoppingListModal, setShowViewShoppingListModal] =
    useState(false);
  const [showUpdateFulfillmentSAModal, setShowUpdateFulfillmentSAModal] =
    useState(false);
  const [showSelectDateAndStoreSAModal, setShowSelectDateAndStoreSAModal] =
    useState(false);
  const [showViewTodoListModal, setShowViewTodoListModal] = useState(false);
  const [showUpdateTodoListModal, setShowUpdateTodoListModal] = useState(false);
  const [showUpdateFulfillmentTLModal, setShowUpdateFulfillmentTLModal] =
    useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPostNeedModal, setShowPostNeedModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showFlowPlanButton, setShowFlowPlanButton] = useState(false);
  const [planMessage, setPlanMessage] = useState('');
  const [showAddPhoneNumberModal, setShowAddPhoneNumberModal] = useState(false);
  const [isAi, setIsAI] = useState(false);
  const [srxUpdated, setSrxUpdated] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Activity Ledger states
  const [isActivityLedgerMode, setIsActivityLedgerMode] = useState(false);
  const [currentLedgerEntry, setCurrentLedgerEntry] = useState({});
  const [ledgerStep, setLedgerStep] = useState(0);
  const [showActivityLedgerModal, setShowActivityLedgerModal] = useState(false);
  const [ledgerPrompt, setLedgerPrompt] = useState(null);
  const [personEndOfDayHour, setPersonEndOfDayHour] = useState(18);
  const [pendingSpeechMessageIndex, setPendingSpeechMessageIndex] =
    useState(null);

  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);
  const pendingLedgerFollowUpRef = useRef(null);
  const avatarWebViewRef = useRef(null);
  const lastSpokenAvatarMessageRef = useRef(null);
  const avatarRef = useRef(initialAvatar);
  const handleAvatarEvent = event => {
    if (
      (event?.type === 'avatar_changed' || event?.type === 'avatar_ready') &&
      event.avatar
    ) {
      const nextAvatar = denormalizeAvatarName(event.avatar);
      avatarRef.current = nextAvatar;
      setAvatar(prevAvatar => (prevAvatar === nextAvatar ? prevAvatar : nextAvatar));
    }

    if (event?.type === 'speech_started' || event?.type === 'avatar_error') {
      setPendingSpeechMessageIndex(null);
    }

    console.log(
      '[Home][AvatarEvent]',
      event?.type || 'unknown',
      summarizeAvatarBridgePayload(event),
    );
  };

  useEffect(() => {
    avatarRef.current = avatar;
  }, [avatar]);

  const updateLastLedgerPrompt = (promptType, entryDate) => {
    const today = new Date().toISOString().split('T')[0];

    setPerson(prevPerson => {
      const updatedActivityLedger = {
        ...(prevPerson?.activityLedger || {}),
        lastPrompt: {
          date: today,
          type: promptType,
          entryDate,
        },
      };

      dispatch(updatePerson1({ activityLedger: updatedActivityLedger }));

      return {
        ...prevPerson,
        activityLedger: updatedActivityLedger,
      };
    });
  };

  const startActivityLedgerFlow = ({ entryDate, promptMessage }) => {
    const normalizedDate = entryDate || new Date().toISOString().split('T')[0];
    const { questionPhrase } = formatLedgerDatePhrases(normalizedDate);

    setIsActivityLedgerMode(true);
    setLedgerStep(0);
    setCurrentLedgerEntry({
      date: normalizedDate,
      activity: {},
      food: {},
    });

    const messageText =
      promptMessage || `What did you do ${questionPhrase}?`;

    setMessages(msgs => [
      ...msgs,
      {
        message: messageText,
        me: false,
        emotion: 'happy',
        avatar: avatar,
        isActivityLedgerPrompt: true,
      },
    ]);
  };

  const startTodayPrompt = (force = false) => {
    if (isActivityLedgerMode) {
      return;
    }

    const currentHour = new Date().getHours();
    if (!force && currentHour < personEndOfDayHour) {
      return;
    }

    const todayIso = new Date().toISOString().split('T')[0];
    const prompts = getTimeOfDayPrompt(person?.firstName || name);

    startActivityLedgerFlow({
      entryDate: todayIso,
      promptMessage: prompts.message,
    });
    updateLastLedgerPrompt('activity', todayIso);

    if (prompts.followUp) {
      setMessages(msgs => [
        ...msgs,
        {
          message: prompts.followUp,
          me: false,
          emotion: 'suggestive',
          avatar: avatar,
          isActivityLedgerPrompt: true,
        },
      ]);
    }
  };

  const startFoodLedgerFlow = ({ entryDate, promptMessage }) => {
    const normalizedDate = entryDate || new Date().toISOString().split('T')[0];
    const messageText = promptMessage || 'What did you eat?';

    setIsActivityLedgerMode(true);
    setLedgerStep(6);
    setCurrentLedgerEntry(prev => ({
      ...prev,
      date: normalizedDate,
      activity: prev?.activity || {},
      food: { ...(prev?.food || {}) },
    }));

    setMessages(msgs => [
      ...msgs,
      {
        message: messageText,
        me: false,
        emotion: 'happy',
        avatar: avatar,
        isActivityLedgerPrompt: true,
      },
    ]);
  };

  const handleLedgerFollowUp = followUp => {
    if (!followUp) {
      return;
    }

    pendingLedgerFollowUpRef.current = null;

    if (followUp.promptType === 'today') {
      startActivityLedgerFlow({
        entryDate: followUp.entryDate,
        promptMessage: followUp.message,
      });
      updateLastLedgerPrompt('today', followUp.entryDate);
    } else if (followUp.promptType === 'food') {
      startFoodLedgerFlow({
        entryDate: followUp.entryDate,
        promptMessage: followUp.message,
      });
      updateLastLedgerPrompt('food', followUp.entryDate);
    }
  };

  useEffect(() => {
    const handleSrxUpdate = async () => {
      if (srxUpdated) {
        await submitMessage(false);
        setSrxUpdated(false);
      }
    };

    handleSrxUpdate();
  }, [srxUpdated]);

  useEffect(() => {
    if (messages.length > 0 && !messages[messages.length - 1].me) {
      setTimeout(() => {
        inputRef.current?.focus();
        // Add slight delay for layout calculations
        // scrollViewRef.current?.scrollToEnd({animated: true});
      }, 600); // Increased delay for real device rendering
    }
  }, [messages]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 120);
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const speechEnvelope = buildAvatarSpeechEnvelope(
      lastMessage,
      avatarRef.current,
    );

    if (!speechEnvelope) {
      return;
    }

    const { provider, request: speechRequest } = speechEnvelope;

    const speechKey = `${messages.length}:${speechRequest.avatar}:${speechRequest.mood}:${speechRequest.text}`;

    if (lastSpokenAvatarMessageRef.current === speechKey) {
      return;
    }

    lastSpokenAvatarMessageRef.current = speechKey;

    if (provider.mode === SPEECH_PROVIDER_LOCAL_WEBVIEW) {
      setPendingSpeechMessageIndex(null);
      avatarWebViewRef.current?.speak(speechRequest);
      return;
    }

    if (provider.mode === SPEECH_PROVIDER_SERVICE) {
      setPendingSpeechMessageIndex(messages.length - 1);

      const run = async () => {
        try {
          const response = await fetch(provider.serviceUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: speechRequest.text,
              avatar: speechRequest.avatar,
              mood: speechRequest.mood,
            }),
          });

          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload?.error || 'Avatar speech service failed.');
          }

          avatarWebViewRef.current?.speakAudio({
            text: speechRequest.text,
            avatar: speechRequest.avatar,
            mood: speechRequest.mood,
            audioBase64: payload.audioBase64,
            words: payload.words,
            wordTimes: payload.wordTimes,
            wordDurations: payload.wordDurations,
            visemes: payload.visemes,
            visemeTimes: payload.visemeTimes,
            visemeDurations: payload.visemeDurations,
          });
        } catch (error) {
          setPendingSpeechMessageIndex(null);
          console.log('[Home][AvatarSpeechProvider][error]', error?.message || error);
        }
      };

      run();
      return;
    }
  }, [messages]);

  // useEffect(() => {
  //   const keyboardDidShowListener = Keyboard.addListener(
  //     'keyboardDidShow',
  //     () => {
  //       scrollViewRef.current?.scrollToEnd({animated: true});
  //     },
  //   );

  //   return () => {
  //     keyboardDidShowListener.remove();
  //   };
  // }, []);

  // console.log(person);
  // console.log(packages, 'Packages <---');

  useEffect(() => {
    if (updatedAvatar && avatarMessage) {
      setAvatar(updatedAvatar);
      setMessages(prevMessages => [
        ...prevMessages,
        {
          message: avatarMessage,
          me: false,
          emotion: 'happy',
          avatar: updatedAvatar,
        },
      ]);
      dispatch(
        updatePerson1({
          user: {
            ...person1.user,
            avatarName: updatedAvatar,
          },
        }),
      );
      setPerson(prevPerson => ({
        ...prevPerson,
        user: { ...prevPerson.user, avatarName: updatedAvatar },
      }));
      updatePerson?.(prevPerson => ({
        ...prevPerson,
        user: { ...prevPerson.user, avatarName: updatedAvatar },
      }));
    }
  }, [updatedAvatar]);

  console.log('person ---------->', person);

  console.log('Person 1 data ------------->', person1);

  const checkLocationPermission = async () => {
    const platformPermission =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const result = await check(platformPermission);

    if (result === RESULTS.GRANTED) {
      return true;
    } else if (result === RESULTS.DENIED) {
      const requestResult = await request(platformPermission);
      return requestResult === RESULTS.GRANTED;
    } else {
      return false;
    }
  };

  const fetchUserLocation = async () => {
    const hasPermission = await checkLocationPermission();

    if (hasPermission) {
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;

            // Detect if using default emulator location (Google HQ)
            const isDefaultEmulatorLocation =
              (latitude >= 37.42 && latitude <= 37.43) &&
              (longitude >= -122.09 && longitude <= -122.08);

            if (isDefaultEmulatorLocation) {
              console.warn('⚠️ WARNING: Using default emulator location (California, USA)');
              console.warn('⚠️ Please set a proper location in emulator or use a real device');
              console.warn('⚠️ To set location: Emulator > ... > Location > Enter coordinates');
            }

            const locationData = { latitude, longitude };
            setPerson(prevPerson => ({
              ...prevPerson,
              location: locationData,
            }));

            dispatch(updatePerson1({ location: locationData }));

            console.log('✓ Location fetched and updated:', locationData);
            console.log(`  📍 Coordinates: ${latitude}, ${longitude}`);
            resolve(locationData);
          },
          error => {
            console.error('Error fetching location:', error);
            Alert.alert(
              'Error',
              'Unable to fetch location. Please enable location services.',
            );
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
            forceRequestLocation: true,
          },
        );
      });
    } else {
      Alert.alert(
        'Permission denied',
        'Location permission is required to fetch your location.',
      );
      return Promise.reject(new Error('Permission denied'));
    }
  };

  useEffect(() => {
    if (person?.user?.packages?.includes('FLOWPLANNER')) {
      fetchUserLocation();
    }
  }, [person?.user?.packages, srx]);

  // Check for activity ledger prompting before sleep time
  useEffect(() => {
    const handlePrompting = async () => {
      if (authenticated && person?._id) {
        await checkActivityLedgerPrompting();
      }
    };

    handlePrompting();

    // Set up interval to check every hour for activity ledger prompting
    const interval = setInterval(async () => {
      if (authenticated && person?._id) {
        await checkActivityLedgerPrompting();
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [authenticated, person?._id]);

  const checkActivityLedgerPrompting = async () => {
    try {
      const response = await fetch(
        `${baseURL}activityLedger/checkNeedsPrompting`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: person._id,
          }),
        },
      );

      const responseJson = await response.json();
      if (
        responseJson &&
        typeof responseJson.endOfDayHour === 'number' &&
        !Number.isNaN(responseJson.endOfDayHour)
      ) {
        setPersonEndOfDayHour(responseJson.endOfDayHour);
      }

      if (responseJson.status === 'OK' && responseJson.needsPrompting) {
        const today = new Date().toISOString().split('T')[0];
        const lastPrompt = person.activityLedger?.lastPrompt;

        const lastPromptKey = lastPrompt
          ? `${lastPrompt.type || ''}-${lastPrompt.entryDate || ''}`
          : null;
        const currentPromptKey = `${responseJson.promptType || ''}-${responseJson.entryDate || ''
          }`;

        const isDuplicateYesterdayPrompt =
          responseJson.promptType === 'yesterday' &&
          lastPrompt?.date === today &&
          lastPromptKey === currentPromptKey;

        if (isDuplicateYesterdayPrompt || isActivityLedgerMode) {
          return;
        }

        if (responseJson.promptType === 'yesterday') {
          if (responseJson.message) {
            setMessages(msgs => [
              ...msgs,
              {
                message: responseJson.message,
                me: false,
                emotion: 'suggestive',
                avatar: avatar,
                isActivityLedgerPrompt: true,
                promptType: responseJson.promptType,
              },
            ]);
          }

          setLedgerPrompt({
            type: 'yesterday',
            stage: 'initial',
            entryDate: responseJson.entryDate,
            followUp: responseJson.followUpPrompt || null,
          });

          pendingLedgerFollowUpRef.current = null;
          updateLastLedgerPrompt('yesterday', responseJson.entryDate);
          return;
        }

        if (responseJson.promptType === 'today') {
          startActivityLedgerFlow({
            entryDate: responseJson.entryDate,
            promptMessage: responseJson.message,
          });
          pendingLedgerFollowUpRef.current = null;
          updateLastLedgerPrompt('today', responseJson.entryDate);
          return;
        }

        if (responseJson.promptType === 'food') {
          startFoodLedgerFlow({
            entryDate: responseJson.entryDate,
            promptMessage: responseJson.message,
          });
          pendingLedgerFollowUpRef.current = null;
          updateLastLedgerPrompt('food', responseJson.entryDate);
          return;
        }

        if (responseJson.promptType === 'activity') {
          startActivityLedgerFlow({
            entryDate: responseJson.entryDate,
            promptMessage: responseJson.message,
          });
          pendingLedgerFollowUpRef.current = null;
          updateLastLedgerPrompt('activity', responseJson.entryDate);
          return;
        }

        if (responseJson.message) {
          setMessages(msgs => [
            ...msgs,
            {
              message: responseJson.message,
              me: false,
              emotion: 'suggestive',
              avatar: avatar,
              isActivityLedgerPrompt: true,
              promptType: responseJson.promptType,
            },
          ]);
        }

        if (responseJson.promptType) {
          updateLastLedgerPrompt(responseJson.promptType, responseJson.entryDate);
        }
      }
    } catch (error) {
      console.error('Error checking activity ledger prompting:', error);
    }
  };

  useEffect(() => {
    if (authenticated) {
      setIsAI(false);
      setMessages(msgs => [
        ...msgs,
        {
          message: `Hello, I'm ${avatar}. How may I help you?`,
          me: false,
          emotion: 'happy',
          avatar: avatar,
        },
      ]);
    } else {
      setIsAI(false);
      setMessages(msgs => [
        ...msgs,
        {
          message: `Hello, I'm ${avatar}. What's your name?\nPlease enter it below.`,
          me: false,
          emotion: 'happy',
          avatar: avatar,
        },
      ]);
    }
  }, [avatar]);

  const getPerson = user => {
    fetch(`${baseURL}users/getPersonById`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: { _id: user._id } }),
    })
      .then(response => response.json())
      .then(responseJson => {
        console.log(responseJson.messagen, 'Person data');
        if (responseJson.type === 'person' && responseJson.status === 'OK') {
          setMessages(msgs => [
            ...msgs,
            {
              message:
                'I have successfully verified your identity. How may I assist you?',
              me: false,
              emotion: 'happy',
              avatar: avatar,
            },
          ]);
          setAuthenticated(true);
          responseJson.data._id = user._id;
          dispatch(updatePerson1(responseJson.data));
          setPerson(responseJson.data);
          updatePerson?.(responseJson.data);
          if (responseJson.data.user?.avatarName !== avatar) {
            setMessages(msgs => [
              ...msgs,
              {
                message: `I see you've chosen ${responseJson.data.user?.avatarName} to be your host`,
                me: false,
                emotion: 'happy',
                avatar: avatar,
              },
            ]);
            setMessages(msgs => [
              ...msgs,
              {
                message: `Bye ${name}. ${responseJson.data.user?.avatarName} will take care of you from here :)`,
                me: false,
                emotion: 'happy',
                avatar: avatar,
              },
            ]);
            setAvatar(responseJson.data.user?.avatarName);
          }
        }
      });
  };

  const submitMessage = async image => {
    // Regex for bad words
    let regex = new RegExp("^[A-Za-z0-9' ]+[?]*$");
    let regexList = [
      /\bfuck{1,}\b/i,
      /\bnigger{1,}\b/i,
      /\byou\s.*\bbitch\b|\byou're\s.*\bbitch\b/i,
      /\byou\s.*\bshit\b|\byou're\s.*\bshit\b/i,
    ];

    // Check for bad words
    if (regexList.some(exp => exp.test(userInput))) {
      setEmotion('sad');
      setMessages(msgs => [
        ...msgs,
        {
          message: badIntentMessage(userInput),
          me: false,
          emotion: 'sad',
          avatar: avatar,
        },
      ]);
      setUserInput('');
      return;
    }

    // Check for FAQ responses
    else if (faqCheck(userInput)) {
      setEmotion('happy');
      if (
        /\bai\b/i.test(userInput) ||
        /\bartificial\sintelligence\b/i.test(userInput)
      ) {
        setMessages(msgs => [
          ...msgs,
          {
            message: 'BOTCierge is personal Artificial Intelligence',
            me: false,
            emotion: 'happy',
            avatar: avatar,
          },
        ]);
      } else {
        setMessages(msgs => [
          ...msgs,
          {
            message: 'BOTCierge is way better than Alexa',
            me: false,
            emotion: 'happy',
            avatar: avatar,
          },
        ]);
      }
      setUserInput('');
      return;
    }

    if (authenticated) {
      setEmotion('happy');

      if (ledgerPrompt) {
        const userResponse = userInput.trim();
        const phrases = formatLedgerDatePhrases(ledgerPrompt.entryDate);

        if (!isYesResponse(userResponse) && !isNoResponse(userResponse)) {
          setMessages(msgs => [
            ...msgs,
            {
              message: 'Please respond with yes or no.',
              me: false,
              emotion: 'suggestive',
              avatar: avatar,
              isActivityLedgerPrompt: true,
            },
          ]);
          setUserInput('');
          return;
        }

        if (ledgerPrompt.type === 'yesterday') {
          if (ledgerPrompt.stage === 'initial') {
            if (isYesResponse(userResponse)) {
              pendingLedgerFollowUpRef.current =
                ledgerPrompt.followUp || null;
              setLedgerPrompt(null);
              startActivityLedgerFlow({
                entryDate: ledgerPrompt.entryDate,
                promptMessage: `Great! Let's capture what you did ${phrases.questionPhrase}. What did you do ${phrases.questionPhrase}?`,
              });
            } else {
              setMessages(msgs => [
                ...msgs,
                {
                  message: `Okay, this means you won't have any historical data about ${phrases.summaryPhrase}. Is this what you want?`,
                  me: false,
                  emotion: 'suggestive',
                  avatar: avatar,
                  isActivityLedgerPrompt: true,
                },
              ]);
              setLedgerPrompt(prevPrompt =>
                prevPrompt
                  ? {
                    ...prevPrompt,
                    stage: 'confirmSkip',
                  }
                  : prevPrompt,
              );
            }
          } else if (ledgerPrompt.stage === 'confirmSkip') {
            if (isYesResponse(userResponse)) {
              setLedgerPrompt(null);
              const isAfterEvening =
                new Date().getHours() >= personEndOfDayHour;
              setMessages(msgs => [
                ...msgs,
                {
                  message: isAfterEvening ? 'Ok' : 'Ok then.',
                  me: false,
                  emotion: 'suggestive',
                  avatar: avatar,
                  isActivityLedgerPrompt: true,
                },
              ]);
              if (ledgerPrompt.followUp) {
                pendingLedgerFollowUpRef.current = ledgerPrompt.followUp;
                handleLedgerFollowUp(ledgerPrompt.followUp);
              } else if (isAfterEvening) {
                startTodayPrompt(true);
              }
            } else {
              pendingLedgerFollowUpRef.current =
                ledgerPrompt.followUp || null;
              setLedgerPrompt(null);
              startActivityLedgerFlow({
                entryDate: ledgerPrompt.entryDate,
                promptMessage: `No problem. Let's capture what you did ${phrases.questionPhrase}. What did you do ${phrases.questionPhrase}?`,
              });
            }
          }

          setUserInput('');
          return;
        }
      }

      const lastMessage = messages[messages.length - 1];

      console.log(lastMessage, '<------ Last Message of user');

      // Handle activity ledger input if in ledger mode
      if (isActivityLedgerMode) {
        await handleActivityLedgerInput(userInput);
        setUserInput('');
        return;
      }

      // Handle reframe suggestion responses
      if (lastMessage?.isReframeSuggestion) {
        if (
          userInput.toLowerCase() === 'y' ||
          userInput.toLowerCase() === 'yes'
        ) {
          setMessages(msgs => [
            ...msgs,
            {
              message: 'OK, go and enjoy yourself!',
              me: false,
              emotion: 'happy',
              avatar: avatar,
            },
          ]);
        } else if (
          userInput.toLowerCase() === 'n' ||
          userInput.toLowerCase() === 'no'
        ) {
          setMessages(msgs => [
            ...msgs,
            {
              message: 'OK I hope you feel better.',
              me: false,
              emotion: 'sad',
              avatar: avatar,
            },
          ]);
        }
        setUserInput('');
        return;
      }

      if (
        (userInput.toLowerCase() === 'yes' ||
          userInput.toLowerCase() === 'y') &&
        lastMessage.message ===
        'Is this what you were looking for? Should I continue?'
      ) {
        setEmotion('happy');

        setMessages(prevMessages => {
          if (prevMessages.length < 2) return prevMessages;

          const previousMessage = prevMessages[prevMessages.length - 3];

          return [
            ...prevMessages,
            {
              message: previousMessage.message,
              me: false,
              emotion: 'happy',
              avatar: avatar,
              showFullMessage: true,
            },
          ];
        });

        setUserInput('');
        setIsAI(false);
        return;
      }

      // Check for "no" or "N" responses
      else if (
        (userInput.toLowerCase() === 'no' || userInput.toLowerCase() === 'n') &&
        lastMessage.message ===
        'Is this what you were looking for? Should I continue?'
      ) {
        setEmotion('sad');
        setMessages(msgs => [
          ...msgs,
          {
            message: "Sorry I couldn't help you this time.",
            me: false,
            emotion: 'sad',
            avatar: avatar,
          },
        ]);
        setUserInput('');

        setIsAI(false);
        return;
      }

      console.log('//////////////////////////////////////////////////');
      console.log(srx, '<-----------------');
      console.log('//////////////////////////////////////////////////');

      if (srx.type === 'input') {
        console.log(
          'Fist API call @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@',
        );
        let inputList = [];
        if (srx.inputList) {
          inputList = [...srx.inputList];
        }
        if (image) {
          inputList.push(JSON.stringify(image));
        } else if (userInput && userInput !== '' && userInput !== null) {
          inputList.push(userInput);
        }
        fetch(`${baseURL}requests/requestHandler`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            srx: {
              ...srx,
              inputList,
              inputType: image ? 'image' : '',
            },
          }),
        })
          .then(response => response.json())
          .then(responseJson => {
            console.log(
              responseJson,
              '<--------------------------------- API response for first request handler',
            );
            if (responseJson.type === 'result') {
              if (responseJson.resultType === 'todoAdded') {
                let todoList = [];
                if (person.todoList) {
                  todoList = [...person.todoList];
                }
                todoList.push(responseJson.data);
                let sortedTodoList = sortTodoList(todoList);
                let personObject = { ...person };
                personObject.todoList = sortedTodoList;
                dispatch(updatePerson1(personObject));
                setPerson(personObject);
              }
              setSrx({});
            }
            if (responseJson.type === 'input') {
              setSrx({ ...responseJson });
            }
            if (responseJson.type === 'modal') {
              setSrx({});
              if (responseJson.modalType === 'updateSA') {
                setModalData(responseJson.data);
                setShowUpdateShoppingListModal(true);
              }
              if (responseJson.modalType === 'addSA') {
                setModalData(responseJson.data);
                setShowAddToShoppingListModal(true);
              }
              if (responseJson.modalType === 'viewCategory') {
                setSrx({ ...responseJson });
                setTimeout(() => {
                  setShowCategoryModal(true);
                }, 2000);
              }
              if (responseJson.modalType === 'viewUnit') {
                setSrx({ ...responseJson });
                setTimeout(() => {
                  setShowUnitModal(true);
                }, 2000);
              }
              if (responseJson.modalType === 'scheduleModal') {
                setSrx({ ...responseJson });
                setModalData(responseJson.data);
                setShowScheduleModal(true);
              }
            }
            const newEmotion = getEmotionFromResponse(responseJson);

            setMessages(msgs => [
              ...msgs,
              {
                message: responseJson.message,
                me: false,
                isImage: responseJson.isImage,
                avatar: responseJson?.user?.avatarName,
                emmotion: newEmotion,
                showFullMessage: true,
              },
            ]);

            if (
              responseJson.message &&
              responseJson.message.includes('Here is the Flow Plan for you')
            ) {
              // setShowFlowPlanButton(true);
              setPlanMessage(responseJson.message);

              setMessages(msgs => [
                ...msgs,
                {
                  message: `Get flow plan on SMS`,
                  me: false,
                  instruction: true,
                  avatar: avatar,
                },
              ]);
            }
          });
      } else {
        console.log(
          'Second API call @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@',
        );
        fetch(`${baseURL}requests/requestHandler`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            srx: {
              _id: person?._id,
              email: person?.email,
              intent: userInput.toLowerCase(),
              packages: person?.user?.packages,
              isAiMessage: isAi,
            },
          }),
        })
          .then(response => response.json())
          .then(responseJson => {
            console.log(
              responseJson.message,
              responseJson.type,
              '<--------------------------------- API response for second request handler',
            );
            if (
              responseJson.type === 'unknown' ||
              responseJson.type === 'intent' ||
              responseJson.type === 'upsell' ||
              responseJson.type === 'input' ||
              responseJson.type === 'result' ||
              responseJson.type === 'packages' ||
              responseJson.type === 'modal' ||
              responseJson.type === 'screen' ||
              responseJson.type === 'emergency'
            ) {
              let newEmotion = '';

              if (
                responseJson?.newMessage?.includes(
                  "It looks like you've made a request",
                )
              ) {
                setIsAI(true);
                console.log('Chatgpt True');
                setMessages(msgs => [
                  ...msgs,
                  {
                    message: responseJson.newMessage,
                    me: false,
                    emotion: newEmotion,
                    avatar: avatar,
                  },
                ]);
              }

              if (responseJson.type === 'upsell') {
                newEmotion = 'suggestive';
              } else if (responseJson.type === 'unknown') {
                newEmotion = 'suggestive';
              } else {
                newEmotion = 'happy';
              }
              setEmotion(newEmotion);
              if (responseJson.type === 'input') {
                setSrx({ ...person, ...responseJson });
              }
              if (responseJson.type === 'screen') {
                if (responseJson.screenType === 'activeNeeds') {
                  setSrx({ ...responseJson });
                  setTimeout(() => {
                    navigation.navigate('Active Needs', {
                      needTypeFilter: responseJson.needType,
                    });
                  }, 2000);
                }
                if (responseJson.screenType === 'myNeeds') {
                  setSrx({ ...responseJson });
                  setTimeout(() => {
                    navigation.navigate('My Needs');
                  }, 2000);
                }
              }
              if (responseJson.type === 'modal') {
                if (responseJson.modalType === 'viewSA') {
                  setModalData(responseJson.data);
                  setShowViewShoppingListModal(true);
                }
                if (responseJson.modalType === 'updateSA') {
                  setModalData(responseJson.data);
                  setShowUpdateShoppingListModal(true);
                }
                if (responseJson.modalType === 'purchaseSA') {
                  setModalData(responseJson.data);
                  setShowUpdateFulfillmentSAModal(true);
                }
                if (responseJson.modalType === 'viewTL') {
                  setModalData(responseJson.data);
                  setShowViewTodoListModal(true);
                }
                if (responseJson.modalType === 'updateTL') {
                  setModalData(responseJson.data);
                  setShowUpdateTodoListModal(true);
                }
                if (responseJson.modalType === 'fulfillTL') {
                  setModalData(responseJson.data);
                  setShowUpdateFulfillmentTLModal(true);
                }
                if (responseJson.modalType === 'scheduleModal') {
                  setSrx({ ...responseJson });
                  setModalData(responseJson.data);
                  setShowScheduleModal(true);
                }
                if (responseJson.modalType === 'postNeedForm') {
                  console.log('post a need form ---->', responseJson.modalType);
                  setSrx({
                    ...responseJson,
                    presetNeedType: responseJson.needType,
                  });
                  setShowPostNeedModal(true);
                }

                // Handle activity ledger responses
                if (responseJson.type === 'activityLedger') {
                  handleActivityLedgerResponse(responseJson);
                }
              }

              // Customize message for unknown requests
              let displayMessage = responseJson.message;
              if (responseJson.type === 'unknown') {
                displayMessage = `Well ${avatar} doesn't guess the answer.`;
              }

              setMessages(msgs => [
                ...msgs,
                {
                  message: displayMessage,
                  me: false,
                  emotion: newEmotion,
                  showFullMessage: responseJson.messageAI ? false : true,
                  Aimessage: responseJson.messageAI ? true : false,
                  avatar: avatar,
                },
              ]);

              if (responseJson?.newMessage?.includes) {
                setMessages(msgs => [
                  ...msgs,
                  {
                    message:
                      'Is this what you were looking for? Should I continue?',
                    me: false,
                    emotion: 'suggestive',
                    Aimessage: true,
                    avatar: avatar,
                  },
                ]);
              }

              if (responseJson.type === 'packages') {
                setTimeout(() => {
                  setPackages([...responseJson.allPackages]);
                  setShowBotStore(true);
                }, 1000);
              }
            }
          });
      }
    } else {
      if (type === 0) {
        if (regex.test(userInput)) {
          if (userInput.includes(' ')) {
            let lastWord = userInput.split(' ').pop();
            setUserInput('');
            setEmotion('sad');
            setMessages(msgs => [
              ...msgs,
              {
                message: `${lastWord}, your name cannot contain space character`,
                me: false,
                emotion: 'sad',
                avatar: avatar,
              },
            ]);
            return;
          }
          setType(1);
          setEmotion('happy');
          let msg = {
            message: `Hi ${userInput}, welcome to the BOTCierge experience. How may I assist you?`,
            me: false,
            emotion: 'happy',
            avatar: avatar,
          };
          setMessages(msgs => [...msgs, msg]);
          setName(userInput);
        } else {
          setEmotion('sad');
          setMessages(msgs => [
            ...msgs,
            {
              message: 'Invalid name',
              me: false,
              emotion: 'sad',
              avatar: avatar,
            },
          ]);
        }
      } else if (type === 1) {
        if (regex.test(userInput)) {
          // let regexList = [
          //   /\bfuck{1,}\b/i,
          //   /\bnigger{1,}\b/i,
          //   /\byou\s.*\bbitch\b|\byou're\s.*\bbitch\b/i,
          //   /\byou\s.*\bshit\b|\byou're\s.*\bshit\b/i,
          // ];
          // if (regexList.some(exp => exp.test(userInput))) {
          //   setEmotion('sad');
          //   setMessages(msgs => [
          //     ...msgs,
          //     {message: badIntentMessage(userInput), me: false},
          //   ]);
          // } else {
          //   if (faqCheck(userInput)) {
          //     setEmotion('happy');
          //     if (
          //       /\bai\b/i.test(userInput) ||
          //       /\bartificial\sintelligence\b/i.test(userInput)
          //     ) {
          //       setMessages(msgs => [
          //         ...msgs,
          //         {
          //           message: 'BOTCierge is personal Artificial Intelligence',
          //           me: false,
          //         },
          //       ]);
          //     } else {
          //       setMessages(msgs => [
          //         ...msgs,
          //         {
          //           message: 'BOTCierge is way better than Alexa',
          //           me: false,
          //         },
          //       ]);
          //     }
          //   } else {
          setEmotion('happy');
          fetch(`${baseURL}intents/intentHandler`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              srx: {
                firstName: name,
                speechInput: userInput.toLowerCase(),
              },
            }),
          })
            .then(response => response.json())
            .then(responseJson => {
              console.log(
                responseJson.message,
                responseJson.type,
                '<--------------------------------- API response for third handler',
              );
              if (
                responseJson.type === 'unknown' ||
                responseJson.type === 'intent'
              ) {
                let newEmotion = '';

                if (responseJson.type === 'unknown') {
                  newEmotion = 'sad';
                } else {
                  newEmotion = 'happy';
                }

                setEmotion(newEmotion);

                // Customize message for unknown requests
                let displayMessage = responseJson.message;
                if (responseJson.type === 'unknown') {
                  displayMessage = `Well ${avatar} doesn't guess the answer.`;
                }

                setMessages(msgs => [
                  ...msgs,
                  {
                    message: displayMessage,
                    me: false,
                    emotion: newEmotion,
                    avatar: avatar,
                  },
                ]);
              } else if (responseJson.type === 'authentication') {
                if (authenticated) {
                  setEmotion('happy');
                  setMessages(msgs => [
                    ...msgs,
                    {
                      message: `You're already logged in.`,
                      me: false,
                      emotion: 'happy',
                      avatar: avatar,
                    },
                  ]);
                } else {
                  if (responseJson.data?.length === 0) {
                    setEmotion('sad');
                    setMessages(msgs => [
                      ...msgs,
                      {
                        message: `You're not registered with BOTCierge. Please register at BOTCIERGE.com`,
                        me: false,
                        emotion: 'sad',
                        avatar: avatar,
                      },
                    ]);
                  } else {
                    setEmotion('happy');
                    setUsers(responseJson.data);
                    setType(2);
                    setMessages(msgs => [
                      ...msgs,
                      {
                        message: `Are you ${name} ${responseJson.data[0].lastName} from ${responseJson.data[0].homeCity}?`,
                        me: false,
                        emotion: 'happy',
                        avatar: avatar,
                      },
                    ]);
                  }
                }
              }
            })
            .catch(error => {
              setEmotion('sad');
              console.log('Error', error);
            });
          //   }
          // }
        } else {
          setEmotion('sad');
          setMessages(msgs => [
            ...msgs,
            {
              message: invalidIntentMessage(),
              me: false,
              emotion: 'sad',
              avatar: avatar,
            },
          ]);
        }
      } else if (type === 2) {
        setEmotion('happy');
        let result = [];
        let limitExceeded = false;
        if (authProperties.length === 4 && users.length > 0) {
          if (userInput.length <= 20) {
            if (userInput.toLowerCase().includes('yes')) {
              result = [...users];
            } else if (userInput.toLowerCase().includes('no')) {
              limitExceeded = true;
              if (users.length > 0) {
                let lastName = users[0].lastName;
                let homeCity = users[0].homeCity;
                result = users.filter(
                  user =>
                    user.lastName !== lastName || user.homeCity !== homeCity,
                );
                if (result.length === 0) {
                  setEmotion('sad');
                  setMessages(msgs => [
                    ...msgs,
                    {
                      message: `Based on your responses I cannot verify your identity. Please register at BOTCIERGE.com`,
                      me: false,
                      emotion: 'sad',
                      avatar: avatar,
                    },
                  ]);
                  setAuthProperties([
                    'favoriteColor',
                    'homeCountry',
                    'homeState',
                    'mothersMaidenName',
                  ]);
                  setType(1);
                  setUsers([]);
                } else {
                  setMessages(msgs => [
                    ...msgs,
                    {
                      message: `Are you ${name} ${result[0].lastName} from ${result[0].homeCity}?`,
                      me: false,
                      emotion: 'happy',
                      avatar: avatar,
                    },
                  ]);
                  setUsers(result);
                }
              }
            }
          } else {
            setEmotion('sad');
            setMessages(msgs => [
              ...msgs,
              {
                message: `I don't understand please be more concise`,
                me: false,
                emotion: 'sad',
                avatar: avatar,
              },
            ]);
            limitExceeded = true;
          }
        } else {
          let limit = getLimit(currentAuthProp);
          if (userInput.length > limit) {
            setEmotion('sad');
            setMessages(msgs => [
              ...msgs,
              {
                message: `I don't understand please be more concise`,
                me: false,
                emotion: 'sad',
                avatar: avatar,
              },
            ]);
            limitExceeded = true;
          } else {
            result = users.filter(user => {
              // console.log(user);
              // console.log(currentAuthProp);
              return userInput
                .toLowerCase()
                .includes(user[currentAuthProp].toLowerCase());
            });
          }
        }
        if (limitExceeded) {
          setUserInput('');
          return;
        }
        setUsers(result);
        if (result.length > 0) {
          if (authProperties.length === 0 && result.length > 0) {
            setEmotion('happy');
            getPerson(result[0]);
            setType(1);
            setAuthProperties([
              'favoriteColor',
              'homeCountry',
              'homeState',
              'mothersMaidenName',
            ]);
          } else if (authProperties.length <= 3 && result.length === 1) {
            setEmotion('happy');
            getPerson(result[0]);
            setType(1);
            setAuthProperties([
              'favoriteColor',
              'homeCountry',
              'homeState',
              'mothersMaidenName',
            ]);
          } else {
            let authPropsArray = [...authProperties];
            let index = Math.floor(Math.random() * authPropsArray.length);
            let msg = authenticationMessage(authPropsArray[index]);
            setMessages(msgs => [
              ...msgs,
              { message: msg, me: false, emotion: emotion, avatar: avatar },
            ]);
            setCurrentAuthProp(authPropsArray[index]);
            authPropsArray.splice(index, 1);
            setAuthProperties(authPropsArray);
          }
        } else {
          setEmotion('sad');
          setMessages(msgs => [
            ...msgs,
            {
              message: `Based on your responses I cannot verify your identity. Please register at BOTCIERGE.com`,
              me: false,
              emotion: 'sad',
              avatar: avatar,
            },
          ]);
          setAuthProperties([
            'favoriteColor',
            'homeCountry',
            'homeState',
            'mothersMaidenName',
          ]);
          setType(1);
        }
      }
    }
    setUserInput('');
  };

  const choosePhoto = () => {
    let options = {
      maxWidth: 1000,
      maxHeight: 1200,
      quality: 0.75,
      includeBase64: true,
    };
    launchImageLibrary(options, async response => {
      if (response.assets) {
        setMessages(msgs => [
          ...msgs,
          {
            message: response.assets[0]?.base64,
            me: true,
            isImage: true,
            avatar: avatar,
          },
        ]);
        await submitMessage(response.assets[0]?.base64);
      }
    });
  };

  const takePhoto = () => {
    let options = {
      maxWidth: 1000,
      maxHeight: 1200,
      quality: 0.75,
      includeBase64: true,
    };
    launchCamera(options, async response => {
      if (response.assets) {
        setMessages(msgs => [
          ...msgs,
          {
            message: response.assets[0]?.base64,
            me: true,
            isImage: true,
            avatar: avatar,
          },
        ]);
        await submitMessage(response.assets[0]?.base64);
      }
    });
  };

  const onChangeLineItemQuantity = (index, quantity) => {
    // console.log(quantity);
    let lineItems = [...modalData];
    lineItems[index].quantity = quantity;
    setModalData(lineItems);
  };

  const onUpdateSACheckBoxPress = index => {
    let lineItems = [...modalData];
    if (lineItems[index].delete) {
      lineItems[index].delete = false;
    } else {
      lineItems[index].delete = true;
    }
    setModalData(lineItems);
  };

  const onUpdateFulfillmentSACheckBoxPress = index => {
    let lineItems = [...modalData];
    if (lineItems[index].fulfilled) {
      lineItems[index].fulfilled = false;
    } else {
      lineItems[index].fulfilled = true;
    }
    setModalData(lineItems);
  };

  const onUpdateSASavePress = () => {
    let itemsToUpdate = [];
    modalData.forEach(item => {
      itemsToUpdate.push({
        lineItemId: item.lineItemId,
        quantity: item.quantity,
        delete: item.delete ? true : false,
      });
    });
    fetch(`${baseURL}requests/updateShoppingList`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _id: person?._id,
        items: itemsToUpdate,
      }),
    })
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.message) {
          setShowUpdateShoppingListModal(false);
          setMessages(msgs => [
            ...msgs,
            {
              message: responseJson.message,
              me: false,
              emotion: emotion,
              avatar: avatar,
            },
          ]);
          let personObject = { ...person };
          personObject.shoppingList = responseJson.data;
          dispatch(updatePerson1(personObject));
          setPerson(personObject);
        }
      });
  };

  const onAddLineItemsSavePress = () => {
    let itemsToAdd = [];
    modalData.forEach(item => {
      if (item.quantity > 0) {
        itemsToAdd.push({ thingId: item._id, quantity: item.quantity });
      }
    });
    fetch(`${baseURL}requests/addItemsToShoppingList`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _id: person?._id,
        items: itemsToAdd,
      }),
    })
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.message) {
          setShowAddToShoppingListModal(false);
          setMessages(msgs => [
            ...msgs,
            {
              message: responseJson.message,
              me: false,
              emotion: emotion,
              avatar: avatar,
            },
          ]);
          let personObject = { ...person };
          personObject.shoppingList = responseJson.data;
          dispatch(updatePerson1(personObject));
          setPerson(personObject);
        }
      });
  };

  const onUpdateFulfillmentSANextPress = () => {
    setShowUpdateFulfillmentSAModal(false);
    setShowSelectDateAndStoreSAModal(true);
  };

  const onConfirmFulfillmentSASavePress = (store, date) => {
    if (!store) {
      Alert.alert('Error', 'Store cannot be empty');
      return;
    }
    let lineItems = [];
    modalData.forEach(item => {
      if (item.fulfilled) {
        lineItems.push({
          lineItemId: item.lineItemId,
          fulfilledStore: store,
          fulfilledDate: date,
        });
      }
    });
    if (lineItems.length > 0) {
      fetch(`${baseURL}requests/UpdateShoppingListFulfillment`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: person?._id,
          items: lineItems,
        }),
      })
        .then(response => response.json())
        .then(responseJson => {
          if (responseJson.message) {
            setShowSelectDateAndStoreSAModal(false);
            setMessages(msgs => [
              ...msgs,
              {
                message: responseJson.message,
                me: false,
                emotion: emotion,
                avatar: avatar,
              },
            ]);
          }
        });
    }
  };

  const onEditTodoSavePress = (index, task, isEmergency) => {
    if (
      modalData[index]?.task !== task ||
      modalData[index]?.isEmergency !== isEmergency
    ) {
      let todoArray = [...modalData];
      if (todoArray[index].task !== task) {
        todoArray[index].task = task;
      }
      if (todoArray[index].isEmergency !== isEmergency) {
        todoArray[index].isEmergency = isEmergency;
        todoArray = sortTodoList(todoArray);
      }
      setModalData(todoArray);
    }
  };

  const onAddTodoSavePress = (task, place, isEmergency) => {
    let todoArray = [...modalData];
    if (isEmergency) {
      let index = modalData.findIndex(todo => !todo.isEmergency);
      if (index !== -1) {
        todoArray.splice(index, 0, {
          task,
          place,
          isEmergency,
          dateAdded: new Date().toISOString(),
        });
      } else {
        todoArray.push({
          task,
          place,
          isEmergency,
          dateAdded: new Date().toISOString(),
        });
      }
    } else {
      todoArray.push({
        task,
        place,
        isEmergency,
        dateAdded: new Date().toISOString(),
      });
    }
    setModalData(todoArray);
  };

  const onUpdateTLCheckBoxPress = index => {
    let todoArray = [...modalData];
    if (todoArray[index].delete) {
      todoArray[index].delete = false;
    } else {
      todoArray[index].delete = true;
    }
    setModalData(todoArray);
  };

  const onUpdateTLSavePress = () => {
    fetch(`${baseURL}requests/updateTodoList`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _id: person?._id,
        items: modalData,
      }),
    })
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.message) {
          setShowUpdateTodoListModal(false);
          setMessages(msgs => [
            ...msgs,
            {
              message: responseJson.message,
              me: false,
              emotion: emotion,
              avatar: avatar,
            },
          ]);
          let personObject = { ...person };
          personObject.shoppingList = responseJson.data;
          dispatch(updatePerson1(personObject));
          setPerson(personObject);
        }
      });
  };

  const onAddSAClosePress = () => {
    setShowAddToShoppingListModal(false);
    setModalData([]);
  };

  const onScheduleModalClosePress = () => {
    setShowScheduleModal(false);
    setModalData([]);
  };

  const onUpdateSAClosePress = () => {
    setShowUpdateShoppingListModal(false);
    setModalData([]);
  };

  const onViewSAClosePress = () => {
    setShowViewShoppingListModal(false);
    setModalData([]);
  };

  const onUpdateFulfillmentSAClosePress = () => {
    setShowUpdateFulfillmentSAModal(false);
    setModalData([]);
  };

  const onConfirmFulfillmentSAClosePress = () => {
    setShowSelectDateAndStoreSAModal(false);
    setModalData([]);
  };

  const onViewTLClosePress = () => {
    setShowViewTodoListModal(false);
    setModalData([]);
  };

  const onUpdateTLClosePress = () => {
    setShowUpdateTodoListModal(false);
    setModalData([]);
  };

  const authenticationMessage = property => {
    let messageToReturn = `What's your `;
    if (property === 'favoriteColor') {
      messageToReturn = messageToReturn + 'favorite color?';
    } else if (property === 'homeCity') {
      messageToReturn = messageToReturn + 'home city?';
    } else if (property === 'homeCountry') {
      messageToReturn = messageToReturn + 'home country?';
    } else if (property === 'homeState') {
      messageToReturn = messageToReturn + 'home state?';
    } else if (property === 'mothersMaidenName') {
      messageToReturn = messageToReturn + `mother's maiden name?`;
    }
    return messageToReturn;
  };

  const getLimit = property => {
    if (property === 'favoriteColor') {
      return 30;
    } else if (property === 'homeCity') {
      return 30;
    } else if (property === 'homeCountry') {
      return 30;
    } else if (property === 'homeState') {
      return 30;
    } else if (property === 'mothersMaidenName') {
      return 50;
    }
  };

  const invalidIntentMessage = () => {
    let responseMessages = [
      `No comprende`,
      `I don't get it`,
      `Please try again ${name}`,
    ];
    let index = Math.floor(Math.random() * 3);
    return `That's a weird input. ${responseMessages[index]}`;
  };

  const badIntentMessage = badIntent => {
    let responseMessages = [
      `your choice of words is deplorable`,
      `${badIntent} <-- Really? Is this how your mother taught you to speak?`,
      `Yea ${name} this is not a cool thing to say.`,
    ];
    let index = Math.floor(Math.random() * 3);
    return responseMessages[index];
  };

  const faqCheck = text => {
    let regexList = [/\bai\b/i, /\bartificial\sintelligence\b/i, /\balexa\b/i];
    return regexList.some(exp => exp.test(text));
  };

  const getEmotionImage = () => {
    let emotionObject;
    if (avatar === 'Camilia' || avatar === 'Camille') {
      emotionObject = emotionsCamille.find(e => e.emotion === emotion);
    } else if (avatar === 'John') {
      emotionObject = emotionsJohn.find(e => e.emotion === emotion);
    } else if (avatar === 'Debbie') {
      emotionObject = emotionsDebbie.find(e => e.emotion === emotion);
    } else if (avatar === 'Dan') {
      emotionObject = emotionsDan.find(e => e.emotion === emotion);
    } else if (avatar === 'Margie') {
      emotionObject = emotionsMargie.find(e => e.emotion === emotion);
    } else if (avatar === 'Victoria') {
      emotionObject = emotionsVictoria.find(e => e.emotion === emotion);
    } else if (avatar === 'Vanessa') {
      emotionObject = emotionsVanessa.find(e => e.emotion === emotion);
    } else if (avatar === 'Professor') {
      emotionObject = emotionsProfessor.find(e => e.emotion === emotion);
    } else if (avatar === 'Muhammad') {
      emotionObject = emotionsMuhammad.find(e => e.emotion === emotion);
    } else if (avatar === 'Benjamin') {
      emotionObject = emotionsBenjamin.find(e => e.emotion === emotion);
    } else if (avatar === 'Prithi') {
      emotionObject = emotionsPrithi.find(e => e.emotion === emotion);
    } else if (avatar === 'Candy') {
      emotionObject = emotionsCandy.find(e => e.emotion === emotion);
    }
    return emotionObject.image;
  };

  const onSaveScheduleModal = (wakeTime, sleepTime, schedule) => {
    fetch(`${baseURL}requests/updateSchedule`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: person?._id,
        wakeTime,
        sleepTime,
        schedule,
      }),
    })
      .then(response => response.json())
      .then(responseJson => {
        console.log('API Response 123-------->:', responseJson.message);
        if (responseJson.message) {
          setShowScheduleModal(false);
          const { type, inputList, modalType, message, ...filteredSrx } = srx;
          try {
            fetch(`${baseURL}requests/requestHandler`, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                srx: {
                  ...filteredSrx,
                },
              }),
            })
              .then(response => response.json())
              .then(responseJson => {
                console.log('API Response -------->:', responseJson.message);
                if (responseJson.type === 'result') {
                  setSrx({});
                }
                if (responseJson.type === 'input') {
                  setSrx({ ...responseJson });
                }
                if (responseJson.type === 'modal') {
                  if (responseJson.modalType === 'scheduleModal') {
                    setSrx({ ...responseJson });
                    setModalData(responseJson.data);
                    setShowScheduleModal(true);
                  }
                }
                setMessages(msgs => [
                  ...msgs,
                  {
                    message: responseJson.message,
                    me: false,
                    isImage: responseJson.isImage,
                    avatar: avatar,
                  },
                ]);
              });
          } catch (error) {
            console.log(error);
          }
        }
      });
  };

  const onSubmitUpdatePackages = () => {
    let packagesArray = ['FREEMIUM'];
    let price = 6.95;
    packages.forEach(pkg => {
      if (pkg.selected) {
        price += pkg.price;
        packagesArray.push(pkg.name);
      }
    });
    return fetch(`${baseURL}requests/updatePackages`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _id: person?._id,
        firstName: name,
        price: price.toFixed(2),
        packages: packagesArray,
      }),
    })
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.status === 'OK') {
          setMessages(msgs => [
            ...msgs,
            {
              message: responseJson.message,
              me: false,
              emotion: emotion,
              avatar: avatar,
            },
          ]);
          let personObject = { ...person };
          // personObject.user.packages = packagesArray;
          // setPerson(personObject);
          dispatch(
            updatePerson1({
              user: {
                ...person1.user,
                packages: responseJson.packages,
              },
            }),
          );

          setPerson(prevPerson => ({
            ...prevPerson,
            user: {
              ...prevPerson.user,
              packages: responseJson.packages,
            },
          }));
          setShowBotStore(false);
        } else {
          Alert.alert('Error');
        }
      });
  };

  const handleCategorySelect = async category => {
    await setMessages(msgs => [...msgs, { message: category, me: true }]);

    setSrx(prevSrx => {
      const updatedSrx = {
        ...prevSrx,
        type: 'input',
        inputList: [...prevSrx.inputList, category],
        inputType: '',
        modalType: '',
      };
      return updatedSrx;
    });

    setSrxUpdated(true);
  };

  const handlePostNeed = async ({
    needType,
    address,
    packageName,
    bloodType,
    description,
    byWhen,
    supportType,
  }) => {
    console.log('Post needed called..');

    try {
      const payload = {
        type: needType,
        userId: person?._id,
        address,
        packageName,
        byWhen,
        ...(needType === 'blood' && bloodType && { bloodType }),
        // ...(['digither', 'educationx'].includes(needType) &&
        //   supportType && {supportType}),
        ...(supportType && { supportType }),
        ...(description && { description }),
      };

      const { data, status } = await axios.post(
        `${baseURL}xshares/create`,
        payload,
      );

      const successMessage =
        status === 201
          ? 'Posted your need successfully'
          : 'Unable to post your need';

      console.log(
        status === 201
          ? 'xShare created successfully:'
          : 'Failed to create xShare:',
        data?.message,
      );

      setMessages(msgs => [
        ...msgs,
        {
          message: successMessage,
          me: false,
          emotion,
          avatar,
        },
      ]);
    } catch (error) {
      console.error('Error in API call:', error);
      alert(
        `An error occurred: ${error?.response?.data?.message || 'Please try again later.'
        }`,
      );
    } finally {
      setShowPostNeedModal(false);
    }
  };

  const handleActivityLedgerResponse = async responseJson => {
    try {
      if (responseJson.action === 'startActivity') {
        const entryDate =
          responseJson.entryDate || new Date().toISOString().split('T')[0];
        const { questionPhrase } = formatLedgerDatePhrases(entryDate);
        const promptMessage =
          responseJson.message ||
          `Great! Let's start with your activity. What did you do ${questionPhrase}?`;

        pendingLedgerFollowUpRef.current = null;
        startActivityLedgerFlow({
          entryDate,
          promptMessage,
        });
        updateLastLedgerPrompt('activity', entryDate);
      } else if (responseJson.action === 'startFood') {
        const entryDate =
          responseJson.entryDate || new Date().toISOString().split('T')[0];
        const promptMessage = responseJson.message || 'What did you eat?';

        pendingLedgerFollowUpRef.current = null;
        startFoodLedgerFlow({
          entryDate,
          promptMessage,
        });
        updateLastLedgerPrompt('food', entryDate);
      }
    } catch (error) {
      console.error('Error handling activity ledger response:', error);
    }
  };

  const handleActivityLedgerInput = async input => {
    try {
      if (ledgerStep === 0) {
        // Activity description
        setCurrentLedgerEntry(prev => ({
          ...prev,
          activity: { ...prev.activity, description: input },
        }));
        setLedgerStep(1);

        setMessages(msgs => [
          ...msgs,
          {
            message: 'Where did this activity take place? (name, address, city, state, country)',
            me: false,
            emotion: 'happy',
            avatar: avatar,
            isActivityLedgerPrompt: true,
          },
        ]);
      } else if (ledgerStep === 1) {
        // Parse place: name, address, city, state, country
        const parts = input.split(',').map(s => s.trim());
        // Place
        setCurrentLedgerEntry(prev => ({
          ...prev,
          activity: {
            ...prev.activity,
            place: {
              name: parts[0] || '',
              address: parts[1] || '',
              city: parts[2] || '',
              state: parts[3] || '',
              country: parts[4] || '',
            },
          },
        }));
        setLedgerStep(2);

        setMessages(msgs => [
          ...msgs,
          {
            message: 'Who were you with? (name and relationship)',
            me: false,
            emotion: 'happy',
            avatar: avatar,
            isActivityLedgerPrompt: true,
          },
        ]);
      } else if (ledgerStep === 2) {
        // Accompaniment
        const [name, relationship] = input.split(',').map(s => s.trim());
        setCurrentLedgerEntry(prev => ({
          ...prev,
          activity: {
            ...prev.activity,
            accompaniment: {
              name: name || input,
              relationship: relationship || 'Friend',
            },
          },
        }));
        setLedgerStep(3);

        setMessages(msgs => [
          ...msgs,
          {
            message:
              'How did it make you feel? (e.g., happy, excited, grateful)',
            me: false,
            emotion: 'happy',
            avatar: avatar,
            isActivityLedgerPrompt: true,
          },
        ]);
      } else if (ledgerStep === 3) {
        // After feeling
        setCurrentLedgerEntry(prev => ({
          ...prev,
          activity: { ...prev.activity, afterFeeling: input },
        }));

        setMessages(msgs => [
          ...msgs,
          {
            message: 'Thanks for sharing how you feel.',
            me: false,
            emotion: 'happy',
            avatar: avatar,
            isActivityLedgerPrompt: true,
          },
          {
            message: 'How were you feeling before this activity?',
            me: false,
            emotion: 'happy',
            avatar: avatar,
            isActivityLedgerPrompt: true,
          },
        ]);
        setLedgerStep(4);
      } else if (ledgerStep === 4) {
        // Before feeling
        setCurrentLedgerEntry(prev => ({
          ...prev,
          activity: { ...prev.activity, beforeFeeling: input },
        }));

        setMessages(msgs => [
          ...msgs,
          {
            message: 'Any additional comments about your experience?',
            me: false,
            emotion: 'happy',
            avatar: avatar,
            isActivityLedgerPrompt: true,
          },
        ]);
        setLedgerStep(5);
      } else if (ledgerStep === 5) {
        // Additional comments
        const updatedEntry = {
          ...currentLedgerEntry,
          activity: { ...currentLedgerEntry.activity, additionalComments: input },
        };

        setCurrentLedgerEntry(updatedEntry);

        // Save activity entry - pass the updated entry directly and get the saved entry ID
        const savedEntryId = await saveActivityLedgerEntry(updatedEntry);

        // Fetch user's current location before checking reframe suggestions
        try {
          await fetchUserLocation();
          console.log('Location fetched successfully before reframe check');
        } catch (error) {
          console.log('Could not fetch location, will use activity place coords:', error);
        }

        // Check for reframe suggestions - pass the saved entry ID to exclude it
        await checkForReframeSuggestions(updatedEntry, savedEntryId);

        // Ask about food
        setLedgerStep(6);
        setMessages(msgs => [
          ...msgs,
          {
            message: 'What did you eat?',
            me: false,
            emotion: 'happy',
            avatar: avatar,
            isActivityLedgerPrompt: true,
          },
        ]);
      } else if (ledgerStep === 6) {
        // Food name
        setCurrentLedgerEntry(prev => ({
          ...prev,
          food: { ...prev.food, foodName: input },
        }));
        setLedgerStep(7);

        setMessages(msgs => [
          ...msgs,
          {
            message: 'Where did you eat? (name, address, city, state, country - optional, press Enter to skip)',
            me: false,
            emotion: 'happy',
            avatar: avatar,
            isActivityLedgerPrompt: true,
          },
        ]);
      } else if (ledgerStep === 7) {
        // Food place
        if (input.trim() === '') {
          // Use activity place if no food place specified
          setCurrentLedgerEntry(prev => ({
            ...prev,
            food: {
              ...prev.food,
              place: prev.activity?.place || {
                name: '',
                address: '',
                city: '',
                state: '',
                country: '',
              },
            },
          }));
        } else {
          const parts = input.split(',').map(part => part.trim());

          setCurrentLedgerEntry(prev => ({
            ...prev,
            food: {
              ...prev.food,
              place: {
                name: parts[0] || '',
                address: parts[1] || '',
                city: parts[2] || '',
                state: parts[3] || '',
                country: parts[4] || '',
              },
            },
          }));
        }
        setLedgerStep(8);

        setMessages(msgs => [
          ...msgs,
          {
            message: 'Describe the food:',
            me: false,
            emotion: 'happy',
            avatar: avatar,
            isActivityLedgerPrompt: true,
          },
        ]);
      } else if (ledgerStep === 8) {
        // Food description
        setCurrentLedgerEntry(prev => ({
          ...prev,
          food: { ...prev.food, foodDescription: input },
        }));
        setLedgerStep(9);

        setMessages(msgs => [
          ...msgs,
          {
            message: 'List the food items (separate with commas):',
            me: false,
            emotion: 'happy',
            avatar: avatar,
            isActivityLedgerPrompt: true,
          },
        ]);
      } else if (ledgerStep === 9) {
        // Food items - simple string array
        let foodItems = [];
        if (input.trim() !== '') {
          foodItems = input.split(',').map(item => item.trim());
        }

        // Create the updated entry with food items
        const updatedEntry = {
          ...currentLedgerEntry,
          food: { ...currentLedgerEntry.food, foodItems },
        };

        console.log('Updated ledger entry with food items:', updatedEntry);

        // Update state
        setCurrentLedgerEntry(updatedEntry);

        // Save food entry and complete - pass the updated entry directly
        await saveActivityLedgerEntry(updatedEntry);

        const { summaryPhrase } = formatLedgerDatePhrases(updatedEntry.date);
        const completionMessage = `Perfect! I've recorded your activity and food for ${summaryPhrase}. Your activity ledger is now complete!`;

        setMessages(msgs => [
          ...msgs,
          {
            message: completionMessage,
            me: false,
            emotion: 'happy',
            avatar: avatar,
          },
        ]);

        // Reset activity ledger mode
        setIsActivityLedgerMode(false);
        setLedgerStep(0);
        setCurrentLedgerEntry({});

        const followUp = pendingLedgerFollowUpRef.current;
        pendingLedgerFollowUpRef.current = null;

        if (followUp) {
          handleLedgerFollowUp(followUp);
        } else {
          const todayIso = new Date().toISOString().split('T')[0];
          if (
            updatedEntry.date &&
            updatedEntry.date !== todayIso &&
            new Date().getHours() >= personEndOfDayHour
          ) {
            startTodayPrompt(true);
          }
        }
      }
    } catch (error) {
      console.error('Error handling activity ledger input:', error);
    }
  };

  const saveActivityLedgerEntry = async (entryToSave = null) => {
    try {
      // Use the provided entry or fall back to current state
      const entryData = entryToSave || currentLedgerEntry;

      console.log('Saving activity ledger entry:', entryData);

      const response = await fetch(`${baseURL}activityLedger/createOrUpdate`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: person._id,
          date: entryData.date,
          activity: entryData.activity,
          food: entryData.food,
        }),
      });

      const responseJson = await response.json();

      if (responseJson.status === 'OK') {
        console.log('Activity ledger entry saved successfully:', responseJson.data);

        // Update person's activity ledger status
        const savedDateIso = entryData?.date;
        const todayIso = new Date().toISOString().split('T')[0];
        const hasTodayEntry =
          savedDateIso && savedDateIso === todayIso
            ? true
            : person.activityLedger?.hasTodayEntry || false;
        const updatedPerson = {
          ...person,
          activityLedger: {
            ...person.activityLedger,
            hasTodayEntry,
            lastUpdated: new Date().toISOString(),
          },
        };
        setPerson(updatedPerson);
        dispatch(updatePerson1(updatedPerson));

        // Return the saved entry's _id for use in reframe checks
        return responseJson.data?._id;
      }
    } catch (error) {
      console.error('Error saving activity ledger entry:', error);
      return null;
    }
  };

  const checkForReframeSuggestions = async (entryToCheck = null, activityLedgerId = null) => {
    try {
      // Check if user has REMEMBOT package before making API call
      const userPackages = person?.user?.packages || person1?.user?.packages || [];
      const hasRemembotPackage = userPackages.includes('REMEMBOT');

      if (!hasRemembotPackage) {
        console.log('User does not have REMEMBOT package - skipping reframe suggestions');
        return;
      }

      // Use the provided entry or fall back to current state
      const entryData = entryToCheck || currentLedgerEntry;

      if (
        !entryData.activity?.beforeFeeling ||
        !entryData.activity?.afterFeeling
      ) {
        return;
      }

      console.log('Checking reframe suggestions, excluding activityLedgerId:', activityLedgerId);
      console.log('Person location:', person.location);
      console.log('Person1 location (Redux):', person1.location);
      console.log('Activity place coords:', {
        lat: entryData.activity?.place?.latitude,
        long: entryData.activity?.place?.longitude,
      });

      // Use device location if available (check both person and person1 from Redux), fallback to activity place coordinates
      const latitude = person.location?.latitude || person1.location?.latitude || entryData.activity?.place?.latitude;
      const longitude = person.location?.longitude || person1.location?.longitude || entryData.activity?.place?.longitude;

      console.log('Using coordinates for search:', { latitude, longitude });

      const response = await fetch(
        `${baseURL}activityLedger/getReframeSuggestion`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: person._id,
            beforeFeeling: entryData.activity.beforeFeeling,
            afterFeeling: entryData.activity.afterFeeling,
            city: entryData.activity?.place?.city,
            state: entryData.activity?.place?.state,
            country: entryData.activity?.place?.country,
            latitude: latitude,
            longitude: longitude,
            activityLedgerId: activityLedgerId, // Exclude current activity
            accompaniment: entryData.activity?.accompaniment || null, // Pass accompaniment for distance calculation
            weather: entryData.activity?.weather || null, // Pass weather for distance calculation
          }),
        },
      );

      const responseJson = await response.json();

      if (responseJson.status === 'OK') {
        if (responseJson.hasSuggestion) {
          setMessages(msgs => [
            ...msgs,
            {
              message: responseJson.message,
              me: false,
              emotion: 'suggestive',
              avatar: avatar,
              isReframeSuggestion: true,
              distanceInMiles: responseJson.distanceInMiles,
            },
          ]);
        } else if (responseJson.requiresPackage === 'REMEMBOT') {
          // Show upsell message if user doesn't have REMEMBOT package
          setMessages(msgs => [
            ...msgs,
            {
              message: responseJson.message,
              me: false,
              emotion: 'suggestive',
              avatar: avatar,
              isPackageUpsell: true,
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Error checking for reframe suggestions:', error);
    }
  };

  const handleFlowSendSms = () => {
    console.log('Processing to send SMS');
    console.log('Country code:', person?.countryCode);
    console.log('Mobile Number: ', person?.mobile);
    console.log('Plan Message :', planMessage);

    const mobile = person?.mobile ? String(person.mobile) : '';

    if (!mobile || !person.countryCode) {
      setShowAddPhoneNumberModal(true);
      return;
    }

    fetch(`${baseURL}services/send-sms`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: person?.countryCode + person?.mobile,
        message: planMessage,
      }),
    })
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.success) {
          setPlanMessage('');
          setMessages(msgs => [
            ...msgs,
            {
              message: 'sms sent successfully to your mobile number',
              me: false,
              emotion: 'happy',
              avatar: avatar,
            },
          ]);
          setShowFlowPlanButton(false);
        } else {
          setMessages(msgs => [
            ...msgs,
            {
              message:
                'Unable to send SMS. Please check your number and try again.',
              me: false,
              emotion: 'sad',
              avatar: avatar,
            },
          ]);
        }
      })
      .catch(error => {
        console.error('Error in API call:', error.message);
        setMessages(msgs => [
          ...msgs,
          {
            message:
              'Unable to send SMS. Please check your number and try again.',
            me: false,
            emotion: 'sad',
            avatar: avatar,
          },
        ]);
        alert('Failed to send SMS. Please try again later.');
        setPlanMessage('');
        setShowFlowPlanButton(false);
      });
  };

  return (
    <SafeAreaView style={styles.root}>
      <View
        style={[
          styles.avatarPanel,
          isKeyboardVisible && styles.avatarPanelKeyboardOpen,
        ]}>
        <AvatarWebView
          ref={avatarWebViewRef}
          avatar={avatar}
          onAvatarEvent={handleAvatarEvent}
          style={isKeyboardVisible && styles.avatarWebViewKeyboardOpen}
        />
        <Text style={styles.avatarName}>{avatar}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatArea}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      {/* <ScrollView
          ref={scrollViewRef}
          onContentSizeChange={(width, height) => {
            scrollViewRef.current?.scrollTo({y: height, animated: true});
          }}
          onLayout={() => {
            scrollViewRef.current?.scrollToEnd({animated: true});
          }}
          // contentContainerStyle={{ flexGrow: 1 }}
        >
          {messages.map((message, index) => (
            <Message
              // key={index}
              message={message}
              handleInstruction={handleFlowSendSms}
              person={person}
            />
          ))}
        </ScrollView> */}

      <FlatList
        ref={scrollViewRef}
        style={styles.chatList}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          <Message
            message={item}
            handleInstruction={handleFlowSendSms}
            person={person}
            concealText={pendingSpeechMessageIndex === index && !item.me}
          />
        )}
        onContentSizeChange={(width, height) => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}
        onLayout={() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}
        contentContainerStyle={styles.chatListContent}
      />
      <View
        style={[
          styles.inputBox,
          type === 0 ? styles.inputBoxSingleLine : styles.inputBoxMultiline,
          isKeyboardVisible && styles.inputBoxKeyboardOpen,
        ]}>
        {/* <View
        style={[
          styles.inputBox,
          {
            height: type === 0 ? 40 : 80,
            paddingBottom: Platform.select({
              ios: 20,
              android: 0,
            }),
          },
        ]}> */}
        <TextInput
          ref={inputRef}
          value={userInput}
          style={[
            styles.input,
            {
              backgroundColor: type === 3 ? '#f0f8ff' : '#fff',
            },
          ]}
          placeholder={type === 0 ? 'Name' : 'Intent'}
          maxLength={type === 0 ? 35 : 255}
          multiline={type !== 0 ? true : false}
          keyboardType={srx?.inputType === 'number' ? 'numeric' : 'default'}
          blurOnSubmit={true}
          onChangeText={setUserInput}
          onSubmitEditing={async () => {
            setMessages(msgs => [
              ...msgs,
              { message: userInput, me: true, emotion: emotion, avatar: avatar },
            ]);
            await submitMessage(false);
          }}
        />
        {srx?.inputType === 'any' && !userInput ? (
          <TouchableOpacity onPress={choosePhoto}>
            <Ionicon
              name="image"
              size={24}
              color="#000"
              style={{ marginHorizontal: 5 }}
            />
          </TouchableOpacity>
        ) : null}
        {srx?.inputType === 'any' && !userInput ? (
          <TouchableOpacity onPress={takePhoto}>
            <Ionicon
              name="camera"
              size={24}
              color="#000"
              style={{ marginHorizontal: 5 }}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      </KeyboardAvoidingView>

      <Modal isVisible={showBotStore}>
        <View style={styles.packagesModal}>
          <Text style={styles.packagesModalHeadingText}>Packages</Text>
          <ScrollView>
            {packages?.map((pkg, index) => (
              <ListItem>
                <ListItem.CheckBox
                  checked={pkg.selected}
                  checkedColor="blue"
                  onIconPress={() => {
                    let packagesArray = [...packages];
                    packagesArray[index].selected =
                      !packagesArray[index].selected;
                    setPackages(packagesArray);
                  }}
                />
                <ListItem.Content>
                  <ListItem.Title>{pkg.name}</ListItem.Title>
                </ListItem.Content>
                <Image
                  style={{ height: 65, width: 90, borderRadius: 5 }}
                  resizeMode="contain"
                  source={
                    packagesImages[pkg.name] ? packagesImages[pkg.name] : null
                  }
                />
              </ListItem>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.packagesSubmitButton}
            onPress={onSubmitUpdatePackages}>
            <Text style={styles.packagesSubmitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <AddToShoppingListModal
        showAddToShoppingListModal={showAddToShoppingListModal}
        lineItems={modalData}
        onChangeQuantity={onChangeLineItemQuantity}
        onSavePress={onAddLineItemsSavePress}
        onClosePress={onAddSAClosePress}
      />

      <UpdateShoppingListModal
        showUpdateShoppingListModal={showUpdateShoppingListModal}
        lineItems={modalData}
        onChangeQuantity={onChangeLineItemQuantity}
        onCheckBoxPress={onUpdateSACheckBoxPress}
        onSavePress={onUpdateSASavePress}
        onClosePress={onUpdateSAClosePress}
      />

      <ViewShoppingListModal
        showViewShoppingListModal={showViewShoppingListModal}
        lineItems={modalData}
        onClosePress={onViewSAClosePress}
      />

      <CategoryListModal
        isVisible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategorySelect={handleCategorySelect}
      />

      <UnitListModal
        isVisible={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onUnitSelect={handleCategorySelect}
      />

      <UpdateFulfillmentShoppingListModal
        showUpdateFulfillmentSAModal={showUpdateFulfillmentSAModal}
        lineItems={modalData}
        onCheckBoxPress={onUpdateFulfillmentSACheckBoxPress}
        onNextPress={onUpdateFulfillmentSANextPress}
        onClosePress={onUpdateFulfillmentSAClosePress}
      />

      <SelectDateAndStoreModal
        showSelectDateAndStoreModal={showSelectDateAndStoreSAModal}
        onSavePress={onConfirmFulfillmentSASavePress}
        onClosePress={onConfirmFulfillmentSAClosePress}
      />

      <ScheduleModal
        showScheduleModal={showScheduleModal}
        onSavePress={onSaveScheduleModal}
        onClosePress={onScheduleModalClosePress}
      />

      <ViewTodoListModal
        showViewTodoListModal={showViewTodoListModal}
        listItems={modalData}
        onClosePress={onViewTLClosePress}
      />

      <UpdateTodoListModal
        showUpdateTodoListModal={showUpdateTodoListModal}
        todoItems={modalData}
        onCheckBoxPress={onUpdateTLCheckBoxPress}
        onEditTodoSavePress={onEditTodoSavePress}
        onAddTodoSavePress={onAddTodoSavePress}
        onSavePress={onUpdateTLSavePress}
        onClosePress={onUpdateTLClosePress}
      />

      <UpdateFulfillmentTodoListModal
        showUpdateFulfillmentTodoListModal={showUpdateFulfillmentTLModal}
        todoItems={modalData}
        onSavePress={todoIndex => {
          let todoArray = [...modalData];
          todoArray.splice(todoIndex, 1);
          setModalData(todoArray);
        }}
        onClosePress={() => {
          setShowUpdateFulfillmentTLModal(false);
          setModalData([]);
        }}
      />

      <AddPhoneNumberModal
        showAddPhoneNumberModal={showAddPhoneNumberModal}
        person={person}
        setPerson={setPerson}
        // onSavePress={handleFlowSendSms}
        onClosePress={() => setShowAddPhoneNumberModal(false)}
      />

      <PostNeedForm
        showPostNeedModal={showPostNeedModal}
        onPostNeedPress={handlePostNeed}
        onClosePress={() => setShowPostNeedModal(false)}
        presetNeedType={srx?.presetNeedType}
      />

      <ActivityLedgerModal
        isVisible={showActivityLedgerModal}
        onClose={() => setShowActivityLedgerModal(false)}
        onSave={handleActivityLedgerInput}
        currentEntry={currentLedgerEntry}
        step={ledgerStep}
        onStepChange={setLedgerStep}
      />
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
  },
  avatarPanel: {
    width: '100%',
    height: 420,
    marginTop: 10,
    marginBottom: 10,
    position: 'relative',
    zIndex: 1,
  },
  chatArea: {
    flex: 1,
    minHeight: 0,
  },
  chatList: {
    flex: 1,
    minHeight: 0,
  },
  chatListContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 12,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 8,
    marginBottom: 10,
    marginHorizontal: 20,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  inputBoxSingleLine: {
    height: 48,
  },
  inputBoxMultiline: {
    minHeight: 60,
    maxHeight: 104,
    alignItems: 'flex-end',
  },
  inputBoxKeyboardOpen: {
    marginBottom: Platform.OS === 'android' ? 6 : 10,
  },
  input: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    textAlignVertical: 'center',
    color: '#000',
    minHeight: 32,
  },
  avatarName: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    color: 'gray',
    fontWeight: '600',
    fontSize: 12,
  },
  packagesModal: {
    flex: 1,
    width: '95%',
    borderRadius: 5,
    alignSelf: 'center',
    backgroundColor: '#FFF',
  },
  packagesModalHeadingText: {
    alignSelf: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    color: '#000',
    marginTop: 10,
  },
  packagesSubmitButton: {
    alignSelf: 'center',
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 40,
    marginVertical: 10,
    borderRadius: 5,
  },
  packagesSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  flowPlanButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    paddingVertical: 8,
    backgroundColor: 'blue',
    borderRadius: 10,
    padding: 12,
  },
  flowPlanButton: {
    marginTop: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    paddingTop: 5,
  },
  avatarPanelKeyboardOpen: {
    height: 250,
    marginBottom: 4,
  },
  avatarWebViewKeyboardOpen: {
    height: 220,
  },
});
