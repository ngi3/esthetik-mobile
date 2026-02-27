import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFound() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 18, marginBottom: 12 }}>Page introuvable</Text>
      <Link href="/">
        <Text style={{ color: '#E64A19', fontWeight: '600' }}>Revenir à l&#39;accueil</Text>
      </Link>
    </View>
  );
}
