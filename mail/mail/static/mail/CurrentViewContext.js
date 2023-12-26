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
    // case 'change_view_to_archived': {
    //   return "Archived"
    // }
    // case 'change_view_to_sent': {
    //   return "Sent"
    // }
    // case 'change_view_to_compose': {
    //   return "Compose"
    // }
    // case 'change_view_to_emailView': {
    //   return "EmailView"
    // }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}
