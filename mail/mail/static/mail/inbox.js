import React, { useContext, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import userContext from "./CurrentUserContext"
import { FlashContext, FlashDispatchContext, FlashProvider } from './FlashContext';
import { CurrentViewContext, DispatchCurrentViewContext, CurrentViewProvider } from './CurrentViewContext';


const API_BASE_URL = "http://127.0.0.1:8000"
// My code (using React)
const root = createRoot(document.getElementById('root'));

root.render(<App />);


function Button({children}) {

  const dispatchCurrentView = useContext(DispatchCurrentViewContext)

  function handleSetVIew(e) {
    if (e.target.innerText === "Log out"){
      fetch(API_BASE_URL+"/logout")
      .then(response=>{
        if (response.status === 200) {

          window.location.href = '/login';
        }else {
          console.log(response.data.message)
        } 
      })
      .catch(error => console.log(error))   
    } else {
      dispatchCurrentView({
        type: "change_view",
        view: e.target.innerText
      })

    }
  }
  return <button className="btn btn-sm btn-outline-primary nav-button" onClick={handleSetVIew}>{children}</button>
}


function Navbar({}) {
  const currentUser = useContext(userContext)

  return (
    <div className="navbar-wrapper">
      <h2>{currentUser.email}</h2>
      <Button>Inbox</Button>
      <Button>Compose</Button>
      <Button>Sent</Button>
      <Button>Archived</Button>
      <Button>Log out</Button>
      <hr></hr>
    </div>
  )
}


function Email({email, setReplyEmailInfo, setEmailView}){
  const [isRead, setIsRead] = useState(email.read)
  const [isArchived, setIsArchived] = useState(email.archived)

  const currentView = useContext(CurrentViewContext)
  const dispatchCurrentView = useContext(DispatchCurrentViewContext)

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
      
    } else if (e.target.name === "archived") {
      fetch(API_BASE_URL+"/emails/"+email.id, {
        method: 'PUT',
        body: JSON.stringify({
          archived: !isArchived
        })
      })
      setIsArchived(!isArchived)
    }
  }

  function handleReplyButton(e) {
    e.stopPropagation();
    setReplyEmailInfo({
      ...email
    })
    dispatchCurrentView({
      type: "change_view",
      view: "Compose"
    })
  }

  function handleClickedEmail() {
    fetch(API_BASE_URL+"/emails/"+email.id, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
    setEmailView(email)
    dispatchCurrentView({
      type: "change_view",
      view: "EmailView"
    })
  }

  return (
    <div className={`email-wrapper ${isRead ? "read" : "unread"}`} onClick={handleClickedEmail}>
      <div className="action-buttons-wrapper">
        {currentView === "Inbox" && (
          <>
            <button className="btn btn-sm btn-info" name="read" onClick={handleActionButton}>
              {isRead ? "unread" : "read"}
            </button>
            <button className="btn btn-sm btn-secondary" name="archived" onClick={handleActionButton}>
              {isArchived ? "Unarchive" : "Archive"}
            </button>
            <button className="btn btn-sm btn-success" name="reply" onClick={handleReplyButton}>Reply</button>
          </>
        )}
        {currentView === "Archived" && (
          <button className="btn btn-sm btn-info" name="archived" onClick={handleActionButton}>
            {isArchived ? "Unarchive" : "Archive"}
          </button>
        )}
      </div>
      <p className="email-arrival-time">{email.timestamp}</p>
      <h3 className="email-sender">{email.sender}</h3>
      <h4 className="email-subject">{email.subject}</h4>
      <p className="email-body">{email.body}</p>
    </div>
  )
}


function MailBox({setReplyEmailInfo, setEmailView}) {

  const currentView = useContext(CurrentViewContext)

  const [isLoading, setIsLoading] = useState(true)
  const [emails, setEmails] = useState("")

  function emulateLoadingEmails() {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }

  function getInboxMials() {
    fetch(`${API_BASE_URL}/emails/inbox`).then(response => response.json()).then(emails => setEmails(emails));
  }
  function getSentMails() {
    fetch(`${API_BASE_URL}/emails/sent`).then(response => response.json()).then(emails => setEmails(emails));
  }
  function getArchivedMails() {
    fetch(`${API_BASE_URL}/emails/archive`).then(response => response.json()).then(emails => setEmails(emails));
  }
  
  useEffect(()=>{
    setIsLoading(true);
    if (currentView === "Inbox") {
      getInboxMials()
    } else if (currentView === "Archived") {
      getArchivedMails()
    } else if (currentView === "Sent") {
      getSentMails()
    }
    emulateLoadingEmails()
  }, [currentView])

  
  
  if (currentView === "Compose" || currentView === "EmailView"){
    return null;
  }
  
  if (isLoading) {
    return <h1>Loading Emails...</h1>
  }

    return (
      <>
        <h2>{currentView==="Inbox" ? "Inbox" : currentView==="Archived" ? "Archived" : "Sent"}</h2>
        <div className="inbox-view-wrapper">
          {emails.map((email)=>{
              return <Email key={email.id} email={email} setReplyEmailInfo={setReplyEmailInfo} setEmailView={setEmailView}></Email>
          })}
        
        </div>
      </>
    )

}


function ComposeView({replyEmailInfo, setReplyEmailInfo}) {

  const currentView = useContext(CurrentViewContext)
  const dispatchCurrentView = useContext(DispatchCurrentViewContext)
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
    
    dispatchCurrentView({
      type: "change_view",
      view: "Sent"
    })
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
      setEmailInfo({recipients:"", subject:"", body:""})
      directUserToInbox()
    })
    .catch(error => {
      showFlashMessage(error, "flash-message-error")
    });

  }
    
  

    if (isSending)  {
      return <h1>Sending...</h1>
    }
    
    if (!(currentView === "Compose"))
    {
      return null;
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
    <CurrentViewProvider>
    <userContext.Provider value={currentUser}>

      <FlashMessage></FlashMessage>
      <Navbar></Navbar>

          <ComposeView replyEmailInfo={replyEmailInfo} setReplyEmailInfo={setReplyEmailInfo} />
          <MailBox setReplyEmailInfo={setReplyEmailInfo} setEmailView={setEmailView}></MailBox>
          <EmailView setReplyEmailInfo={setReplyEmailInfo} emailView={emailView}></EmailView>

    </userContext.Provider>
    </CurrentViewProvider>
    </FlashProvider>
  );
}

function EmailView({setReplyEmailInfo, emailView}) {

  const currentView = useContext(CurrentViewContext)
  const currentUser = useContext(userContext)
  const dispatchCurrentView = useContext(DispatchCurrentViewContext)
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
    dispatchCurrentView({
      type: "change_view",
      view: "Compose"
    })
  }

  if (!(currentView==="EmailView")) {
    return null
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
    {!(currentUser.email===emailView.sender) && (
    <div className="email-view-action-buttons-wrapper">
      <button className="btn btn-sm btn-secondary mx-3" name="archived" onClick={handleActionButton}>{isArchived ? "Unarchive" : "Archive"} </button>
     <button className="btn btn-sm btn-success mx-3" name="reply" onClick={handleReplyButton}>Reply</button>
     </div>
     )}
  </>
  )
}
