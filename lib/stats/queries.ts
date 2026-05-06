import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

type Row = Record<string, unknown>;

async function execRows<T = Row>(query: ReturnType<typeof sql>): Promise<T[]> {
  const result = await db.execute(query);
  return (result.rows ?? result) as unknown as T[];
}

async function execRow<T = Row>(query: ReturnType<typeof sql>): Promise<T> {
  const rows = await execRows<T>(query);
  return rows[0] as T;
}

export async function getKpiStats() {
  return execRow<Record<string, number>>(sql`
    SELECT
      COUNT(DISTINCT p.id) FILTER (WHERE c.is_counted = true)             AS total_people,
      COUNT(c.id) FILTER (WHERE c.is_counted = true)                      AS total_certs,
      COUNT(c.id) FILTER (WHERE c.platform = 'aistudy' AND c.is_counted)  AS aistudy_certs,
      COUNT(c.id) FILTER (WHERE c.platform = 'coursera' AND c.is_counted) AS coursera_certs,
      COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (SELECT 1 FROM certificates ca WHERE ca.person_id = p.id AND ca.platform = 'aistudy' AND ca.is_counted)
          AND EXISTS (SELECT 1 FROM certificates cb WHERE cb.person_id = p.id AND cb.platform = 'coursera' AND cb.is_counted)
      )                                                                    AS both_platforms,
      COUNT(c.id) FILTER (WHERE c.status = 'name_mismatch')               AS name_mismatch,
      COUNT(c.id) FILTER (WHERE c.status = 'broken')                      AS broken,
      COUNT(c.id) FILTER (WHERE c.status = 'duplicate')                   AS duplicate_certs,
      COUNT(c.id) FILTER (WHERE c.status = 'pending')                     AS pending
    FROM people p
    LEFT JOIN certificates c ON c.person_id = p.id
  `);
}

export interface DistrictRow {
  district: string;
  people_count: string;
  cert_count: string;
  aistudy: string;
  coursera: string;
  broken: string;
  name_mismatch: string;
}

export async function getDistrictStats(): Promise<DistrictRow[]> {
  return execRows<DistrictRow>(sql`
    SELECT
      p.district,
      COUNT(DISTINCT p.id) FILTER (WHERE c.is_counted = true) AS people_count,
      COUNT(c.id) FILTER (WHERE c.is_counted = true)          AS cert_count,
      COUNT(c.id) FILTER (WHERE c.platform = 'aistudy' AND c.is_counted)  AS aistudy,
      COUNT(c.id) FILTER (WHERE c.platform = 'coursera' AND c.is_counted) AS coursera,
      COUNT(c.id) FILTER (WHERE c.status = 'broken')          AS broken,
      COUNT(c.id) FILTER (WHERE c.status = 'name_mismatch')   AS name_mismatch
    FROM people p
    LEFT JOIN certificates c ON c.person_id = p.id
    WHERE p.district IS NOT NULL
    GROUP BY p.district
    ORDER BY cert_count DESC
  `);
}

export interface OrgRow {
  organization: string;
  district: string;
  people_count: string;
  cert_count: string;
}

export async function getTopOrganizations(limit = 10, minPeople = 1, order: "desc" | "asc" = "desc"): Promise<OrgRow[]> {
  const orderSql = order === "desc" ? sql`DESC` : sql`ASC`;
  return execRows<OrgRow>(sql`
    SELECT
      p.organization,
      p.district,
      COUNT(DISTINCT p.id) AS people_count,
      COUNT(c.id) FILTER (WHERE c.is_counted = true) AS cert_count
    FROM people p
    LEFT JOIN certificates c ON c.person_id = p.id
    WHERE p.organization IS NOT NULL
    GROUP BY p.organization, p.district
    HAVING COUNT(DISTINCT p.id) >= ${minPeople}
    ORDER BY cert_count ${orderSql}
    LIMIT ${limit}
  `);
}

export interface PositionRow {
  position_canonical: string;
  people_count: string;
  cert_count: string;
}

export async function getPositionStats(): Promise<PositionRow[]> {
  return execRows<PositionRow>(sql`
    SELECT
      p.position_canonical,
      COUNT(DISTINCT p.id)                                     AS people_count,
      COUNT(c.id) FILTER (WHERE c.is_counted = true)          AS cert_count
    FROM people p
    LEFT JOIN certificates c ON c.person_id = p.id
    GROUP BY p.position_canonical
    ORDER BY people_count DESC
  `);
}

export async function getPlatformStats() {
  return execRow<Record<string, string>>(sql`
    SELECT
      COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (SELECT 1 FROM certificates ca WHERE ca.person_id = p.id AND ca.platform = 'aistudy' AND ca.is_counted)
      ) AS only_aistudy_or_both,
      COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (SELECT 1 FROM certificates cb WHERE cb.person_id = p.id AND cb.platform = 'coursera' AND cb.is_counted)
      ) AS only_coursera_or_both,
      COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (SELECT 1 FROM certificates ca WHERE ca.person_id = p.id AND ca.platform = 'aistudy' AND ca.is_counted)
          AND EXISTS (SELECT 1 FROM certificates cb WHERE cb.person_id = p.id AND cb.platform = 'coursera' AND cb.is_counted)
      ) AS both_platforms
    FROM people p
  `);
}
