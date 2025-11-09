<template>
    <div class="chat-bot-container">
        <!-- Collapsed Chat Icon -->
        <button v-if="!isOpen" @click="toggleChat" class="chat-toggle" aria-label="Open chat">
            ֎🇦🇮
        </button>

        <!-- Chat Window -->
        <transition name="fade">
            <div v-if="isOpen" class="chat-window" :class="windowClass">
                <!-- Header -->
                <div class="chat-header">
                    <h2>AI Assistant</h2>
                    <button class="close-btn" @click="toggleChat">✕</button>
                </div>

                <!-- Messages -->
                <div class="chat-messages" ref="messagesContainer">
                    <div v-for="(msg, index) in messages" :key="index"
                        :class="['message', msg.isUser ? 'user' : 'bot']">
                        {{ msg.text }}
                    </div>

                    <!-- Loading indicator -->
                    <div v-if="loading" class="message bot typing">
                        <span></span><span></span><span></span>
                    </div>
                </div>

                <!-- Input -->
                <div class="chat-input">
                    <input v-model="input" @keyup.enter="send" type="text" placeholder="Type your message..." />
                    <button @click="send">Send</button>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { sendMessage } from "../core/ai_api";

const isOpen = ref(false);
const input = ref("");
const messages = ref([
    { text: "Hello! I'm your personal AI assistant ready to answer your questions about Burj Nawas. How can I help you today?", isUser: false }
]);
const loading = ref(false);

const toggleChat = () => (isOpen.value = !isOpen.value);

// Detect portrait (mobile) vs landscape (desktop)
const isPortrait = ref(false);
const checkOrientation = () => {
    isPortrait.value = window.innerHeight > window.innerWidth;
};
onMounted(() => {
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
});
onUnmounted(() => window.removeEventListener("resize", checkOrientation));

// Dynamic window size
const windowClass = computed(() => isPortrait.value ? "portrait" : "desktop");

// Messages container ref
const messagesContainer = ref<HTMLDivElement | null>(null);

// Scroll to bottom function
function scrollToBottom() {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTo({
                top: messagesContainer.value.scrollHeight,
                behavior: "smooth"
            });
        }
    });
}

// Watch for new messages or loading changes to scroll
watch([messages, loading], () => {
    scrollToBottom();
}, { deep: true });

// Send message
async function send() {
    if (!input.value.trim()) return;

    // push user message
    messages.value.push({
        isUser: true,
        text: input.value.trim(),
    });

    loading.value = true;

    try {
        const res = await sendMessage(input.value);

        // handle flexible response shape safely
        const responseText =
            res?.output_text ??
            res?.safe_text ??
            res?.message ??
            JSON.stringify(res, null, 2);

        messages.value.push({
            isUser: false,
            text: responseText,
        });
    } catch (err: any) {
        messages.value.push({
            isUser: false,
            text: "⚠️ Error: " + (err.message || "Something went wrong."),
        });
    } finally {
        input.value = "";
        loading.value = false;
    }
}
</script>


<style scoped>
.chat-bot-container {
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    opacity: 95%;
}

/* ===== Animations ===== */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.25s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* ===== Collapsed Chat Button ===== */
.chat-toggle {
    position: fixed;
    bottom: 100px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background-color: var(--theme-color);
    color: white;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    transition: background-color 0.25s ease;
    z-index: 1000;
}

.chat-toggle:hover {
    background-color: var(--theme-color);
}

/* ===== Chat Window ===== */
.chat-window {
    position: fixed;
    bottom: 0;
    right: 0;
    background-color: #fff;
    border-radius: 16px 16px 0 0;
    display: flex;
    flex-direction: column;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    z-index: 1000;
}

/* Desktop layout */
.chat-window.desktop {
    width: 350px;
    height: 450px;
    right: 20px;
    bottom: 20px;
    border-radius: 16px;
}

/* Mobile layout */
.chat-window.portrait {
    width: 95%;
    height: 90%;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 20px;
}

/* ===== Header ===== */
.chat-header {
    background-color: var(--theme-color);
    color: white;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chat-header h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
}

/* ===== Messages ===== */
.chat-messages {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    background-color: #f9fafb;
}

.message {
    padding: 8px 12px;
    border-radius: 12px;
    margin-bottom: 8px;
    max-width: 80%;
    word-wrap: break-word;
}

.message.bot {
    background-color: #e5e7eb;
    align-self: flex-start;
    color: #111;
}

.message.user {
    background-color: var(--theme-color);
    color: white;
    align-self: flex-end;
    margin-left: auto;
}

/* ===== Input ===== */
.chat-input {
    display: flex;
    border-top: 1px solid #ddd;
    padding: 8px;
    background-color: white;
}

.chat-input input {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
    outline: none;
}

.chat-input input:focus {
    border-color: var(--theme-color);
}

.chat-input button {
    margin-left: 8px;
    padding: 8px 14px;
    background-color: var(--theme-color);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
}

.chat-input button:hover {
    background-color: var(--theme-color);
}

/* ===== Scrollbar ===== */
.chat-messages::-webkit-scrollbar {
    width: 6px;
}

.chat-messages::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 4px;
}

/* Typing indicator dots */
.message.typing {
    background-color: #e5e7eb;
    align-self: flex-start;
    display: flex;
    gap: 4px;
    width: 40px;
    justify-content: space-between;
    padding: 8px 12px;
}

.message.typing span {
    display: block;
    width: 6px;
    height: 6px;
    background-color: #888;
    border-radius: 50%;
    animation: blink 1.4s infinite both;
}

.message.typing span:nth-child(1) {
    animation-delay: 0s;
}

.message.typing span:nth-child(2) {
    animation-delay: 0.2s;
}

.message.typing span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes blink {

    0%,
    80%,
    100% {
        opacity: 0;
    }

    40% {
        opacity: 1;
    }
}
</style>
