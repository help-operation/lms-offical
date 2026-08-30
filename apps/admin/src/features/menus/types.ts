export type MenuItem = {
  id: number;
  menu: string;
  label: string;
  url: string;
  isExternal: boolean;
  openInNewTab: boolean;
  order: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type MenusGrouped = {
  navbar: MenuItem[];
  navbar_more: MenuItem[];
  footer_company: MenuItem[];
  footer_others: MenuItem[];
};

export const MENU_KEYS = [
  "navbar",
  "navbar_more",
  "footer_company",
  "footer_others",
] as const;

export type MenuKey = (typeof MENU_KEYS)[number];

export const MENU_META: Record<MenuKey, { label: string; description: string }> = {
  navbar:         { label: "Navbar",          description: "Primary top navigation links" },
  navbar_more:    { label: "“More” dropdown", description: "Links inside the navbar’s More menu" },
  footer_company: { label: "Footer · Company", description: "Footer “Company” column" },
  footer_others:  { label: "Footer · Others",  description: "Footer “Others” column" },
};

/** Known public pages, offered in the link picker. `url` is the route path. */
export const PAGE_OPTIONS: { label: string; url: string }[] = [
  { label: "Home",               url: "/" },
  { label: "All Courses",        url: "/courses" },
  { label: "About Us",           url: "/about" },
  { label: "Blog",               url: "/blog" },
  { label: "Contact",            url: "/contact" },
  { label: "FAQ",                url: "/faq" },
  { label: "Verify Certificate", url: "/verify" },
  { label: "Free Courses",       url: "/free-courses" },
  { label: "Live Classes",       url: "/live-classes" },
  { label: "Success Stories",    url: "/success-stories" },
  { label: "Mentors",            url: "/our-instructor" },
  { label: "Privacy Policy",     url: "/privacy-policy" },
  { label: "Return Policy",      url: "/return-policy" },
  { label: "Terms & Conditions", url: "/terms-conditions" },
  { label: "Cart",               url: "/cart" },
];
