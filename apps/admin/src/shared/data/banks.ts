export interface BankBranch {
  name: string;
}

export interface Bank {
  name: string;
  branches: BankBranch[];
}

export const mobileBankingProviders = [
  { value: "bKash", label: "bKash" },
  { value: "Nagad", label: "Nagad" },
  { value: "Rocket", label: "Rocket" },
  { value: "Upay", label: "Upay" },
  { value: "Other", label: "Other" },
];

export const bangladeshBanks: Bank[] = [
  {
    name: "Islami Bank Bangladesh PLC",
    branches: [
      { name: "Dhaka Main Branch" }, { name: "Motijheel Branch" }, { name: "Gulshan Branch" },
      { name: "Dhanmondi Branch" }, { name: "Mirpur Branch" }, { name: "Uttara Branch" },
      { name: "Chattogram Main Branch" }, { name: "Agrabad Branch" }, { name: "Khulna Branch" },
      { name: "Rajshahi Branch" }, { name: "Sylhet Branch" }, { name: "Barishal Branch" },
      { name: "Rangpur Branch" }, { name: "Mymensingh Branch" }, { name: "Jessore Branch" },
      { name: "Bogra Branch" }, { name: "Cox's Bazar Branch" }, { name: "Comilla Branch" },
    ],
  },
  {
    name: "Sonali Bank PLC",
    branches: [
      { name: "Motijheel Main Branch" }, { name: "Gulshan Branch" }, { name: "Dhanmondi Branch" },
      { name: "Chattogram Main Branch" }, { name: "Agrabad Branch" }, { name: "Khulna Branch" },
      { name: "Rajshahi Branch" }, { name: "Sylhet Branch" }, { name: "Barishal Branch" },
      { name: "Rangpur Branch" }, { name: "Mymensingh Branch" }, { name: "Jessore Branch" },
    ],
  },
  {
    name: "Dutch-Bangla Bank PLC",
    branches: [
      { name: "Dhanmondi Branch" }, { name: "Gulshan Branch" }, { name: "Motijheel Branch" },
      { name: "Uttara Branch" }, { name: "Mirpur Branch" }, { name: "Chattogram Branch" },
      { name: "Khulna Branch" }, { name: "Rajshahi Branch" }, { name: "Sylhet Branch" },
    ],
  },
  {
    name: "Janata Bank PLC",
    branches: [
      { name: "Motijheel Main Branch" }, { name: "Dhanmondi Branch" }, { name: "Gulshan Branch" },
      { name: "Chattogram Branch" }, { name: "Khulna Branch" }, { name: "Rajshahi Branch" },
      { name: "Sylhet Branch" }, { name: "Barishal Branch" },
    ],
  },
  {
    name: "Agrani Bank PLC",
    branches: [
      { name: "Motijheel Main Branch" }, { name: "Dhanmondi Branch" }, { name: "Gulshan Branch" },
      { name: "Chattogram Branch" }, { name: "Khulna Branch" }, { name: "Rajshahi Branch" },
      { name: "Sylhet Branch" }, { name: "Rangpur Branch" },
    ],
  },
  {
    name: "Rupali Bank PLC",
    branches: [
      { name: "Motijheel Main Branch" }, { name: "Dhanmondi Branch" }, { name: "Gulshan Branch" },
      { name: "Chattogram Branch" }, { name: "Khulna Branch" }, { name: "Rajshahi Branch" },
    ],
  },
  {
    name: "BRAC Bank PLC",
    branches: [
      { name: "Dhanmondi Branch" }, { name: "Gulshan Branch" }, { name: "Motijheel Branch" },
      { name: "Uttara Branch" }, { name: "Mirpur Branch" }, { name: "Chattogram Branch" },
      { name: "Khulna Branch" }, { name: "Rajshahi Branch" }, { name: "Sylhet Branch" },
      { name: "Barishal Branch" }, { name: "Rangpur Branch" },
    ],
  },
  {
    name: "City Bank PLC",
    branches: [
      { name: "Gulshan Branch" }, { name: "Dhanmondi Branch" }, { name: "Motijheel Branch" },
      { name: "Uttara Branch" }, { name: "Chattogram Branch" }, { name: "Khulna Branch" },
      { name: "Rajshahi Branch" }, { name: "Sylhet Branch" },
    ],
  },
  {
    name: "Eastern Bank PLC",
    branches: [
      { name: "Gulshan Branch" }, { name: "Dhanmondi Branch" }, { name: "Motijheel Branch" },
      { name: "Uttara Branch" }, { name: "Chattogram Branch" }, { name: "Sylhet Branch" },
    ],
  },
  {
    name: "Prime Bank PLC",
    branches: [
      { name: "Gulshan Branch" }, { name: "Dhanmondi Branch" }, { name: "Motijheel Branch" },
      { name: "Uttara Branch" }, { name: "Chattogram Branch" }, { name: "Khulna Branch" },
      { name: "Rajshahi Branch" }, { name: "Sylhet Branch" },
    ],
  },
  {
    name: "United Commercial Bank PLC",
    branches: [
      { name: "Motijheel Main Branch" }, { name: "Gulshan Branch" }, { name: "Dhanmondi Branch" },
      { name: "Chattogram Branch" }, { name: "Khulna Branch" }, { name: "Sylhet Branch" },
    ],
  },
  {
    name: "Uttara Bank PLC",
    branches: [
      { name: "Motijheel Main Branch" }, { name: "Gulshan Branch" }, { name: "Dhanmondi Branch" },
      { name: "Uttara Branch" }, { name: "Chattogram Branch" }, { name: "Sylhet Branch" },
    ],
  },
  {
    name: "Pubali Bank PLC",
    branches: [
      { name: "Motijheel Main Branch" }, { name: "Gulshan Branch" }, { name: "Dhanmondi Branch" },
      { name: "Chattogram Branch" }, { name: "Khulna Branch" }, { name: "Rajshahi Branch" },
    ],
  },
  {
    name: "Bangladesh Development Bank PLC",
    branches: [
      { name: "Motijheel Main Branch" }, { name: "Gulshan Branch" }, { name: "Chattogram Branch" },
    ],
  },
  {
    name: "Exim Bank PLC",
    branches: [
      { name: "Gulshan Branch" }, { name: "Dhanmondi Branch" }, { name: "Motijheel Branch" },
      { name: "Chattogram Branch" }, { name: "Sylhet Branch" },
    ],
  },
  {
    name: "Trust Bank PLC",
    branches: [
      { name: "Motijheel Branch" }, { name: "Gulshan Branch" }, { name: "Dhanmondi Branch" },
      { name: "Chattogram Branch" },
    ],
  },
  {
    name: "Meghna Bank PLC",
    branches: [
      { name: "Gulshan Branch" }, { name: "Motijheel Branch" }, { name: "Dhanmondi Branch" },
    ],
  },
  {
    name: "NBL (National Bank Limited)",
    branches: [
      { name: "Motijheel Main Branch" }, { name: "Gulshan Branch" }, { name: "Dhanmondi Branch" },
      { name: "Chattogram Branch" }, { name: "Rajshahi Branch" },
    ],
  },
  {
    name: "Midland Bank PLC",
    branches: [
      { name: "Gulshan Branch" }, { name: "Motijheel Branch" },
    ],
  },
  {
    name: "One Bank Limited",
    branches: [
      { name: "Gulshan Branch" }, { name: "Motijheel Branch" }, { name: "Dhanmondi Branch" },
    ],
  },
];
