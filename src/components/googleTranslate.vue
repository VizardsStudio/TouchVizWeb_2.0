<template>
    <div class="language-wrapper">
        <button class="language-btn" @click="toggleDropdown">
            {{ currentLanguage }}
        </button>
        <ul v-if="showDropdown" class="language-dropdown">
            <li v-for="lang in languages" :key="lang" @click="setLanguage(lang)">
                {{ lang.toUpperCase() }}
            </li>
        </ul>
    </div>
</template>

<script>
import { ref } from "vue";
import { useI18n } from "vue-i18n";

export default {
    setup() {
        // Set the HTML lang attribute
        document.documentElement.lang = "ar";
        const { locale } = useI18n();
        const showDropdown = ref(false);

        const languages = ["en", "ar", "ku", "tr"];

        // Set Arabic as default
        locale.value = "ar";
        const currentLanguage = ref(locale.value);

        const toggleDropdown = () => {
            showDropdown.value = !showDropdown.value;
        };

        const setLanguage = (lang) => {
            locale.value = lang;
            currentLanguage.value = lang;
            showDropdown.value = false;
            // Set the HTML lang attribute
            document.documentElement.lang = lang;
        };

        return { languages, currentLanguage, showDropdown, toggleDropdown, setLanguage };
    }
    ,
};
</script>

<style scoped>
.language-wrapper {
    position: fixed;
    bottom: 170px;
    z-index: 1000;
    font-family: sans-serif;
    opacity: 95%;
    position: fixed;
    right: 20px;
}

.language-btn {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    background: var(--theme-color);
    color: white;
    font-weight: bold;
    font-size: 1.2rem;
    cursor: pointer;
    transition: transform 0.2s;
    width: 56px;
    height: 56px;
    text-transform: uppercase;
}

.language-btn:hover {
    transform: scale(1.1);
}

.language-dropdown {
    margin: 0;
    padding: 0;
    list-style: none;
    position: absolute;
    bottom: 70px;
    right: 0;
    background: var(--theme-color);
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    min-width: 60px;
}

.language-dropdown li {
    padding: 8px 12px;
    text-align: center;
    cursor: pointer;
    transition: background 0.2s;
}

.language-dropdown li:hover {
    background: #f0f0f0;
    color: var(--theme-color);
}
</style>
