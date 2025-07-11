import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, AlertCircle, Lock, User } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    login,
    isAuthenticated,
    isLoading,
    appSettings,
    organization,
    initError,
    isAppReady,
  } = useAuth();

  /** ---------- responsive helpers ---------- */
  const { width: windowWidth } = useWindowDimensions();          // ★
  const isPhone = windowWidth < 400;                             // ★

  useEffect(() => {
    if (isAuthenticated) router.replace('/(tabs)');
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter both username and password');
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const success = await login(username.trim(), password);
      if (success) router.replace('/(tabs)');
      else setLoginError('Invalid username or password');
    } catch (e: any) {
      setLoginError(e.message || 'An error occurred during login. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Show loading spinner while app is initializing
  if (isLoading || !isAppReady) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#4361ee', '#3a0ca3']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Initializing app...</Text>
          </View>
          {initError && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color="#EF4444" />
              <Text style={styles.errorText}>{initError}</Text>
            </View>
          )}
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const appName        = appSettings?.['customized-app-name']          || 'Gobeller';
  const primaryColor   = appSettings?.['customized-app-primary-color'] || '#4361ee';
  const secondaryColor = appSettings?.['customized-app-secondary-color'] || '#3a0ca3';
  // console.log(primaryColor);
  
  

  /** merge base styles with a few values that depend on viewport */
  const dyn = StyleSheet.create({
    formContainer: {
      width: '100%',                // ★ always full‑width; capped below
      maxWidth: 400,
      paddingHorizontal: isPhone ? 12 : 24,
    },
    inputWrapper: {
      gap: isPhone ? 8 : 12,        // ★ tighter gaps on phones
      paddingHorizontal: isPhone ? 12 : 16,
      paddingVertical: isPhone ? 14 : 16,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[primaryColor, secondaryColor]} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Init‑error banner */}
            {initError && (
              <View style={styles.warningBanner}>
                <AlertCircle size={16} color="#F59E0B" />
                <Text style={styles.warningText}>{initError}</Text>
              </View>
            )}

            {/* Header */}
            <View style={styles.header}>
              {organization?.public_logo_url || organization?.customized_app_settings && (
                <View style={styles.logoContainer}>
                  {/* <Image
                    source={{ uri: organization.public_logo_url || organization?.customized_app_settings?.customized-app-logo-url }}
                    style={styles.logo}
                    resizeMode="contain"
                  /> */}



                  <Image
                    source={{ uri: organization?.public_logo_url || organization?.customized_app_settings?.['customized-app-logo-url'] }}
                    style={styles.logo}
                    resizeMode="contain"
                  />

                </View>
              )}
              <Text style={styles.title}>{appName}</Text>
              <Text style={styles.subtitle}>
                {organization?.description || 'Sign in to your account'}
              </Text>
            </View>

            {/* ---------- LOGIN FORM ---------- */}
            <View style={[styles.formContainer, dyn.formContainer]}>
              <View style={styles.form}>
                {loginError && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{loginError}</Text>
                  </View>
                )}

                {/* Username */}
                <View style={styles.inputContainer}>
                  <View style={[styles.inputWrapper, dyn.inputWrapper]}>
                    <User size={20} color="#94a3b8" />
                    <TextInput
                      style={styles.input}
                      placeholder="Email or Username"
                      value={username}
                      onChangeText={(t) => {
                        setUsername(t);
                        if (loginError) setLoginError(null);
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputContainer}>
                  <View style={[styles.inputWrapper, dyn.inputWrapper]}>
                    <Lock size={20} color="#94a3b8" />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        if (loginError) setLoginError(null);
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor="#94a3b8"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/forgot-password')}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoggingIn}
                >
                  <Text style={styles.loginButtonText}>{isLoggingIn ? 'Signing In...' : 'Sign In'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={[styles.signUpText, { color: '#ffffff' }]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Org info */}
            {organization && (
              <View style={styles.orgContainer}>
                <Text style={styles.orgTitle}>{organization.full_name}</Text>
                <Text style={styles.orgContact}>📞 {organization.official_contact_phone}</Text>
                <Text style={styles.orgEmail}>✉️ {organization.official_email}</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------ */
/* ------------------------- STYLES --------------------------- */
/* ------------------------------------------------------------ */
const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },

  /* ------ load / error banners ----- */
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:      { fontSize: 16, fontFamily: 'Poppins-Medium', color: '#fff' },
  warningBanner: {
    flexDirection: 'row',
    alignItems:     'center',
    backgroundColor: 'rgba(254,243,199,0.2)',
    borderColor:    '#F59E0B',
    borderWidth:    1,
    padding:        12,
    borderRadius:   12,
    marginBottom:   16,
  },
  warningText: {
    fontSize: 14,
    color: '#F59E0B',
    fontFamily: 'Poppins-Regular',
    marginLeft: 8,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems:     'center',
    backgroundColor: 'rgba(254,226,226,0.2)',
    borderColor:    '#EF4444',
    borderWidth:    1,
    padding:        12,
    borderRadius:   12,
    marginBottom:   16,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: 'Poppins-Regular',
    marginLeft: 8,
    flex: 1,
  },

  /* ------ header ------ */
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 80, height: 80, borderRadius: 16, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24, overflow: 'hidden',
    ...Platform.select({
      ios:      { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android:  { elevation: 8 },
      web:      { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    }),
  },
  logo:   { width: 80, height: 80 },
  title:  { fontSize: 32, fontFamily: 'Poppins-Bold', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },

  /* ------ form ------ */
  formContainer: {
    alignSelf:       'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.2)',
    marginBottom:    32,
    paddingVertical: 24,
  },
  form: { marginBottom: 32 },

  inputContainer: { marginBottom: 20 },
  inputWrapper: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius:    12,
    borderWidth:     1,
    width:           '100%',  // ★ fill line then shrink if needed
    minWidth:        0,       // ★ let TextInput shrink on web
  },
  input: {
    flex: 1,
    minWidth: 0,              // ★ critical for RN‑web
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#fff',
  },
  eyeIcon:        { padding: 4 },

  forgotPassword:      { alignSelf: 'flex-end', marginBottom: 32 },
  forgotPasswordText:  { fontSize: 14, fontFamily: 'Poppins-Medium', color: 'rgba(255,255,255,0.8)' },

  loginButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 8 },
      web:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    }),
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText:     { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#4361ee' },

  /* ------ footer / org ------ */
  footer:      { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  footerText:  { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins-Regular' },
  signUpText:  { fontSize: 14, fontFamily: 'Poppins-SemiBold' },

  orgContainer: {
    alignItems:      'center',
    padding:         20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.2)',
  },
  orgTitle:   { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#fff', marginBottom: 4, textAlign: 'center' },
  orgContact: { fontSize: 12, fontFamily: 'Poppins-Regular', color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  orgEmail:   { fontSize: 12, fontFamily: 'Poppins-Regular', color: 'rgba(255,255,255,0.8)' },
});
