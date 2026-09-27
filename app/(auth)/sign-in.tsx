import { codeSchema, SignInFormValues, signInSchema } from "@/lib/schemas/auth";

import { FormField } from "@/components/auth/form-field";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { useSignIn } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";

import { Link, useRouter } from "expo-router";

import React from "react";

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
} from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { ErrorDialog } from "@/components/auth/error-dialog";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();

  const router = useRouter();

  const [showPassword, setShowPassword] = React.useState(false);
  const [errorDialog, setErrorDialog] = React.useState({
    open: false,
    title: "",
    message: "",
  });

  const showErrorDialog = (title: string, message: string) => {
    setErrorDialog({
      open: true,
      title,
      message,
    });
  };

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

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

  const isLoading = fetchStatus === "fetching";

  // ----------------------------------------
  // SIGN IN
  // ----------------------------------------

  const onSignInPress = async (values: SignInFormValues) => {
    try {
      const { error } = await signIn.password({
        emailAddress: values.email.trim(),
        password: values.password,
      });

      if (error) {
        showErrorDialog(
          "Sign In Failed",
          error.message || "Invalid email or password. Please try again.",
        );
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) return;

            const url = decorateUrl("/");
            router.replace(url as any);
          },
        });

        return;
      }

      if (signIn.status === "needs_second_factor") {
        try {
          await signIn.mfa.sendPhoneCode();
        } catch (error: any) {
          showErrorDialog(
            "Verification Failed",
            error?.message || "Unable to send verification code.",
          );
        }

        return;
      }

      if (signIn.status === "needs_client_trust") {
        const emailCodeFactor = signIn.supportedSecondFactors.find(
          (factor) => factor.strategy === "email_code",
        );

        if (emailCodeFactor) {
          try {
            await signIn.mfa.sendEmailCode();
          } catch (error: any) {
            showErrorDialog(
              "Verification Failed",
              error?.message || "Unable to send verification code.",
            );
          }
        }

        return;
      }

      showErrorDialog(
        "Sign In Failed",
        "Your sign-in could not be completed. Please try again.",
      );
    } catch (error: any) {
      showErrorDialog(
        "Sign In Failed",
        error?.message || "Something went wrong. Please try again.",
      );
    }
  };

  // ----------------------------------------
  // VERIFY CODE
  // ----------------------------------------

  const onVerifyPress = async ({ code }: { code: string }) => {
    try {
      const { error } = await signIn.mfa.verifyEmailCode({
        code,
      });

      if (error) {
        showErrorDialog(
          "Verification Failed",
          error.message || "Invalid verification code. Please try again.",
        );
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) return;

            const url = decorateUrl("/");
            router.replace(url as any);
          },
        });

        return;
      }

      showErrorDialog(
        "Verification Failed",
        "Your account could not be verified. Please try again.",
      );
    } catch (error: any) {
      showErrorDialog(
        "Verification Failed",
        error?.message || "Something went wrong. Please try again.",
      );
    }
  };

  // ----------------------------------------
  // VERIFICATION SCREEN
  // ----------------------------------------

  if (signIn.status === "needs_client_trust") {
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
            automaticallyAdjustKeyboardInsets
            contentContainerClassName="flex-grow px-6 py-10"
            showsVerticalScrollIndicator={false}
          >
            <View className="mx-auto w-full max-w-md">
              {/* Logo */}

              <Image
                source={require("../../assets/images/wealth.png")}
                className="mb-10 h-16 w-36"
                resizeMode="contain"
              />

              {/* Icon */}

              <View className="mb-6 size-14 items-center justify-center rounded-2xl bg-brand-blue/10">
                <ShieldCheck size={28} color="#2563EB" strokeWidth={2} />
              </View>

              {/* Heading */}

              <Text
                variant="h1"
                className="mb-2 text-3xl font-bold text-[#1A1D26]"
              >
                Verify your account
              </Text>

              <Text className="mb-8 text-base leading-6 text-brand-text-muted">
                We sent a verification code to your email. Enter it below to
                continue securely.
              </Text>

              {/* Code */}

              <Controller
                control={codeControl}
                name="code"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View className="mb-2">
                    <RNText className="mb-2 text-[13px] font-semibold text-[#1A1D26]">
                      Verification code
                    </RNText>

                    <View className="relative">
                      <View className="absolute left-4 top-4 z-10">
                        <LockKeyhole size={18} color="#9CA0AA" />
                      </View>

                      <Input
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Enter verification code"
                        placeholderTextColor="#9CA0AA"
                        keyboardType="number-pad"
                        maxLength={6}
                        className={`h-14 rounded-2xl bg-white pl-12 text-[15px] text-[#1A1D26] ${
                          codeErrors.code
                            ? "border-brand-coral"
                            : "border-[#E5E7EB]"
                        }`}
                      />
                    </View>
                  </View>
                )}
              />

              {codeErrors.code ? (
                <RNText className="mt-1.5 text-xs text-brand-coral">
                  {codeErrors.code.message}
                </RNText>
              ) : null}

              {errors.fields.code ? (
                <RNText className="mt-1.5 text-xs text-brand-coral">
                  {errors.fields.code.message}
                </RNText>
              ) : null}

              {/* Verify */}

              <Button
                onPress={handleCodeSubmit(onVerifyPress)}
                disabled={isLoading}
                className="mt-6 h-14 rounded-2xl bg-brand-blue"
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

              {/* Actions */}

              <View className="mt-5 flex-row items-center justify-center gap-5">
                <Pressable
                  onPress={async () => {
                    try {
                      await signIn.mfa.sendEmailCode();
                    } catch (error: any) {
                      showErrorDialog(
                        "Resend Failed",
                        error?.message || "Unable to resend verification code.",
                      );
                    }
                  }}
                >
                  <RNText className="text-sm font-semibold text-brand-blue">
                    Resend code
                  </RNText>
                </Pressable>

                <View className="h-4 w-px bg-[#D1D5DB]" />

                <Pressable onPress={() => signIn.reset()}>
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
  // SIGN IN SCREEN
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
          automaticallyAdjustKeyboardInsets
          contentContainerClassName="flex-grow px-6 py-10"
          showsVerticalScrollIndicator={false}
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
                Welcome back
              </Text>

              <Text className="mt-2 text-[15px] leading-6 text-brand-text-muted">
                Sign in to manage your wealth and stay on top of your financial
                goals.
              </Text>
            </View>

            {/* -------------------------------- */}
            {/* FORM */}
            {/* -------------------------------- */}

            <View>
              {/* Email */}

              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View className="relative">
                    <View className="absolute left-4 top-[42px] z-10">
                      <Mail size={18} color="#9CA0AA" />
                    </View>

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
                        errors.fields.identifier?.message
                      }
                    />
                  </View>
                )}
              />

              {/* Password */}

              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View className="relative">
                    <View className="absolute left-4 top-[42px] z-10">
                      <LockKeyhole size={18} color="#9CA0AA" />
                    </View>

                    <FormField
                      label="Password"
                      placeholder="Enter your password"
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
                  </View>
                )}
              />

              {/* Forgot password */}

              <View className="mb-6 items-end">
                {/* <Link href="/forgot-password"> */}
                <RNText className="text-sm font-semibold text-brand-blue">
                  Forgot password?
                </RNText>
                {/* </Link> */}
              </View>

              {/* -------------------------------- */}
              {/* SIGN IN BUTTON */}
              {/* -------------------------------- */}

              <Button
                onPress={handleSubmit(onSignInPress)}
                disabled={isLoading}
                className="h-14 rounded-2xl bg-brand-blue"
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-base font-semibold text-white">
                      Sign in
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
            {/* SIGN UP */}
            {/* -------------------------------- */}

            <View className="mt-8 flex-row justify-center">
              <RNText className="text-sm text-brand-text-muted">
                Don't have an account?{" "}
              </RNText>

              <Link href="/sign-up">
                <RNText className="text-sm font-bold text-brand-blue">
                  Create account
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
