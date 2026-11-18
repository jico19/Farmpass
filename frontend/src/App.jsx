import ConnectionNotice from './components/ui/ConnectionNotice';
import { RouterProvider } from "react-router-dom"
import router from "./routes"
import MotionProvider from './components/motion/MotionProvider';

function App() {


  return (
    <MotionProvider>
      <ConnectionNotice />
      <RouterProvider router={router}>
      </RouterProvider>
    </MotionProvider>
  )
}

export default App
