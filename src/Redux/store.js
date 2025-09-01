import { configureStore } from "@reduxjs/toolkit";
import departmentReducer from "./DepartmentSlice"
import allUserReducer from "./AllUsersSllice"


export const store = configureStore({
    reducer : {
       department : departmentReducer,
       allUser : allUserReducer
    }
})