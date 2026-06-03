import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import Modal from 'react-native-modal';
import {Icon} from '@rneui/themed';
import {Dropdown} from 'react-native-element-dropdown';
import {useSelector} from 'react-redux';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import {packagesImages} from '../../services/HelperData';

const PostNeedForm = ({
  showPostNeedModal,
  onPostNeedPress,
  onClosePress,
  presetNeedType,
}) => {
  const person = useSelector(state => state.person.person);
  const packages = person?.user?.packages || [];

  const [needType, setNeedType] = useState(presetNeedType || '');
  const [address, setAddress] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [description, setDescription] = useState('');
  const [byWhen, setByWhen] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours
  });
  const [showByWhenPicker, setShowByWhenPicker] = useState(false);
  const [digitHerSupportType, setDigitHerSupportType] = useState('');
  const [showDigitHerDescription, setShowDigitHerDescription] = useState(false);

  // EducationX state
  const [educationSupportType, setEducationSupportType] = useState('');
  const [educationSubject, setEducationSubject] = useState('');
  const [educationTopic, setEducationTopic] = useState('');
  const [showEducationConfirmation, setShowEducationConfirmation] =
    useState(false);

  useEffect(() => {
    if (presetNeedType) {
      setNeedType(presetNeedType);
    }
  }, [presetNeedType]);

  useEffect(() => {
    if (showPostNeedModal) {
      resetForm();
    }
  }, [showPostNeedModal]);

  const handleDateChange = (event, selectedDate) => {
    setShowByWhenPicker(false);
    if (event.type === 'set' && selectedDate) {
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 0);
      setByWhen(endOfDay);
    }
  };

  const handleDigitHerSupportChange = item => {
    setDigitHerSupportType(item.value);
    setShowDigitHerDescription(item.value === 'other');
    if (item.value !== 'other') {
      setDescription(''); // Clear description if not "Other"
    }
  };

  const needOptions = [
    {label: 'Food', value: 'food'},
    {label: 'Blood', value: 'blood'},
    {label: 'Bill', value: 'billbridge'},
    {label: 'Rescue Bid', value: 'rescuebids'},
    {label: 'Digit Her', value: 'digither'},
    {label: 'Education', value: 'educationx'},
  ];

  const mapValueToPackageKey = value => {
    switch (value) {
      case 'food':
        return 'FOODLINK';
      case 'blood':
        return 'BLOODSHARE';
      case 'billbridge':
        return 'BILLBRIDGE';
      case 'rescuebids':
        return 'RESCUEBIDS';
      case 'digither':
        return 'DIGITHER';
      case 'educationx':
        return 'EDUCATIONX';
      default:
        return null;
    }
  };

  const bloodOptions = [
    {label: 'A+', value: 'A+'},
    {label: 'A-', value: 'A-'},
    {label: 'B+', value: 'B+'},
    {label: 'B-', value: 'B-'},
    {label: 'AB+', value: 'AB+'},
    {label: 'AB-', value: 'AB-'},
    {label: 'O+', value: 'O+'},
    {label: 'O-', value: 'O-'},
  ];

  const digitHerOptions = [
    {
      label: 'Domestic Safety (e.g., domestic violence, stalking)',
      value: 'domestic_safety',
    },
    {label: 'Reproductive Health & Rights', value: 'reproductive_health'},
    {label: 'Emotional or Mental Health', value: 'mental_health'},
    {label: 'Financial Support or Independence', value: 'financial_support'},
    {label: 'Legal Assistance', value: 'legal_assistance'},
    {label: 'Human Trafficking or Emergency Help', value: 'emergency_help'},
    {label: 'Professional Growth or Mentorship', value: 'professional_growth'},
    {label: 'Other', value: 'other'},
  ];

  const educationSupportOptions = [
    {label: 'Tutoring Match', value: 'tutoring_match'},
    {label: 'Homework Assistant', value: 'homework_assistant'},
    {label: 'Study Plan Builder', value: 'study_plan_builder'},
    {label: 'Test Prep Coach', value: 'test_prep_coach'},
  ];

  const educationSubjects = [
    {label: 'Math', value: 'Math'},
    {label: 'Chemistry', value: 'Chemistry'},
    {label: 'Physics', value: 'Physics'},
    {label: 'Biology', value: 'Biology'},
    {label: 'English', value: 'English'},
    {label: 'History', value: 'History'},
    {label: 'Geography', value: 'Geography'},
    {label: 'Computer Science', value: 'Computer Science'},
    {label: 'Economics', value: 'Economics'},
    {label: 'Other', value: 'Other'},
  ];

  const filteredNeedOptions = needOptions.filter(option => {
    if (option.value === 'food' && packages.includes('FOODLINK')) return true;
    if (option.value === 'blood' && packages.includes('BLOODSHARE'))
      return true;
    if (option.value === 'billbridge' && packages.includes('BILLBRIDGE'))
      return true;
    if (option.value === 'rescuebids' && packages.includes('RESCUEBIDS'))
      return true;
    if (option.value === 'digither' && packages.includes('DIGITHER'))
      return true;
    if (option.value === 'educationx' && packages.includes('EDUCATIONX'))
      return true;
    return false;
  });

  const getPackage = needType => {
    if (needType === 'food') return 'FOODLINK';
    if (needType === 'blood') return 'BLOODSHARE';
    if (needType === 'billbridge') return 'BILLBRIDGE';
    if (needType === 'rescuebids') return 'RESCUEBIDS';
    if (needType === 'digither') return 'DIGITHER';
    if (needType === 'educationx') return 'EDUCATIONX';
    return '';
  };

  const handleEducationSubmit = () => {
    setShowEducationConfirmation(true);
  };

  const handleEducationConfirmation = confirmed => {
    if (confirmed) {
      const educationDescription = `Needs ${educationSupportType.replace(
        '_',
        ' ',
      )} in ${educationSubject}, ${educationTopic}`;
      onPostNeedPress({
        needType: 'educationx',
        address,
        packageName: 'EDUCATIONX',
        description: educationDescription,
        byWhen: byWhen.toISOString(),
        supportType: educationSupportType,
      });
      handleClose();
    } else {
      // Reset the topic and let them edit both subject and topic
      setEducationTopic('');
      setShowEducationConfirmation(false);
    }
  };

  const handlePostNeed = () => {
    if (needType === 'educationx') {
      handleEducationSubmit();
      return;
    }

    onPostNeedPress({
      needType,
      address,
      packageName: getPackage(needType),
      bloodType: needType === 'blood' ? bloodType : undefined,
      description: [
        'food',
        'blood',
        'billbridge',
        'rescuebids',
        'digither',
      ].includes(needType)
        ? description
        : undefined,
      byWhen: byWhen.toISOString(),
      supportType: needType === 'digither' ? digitHerSupportType : undefined,
    });
  };

  const handleClose = () => {
    resetForm();
    onClosePress();
  };

  const resetForm = () => {
    const now = new Date();
    setNeedType('');
    setAddress('');
    setBloodType('');
    setDescription('');
    setByWhen(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    setEducationSupportType('');
    setEducationSubject('');
    setEducationTopic('');
    setShowEducationConfirmation(false);
  };

  const renderNeedItem = item => {
    const imageKey = mapValueToPackageKey(item.value);
    const imageSource = imageKey ? packagesImages[imageKey] : null;

    return (
      <View style={styles.item}>
        {imageSource && <Image source={imageSource} style={styles.itemImage} />}
        <Text style={styles.itemText}>{item.label}</Text>
      </View>
    );
  };

  const renderSelectedIcon = () => {
    if (!needType) return null;
    const imageKey = mapValueToPackageKey(needType);
    const imageSource = imageKey ? packagesImages[imageKey] : null;

    return imageSource ? (
      <Image source={imageSource} style={styles.itemImage} />
    ) : null;
  };

  return (
    <>
      <Modal
        isVisible={showPostNeedModal}
        animationIn="fadeIn"
        animationOut="fadeOut"
        avoidKeyboard={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <View style={styles.modalContent}>
            <Icon
              type="material"
              name="cancel"
              containerStyle={styles.closeIcon}
              onPress={handleClose}
            />
            <Text style={styles.heading}>Post a Need</Text>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {!showEducationConfirmation ? (
                <>
                  <View style={styles.attributeRow}>
                    <Text style={styles.attributeHeadingText}>Need Type</Text>
                    <Dropdown
                      data={filteredNeedOptions}
                      labelField="label"
                      valueField="value"
                      placeholder="Select Need Type"
                      value={needType}
                      onChange={item => {
                        setNeedType(item.value);
                        setBloodType('');
                        setDigitHerSupportType('');
                        setShowDigitHerDescription(false);
                        setEducationSupportType('');
                        setEducationSubject('');
                        setEducationTopic('');
                      }}
                      style={styles.dropdown}
                      containerStyle={styles.dropdownContainer}
                      placeholderStyle={styles.placeholderText}
                      renderItem={renderNeedItem}
                      renderLeftIcon={renderSelectedIcon}
                    />
                  </View>

                  {needType === 'blood' && (
                    <>
                      <View style={styles.attributeRow}>
                        <Text style={styles.attributeHeadingText}>
                          What blood type do you need?
                        </Text>
                        <Dropdown
                          data={bloodOptions}
                          labelField="label"
                          valueField="value"
                          placeholder="Select Blood Group"
                          value={bloodType}
                          onChange={item => setBloodType(item.value)}
                          style={styles.dropdown}
                          containerStyle={styles.dropdownContainer}
                          placeholderStyle={styles.placeholderText}
                        />
                      </View>

                      <View style={styles.attributeRow}>
                        <Text style={styles.attributeHeadingText}>
                          Why is this blood needed?
                        </Text>
                        <TextInput
                          value={description}
                          placeholder="e.g. Needed urgently for surgery tomorrow"
                          style={styles.input}
                          placeholderTextColor={'#a9a9a9'}
                          onChangeText={setDescription}
                          multiline={true}
                        />
                      </View>
                    </>
                  )}

                  {needType === 'digither' && (
                    <>
                      <View style={styles.attributeRow}>
                        <Text style={styles.attributeHeadingText}>
                          What type of support do you need today?
                        </Text>
                        <Dropdown
                          data={digitHerOptions}
                          labelField="label"
                          valueField="value"
                          placeholder="Select support category"
                          value={digitHerSupportType}
                          onChange={handleDigitHerSupportChange}
                          style={styles.dropdown}
                          containerStyle={styles.dropdownContainer}
                          placeholderStyle={styles.placeholderText}
                        />
                      </View>
                      {(showDigitHerDescription || digitHerSupportType) && (
                        <View style={styles.attributeRow}>
                          <Text style={styles.attributeHeadingText}>
                            {digitHerSupportType === 'other'
                              ? 'Please describe your safety concern or support needed'
                              : 'Additional details (optional)'}
                          </Text>
                          <TextInput
                            value={description}
                            placeholder={
                              digitHerSupportType === 'other'
                                ? 'e.g. I need immediate help due to domestic violence threat'
                                : 'Any additional information that might help'
                            }
                            style={styles.input}
                            placeholderTextColor={'#a9a9a9'}
                            onChangeText={setDescription}
                            multiline={true}
                          />
                        </View>
                      )}
                    </>
                  )}

                  {['food', 'billbridge', 'rescuebids'].includes(needType) && (
                    <View style={styles.attributeRow}>
                      <Text style={styles.attributeHeadingText}>
                        {needType === 'food'
                          ? 'What kind of food assistance do you need?'
                          : needType === 'billbridge'
                          ? "What's this bill about?"
                          : 'Why do you need a RescueBid?'}
                      </Text>
                      <TextInput
                        value={description}
                        placeholder={
                          needType === 'food'
                            ? 'e.g. Need groceries for the week'
                            : needType === 'billbridge'
                            ? 'e.g. Utility bill due in 2 days'
                            : 'e.g. Need $50 to avoid overdraft fee'
                        }
                        style={styles.input}
                        placeholderTextColor={'#a9a9a9'}
                        onChangeText={setDescription}
                        multiline={true}
                      />
                    </View>
                  )}

                  {needType === 'educationx' && (
                    <>
                      <View style={styles.attributeRow}>
                        <Text style={styles.attributeHeadingText}>
                          What type of education support do you need?
                        </Text>
                        <Dropdown
                          data={educationSupportOptions}
                          labelField="label"
                          valueField="value"
                          placeholder="Select Education Service"
                          value={educationSupportType}
                          onChange={item => setEducationSupportType(item.value)}
                          style={styles.dropdown}
                          containerStyle={styles.dropdownContainer}
                          placeholderStyle={styles.placeholderText}
                        />
                      </View>

                      {educationSupportType && (
                        <View style={styles.attributeRow}>
                          <Text style={styles.attributeHeadingText}>
                            What subject do you need help with?
                          </Text>
                          <Dropdown
                            data={educationSubjects}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Subject"
                            value={educationSubject}
                            onChange={item => setEducationSubject(item.value)}
                            style={styles.dropdown}
                            containerStyle={styles.dropdownContainer}
                            placeholderStyle={styles.placeholderText}
                          />
                        </View>
                      )}

                      {educationSubject && (
                        <View style={styles.attributeRow}>
                          <Text style={styles.attributeHeadingText}>
                            What specific topic do you need help with?
                          </Text>
                          <TextInput
                            value={educationTopic}
                            placeholder="e.g. Linear Algebra, Chemical Bonds, etc."
                            style={styles.input}
                            placeholderTextColor={'#a9a9a9'}
                            onChangeText={setEducationTopic}
                            multiline={true}
                          />
                        </View>
                      )}
                    </>
                  )}

                  <View style={styles.attributeRow}>
                    <Text style={styles.attributeHeadingText}>
                      By when do you need it?
                    </Text>
                    <TouchableOpacity
                      style={styles.dateInputView}
                      onPress={() => setShowByWhenPicker(true)}>
                      <Text style={{color: '#000'}}>
                        {byWhen.toLocaleDateString()}
                      </Text>
                      <Icon type="ionicon" name="calendar" size={18} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.attributeRow}>
                    <Text style={styles.attributeHeadingText}>Address</Text>
                    <TextInput
                      value={address}
                      placeholder="Enter Address"
                      style={styles.input}
                      placeholderTextColor={'#a9a9a9'}
                      onChangeText={setAddress}
                      multiline={true}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.postButton,
                      (needType === 'blood' && !bloodType) ||
                      (needType === 'digither' && !digitHerSupportType) ||
                      (needType === 'educationx' &&
                        (!educationSupportType ||
                          !educationSubject ||
                          !educationTopic))
                        ? {backgroundColor: '#ccc'}
                        : null,
                    ]}
                    onPress={handlePostNeed}
                    disabled={
                      (needType === 'blood' && !bloodType) ||
                      (needType === 'digither' && !digitHerSupportType) ||
                      (needType === 'educationx' &&
                        (!educationSupportType ||
                          !educationSubject ||
                          !educationTopic))
                    }>
                    <Text style={styles.postButtonText}>
                      {needType === 'educationx'
                        ? 'Review Request'
                        : 'Post Need'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                // EducationX confirmation view
                <View style={styles.confirmationContainer}>
                  <Text style={styles.confirmationHeading}>
                    Please confirm your education request:
                  </Text>
                  <Text style={styles.confirmationText}>
                    {`${person?.sex} student age ${
                      person?.age || 'unknown'
                    } from ${
                      person?.homeCountry || 'unknown'
                    } needs ${educationSupportType.replace(
                      '_',
                      ' ',
                    )} in ${educationSubject}, ${educationTopic}`}
                  </Text>
                  <Text style={styles.confirmationQuestion}>
                    Is this correct?
                  </Text>

                  <View style={styles.confirmationButtons}>
                    <TouchableOpacity
                      style={[styles.confirmButton, styles.yesButton]}
                      onPress={() => handleEducationConfirmation(true)}>
                      <Text style={styles.buttonText}>Yes, Post It</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.confirmButton, styles.noButton]}
                      onPress={() => handleEducationConfirmation(false)}>
                      <Text style={styles.buttonText}>No, Edit Again</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {showByWhenPicker && (
        <RNDateTimePicker
          value={byWhen}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}
    </>
  );
};

