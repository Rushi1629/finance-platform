import { useBudgetQuery } from "@/hooks/queries/useBudgetQuery";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { askAssistant } from "@/lib/services/assistant";
import { useUserStore } from "@/store/userStore";
import { ChatMessage } from "@/types/assistant";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUGGESTED_PROMPTS = [
  {
    icon: "coffee" as const,
    label: "Food spending",
    prompt: "How much did I spend on food this month?",
  },
  {
    icon: "trending-up" as const,
    label: "Biggest expense",
    prompt: "What's my biggest expense this week?",
  },
  {
    icon: "pie-chart" as const,
    label: "Budget check",
    prompt: "Am I over budget anywhere?",
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hi! Ask me anything about your spending or budgets from the last 30 days.",
  },
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <View
      className={`mb-4 max-w-[88%] flex-row items-end gap-2 ${
        isUser ? "self-end" : "self-start"
      }`}
    >
      {!isUser ? (
        <View className="mb-1 h-7 w-7 items-center justify-center rounded-full bg-brand-blue/15">
          <Feather name="zap" size={13} color="#70AFFF" />
        </View>
      ) : null}
      <View
        className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "rounded-br-md bg-brand-blue"
            : "rounded-bl-md border border-brand-surface-border bg-brand-surface"
        }`}
      >
        <Text className="text-sm leading-5 text-brand-text-primary">
          {message.content}
        </Text>
      </View>
    </View>
  );
}

export default function AssistantScreen() {
  const { user } = useUser();
  const currency = useUserStore((state) => state.currency);
  const { refetch: refetchTransactions } = useTransactionsQuery();
  const { refetch: refetchBudget } = useBudgetQuery();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const messageSequence = useRef(0);

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const sendMessage = async (text: string) => {
    const question = text.trim();
    if (!question || sending || !user) return;
    messageSequence.current += 1;
    const messageId = messageSequence.current;

    const userMessage: ChatMessage = {
      id: `${messageId}-user`,
      role: "user",
      content: question,
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSending(true);

    try {
      const [{ data: transactions = [] }, { data: budget = null }] =
        await Promise.all([refetchTransactions(), refetchBudget()]);
      const reply = await askAssistant(
        question,
        transactions,
        budget,
        currency,
      );
      setMessages((current) => [
        ...current,
        {
          id: `${messageId}-assistant`,
          role: "assistant",
          content: reply,
        },
      ]);
    } catch (cause) {
      console.error("Assistant error:", cause);
      setMessages((current) => [
        ...current,
        {
          id: `${messageId}-error`,
          role: "assistant",
          content: "Sorry, something went wrong answering that. Try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const renderMessage: ListRenderItem<ChatMessage> = ({ item }) => (
    <MessageBubble message={item} />
  );

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={["top"]}>
      <View className="px-5 pb-4 pt-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-[2px] text-brand-blue">
              YOUR MONEY, IN FOCUS
            </Text>
            <Text className="mt-1 text-2xl font-bold text-brand-text-primary">
              Assistant
            </Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-2xl border border-brand-surface-border bg-brand-surface">
            <Feather name="zap" size={19} color="#70AFFF" />
          </View>
        </View>

        <View className="mt-4 flex-row items-center rounded-2xl border border-brand-blue/20 bg-brand-blue/10 px-4 py-3">
          <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/15">
            <Feather name="shield" size={16} color="#70AFFF" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-xs font-semibold text-brand-text-primary">
              Your personal finance guide
            </Text>
            <Text className="mt-1 text-[11px] leading-4 text-brand-text-secondary">
              Ask about spending and budgets from your recent activity.
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? -70 : 0}
        className="flex-1"
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(message) => message.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 16,
          }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={
            sending ? (
              <View className="mb-4 self-start flex-row items-center gap-2 rounded-2xl rounded-bl-md border border-brand-surface-border bg-brand-surface px-4 py-3">
                <ActivityIndicator size="small" color="#70AFFF" />
                <Text className="text-xs text-brand-text-secondary">
                  Looking at your finances…
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center">
              <Feather name="message-circle" size={24} color="#5C5F68" />
              <Text className="mt-3 text-sm text-brand-text-secondary">
                Start a conversation
              </Text>
            </View>
          }
        />

        {messages.length <= 1 ? (
          <View className="px-5 pb-3">
            <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-brand-text-muted">
              TRY ASKING
            </Text>
            <View className="gap-2">
              {SUGGESTED_PROMPTS.map(({ icon, label, prompt }) => (
                <Pressable
                  key={prompt}
                  accessibilityRole="button"
                  disabled={sending}
                  onPress={() => void sendMessage(prompt)}
                  className="flex-row items-center rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-3 active:bg-[#202532]"
                >
                  <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/10">
                    <Feather name={icon} size={15} color="#70AFFF" />
                  </View>
                  <Text className="flex-1 text-xs font-medium text-brand-text-primary">
                    {label}
                  </Text>
                  <Feather name="arrow-up-left" size={15} color="#5C5F68" />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View
          className="flex-row items-end gap-2 border-t border-brand-surface-border bg-brand-bg px-4 pt-3"
          style={{ paddingBottom: 12 }}
        >
          <View className="min-h-12 flex-1 flex-row items-center rounded-2xl border border-brand-surface-border bg-brand-surface px-4">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your money..."
              placeholderTextColor="#747985"
              editable={!sending}
              className="max-h-28 min-h-12 flex-1 py-3 text-sm text-brand-text-primary"
              multiline
              onSubmitEditing={() => void sendMessage(input)}
              returnKeyType="send"
              blurOnSubmit
              accessibilityLabel="Ask the finance assistant"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={sending || !input.trim()}
            onPress={() => void sendMessage(input)}
            className="mb-0.5 h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue active:bg-[#1674DF]"
            style={{ opacity: sending || !input.trim() ? 0.5 : 1 }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="arrow-up" size={19} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
