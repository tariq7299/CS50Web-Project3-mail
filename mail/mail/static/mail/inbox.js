// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';

const App = () => {
  return <h1>Hello from React!</h1>;
};

// Render your React component inside the specified container
ReactDOM.render(<App />, document.getElementById('react-container'));
