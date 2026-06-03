import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import React, { useState } from 'react';
import Modal from 'react-native-modal';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Icon } from '@rneui/themed';

const ScheduleModal = ({
  showScheduleModal,
  onSavePress,
  onClosePress,
}) => {

  const [wakeTime, setWakeTime] = useState(() => {
    const wake = new Date();
    wake.setHours(9, 0, 0, 0); 
    return wake;
  });
  
  const [sleepTime, setSleepTime] = useState(() => {
    const sleep = new Date();
    sleep.setHours(23, 0, 0, 0); 
    return sleep;
  });
  const [schedule, setSchedule] = useState([["",""]]);
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);
  const [showSleepTimePicker, setShowSleepTimePicker] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState({ index: null, type: 'start' });

  const addNewSchedule = () => {
    setSchedule([...schedule, ['', '']]);
  };

  const RemoveNewSchedule = () => {
    if (schedule.length > 0) {
      setSchedule(schedule.slice(0, -1));
    }
  };

  const updateSchedule = (index, type, time) => {
    const updatedSchedule = [...schedule];
    updatedSchedule[index][type === 'start' ? 0 : 1] = time;
    setSchedule(updatedSchedule);
  };

  const resetStates = () => {
    setWakeTime(() => {
      const wake = new Date();
      wake.setHours(9, 0, 0, 0); 
      return wake;
    });

    setSleepTime(() => {
      const sleep = new Date();
      sleep.setHours(23, 0, 0, 0); 
      return sleep;
    });

    setSchedule([["", ""]]);
  };

  const onSave = async() => {
    const formattedWakeTime = wakeTime instanceof Date
      ? wakeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      : wakeTime;

    const formattedSleepTime = sleepTime instanceof Date
      ? sleepTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      : sleepTime;

    const convertTo24HourFormat = (time) => {
      const [timeString, period] = time.split(' ');
      let [hours, minutes] = timeString.split(':').map(Number);

      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const formatScheduleTo24Hour = (schedule) => {
      return schedule
        .map((timeTuple) => {
          const startTime = timeTuple[0]
            ? convertTo24HourFormat(timeTuple[0].replace(' ', ' '))  
            : '';

          const endTime = timeTuple[1]
            ? convertTo24HourFormat(timeTuple[1].replace(' ', ' '))  
            : '';

          return [startTime, endTime];
        })
        .filter((timeTuple) => timeTuple[0] && timeTuple[1]);
    };

    const formattedSchedule = formatScheduleTo24Hour(schedule);
    await onSavePress(formattedWakeTime, formattedSleepTime, formattedSchedule);
    resetStates()

  }

  return (
    <>
      <Modal
        isVisible={showScheduleModal}
        animationIn="fadeIn"
        animationOut="fadeOut">
        <ScrollView contentContainerStyle={styles.container}>
          <Icon
            type="material"
            name="cancel"
            containerStyle={{ position: 'absolute', top: 10, right: 10 }}
            onPress={onClosePress}
          />
          <Text style={styles.heading}>You have not added your daily schedule or sleep and wake up time please add this to generate flow pan</Text>
          <View style={styles.attributeRow}>
            <View style={styles.attributeHeadingContainer}>
              <Text style={styles.attributeHeadingText}>Wake Time</Text>
            </View>
            <TouchableOpacity style={styles.dateInputView} onPress={() => setShowWakeTimePicker(true)}
            >
              <Text>{wakeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Icon
                type="ionicon"
                name="time"
                size={18}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.attributeRow}>
            <View style={styles.attributeHeadingContainer}>
              <Text style={styles.attributeHeadingText}>Sleep Time</Text>
            </View>
            <TouchableOpacity style={styles.dateInputView} onPress={() => setShowSleepTimePicker(true)} >
              <Text>{sleepTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Icon
                type="ionicon"
                name="time"
                size={18}

              />
            </TouchableOpacity>
          </View>
          <Text style={styles.scheduleHeading}>Busy Times Schedules</Text>
          {schedule?.map((tuple, index) => (
            <View key={index} style={styles.scheduleRow}>
              <TouchableOpacity style={styles.scheduleInputView}  onPress={() => setShowSchedulePicker({ index, type: 'start' })}>
                <Text>{tuple[0]}</Text>
                <Icon
                  type="ionicon"
                  name="time"
                  size={18}
                />
              </TouchableOpacity>
              <Text style={styles.scheduleDivider}>-</Text>
              <TouchableOpacity style={styles.scheduleInputView}  onPress={() => setShowSchedulePicker({ index, type: 'end' })}>
                <Text>{tuple[1]}</Text>
                <Icon
                  type="ionicon"
                  name="time"
                  size={18}
                />
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around' }}>
            <TouchableOpacity style={styles.addButton} onPress={addNewSchedule}>
              <Text style={styles.addButtonText}>Add Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={RemoveNewSchedule}>
              <Text style={[styles.addButtonText, { color: "red" }]}>Remove Schedule</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={onSave}>
            <Text style={styles.updateButtonText}>Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {showWakeTimePicker && (
        <RNDateTimePicker
          value={wakeTime}
          mode={'time'}
          display="spinner"
          onChange={(e, t) => {
            setShowWakeTimePicker(false);
            if (e.type === 'set') {
              setWakeTime(t);
            }
          }}
        />
      )}

      {showSleepTimePicker && (
        <RNDateTimePicker
          value={sleepTime}
          mode={'time'}
          display="spinner"
          onChange={(e, t) => {
            setShowSleepTimePicker(false);
            if (e.type === 'set') {
              setSleepTime(t);
            }
          }}
        />
      )}

      {showSchedulePicker.index !== null && (
        <RNDateTimePicker
          value={new Date()}
          mode={'time'}
          display="spinner"
          onChange={(e, t) => {
            setShowSchedulePicker({ index: null, type: 'start' });
            if (e.type === 'set') {
              updateSchedule(
                showSchedulePicker.index,
                showSchedulePicker.type,
                t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              );
            }
          }}
        />
      )}
    </>
  );
};

export default ScheduleModal;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 5,
    alignSelf: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  heading: {
    fontSize: 16,
    marginRight:15,
    color: 'red',
    alignSelf: 'center',
    marginBottom: 20,
  },
  attributeRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  attributeHeadingContainer: {
    width: 100,
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
  scheduleHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    marginLeft: 20,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  scheduleInputView: {
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    height: 50,
    backgroundColor: '#f0f8ff',
  },
  scheduleDivider: {
    marginHorizontal: 10,
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    alignSelf: 'center',
    marginVertical: 10,
  },
  addButtonText: {
    color: 'blue',
    fontSize: 16,
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
