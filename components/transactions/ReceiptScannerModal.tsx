import { AI_GRADIENT, COLORS } from "@/lib/theme";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientIconButton } from "./GradientIconButton";

export function ReceiptScannerModal({
  visible,
  onClose,
  onCaptured,
}: {
  visible: boolean;
  onClose: () => void;
  onCaptured: (base64: string, mimeType: string) => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState("");
  const permissionLoaded = permission !== null;
  const cameraGranted = permission?.granted ?? false;
  const canAskAgain = permission?.canAskAgain ?? false;

  useEffect(() => {
    if (visible && permissionLoaded && !cameraGranted && canAskAgain) {
      void requestPermission().catch((cause: unknown) => {
        console.error("Camera permission request failed:", cause);
        setError("Camera permission couldn't be requested. Try again.");
      });
    }
  }, [
    visible,
    permissionLoaded,
    cameraGranted,
    canAskAgain,
    requestPermission,
  ]);

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;

    setError("");
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.65,
      });
      if (!photo?.base64) {
        setError("The photo couldn't be read. Please try again.");
        return;
      }
      onCaptured(photo.base64, "image/jpeg");
    } catch (cause) {
      console.error("Camera capture failed:", cause);
      setError("Couldn't capture the receipt. Please try again.");
    } finally {
      setCapturing(false);
    }
  };

  const handlePickFromLibrary = async () => {
    if (capturing) return;

    setError("");
    setCapturing(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        base64: true,
      });
      if (result.canceled) return;

      const image = result.assets[0];
      if (!image?.base64) {
        setError("The selected image couldn't be read. Choose another image.");
        return;
      }
      onCaptured(image.base64, image.mimeType ?? "image/jpeg");
    } catch (cause) {
      console.error("Receipt image selection failed:", cause);
      setError("Couldn't open that image. Please try again.");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <View className="flex-1 bg-[#080A0F]">
        {visible && permission?.granted ? (
          <CameraView
            ref={cameraRef}
            facing="back"
            style={{ flex: 1 }}
          />
        ) : null}

        <SafeAreaView className="absolute inset-0" edges={["top", "bottom"]}>
          <View className="flex-row items-center justify-between px-5 pt-3">
            <Pressable
              accessibilityLabel="Close receipt scanner"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-black/45"
              onPress={onClose}
            >
              <Feather color="#FFFFFF" name="x" size={19} />
            </Pressable>
            <View className="flex-row items-center gap-2 rounded-full bg-black/45 px-3 py-2">
              <Feather color={COLORS.teal} name="zap" size={13} />
              <Text className="text-xs font-medium text-white">
                Align the receipt
              </Text>
            </View>
            <View className="h-10 w-10" />
          </View>

          {permission?.granted ? (
            <>
              <View className="flex-1 items-center justify-center px-10">
                <View
                  className="aspect-[3/4] w-full rounded-2xl border-2 border-white/70"
                  style={{ borderStyle: "dashed" }}
                />
              </View>
              {error ? (
                <Text className="px-8 pb-3 text-center text-sm text-white">
                  {error}
                </Text>
              ) : null}
              <View className="flex-row items-center justify-between px-10 pb-6">
                <Pressable
                  accessibilityLabel="Choose receipt from photos"
                  accessibilityRole="button"
                  className="h-12 w-12 items-center justify-center rounded-full bg-black/45"
                  disabled={capturing}
                  onPress={() => void handlePickFromLibrary()}
                >
                  <Feather color="#FFFFFF" name="image" size={19} />
                </Pressable>
                <GradientIconButton
                  borderColor="rgba(255,255,255,0.85)"
                  colors={[AI_GRADIENT[1], AI_GRADIENT[0]]}
                  disabled={capturing}
                  icon="camera"
                  iconSize={26}
                  loading={capturing}
                  onPress={() => void handleCapture()}
                  size={72}
                />
                <View className="h-12 w-12" />
              </View>
            </>
          ) : (
            <View className="flex-1 items-center justify-center px-9">
              <Feather
                color={permission?.canAskAgain === false ? "#8A8D96" : COLORS.blue}
                name="camera-off"
                size={34}
              />
              <Text className="mt-4 text-center text-base font-semibold text-white">
                Camera access needed
              </Text>
              <Text className="mt-2 text-center text-sm leading-5 text-white/65">
                Allow camera access to scan a receipt, or choose a photo from
                your library.
              </Text>
              {error ? (
                <Text className="mt-3 text-center text-sm text-[#FF947A]">
                  {error}
                </Text>
              ) : null}
              <View className="mt-6 flex-row items-center gap-3">
                {permission?.canAskAgain ? (
                  <Pressable
                    className="rounded-xl bg-[#1A85FF] px-5 py-3"
                    onPress={() => {
                      setError("");
                      void requestPermission().catch((cause: unknown) => {
                        console.error("Camera permission request failed:", cause);
                        setError("Camera permission couldn't be requested.");
                      });
                    }}
                  >
                    <Text className="font-semibold text-white">Allow camera</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  className="rounded-xl bg-white/10 px-5 py-3"
                  disabled={capturing}
                  onPress={() => void handlePickFromLibrary()}
                >
                  {capturing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="font-semibold text-white">Choose photo</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}
