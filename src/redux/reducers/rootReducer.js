import {combineReducers} from 'redux';
// import userReducer from '../slices/userSlice'
import personReducer from '../slices/personSlice';
import postReducer from '../slices/postSlice';
import xShareReducer from '../slices/xShareSlice';

const rootReducer = combineReducers({
  //   UserData:userReducer,
  PostData: postReducer,
  person: personReducer,
  xShare: xShareReducer,
});

export default rootReducer;
