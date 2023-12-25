import React, { useContext, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import userContext from "./CurrentUserContext"
import { FlashContext, FlashDispatchContext, FlashProvider } from './FlashContext';

const API_BASE_URL = "http://127.0.0.1:8000"
document.addEventListener('DOMContentLoaded', function() {

  // My code (using React)
  const root = createRoot(document.getElementById('root'));

  root.render(<App />);
  
});

function Button({children, setCurrentView}) {
  function handleSetVIew(e) {
    setCurrentView(e.target.innerText)
  }
  return <button className="btn btn-sm btn-outline-primary nav-button" onClick={handleSetVIew}>{children}</button>
}


function LogoutButton({children}) {
  return <button className="btn btn-sm btn-outline-primary">{children}</button>
}


function Navbar({setCurrentView}) {
  const currentUser = useContext(userContext)
  return (
    <div className="navbar-wrapper">
      <h2>{currentUser.email}</h2>
      <Button setCurrentView={setCurrentView}>Inbox</Button>
      <Button setCurrentView={setCurrentView}>Compose</Button>
      <Button setCurrentView={setCurrentView}>Sent</Button>
      <Button setCurrentView={setCurrentView}>Archived</Button>
      <LogoutButton>Log out</LogoutButton>
      <hr></hr>
    </div>
  )
}


function InboxView({children}) {
  return (
    <>
      <h2>Inbox</h2>

      <div className="inbox-view-wrapper">
        <div className="email-wrapper">
          <h3>Email@sender.com</h3>
          <h4>Email subject</h4>
          <p>email body body body body body body</p>
        </div>
        <div className="email-wrapper" id="">
          <h3>Email@sender.com</h3>
          <h4>Email subject</h4>
          <p>email body body body body body body</p>
        </div>
        <div className="email-wrapper">
          <h3>Email@sender.com</h3>
          <h4>Email subject</h4>
          <p>email body body body body body body</p>
        </div>
        <div className="email-wrapper">
          <h3>Email@sender.com</h3>
          <h4>Email subject</h4>
          <p>email body body body body body body</p>
        </div>
        <div className="email-wrapper">
          <h3>Email@sender.com</h3>
          <h4>Email subject</h4>
          <p>email body body body body body body</p>
        </div>
      </div>
    </>
  )
}


function ComposeView({setCurrentView}) {

  const currentUser = useContext(userContext)
  const [emailInfo, setEmailInfo] = useState({recipients:"", subject:"", body:""})
  const [isSending, setStatus] = useState(false)
  const flashDispatch = useContext(FlashDispatchContext)

  function handleInput(e) {
    setEmailInfo({
      ...emailInfo,
      [e.target.name]: e.target.value
    })    
  }

  function directUserToInbox() {
    setCurrentView("Sent")
  }

  function showFlashMessage(successMsg, category) {
    flashDispatch({
      type: "show_message",
      message: successMsg,
      category: category
    })
    setTimeout(() => {
      flashDispatch({
        type: "hide_message"
      })
    }, 5000);
  }

  async function emulateSending() {
    setStatus(true)

    return new Promise((resolve) => {
      setTimeout(() => {
        setStatus(false)
        resolve()
      }, 1200);
    })
  }

  async function sendEmail(e) {

    e.preventDefault();

    await emulateSending()

    fetch(`${API_BASE_URL}/emails`, {
      method: 'POST',
      body: JSON.stringify({
        recipients: emailInfo.recipients,
        subject: emailInfo.subject,
        body: emailInfo.body
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(result => Promise.reject(result.error));
      }
      return response.json();
    })
    .then(result => {
      const successMsg = result.message.toString();
      showFlashMessage(successMsg, "flash-message-success")
      directUserToInbox()
    })
    .catch(error => {
      showFlashMessage(error, "flash-message-error")
    });

  }
    
  

    if (isSending)  {
      return <h1>Sending...</h1>
    }
    
    return (
      <div className="compose-form">
      <h3>New Email</h3>
      <form onSubmit={sendEmail}>
        <div className="form-group">
          From:{" "}
          <input
            name="from"
            disabled
            className="form-control"
            defaultValue={currentUser.email}
            placeholder={currentUser.email}
          />
        </div>
        <div className="form-group">
          To: <input name="recipients" className="form-control" value={emailInfo.recipients} onChange={handleInput}/>
        </div>
        <div className="form-group">
          <input
            className="form-control"
            name="subject"
            placeholder="Subject"
            value={emailInfo.subject}
            onChange={handleInput}
          />
        </div>
        <textarea
          className="form-control"
          name="body"
          placeholder="Body"
          value={emailInfo.body}
          onChange={handleInput}
        />
        <input type="submit" className="btn btn-primary" disabled={emailInfo.subject.length && emailInfo.recipients.length ? false : true} />
      </form>
    </div>
  )
}


function ArchivedView({children}) {
  return (
    <>
      <h2>Archived</h2>
    </>
  )
}


function SentView({children}) {
  return (
    <>
      <h2>Sent</h2>
    </>
  )
}


function FlashMessage() {
  const flash = useContext(FlashContext)

  return (
    <div className={`${flash.category} flash-message `} style={{display: flash.show ? "block" : "none"}}>
      {flash.message}
    </div>
  )
}


function App() {
  const [currentUser, setCurrentUser] = useState("")
  const [currentView, setCurrentView] = useState("Inbox")

  
  // When user logs in get the current user info from api (username, email, id)
  useEffect(()=>{
    fetch(`${API_BASE_URL}/get-current-user-info`)
      .then(response => response.json())
      .then(data=>setCurrentUser(data))
      .catch(error => {
        console.error('Error fetching current user info:', error);
      });
    }, []);
  
  return (

    <FlashProvider>
      <userContext.Provider value={currentUser}>
        <FlashMessage></FlashMessage>
        <Navbar setCurrentView={setCurrentView}></Navbar>
        {currentView === "Inbox" ? (
          <InboxView></InboxView>
        ) : currentView === "Compose" ? (
          <ComposeView setCurrentView={setCurrentView}></ComposeView>
        ) : currentView === "Archived" ? (
          <ArchivedView></ArchivedView>
        ) : currentView === "Sent" ? (
          <SentView></SentView>
        ) : null}
      </userContext.Provider>
    </FlashProvider>
  );
}