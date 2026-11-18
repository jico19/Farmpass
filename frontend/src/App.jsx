import ConnectionNotice from './components/ui/ConnectionNotice';
import { RouterProvider } from "react-router-dom"
import router from "./routes"
import ApplicationMotion from './components/ui/ApplicationMotion';

function App() {


  return (
    <ApplicationMotion>
      <ConnectionNotice />
      <RouterProvider router={router}>
      </RouterProvider>
    </ApplicationMotion>
  )
}

export default App
