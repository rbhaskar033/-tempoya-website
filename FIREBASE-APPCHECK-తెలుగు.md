# TEMPOYA — Firebase App Check సెటప్ మార్గదర్శిని

## ప్రస్తుత స్థితి
- App Check ప్రారంభించే కోడ్ `main` శాఖలో ఉంది.
- `app-check-config.js` ఫైల్‌లో ఒక public site key ఉంది. అయితే అది Firebase Consoleలో TEMPOYA వెబ్ యాప్‌కు కేటాయించిన సరైన App Check key అని ఇంకా నిర్ధారించలేదు.
- Razorpay చెల్లింపు Functions కోడ్ రిపాజిటరీలో ఉంది. అవి Firebaseలో విజయవంతంగా deploy అయ్యాయని ఇంకా నిర్ధారణ లేదు.
- ఈ మార్పులు మాత్రమే OTP, నిజమైన చెల్లింపులు, బుకింగ్‌లు లేదా SOS పూర్తిగా పనిచేస్తున్నాయని అర్థం కాదు.

## 1. Firebase App Check తనిఖీ
1. Firebase Consoleలో `tempoya` ప్రాజెక్ట్ తెరవండి.
2. Build → App Check విభాగానికి వెళ్లండి.
3. TEMPOYA Web app కోసం నమోదు చేసిన provider, site key, అనుమతించిన డొమైన్‌లను తనిఖీ చేయండి.
4. Firebase Consoleలో చూపిన public site key, రిపాజిటరీలోని `app-check-config.js` కీతో సరిపోతుందో చూడండి.
5. పరీక్ష విజయవంతమయ్యే వరకు Enforcement సెట్టింగ్‌ను మార్చవద్దు.

## 2. చెల్లింపు Functions కోసం అవసరాలు
GitHub రిపాజిటరీలోని ఈ workflow, `FIREBASE_SERVICE_ACCOUNT` అనే GitHub Actions secret ద్వారా Firebase Functions deploy చేయడానికి ప్రయత్నిస్తుంది:
`.github/workflows/deploy-firebase-functions.yml`

Firebase Functions Secrets Managerలో అవసరమైన Razorpay రహస్యాలు సురక్షితంగా అమర్చాలి:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

ఈ రహస్యాలను GitHub కోడ్‌లో, వెబ్‌సైట్ ఫైళ్లలో లేదా చాట్‌లో పెట్టవద్దు. ఇక్కడ రహస్య విలువలను పంపాల్సిన అవసరం లేదు.

## 3. తదుపరి పరీక్షల క్రమం
1. GitHub Actionsలో Firebase Payment Functions deployment ఫలితాన్ని తెరిచి చూడండి.
2. Deployment విజయవంతమైతే Firebase Console → Functionsలో రెండు Razorpay Functions ఉన్నాయో నిర్ధారించండి.
3. Firebase Consoleలో App Check key సరైనదని ధృవీకరించండి.
4. Razorpay Test Modeలో ఆర్డర్ సృష్టి, చెల్లింపు ధృవీకరణ, తప్పు సంతకం, రద్దైన చెల్లింపు వంటి సందర్భాలను పరీక్షించండి.
5. అన్ని పరీక్షలు విజయవంతమైన తర్వాత మాత్రమే Live Mode గురించి ఆలోచించండి.

## భద్రతా గమనిక
చెల్లింపు విజయవంతమైందని మాత్రమే వినియోగదారు గుర్తింపు పూర్తిగా ధృవీకరించబడినట్లు చూపకూడదు. చెల్లింపు ధృవీకరణ, గుర్తింపు సమీక్ష వేర్వేరు దశలు. దేశాల వారీగా కరెన్సీలు, అంతర్జాతీయ చెల్లింపుల అనుమతులు Razorpay ఖాతాలో విడిగా నిర్ధారించాలి.
