import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  person: {},
};

const personSlice = createSlice({
  name: 'person',
  initialState,
  reducers: {
    setPerson: (state, action) => {
      state.person = action.payload;
    },
    updatePerson1: (state, action) => {
      state.person = {...state.person, ...action.payload};
    },
    updateAvatar: (state, action) => {
      state.person.user.avatarName = action.payload;
    },
    // Add other specific reducers as needed
  },
});

export const {setPerson, updatePerson1, updateAvatar} = personSlice.actions;
export default personSlice.reducer;
