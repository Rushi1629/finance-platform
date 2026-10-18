import type { ExtractedTransaction, RecorderStatus } from "@/types/transaction";
import { Feather } from "@expo/vector-icons";
import { File } from "expo-file-system";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { AI_GRADIENT, COLORS, RECORDING_GRADIENT } from "@/lib/theme";
import { extractTransactionFromVoice } from "@/lib/services/extractTransaction";
import { GradientIconButton } from "./GradientIconButton";

function PulseRing({ active, delay }: { active: boolean; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }

    progress.value = withRepeat(
      withSequence(
        withTiming(0, { duration: delay }),
        withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [active, delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.5,
    transform: [{ scale: 1 + progress.value * 0.9 }],
  }));

  return (
    <Animated.View
      className="absolute h-24 w-24 rounded-full border-2 border-[#0E9C79]"
      style={style}
    />
  );
}

function ProcessingRing() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View className="absolute h-24 w-24" style={style}>
      <LinearGradient
        colors={[AI_GRADIENT[1], AI_GRADIENT[0], "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, borderRadius: 48, padding: 3 }}
      >
        <View className="flex-1 rounded-full bg-[#161829]" />
      </LinearGradient>
    </Animated.View>
  );
}

export function VoiceRecorderModal({
  visible,
  onClose,
  onExtracted,
}: {
  visible: boolean;
  onClose: () => void;
  onExtracted: (result: ExtractedTransaction) => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const orbScale = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;

    let active = true;
    const requestPermission = async () => {
      try {
        const permission = await requestRecordingPermissionsAsync();
        if (!active) return;
        if (!permission.granted) {
          setStatus("error");
          setError("Microphone access is needed to record a transaction.");
          return;
        }
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
      } catch (cause) {
        console.error("Microphone permission request failed:", cause);
        if (active) {
          setStatus("error");
          setError("Couldn't prepare the microphone. Please try again.");
        }
      }
    };

    void requestPermission();
    return () => {
      active = false;
    };
  }, [visible]);

  useEffect(() => {
    if (status !== "recording") return;
    const interval = setInterval(() => setSeconds((elapsed) => elapsed + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    orbScale.value =
      status === "recording"
        ? withRepeat(
            withSequence(
              withTiming(1.08, {
                duration: 500,
                easing: Easing.inOut(Easing.ease),
              }),
              withTiming(1, {
                duration: 500,
                easing: Easing.inOut(Easing.ease),
              }),
            ),
            -1,
            false,
          )
        : withTiming(1, { duration: 200 });
  }, [orbScale, status]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  const startRecording = async () => {
    setError("");
    setSeconds(0);
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus("recording");
    } catch (cause) {
      console.error("Voice recording could not start:", cause);
      setStatus("error");
      setError("Couldn't start recording. Check microphone access and retry.");
    }
  };

  const stopRecording = async () => {
    setStatus("processing");
    setError("");

    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error("No recording was captured.");

      const audio = new File(uri);
      const result = await extractTransactionFromVoice(
        await audio.base64(),
        "audio/m4a",
      );
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });
      } catch (modeError) {
        console.error("Audio mode could not be restored:", modeError);
      }
      onExtracted(result);
      setStatus("idle");
      setSeconds(0);
      onClose();
    } catch (cause) {
      console.error("Voice transaction extraction failed:", cause);
      setStatus("error");
      setError(
        cause instanceof Error
          ? cause.message
          : "Couldn't understand that recording. Please try again.",
      );
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });
      } catch (modeError) {
        console.error("Audio mode could not be restored:", modeError);
      }
    }
  };

  const closeModal = async () => {
    if (status === "processing") return;
    if (status === "recording") {
      try {
        await recorder.stop();
      } catch (cause) {
        console.error("Voice recording could not be stopped:", cause);
      }
    }
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    } catch (cause) {
      console.error("Audio mode could not be restored:", cause);
    }
    setStatus("idle");
    setSeconds(0);
    setError("");
    onClose();
  };

  const retry = async () => {
    setError("");
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError("Microphone access is needed to record a transaction.");
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      setStatus("idle");
    } catch (cause) {
      console.error("Microphone permission request failed:", cause);
      setError("Couldn't prepare the microphone. Please try again.");
    }
  };

  const isRecording = status === "recording";
  const isProcessing = status === "processing";

  return (
    <Modal
      animationType="slide"
      onRequestClose={() => void closeModal()}
      transparent
      visible={visible}
    >
      <View className="flex-1 justify-end">
        <BlurView className="absolute inset-0" intensity={40} tint="dark" />
        <LinearGradient
          colors={["#1C1E2E", "#0F1020"]}
          style={{
            alignItems: "center",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: "hidden",
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 40,
          }}
        >
          <View className="mb-6 h-1 w-10 rounded-full bg-white/15" />
          {status === "error" ? (
            <>
              <Feather color={COLORS.coral} name="alert-circle" size={32} />
              <Text className="mb-6 mt-3 text-center text-sm leading-5 text-white/65">
                {error}
              </Text>
              <Pressable
                accessibilityRole="button"
                className="rounded-xl bg-white/10 px-6 py-3.5"
                onPress={() => void retry()}
              >
                <Text className="text-sm font-semibold text-white">Try again</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View className="mb-1 flex-row items-center gap-1.5">
                <Feather color={COLORS.teal} name="zap" size={13} />
                <Text
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: COLORS.teal }}
                >
                  AI voice entry
                </Text>
              </View>
              <Text className="mb-1 text-base font-semibold text-white">
                {isRecording
                  ? "Listening…"
                  : isProcessing
                    ? "Understanding that…"
                    : "Tell me about a transaction"}
              </Text>
              <Text className="mb-8 px-4 text-center text-xs text-white/50">
                {isRecording
                  ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
                  : isProcessing
                    ? "Transcribing and extracting the details"
                    : '"I spent 400 on groceries yesterday"'}
              </Text>

              <View className="mb-8 h-24 w-24 items-center justify-center">
                {status === "idle" ? (
                  <>
                    <PulseRing active delay={0} />
                    <PulseRing active delay={800} />
                  </>
                ) : null}
                {isRecording ? (
                  <>
                    <PulseRing active delay={0} />
                    <PulseRing active delay={500} />
                  </>
                ) : null}
                {isProcessing ? <ProcessingRing /> : null}
                <Animated.View style={orbStyle}>
                  <GradientIconButton
                    colors={
                      isRecording
                        ? RECORDING_GRADIENT
                        : [AI_GRADIENT[1], AI_GRADIENT[0]]
                    }
                    disabled={isProcessing}
                    icon={isRecording ? "square" : "mic"}
                    onPress={() =>
                      void (isRecording ? stopRecording() : startRecording())
                    }
                  />
                </Animated.View>
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={isProcessing}
                onPress={() => void closeModal()}
              >
                <Text className="text-sm text-white/45">Cancel</Text>
              </Pressable>
            </>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
}
