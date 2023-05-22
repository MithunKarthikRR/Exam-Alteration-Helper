import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'

import Login from './Login'
import Dashboard from './Admin/Dashboard'
import Employee from './Admin/Employee'
import Home from './Admin/Home'
import AddEmployee from './Admin/AddEmployee'
import EditEmployee from './Admin/EditEmployee'
import Start from './Start'
import EmployeeDetail from './Faculty/EmployeeDetail'
import EmployeeLogin from './EmployeeLogin'
import Exam from './Admin/Exam'


function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Dashboard />}>
        <Route path='' element={<Home />}></Route>
        <Route path='/employee' element={<Employee />}></Route>
        <Route path='/create' element={<AddEmployee />}></Route>
        <Route path='/employeeEdit/:id' element={<EditEmployee />}></Route>
        <Route path='/exam' element={<Exam />}></Route>
      </Route>
      <Route path='/login' element={<Login />}></Route>
      <Route path='/start' element={<Start />}></Route>
      <Route path='/employeeLogin' element={<EmployeeLogin />}></Route>
      <Route path='/employeedetail/:id' element={<EmployeeDetail />}></Route>
    </Routes>
    </BrowserRouter>
  )
}

export default App