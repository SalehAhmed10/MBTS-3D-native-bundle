import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {addReview, getReview} from '../redux/slices/xShareSlice';

const ReviewContractScreen = ({route, navigation}) => {
  const {name, contractId} = route.params;
  const [selected, setSelected] = useState(null);
  const [review, setReview] = useState('');
  const dispatch = useDispatch();
  const {loading, existingReview} = useSelector(state => state.xShare);

  useEffect(() => {
    // Check for existing review when screen loads
    dispatch(getReview(contractId));
  }, [contractId, dispatch]);

  useEffect(() => {
    // If there's an existing review, populate the form
    if (existingReview) {
      setSelected(existingReview.experience);
      setReview(existingReview.review);
    }
  }, [existingReview]);

  const handleThumbPress = type => {
    if (existingReview) {
      Alert.alert('Error', 'You have already submitted a review');
      return;
    }
    setSelected(type);
  };

  const handleSubmitReview = async () => {
    if (existingReview) {
      Alert.alert('Error', 'You have already submitted a review');
      return;
    }

    if (!selected) {
      Alert.alert('Error', 'Please select your experience');
      return;
    }

    if (!review.trim()) {
      Alert.alert('Error', 'Please write your review');
      return;
    }

    try {
      await dispatch(
        addReview({
          contractId,
          review: review.trim(),
          experience: selected,
        }),
      ).unwrap();

      Alert.alert('Success', 'Review submitted successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('My Needs'),
        },
      ]);
    } catch (error) {
      if (error.message === 'Review already exists for this contract') {
        Alert.alert('Error', 'You have already submitted a review');
      } else {
        Alert.alert('Error', error.message || 'Failed to submit review');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('My Needs')}>
          <Ionicons name="arrow-back" size={24} color="#00B8D4" />
        </TouchableOpacity>
        <Text style={styles.header}>Review Contract</Text>
      </View>
      <View style={styles.separator} />

      <Text style={styles.question}>How was your experience with {name}?</Text>

      <View style={styles.thumbContainer}>
        <TouchableOpacity
          onPress={() => handleThumbPress('like')}
          style={styles.thumbItem}>
          <Icon
            name="thumbs-up"
            size={65}
            color={selected === 'like' ? '#000000' : '#D3D3D3'}
          />
          <Text style={styles.thumbLabel}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleThumbPress('dislike')}
          style={styles.thumbItem}>
          <Icon
            name="thumbs-down"
            size={65}
            color={selected === 'dislike' ? '#000000' : '#D3D3D3'}
          />
          <Text style={styles.thumbLabel}>Dislike</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Write your review"
        style={styles.textInput}
        value={review}
        onChangeText={setReview}
        multiline
        editable={!existingReview}
      />

      <TouchableOpacity
        style={[styles.submitButton, existingReview && styles.disabledButton]}
        onPress={handleSubmitReview}
        disabled={loading || !!existingReview}>
        <Text style={styles.submitButtonText}>
          {existingReview
            ? 'Review Submitted'
            : loading
            ? 'Submitting...'
            : 'Submit Review'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ReviewContractScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingLeft: 8,
    paddingBottom: 20,
    backgroundColor: '#F9F9F9',
  },
  header: {fontSize: 21, fontWeight: 'bold', color: '#00B8D4', marginLeft: 10},
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 20,
    width: '100%',
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00B8D4',
    marginBottom: 10,
    alignSelf: 'center',
  },
  question: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  thumbContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 20,
  },
  thumbItem: {
    alignItems: 'center',
  },
  thumbLabel: {
    marginTop: 6,
    color: '#00B8D4',
    fontWeight: '600',
  },
  textInput: {
    height: 100,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#00B8D4',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
});
