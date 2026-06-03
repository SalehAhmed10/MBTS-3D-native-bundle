import {StyleSheet, Text, View, FlatList} from 'react-native';
import React from 'react';
import Modal from 'react-native-modal';
import {ListItem} from '@rneui/themed';

const UnitListModal = ({isVisible, onClose, onUnitSelect}) => {
  const units = [
    'Each',
    'Pack',
    'Set',
    'Case',
    'Bundle',
    'Piece',
    'Unit',
    'Box',
    'Roll',
    'Yard',
    'Meter',
    'Sheet',
    'Download',
    'License',
    'Copy',
    'Kit',
    'Bottle',
    'Jar',
    'Pound',
    'Kilogram',
    'Ounce',
    'Album',
    'Song',
    'Volume',
    'Coin',
    'Disc',
    'DVD',
    'Blu-Ray',
    'Game',
    'Subscription',
    'eBook',
    'Card',
    'Pair',
    'Bag',
    'Container',    
  ];

  return (
    <Modal isVisible={isVisible} animationIn="fadeIn" animationOut="fadeOut">
      <View style={styles.container}>
        <Text style={styles.heading}>Select a Unit</Text>

        <FlatList
          data={units}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <ListItem
              bottomDivider
              onPress={() => {
                onUnitSelect(item); // Fixed function name
                onClose(); // Close the modal
              }}>
              <ListItem.Content>
                <ListItem.Title>{item}</ListItem.Title>
              </ListItem.Content>
            </ListItem>
          )}
        />
      </View>
    </Modal>
  );
};

export default UnitListModal; // Correct component export

const styles = StyleSheet.create({
  container: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignSelf: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 15,
  },
});
