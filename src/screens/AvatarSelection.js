import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {avatars} from '../data/avatars';
import {useFocusEffect} from '@react-navigation/native';
import axios from 'axios';
import {baseURL} from '../utils/api';
import { updatePerson1 } from '../redux/slices/personSlice';
import { useDispatch, useSelector } from 'react-redux';

const AvatarItem = React.memo(({item, onPress, selectedAvatar}) => (
  <TouchableOpacity onPress={onPress} style={styles.avatarContainer}>
    <View style={styles.avatarWrapper}>
      <Image
        source={item.image}
        style={[
          styles.avatar,
          selectedAvatar?.id !== item.id && styles.faintAvatar,
        ]}
      />
      {selectedAvatar?.id === item.id && (
        <Icon
          name="check-circle"
          size={30}
          color="green"
          style={styles.checkIcon}
        />
      )}
    </View>
  </TouchableOpacity>
));

const AvatarSelection = ({navigation}) => {
  const dispatch = useDispatch();
  const person = useSelector(state => state.person.person); 
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const initialAvatar = avatars.find(
        avatar => avatar.name === person?.user?.avatarName,
      );
      setSelectedAvatar(initialAvatar || null);

      return () => {
        setSelectedAvatar(null);
      };
    }, [person]),
  );

  const handleSelectAvatar = avatar => {
    setSelectedAvatar(avatar);
  };

  const handleConfirmSelection = async () => {
    setShowModal(false);

    if (selectedAvatar) {
      try {
        const response = await axios.put(
          `${baseURL}auth/avatar-name/${person?._id}`,
          {
            user: {
              avatarName: selectedAvatar.name,
            },
          },
        );

        if (response.data.success) {
          dispatch(
            updatePerson1({
              user: {
                ...person.user,
                avatarName: selectedAvatar.name,
              },
            }),
          );
          navigation.navigate('Home', {
            updatedAvatar: selectedAvatar.name,
            avatarMessage: `You have chosen ${selectedAvatar.name} to be your host`,
          });
        }

        console.log('Avatar updated successfully:', response.data);
      } catch (error) {
        console.error('Error updating avatar:', error.message);
        alert(
          'Unable to update your avatar at the moment. Please attempt again later.',
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Avatar</Text>

      {selectedAvatar ? (
        <>
          <View style={styles.avatarWrapper}>
            <Image source={selectedAvatar.image} style={styles.avatar} />
            <Text style={styles.selectText}>{selectedAvatar.name}</Text>
          </View>
        </>
      ) : (
        <View style={styles.avatarContainer}>
          <Icon name="user" size={60} color="#ccc" />
          <Text style={styles.selectText}>No avatar selected</Text>
        </View>
      )}

      <FlatList
        data={avatars}
        renderItem={({item}) => (
          <AvatarItem
            item={item}
            onPress={() => handleSelectAvatar(item)}
            selectedAvatar={selectedAvatar}
          />
        )}
        keyExtractor={item => item.id}
        numColumns={3}
        columnWrapperStyle={styles.columnWrapper}
      />

      <TouchableOpacity
        style={[styles.button, !selectedAvatar && styles.disabledButton]}
        onPress={() => setShowModal(true)}
        disabled={!selectedAvatar}>
        <Text style={styles.buttonText}>Upload Avatar</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.buttonText2}>
              Are you sure you want to select your avatar as{' '}
              {selectedAvatar?.name}?
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.yesButton]}
                onPress={handleConfirmSelection}>
                <Text style={styles.buttonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.noButton]}
                onPress={() => setShowModal(false)}>
                <Text style={styles.buttonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
  },
  faintAvatar: {
    opacity: 0.7,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarContainer: {
    margin: 10,
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-around',
  },
  checkIcon: {
    position: 'absolute',
    top: 0,
    right: -5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  selectText: {
    padding: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonText2: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  yesButton: {
    backgroundColor: 'green',
  },
  noButton: {
    backgroundColor: 'red',
  },
});

export default AvatarSelection;
