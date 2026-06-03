import {StyleSheet, Text, View, FlatList, TouchableOpacity} from 'react-native';
import React from 'react';
import Modal from 'react-native-modal';
import {Icon, ListItem} from '@rneui/themed';
import NumericInput from 'react-native-numeric-input';

const AddToShoppingListModal = ({
  showAddToShoppingListModal,
  lineItems,
  onChangeQuantity,
  onSavePress,
  onClosePress,
}) => {
  return (
    <>
      <Modal
        isVisible={showAddToShoppingListModal}
        animationIn="fadeIn"
        animationOut="fadeOut">
        <View style={styles.container}>
          <Icon
            type="material"
            name="cancel"
            containerStyle={{position: 'absolute', top: 10, right: 10}}
            onPress={onClosePress}
          />
          <Text style={styles.heading}>Add Line Items</Text>
          <FlatList
            data={lineItems}
            renderItem={({item, index}) => (
              <ListItem containerStyle={{maxHeight: 100}}>
                <NumericInput
                  type="up-down"
                  totalWidth={60}
                  totalHeight={40}
                  minValue={0}
                  initValue={item.quantity}
                  value={item.quantity}
                  onChange={quantity => onChangeQuantity(index, quantity)}
                />
                <ListItem.Content>
                  <ListItem.Title ellipsizeMode="tail" numberOfLines={3}>
                    {item.unitName} of {item.brand} {item.type} {item.thingName}
                  </ListItem.Title>
                </ListItem.Content>
              </ListItem>
            )}
          />
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => onSavePress()}>
            <Text style={styles.updateButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

export default AddToShoppingListModal;

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
