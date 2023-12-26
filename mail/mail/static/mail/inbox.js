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


function Email({email, setCurrentView, setReplyEmailInfo, currentView, emailView, setEmailView}){
  const [isRead, setIsRead] = useState(email.read)
  const [isArchived, setIsArchived] = useState(email.archived)

  function handleActionButton(e) {
    e.stopPropagation();
  
    if (e.target.name === "read") {
      fetch(API_BASE_URL+"/emails/"+email.id, {
        method: 'PUT',
        body: JSON.stringify({
          read: !isRead
        })
      })
      setIsRead(!isRead)
      
    } else if (e.target.name) {
      fetch(API_BASE_URL+"/emails/"+email.id, {
        method: 'PUT',
        body: JSON.stringify({
          archived: !isArchived
        })
      })
      setIsArchived(!isArchived)
    }
  }

  function handleReplyButton() {
    e.stopPropagation();
    setReplyEmailInfo({
      ...email
    })
    setCurrentView("Compose")
  }

  function handleClickedEmail() {
    fetch(API_BASE_URL+"/emails/"+email.id, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
    setEmailView(email)
    setCurrentView("EmailView")
  }

  return (
    <div className={`email-wrapper ${isRead ? "read" : "unread"}`} onClick={handleClickedEmail}>
      <div className="action-buttons-wrapper">
        {currentView === "Inbox" && (
          <>
            <button name="read" onClick={handleActionButton}>
              {isRead ? "unread" : "read"}
            </button>
            <button name="archived" onClick={handleActionButton}>
              {isArchived ? "Unarchive" : "Archive"}
            </button>
            <button name="reply" onClick={handleReplyButton}>Reply</button>
          </>
        )}
        {currentView === "Archived" && (
          <button name="archived" onClick={handleActionButton}>
            {isArchived ? "Unarchive" : "Archive"}
          </button>
        )}
      </div>
      <p>{email.timestamp}</p>
      <h3>{email.sender}</h3>
      <h4>{email.subject}</h4>
      <p>{email.body}</p>
    </div>
  )
}

function InboxView({setCurrentView, setReplyEmailInfo, currentView, emailView, setEmailView}) {
  const [isLoading, setIsLoading] = useState(true)
  const [emails, setEmails] = useState("")

  function emulateLoadingEmails() {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }

  function getEmails() {
    fetch(`${API_BASE_URL}/emails/inbox`).then(response => response.json()).then(emails => setEmails(emails));
  }

  useEffect(()=>{
    getEmails()
    emulateLoadingEmails()
  }, [])

  if (isLoading) {
    return <h1>Loading Emails...</h1>
  };

  return (
    <>
      <h2>Inbox</h2>
      <div className="inbox-view-wrapper">
        {emails.map((email)=>{
          if (!email.archived) {
            return <Email key={email.id} email={email} setCurrentView={setCurrentView} setReplyEmailInfo={setReplyEmailInfo} currentView={currentView} emailView={emailView} setEmailView={setEmailView}></Email>
          }
        })}
      
      </div>
    </>
  )
}


function ComposeView({setCurrentView, replyEmailInfo, setReplyEmailInfo}) {

  const currentUser = useContext(userContext)
  const [emailInfo, setEmailInfo] = useState({recipients:"", subject:"", body:""})
  const [isSending, setStatus] = useState(false)
  const flashDispatch = useContext(FlashDispatchContext)
  
  let replyEmailSubject = replyEmailInfo.subject

  const regex = /^Re:\s?/i;
  if (!regex.test(replyEmailSubject)) {
    replyEmailSubject = "Re: " + replyEmailInfo.subject
  }

  const date = new Date().toLocaleString(); 
  const replyEmailBody = `On ${date} ${currentUser.email} wrote: `

  useEffect(() => {
    replyEmailInfo && 
    setEmailInfo({
      recipients : replyEmailInfo.sender,
      subject : replyEmailSubject,
      body : replyEmailBody,
    })
    setReplyEmailInfo("")
  }, [replyEmailInfo])


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


function ArchivedView({setCurrentView, setReplyEmailInfo, currentView, emailView, setEmailView}) {
  const [isLoading, setIsLoading] = useState(true)
  const [emails, setEmails] = useState("")

  function emulateLoadingEmails() {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }

  function getEmails() {
    fetch(`${API_BASE_URL}/emails/archive`).then(response => response.json()).then(emails => setEmails(emails));
  }

  useEffect(()=>{
    getEmails()
    emulateLoadingEmails()
  }, [])

  if (isLoading) {
    return <h1>Loading Emails...</h1>
  };

  return (
    <>
      <h2>Archived</h2>
      <div className="inbox-view-wrapper">
        {emails.map((email)=>{
            return <Email key={email.id} email={email} setCurrentView={setCurrentView} setReplyEmailInfo={setReplyEmailInfo} currentView={currentView} emailView={emailView} setEmailView={setEmailView}></Email>
        })}
      
      </div>
    </>
  )
}


function SentView({setCurrentView, setReplyEmailInfo, currentView, emailView, setEmailView}) {
  const [isLoading, setIsLoading] = useState(true)
  const [emails, setEmails] = useState("")

  function emulateLoadingEmails() {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }

  function getEmails() {
    fetch(`${API_BASE_URL}/emails/sent`).then(response => response.json()).then(emails => setEmails(emails));
  }

  useEffect(()=>{
    getEmails()
    emulateLoadingEmails()
  }, [])

  if (isLoading) {
    return <h1>Loading Emails...</h1>
  };

  return (
    <>
      <h2>Sent</h2>
      <div className="inbox-view-wrapper">
        {emails.map((email)=>{
          if (!email.archived) {
            return <Email key={email.id} email={email} setCurrentView={setCurrentView} setReplyEmailInfo={setReplyEmailInfo} currentView={currentView} emailView={emailView} setEmailView={setEmailView}></Email>
          }
        })}
      
      </div>
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
  const [replyEmailInfo, setReplyEmailInfo] = useState("")
  const [emailView, setEmailView] = useState("")
  
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
          <InboxView setCurrentView={setCurrentView} setReplyEmailInfo={setReplyEmailInfo} currentView={currentView} emailView={emailView} setEmailView={setEmailView}></InboxView>
        ) : currentView === "Compose" ? (
          <ComposeView setCurrentView={setCurrentView} replyEmailInfo={replyEmailInfo} setReplyEmailInfo={setReplyEmailInfo}></ComposeView>
        ) : currentView === "Archived" ? (
          <ArchivedView setCurrentView={setCurrentView} currentView={currentView} emailView={emailView} setEmailView={setEmailView}></ArchivedView>
        ) : currentView === "Sent" ? (
          <SentView setCurrentView={setCurrentView} currentView={currentView} emailView={emailView} setEmailView={setEmailView}></SentView>
        ) : currentView === "EmailView" ? (
          <EmailView currentView={currentView} setCurrentView={setCurrentView} setReplyEmailInfo={setReplyEmailInfo} emailView={emailView}></EmailView>
        ) : null}
      </userContext.Provider>
    </FlashProvider>
  );
}

