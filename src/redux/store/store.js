import {configureStore} from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import {mmkvStorage} from '../storage/storage';
import rootReducer from '../reducers/rootReducer';

const persistConfig = {
  key: 'root',
  storage: mmkvStorage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist lifecycle actions include non-serializable values like
        // register/rehydrate callbacks. Ignore those known action types while
        // keeping serializability checks enabled for the rest of the app.
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export default store;
