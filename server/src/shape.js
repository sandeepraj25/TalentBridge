import { parseJson } from "./util.js";

/** SELECT fragment that joins a job with its company (aliased c_*). */
export const JOB_WITH_COMPANY = `
  SELECT j.*,
    c.name AS c_name, c.slug AS c_slug, c.logo_url AS c_logo_url, c.is_verified AS c_is_verified,
    c.industry AS c_industry, c.location AS c_location, c.company_size AS c_company_size,
    c.website AS c_website, c.description AS c_description
  FROM jobs j JOIN companies c ON c.id = j.company_id`;

export function shapeJob(row) {
  if (!row) return null;
  const {
    c_name, c_slug, c_logo_url, c_is_verified, c_industry, c_location, c_company_size, c_website, c_description,
    ...job
  } = row;
  return {
    ...job,
    is_featured: !!job.is_featured,
    is_boosted: !!job.is_boosted,
    skills: parseJson(job.skills, []),
    company: c_name
      ? {
          id: job.company_id,
          name: c_name,
          slug: c_slug,
          logo_url: c_logo_url,
          is_verified: !!c_is_verified,
          industry: c_industry,
          location: c_location,
          company_size: c_company_size,
          website: c_website,
          description: c_description,
        }
      : null,
  };
}

export function shapeCandidate(row) {
  if (!row) return null;
  return { ...row, skills: parseJson(row.skills, []), open_to_work: !!row.open_to_work };
}
