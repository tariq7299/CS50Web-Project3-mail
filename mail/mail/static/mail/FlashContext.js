import React, { createContext, useReducer } from 'react';

export const FlashContext = createContext("");
export const FlashDispatchContext = createContext("");

export function FlashProvider({ children }) {

  const [flash, dispatch] = useReducer(
    FlashReducer,
    {
        show: false,
        message: "",
        category: ""
    }
  );

  return (
    <FlashContext.Provider value={flash}>
      <FlashDispatchContext.Provider value={dispatch}>
        {children}
      </FlashDispatchContext.Provider>
    </FlashContext.Provider>
  );
}

function FlashReducer(flash, action) {
  switch (action.type) {
    case 'show_message': {
      return {
        show: true,
        message: action.message,
        category: action.category
      };
    }
    case 'hide_message': {
      return {
        show: false,
        message: "",
        category: ""
      };
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}
