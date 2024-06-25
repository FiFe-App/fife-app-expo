import { FirebaseContext } from "@/lib/firebase/firebase";
import { RootState } from "@/lib/redux/store";
import { UserState } from "@/lib/redux/store.type";
import { useContext, useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { useSelector } from "react-redux";

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { api: { login, facebookLogin, logout }} = useContext(FirebaseContext);
  const [error, setError] = useState<string|undefined>();

  const { uid, name }: UserState = useSelector(
    (state: RootState) => state.user
);

  const startLogin = () => {
    login(email,password).then(res=>{
      setError(res?.error)

    })
  }
  const startFacebookLogin = () => {
    facebookLogin()
  }
  const startLogout = () => {
    logout();
  }
  

  if (!uid)
  return (
    <View style={{maxWidth:400,width:'100%',gap:8,margin:'auto'}}>
      <Button mode='contained' icon="facebook" onPress={startFacebookLogin}>Facebook bejelentkezés</Button>
      <TextInput onChangeText={setEmail} value={email} placeholder="Email" />
      <TextInput onChangeText={setPassword} value={password} placeholder="Jelszó" secureTextEntry />
      <Button onPress={startLogin}>
        <Text>Bejelentkezés</Text>
      </Button>
      <Text style={{color:'red'}}>{error}</Text>
    </View>
  );
  return (
    <View>
      <Text>Bejelentkezve, mint {name}</Text>
      <Button icon='logout' onPress={startLogout}>Kijelentkezés</Button>
    </View>
  )
}

