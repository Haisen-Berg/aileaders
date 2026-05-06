import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  uuid,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const uploads = pgTable("uploads", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: text("filename").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  rowsTotal: integer("rows_total").notNull().default(0),
  rowsImported: integer("rows_imported").notNull().default(0),
  rowsSkipped: integer("rows_skipped").notNull().default(0),
  rowsDuplicate: integer("rows_duplicate").notNull().default(0),
});

export const people = pgTable(
  "people",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    district: text("district"),
    organization: text("organization"),
    fullName: text("full_name"),
    fullNameNormalized: text("full_name_normalized"),
    positionRaw: text("position_raw"),
    positionCanonical: text("position_canonical"),
    uploadId: uuid("upload_id").references(() => uploads.id),
    rowNumber: integer("row_number"),
  },
  (t) => [index("people_district_idx").on(t.district), index("people_org_idx").on(t.organization)]
);

export const certificates = pgTable(
  "certificates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id),
    platform: text("platform").notNull(), // 'aistudy' | 'coursera'
    course: text("course"),
    issuedAt: timestamp("issued_at"),
    url: text("url").notNull(),
    urlHash: text("url_hash").notNull(),
    status: text("status").notNull().default("pending"),
    // 'pending' | 'valid' | 'name_mismatch' | 'broken' | 'duplicate' | 'unknown'
    isCounted: boolean("is_counted").notNull().default(true),
    verifiedAt: timestamp("verified_at"),
    verifierResponse: jsonb("verifier_response"),
    // { extracted_name, extracted_course, http_status, error? }
  },
  (t) => [
    uniqueIndex("certificates_url_hash_idx").on(t.urlHash),
    index("certificates_person_idx").on(t.personId),
    index("certificates_status_idx").on(t.status),
    index("certificates_platform_idx").on(t.platform),
  ]
);

export const positionsMap = pgTable("positions_map", {
  id: uuid("id").defaultRandom().primaryKey(),
  rawValue: text("raw_value").notNull().unique(),
  canonical: text("canonical").notNull(),
  // 'ўқитувчи' | 'талаба' | 'ўқувчи' | 'ходим' | 'бошқа'
});

export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;
export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
export type PositionMap = typeof positionsMap.$inferSelect;
