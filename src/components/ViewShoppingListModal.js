import {StyleSheet, Text, View, FlatList} from 'react-native';
import React from 'react';
import Modal from 'react-native-modal';
import {Icon, ListItem} from '@rneui/themed';

const ViewShoppingListModal = ({
  showViewShoppingListModal,
  lineItems,
  onClosePress,
}) => {
  return (
    <>
      <Modal
        isVisible={showViewShoppingListModal}
        animationIn="fadeIn"
        animationOut="fadeOut">
        <View style={styles.container}>
          <Icon
            type="material"
            name="cancel"
            containerStyle={{position: 'absolute', top: 10, right: 10}}
            onPress={onClosePress}
          />
          <Text style={styles.heading}>Shopping List</Text>
          <FlatList
            data={lineItems}
            renderItem={({item, index}) => (
              <ListItem containerStyle={{maxHeight: 100}}>
                <ListItem.Content>
                  <ListItem.Title ellipsizeMode="tail" numberOfLines={3}>
                    {item.quantity} {item.unitName} of {item.brand} {item.type}{' '}
                    {item.thingName}
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
};

export default ViewShoppingListModal;

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
});
