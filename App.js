import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

const App = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Galleria Saves the Planet</Text>
    <StatusBar style="dark" />
  </View>
);

export default App;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#5EEAD4', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
});
