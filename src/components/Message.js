import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {
  emotionsBenjamin,
  emotionsCamille,
  emotionsCandy,
  emotionsDan,
  emotionsDebbie,
  emotionsJohn,
  emotionsMargie,
  emotionsMuhammad,
  emotionsPrithi,
  emotionsProfessor,
  emotionsVanessa,
  emotionsVictoria,
} from '../services/HelperData';
import fallbackImage from '../assets/images/camille-new.jpg';

const Message = props => {
  const {message, handleInstruction, person, concealText = false} = props;
  const isMe = message?.me;
  const isImage = message?.isImage;
  const instruction = message?.instruction;
  const emotion = message?.emotion || 'happy';
  const avatar = message.avatar || 'Camilia';
  const MAX_WORDS = person?.chatResponseLimit || 200;

  const [showFullMessage, setShowFullMessage] = useState(
    message?.showFullMessage || false,
  );
  const [modalVisible, setModalVisible] = useState(false);

  const emotions = {
    Camilia: emotionsCamille,
    Camille: emotionsCamille,
    John: emotionsJohn,
    Debbie: emotionsDebbie,
    Dan: emotionsDan,
    Margie: emotionsMargie,
    Victoria: emotionsVictoria,
    Vanessa: emotionsVanessa,
    Professor: emotionsProfessor,
    Muhammad: emotionsMuhammad,
    Benjamin: emotionsBenjamin,
    Prithi: emotionsPrithi,
    Candy: emotionsCandy,
  };

  const getEmotionImage = () => {
    const emotionObject = emotions[avatar]?.find(e => e.emotion === emotion);
    return emotionObject?.image ?? fallbackImage;
  };

  const handleShowProfileImage = () => {
    setModalVisible(true);
  };

  const handleCloseProfileImage = () => {
    setModalVisible(false);
  };

  // const handleShowMore = () => {
  //   // Simulate asking for confirmation (e.g., via a dialog or a separate flow)

  //   setShowFullMessage(true);
  // };

  const renderMessageText = () => {
    if (isImage) {
      return (
        <Image
          style={styles.image}
          source={{uri: `data:image/png;base64,${message.message}`}}
          resizeMode="cover"
        />
      );
    }

    if (concealText) {
      return (
        <Text
          style={{
            color: isMe ? '#FFF' : '#000',
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontStyle: 'italic',
          }}>
          ...
        </Text>
      );
    }

    const messageText = message?.message || '';
    const words = messageText.split(' ');
    const isLongMessage = words?.length > MAX_WORDS;

    if (showFullMessage || !isLongMessage) {
      return (
        <Text
          style={{
            color: isMe ? '#FFF' : '#000',
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}>
          {message.message}
        </Text>
      );
    }

    const truncatedMessage = words.slice(0, MAX_WORDS).join(' ') + '...';
    return (
      <>
        <Text style={styles.messageText}>{truncatedMessage}</Text>
      </>
    );
  };

  return (
    <>
      {instruction ? (
        <TouchableOpacity
          onPress={handleInstruction}
          style={styles.flowPlanButton}>
          <Text style={styles.flowPlanButtonText}>{message.message}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.messageContainer}>
          {!isMe && (
            <TouchableOpacity onPress={handleShowProfileImage}>
              <Image
                style={styles.profileImage}
                source={getEmotionImage()}
              />
            </TouchableOpacity>
          )}
          <View
            style={{
              backgroundColor: isMe ? '#4F8DBF' : '#ECECEC',
              marginLeft: isMe ? 'auto' : 5,
              marginRight: isMe ? 10 : 'auto',
              marginTop: 5,
              maxWidth: '75%',
              borderRadius: 10,
            }}>
            {renderMessageText()}
          </View>
        </View>
      )}

      {/* Full-screen Profile Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseProfileImage}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={handleCloseProfileImage}
          />
          <Image
            style={styles.fullScreenImage}
            // source={getProfileImage(emotion)}
            source={getEmotionImage()}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </>
  );
};

export default Message;

const styles = StyleSheet.create({
  image: {
    width: 200,
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    marginBottom: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    paddingTop: 5,
  },
  messageText: {
    color: '#000',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  showMoreButton: {
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  showMoreText: {
    color: '#4F8DBF',
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fullScreenImage: {
    width: '60%',
    height: '60%',
    borderRadius: 10,
  },
});
