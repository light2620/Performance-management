import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    count : 0,
}

const CountSlice = createSlice({
    name : "count",
    initialState,
    reducers : {
        setCount : (state,action) => {
            state.count = action.payload
        
        }
    }
})


export const {setCount} = CountSlice.actions;
export default CountSlice.reducer;