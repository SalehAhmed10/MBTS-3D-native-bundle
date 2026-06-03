import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as StoreProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import Home from '../screens/Home';
import store, { persistor } from '../redux/store/store';

export default function LegacyMbtsApp() {
  const [, setPerson] = useState({});

  const navigation = {
    goBack() {},
    navigate(screen, params) {
      console.log('[LegacyMbtsApp] navigation.navigate is not wired yet', screen, params);
    },
    openDrawer() {},
  };

  return (
    <StoreProvider store={store}>
      <PersistGate persistor={persistor}>
        <GestureHandlerRootView style={styles.flex1}>
          <Home
            navigation={navigation}
            route={{ params: {} }}
            updatePerson={setPerson}
          />
        </GestureHandlerRootView>
      </PersistGate>
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
});
