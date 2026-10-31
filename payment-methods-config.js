/* TEMPOYA payment-method catalogue.
 * These are country-relevant methods to request from a licensed payment provider.
 * They are NOT proof of merchant activation or current gateway support.
 * Checkout must show only methods enabled for the merchant, country and currency.
 */
window.TEMPOYA_PAYMENT_METHODS = {
  IN:{title:"India payment options",groups:[
    {name:"UPI apps",items:["PhonePe","Google Pay","Paytm","Other UPI apps"]},
    {name:"Cards",items:["Credit card","Debit card"]},
    {name:"Banking",items:["Netbanking","Bank transfer (where supported)"]}
  ]},
  US:{title:"United States payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Apple Pay / Google Pay (provider-enabled)"]},{name:"Banking",items:["ACH bank transfer (provider-enabled)"]}]},
  CA:{title:"Canada payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Apple Pay / Google Pay (provider-enabled)"]},{name:"Banking",items:["Interac / bank transfer (provider-enabled)"]}]},
  GB:{title:"United Kingdom payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Apple Pay / Google Pay (provider-enabled)"]},{name:"Banking",items:["Bank transfer / Open Banking (provider-enabled)"]}]},
  AU:{title:"Australia payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Apple Pay / Google Pay (provider-enabled)"]},{name:"Banking",items:["Bank transfer / PayID (provider-enabled)"]}]},
  NZ:{title:"New Zealand payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Apple Pay / Google Pay (provider-enabled)"]},{name:"Banking",items:["Bank transfer (provider-enabled)"]}]},
  SG:{title:"Singapore payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Apple Pay / Google Pay (provider-enabled)","GrabPay (provider-enabled)"]},{name:"Banking",items:["PayNow / bank transfer (provider-enabled)"]}]},
  AE:{title:"UAE payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Apple Pay / Google Pay (provider-enabled)"]},{name:"Banking",items:["Bank transfer (provider-enabled)"]}]},
  SA:{title:"Saudi Arabia payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","mada (provider-enabled)","STC Pay / Apple Pay (provider-enabled)"]},{name:"Banking",items:["Bank transfer (provider-enabled)"]}]},
  QA:{title:"Qatar payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Apple Pay (provider-enabled)"]},{name:"Banking",items:["Bank transfer (provider-enabled)"]}]},
  DE:{title:"Germany payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Apple Pay / Google Pay (provider-enabled)"]},{name:"Banking",items:["SEPA bank transfer / local online banking (provider-enabled)"]}]},
  FR:{title:"France payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card / Cartes Bancaires","Apple Pay (provider-enabled)"]},{name:"Banking",items:["SEPA bank transfer (provider-enabled)"]}]},
  IT:{title:"Italy payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Apple Pay / Google Pay (provider-enabled)"]},{name:"Banking",items:["Bancomat Pay / bank transfer (provider-enabled)"]}]},
  ES:{title:"Spain payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Apple Pay / Google Pay (provider-enabled)"]},{name:"Banking",items:["Bizum / SEPA transfer (provider-enabled)"]}]},
  NL:{title:"Netherlands payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Apple Pay / Google Pay (provider-enabled)"]},{name:"Banking",items:["iDEAL / SEPA bank transfer (provider-enabled)"]}]},
  IE:{title:"Ireland payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Apple Pay / Google Pay (provider-enabled)"]},{name:"Banking",items:["SEPA bank transfer (provider-enabled)"]}]},
  JP:{title:"Japan payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","PayPay / local wallet (provider-enabled)"]},{name:"Other",items:["Convenience-store / Pay-easy payment (provider-enabled)","Bank transfer (provider-enabled)"]}]},
  KR:{title:"South Korea payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Kakao Pay / Naver Pay / Samsung Pay (provider-enabled)"]},{name:"Banking",items:["Bank transfer (provider-enabled)"]}]},
  MY:{title:"Malaysia payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","Touch 'n Go eWallet / GrabPay (provider-enabled)"]},{name:"Banking",items:["FPX / DuitNow (provider-enabled)"]}]},
  TH:{title:"Thailand payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","TrueMoney (provider-enabled)"]},{name:"Banking",items:["PromptPay / bank transfer (provider-enabled)"]}]},
  ID:{title:"Indonesia payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","GoPay / OVO / DANA (provider-enabled)"]},{name:"Banking",items:["QRIS / virtual-account bank transfer (provider-enabled)"]}]},
  PH:{title:"Philippines payment options",groups:[{name:"Cards & wallets",items:["Credit card","Debit card","GCash / Maya (provider-enabled)"]},{name:"Banking",items:["QR Ph / bank transfer (provider-enabled)"]}]}
};
