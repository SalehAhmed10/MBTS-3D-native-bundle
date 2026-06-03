import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import React, {useState} from 'react';
import Modal from 'react-native-modal';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import {Icon} from '@rneui/themed';

const SelectDateAndStoreModal = ({
  showSelectDateAndStoreModal,
  onSavePress,
  onClosePress,
}) => {
  const [store, setStore] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <>
      <Modal
        isVisible={showSelectDateAndStoreModal}
        animationIn="fadeIn"
        animationOut="fadeOut">
        <View style={styles.container}>
          <Icon
            type="material"
            name="cancel"
            containerStyle={{position: 'absolute', top: 10, right: 10}}
            onPress={onClosePress}
          />
          <Text style={styles.heading}>Update Fulfillment</Text>
          <View style={styles.attributeRow}>
            <View style={styles.attributeHeadingContainer}>
              <Text style={styles.attributeHeadingText}>Store</Text>
            </View>
            <TextInput
              value={store}
              placeholder="Name"
              style={styles.storeInput}
              placeholderTextColor={'#a9a9a9'}
              onChangeText={setStore}
            />
          </View>
          <View style={styles.attributeRow}>
            <View style={styles.attributeHeadingContainer}>
              <Text style={styles.attributeHeadingText}>Date</Text>
            </View>
            <View style={styles.dateInputView}>
              <Text>{date.toDateString()}</Text>
              <Icon
                type="ionicon"
                name="calendar"
                size={18}
                onPress={() => setShowDatePicker(true)}
              />
            </View>
          </View>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => onSavePress(store, date)}>
            <Text style={styles.updateButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {showDatePicker && (
        <RNDateTimePicker
          value={date}
          mode={'date'}
          display="spinner"
          maximumDate={new Date()}
          onChange={(e, d) => {
            console.log(`${JSON.stringify(e)} ${JSON.stringify(d)}`);
            setShowDatePicker(false);
            if (e.type === 'set') {
              setDate(d);
            }
          }}
        />
      )}
    </>
  );
};

export default SelectDateAndStoreModal;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFF',
    borderRadius: 5,
    alignSelf: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    alignSelf: 'center',
    marginVertical: 20,
  },
  attributeRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  attributeHeadingContainer: {
    width: 60,
    justifyContent: 'center',
  },
  attributeHeadingText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  storeInput: {
    paddingLeft: 15,
    height: 50,
    flex: 1,
    backgroundColor: '#f0f8ff',
    textAlignVertical: 'center',
  },
  dateInputView: {
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    height: 50,
    backgroundColor: '#f0f8ff',
  },
  updateButton: {
    width: 100,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'blue',
    alignSelf: 'center',
    marginVertical: 20,
    borderRadius: 10,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
