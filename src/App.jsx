import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './Pages/Home';
import AdminLogin from './Pages/AdminLogin';
import AdminHome from './Pages/AdminHome';
import ManageUsers from './Pages/ManagerUsers';
import SetupPassword from './Pages/SetupPassword';
import LoginPage from './Pages/LoginPage';
import LearnerHome from './Pages/LearnerHome';
import TrainerHome from './Pages/TrainerHome';
import ManageCourses from './Pages/ManageCourses';
import AdminDashboard from './Pages/AdminDashboard';
import MyCourses from './Pages/MyCourses';
import CreateCourse from './Pages/CreateCourse';
import ManageModules from './Pages/ManageModules';
import LearnerCourseDetails from './Pages/LearnerCourseDetails';
import ManageTakedowns from './Pages/ManageTakedowns';
import CourseFeedback from './Pages/CourseFeedback';
import TrainerDashboard from './Pages/TrainerDashboard';
import BrowseCourses from './Pages/BrowseCourses';
import TrainerLearners from './Pages/TrainerLearners';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* You can add more routes here later */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path='/admin-home' element={<AdminHome></AdminHome>}/>
        <Route path='/admin/users' element={<ManageUsers></ManageUsers>}/>
        <Route path='/admin/dashboard' element={<AdminDashboard></AdminDashboard>}/>
        <Route path="/reset-password" element={<SetupPassword />}/>
        <Route path="/login" element={<LoginPage />}/>
        <Route path ="/learner/home" element={<LearnerHome></LearnerHome>}/>
        <Route path ="/trainer/home" element={<TrainerHome/>}/>
        <Route path='/admin/courses' element={<ManageCourses/>}/>
        <Route path='admin/dashboard' element={<AdminDashboard/>}/>
        <Route path='trainer/my-courses' element={<MyCourses/>}/>
        <Route path='trainer/create-course' element={<CreateCourse/>}/>
        <Route path="/trainer/courses/:courseId/modules" element={<ManageModules />} />
        <Route path="/trainer/modules" element={<ManageModules />} />
        <Route path="/learner/home" element={<LearnerHome />} />
        <Route path="/learner/course/:id" element={<LearnerCourseDetails />} />
         <Route path="/admin/takedowns" element={<ManageTakedowns />} />
         <Route path="/trainer/courses/:id/feedbacks" element={<CourseFeedback />} />
         <Route path='/trainer/dashboard' element={<TrainerDashboard/>}/>
         <Route path='/browse' element={<BrowseCourses/>}/>
         <Route path="/trainer-learners" element={<TrainerLearners />} />


    

        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
