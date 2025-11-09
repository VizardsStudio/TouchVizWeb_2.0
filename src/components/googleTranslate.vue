<template>
    <div class="translate-widget">
        <div id="google_translate_element"></div>
    </div>
</template>

<script>
export default {
    name: "GoogleTranslateToggle",
    mounted() {
        // Only load the script once
        if (!document.getElementById("google-translate-script")) {
            const script = document.createElement("script");
            script.id = "google-translate-script";
            script.src =
                "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
            script.async = true;
            document.body.appendChild(script);
        }

        // Define the global callback
        window.googleTranslateElementInit = () => {
            if (!window.google || !window.google.translate) return;
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: "en",
                    includedLanguages: "en,ar",
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                },
                "google_translate_element"
            );
        };
    },
};
</script>

<style scoped>
.translate-widget {
    position: absolute;
    top: 10px;
    right: 10px;
}

#google_translate_element select {
    border-radius: 5px;
    padding: 5px;
    border: 1px solid #ccc;
    font-size: 14px;
}
</style>
