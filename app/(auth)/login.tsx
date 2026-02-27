import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  const { login, user } = useAuth();

  const validateEmail = (val: string) => /.+@.+\..+/.test(val);
  const emailError = useMemo(() => {
    if (!email) return '';
    return validateEmail(email) ? '' : "Format d'email invalide";
  }, [email]);

  const handleLogin = async () => {
    setError(null);
    setSuccess(null);
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (!validateEmail(email)) {
      setError("Format d'email invalide");
      return;
    }
    setIsLoggingIn(true);
    const result = await login({ email, password });
    if (!result.ok) {
      setError(result.message || 'Identifiants incorrects ou erreur serveur');
      setIsLoggingIn(false);
    } else {
      setSuccess('Connexion réussie ! Redirection...');
      // Don't set isLoggingIn to false here - let the effect handle it
    }
  };

  useEffect(() => {
    console.log('Login - isLoggingIn:', isLoggingIn, 'user:', user);
    if (isLoggingIn && user) {
      console.log('Login - Redirecting user with role:', user.role);
      if (user.role === 'client') {
        console.log('Login - Redirect to /(tabs)/home');
        router.replace('/(tabs)/home');
      } else if (user.role === 'professionnel') {
        console.log('Login - Redirect to /(pro)/dashboard');
        router.replace('/(pro)/dashboard');
      }
      setIsLoggingIn(false);
    }
  }, [isLoggingIn, user, router]);

  const handleEmailChange = (val: string) => {
    setEmail(val.trim());
    if (error) setError(null);
  };
  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (error) setError(null);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Accédez à votre compte pour découvrir la beauté</Text>

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, !!emailError && email ? styles.inputError : null]}
            placeholder="votre@email.com"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />
          {!!emailError && email ? <Text style={styles.helperError}>{emailError}</Text> : null}
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]}
              placeholder="••••••••"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
              accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {error && <Text style={styles.helperErrorCenter}>{error}</Text>}
        {success && <Text style={styles.helperSuccessCenter}>{success}</Text>}

        <View style={styles.options}>
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setRememberMe((v) => !v)}>
            <Ionicons name={rememberMe ? 'checkbox' : 'square-outline'} size={18} color={rememberMe ? '#E64A19' : '#666'} />
            <Text style={styles.rememberText}>Se souvenir de moi</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, (isLoggingIn || !email || !password || !validateEmail(email)) && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoggingIn || !email || !password || !validateEmail(email)}
        >
          {isLoggingIn ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Se connecter</Text>}
        </TouchableOpacity>

        <Text style={styles.orText}>OU CONTINUER AVEC</Text>

        <View style={styles.socialButtons}>
          <TouchableOpacity style={styles.socialButton} disabled>
            <Text style={styles.socialText}>G Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} disabled>
            <Ionicons name="call-outline" size={20} color="#fff" />
            <Text style={styles.socialText}>Téléphone</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.signupText}>Pas encore de compte ? S&apos;inscrire maintenant</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f8f8f8', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#E64A19', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  fieldWrap: { marginBottom: 12 },
  label: { fontSize: 13, color: '#555', marginBottom: 6, marginLeft: 4 },
  input: { height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 10, marginBottom: 15, backgroundColor: '#fff' },
  inputError: { borderColor: '#E53935' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, marginBottom: 15, backgroundColor: '#fff' },
  eyeIcon: { padding: 10 },
  options: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rememberText: { color: '#666' },
  forgotText: { color: '#E64A19' },
  loginButton: { backgroundColor: '#E64A19', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: '#fff', fontWeight: 'bold' },
  orText: { textAlign: 'center', color: '#666', marginVertical: 10 },
  socialButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  socialButton: { backgroundColor: '#E64A19', padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, marginHorizontal: 5 },
  socialText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  signupText: { color: '#E64A19', textAlign: 'center' },
  helperError: { color: '#E53935', fontSize: 12, marginTop: -8, marginBottom: 6, marginLeft: 4 },
  helperErrorCenter: { color: '#E53935', textAlign: 'center', marginBottom: 10 },
  helperSuccessCenter: { color: '#2E7D32', textAlign: 'center', marginBottom: 10 },
});
