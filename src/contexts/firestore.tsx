import React from "react";
import firebase from "firebase/app";
import "firebase/firestore";

interface IProviderProps {
  children: React.ReactNode;
}

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_API_KEY,
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const firestore = firebase.firestore();

const FirestoreContext = React.createContext({ firestore });

export default FirestoreContext;

export const FirestoreProvider = ({
  children,
}: IProviderProps): JSX.Element => {
  return (
    <FirestoreContext.Provider value={{ firestore }}>
      {children}
    </FirestoreContext.Provider>
  );
};
