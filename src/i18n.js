// i18n.js
import { createI18n } from "vue-i18n";

const messages = {
    en: {

        //welcome message
        welcomeMessage: "Welcome dear {name}, would you like to see your apartment?",
        Yes: "Yes",
        No: "No",
        //home page
        Home: "Home",
        Filtering: "Filtering",
        Details: "Details",
        Surroundings: "Surroundings",
        Day: "Day",
        Night: "Night",
        ExitTour: "Exit Tour",
        Exit3dPlan: "Exit 3D Plan",

        //chatbot
        Send: "Send",
        TypeYourMessage: "Type your message...",
        AIAssistant: "AI Assistant",

        // Added keys
        exitTour: "Exit Tour",
        exit3dPlan: "Exit 3D Plan",
        welcomeUser: "Welcome dear {name}, would you like to see your apartment?",
        noUnitsSelected: "No units selected",
        duplex: "Duplex",

        //unit details page
        Area: "Area",
        Floor: "Floor",
        Typology: "Typology",
        View: "View",
        Status: "Status",
        Bedrooms: "Bedrooms",
        Plans3D: "3D Plans",
        InteriorTour: "Interior Tour",
        Reset: "Reset",

        //pdf viewer
        NoMobilePDF: "PDF preview is not available on mobile.",
        DownloadPDF: "Open / Download PDF",
    },

    ar: {

        //welcome message
        welcomeMessage: "مرحبًا عزيزي {name}، هل ترغب في رؤية شقتك؟",
        Yes: "نعم",
        No: "لا",
        //home page
        Home: "الرئيسية",
        Filtering: "تصفية",
        Details: "تفاصيل",
        Surroundings: "المحيط",
        Day: "نهار",
        Night: "ليل",
        ExitTour: "الخروج من الجولة",
        Exit3dPlan: "خروج",

        //chatbot
        Send: "إرسال",
        TypeYourMessage: "اكتب رسالتك...",
        AIAssistant: "المساعد الذكي",

        //unit details page
        Area: "المساحة",
        Floor: "الطابق",
        Typology: "النوع",
        View: "الإطلالة",
        Status: "الحالة",
        Bedrooms: "غرف النوم",
        Plans3D: "مخططات ثلاثية الأبعاد",
        InteriorTour: "جولة داخلية",
        Reset: "إعادة ضبط",

        //pdf viewer
        NoMobilePDF: "معاينة ملف غير متوفرة على الجوال.",
        DownloadPDF: "فتح / تنزيل ملف PDF",

        // Added keys
        exitTour: "الخروج من الجولة",
        exit3dPlan: "الخروج من مخطط ثلاثي الأبعاد",
        welcomeUser: "مرحبًا عزيزي {name}، هل ترغب في رؤية شقتك؟",
        noUnitsSelected: "لا توجد وحدات محددة",
        duplex: "دوبلكس"
    },

    ku: {
        //welcome message
        welcomeMessage: "بەخێربێیت {name}، دەتەوێت ماڵەکەت ببینیت؟",
        Yes: "بەڵێ",
        No: "نەخێر",
        //home page
        Home: "سەرەکی",
        Filtering: "فلتەرکردن",
        Details: "وردەکاریەکان",
        Surroundings: "دەوروبەر",
        Day: "ڕۆژ",
        Night: "شەو",
        ExitTour: "دەرچوون لە گەڕان",
        Exit3dPlan: "دەرچوون لە پلانی سێ دووری",

        //chatbot
        Send: "ناردن",
        TypeYourMessage: "پەیامەکەت بنووسە...",
        AIAssistant: "یارمەتیدەری زیرەک",

        //unit details page
        Area: "ڕووبەر",
        Floor: "نهۆم",
        Typology: "جۆر",
        View: "ڤیو",
        Status: "باری بەردەست بوون",
        Bedrooms: "ژووری نووستن",
        Plans3D: "پلانی سێ دووری",
        InteriorTour: "سەردانی ناوەوە",
        Reset: "دووبارە دانان",

        //pdf viewer
        NoMobilePDF: "پێشاندان لەسەر مۆبایل بەردەست نیە.",
        DownloadPDF: "داگرتن",

        // Added keys
        welcomeUser: "بەخێربێیت {name}، دەتەوێت ماڵەکەت ببینیت؟",
        noUnitsSelected: "هیچ یەکەیەک هەڵنەبژێردراوە",
        duplex: "دوپلکس"
    },


    tr: {
        //welcome message
        welcomeMessage: "Hoş geldin {name}, dairenizi görmek ister misiniz?",
        Yes: "Evet",
        No: "Hayır",
        //home page
        Home: "Anasayfa",
        Filtering: "Filtreleme",
        Details: "Detaylar",
        Surroundings: "Çevre",
        Day: "Gündüz",
        Night: "Gece",
        ExitTour: "Turu Kapat",
        Exit3dPlan: "3D Planı Kapat",

        //chatbot
        Send: "Gönder",
        TypeYourMessage: "Mesajınızı yazın...",
        AIAssistant: "Yapay Zeka Asistanı",

        //unit details page
        Area: "Alan",
        Floor: "Kat",
        Typology: "Tipoloji",
        View: "Manzara",
        Status: "Durum",
        Bedrooms: "Yatak Odaları",
        Plans3D: "3D Planlar",
        InteriorTour: "İç Tur",
        Reset: "Sıfırla",

        //pdf viewer
        NoMobilePDF: "PDF önizlemesi mobilde kullanılamaz.",
        DownloadPDF: "PDF Aç / İndir",

        // Added keys
        welcomeUser: "Hoş geldin {name}, dairenizi görmek ister misiniz?",
        noUnitsSelected: "Seçili birim yok",
        duplex: "Dublex"
    },
};

export const i18n = createI18n({
    legacy: false,
    locale: "ar", // set Arabic as default
    fallbackLocale: "en",
    messages,
});
