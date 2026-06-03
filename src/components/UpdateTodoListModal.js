import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import React, {useState} from 'react';
import Modal from 'react-native-modal';
import {CheckBox, Icon, ListItem} from '@rneui/themed';
import DropDownPicker from 'react-native-dropdown-picker';

const UpdateTodoListModal = ({
  showUpdateTodoListModal,
  todoItems,
  onCheckBoxPress,
  onAddTodoSavePress,
  onEditTodoSavePress,
  onSavePress,
  onClosePress,
}) => {
  const [selectedTodoIndex, setSelectedTodoIndex] = useState(-1);
  const [showEditTodoItem, setShowEditTodoItem] = useState(false);
  const [showAddTodoItem, setShowAddTodoItem] = useState(false);
  const [task, setTask] = useState('');
  const [place, setPlace] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [showDropDownPicker, setShowDropDownPicker] = useState(false);

  const resetModalData = () => {
    if (showEditTodoItem) setShowEditTodoItem(false);
    if (showAddTodoItem) setShowAddTodoItem(false);
    if (selectedTodoIndex !== -1) setSelectedTodoIndex(-1);
    if (task) setTask('');
    if (place) setPlace('');
    if (isEmergency) setIsEmergency(false);
    if (showDropDownPicker) setShowDropDownPicker(false);
  };

  if (showUpdateTodoListModal) {
    if (showEditTodoItem || showAddTodoItem) {
      return (
        <>
          <Modal
            isVisible={showEditTodoItem || showAddTodoItem}
            animationIn="fadeIn"
            animationOut="fadeOut">
            <View style={styles.container}>
              <Icon
                type="material"
                name="cancel"
                containerStyle={{position: 'absolute', top: 10, right: 10}}
                onPress={() => {
                  resetModalData();
                  onClosePress();
                }}
              />
              <Text style={styles.heading}>
                {showEditTodoItem ? 'Edit' : 'Add'} Todo
              </Text>
              <View style={styles.attributeRow}>
                <View style={styles.attributeHeadingContainer}>
                  <Text style={styles.attributeHeadingText}>Task</Text>
                </View>
                <TextInput
                  value={task}
                  placeholder="Task"
                  style={styles.taskInput}
                  placeholderTextColor={'#a9a9a9'}
                  onChangeText={setTask}
                />
              </View>
              {showAddTodoItem ? (
                <View style={styles.attributeRow}>
                  <View style={styles.attributeHeadingContainer}>
                    <Text style={styles.attributeHeadingText}>Place</Text>
                  </View>
                  <TextInput
                    value={place}
                    placeholder="Place"
                    style={styles.taskInput}
                    placeholderTextColor={'#a9a9a9'}
                    onChangeText={setPlace}
                  />
                </View>
              ) : null}
              <View style={styles.attributeRow}>
                <View style={styles.attributeHeadingContainer}>
                  <Text style={styles.attributeHeadingText}>Emergency</Text>
                </View>
                <View style={{flex: 1}}>
                  <DropDownPicker
                    open={showDropDownPicker}
                    value={isEmergency}
                    items={[
                      {label: 'Yes', value: true},
                      {label: 'No', value: false},
                    ]}
                    setValue={setIsEmergency}
                    setOpen={setShowDropDownPicker}
                    style={{backgroundColor: '#f0f8ff'}}
                    labelStyle={{fontWeight: 'bold', paddingLeft: 5}}
                    textStyle={{fontWeight: 'bold'}}
                  />
                </View>
              </View>

              <View style={styles.bottomButtonsRow}>
                <TouchableOpacity
                  style={styles.bottomButton}
                  onPress={() => {
                    if (showAddTodoItem) {
                      onAddTodoSavePress(task, place, isEmergency);
                    } else if (showEditTodoItem) {
                      onEditTodoSavePress(selectedTodoIndex, task, isEmergency);
                    }
                    resetModalData();
                  }}>
                  <Text style={styles.bottomButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      );
    }
    return (
      <>
        <Modal
          isVisible={showUpdateTodoListModal}
          animationIn="fadeIn"
          animationOut="fadeOut">
          <View style={styles.container}>
            <Icon
              type="material"
              name="cancel"
              containerStyle={{position: 'absolute', top: 10, right: 10}}
              onPress={() => onClosePress()}
            />
            <Text style={styles.heading}>Update Todo List</Text>
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
                      onPress={() => {
                        setSelectedTodoIndex(index);
                        setTask(item.task);
                        setIsEmergency(item.isEmergency);
                        setShowEditTodoItem(true);
                      }}>
                      {index + 1}. {item.task}
                    </ListItem.Title>
                  </ListItem.Content>
                  <CheckBox
                    checked={!item.delete}
                    onIconPress={() => onCheckBoxPress(index)}
                  />
                </ListItem>
              )}
            />

            <View style={styles.bottomButtonsRow}>
              <TouchableOpacity
                style={styles.bottomButton}
                onPress={() => onSavePress()}>
                <Text style={styles.bottomButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bottomButton}
                onPress={() => setShowAddTodoItem(true)}>
                <Text style={styles.bottomButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  }
};

export default UpdateTodoListModal;

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
    width: 90,
    justifyContent: 'center',
  },
  attributeHeadingText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  taskInput: {
    paddingLeft: 15,
    height: 50,
    flex: 1,
    backgroundColor: '#f0f8ff',
    textAlignVertical: 'center',
  },
  emergencyDropDown: {
    flex: 1,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  bottomButton: {
    width: 100,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'blue',
    borderRadius: 10,
  },
  bottomButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
