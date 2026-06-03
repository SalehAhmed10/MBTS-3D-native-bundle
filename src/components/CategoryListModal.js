import {StyleSheet, Text, View, FlatList} from 'react-native';
import React from 'react';
import Modal from 'react-native-modal';
import {Icon, ListItem} from '@rneui/themed';

const CategoryListModal = ({isVisible, onClose, onCategorySelect}) => {
  const categories = [
    'Amazon Devices & Accessories',
    'Amazon Renewed',
    'Appliances',
    'Apps & Games',
    'Arts, Crafts & Sewing',
    'Audible Books & Originals',
    'Automotive',
    'Baby',
    'Beauty & Personal Care',
    'Books',
    'Camera & Photo Products',
    'CDs & Vinyl',
    'Cell Phones & Accessories',
    'Clothing, Shoes & Jewelry',
    'Collectible Coins',
    'Computers & Accessories',
    'Digital Educational Resources',
    'Digital Music',
    'Electronics',
    'Entertainment Collectibles',
    'Gift Cards',
    'Grocery & Gourmet Food',
    'Handmade Products',
    'Health & Household',
    'Home & Kitchen',
    'Industrial & Scientific',
    'Kindle Store',
    'Kitchen & Dining',
    'Movies & TV',
    'Musical Instruments',
    'Office Products',
    'Patio, Lawn & Garden',
    'Pet Supplies',
    'Software',
    'Sports & Outdoors',
    'Sports Collectibles',
    'Tools & Home Improvement',
    'Toys & Games',
    'Unique Finds',
    'Video Games',
  ];

  return (
    <Modal isVisible={isVisible} animationIn="fadeIn" animationOut="fadeOut">
      <View style={styles.container}>
        {/* Close Icon */}
        {/* <Icon
          type="material"
          name="close"
          containerStyle={styles.closeIcon}
          onPress={onClose}
        /> */}

        <Text style={styles.heading}>Select a Category</Text>

        {/* List of Categories */}
        <FlatList
          data={categories}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <ListItem
              bottomDivider
              onPress={() => {
                onCategorySelect(item); // Pass the selected category
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

export default CategoryListModal;

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
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 15,
  },
});
