/* TEMPOYA global country/currency and tariff configuration.
 * Prices are configured nominal local-currency amounts, not FX conversions.
 * Verification fee is one-time. Do not accept real booking payments until payment, tax,
 * refund, provider and legal rules are validated for the selected country.
 */
window.TEMPOYA_COUNTRIES = [
  {countryCode:"IN",country:"India",currencyCode:"INR",currencySymbol:"₹",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"US",country:"United States",currencyCode:"USD",currencySymbol:"$",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"CA",country:"Canada",currencyCode:"CAD",currencySymbol:"CA$",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"GB",country:"United Kingdom",currencyCode:"GBP",currencySymbol:"£",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"AU",country:"Australia",currencyCode:"AUD",currencySymbol:"A$",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"NZ",country:"New Zealand",currencyCode:"NZD",currencySymbol:"NZ$",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"SG",country:"Singapore",currencyCode:"SGD",currencySymbol:"S$",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"AE",country:"United Arab Emirates",currencyCode:"AED",currencySymbol:"د.إ",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"SA",country:"Saudi Arabia",currencyCode:"SAR",currencySymbol:"ر.س",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"QA",country:"Qatar",currencyCode:"QAR",currencySymbol:"ر.ق",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"DE",country:"Germany",currencyCode:"EUR",currencySymbol:"€",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"FR",country:"France",currencyCode:"EUR",currencySymbol:"€",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"IT",country:"Italy",currencyCode:"EUR",currencySymbol:"€",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"ES",country:"Spain",currencyCode:"EUR",currencySymbol:"€",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"NL",country:"Netherlands",currencyCode:"EUR",currencySymbol:"€",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"IE",country:"Ireland",currencyCode:"EUR",currencySymbol:"€",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"JP",country:"Japan",currencyCode:"JPY",currencySymbol:"¥",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"KR",country:"South Korea",currencyCode:"KRW",currencySymbol:"₩",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"MY",country:"Malaysia",currencyCode:"MYR",currencySymbol:"RM",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"TH",country:"Thailand",currencyCode:"THB",currencySymbol:"฿",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"ID",country:"Indonesia",currencyCode:"IDR",currencySymbol:"Rp",verificationFeeAmount:1,verificationFeeFrequency:"one-time"},
  {countryCode:"PH",country:"Philippines",currencyCode:"PHP",currencySymbol:"₱",verificationFeeAmount:1,verificationFeeFrequency:"one-time"}
];
window.TEMPOYA_TARIFFS_INR = {
  Basic: [{duration:"15 min",amount:99},{duration:"30 min",amount:199},{duration:"1 hour",amount:299},{duration:"2 hours",amount:499},{duration:"3 hours",amount:699}],
  Standard: [{duration:"15 min",amount:299},{duration:"30 min",amount:499},{duration:"1 hour",amount:699},{duration:"2 hours",amount:999},{duration:"3 hours",amount:1299}],
  Premium: [{duration:"15 min",amount:599},{duration:"30 min",amount:999},{duration:"1 hour",amount:1299},{duration:"2 hours",amount:1799},{duration:"3 hours",amount:2299}]
};
window.TEMPOYA_TARIFFS_BY_COUNTRY = {
  "US": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "CA": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "GB": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "AU": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "NZ": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "SG": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "AE": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "SA": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "QA": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "DE": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "FR": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "IT": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "ES": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "NL": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "IE": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "JP": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "KR": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "MY": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "TH": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "ID": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  },
  "PH": {
    "Basic": [
      {
        "duration": "15 min",
        "amount": 3
      },
      {
        "duration": "30 min",
        "amount": 5
      },
      {
        "duration": "1 hour",
        "amount": 7
      },
      {
        "duration": "2 hours",
        "amount": 9
      },
      {
        "duration": "3 hours",
        "amount": 11
      }
    ],
    "Standard": [
      {
        "duration": "15 min",
        "amount": 6
      },
      {
        "duration": "30 min",
        "amount": 8
      },
      {
        "duration": "1 hour",
        "amount": 10
      },
      {
        "duration": "2 hours",
        "amount": 12
      },
      {
        "duration": "3 hours",
        "amount": 14
      }
    ],
    "Premium": [
      {
        "duration": "15 min",
        "amount": 9
      },
      {
        "duration": "30 min",
        "amount": 10
      },
      {
        "duration": "1 hour",
        "amount": 12
      },
      {
        "duration": "2 hours",
        "amount": 14
      },
      {
        "duration": "3 hours",
        "amount": 16
      }
    ]
  }
};
// Backwards-compatible alias for any existing India-only consumer.
window.TEMPOYA_TARIFFS = window.TEMPOYA_TARIFFS_INR;
