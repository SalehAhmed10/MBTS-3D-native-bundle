import {StyleSheet, View, Text, TouchableOpacity, FlatList} from 'react-native';
import React from 'react';
import Modal from 'react-native-modal';
import {CheckBox, Icon, ListItem} from '@rneui/themed';

const UpdateFulfillmentShoppingListModal = ({
  showUpdateFulfillmentSAModal,
  lineItems,
  onCheckBoxPress,
  onNextPress,
  onClosePress,
}) => {
  return (
    <>
      <Modal
        isVisible={showUpdateFulfillmentSAModal}
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
          <FlatList
            data={lineItems}
            renderItem={({item, index}) => (
              <ListItem containerStyle={{maxHeight: 100}}>
                <ListItem.Content style={{paddingLeft: 15}}>
                  <ListItem.Title ellipsizeMode="tail" numberOfLines={3}>
                    {item.quantity} {item.unitName} of {item.brand} {item.type}{' '}
                    {item.thingName}
                  </ListItem.Title>
                </ListItem.Content>
                <CheckBox
                  checked={!item.fulfilled}
                  onIconPress={() => onCheckBoxPress(index)}
                />
              </ListItem>
            )}
          />
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => onNextPress()}>
            <Text style={styles.updateButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

export default UpdateFulfillmentShoppingListModal;

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
