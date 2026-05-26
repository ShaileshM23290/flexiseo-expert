/** Letter grades aligned with SEOptimer-style scoring */
export function scoreToGrade(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}

export function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-emerald-600";
  if (grade.startsWith("B")) return "text-lime-600";
  if (grade.startsWith("C")) return "text-amber-600";
  if (grade.startsWith("D")) return "text-orange-600";
  return "text-rose-600";
}

export function gradeBg(grade: string): string {
  if (grade.startsWith("A")) return "bg-emerald-50 border-emerald-200";
  if (grade.startsWith("B")) return "bg-lime-50 border-lime-200";
  if (grade.startsWith("C")) return "bg-amber-50 border-amber-200";
  if (grade.startsWith("D")) return "bg-orange-50 border-orange-200";
  return "bg-rose-50 border-rose-200";
}

export function overallVerdict(score: number): { title: string; description: string } {
  const grade = scoreToGrade(score);
  if (grade.startsWith("A"))
    return {
      title: "Your site is in great shape",
      description:
        "Strong SEO fundamentals detected. Address remaining notices to maintain a competitive edge.",
    };
  if (grade.startsWith("B"))
    return {
      title: "Your page could be better",
      description:
        "Good foundation with room for improvement. Focus on warnings and quick wins in the action plan.",
    };
  if (grade.startsWith("C"))
    return {
      title: "Several SEO issues need attention",
      description:
        "Important on-page, usability, or performance gaps may limit visibility. Prioritize critical fixes.",
    };
  return {
    title: "Significant SEO improvements needed",
    description:
      "Multiple critical issues detected. Work through the prioritized action plan to improve rankings potential.",
  };
}
