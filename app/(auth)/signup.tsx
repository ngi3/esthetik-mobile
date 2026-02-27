
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function Signup() {

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'client' | 'professionnel'>('client');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const { signup, user } = useAuth();

  const validateEmail = (val: string) => /.+@.+\..+/.test(val);
  const validatePassword = (val: string) => val.length >= 6;
  const passwordStrength = useMemo(() => {
    if (!password) return { label: '', color: '#ddd', level: 0 };
    let level = 0;
    if (password.length >= 6) level++;
    if (/[A-Z]/.test(password)) level++;
    if (/[0-9]/.test(password)) level++;
    if (/[^A-Za-z0-9]/.test(password)) level++;
    const map = [
      { label: 'Faible', color: '#E53935' },
      { label: 'Moyenne', color: '#FB8C00' },
      { label: 'Bonne', color: '#FBC02D' },
      { label: 'Forte', color: '#43A047' },
    ];
    return { label: map[Math.max(0, level - 1)].label, color: map[Math.max(0, level - 1)].color, level };
  }, [password]);

  const handleSignup = async () => {
    setError(null);
    setSuccess(null);
    if (!firstName || !lastName || !email || !phone || !location || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (!validateEmail(email)) {
      setError('Format d\'email invalide');
      return;
    }
    if (!validatePassword(password)) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (!agreeTerms) {
      setError('Vous devez accepter les conditions d\'utilisation.');
      return;
    }
    setIsSigningUp(true);
    const successSignup = await signup({ firstName, lastName, email, phone, location, password, role });
    if (!successSignup) {
      setError('Erreur lors de la création du compte (email déjà utilisé ou problème serveur).');
      setIsSigningUp(false);
    } else {
      setSuccess('Compte créé avec succès ! Redirection...');
    }
    // Success: redirection handled in useEffect
  };

  // Clear error on input change
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (error) setError(null);
  };
  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (error) setError(null);
  };
  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (error) setError(null);
  };
  const handleFirstNameChange = (val: string) => {
    setFirstName(val);
    if (error) setError(null);
  };
  const handleLastNameChange = (val: string) => {
    setLastName(val);
    if (error) setError(null);
  };
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (error) setError(null);
  };
  const handleLocationChange = (val: string) => {
    setLocation(val);
    if (error) setError(null);
  };

  React.useEffect(() => {
    if (isSigningUp && user) {
      if (user.role === 'client') {
        router.replace('/(tabs)/home');
      } else if (user.role === 'professionnel') {
        router.replace('/(pro)/dashboard');
      }
      setIsSigningUp(false);
    }
  }, [isSigningUp, user, router]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Inscription</Text>
      <Text style={styles.subtitle}>Créez votre compte en quelques étapes</Text>

      <View style={styles.roleSelector}>
        <TouchableOpacity style={[styles.roleButton, role === 'client' && styles.roleButtonSelected]} onPress={() => setRole('client')}>
          <Ionicons name="person-outline" size={20} color={role === 'client' ? '#fff' : '#666'} />
          <Text style={[styles.roleText, role === 'client' && styles.roleTextSelected]}>Clientele</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.roleButton, role === 'professionnel' && styles.roleButtonSelected]} onPress={() => setRole('professionnel')}>
          <Ionicons name="star-outline" size={20} color={role === 'professionnel' ? '#fff' : '#666'} />
          <Text style={[styles.roleText, role === 'professionnel' && styles.roleTextSelected]}>Professionnel</Text>
        </TouchableOpacity>
      </View>


      <TextInput style={styles.input} placeholder="Votre prénom" value={firstName} onChangeText={handleFirstNameChange} returnKeyType="next" />
      <TextInput style={styles.input} placeholder="Votre nom" value={lastName} onChangeText={handleLastNameChange} returnKeyType="next" />
      <TextInput
        style={styles.input}
        placeholder="votre@email.com"
        value={email}
        onChangeText={handleEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
      />
      <TextInput style={styles.input} placeholder="+225 XX XX XX XX" value={phone} onChangeText={handlePhoneChange} keyboardType="phone-pad" returnKeyType="next" />
      <TextInput style={styles.input} placeholder="Abidjan, Cocody..." value={location} onChangeText={handleLocationChange} returnKeyType="next" />
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]}
          placeholder="••••••••"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry={!showPassword}
          returnKeyType="next"
        />
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)} accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
        </TouchableOpacity>
      </View>
      {!!password && (
        <View style={styles.strengthRow}>
          <View style={[styles.strengthBar, { backgroundColor: passwordStrength.color, width: `${(passwordStrength.level/4)*100}%` }]} />
          <Text style={styles.strengthText}>{passwordStrength.label}</Text>
        </View>
      )}
      <TextInput
        style={styles.input}
        placeholder="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={handleConfirmPasswordChange}
        secureTextEntry
        returnKeyType="done"
      />


  {error && <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>{error}</Text>}
  {success && <Text style={{ color: 'green', textAlign: 'center', marginBottom: 10 }}>{success}</Text>}

      <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgreeTerms(!agreeTerms)}>
        <Ionicons name={agreeTerms ? 'checkbox' : 'square-outline'} size={20} color={agreeTerms ? '#E64A19' : '#666'} />
        <Text style={styles.termsText}>J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité</Text>
      </TouchableOpacity>


      <TouchableOpacity
        style={[styles.loginButton, !agreeTerms && styles.disabledButton]}
        onPress={handleSignup}
        disabled={
          !agreeTerms ||
          isSigningUp ||
          !firstName ||
          !lastName ||
          !email ||
          !phone ||
          !location ||
          !password ||
          !validateEmail(email) ||
          !validatePassword(password)
        }
      >
        {isSigningUp ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Créer mon compte</Text>}
      </TouchableOpacity>

      <Text style={styles.orText}>OU S&apos;INSCRIRE AVEC</Text>

      <View style={styles.socialButtons}>
        <TouchableOpacity style={styles.socialButton} disabled>
          <Text style={styles.socialText}>G Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} disabled>
          <Ionicons name="call-outline" size={20} color="#fff" />
          <Text style={styles.socialText}>Téléphone</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.signupText}>Déjà un compte ? Se connecter maintenant</Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f8f8f8', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#E64A19', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  roleSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  roleButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 10, borderRadius: 10, flex: 1, marginHorizontal: 5 },
  roleButtonSelected: { backgroundColor: '#E64A19' },
  roleText: { marginLeft: 5, color: '#666' },
  roleTextSelected: { color: '#fff' },
  input: { height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 10, marginBottom: 15, backgroundColor: '#fff' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, marginBottom: 15, backgroundColor: '#fff' },
  eyeIcon: { padding: 10 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  termsText: { marginLeft: 10, color: '#666' },
  loginButton: { backgroundColor: '#E64A19', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  disabledButton: { backgroundColor: '#f0a68c' },
  loginButtonText: { color: '#fff', fontWeight: 'bold' },
  orText: { textAlign: 'center', color: '#666', marginVertical: 10 },
  socialButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  socialButton: { backgroundColor: '#E64A19', padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, marginHorizontal: 5 },
  socialText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  signupText: { color: '#E64A19', textAlign: 'center' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -8, marginBottom: 8 },
  strengthBar: { height: 6, borderRadius: 4, backgroundColor: '#ddd', flex: 1 },
  strengthText: { fontSize: 12, color: '#666' },
});
