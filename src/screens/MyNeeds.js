import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {getPackageImage} from '../services/HelperData';
import {useFocusEffect} from '@react-navigation/native';
import {formatRelativeTime} from '../utils/dateUtils';
import {getXShareByUserId} from '../redux/slices/xShareSlice';

const MyNeedsScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {myNeeds, loading, error} = useSelector(state => state.xShare);
  const person = useSelector(state => state.person.person);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (person && person._id) {
        dispatch(getXShareByUserId({userId: person._id}));
      }
    }, [dispatch, person]),
  );

  const getNeed = packageName => {
    if (packageName === 'FOODLINK') {
      return 'food';
    }
    if (packageName === 'BLOODSHARE') {
      return 'blood';
    }
    return '';
  };

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(getXShareByUserId({userId: person._id})).finally(() =>
      setRefreshing(false),
    );
  };

  const navigateToPostBids = (postId, address) => {
    // Navigate to the screen that shows the bidders for this post
    navigation.navigate('BiddersScreen', {postId: postId, address: address});
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
            {person?.firstName + ' ' + person?.lastName}
          </Text>
          <Text style={styles.time}>
            Posted {formatRelativeTime(item?.createdAt)}
          </Text>
        </View>
      </View>
      <Text style={styles.needTitle}>
        {item?.packageName}{' '}
        {item.bloodType && `(${item.bloodType} blood group)`}
      </Text>
      <Text style={styles.needDescription}>{item?.description}</Text>
      <TouchableOpacity
        style={styles.cardButton}
        onPress={() => navigateToPostBids(item._id, item?.address)}>
        <Text style={styles.cardButtonText}>View Bidders</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#00B8D4" />
        </TouchableOpacity>
        <Text style={styles.header}>My Needs</Text>
      </View>
      <View style={styles.separator} />
      {loading.getMyNeeds ? (
        <ActivityIndicator
          size="large"
          color="#00B8D4"
          style={{marginVertical: 15}}
        />
      ) : myNeeds?.length === 0 ? (
        <Text style={styles.noNeedsText}>No needs found</Text>
      ) : (
        <FlatList
          data={myNeeds}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
};

export default MyNeedsScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9F9F9', paddingHorizontal: 16},
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingLeft: 4,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },
  userInfo: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  avatar: {width: 60, height: 60, borderRadius: 30, marginRight: 10},
  name: {fontSize: 16, fontWeight: 'bold'},
  time: {color: '#7D7D7D', fontSize: 12},
  needTitle: {fontSize: 14, color: '#00B8D4', fontWeight: '600'},
  needDescription: {fontSize: 14, color: '#333', marginVertical: 5},
  cardButton: {
    backgroundColor: '#00B8D4',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cardButtonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '600'},
  noNeedsText: {
    fontSize: 18,
    color: '#7D7D7D',
    textAlign: 'center',
    marginTop: 80,
  },
});
