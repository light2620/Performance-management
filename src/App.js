import logo from './logo.svg';
import { RouterProvider } from 'react-router-dom';
import router from './Routes/routs';
import { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  return (
    <div className="App">
       <RouterProvider router={router} />
       <Toaster />
    </div>
  );
}

export default App;
