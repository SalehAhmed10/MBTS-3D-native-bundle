import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'; 
import Modal from 'react-native-modal';
import {Icon} from '@rneui/themed';
import PhoneInput from 'react-native-international-phone-number';
import {baseURL} from '../utils/api';
import axios from 'axios';

const AddPhoneNumberModal = ({
  showAddPhoneNumberModal,
  person,
  setPerson,
  onClosePress,
}) => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryCode, setCountryCode] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  console.log(person?._id, "Person's ID");

  useEffect(() => {
    if (showAddPhoneNumberModal) {
      if (person?.mobile) {
        setInputValue(String(person?.mobile));
      } else {
        setInputValue('');
      }
    }
  }, [showAddPhoneNumberModal, person?.mobile]);

  function handleInputValue(phoneNumber) {
    setInputValue(phoneNumber);
  }

  function handleSelectedCountry(country) {
    setSelectedCountry(country);
    const countryCode = country?.callingCode;
    setCountryCode(countryCode);
  }

  console.log('Country Code -------->', countryCode);

  const handleSavePress = async () => {
    if (inputValue && selectedCountry) {
      setLoading(true);
      const phoneNumber = inputValue.replace(/\s+/g, '');

      console.log('Phone Number', phoneNumber);
      console.log('Country Code', countryCode);

      try {
        const response = await axios.patch(
          `${baseURL}auth/${person?._id}`,
          {
            mobile: Number(phoneNumber),
            countryCode: countryCode,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        console.log(response.data, 'API response123');

        if (response.data.success) {
          console.log("Person's Profile updated successfully");
          console.log('updated person ------------>', response.data);
          console.log(response.data.result, 'API response-----------');
          setPerson(prevPerson => ({
            ...prevPerson,
            countryCode: countryCode,
            mobile: response.data.result.mobile,
          }));

          onClosePress();
        }
      } catch (error) {
        console.error('Error in API call:', error);
        alert('Failed to update profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please enter a valid phone number');
    }
  };

  return (
    <Modal
      isVisible={showAddPhoneNumberModal}
      animationIn="fadeIn"
      animationOut="fadeOut">
      <View style={styles.container}>
        <Icon
          type="material"
          name="cancel"
          containerStyle={{position: 'absolute', top: 10, right: 10}}
          onPress={onClosePress}
        />
        <Text style={styles.heading}>Add Phone Number</Text>

        <PhoneInput
          value={inputValue}
          onChangePhoneNumber={handleInputValue}
          selectedCountry={selectedCountry}
          onChangeSelectedCountry={handleSelectedCountry}
          phoneInputStyles={{
            flag: {
              fontSize: 16,
            },
            callingCode: {
              fontSize: 14,
            },
            input: {
              fontSize: 14,
              height: '100%',
              paddingVertical: 0,
            },
          }}
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSavePress}
          disabled={loading} // Disable the button when loading
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" /> // Show loading spinner
          ) : (
            <Text style={styles.saveButtonText}>Save</Text> // Show "Save" text when not loading
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default AddPhoneNumberModal;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 5,
    alignSelf: 'center',
    padding: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    alignSelf: 'center',
    marginVertical: 20,
  },
  saveButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'blue',
    borderRadius: 10,
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
