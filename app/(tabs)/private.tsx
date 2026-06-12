import { StyleSheet, Text, View } from 'react-native';

export default function MatchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Private</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111111',
  },
});