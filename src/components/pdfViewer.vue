<template>
  <div class="pdf-viewer">
    <!-- Desktop view -->
    <iframe
      v-if="!isMobile && pdfUrl"
      :src="pdfUrl"
      class="pdf-frame"
      frameborder="0"
    ></iframe>

    <!-- Mobile fallback -->
    <div v-else class="pdf-mobile">
      <p>PDF preview is not available on mobile.</p>
      <button v-if="pdfUrl" class="download-btn" @click="downloadPdf">
        Open / Download PDF
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  pdfUrl: string;       // URL to your PDF
}

const props = defineProps<Props>();

// Detect mobile devices
const isMobile = computed(() =>
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
);

// Simple download/open function
const downloadPdf = () => {
  if (!props.pdfUrl) return;

  const link = document.createElement('a');
  link.href = props.pdfUrl;
  link.target = '_blank'; // open in new tab
  link.download = props.pdfUrl.split('/').pop() || 'document.pdf';
  link.click();
};
</script>

<style scoped>
.pdf-viewer {
  display: flex;
  position: absolute;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px); /* blur the background behind */
  -webkit-backdrop-filter: blur(10px); /* Safari support */
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

/* Desktop iframe */
.pdf-frame {
  width: 100%;
  height: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* Mobile fallback */
.pdf-mobile {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 300px;
  padding: 20px;
  text-align: center;
  color: #ffffff;
}

.download-btn {
  margin-top: 10px;
  padding: 6px 12px;
  border: none;
  background-color: #1976d2;
  color: white;
  border-radius: 4px;
  cursor: pointer;

  cursor: pointer;
  font-size: 0.95rem;
  padding: 0.5rem 0.6rem;
  border-radius: 25px;
  transition: background 0.2s;
  user-select: none;
  background: var(--theme-color);
  color: #000;
}

.download-btn:hover {
  background-color: #125ea3;
}
</style>
