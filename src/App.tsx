import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginPage from './components/Auth/LoginPage';
import HomePage from './components/Home/HomePage';
import PortalPage from './components/Portal/PortalPage';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={LoginPage} />
        <Route path="/home" component={HomePage} />
        <Route path="/portal" component={PortalPage} />
      </Switch>
    </Router>
  );
};

export default App;