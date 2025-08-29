import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    departments : [],
}

const departmentSlice = createSlice({
    name : "department",
    initialState,
    reducers : {
        setDepartment : (state,action) => {
            console.log(action.payload)
            state.departments = action.payload
        
        }
    }
})


export const {setDepartment} = departmentSlice.actions;
export default departmentSlice.reducer;