import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import router from './Routes/routs';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './Utils/AuthContext';
import { Provider } from 'react-redux';
import { store } from './Redux/store';
import { ThemeProvider } from './Utils/ThemeContext';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
 <ThemeProvider>
    <AuthProvider>
      <Provider store={store}>
    <App />
    </Provider>
     </AuthProvider>
    </ThemeProvider >
 
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
