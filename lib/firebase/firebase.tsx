import {
    Auth,
    AuthCredential,
    createUserWithEmailAndPassword,
    FacebookAuthProvider,
    getAuth,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile
} from 'firebase/auth';
import { createContext, ReactElement } from 'react';

import { FirebaseApp, FirebaseError, getApp } from 'firebase/app';
import { Database, get, getDatabase, ref } from 'firebase/database';
import { useDispatch } from 'react-redux';

import { setName, setUserData, login as sliceLogin, logout as sliceLogout } from '../redux/reducers/userReducer';
import { app } from './firebaseConfig';

interface SuccessOrError {
    success?: boolean;
    error?: string;
}

interface type {
    app: FirebaseApp;
    auth: Auth;
    database: Database;
    api: {
        login: (email:string, password:string, firstLogin?:any) => Promise<SuccessOrError|null>;
        register: (email:string,password:string,data:any)=>void;
        facebookLogin: ()=>void;
        logout: ()=>void;
        forgotPassword: (email:string)=>void;
    }
}


const Context = ({ children }:{children:ReactElement}) => {
    const dispatch = useDispatch()

    const forgotPassword = async (email:string) => {
        const retApp = getApp()
        const a = getAuth(retApp)
        if (!email || email === '') return 'Email nélkül nem tudjuk visszaállítani a jelszavad'
        return sendPasswordResetEmail(a,email).then(res=>{
            return 'Küldtünk egy emailt, amivel vissza tudod állítani a fiókodat a rendes kerékvágásba!\n(Nézd meg a spam mappát is!)'
        }).catch(err=>{
            console.log(err);
            console.log(err.code);
            if (err.code === 'auth/invalid-email')
                return 'Ez az email-cím nem szerepel a rendszerben:(';
            return 'Aj-aj hiba történt! Próbáld meg később légyszi'
        })
    }

    const logout = () => {
        signOut(getAuth());
        console.log('logout');
        dispatch(sliceLogout())
    }
    const login = async (email:string, password:string, firstLogin?:any) => {
        let newEmail = email
        let newPass = password
        let response:SuccessOrError|null = null
        
        await signInWithEmailAndPassword(getAuth(getApp()), newEmail, newPass)
        .then(async (userCredential) => {
            const user = userCredential.user
            await user.getIdToken(false).then(token=>{
                console.log(token);

                dispatch(sliceLogin(user.uid));
                dispatch(setName(user.displayName))
                dispatch(setUserData({
                    authtoken:token,
                    email:user.email,
                    emailVerified:user.emailVerified,
                    providerData:user.providerData,
                    createdAt:user.metadata.creationTime,
                    lastLoginAt:user.metadata.lastSignInTime
                }))
            })

            if (firstLogin) {
                const user = getAuth(getApp()).currentUser;
                console.log(user);
                if (user === null) {
                    console.log('USER NULL');
                    return
                }
                console.log('set',`users/${user.uid}/data`,firstLogin);
            } else {
            const dbRef = ref(getDatabase(getApp()),'users/' + user.uid + '/settings');
            get(dbRef).then((snapshot) => {
            if (snapshot.exists()) {
                //dispatch(setSettings(snapshot.val()))
            }
            
            })
            const nameRef = ref(getDatabase(getApp()),'users/' + user.uid + '/data/name');
            get(nameRef).then((snapshot) => {
            if (snapshot.exists()) {
                const newName = snapshot.val();
                const curUser = getAuth().currentUser
                if (curUser)
                updateProfile(curUser, {
                    displayName: newName
                  }).then(() => {
                    console.log('update');
                    dispatch(setName(newName))
                    
                  }).catch((error) => {
                    console.log(error);
                  });
            }
            
            })
        }
            response = {success:true}
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
        
            if (errorCode === 'auth/invalid-email' || errorCode === 'auth/user-not-found')
                response = {error:'Bakfitty! Nem jó az email cím, amit megadtál!'};
            else if (errorCode === 'auth/internal-error')
                response = {error:'Azáldóját! A szerveren hiba történt, próbáld újra!'};
            else if (errorCode === 'auth/wrong-password')
                response = {error:'Azt a hét meg a nyolcát! Lehet elírtad a jelszavad.'};
            else if (errorCode === 'auth/too-many-requests')
                response = {error:'Hoppá! Túl sokszor próbáltál bejelentkezni, próbálkozz később!'};
            else
                response = {error:'error: ' + errorCode + ' - ' + errorMessage};
        });

        return response

    }

    const register = async (email:string,password:string,data:any) => {
        let response = null
        const auth = getAuth();
        console.log('register',data);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                // Signed in 
                console.log('signed in as ',userCredential.user.email);
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                if (errorCode === 'auth/invalid-email')
                    response = {error:'Nem jó az email, amit megadtál :('};
                else if (errorCode === 'auth/weak-password')
                    response = {error:'A jelszavad nem elég bonyi\nlegyen legalább 6 karakter'};
                else if (errorCode === 'auth/wrong-password')
                    response = {error:'Rossz jelszavat adtál meg :/'};
                else
                    response = {error:'error: ' + errorCode + ' - ' + errorMessage};
                console.log(response);
            });
            try {
                const LoginRes = await login(email,password,data);
                console.log('loginRes',LoginRes);
            } catch (err) {
                console.log('set error',err);
            }
        console.log(userCredential);
        
        return response
    }

    const facebookLogin = async () => {
        const auth = getAuth();
        let response = null
        auth.languageCode = 'hu';
        console.log('fb-login');
        // Step 1: User tries to sign in using Facebook.
        await signInWithPopup(auth, new FacebookAuthProvider()).then((res)=>{
            console.log('facebook login success',res);
        }).catch(async (error:FirebaseError)=>{

            console.log(error);
            
            // Step 2: User's email already exists.
            if (error.code === "auth/account-exists-with-different-credential") {
                // The pending Facebook credential.
                if (error.customData?.email) {
                    FacebookAuthProvider.credentialFromError(
                        error
                    ) as AuthCredential;
                    //const email = error.customData?.email
                }
            }

        });
          
        return response;
    }

    const methods = {
        app:app,
        auth:getAuth(app),
        database:getDatabase(app),
        api:{login,register,facebookLogin,logout,forgotPassword}
    }
    return (
        <FirebaseContext.Provider value={methods}>
            {children}
        </FirebaseContext.Provider>
    )

}

export default Context;

const FirebaseContext = createContext<type>({}as type)
export { FirebaseContext };

