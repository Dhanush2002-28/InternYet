import { jsPDF } from "jspdf";
import { organization } from "../../config/organization";
import { formatDate } from "../../utils/format";

function addHeader(doc, margin, width) {
  let y = 60;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(23, 26, 32);
  doc.text(organization.name, margin, y);
  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 106, 116);
  doc.text(organization.addressLine1, margin, y);
  y += 11;
  doc.text(
    `${organization.addressLine2}  |  ${organization.email}  |  ${organization.phone}`,
    margin,
    y
  );
  y += 12;
  doc.setDrawColor(214, 219, 226);
  doc.setLineWidth(1);
  doc.line(margin, y, width - margin, y);
  return y + 24;
}

export function generateOfferLetterPdf(student) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 56;
  const usable = width - margin * 2;

  const offer = student.offerLetter || { number: "DRAFT", issuedAt: new Date().toISOString() };
  const start = new Date(offer.issuedAt);
  const end = new Date(start.getTime() + organization.durationWeeks * 7 * 86400000);
  const firstName = String(student.name || "Student").split(" ")[0];

  let y = addHeader(doc, margin, width);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 66, 76);
  doc.text(`Ref: ${offer.number}`, margin, y);
  doc.text(`Date: ${formatDate(offer.issuedAt)}`, width - margin, y, { align: "right" });
  y += 30;

  doc.text("To,", margin, y);
  y += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(23, 26, 32);
  doc.text(student.name || "Student", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 66, 76);
  if (student.university) {
    doc.text(student.university, margin, y);
    y += 13;
  }
  if (student.address) {
    doc.text(student.address, margin, y);
    y += 13;
  }
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(23, 26, 32);
  doc.text(`Subject: Offer of Internship - ${organization.program}`, margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(52, 58, 68);

  const para = (text, gap = 14) => {
    const lines = doc.splitTextToSize(text, usable);
    doc.text(lines, margin, y);
    y += lines.length * 13 + gap;
  };

  para(`Dear ${firstName},`);
  para(
    `We are pleased to offer you the position of Intern with ${organization.name} as part of our ${organization.program}. This offer letter, together with the details of your profile maintained on the ${organization.shortName}, confirms your selection for the program.`
  );
  para("The terms of your internship are as follows:");

  const rows = [
    ["Position", "Intern"],
    ["Program", organization.program],
    ["Duration", `${organization.duration} (${formatDate(start)} to ${formatDate(end)})`],
    ["Stream / Department", student.branch || "Technology"],
    ["Mode", "Online (classes conducted live on Google Meet)"],
    ["Stipend", organization.stipend]
  ];
  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin + 14, y);
    doc.setFont("helvetica", "normal");
    const valueLines = doc.splitTextToSize(value, usable - 180);
    doc.text(valueLines, margin + 166, y);
    y += Math.max(valueLines.length, 1) * 13 + 5;
  });
  y += 8;

  para(
    `All program communication, class schedules and official documents are available on the ${organization.shortName}. Successful completion of the program, along with the assessment by your mentor, is required to receive the internship completion certificate.`
  );
  para(
    "We look forward to welcoming you to the program and to the contribution you will make during your internship."
  );
  y += 12;

  para("Sincerely,", 4);
  y += 8;
  doc.setDrawColor(23, 26, 32);
  doc.setLineWidth(0.8);
  doc.line(width - margin - 170, y - 5, width - margin, y - 5);
  y += 13;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(23, 26, 32);
  doc.text(organization.signatoryName, width - margin, y, { align: "right" });
  y += 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 106, 116);
  doc.text(organization.signatoryTitle, width - margin, y, { align: "right" });
  y += 13;
  doc.text(organization.name, width - margin, y, { align: "right" });

  doc.setFontSize(8.5);
  doc.setTextColor(140, 146, 156);
  doc.text(
    `This is a system-generated offer letter from the ${organization.shortName}. Ref: ${offer.number}`,
    width / 2,
    height - 40,
    { align: "center" }
  );

  return doc;
}