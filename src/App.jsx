import { Route, Routes } from "react-router-dom"
import Login from './pages/Login'
import Listening from './pages/Listening'
import Reading from './pages/Reading'
import Writing from "./pages/Writing"
function App() {

  return (
    <>
    <Routes>
      <Route path="/" element={<Login/>}/>
      <Route path="/listening" element={<Listening examId={3}/>}/>
      <Route path="/reading" element={<Reading examId={3}/>}/>
      <Route path="/writing" element={<Writing examId={3}/>}/>
    </Routes>
    </>
  )
}

export default App