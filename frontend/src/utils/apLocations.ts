export interface LocationData {
  states: string[];
  districts: Record<string, string[]>;
  mandals: Record<string, string[]>;
  villages: Record<string, string[]>;
}

export const AP_LOCATIONS: LocationData = {
  states: ['Andhra Pradesh', 'Telangana', 'Odisha', 'Other'],
  districts: {
    'Andhra Pradesh': [
      'Srikakulam',
      'Vizianagaram',
      'Visakhapatnam',
      'Anakapalli',
      'Parvathipuram Manyam',
      'Alluri Sitharama Raju',
      'Kakinada',
      'East Godavari',
      'Dr. B.R. Ambedkar Konaseema',
      'West Godavari',
      'Eluru',
      'Krishna',
      'NTR',
      'Guntur',
      'Bapatla',
      'Palnadu',
      'Prakasam',
      'SPS Nellore',
      'Kurnool',
      'Nandyal',
      'Ananthapuramu',
      'Sri Sathya Sai',
      'YSR Kadapa',
      'Annamayya',
      'Chittoor',
      'Tirupati'
    ],
    'Telangana': [
      'Hyderabad',
      'Rangareddy',
      'Medchal-Malkajgiri',
      'Warangal',
      'Khammam',
      'Nizamabad',
      'Karimnagar',
      'Nalgonda',
      'Mahabubnagar'
    ],
    'Odisha': [
      'Ganjam',
      'Gajapati',
      'Rayagada',
      'Koraput',
      'Khordha (Bhubaneswar)'
    ],
    'Other': ['Other District']
  },
  mandals: {
    'Srikakulam': [
      'Narasannapeta',
      'Polaki',
      'Jalumuru',
      'Kotabommali',
      'Sarubujjili',
      'Srikakulam (Rural & Urban)',
      'Amadalavalasa',
      'Tekkali',
      'Gara',
      'Ranasthalam',
      'Etcherla',
      'Laveru',
      'Ponduru',
      'Burja',
      'Santhabommali',
      'Sompeta',
      'Palasa',
      'Mandasa',
      'Itchapuram',
      'Kanchili',
      'Kaviti',
      'Kalingapatnam',
      'Pathapatnam',
      'Meliaputti',
      'Hiramandalam',
      'Kotturu',
      'Bhamini',
      'Seethampeta',
      'Regidi Amadalavalasa',
      'Vangara',
      'Rajam',
      'G.Sigadam',
      'Other Mandal'
    ],
    'Vizianagaram': [
      'Vizianagaram',
      'Bhogapuram',
      'Cheepurupalli',
      'Denkada',
      'Gajapathinagaram',
      'Garividi',
      'Gurla',
      'Kothavalasa',
      'Nellimarla',
      'Pusapatirega',
      'Srungavarapukota',
      'Vepada',
      'Other Mandal'
    ],
    'Visakhapatnam': [
      'Visakhapatnam Urban',
      'Visakhapatnam Rural',
      'Bheemunipatnam',
      'Gajuwaka',
      'Pendurthi',
      'Anandapuram',
      'Padmanabham',
      'Other Mandal'
    ]
  },
  villages: {
    'Narasannapeta': [
      'Narasannapeta Main (Ward 1)',
      'Raja Veedhi / Market (Ward 2)',
      'RTC Complex Area (Ward 3)',
      'Shanti Nagar (Ward 4)',
      'Madapam',
      'Makivalasa',
      'Komarthi',
      'Satyavaram',
      'Karavanja',
      'Urlam',
      'Jamachakram',
      'Borubhadra',
      'Gopalapenta',
      'Kambakaya',
      'Mabagam',
      'Nadagam',
      'Potnuru',
      'Thamminaidupeta',
      'Yaragam',
      'Gorripadu',
      'Tilaru',
      'Other Village/Sachivalayam'
    ],
    'Polaki': [
      'Polaki',
      'Priyagraharam',
      'Susaram',
      'Dola',
      'Gujjuvada',
      'Ampolu',
      'Mulasavalapuram',
      'Temburu',
      'Chintada',
      'Mabagam',
      'Other Village/Sachivalayam'
    ],
    'Jalumuru': [
      'Jalumuru',
      'Challavanipeta',
      'Makannapeta',
      'Timadam',
      'Ranastalam',
      'Karada',
      'Gothivada',
      'Gudivada',
      'Other Village/Sachivalayam'
    ],
    'Kotabommali': [
      'Kotabommali',
      'Komanapalli',
      'Pakivalasa',
      'Nimzada',
      'Thilavada',
      'Borubhadra',
      'Other Village/Sachivalayam'
    ],
    'Sarubujjili': [
      'Sarubujjili',
      'Purushottapuram',
      'Kusalapuram',
      'Shalantri',
      'Rettada',
      'Other Village/Sachivalayam'
    ],
    'Srikakulam (Rural & Urban)': [
      'Srikakulam City',
      'Arasavalli',
      'Balaga',
      'Gujarathipeta',
      'Peddapadu',
      'Killi Veedhi',
      'Fazulbegpeta',
      'Chapuram',
      'Patrunivalasa',
      'Other Village/Sachivalayam'
    ],
    'Amadalavalasa': [
      'Amadalavalasa Town',
      'Alikam',
      'Gudivada',
      'Thogaram',
      'Kothavalasa',
      'Other Village/Sachivalayam'
    ],
    'Tekkali': [
      'Tekkali Town',
      'Raghunadhapuram',
      'Akkayyavalasa',
      'Temburu',
      'Other Village/Sachivalayam'
    ]
  }
};
