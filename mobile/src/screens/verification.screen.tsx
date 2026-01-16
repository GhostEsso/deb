import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, Text, Platform, KeyboardAvoidingView, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { authApi } from '../services/api.service';

const FACE_SIZE = 150;

export const VerificationScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { email } = route.params || {};

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (code.length === 4) {
            handleVerify();
        }
    }, [code]);

    const handleVerify = async () => {
        setLoading(true);
        try {
            await authApi.verify({ email, code });

            Alert.alert('Succès', 'Votre compte est vérifié !', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);

        } catch (error: any) {
            console.error(error);
            Alert.alert('Erreur', error.response?.data?.message || 'Code incorrect');
            setCode(''); // Reset code
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.container}>

                <View style={styles.header}>
                    <Text style={styles.title}>Vérification</Text>
                    <Text style={styles.subtitle}>
                        Entrez le code envoyé à {email}
                    </Text>
                </View>

                {/* PLACEHOLDER ICON OR VIEW */}
                <View style={styles.iconContainer}>
                    <Text style={{ fontSize: 64 }}>📩</Text>
                </View>

                {/* INPUT */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={code}
                        onChangeText={(text) => {
                            // Only numbers
                            if (/^\d*$/.test(text) && text.length <= 4) {
                                setCode(text);
                            }
                        }}
                        keyboardType="number-pad"
                        placeholder="0000"
                        maxLength={4}
                        autoFocus
                    />
                </View>

                {loading && <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />}

                <Text style={styles.footerText}>
                    Code non reçu ? Attendez quelques instants avant de réessayer.
                </Text>

            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 8,
        color: '#6B7280',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        width: FACE_SIZE,
        height: FACE_SIZE,
        borderRadius: FACE_SIZE / 2,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        width: '80%',
        alignItems: 'center',
    },
    input: {
        fontSize: 48,
        letterSpacing: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#000',
        width: 200,
        paddingBottom: 10,
    },
    footerText: {
        marginTop: 20,
        color: '#9CA3AF',
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
