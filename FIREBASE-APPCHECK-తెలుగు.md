# TEMPOYA — Firebase App Check సెటప్ (తెలుగులో)

ఈ మార్పులు `fix/firebase-app-check-setup` అనే ప్రత్యేక శాఖలో సిద్ధం చేయబడ్డాయి. ఇవి `main` శాఖలో ఇంకా కలపబడలేదు.

## 1. Firebaseలో వెబ్ యాప్‌ను నమోదు చేయండి
1. Firebase Consoleలో `tempoya` ప్రాజెక్ట్ తెరవండి.
2. ఎడమవైపు **Build → App Check** తెరవండి.
3. **Get started / Register** ఎంచుకుని మీ TEMPOYA Web app‌ను ఎంచుకోండి.
4. **reCAPTCHA Enterprise** provider ఎంచుకోండి.
5. `tempoya.app` మరియు మీ వెబ్‌సైట్ వాడే ఇతర అధికారిక hostnames (ఉదా. `www.tempoya.app`) అనుమతించండి.
6. కనిపించే **site key** మాత్రమే కాపీ చేయండి. Secret key లేదా service-account JSON‌ను వెబ్‌సైట్‌లో పెట్టవద్దు.

## 2. సైట్ కీని కోడ్‌లో నమోదు చేయండి
GitHubలో `app-check-config.js` ఫైల్ తెరిచి, `REPLACE_WITH_FIREBASE_APP_CHECK_RECAPTCHA_ENTERPRISE_SITE_KEY` అనే placeholder స్థానంలో Firebase ఇచ్చిన public site key పెట్టండి.

**Razorpay secret, Firebase service-account private key లేదా ఇతర రహస్యాలను ఈ ఫైల్‌లో పెట్టకండి.**

## 3. App Check‌ను వెంటనే Enforcement చేయకండి
ముందుగా వెబ్‌సైట్‌లో App Check token వస్తోందో, callable Firebase Functions సరిగ్గా పనిచేస్తున్నాయో పరీక్షించండి. ధృవీకరించిన తర్వాత మాత్రమే Firebase Consoleలో సంబంధిత Functions‌కు Enforcement ప్రారంభించండి. Backend functions‌లో `enforceAppCheck: true` ఉన్నందున సరైన token లేకపోతే కాల్స్ విఫలమవుతాయి.

## 4. చెల్లింపుల ముందు అవసరమైన తనిఖీలు
- Firebase Functions తాజా కోడ్‌తో deploy అయి ఉండాలి.
- Razorpay API keys Firebase Secrets Manager‌లో సురక్షితంగా ఉండాలి; GitHubలో లేదా చాట్‌లో రహస్యాలను పంచుకోవద్దు.
- Razorpay Live account‌లో సంబంధిత దేశాల కరెన్సీలు, అంతర్జాతీయ చెల్లింపులు అనుమతించబడి ఉండాలి.
- చెల్లింపు తర్వాత సర్వర్ ధృవీకరణ విజయవంతమవుతోందని పరీక్షించాలి.
- చెల్లింపు వచ్చినంత మాత్రాన గుర్తింపు ధృవీకరణ పూర్తయినట్లుగా చూపకూడదు; అవసరమైతే మానవ సమీక్ష వేరు.

ఈ మార్పులు App Check‌ను ప్రారంభించేందుకు అవసరమైన కోడ్‌ను జోడిస్తాయి. ఇవి మాత్రమే Live payments, OTP, bookings, SOS లేదా మొత్తం యాప్‌ను పూర్తిగా పనిచేసేలా చేయవు.
