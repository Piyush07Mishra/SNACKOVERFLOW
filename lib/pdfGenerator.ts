import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function generatePDFFromHTML(
  elementId: string,
  filename: string,
  orientation: "portrait" | "landscape" = "portrait"
) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error("Element not found");
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgWidth = orientation === "landscape" ? 297 : 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: orientation === "landscape" ? "a4" : "a4",
    });

    let heightLeft = imgHeight;
    let position = 0;
    const imgData = canvas.toDataURL("image/png");
    const pageHeight = pdf.internal.pageSize.getHeight();

    while (heightLeft >= 0) {
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      if (heightLeft > 0) {
        pdf.addPage();
        position -= pageHeight;
      }
    }

    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
}

export async function generatePayslipPDF(
  employeeName: string,
  month: string,
  payslipData: {
    basicSalary: number;
    payableDays: number;
    unpaidLeaves: number;
    pfDeduction: number;
    professionalTax: number;
    totalEarnings: number;
    totalDeductions: number;
    netSalary: number;
    status: string;
  }
) {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    const lineHeight = 7;

    // Header
    pdf.setFontSize(18);
    pdf.text("PAYSLIP", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Employee Info
    pdf.setFontSize(10);
    pdf.text(`Employee: ${employeeName}`, 20, yPosition);
    yPosition += lineHeight;
    pdf.text(`Month: ${month}`, 20, yPosition);
    yPosition += lineHeight + 5;

    // Attendance Section
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("ATTENDANCE", 20, yPosition);
    yPosition += lineHeight;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Payable Days: ${payslipData.payableDays}`, 25, yPosition);
    yPosition += lineHeight;
    pdf.text(`Unpaid Leaves: ${payslipData.unpaidLeaves}`, 25, yPosition);
    yPosition += lineHeight + 5;

    // Earnings Section
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("EARNINGS", 20, yPosition);
    yPosition += lineHeight;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Basic Salary: ₹${payslipData.basicSalary.toFixed(2)}`, 25, yPosition);
    yPosition += lineHeight;
    pdf.text(
      `Total Earnings (Prorated): ₹${payslipData.totalEarnings.toFixed(2)}`,
      25,
      yPosition
    );
    yPosition += lineHeight + 5;

    // Deductions Section
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("DEDUCTIONS", 20, yPosition);
    yPosition += lineHeight;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`PF Deduction (12%): ₹${payslipData.pfDeduction.toFixed(2)}`, 25, yPosition);
    yPosition += lineHeight;
    pdf.text(
      `Professional Tax: ₹${payslipData.professionalTax.toFixed(2)}`,
      25,
      yPosition
    );
    yPosition += lineHeight;
    pdf.text(
      `Total Deductions: ₹${payslipData.totalDeductions.toFixed(2)}`,
      25,
      yPosition
    );
    yPosition += lineHeight + 5;

    // Net Salary
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(`NET SALARY: ₹${payslipData.netSalary.toFixed(2)}`, 20, yPosition);
    yPosition += lineHeight + 5;

    // Status
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Status: ${payslipData.status}`, 20, yPosition);

    // Footer
    pdf.setFontSize(8);
    pdf.text(
      "This is an electronically generated payslip.",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    pdf.save(`payslip-${month}-${employeeName}.pdf`);
  } catch (error) {
    console.error("Error generating payslip PDF:", error);
    throw new Error("Failed to generate payslip PDF");
  }
}

export function generatePayrollReportPDF(
  payrollRecords: any[],
  title: string = "Payroll Report"
) {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;
    const lineHeight = 7;

    // Header
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Date
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Summary Statistics
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("SUMMARY", 20, yPosition);
    yPosition += lineHeight + 3;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const totalEmployees = payrollRecords.length;
    const totalPayroll = payrollRecords.reduce((sum, record) => sum + record.netSalary, 0);
    const totalDeductions = payrollRecords.reduce((sum, record) => sum + record.totalDeductions, 0);
    const paidCount = payrollRecords.filter(r => r.status === "Paid").length;
    
    pdf.text(`Total Employees: ${totalEmployees}`, 25, yPosition);
    yPosition += lineHeight;
    pdf.text(`Total Payroll: ₹${totalPayroll.toLocaleString()}`, 25, yPosition);
    yPosition += lineHeight;
    pdf.text(`Total Deductions: ₹${totalDeductions.toLocaleString()}`, 25, yPosition);
    yPosition += lineHeight;
    pdf.text(`Paid Employees: ${paidCount}/${totalEmployees}`, 25, yPosition);
    yPosition += lineHeight + 5;

    // Table Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    const headers = ["Employee", "Month", "Basic", "Payable\nDays", "Unpaid\nLeaves", "PF\nDeduction", "Prof.\nTax", "Total\nEarnings", "Total\nDeductions", "Net\nSalary", "Status"];
    const colWidths = [35, 25, 25, 15, 15, 20, 15, 25, 20, 25, 20];
    let xPosition = 10;

    headers.forEach((header, i) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += colWidths[i];
    });

    yPosition += lineHeight + 5;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(10, yPosition, 200, yPosition);
    yPosition += lineHeight;

    // Table Data
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    payrollRecords.forEach((record) => {
      if (yPosition > 260) {
        pdf.addPage();
        yPosition = 20;
        
        // Re-add header on new page
        pdf.setFont("helvetica", "bold");
        xPosition = 10;
        headers.forEach((header, i) => {
          pdf.text(header, xPosition, yPosition);
          xPosition += colWidths[i];
        });
        yPosition += lineHeight + 5;
        pdf.setDrawColor(200, 200, 200);
        pdf.line(10, yPosition, 200, yPosition);
        yPosition += lineHeight;
        pdf.setFont("helvetica", "normal");
      }

      xPosition = 10;
      const row = [
        record.userName || "-",
        record.month || "-",
        `₹${record.basicSalary.toLocaleString()}`,
        record.payableDays.toString(),
        record.unpaidLeaves.toString(),
        `₹${record.pfDeduction.toFixed(0)}`,
        `₹${record.professionalTax}`,
        `₹${record.totalEarnings.toLocaleString()}`,
        `₹${record.totalDeductions.toLocaleString()}`,
        `₹${record.netSalary.toLocaleString()}`,
        record.status || "-"
      ];

      row.forEach((cell, i) => {
        pdf.text(String(cell), xPosition, yPosition);
        xPosition += colWidths[i];
      });

      yPosition += lineHeight;
    });

    pdf.save(`${title.toLowerCase().replace(/ /g, "-")}.pdf`);
  } catch (error) {
    console.error("Error generating payroll report PDF:", error);
    throw new Error("Failed to generate payroll report PDF");
  }
}

export function generateEmployeeReportPDF(
  employees: any[],
  title: string = "Employee Directory Report"
) {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;
    const lineHeight = 7;

    // Header
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Date
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Table Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    const headers = ["Name", "Email", "Role", "Department", "Designation"];
    const colWidths = [40, 50, 30, 35, 35];
    let xPosition = 10;

    headers.forEach((header, i) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += colWidths[i];
    });

    yPosition += lineHeight + 2;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(10, yPosition, 200, yPosition);
    yPosition += lineHeight;

    // Table Data
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    employees.forEach((emp) => {
      if (yPosition > 280) {
        pdf.addPage();
        yPosition = 20;
      }

      xPosition = 10;
      const row = [
        emp.name || "-",
        emp.email || "-",
        emp.role?.replace("_", " ") || "-",
        emp.department || "-",
        emp.designation || "-",
      ];

      row.forEach((cell, i) => {
        pdf.text(String(cell), xPosition, yPosition);
        xPosition += colWidths[i];
      });

      yPosition += lineHeight;
    });

    pdf.save(`${title.toLowerCase().replace(/ /g, "-")}.pdf`);
  } catch (error) {
    console.error("Error generating report PDF:", error);
    throw new Error("Failed to generate report PDF");
  }
}
