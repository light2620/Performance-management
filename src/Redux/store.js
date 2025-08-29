import { configureStore } from "@reduxjs/toolkit";
import departmentReducer from "./DepartmentSlice"


export const store = configureStore({
    reducer : {
       department : departmentReducer
    }
})