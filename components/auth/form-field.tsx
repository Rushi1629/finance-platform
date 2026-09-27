import React from "react";
import { Text, View } from "react-native";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: "off" | "email" | "password";
  maxLength?: number;
}

export function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  icon,
  rightIcon,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  autoComplete = "off",
  maxLength,
}: FormFieldProps) {
  return (
    <View className="mb-5">
      <Label className="mb-2 text-[13px] font-semibold text-[#1A1D26]">
        {label}
      </Label>

      <View className="relative">
        {icon ? (
          <View className="absolute left-4 top-4 z-10">{icon}</View>
        ) : null}

        <Input
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor="#9CA0AA"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={`h-14 rounded-2xl bg-white text-[15px] text-[#1A1D26] ${
            icon ? "pl-12" : "px-4"
          } ${rightIcon ? "pr-12" : ""} ${
            error ? "border-brand-coral" : "border-[#E5E7EB]"
          }`}
        />

        {rightIcon ? (
          <View className="absolute right-4 top-4 z-10">{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text className="mt-1.5 text-xs text-brand-coral">{error}</Text>
      ) : null}
    </View>
  );
}
