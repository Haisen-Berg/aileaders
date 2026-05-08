import { verifyOne } from "./lib/links/check.ts";
const tests = [
  { url: "https://omp.aistudy.uz/certificate?id=d5e483a8-ca4e-4496-d3da-08de41fc9826", expected: null, label: "AiStudy VALID, no name" },
  { url: "https://omp.aistudy.uz/certificate?id=d5e483a8-ca4e-4496-d3da-08de41fc9826", expected: "Эргашев Асадбек Хаётбек ўғли", label: "AiStudy VALID, matching name" },
  { url: "https://omp.aistudy.uz/certificate?id=d5e483a8-ca4e-4496-d3da-08de41fc9826", expected: "Иванов Иван Иванович", label: "AiStudy VALID, mismatch name" },
  { url: "https://omp.aistudy.uz/certificate?id=5666ca1e-b70a-42f4-e715-08ddfca261d4", expected: null, label: "AiStudy INVALID" },
  { url: "https://www.coursera.org/verify/9O5NUW8V4BH3", expected: null, label: "Coursera FAKE" },
];
for (const t of tests) {
  try {
    const r = await verifyOne(t.url, t.expected, 12000);
    console.log(`${t.label.padEnd(45)} | ${r.status.padEnd(14)} | found=${r.foundName ?? "-"}`);
  } catch (e) {
    console.log(`${t.label} | ERROR: ${e.message}`);
  }
}
