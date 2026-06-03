import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {getNeedType, postBid} from '../redux/slices/xShareSlice';
import {getPackageImage, packagesImages} from '../services/HelperData';
import {useFocusEffect} from '@react-navigation/native';
import {formatRelativeTime} from '../utils/dateUtils';

const ActiveNeedsScreen = ({route, navigation}) => {
  const {person, needTypeFilter} = route.params || {};

  const dispatch = useDispatch();

  const person1 = useSelector(state => state.person.person);
  const {needTypes, loading, error} = useSelector(state => state.xShare);

  const [filteredNeeds, setFilteredNeeds] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [bidMessage, setBidMessage] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (needTypes) {
      let filtered = needTypes.filter(item => item.userId?._id !== person1._id);

      if (needTypeFilter) {
        filtered = filtered.filter(item => {
          const itemNeedType = getNeed(item.packageName);
          return itemNeedType === needTypeFilter;
        });
      }

      setFilteredNeeds(filtered);
    }
  }, [needTypes, needTypeFilter, person1._id]);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(getNeedType(person1));
    }, [dispatch, person1]),
  );

  const openModal = () => setModalVisible(true);

  const handleSubmitBid = item => {
    dispatch(
      postBid({
        bidMessage: bidMessage,
        needId: item._id,
        userId: person1._id,
      }),
    );

    setModalVisible(false);
    setBidMessage('');
  };

  const getNeed = packageName => {
    switch (packageName) {
      case 'FOODLINK':
        return 'food';
      case 'BLOODSHARE':
        return 'blood';
      case 'BILLBRIDGE':
        return 'bill';
      case 'RESCUEBIDS':
        return 'rescue';
      case 'DIGITHER':
        return 'digither';
      case 'EDUCATIONX':
        return 'education';
      default:
        return '';
    }
  };

  const noNeedsMessage =
    filteredNeeds.length === 0 && needTypeFilter
      ? `No needs found for ${needTypeFilter}`
      : 'No needs found';

  const onRefresh = () => {
    setRefreshing(true);
    // Trigger the action to refresh the data
    dispatch(getNeedType(person1)).finally(() => {
      setRefreshing(false);
    });
  };

  const renderItem = ({item}) => (
    <View style={styles.card}>
      <View style={styles.userInfo}>
        <Image
          source={getPackageImage(item?.packageName)}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.name}>
            {item?.userId?.firstName + ' ' + item?.userId?.lastName}
          </Text>
          <Text style={styles.time}>{formatRelativeTime(item?.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.foodshare}>
        {item?.packageName}{' '}
        {item.bloodType && `(${item.bloodType} blood group needed)`}
      </Text>
      <View style={styles.messageBox}>
        <Text style={styles.message}>{item?.description}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          item.status === 'Posted' ? styles.postedButton : styles.postBidButton,
        ]}
        onPress={
          item.status === 'Posted'
            ? null
            : () => {
                openModal(); // Open modal
                setCurrentItem(item); // Store the current item when opening the modal
              }
        }>
        <Text
          style={[
            styles.buttonText,
            item.status === 'Posted' && styles.postedButtonText,
          ]}>
          {item?.status}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#00B8D4" />
        </TouchableOpacity>
        <Text style={styles.header}>Active Needs</Text>
      </View>

      <View style={styles.separator} />

      {/* {error && <Text style={styles.errorText}>{error}</Text>} */}

      {loading.getNeed && (
        <ActivityIndicator
          size="large"
          color="#00B8D4"
          // style={{marginVertical: 45}}
          style={styles.loader}
        />
      )}

      {!loading.getNeed && needTypes.length === 0 ? (
        <Text style={styles.noNeedsText}>No needs found</Text>
      ) : (
        <>
          {filteredNeeds.length === 0 && (
            <Text style={styles.noNeedsText}>{noNeedsMessage}</Text>
          )}

          <FlatList
            data={filteredNeeds}
            renderItem={renderItem}
            keyExtractor={(item, index) => index?.toString()}
            contentContainerStyle={styles.flatListContent}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </>
      )}

      {/* Modal for submitting bid */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Post Bid</Text>
            <Text style={styles.modalSubTitle}>Bid</Text>
            <TextInput
              style={styles.input}
              placeholder="Type your bid here"
              placeholderTextColor={'#a9a9a9'}
              value={bidMessage}
              onChangeText={setBidMessage}
              multiline={true}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => handleSubmitBid(currentItem)}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ActiveNeedsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 14,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    paddingTop: 18,
    paddingLeft: 16,
    backgroundColor: '#F9F9F9',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00B8D4',
    marginLeft: 10,
  },
  loader: {
    marginVertical: 80,
    alignSelf: 'center',
  },
  noNeedsText: {
    fontSize: 18,
    color: '#7D7D7D',
    textAlign: 'center',
    marginTop: 80,
  },
  flatListContent: {
    marginTop: 0,
    paddingBottom: 30,
    paddingHorizontal: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 60,
    marginBottom: 20,
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 20,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  time: {
    color: '#7D7D7D',
    fontSize: 12,
  },
  foodshare: {
    fontSize: 14,
    color: '#00B8D4',
    fontWeight: '600',
    marginBottom: 5,
  },
  messageBox: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  message: {
    color: '#333',
    fontSize: 14,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  postBidButton: {
    backgroundColor: '#00B8D4',
  },
  postedButton: {
    backgroundColor: '#F0F0F0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  postedButtonText: {
    color: '#00B8D4',
  },
  // Modal styles
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 350,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    width: '100%',
    height: 80,
    textAlignVertical: 'top',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 15,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: '#f0f8ff',
  },
  submitButton: {
    backgroundColor: '#00B8D4',
    paddingVertical: 10,
    paddingHorizontal: 40,
    marginBottom: 10,
    width: '100%',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
