import { Stack, useNavigation, useRouter, } from "expo-router";
import {NativeStackHeaderProps} from '@react-navigation/native-stack/lib/typescript/src/types'
import { Appbar, PaperProvider, Text } from 'react-native-paper';

export default function RootLayout() {
  return (
    <PaperProvider>
      <Stack  screenOptions={{ header: (props) => <MyAppbar {...props} />}}>
        <Stack.Screen name="index" options={{title:'FiFe app'}}/>
        <Stack.Screen name="mapTest" options={{title:'asd'}}/>
      </Stack>
    </PaperProvider>
  );
}

const MyAppbar = (props:NativeStackHeaderProps) => {
  const navigation = useNavigation();
  
  return (
    <Appbar.Header mode='center-aligned' >
      {navigation.canGoBack() ? <Appbar.BackAction onPress={navigation.goBack} /> : null}
      <Appbar.Content title={props.options.title} />
    </Appbar.Header>
  )
}