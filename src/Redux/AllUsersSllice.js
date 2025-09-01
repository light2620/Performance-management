import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    allUsers : [],
}

const AllUsersSlice = createSlice({
    name : "allUsers",
    initialState,
    reducers : {
        setAllUsers : (state,action) => {
            state.allUsers = action.payload
        
        }
    }
})


export const {setAllUsers} = AllUsersSlice.actions;
export default AllUsersSlice.reducer;