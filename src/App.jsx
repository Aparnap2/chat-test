import { useState, useEffect } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, orderBy, query } from 'firebase/firestore';
import { auth, app } from '../firebase'; // Assuming firebase config is in a separate file

const db = getFirestore(app);

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch messages on component mount and listen for changes
  useEffect(() => {
    const messageRef = collection(db, 'messages');
    const messageQuery = query(messageRef, orderBy('timestamp'));

    const unsubscribe = onSnapshot(messageQuery, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      })));
    });

    return unsubscribe; // Cleanup function to unsubscribe on unmount
  }, []);

  // Update user state based on auth state changes
  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  const sendMessage = async () => {
    if (!user) {
      alert('Please log in to send messages'); // Handle case if user is not logged in
      return;
    }

    try {
      await addDoc(collection(db, 'messages'), {
        uid: user.uid,
        photoURL: user.photoURL,
        displayName: user.displayName,
        text: newMessage,
        timestamp: serverTimestamp(),
      });
      setNewMessage(''); // Clear message input after sending
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      console.log(`Logged in as ${result.user.displayName}`); // Optional success message
    } catch (error) {
      console.error('Error logging in with Google:', error);
    }
  };

  return (
    <div className="flex justify-center bg-gray-800 py-10 min-h-screen">
      {user ? (
        <div>
          <div>Logged in as {user.displayName}</div>
          <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
          <button className="bg-white rounded-[10px] hover:bg-blue-400 p-3" onClick={sendMessage}>
            Send Message
          </button>
          <button className="mb-8 bg-white rounded-[10px] p-3" onClick={() => auth.signOut()}>
            Logout
          </button>
          <div className="flex flex-col gap-5">
            {messages.map((msg) => (
              <div key={msg.id} className={`message flex ${msg.data.uid === user.uid ? 'justify-end' : 'justify-start'}`}>
                <div className={`message flex flex-row p-3 gap-3 rounded-[20px] items-center ${
                  msg.data.uid === user.uid ? 'text-white bg-blue-500' : 'bg-white'
                }`}>
                  <img className="w-10 h-10 rounded-full" src={msg.data.photoURL} alt="Profile" />
                  {msg.data.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button onClick={handleGoogleLogin}>Login with Google</button>
      )}
    </div>
  );
}

export default App;
