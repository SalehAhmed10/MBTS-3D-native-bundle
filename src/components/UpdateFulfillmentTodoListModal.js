import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import React, {useState} from 'react';
import Modal from 'react-native-modal';
import {CheckBox, Icon, ListItem} from '@rneui/themed';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { baseURL } from '../utils/api';

const UpdateFulfillmentTodoListModal = ({
  showUpdateFulfillmentTodoListModal,
  todoItems,
  onSavePress,
  onClosePress,
}) => {
  const [selectedTodoIndex, setSelectedTodoIndex] = useState(-1);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onSaveFulfillment = () => {
    return fetch(`${baseURL}requests/updateTodoFulfillment`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        item: todoItems[selectedTodoIndex],
        fulfilledDate: date,
      }),
    })
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.status === 'OK') {
          return true;
        } else {
          return false;
        }
      })
      .catch(error => {
        console.log(error);
        return false;
      });
  };

  if (showUpdateFulfillmentTodoListModal) {
    if (selectedTodoIndex !== -1) {
      return (
        <>
          <Modal
            isVisible={selectedTodoIndex >= 0}
            animationIn="fadeIn"
            animationOut="fadeOut">
            <View style={styles.container}>
              <Icon
                type="material"
                name="cancel"
                containerStyle={{position: 'absolute', top: 10, right: 10}}
                onPress={() => onClosePress()}
              />
              <Text style={styles.heading}>Update Fulfillment</Text>
              <View style={styles.attributeRow}>
                <View style={styles.attributeHeadingContainer}>
                  <Text style={styles.attributeHeadingText}>Task</Text>
                </View>
                <View style={styles.dateInputView}>
                  <Text
                    style={styles.attributeHeadingText}
                    ellipsizeMode="tail"
                    numberOfLines={1}>
                    {todoItems[selectedTodoIndex]?.task}
                  </Text>
                </View>
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
                onPress={async () => {
                  let fUpdated = await onSaveFulfillment();
                  if (fUpdated) {
                    onSavePress(selectedTodoIndex);
                    setDate(new Date());
                    setSelectedTodoIndex(-1);
                  } else {
                    Alert.alert(
                      'Error',
                      'Could not update fulfillment, please try again!',
                    );
                  }
                }}>
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
    }

    return (
      <>
        <Modal
          isVisible={showUpdateFulfillmentTodoListModal}
          animationIn="fadeIn"
          animationOut="fadeOut">
          <View style={styles.container}>
            <Icon
              type="material"
              name="cancel"
              containerStyle={{position: 'absolute', top: 10, right: 10}}
              onPress={() => onClosePress()}
            />
            <Text style={styles.heading}>Update Fulfillment</Text>
            <FlatList
              data={todoItems}
              renderItem={({item, index}) => (
                <ListItem containerStyle={{maxHeight: 100}}>
                  <ListItem.Content>
                    <ListItem.Title
                      ellipsizeMode="tail"
                      numberOfLines={3}
                      style={{
                        color: item.isEmergency ? 'red' : '#000',
                        fontWeight: 'bold',
                        paddingLeft: 15,
                      }}
                      onPress={() => setSelectedTodoIndex(index)}>
                      {index + 1}. {item.task}
                    </ListItem.Title>
                  </ListItem.Content>
                </ListItem>
              )}
            />
            <View style={{height: 40}} />
          </View>
        </Modal>
      </>
    );
  }
};

export default UpdateFulfillmentTodoListModal;

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