export default PostNeedForm;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    maxHeight: '85%',
    marginHorizontal: 10,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    alignSelf: 'center',
    marginVertical: 20,
  },
  attributeRow: {
    flexDirection: 'column',
    marginBottom: 20,
  },
  attributeHeadingText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: '#f0f8ff',
    height: 50,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  dropdownContainer: {
    borderRadius: 5,
    borderColor: '#ccc',
  },
  placeholderText: {
    color: '#a9a9a9',
  },
  input: {
    paddingLeft: 15,
    height: 100,
    backgroundColor: '#f0f8ff',
    textAlignVertical: 'top',
    borderRadius: 5,
  },
  postButton: {
    width: 150,
    backgroundColor: 'green',
    paddingVertical: 15,
    borderRadius: 10,
    alignSelf: 'center',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  dateInputView: {
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    backgroundColor: '#f0f8ff',
    borderRadius: 5,
  },
  confirmationContainer: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  confirmationHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
    lineHeight: 24,
  },
  confirmationQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000',
    textAlign: 'center',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
  },
  yesButton: {
    backgroundColor: 'green',
  },
  noButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  itemImage: {
    width: 34,
    height: 34,
    marginRight: 20,
    resizeMode: 'cover',
  },
  itemText: {
    fontSize: 16,
    color: '#000',
  },
});
