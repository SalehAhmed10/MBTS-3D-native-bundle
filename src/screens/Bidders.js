import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {getBiddersByNeedId, acceptBid} from '../redux/slices/xShareSlice';

import {formatRelativeTime} from '../utils/dateUtils';

const BiddersScreen = ({route, navigation}) => {
  const {postId, address} = route.params;
  const dispatch = useDispatch();
  const person = useSelector(state => state.person.person);
  const {bidders, loading, error} = useSelector(state => state.xShare);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const isAnyBidAccepted = bidders?.some(bid => bid.status === 'accepted');

  console.log('Bidders ------>', bidders);
  useEffect(() => {
    dispatch(getBiddersByNeedId(postId));
  }, [dispatch, postId]);

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(getBiddersByNeedId(postId)).finally(() => setRefreshing(false));
  };

  const renderItem = ({item}) => {
    const userInitials = `${item?.firstName?.charAt(0)}${item?.lastName?.charAt(
      0,
    )}`.toUpperCase();

    const isDisabled = isAnyBidAccepted || acceptingId === item._id;

    const handleAccept = () => {
      dispatch(acceptBid({bidId: item._id, needId: postId}))
        .unwrap()
        .then(() => {
          dispatch(getBiddersByNeedId(postId)); // Refresh the list
        })
        .catch(error => {
          console.error('Accept Bid Failed:', error);
        });
    };

    const handleViewContract = () => {
      navigation.navigate('Agreement Screen', {
        packageName: item.packageName || 'bloodshare', // Default to foodshare if not specified
        requesterName: `${person.firstName} ${person.lastName}` || 'Requester',
        providerName: `${item.firstName} ${item.lastName}`,
        requesterAddress: item.needId.address || 'Address not specified',
        providerAddress: item.userId.homeCity || 'Address not specified',
        dateOfContract: item.updatedAt || 'Date not specified',
        deliveryTime: item.userId.byWhen || new Date().toISOString(),
      });
    };

    const handleReviewContract = name => {
      navigation.navigate('ReviewContract', {
        contractId: item.contract,
        name: name,
      });
    };

    return (
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <View style={styles.userInfo}>
            {item.avatar ? (
              <Image source={{uri: item.avatar}} style={styles.avatar} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{userInitials}</Text>
              </View>
            )}
            <View>
              <Text style={styles.name}>
                {item?.firstName} {item?.lastName}
              </Text>
              <Text style={styles.time}>
                {formatRelativeTime(item?.createdAt)}
              </Text>
            </View>
          </View>

          <>
            {item.status === 'accepted' && item.contract && (
              <View style={styles.contractButtonsContainer}>
                <TouchableOpacity
                  style={styles.contractButton}
                  onPress={handleViewContract}>
                  <Text style={styles.contractButtonText}>View Contract</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contractButton}
                  onPress={() =>
                    handleReviewContract(
                      item?.firstName + ' ' + item?.lastName,
                      item?.contract,
                    )
                  }>
                  <Text style={styles.contractButtonText}>Review Contract</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        </View>

        <View style={styles.messageBox}>
          <Text style={styles.message}>{item?.message}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.cardButton,
            item.status === 'accepted' && {backgroundColor: '#4CAF50'},
            // isDisabled && {opacity: 0.8},
          ]}
          onPress={handleAccept}
          disabled={isDisabled}>
          <Text style={styles.cardButtonText}>
            {item.status === 'accepted'
              ? 'Accepted'
              : loading.accept
              ? 'Accepting...'
              : 'Accept'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('My Needs')}>
          <Ionicons name="arrow-back" size={24} color="#00B8D4" />
        </TouchableOpacity>
        <Text style={styles.header}>Active Bids</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.messageBox}>
        <Text style={styles.message}>{address}</Text>
      </View>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#00B8D4"
          style={{marginVertical: 15}}
        />
      ) : bidders?.length === 0 ? (
        <Text style={styles.noBiddersText}>No bidders found</Text>
      ) : (
        <FlatList
          data={bidders}
          renderItem={renderItem}
          keyExtractor={item => item?._id?.toString()}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
};

export default BiddersScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9F9F9', paddingHorizontal: 16},
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avatar: {width: 50, height: 50, borderRadius: 25, marginRight: 10},
  avatarCircle: {
    width: 60,
    height: 60,
    backgroundColor: 'green',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  name: {fontSize: 16, fontWeight: 'bold'},
  time: {
    color: '#7D7D7D',
    fontSize: 12,
  },
  contractButtonsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'coloumn',
    alignItems: 'center',
    gap: 6,
  },
  contractButton: {
    backgroundColor: '#ECECEC',
    paddingVertical: 6,
    width: 100,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractButtonText: {
    color: '#00B8D4',
    fontSize: 10,
    fontWeight: '600',
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
  bid: {
    color: '#7D7D7D',
    fontSize: 14,
    marginTop: 5, // Ensure there is some space above the message
    lineHeight: 18, // To improve readability
    flexShrink: 1, // Allow text to wrap inside the card
  },
  cardButton: {
    backgroundColor: '#00B8D4',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardButtonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '600'},
  noBiddersText: {
    fontSize: 18,
    color: '#d1cfcf',
    textAlign: 'center',
    marginTop: 80,
  },
});
