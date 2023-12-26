import React, { createContext, useReducer } from 'react';

export const CurrentViewContext = createContext("");
export const DispatchCurrentViewContext = createContext("");

export function CurrentViewProvider({ children }) {

  const [currentView, dispatch] = useReducer(
    CurrentViewReducer, "Inbox");

  return (
    <CurrentViewContext.Provider value={currentView}>
      <DispatchCurrentViewContext.Provider value={dispatch}>
        {children}
      </DispatchCurrentViewContext.Provider>
    </CurrentViewContext.Provider>
  );
}

function CurrentViewReducer(currentView, action) {
  switch (action.type) {
    case 'change_view': {
      return action.view
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}