function EmailView({setCurrentView, setReplyEmailInfo, currentView, emailView}) {

  const [isRead, setIsRead] = useState(emailView.read)
  const [isArchived, setIsArchived] = useState(emailView.archived)

  function handleActionButton(e) {
    if (e.target.name === "read") {
      fetch(API_BASE_URL+"/emails/"+emailView.id, {
        method: 'PUT',
        body: JSON.stringify({
          read: !isRead
        })
      })
      setIsRead(!isRead)
      
    } else if (e.target.name) {
      fetch(API_BASE_URL+"/emails/"+emailView.id, {
        method: 'PUT',
        body: JSON.stringify({
          archived: !isArchived
        })
      })
      setIsArchived(!isArchived)
    }
  }

  function handleReplyButton() {
    setReplyEmailInfo({
      ...emailView
    })
    setCurrentView("Compose")
  }
  return(
    <>
    
    <ul>
      <li>Arrived At: {emailView.timestamp} </li>
      <li>From: {emailView.sender} </li>
      <li>subject: {emailView.subject} </li>
      <li>To: {emailView.recipients}</li>
      <li>
        Body: 
        <p>{emailView.body}
        </p>
      </li>
    </ul>

    <div className="action-buttons-wrapper">

    <button name="archived" onClick={handleActionButton}>{isArchived ? "Unarchive" : "Archive"}</button>
    <button name="reply" onClick={handleReplyButton}>Reply</button>

    </div>
  </>
    
  )
}