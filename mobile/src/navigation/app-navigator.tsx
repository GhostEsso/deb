import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingScreen } from '@/screens/onboarding.screen';
import { LoginScreen } from '@/screens/login.screen';
import { RegisterScreen } from '@/screens/register.screen';
import { VerificationScreen } from '@/screens/verification.screen';
import { ServiceListScreen } from '@/screens/service-list.screen';
import { ServiceDetailScreen } from '@/screens/service-detail.screen';
import { ProfileScreen } from '@/screens/profile.screen';
import { AdminServiceFormScreen } from '@/screens/admin-service-form.screen';
import { AccountingScreen } from '@/screens/accounting.screen';

const Stack = createStackNavigator();

export const AppNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="Onboarding"
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: '#FFFFFF' },
            }}
        >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Verification" component={VerificationScreen} />
            <Stack.Screen name="ServiceList" component={ServiceListScreen} />
            <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="AdminServiceCreate" component={AdminServiceFormScreen} />
            <Stack.Screen name="AdminServiceEdit" component={AdminServiceFormScreen} />
            <Stack.Screen name="Accounting" component={AccountingScreen} />
        </Stack.Navigator>
    );
};
