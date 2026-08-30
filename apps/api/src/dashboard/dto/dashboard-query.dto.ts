// Plain query-param interface — GET list/report endpoints in this codebase
// parse query params manually (see leads.controller.ts, admin.controller.ts)
// rather than validating them as a Zod body DTO.
export interface DashboardQueryInput {
  period?: 'today' | 'week' | 'month' | 'year' | 'custom';
  date_from?: string;
  date_to?: string;
  course_id?: string;
  course_type?: 'recorded' | 'live' | 'all';
  instructor_id?: string; // recorded courses only — liveCourses has no instructorId column
  package_id?: string;    // a bundle-type liveCourses.id
  location?: string;      // site_visits.country
  device?: 'mobile' | 'tablet' | 'desktop' | 'all';
  gender?: 'male' | 'female' | 'other' | 'all';
  source?: string;        // visit_source enum value
}
