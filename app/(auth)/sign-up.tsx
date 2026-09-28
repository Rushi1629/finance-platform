import { codeSchema, SignUpFormValues, signUpSchema } from "@/lib/schemas/auth";

import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { useAuth, useSignUp } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";

import { Link, useRouter } from "expo-router";

import React, { useState } from "react";

import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text as RNText,
  View,
} from "react-native";

import { Controller, useForm } from "react-hook-form";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react-native";
import { ErrorDialog } from "@/components/auth/error-dialog";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [errorDialog, setErrorDialog] = React.useState({
    open: false,
    title: "",
    message: "",
  });

  const isLoading = fetchStatus === "fetching";

  const showErrorDialog = (title: string, message: string) => {
    setErrorDialog({
      open: true,
      title,
      message,
    });
  };

  // ----------------------------------------
  // SIGN UP FORM
  // ----------------------------------------

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  // ----------------------------------------
  // VERIFICATION FORM
  // ----------------------------------------

  const {
    control: codeControl,
    handleSubmit: handleCodeSubmit,
    formState: { errors: codeErrors },
  } = useForm<{ code: string }>({
    resolver: zodResolver(codeSchema),
    mode: "onBlur",
    defaultValues: {
      code: "",
    },
  });

  // ----------------------------------------
  // SIGN UP
  // ----------------------------------------

  const onSignUpPress = async (values: SignUpFormValues) => {
    try {
      setEmail(values.email);

      const { error } = await signUp.password({
        emailAddress: values.email.trim(),
        password: values.password,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      });

      if (error) {
        showErrorDialog(
          "Sign Up Failed",
          error.message || "Something went wrong while creating your account.",
        );
        return;
      }

      await signUp.verifications.sendEmailCode();
    } catch (error: any) {
      showErrorDialog(
        "Sign Up Failed",
        error?.message || "Something went wrong. Please try again.",
      );
    }
  };

  // ----------------------------------------
  // VERIFY EMAIL
  // ----------------------------------------

  const onVerifyPress = async ({ code }: { code: string }) => {
    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code,
      });

      if (error) {
        showErrorDialog(
          "Verification Failed",
          error.message || "Invalid verification code. Please try again.",
        );
        return;
      }

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) return;

            const url = decorateUrl("/");
            router.replace(url as any);
          },
        });
      } else {
        showErrorDialog(
          "Verification Failed",
          "Your account could not be verified. Please try again.",
        );
      }
    } catch (error: any) {
      showErrorDialog(
        "Verification Failed",
        error?.message || "Something went wrong. Please try again.",
      );
    }
  };

  // ----------------------------------------
  // SIGN UP COMPLETE
  // ----------------------------------------

  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  // ----------------------------------------
  // VERIFICATION SCREEN
  // ----------------------------------------

  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  ) {
    return (
      <SafeAreaView className="flex-1 bg-brand-body">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerClassName="flex-grow px-6 py-10"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
          >
            <View className="mx-auto w-full max-w-md">
              {/* -------------------------------- */}
              {/* BRAND */}
              {/* -------------------------------- */}

              <View className="mb-10">
                <Image
                  source={require("../../assets/images/wealth.png")}
                  className="h-16 w-36"
                  resizeMode="contain"
                />
              </View>

              {/* -------------------------------- */}
              {/* ICON */}
              {/* -------------------------------- */}

              <View className="mb-6 size-14 items-center justify-center rounded-2xl bg-brand-blue/10">
                <ShieldCheck size={28} color="#2563EB" strokeWidth={2} />
              </View>

              {/* -------------------------------- */}
              {/* HEADING */}
              {/* -------------------------------- */}

              <Text
                variant="h1"
                className="mb-2 text-3xl font-bold text-[#1A1D26]"
              >
                Verify your account
              </Text>

              <RNText className="mb-8 text-base leading-6 text-brand-text-muted">
                We sent a verification code to {email}. Enter it below to
                continue securely.
              </RNText>

              {/* -------------------------------- */}
              {/* CODE */}
              {/* -------------------------------- */}

              <Controller
                control={codeControl}
                name="code"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View className="mb-2">
                    <RNText className="mb-2 text-[13px] font-semibold text-[#1A1D26]">
                      Verification code
                    </RNText>

                    <View className="relative">
                      <FormField
                        label=""
                        placeholder="Enter verification code"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="numeric"
                        maxLength={6}
                        icon={<LockKeyhole size={18} color="#9CA0AA" />}
                        error={
                          codeErrors.code?.message ||
                          errors.fields.code?.message
                        }
                      />
                    </View>
                  </View>
                )}
              />

              {/* -------------------------------- */}
              {/* VERIFY BUTTON */}
              {/* -------------------------------- */}

              <Button
                onPress={handleCodeSubmit(onVerifyPress)}
                disabled={isLoading}
                className="mt-4 h-14 rounded-2xl bg-brand-blue hover:bg-brand-blue/90 active:bg-brand-blue/80"
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="font-semibold text-white">
                      Verify account
                    </Text>

                    <ArrowRight size={18} color="white" />
                  </>
                )}
              </Button>

              {/* -------------------------------- */}
              {/* ACTIONS */}
              {/* -------------------------------- */}

              <View className="mt-5 flex-row items-center justify-center gap-5">
                <Pressable onPress={() => signUp.verifications.sendEmailCode()}>
                  <RNText className="text-sm font-semibold text-brand-blue">
                    Resend code
                  </RNText>
                </Pressable>

                <View className="h-4 w-px bg-[#D1D5DB]" />

                <Pressable onPress={() => signUp.reset()}>
                  <RNText className="text-sm font-semibold text-brand-blue">
                    Start over
                  </RNText>
                </Pressable>
              </View>
            </View>
          </ScrollView>
          <ErrorDialog
            open={errorDialog.open}
            title={errorDialog.title}
            message={errorDialog.message}
            onOpenChange={(open) =>
              setErrorDialog((prev) => ({
                ...prev,
                open,
              }))
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ----------------------------------------
  // SIGN UP SCREEN
  // ----------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-brand-body">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="flex-grow px-6 py-10"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <View className="mx-auto w-full max-w-md">
            {/* -------------------------------- */}
            {/* BRAND */}
            {/* -------------------------------- */}

            <View className="mb-9">
              <Image
                source={require("../../assets/images/wealth.png")}
                className="h-16 w-36"
                resizeMode="contain"
              />
            </View>

            {/* -------------------------------- */}
            {/* HEADING */}
            {/* -------------------------------- */}

            <View className="mb-8">
              <Text
                variant="h1"
                className="text-3xl font-bold tracking-tight text-[#1A1D26]"
              >
                Create account
              </Text>

              <RNText className="mt-2 text-[15px] leading-6 text-brand-text-muted">
                Create your account and start managing your wealth with
                confidence.
              </RNText>
            </View>

            {/* -------------------------------- */}
            {/* FORM */}
            {/* -------------------------------- */}

            <View>
              {/* First + Last Name */}

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="firstName"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <FormField
                        label="First name"
                        placeholder="First name"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="words"
                        icon={<User size={18} color="#9CA0AA" />}
                        error={formErrors.firstName?.message}
                      />
                    )}
                  />
                </View>

                <View className="flex-1">
                  <Controller
                    control={control}
                    name="lastName"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <FormField
                        label="Last name"
                        placeholder="Last name"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="words"
                        icon={<User size={18} color="#9CA0AA" />}
                        error={formErrors.lastName?.message}
                      />
                    )}
                  />
                </View>
              </View>

              {/* Email */}

              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <FormField
                    label="Email address"
                    placeholder="you@example.com"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    icon={<Mail size={18} color="#9CA0AA" />}
                    error={
                      formErrors.email?.message ||
                      errors.fields.emailAddress?.message
                    }
                  />
                )}
              />

              {/* Password */}

              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <FormField
                    label="Password"
                    placeholder="Create a password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    icon={<LockKeyhole size={18} color="#9CA0AA" />}
                    rightIcon={
                      <Pressable
                        onPress={() => setShowPassword((value) => !value)}
                        hitSlop={10}
                      >
                        {showPassword ? (
                          <EyeOff size={19} color="#6B7280" />
                        ) : (
                          <Eye size={19} color="#6B7280" />
                        )}
                      </Pressable>
                    }
                    error={
                      formErrors.password?.message ||
                      errors.fields.password?.message
                    }
                  />
                )}
              />

              {/* -------------------------------- */}
              {/* SIGN UP BUTTON */}
              {/* -------------------------------- */}

              <Button
                onPress={handleSubmit(onSignUpPress)}
                disabled={isLoading}
                className="mt-2 h-14 rounded-2xl bg-brand-blue hover:bg-brand-blue/90 active:bg-brand-blue/80"
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-base font-semibold text-white">
                      Create account
                    </Text>

                    <ArrowRight size={18} color="white" />
                  </>
                )}
              </Button>
            </View>

            {/* -------------------------------- */}
            {/* SECURITY */}
            {/* -------------------------------- */}

            <View className="mt-6 flex-row items-center justify-center rounded-2xl bg-brand-blue/5 px-4 py-3.5">
              <ShieldCheck size={17} color="#2563EB" />

              <RNText className="ml-2 flex-1 text-center text-xs leading-5 text-brand-text-muted">
                Your account and financial data are securely protected.
              </RNText>
            </View>

            {/* -------------------------------- */}
            {/* SIGN IN */}
            {/* -------------------------------- */}

            <View className="mt-8 flex-row justify-center">
              <RNText className="text-sm text-brand-text-muted">
                Already have an account?{" "}
              </RNText>

              <Link href="/sign-in">
                <RNText className="text-sm font-bold text-brand-blue">
                  Sign in
                </RNText>
              </Link>
            </View>

            {/* -------------------------------- */}
            {/* FOOTER */}
            {/* -------------------------------- */}

            <RNText className="mt-7 px-5 text-center text-[10px] leading-4 text-[#A1A5AE]">
              By continuing, you agree to our Terms of Service and Privacy
              Policy.
            </RNText>
          </View>
        </ScrollView>

        <ErrorDialog
          open={errorDialog.open}
          title={errorDialog.title}
          message={errorDialog.message}
          onOpenChange={(open) =>
            setErrorDialog((prev) => ({
              ...prev,
              open,
            }))
          }
        />

        {/* Required by Clerk for bot protection */}
        <View nativeID="clerk-captcha" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
