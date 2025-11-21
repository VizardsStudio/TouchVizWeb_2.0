<template>
  <div v-if="visible" class="popup">
    <div class="popup-content">
      <p dir="auto">{{ message }}</p>
      <div class="popup-actions">
        <button class="popup-btn" @click="$emit('yes')">{{ $t("Yes") }}</button>
        <button class="popup-btn" @click="$emit('no')">{{ $t("No") }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  message: string
}>()

defineEmits<{
  (e: 'yes'): void
  (e: 'no'): void
}>()
</script>

<style scoped>
.popup {
  position: fixed;
  top: 80px;
  left: 1rem;
  z-index: 1000;
  max-width: 50%;
}

.popup-content {
  background: white;
  color: black;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  min-width: 180px;
}

.popup-actions {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

/* ✏️ Buttons kept basic so you can override */
.popup-actions button {
  cursor: pointer;
  background: none;
  border: 1px solid #ccc;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}
</style>
