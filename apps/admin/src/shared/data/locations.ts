export interface Thana {
  name: string;
  unions: string[];
  postCode: string;
}

export interface District {
  name: string;
  thanas: Thana[];
}

export interface Division {
  name: string;
  districts: District[];
}

export const bangladeshLocations: Division[] = [
  {
    name: "Barishal",
    districts: [
      {
        name: "Barishal",
        thanas: [
          { name: "Barishal Sadar", unions: ["Banari Para", "Char Baria", "Chakla", "Padrela", "Scheinamuddy"], postCode: "8200" },
          { name: "Babuganj", unions: ["Babuganj", "Chak "], postCode: "8210" },
          { name: "Agailjhara", unions: ["Agailjhara", "Gailoa"], postCode: "8230" },
          { name: "Banaripara", unions: ["Banaripara", "Chandpur"], postCode: "8240" },
          { name: "Gaurnadi", unions: ["Gaurnadi", "Harta"], postCode: "8250" },
          { name: "Mehendiganj", unions: ["Mehendiganj", "Shyamganj"], postCode: "8270" },
          { name: "Muladi", unions: ["Muladi", "Kazirchar"], postCode: "8280" },
          { name: "Wazirpur", unions: ["Wazirpur", "Nalua"], postCode: "8290" },
        ],
      },
      {
        name: "Barguna",
        thanas: [
          { name: "Barguna Sadar", unions: ["Barguna", "Shaheber abad"], postCode: "9300" },
          { name: "Amtali", unions: ["Amtali", "Bibichini"], postCode: "9310" },
          { name: "Bamna", unions: ["Bamna", "Utith"], postCode: "9320" },
          { name: "Betagi", unions: ["Betagi", "Daratana"], postCode: "9330" },
          { name: "Patharghata", unions: ["Patharghata", "Kalmegha"], postCode: "9340" },
        ],
      },
    ],
  },
  {
    name: "Chattogram",
    districts: [
      {
        name: "Chattogram",
        thanas: [
          { name: "Chattogram Sadar", unions: ["Chattogram", "Halishahar"], postCode: "4000" },
          { name: "Anwara", unions: ["Anwara", "Battali"], postCode: "4370" },
          { name: "Banshkhali", unions: ["Banshkhali", "Chambal"], postCode: "4380" },
          { name: "Boalkhali", unions: ["Boalkhali", "Ilanagar"], postCode: "4360" },
          { name: "Chandanaish", unions: ["Chandanaish", "Satbaria"], postCode: "4350" },
          { name: "Fatikchhari", unions: ["Fatikchhari", "Nanupur"], postCode: "4350" },
          { name: "Hathazari", unions: ["Hathazari", "Fatehpur"], postCode: "4330" },
          { name: "Lohagara", unions: ["Lohagara", "Padua"], postCode: "4390" },
          { name: "Mirsharai", unions: ["Mirsharai", "Hazarihat"], postCode: "4320" },
          { name: "Patiya", unions: ["Patiya", "Dholmara"], postCode: "4340" },
          { name: "Rangunia", unions: ["Rangunia", "Urrir char"], postCode: "4360" },
          { name: "Sandwip", unions: ["Sandwip", "Haiya"], postCode: "4300" },
          { name: "Satkania", unions: ["Satkania", "Lohagara"], postCode: "4380" },
          { name: "Sitakunda", unions: ["Sitakunda", "Baro Aulia"], postCode: "4310" },
        ],
      },
      {
        name: "Cox's Bazar",
        thanas: [
          { name: "Cox's Bazar Sadar", unions: ["Cox's Bazar", "Jhilwanj"], postCode: "4700" },
          { name: "Chakaria", unions: ["Chakaria", "Kauarkhali"], postCode: "4740" },
          { name: "Kutubdia", unions: ["Kutubdia", "Dhalghata"], postCode: "4720" },
          { name: "Maheshkhali", unions: ["Maheshkhali", "Baragak"], postCode: "4710" },
          { name: "Ramu", unions: ["Ramu", "Rajakhura"], postCode: "4730" },
          { name: "Teknaf", unions: ["Teknaf", "Hnila"], postCode: "4760" },
          { name: "Ukhia", unions: ["Ukhia", "Rajdhum"], postCode: "4750" },
        ],
      },
      {
        name: "Khagrachhari",
        thanas: [
          { name: "Khagrachhari Sadar", unions: ["Khagrachhari", "Diginala"], postCode: "4400" },
          { name: "Dighinala", unions: ["Dighinala", "Taindang"], postCode: "4420" },
          { name: "Lakshmichhari", unions: ["Lakshmichhari", "Mobachhari"], postCode: "4430" },
          { name: "Mahalchhari", unions: ["Mahalchhari", "Baherchar"], postCode: "4440" },
          { name: "Manikchhari", unions: ["Manikchhari", "Darbari"], postCode: "4450" },
          { name: "Matiranga", unions: ["Matiranga", "Golabari"], postCode: "4450" },
          { name: "Panchhari", unions: ["Panchhari", "PaschimChara"], postCode: "4460" },
          { name: "Ramgarh", unions: ["Ramgarh", "Chengalhata"], postCode: "4470" },
        ],
      },
      {
        name: "Bandarban",
        thanas: [
          { name: "Bandarban Sadar", unions: ["Bandarban", "Rajamodhu"], postCode: "4600" },
          { name: "Alikadam", unions: ["Alikadam", "Naikkhyongchari"], postCode: "4650" },
          { name: "Lama", unions: ["Lama", "Faitong"], postCode: "4640" },
          { name: "Naikhongchhari", unions: ["Naikhongchhari", "Gundum"], postCode: "4660" },
          { name: "Rowangchhari", unions: ["Rowangchhari", "Tumbru"], postCode: "4610" },
          { name: "Ruma", unions: ["Ruma", "Gajalia"], postCode: "4620" },
          { name: "Thanchi", unions: ["Thanchi", "Remakry"], postCode: "4630" },
        ],
      },
    ],
  },
  {
    name: "Dhaka",
    districts: [
      {
        name: "Dhaka",
        thanas: [
          { name: "Dhanmondi", unions: ["Dhanmondi"], postCode: "1205" },
          { name: "Gulshan", unions: ["Gulshan"], postCode: "1212" },
          { name: "Mirpur", unions: ["Mirpur"], postCode: "1216" },
          { name: "Uttara", unions: ["Uttara"], postCode: "1230" },
          { name: "Motijheel", unions: ["Motijheel"], postCode: "1000" },
          { name: "Ramna", unions: ["Ramna"], postCode: "1000" },
          { name: "Tejgaon", unions: ["Tejgaon"], postCode: "1215" },
          { name: "Mohammadpur", unions: ["Mohammadpur"], postCode: "1207" },
          { name: "Keraniganj", unions: ["Keraniganj", "Kalatia"], postCode: "1310" },
          { name: "Savar", unions: ["Savar", "Tetuljhora"], postCode: "1340" },
          { name: "Ashulia", unions: ["Ashulia", "Baipail"], postCode: "1345" },
          { name: "Dohar", unions: ["Dohar", "Nawabganj"], postCode: "1330" },
        ],
      },
      {
        name: "Faridpur",
        thanas: [
          { name: "Faridpur Sadar", unions: ["Faridpur", "Aliabad"], postCode: "7800" },
          { name: "Alfadanga", unions: ["Alfadanga", "Bhanganpar"], postCode: "7870" },
          { name: "Boalmari", unions: ["Boalmari", "Rupapat"], postCode: "7860" },
          { name: "Charsadat", unions: ["Charsadat", "Goalkhali"], postCode: "7810" },
          { name: "Nagarkanda", unions: ["Nagarkanda", "Talma"], postCode: "7840" },
          { name: "Sadarpur", unions: ["Sadarpur", "Charbhadrasan"], postCode: "7820" },
          { name: "Saltha", unions: ["Saltha", "Kanaipur"], postCode: "7830" },
        ],
      },
      {
        name: "Gazipur",
        thanas: [
          { name: "Gazipur Sadar", unions: ["Gazipur", "Kaliakair"], postCode: "1700" },
          { name: "Kaliakair", unions: ["Kaliakair", "Bor鲁ha"], postCode: "1750" },
          { name: "Kaliganj", unions: ["Kaliganj", "Satisha"], postCode: "1720" },
          { name: "Kapasia", unions: ["Kapasia", "Chikni"], postCode: "1730" },
          { name: "Sreepur", unions: ["Sreepur", "Boro Polash"], postCode: "1740" },
        ],
      },
      {
        name: "Gopalganj",
        thanas: [
          { name: "Gopalganj Sadar", unions: ["Gopalganj", "Uttar Kanda"], postCode: "8100" },
          { name: "Kashiani", unions: ["Kashiani", "Ramdia"], postCode: "8130" },
          { name: "Kotalipara", unions: ["Kotalipara", "Dumaria"], postCode: "8110" },
          { name: "Tungipara", unions: ["Tungipara", "Dangapara"], postCode: "8120" },
        ],
      },
      {
        name: "Jamalpur",
        thanas: [
          { name: "Jamalpur Sadar", unions: ["Jamalpur", "Nandina"], postCode: "2000" },
          { name: "Dewanganj", unions: ["Dewanganj", "Char Gujia"], postCode: "2030" },
          { name: "Bakshiganj", unions: ["Bakshiganj", "Durgapur"], postCode: "2040" },
          { name: "Islampur", unions: ["Islampur", "Charawan"], postCode: "2020" },
          { name: "Madarganj", unions: ["Madarganj", "Rowmari"], postCode: "2040" },
          { name: "Melandaha", unions: ["Melandaha", "Mahmudabad"], postCode: "2010" },
          { name: "Sarishabari", unions: ["Sarishabari", "Ranagachha"], postCode: "2050" },
        ],
      },
      {
        name: "Kishoreganj",
        thanas: [
          { name: "Kishoreganj Sadar", unions: ["Kishoreganj", "Maizbari"], postCode: "2300" },
          { name: "Austagram", unions: ["Austagram", "Jainti"], postCode: "2390" },
          { name: "Bajitpur", unions: ["Bajitpur", "Bairchara"], postCode: "2330" },
          { name: "Bhairab", unions: ["Bhairab", "Jamalpur"], postCode: "2350" },
          { name: "Hossainpur", unions: ["Hossainpur", "Pakundia"], postCode: "2320" },
          { name: "Karimganj", unions: ["Karimganj", "Sahedal"], postCode: "2310" },
          { name: "Katiadi", unions: ["Katiadi", "Tarial"], postCode: "2340" },
          { name: "Kuliarchar", unions: ["Kuliarchar", "Shaiful Islam"], postCode: "2380" },
          { name: "Mithamain", unions: ["Mithamain", "Gurupasha"], postCode: "2370" },
          { name: "Nikli", unions: ["Nikli", "Adampur"], postCode: "2360" },
          { name: "Pakundia", unions: ["Pakundia", "Alenga"], postCode: "2320" },
          { name: "Tarail", unions: ["Tarail", "Rupashi"], postCode: "2310" },
        ],
      },
      {
        name: "Madaripur",
        thanas: [
          { name: "Madaripur Sadar", unions: ["Madaripur", "Khalia"], postCode: "7900" },
          { name: "Dashghar", unions: ["Dashghar", "Rajanagar"], postCode: "7910" },
          { name: "Kalkini", unions: ["Kalkini", "Sahanati"], postCode: "7920" },
          { name: "Rajoir", unions: ["Rajoir", "Lakshmangad"], postCode: "7930" },
        ],
      },
      {
        name: "Manikganj",
        thanas: [
          { name: "Manikganj Sadar", unions: ["Manikganj", "Putail"], postCode: "1800" },
          { name: "Daulatpur", unions: ["Daulatpur", "Akhila"], postCode: "1860" },
          { name: "Ghior", unions: ["Ghior", "Churaman"], postCode: "1840" },
          { name: "Harirampur", unions: ["Harirampur", "Baneswar"], postCode: "1850" },
          { name: "Saturia", unions: ["Saturia", "Baghutia"], postCode: "1830" },
          { name: "Singair", unions: ["Singair", "Chitholia"], postCode: "1820" },
        ],
      },
      {
        name: "Munshiganj",
        thanas: [
          { name: "Munshiganj Sadar", unions: ["Munshiganj", "Rikabibazar"], postCode: "1500" },
          { name: "Gazaria", unions: ["Gazaria", "Bausia"], postCode: "1510" },
          { name: "Lohajang", unions: ["Lohajang", "Hathighar"], postCode: "1530" },
          { name: "Sirajdikhan", unions: ["Sirajdikhan", "Malkhanagar"], postCode: "1520" },
          { name: "Sreenagar", unions: ["Sreenagar", "Bagherpara"], postCode: "1540" },
          { name: "Tongibari", unions: ["Tongibari", "Kathaldi"], postCode: "1550" },
        ],
      },
      {
        name: "Narayanganj",
        thanas: [
          { name: "Narayanganj Sadar", unions: ["Narayanganj", "Fatulla"], postCode: "1400" },
          { name: "Araihazar", unions: ["Araihazar", "Barodi"], postCode: "1450" },
          { name: "Bandar", unions: ["Bandar", "Siddhirganj"], postCode: "1410" },
          { name: "Sonargaon", unions: ["Sonargaon", "Goazar"], postCode: "1440" },
        ],
      },
      {
        name: "Narsingdi",
        thanas: [
          { name: "Narsingdi Sadar", unions: ["Narsingdi", "Gogulia"], postCode: "1600" },
          { name: "Belabo", unions: ["Belabo", "Narayanpur"], postCode: "1640" },
          { name: "Monohardi", unions: ["Monohardi", "Dewhari"], postCode: "1650" },
          { name: "Palash", unions: ["Palash", "Chinishpur"], postCode: "1610" },
          { name: "Raipura", unions: ["Raipura", "Shibpur"], postCode: "1630" },
          { name: "Shibpur", unions: ["Shibpur", "Patlatedi"], postCode: "1630" },
        ],
      },
      {
        name: "Rajbari",
        thanas: [
          { name: "Rajbari Sadar", unions: ["Rajbari", "Pabla"], postCode: "7700" },
          { name: "Baliakandi", unions: ["Baliakandi", "Nalia"], postCode: "7730" },
          { name: "Pangsa", unions: ["Pangsa", "Jashai"], postCode: "7720" },
          { name: "Kalukhali", unions: ["Kalukhali", "Zinjira"], postCode: "7710" },
        ],
      },
      {
        name: "Shariatpur",
        thanas: [
          { name: "Shariatpur Sadar", unions: ["Shariatpur", "Angaria"], postCode: "8000" },
          { name: "Bhedarganj", unions: ["Bhedarganj", "Jajira"], postCode: "8040" },
          { name: "Damudya", unions: ["Damudya", "Osmani Nagar"], postCode: "8020" },
          { name: "Gosairhat", unions: ["Gosairhat", "Bhojsardar"], postCode: "8030" },
          { name: "Naria", unions: ["Naria", "Shahkan"], postCode: "8010" },
          { name: "Tajpur", unions: ["Tajpur", "Kura"], postCode: "8050" },
        ],
      },
    ],
  },
  {
    name: "Khulna",
    districts: [
      {
        name: "Khulna",
        thanas: [
          { name: "Khulna Sadar", unions: ["Khulna", "Daulatpur"], postCode: "9100" },
          { name: "Batiaghata", unions: ["Batiaghata", "Khalishpur"], postCode: "9260" },
          { name: "Dacope", unions: ["Dacope", "Banishanta"], postCode: "9270" },
          { name: "Dumuria", unions: ["Dumuria", "Rupsha"], postCode: "9250" },
          { name: "Dighalia", unions: ["Dighalia", "Ghasiakhali"], postCode: "9220" },
          { name: "Koyra", unions: ["Koyra", "Amadee"], postCode: "9290" },
          { name: "Paikgachha", unions: ["Paikgachha", "Deyara"], postCode: "9280" },
          { name: "Phultala", unions: ["Phultala", "Suriyani"], postCode: "9210" },
          { name: "Rupsa", unions: ["Rupsa", "Chiltia"], postCode: "9200" },
          { name: "Terokhada", unions: ["Terokhada", "Sardar"], postCode: "9240" },
        ],
      },
      {
        name: "Bagerhat",
        thanas: [
          { name: "Bagerhat Sadar", unions: ["Bagerhat", "Rangpur"], postCode: "9300" },
          { name: "Chitalmari", unions: ["Chitalmari", "Sonatala"], postCode: "9350" },
          { name: "Fakirhat", unions: ["Fakirhat", "Bishnupur"], postCode: "9370" },
          { name: "Kachua", unions: ["Kachua", "Uzzalpur"], postCode: "9310" },
          { name: "Mollahat", unions: ["Mollahat", "Rakhalayer"], postCode: "9360" },
          { name: "Mongla", unions: ["Mongla", "B_guess"], postCode: "9380" },
          { name: "Morrelganj", unions: ["Morrelganj", "Dhulikhara"], postCode: "9320" },
          { name: "Rampal", unions: ["Rampal", "Uzirpur"], postCode: "9340" },
          { name: "Sarankhola", unions: ["Sarankhola", "Rayenda"], postCode: "9330" },
        ],
      },
      {
        name: "Jessore",
        thanas: [
          { name: "Jashore Sadar", unions: ["Jashore", "Kachia"], postCode: "7400" },
          { name: "Abhaynagar", unions: ["Abhaynagar", "Baghachina"], postCode: "7470" },
          { name: "Assasuni", unions: ["Assasuni", "Khalsi"], postCode: "7460" },
          { name: "Benapole", unions: ["Benapole", "Shyamnagar"], postCode: "7430" },
          { name: "Bhgilura", unions: ["Bhgilura", "Ganganagar"], postCode: "7450" },
          { name: "Chaugachha", unions: ["Chaugachha", "Sundoli"], postCode: "7410" },
          { name: "Keshabpur", unions: ["Keshabpur", "Sitarampur"], postCode: "7450" },
          { name: "Monirampur", unions: ["Monirampur", "Lakshmanpur"], postCode: "7440" },
          { name: "Sharsha", unions: ["Sharsha", "Benapole"], postCode: "7420" },
        ],
      },
      {
        name: "Satkhira",
        thanas: [
          { name: "Satkhira Sadar", unions: ["Satkhira", "Jhungepara"], postCode: "9400" },
          { name: "Assasuni", unions: ["Assasuni", "Kulia"], postCode: "9460" },
          { name: "Debhata", unions: ["Debhata", "Kushti"], postCode: "9430" },
          { name: "Kalaroa", unions: ["Kalaroa", "Khorsa"], postCode: "9410" },
          { name: "Kaliganj", unions: ["Kaliganj", "Banpur"], postCode: "9440" },
          { name: "Nakipur", unions: ["Nakipur", "Bhurulia"], postCode: "9450" },
          { name: "Tala", unions: ["Tala", "Gazipur"], postCode: "9420" },
        ],
      },
    ],
  },
  {
    name: "Mymensingh",
    districts: [
      {
        name: "Mymensingh",
        thanas: [
          { name: "Mymensingh Sadar", unions: ["Mymensingh", "Khaga"], postCode: "2200" },
          { name: "Bhaluka", unions: ["Bhaluka", "Rupsi"], postCode: "2240" },
          { name: "Dobaura", unions: ["Dobaura", "Dhour"], postCode: "2210" },
          { name: "Fulbaria", unions: ["Fulbaria", "Bakshiganj"], postCode: "2230" },
          { name: "Gaffargaon", unions: ["Gaffargaon", "Pattrishamuria"], postCode: "2230" },
          { name: "Gauripur", unions: ["Gauripur", "Chargacha"], postCode: "2270" },
          { name: "Haluaghat", unions: ["Haluaghat", "Bgora"], postCode: "2260" },
          { name: "Ishwarganj", unions: ["Ishwarganj", "Khermahal"], postCode: "2280" },
          { name: "Muktagachha", unions: ["Muktagachha", "Dapunia"], postCode: "2220" },
          { name: "Nandail", unions: ["Nandail", "Kherighat"], postCode: "2290" },
          { name: "Phulpur", unions: ["Phulpur", "Habirbari"], postCode: "2250" },
          { name: "Trishal", unions: ["Trishal", "Dhanikhola"], postCode: "2220" },
        ],
      },
      {
        name: "Sherpur",
        thanas: [
          { name: "Sherpur Sadar", unions: ["Sherpur", "Chandrapur"], postCode: "2100" },
          { name: "Jhenaigati", unions: ["Jhenaigati", "Malijhikanda"], postCode: "2120" },
          { name: "Nakla", unions: ["Nakla", "Ghagra"], postCode: "2150" },
          { name: "Nalitabari", unions: ["Nalitabari", "Harirampur"], postCode: "2110" },
          { name: "Sribardi", unions: ["Sribardi", "Balirchar"], postCode: "2130" },
        ],
      },
      {
        name: "Tangail",
        thanas: [
          { name: "Tangail Sadar", unions: ["Tangail", "Kathalia"], postCode: "1900" },
          { name: "Basail", unions: ["Basail", "Fatehpur"], postCode: "1920" },
          { name: "Bhuapur", unions: ["Bhuapur", "Kodalpur"], postCode: "1960" },
          { name: "Delduar", unions: ["Delduar", "Elasin"], postCode: "1910" },
          { name: "Ghatail", unions: ["Ghatail", "Jamalpur"], postCode: "1980" },
          { name: "Gopalpur", unions: ["Gopalpur", "Latifpur"], postCode: "1990" },
          { name: "Kalihati", unions: ["Kalihati", "Nagbari"], postCode: "1970" },
          { name: "Madhupur", unions: ["Madhupur", "Dhanbari"], postCode: "1990" },
          { name: "Mirzapur", unions: ["Mirzapur", "Bhardaha"], postCode: "1940" },
          { name: "Nagarpur", unions: ["Nagarpur", "Habla"], postCode: "1930" },
          { name: "Palashbari", unions: ["Palashbari", "Karatinga"], postCode: "1950" },
        ],
      },
      {
        name: "Netrakona",
        thanas: [
          { name: "Netrakona Sadar", unions: ["Netrakona", "Atpara"], postCode: "2400" },
          { name: "Atpara", unions: ["Atpara", "Kendua"], postCode: "2470" },
          { name: "Barhatta", unions: ["Barhatta", "Durgapur"], postCode: "2440" },
          { name: "Durgapur", unions: ["Durgapur", "Kandela"], postCode: "2450" },
          { name: "Kalmakanda", unions: ["Kalmakanda", "Kendua"], postCode: "2430" },
          { name: "Kendua", unions: ["Kendua", "Atpara"], postCode: "2480" },
          { name: "Madan", unions: ["Madan", "Dashuria"], postCode: "2460" },
          { name: "Mohanganj", unions: ["Mohanganj", "Talukderpur"], postCode: "2420" },
          { name: "Purbadhala", unions: ["Purbadhala", "Hemnapur"], postCode: "2410" },
        ],
      },
    ],
  },
  {
    name: "Rajshahi",
    districts: [
      {
        name: "Rajshahi",
        thanas: [
          { name: "Rajshahi Sadar", unions: ["Rajshahi", "Hujurpuri"], postCode: "6000" },
          { name: "Bagha", unions: ["Bagha", "Arani"], postCode: "6280" },
          { name: "Bagmara", unions: ["Bagmara", "Durgapur"], postCode: "6250" },
          { name: "Charghat", unions: ["Charghat", "Puthia"], postCode: "6270" },
          { name: "Durgapur", unions: ["Durgapur", "Gangpur"], postCode: "6240" },
          { name: "Godagari", unions: ["Godagari", "Ghoramara"], postCode: "6260" },
          { name: "Mohanpur", unions: ["Mohanpur", "Panchandar"], postCode: "6230" },
          { name: "Paba", unions: ["Paba", "Harinagar"], postCode: "6210" },
          { name: "Puthia", unions: ["Puthia", "Shilmariguda"], postCode: "6220" },
          { name: "Tanore", unions: ["Tanore", "Gangnagar"], postCode: "6290" },
        ],
      },
      {
        name: "Bogura",
        thanas: [
          { name: "Bogura Sadar", unions: ["Bogura", "Sonatala"], postCode: "5800" },
          { name: "Adamdighi", unions: ["Adamdighi", "Sanurjan"], postCode: "5890" },
          { name: "Dhunat", unions: ["Dhunat", "Erul"], postCode: "5850" },
          { name: "Dhupchanchia", unions: ["Dhupchanchia", "Gopalpur"], postCode: "5880" },
          { name: "Gabtali", unions: ["Gabtali", "Talukder"], postCode: "5830" },
          { name: "Kahaloo", unions: ["Kahaloo", "Balua"], postCode: "5870" },
          { name: "Nandigram", unions: ["Nandigram", "Dargagram"], postCode: "5860" },
          { name: "Sariakandi", unions: ["Sariakandi", "Khamar"], postCode: "5840" },
          { name: "Shajahanpur", unions: ["Shajahanpur", "Rajapur"], postCode: "5820" },
          { name: "Sherpur", unions: ["Sherpur", "Chikari"], postCode: "5810" },
          { name: "Sonatala", unions: ["Sonatala", "Bohail"], postCode: "5860" },
        ],
      },
      {
        name: "Chapainawabganj",
        thanas: [
          { name: "Chapainawabganj Sadar", unions: ["Chapainawabganj", "Rahanpur"], postCode: "6300" },
          { name: "Bholahat", unions: ["Bholahat", "Mohammadpur"], postCode: "6310" },
          { name: "Gomastapur", unions: ["Gomastapur", "Rahanpur"], postCode: "6320" },
          { name: "Nachol", unions: ["Nachol", "Chattar"], postCode: "6340" },
          { name: "Rohanpur", unions: ["Rohanpur", "Haripur"], postCode: "6350" },
          { name: "Shibganj", unions: ["Shibganj", "Kansat"], postCode: "6340" },
        ],
      },
      {
        name: "Naogaon",
        thanas: [
          { name: "Naogaon Sadar", unions: ["Naogaon", "Mohadevpur"], postCode: "6500" },
          { name: "Atrai", unions: ["Atrai", "Ranihati"], postCode: "6580" },
          { name: "Badalgachi", unions: ["Badalgachi", "Patnitala"], postCode: "6530" },
          { name: "Dhamoirhat", unions: ["Dhamoirhat", "Shyahupur"], postCode: "6580" },
          { name: "Mahadevpur", unions: ["Mahadevpur", "Laxmipur"], postCode: "6550" },
          { name: "Manda", unions: ["Manda", "Khalisha"], postCode: "6540" },
          { name: "Niamatpur", unions: ["Niamatpur", "Paranpur"], postCode: "6520" },
          { name: "Patnitala", unions: ["Patnitala", "Krishnakeri"], postCode: "6540" },
          { name: "Porsha", unions: ["Porsha", "Gangur"], postCode: "6550" },
          { name: "Raninagar", unions: ["Raninagar", "Kashipur"], postCode: "6510" },
          { name: "Sapahar", unions: ["Sapahar", "Tilakpur"], postCode: "6560" },
        ],
      },
    ],
  },
  {
    name: "Rangpur",
    districts: [
      {
        name: "Rangpur",
        thanas: [
          { name: "Rangpur Sadar", unions: ["Rangpur", "Mahiganj"], postCode: "5400" },
          { name: "Badarganj", unions: ["Badarganj", "Tajhat"], postCode: "5430" },
          { name: "Gangachhara", unions: ["Gangachhara", "Borobil"], postCode: "5410" },
          { name: "Kaunia", unions: ["Kaunia", "Dharanipur"], postCode: "5440" },
          { name: "Mithapukur", unions: ["Mithapukur", "Shalban"], postCode: "5460" },
          { name: "Pirgachha", unions: ["Pirgachha", "Dusadighi"], postCode: "5450" },
          { name: "Taraganj", unions: ["Taraganj", "Pirgachha"], postCode: "5420" },
        ],
      },
      {
        name: "Dinajpur",
        thanas: [
          { name: "Dinajpur Sadar", unions: ["Dinajpur", "Shibnagar"], postCode: "5200" },
          { name: "Birampur", unions: ["Birampur", "Akhanagar"], postCode: "5220" },
          { name: "Birganj", unions: ["Birganj", "Alenga"], postCode: "5210" },
          { name: "Bochaganj", unions: ["Bochaganj", "Harirampur"], postCode: "5250" },
          { name: "Chirirbandar", unions: ["Chirirbandar", "Khamar"], postCode: "5240" },
          { name: "Fulbari", unions: ["Fulbari", "Duni"], postCode: "5260" },
          { name: "Ghoraghat", unions: ["Ghoraghat", "Pachbibi"], postCode: "5270" },
          { name: "Hakimpur", unions: ["Hakimpur", "Palashbari"], postCode: "5230" },
          { name: "Kaharol", unions: ["Kaharol", "Bhital"], postCode: "5280" },
          { name: "Nawabganj", unions: ["Nawabganj", "Bisha"], postCode: "5210" },
          { name: "Parbatipur", unions: ["Parbatipur", "Teestamukh"], postCode: "5250" },
        ],
      },
      {
        name: "Gaibandha",
        thanas: [
          { name: "Gaibandha Sadar", unions: ["Gaibandha", "Tulasirhat"], postCode: "5700" },
          { name: "Fulchhari", unions: ["Fulchhari", "Naldanga"], postCode: "5740" },
          { name: "Gobindaganj", unions: ["Gobindaganj", "Khagraghat"], postCode: "5720" },
          { name: "Palashbari", unions: ["Palashbari", "Boali"], postCode: "5730" },
          { name: "Sundarganj", unions: ["Sundarganj", "Kamarpukur"], postCode: "5710" },
          { name: "Taraganj", unions: ["Taraganj", "Rashidpur"], postCode: "5750" },
        ],
      },
      {
        name: "Kurigram",
        thanas: [
          { name: "Kurigram Sadar", unions: ["Kurigram", "Pandul"], postCode: "5600" },
          { name: "Bhurungamari", unions: ["Bhurungamari", "Patilamari"], postCode: "5650" },
          { name: "Char Rajibpur", unions: ["Char Rajibpur", "Mohanganj"], postCode: "5610" },
          { name: "Chilmari", unions: ["Chilmari", "Jorgachh"], postCode: "5630" },
          { name: "Nageshwari", unions: ["Nageshwari", "Bhendabahar"], postCode: "5640" },
          { name: "Phulbari", unions: ["Phulbari", "Radhanagar"], postCode: "5680" },
          { name: "Rajarhat", unions: ["Rajarhat", "Joypur"], postCode: "5620" },
          { name: "Raomari", unions: ["Raomari", "Itahata"], postCode: "5610" },
          { name: "Ulipur", unions: ["Ulipur", "Holokhana"], postCode: "5620" },
        ],
      },
      {
        name: "Lalmonirhat",
        thanas: [
          { name: "Lalmonirhat Sadar", unions: ["Lalmonirhat", "Aditmari"], postCode: "5500" },
          { name: "Aditmari", unions: ["Aditmari", "Patagram"], postCode: "5510" },
          { name: "Hatiya", unions: ["Hatiya", "Nilphamari"], postCode: "5530" },
          { name: "Kaliganj", unions: ["Kaliganj", "Alambari"], postCode: "5520" },
          { name: "Patgram", unions: ["Patgram", "Burimari"], postCode: "5540" },
        ],
      },
    ],
  },
  {
    name: "Sylhet",
    districts: [
      {
        name: "Sylhet",
        thanas: [
          { name: "Sylhet Sadar", unions: ["Sylhet", "Tajpur"], postCode: "3100" },
          { name: "Balaganj", unions: ["Balaganj", "Tajpur"], postCode: "3120" },
          { name: "Companiganj", unions: ["Companiganj", "Jaintiapur"], postCode: "3170" },
          { name: "Fenchuganj", unions: ["Fenchuganj", "Barlekha"], postCode: "3150" },
          { name: "Golapganj", unions: ["Golapganj", "Badeghata"], postCode: "3160" },
          { name: "Gowainghat", unions: ["Gowainghat", "Jalalabad"], postCode: "3150" },
          { name: "Jaintiapur", unions: ["Jaintiapur", "Fatehpur"], postCode: "3150" },
          { name: "Kanaighat", unions: ["Kanaighat", "Barlekha"], postCode: "3180" },
          { name: "Zakiganj", unions: ["Zakiganj", "Barlekha"], postCode: "3190" },
        ],
      },
      {
        name: "Moulvibazar",
        thanas: [
          { name: "Moulvibazar Sadar", unions: ["Moulvibazar", "Barlekha"], postCode: "3200" },
          { name: "Barlekha", unions: ["Barlekha", "Rajnagar"], postCode: "3250" },
          { name: "Juri", unions: ["Juri", "Borolekha"], postCode: "3280" },
          { name: "Kamalganj", unions: ["Kamalganj", "Mirabazar"], postCode: "3230" },
          { name: "Rajnagar", unions: ["Rajnagar", "Sreemangal"], postCode: "3210" },
          { name: "Sreemangal", unions: ["Sreemangal", "Bhutmara"], postCode: "3220" },
        ],
      },
      {
        name: "Habiganj",
        thanas: [
          { name: "Habiganj Sadar", unions: ["Habiganj", "Lakhai"], postCode: "3300" },
          { name: "Azmiriganj", unions: ["Azmiriganj", "Chunarughat"], postCode: "3350" },
          { name: "Baniachong", unions: ["Baniachong", "Chunarughat"], postCode: "3360" },
          { name: "Bahubal", unions: ["Bahubal", "Nabiganj"], postCode: "3310" },
          { name: "Chunarughat", unions: ["Chunarughat", "Lakhai"], postCode: "3320" },
          { name: "Lakhai", unions: ["Lakhai", "Baniachong"], postCode: "3340" },
          { name: "Nabiganj", unions: ["Nabiganj", "Bahubal"], postCode: "3330" },
        ],
      },
      {
        name: "Sunamganj",
        thanas: [
          { name: "Sunamganj Sadar", unions: ["Sunamganj", "Doshak"], postCode: "3400" },
          { name: "Bishwambarpur", unions: ["Bishwambarpur", "Tahirpur"], postCode: "3450" },
          { name: "Chhatak", unions: ["Chhatak", "Derai"], postCode: "3460" },
          { name: "Derai", unions: ["Derai", "Sunamganj"], postCode: "3420" },
          { name: "Dharmapasha", unions: ["Dharmapasha", "Jagannathpur"], postCode: "3410" },
          { name: "Jagannathpur", unions: ["Jagannathpur", "South Sunamganj"], postCode: "3430" },
          { name: "Tahirpur", unions: ["Tahirpur", "Bishwambarpur"], postCode: "3440" },
        ],
      },
    ],
  },
];

export const countries = ["Bangladesh"];
