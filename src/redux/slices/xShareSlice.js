import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import axios from 'axios';
import {baseURL} from '../../utils/api';

// Thunk to create a new xShare
export const createXShare = createAsyncThunk(
  'xShare/createXShare',
  async (xShareData, {rejectWithValue}) => {
    try {
      const {type, userId, address, description, packageName} = xShareData;
      const response = await axios.post(`${baseURL}xshare`, {
        type,
        userId,
        address,
        description,
        packageName,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

// Thunk to get xShare by userId and type
export const getXShareByUserId = createAsyncThunk(
  'xShare/getXShareByUserId',
  async ({userId}, {rejectWithValue}) => {
    try {
      const response = await axios.get(`${baseURL}xshares/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

// Thunk to update an xShare
export const updateXShare = createAsyncThunk(
  'xShare/updateXShare',
  async ({id, xShareData}, {rejectWithValue}) => {
    try {
      const response = await axios.put(`${baseURL}xshares/${id}`, xShareData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

// Thunk to delete an xShare
export const deleteXShare = createAsyncThunk(
  'xShare/deleteXShare',
  async (id, {rejectWithValue}) => {
    try {
      const response = await axios.delete(`${baseURL}xshares/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

// Thunk to get need types based on user packages
export const getNeedType = createAsyncThunk(
  'xShare/getNeedType',
  async (userData, {rejectWithValue, getState}) => {
    console.log('Get need type api called .......');
    try {
      // const state = getState();
      // const personId = state.person.person; // Access the person state from the person slice

      // console.log('person data ------->', personId);
      const response = await axios.post(`${baseURL}xshares/need-type`, {
        userData,
      });
      console.log('Need data -------------->', response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const postBid = createAsyncThunk(
  'bid/postBid',
  async ({bidMessage, needId, userId}, {rejectWithValue}) => {
    try {
      const response = await axios.post(`${baseURL}bids/create-bid`, {
        message: bidMessage,
        needId,
        userId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getBiddersByNeedId = createAsyncThunk(
  'bid/getBidsForNeed', // action type
  async (needId, {rejectWithValue}) => {
    try {
      // Make a request to get bids for a specific need
      const response = await axios.get(`${baseURL}bids/need/${needId}`);
      // Return the data if successful
      return response.data;
    } catch (error) {
      // If there's an error, reject the action and return the error message
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const acceptBid = createAsyncThunk(
  'bid/acceptBid',
  async ({bidId, needId}, {rejectWithValue}) => {
    try {
      const response = await axios.post(`${baseURL}bids/accept/${bidId}`, {
        needId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const addReview = createAsyncThunk(
  'xShare/addReview',
  async ({contractId, review, experience}, {rejectWithValue}) => {
    console.log('Contract ID ---->', contractId);
    try {
      const response = await axios.post(
        `${baseURL}bids/contract/${contractId}/review`,
        {
          review,
          experience,
        },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getReview = createAsyncThunk(
  'xShare/getReview',
  async (contractId, {rejectWithValue}) => {
    try {
      const response = await axios.get(
        `${baseURL}bids/contract/${contractId}/review`,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Initial state for the slice
const initialState = {
  xShares: [],
  myNeeds: [],
  bidders: [],
  needTypes: [],
  loading: {
    create: false,
    fetch: false,
    update: false,
    delete: false,
    getNeed: false,
    getMyNeeds: false,
    accept: false,
  },
  error: null,
};

// Create the slice
const xShareSlice = createSlice({
  name: 'xShare',
  initialState,
  reducers: {
    // Synchronous reducers (if needed)
  },
  extraReducers: builder => {
    builder
      // Create xShare
      .addCase(createXShare.pending, state => {
        state.loading.create = true;
      })
      .addCase(createXShare.fulfilled, (state, action) => {
        state.loading.create = false;
        state.xShares.push(action.payload.data);
      })
      .addCase(createXShare.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.payload.message;
      })

      // Get xShare by userId and type
      .addCase(getXShareByUserId.pending, state => {
        state.loading.getMyNeeds = true;
      })
      .addCase(getXShareByUserId.fulfilled, (state, action) => {
        state.loading.getMyNeeds = false;
        console.log('my needs data ------>', action.payload.data);
        state.myNeeds = action.payload.data;
      })
      .addCase(getXShareByUserId.rejected, (state, action) => {
        state.loading.getMyNeeds = false;
        console.log('Failed to get needs data ------>', action.payload);
        state.myNeeds = [];
        state.error = action.payload.message;
      })

      // Update xShare
      .addCase(updateXShare.pending, state => {
        state.loading.update = true;
      })
      .addCase(updateXShare.fulfilled, (state, action) => {
        state.loading.update = false;
        const updatedShare = action.payload.data;
        state.xShares = state.xShares.map(share =>
          share._id === updatedShare._id ? updatedShare : share,
        );
      })
      .addCase(updateXShare.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload.message;
      })

      // Delete xShare
      .addCase(deleteXShare.pending, state => {
        state.loading.delete = true;
      })
      .addCase(deleteXShare.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.xShares = state.xShares.filter(
          share => share._id !== action.payload.data._id,
        );
      })
      .addCase(deleteXShare.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload.message;
      })

      // Get need types
      .addCase(getNeedType.pending, state => {
        state.loading.getNeed = true;
      })
      .addCase(getNeedType.fulfilled, (state, action) => {
        state.loading.getNeed = false;
        // const personId = state.person.person;

        // const personId = getState();
        // console.log('person data ------->', personId);

        // // // Ensure personId exists before filtering the needTypes
        // if (!personId) {
        //   console.log('personId is not available!');
        //   return;
        // }
        state.needTypes = action.payload.data;
      })
      .addCase(getNeedType.rejected, (state, action) => {
        state.loading.getNeed = false;
        state.error.getNeed = action.payload.message;
      })

      .addCase(postBid.pending, state => {
        // Set loading state when the API call starts
        state.loading.create = true;
      })
      .addCase(postBid.fulfilled, (state, action) => {
        // Handle success - you can update the state or perform any necessary actions
        state.loading.create = false;

        console.log('after posting a bid--->', action.payload.data.needId);

        const updatedNeedType = state.needTypes.map(item => {
          // If the needId matches, add the new bid to the list of bids
          if (item._id === action.payload.data.needId) {
            return {
              ...item,
              status: 'Posted',
              bids: [...item.bids, action.payload.bid], // Assuming `action.payload.bid` contains the new bid
            };
          }
          return item;
        });

        // Update the needTypes state with the modified need type
        state.needTypes = updatedNeedType;
      })
      .addCase(postBid.rejected, (state, action) => {
        // Handle error - display error message
        state.loading.create = false;
        state.error =
          action.error?.message || 'An error occurred while posting the bid.';
      })

      .addCase(getBiddersByNeedId.pending, state => {
        state.loading = true;
      })
      .addCase(getBiddersByNeedId.fulfilled, (state, action) => {
        state.loading = false;
        console.log('bidders data -------->', action.payload.data);
        state.bidders = action.payload.data; // Update the state with the fetched bids
      })
      .addCase(getBiddersByNeedId.rejected, (state, action) => {
        state.loading = false;
        console.log('bidders data fialed ------------>', action.payload);
        state.bidders = [];
        state.error = action.payload.message; // Handle the error
      })

      .addCase(acceptBid.pending, state => {
        state.loading.accept = true;
      })
      .addCase(acceptBid.fulfilled, (state, action) => {
        state.loading.accept = false;
      })
      .addCase(acceptBid.rejected, (state, action) => {
        state.loading.accept = false;
        state.error = action.payload;
      })

      .addCase(addReview.pending, state => {
        state.loading = true;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.loading = false;
        // You can update the state here if needed
      })
      .addCase(addReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getReview.pending, state => {
        state.loading = true;
      })
      .addCase(getReview.fulfilled, (state, action) => {
        state.loading = false;
        state.existingReview = action.payload.data;
      })
      .addCase(getReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const {
  /* synchronous actions */
} = xShareSlice.actions;
export default xShareSlice.reducer;
