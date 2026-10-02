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
  textAlign?: "left" | "center" | "right";
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
  textAlign = "left",
}: FormFieldProps) {
  return (
    <View className="mb-5 w-full">
      <Label className="mb-2 text-[13px] font-semibold text-[#1A1D26]">
        {label}
      </Label>

      <View className="relative w-full">
        {icon ? (
          <View
            pointerEvents="none"
            className="absolute left-4 top-[19px] z-10"
          >
            {icon}
          </View>
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
          textAlign={textAlign}
          textAlignVertical="center"
          style={{ height: 56, width: "100%", includeFontPadding: false }}
          className={`h-12 sm:h-12 w-full min-w-0 rounded-2xl bg-white dark:bg-white text-[15px] text-[#1A1D26] ${
            icon ? "pl-12" : "px-4"
          } ${rightIcon ? "pr-12" : ""} ${
            error ? "border-brand-coral" : "border-[#E5E7EB]"
          }`}
        />

        {rightIcon ? (
          <View className="absolute right-4 top-[19px] z-10">{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text className="mt-1.5 text-xs text-brand-coral">{error}</Text>
      ) : null}
    </View>
  );
}
