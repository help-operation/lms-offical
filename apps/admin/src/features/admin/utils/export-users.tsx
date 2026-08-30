"use client";

// Re-export generic utilities with AdminUser-typed aliases for backward compatibility
export {
  type ExportField,
  type CompanyInfo,
  settingsToCompanyInfo,
  formatDate as formatUserDate,
} from "@/utils/table-export";

export {
  exportTableAsCsv as exportUsersAsCsv,
  exportTableAsXlsx as exportUsersAsXlsx,
  exportTableAsPdf as exportUsersAsPdf,
} from "@/utils/table-export";
