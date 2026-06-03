import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';

const ActivityLedgerModal = ({
  isVisible,
  onClose,
  onSave,
  currentEntry,
  step,
  onStepChange,
}) => {
  const [inputValue, setInputValue] = useState('');

  const getStepTitle = () => {
    switch (step) {
      case 0:
        return 'What did you do today?';
      case 1:
        return 'Where did this activity take place?';
      case 2:
        return 'Who were you with? (name, relationship)';
      case 3:
        return 'Rate your experience (1-5)';
      case 4:
        return 'How did it make you feel?';
      case 5:
        return 'How were you feeling before this activity?';
      case 6:
        return 'Additional comments about your experience';
      case 7:
        return 'What did you eat?';
      case 8:
        return 'Where did you eat? (optional)';
      case 9:
        return 'Describe the food';
      case 10:
        return 'List food items (separate with commas)';
      default:
        return 'Activity Ledger';
    }
  };

  const getStepPlaceholder = () => {
    switch (step) {
      case 0:
        return 'e.g., Went to the park, Had coffee with friends';
      case 1:
        return 'e.g., Central Park, Starbucks';
      case 2:
        return 'e.g., John, Best friend';
      case 3:
        return 'Enter 1-5';
      case 4:
        return 'e.g., happy, excited, grateful';
      case 5:
        return 'e.g., stressed, sad, anxious';
      case 6:
        return 'Any additional thoughts...';
      case 7:
        return 'e.g., Pizza, Salad';
      case 8:
        return 'Press Enter to skip or enter place name';
      case 9:
        return 'e.g., Delicious Italian pizza with fresh ingredients';
      case 10:
        return 'e.g., Margherita pizza, Caesar salad, Garlic bread';
      default:
        return '';
    }
  };

  const handleNext = () => {
    if (!inputValue.trim()) {
      Alert.alert('Error', 'Please enter a value');
      return;
    }

    if (step === 3) {
      const rating = parseInt(inputValue);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        Alert.alert('Error', 'Please enter a number between 1 and 5');
        return;
      }
    }

    onSave(inputValue);
    setInputValue('');
  };

  const handleSkip = () => {
    if (step === 7) {
      onSave(''); // Empty string for skip
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{getStepTitle()}</Text>

          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={getStepPlaceholder()}
            multiline={step === 0 || step === 5 || step === 8}
            numberOfLines={step === 0 || step === 5 || step === 8 ? 3 : 1}
            maxLength={step === 3 ? 1 : 255}
            keyboardType={step === 3 ? 'numeric' : 'default'}
          />

          <View style={styles.buttonContainer}>
            {step === 7 && (
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {step === 9 ? 'Finish' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    fontSize: 16,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  skipButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ActivityLedgerModal;
