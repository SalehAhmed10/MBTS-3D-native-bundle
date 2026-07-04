import { useChatStore } from '@/stores/chatStore';
import { useGetPerson } from '@/hooks/useGetPerson';
import type { AuthProperty, CandidateUser } from '@/types/chat';

const AUTH_PROPERTIES: AuthProperty[] = [
  'favoriteColor',
  'homeCountry',
  'homeState',
  'mothersMaidenName',
];

const AUTH_FAILURE_PROMPT =
  "Based on your responses, I couldn't verify your identity. Please register at BOTCIERGE.com.";

function authenticationMessage(property: AuthProperty): string {
  if (property === 'favoriteColor') return "What's your favorite color?";
  if (property === 'homeCountry') return "What's your home country?";
  if (property === 'homeState') return "What's your home state?";
  return "What's your mother's maiden name?";
}

function getLimit(property: AuthProperty): number {
  return property === 'mothersMaidenName' ? 50 : 30;
}

export function useAuthFlow(addAvatarMessage: (text: string) => void) {
  const {
    chatStep,
    guestName,
    authenticated,
    person,
    users,
    authProperties,
    currentAuthProp,
    setChatStep,
    setGuestName,
    setAuthenticated,
    setPerson,
    setUsers,
    setAuthProperties,
    setCurrentAuthProp,
  } = useChatStore();

  const { mutateAsync: getPerson } = useGetPerson();

  const resetAuthChallenge = () => {
    setAuthProperties(AUTH_PROPERTIES);
    setCurrentAuthProp(null);
    setUsers([]);
    setChatStep('intent');
  };

  const verifyPerson = async (user: CandidateUser) => {
    const verifiedPerson = await getPerson(user);
    setAuthenticated(true);
    setPerson(verifiedPerson);
    resetAuthChallenge();
    addAvatarMessage('I have successfully verified your identity. How may I assist you?');

    if (verifiedPerson.user?.avatarName && verifiedPerson.user.avatarName !== 'Camilia') {
      addAvatarMessage(`I see you've chosen ${verifiedPerson.user.avatarName} to be your host`);
      addAvatarMessage(`Bye ${guestName}. ${verifiedPerson.user.avatarName} will take care of you from here :)`);
    }
  };

  const askNextAuthQuestion = async (
    candidateUsers: CandidateUser[],
    remainingProperties: AuthProperty[]
  ) => {
    if (candidateUsers.length === 0) {
      addAvatarMessage(AUTH_FAILURE_PROMPT);
      resetAuthChallenge();
      return;
    }

    if (remainingProperties.length === 0 || candidateUsers.length === 1) {
      await verifyPerson(candidateUsers[0]);
      return;
    }

    const [nextProperty, ...nextRemainingProperties] = remainingProperties;
    setCurrentAuthProp(nextProperty);
    setAuthProperties(nextRemainingProperties);
    addAvatarMessage(authenticationMessage(nextProperty));
  };

  const handleAuthMessage = async (nextMessage: string) => {
    if (authProperties.length === AUTH_PROPERTIES.length && !currentAuthProp) {
      if (nextMessage.length > 20) {
        addAvatarMessage("I don't understand. Please be more concise.");
        return;
      }

      if (nextMessage.toLowerCase().includes('yes')) {
        await askNextAuthQuestion(users, authProperties);
        return;
      }

      if (nextMessage.toLowerCase().includes('no')) {
        const firstUser = users[0];
        const filteredUsers = users.filter(
          (u) => u.lastName !== firstUser?.lastName || u.homeCity !== firstUser?.homeCity
        );

        if (filteredUsers.length > 0) {
          setUsers(filteredUsers);
          addAvatarMessage(
            `Are you ${guestName} ${filteredUsers[0].lastName} from ${filteredUsers[0].homeCity}?`
          );
        } else {
          addAvatarMessage(AUTH_FAILURE_PROMPT);
          resetAuthChallenge();
        }
        return;
      }

      addAvatarMessage("I don't understand. Please be more concise.");
      return;
    }

    if (!currentAuthProp) {
      await askNextAuthQuestion(users, authProperties);
      return;
    }

    if (nextMessage.length > getLimit(currentAuthProp)) {
      addAvatarMessage("I don't understand. Please be more concise.");
      return;
    }

    const filteredUsers = users.filter((u) => {
      const expected = u[currentAuthProp as keyof CandidateUser] as string | undefined;
      return expected ? nextMessage.toLowerCase().includes(expected.toLowerCase()) : false;
    });

    setUsers(filteredUsers);
    await askNextAuthQuestion(filteredUsers, authProperties);
  };

  const handleNameMessage = (nextMessage: string) => {
    if (!/^[A-Za-z0-9' ]+\??$/.test(nextMessage)) {
      addAvatarMessage('Invalid name');
      return;
    }

    if (nextMessage.includes(' ')) {
      const lastWord = nextMessage.split(' ').pop() || nextMessage;
      addAvatarMessage(`${lastWord}, your name cannot contain spaces.`);
      return;
    }

    setGuestName(nextMessage);
    setChatStep('intent');
    addAvatarMessage(`Hi ${nextMessage}, welcome to the BOTCierge experience. How may I assist you?`);
  };

  return {
    chatStep,
    guestName,
    authenticated,
    person,
    handleAuthMessage,
    handleNameMessage,
    resetAuthChallenge,
  };
}
