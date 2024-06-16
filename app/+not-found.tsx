import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from 'react-native-paper';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'A kutyafáját!' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">Eltévedtünk a bitrengetegben.</ThemedText>
        <Link href="/" style={styles.link} asChild>
          <Button mode='contained-tonal'>Vissza a főképernyőre</Button>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
  },
});
