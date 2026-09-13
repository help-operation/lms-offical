export const BD_DIVISIONS = [
  "Barisal",
  "Chittagong",
  "Dhaka",
  "Khulna",
  "Mymensingh",
  "Rajshahi",
  "Rangpur",
  "Sylhet",
] as const;

export type Division = (typeof BD_DIVISIONS)[number];

export const BD_DISTRICTS: Record<Division, string[]> = {
  Barisal: ["Barguna", "Barisal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"],
  Chittagong: ["Bandarban", "Brahmanbaria", "Chandpur", "Chittagong", "Comilla", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"],
  Dhaka: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"],
  Khulna: ["Bagerhat", "Chuadanga", "Jessore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"],
  Mymensingh: ["Jamalpur", "Mymensingh", "Netrakona", "Sherpur"],
  Rajshahi: ["Bogra", "Chapainawabganj", "Joypurhat", "Naogaon", "Natore", "Nawabganj", "Pabna", "Rajshahi", "Sirajganj"],
  Rangpur: ["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"],
  Sylhet: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"],
};

export const BD_THANAS: Record<string, string[]> = {
  // Barisal Division
  Barguna: ["Amtali", "Bamna", "Barguna Sadar", "Betagi", "Patharghata", "Taltali"],
  Barisal: ["Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Barisal Sadar", "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur"],
  Bhola: ["Bhola Sadar", "Borhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"],
  Jhalokati: ["Kathalia", "Nalchity", "Rajapur", "Jhalokati Sadar"],
  Patuakhali: ["Bauphal", "Dashmina", "Galachipa", "Kalapara", "Mirzaganj", "Patuakhali Sadar", "Rangabali", "Talukder"],
  Pirojpur: ["Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad", "Pirojpur Sadar", "Zianagar"],

  // Chittagong Division
  Bandarban: ["Alikadam", "Bandarban Sadar", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi"],
  Brahmanbaria: ["Akhaura", "Bancharampur", "Brahmanbaria Sadar", "Ashuganj", "Kasba", "Nabinagar", "Nasirnagar", "Sarail"],
  Chandpur: ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti"],
  Chittagong: ["Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Chittagong Sadar", "Doublemooring", "Hathazari", "Lohagara", "Mirsharai", "Patiya", "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda"],
  Comilla: ["Barura", "Brahmanpara", "Chandina", "Chauddagram", "Comilla Sadar", "Daudkandi", "Debidwar", "Homna", "Laksam", "Langalkot", "Meghna", "Monohorganj", "Nangalkot", "Titas"],
  "Cox's Bazar": ["Chakaria", "Cox's Bazar Sadar", "Kutubdia", "Maheshkhali", "Ramu", "Teknaf", "Ukhiya"],
  Feni: ["Chhagalnaiya", "Daganbhuiyan", "Feni Sadar", "Parshuram", "Sonagazi"],
  Khagrachhari: ["Dighinala", "Khagrachhari Sadar", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh"],
  Lakshmipur: ["Kamalnagar", "Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati"],
  Noakhali: ["Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Kabirhat", "Noakhali Sadar", "Senbagh", "Sonaimuri"],

  // Dhaka Division
  Dhaka: ["Dhanmondi", "Gulshan", "Banani", "Tejgaon", "Uttara", "Mirpur", "Mohammadpur", "Lalmatia", "Motijheel", "Ramna", "Shahbagh", "Khilgaon", "Badda", "Rampura", "Khilkhet", "Cantonment", "Pallabi", "Uttarkhan", "Dakshinkhan", "Bimanbandar", "Keraniganj", "Savar", "Ashulia", "Tongi", "Gazipur Sadar", "Kaliakair", "Kapasia", "Konabari"],
  Faridpur: ["Alfadanga", "Bhanga", "Boalmari", "Char Bhadrasan", "Faridpur Sadar", "Madhukhali", "Nagarkanda", "Sadarpur", "Shalatha"],
  Gazipur: ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur", "Tongi"],
  Gopalganj: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Maksudpur", "Tungipara"],
  Kishoreganj: ["Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kishoreganj Sadar", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail"],
  Madaripur: ["Dasar", "Kalkini", "Madaripur Sadar", "Rajoir", "Shibchar"],
  Manikganj: ["Daulatpur", "Ghior", "Harirampur", "Manikganj Sadar", "Saturia", "Shivalaya", "Singair"],
  Munshiganj: ["Gazaria", "Lohajang", "Munshiganj Sadar", "Sirajdikhan", "Sreenagar", "Tongibari"],
  Narayanganj: ["Araihazar", "Bandar", "Fatulla", "Narayanganj Sadar", "Sonargaon"],
  Narsingdi: ["Belabo", "Monohardi", "Narsingdi Sadar", "Palash", "Raipura", "Shibpur"],
  Rajbari: ["Baliakandi", "Goalanda", "Kalukhali", "Pangsha", "Rajbari Sadar"],
  Shariatpur: ["Bhedarganj", "Damudya", "Gosairhat", "Naria", "Shariatpur Sadar", "Zajira"],
  Tangail: ["Bangabandhu", "Basail", "Bhuapur", "Delduar", "Ghatail", "Gopalpur", "Karatia", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur", "Tangail Sadar"],

  // Khulna Division
  Bagerhat: ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Rampal", "Sharankhola"],
  Chuadanga: ["Alamdanga", "Chuadanga Sadar", "Damurhuda", "Jibannagar"],
  Jessore: ["Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargacha", "Keshabpur", "Jessore Sadar", "Monirampur", "Sharsha"],
  Jhenaidah: ["Harinakunda", "Jhenaidah Sadar", "Kaliganj", "Kotchandpur", "Maheshpur", "Shakhipur"],
  Khulna: ["Batiaghata", "Dacope", "Dumuria", "Dighalia", "Khalishpur", "Khulna Sadar", "Koyra", "Paikgachha", "Phultala", "Rupsa", "Terokhada"],
  Kushtia: ["Bheramara", "Daulatpur", "Kumarkhali", "Kushtia Sadar", "Mirpur"],
  Magura: ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"],
  Meherpur: ["Gangni", "Meherpur Sadar", "Mujibnagar"],
  Narail: ["Kalia", "Lohagara", "Narail Sadar"],
  Satkhira: ["Assasuni", "Debhata", "Kaliganj", "Kalaroa", "Satkhira Sadar", "Shyamnagar", "Tala"],

  // Mymensingh Division
  Jamalpur: ["Bakshiganj", "Dewanganj", "Islampur", "Jamalpur Sadar", "Madarganj", "Melandaha", "Sarishabari"],
  Mymensingh: ["Bhaluka", "Dhubaura", "Fulbaria", "Gaffargaon", "Gauripur", "Ishwarganj", "Mymensingh Sadar", "Muktagachha", "Nandail", "Phulpur", "Tarail"],
  Netrakona: ["Atpara", "Barhatta", "Durgapur", "Khaliajuri", "Kalmakanda", "Kendua", "Madan", "Mohanganj", "Netrakona Sadar", "Purbadhala"],
  Sherpur: ["Jhenaigati", "Nakla", "Nalitabari", "Sherpur Sadar", "Sribordi"],

  // Rajshahi Division
  Bogra: ["Adamdighi", "Bogra Sadar", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sherpur", "Shibganj", "Sonatala"],
  Chapainawabganj: ["Bholahat", "Chapainawabganj Sadar", "Gomastapur", "Nachole", "Rohanpur", "Shibganj"],
  Joypurhat: ["Akkelpur", "Kalai", "Khetlal", "Joypurhat Sadar", "Panchbibi"],
  Naogaon: ["Atrai", "Badalgachi", "Dhamoirhat", "Manda", "Mohadevpur", "Naogaon Sadar", "Niamatpur", "Nizampur", "Patnitala", "Porsha", "Raninagar", "Sapahar"],
  Natore: ["Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Natore Sadar", "Singra"],
  Nawabganj: ["Bholahat", "Gomastapur", "Nachole", "Nawabganj Sadar", "Rohanpur", "Shibganj"],
  Pabna: ["Atgharia", "Bera", "Bhangura", "Chatmohar", "Ishwardi", "Pabna Sadar", "Santhia", "Sujanagar"],
  Rajshahi: ["Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari", "Mohanpur", "Paba", "Rajshahi Sadar", "Tanore"],
  Sirajganj: ["Belkuchi", "Chauhali", "Kamarkhand", "Kazipur", "Raiganj", "Shahjadpur", "Sirajganj Sadar", "Tarash", "Ullapara"],

  // Rangpur Division
  Dinajpur: ["Birampur", "Birganj", "Biral", "Bochaganj", "Chirirbandar", "Dinajpur Sadar", "Ghoraghat", "Hakimpur", "Kaharol", "Nawabganj", "Parbatipur", "Phulbari"],
  Gaibandha: ["Fulchhari", "Gaibandha Sadar", "Gobindaganj", "Palashbari", "Sadullapur", "Sundarganj", "Taraganj"],
  Kurigram: ["Bhurungamari", "Char Rajibpur", "Chilmari", "Kurigram Sadar", "Nageshwari", "Phulbari", "Rajarhat", "Raomari", "Ulipur"],
  Lalmonirhat: ["Aditmari", "Haldibari", "Kaliganj", "Lalmonirhat Sadar", "Patgram"],
  Nilphamari: ["Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Nilphamari Sadar", "Saidpur"],
  Panchagarh: ["Atwari", "Boda", "Debiganj", "Panchagarh Sadar", "Tetulia"],
  Rangpur: ["Badarganj", "Gangachara", "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Rangpur Sadar", "Taraganj"],
  Thakurgaon: ["Baliadangi", "Haripur", "Pirganj", "Ranisankail", "Thakurgaon Sadar"],

  // Sylhet Division
  Habiganj: ["Aichhata", "Baniachong", "Bahubal", "Chunarughat", "Habiganj Sadar", "Lakhai", "Madhabpur", "Nabiganj", "Sayestaganj"],
  Moulvibazar: ["Barlekha", "Juri", "Kamalganj", "Kulaura", "Moulvibazar Sadar", "Rajnagar", "Sreemangal"],
  Sunamganj: ["Bishwamvarpur", "Chhatak", "Derai", "Dharmapasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Sunamganj Sadar", "Tahirpur"],
  Sylhet: ["Balaganj", "Bishwanath", "Companiganj", "Dakshin Surma", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Sylhet Sadar", "Zakiganj"],
};
