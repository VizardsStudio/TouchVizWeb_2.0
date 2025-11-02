<template>
    <div class="LvlSelector">
        <button @click="$emit('first-action'); selectSecondLevel()" class="btn" :disabled="level === 2">▲</button>
        <span>Level {{ level }}</span>
        <button @click="$emit('second-action'); selectFirstLevel()" class="btn" :disabled="level === 1">▼</button>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const level = ref(1)

defineEmits(['first-action', 'second-action'])


function selectFirstLevel() {
    if (level.value !== 1) {
        level.value = 1
    }
}

function selectSecondLevel() {
    if (level.value !== 2) {
        level.value = 2
    }
}
</script>

<style scoped>
.LvlSelector {
    position: relative;
    margin-bottom: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 0.2rem;
    border-radius: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
}

.btn {
    padding: 0.5rem 1rem;
    margin: 0.2rem;
    border: none;
    border-radius: 6px;
    background: #3e8764;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
}

.btn:hover :not(:disabled) {
    background: #444;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.flex {
    display: flex;
    gap: 0.5rem;
}
</style>
