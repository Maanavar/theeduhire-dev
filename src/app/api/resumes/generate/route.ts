// POST /api/resumes/generate — Generate resume from profile with progress tracking
// Returns streaming progress updates via chunked response
// Auth: TEACHER

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";
import puppeteer from "puppeteer";

// Helper to send progress updates
function sendProgress(encoder: TextEncoder, writer: WritableStreamDefaultWriter, progress: number, message: string) {
  const data = `data: ${JSON.stringify({ progress, message })}\n\n`;
  return writer.write(encoder.encode(data));
}

const generateResumeSchema = z.object({
  template: z.enum(["ats-friendly", "modern", "minimal"]),
});

// Template HTML generators
function generateATSFriendly(profile: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.4; color: #333; margin: 0; padding: 20px; }
        h1 { margin: 0 0 10px 0; font-size: 24px; }
        h2 { margin: 15px 0 10px 0; font-size: 14px; font-weight: bold; border-bottom: 1px solid #000; }
        .header { margin-bottom: 15px; }
        .contact { font-size: 12px; margin-bottom: 5px; }
        .section { margin-bottom: 15px; }
        .job { margin-bottom: 10px; }
        .job-title { font-weight: bold; }
        .job-meta { font-size: 12px; color: #666; }
        ul { margin: 5px 0; padding-left: 20px; }
        li { margin: 3px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${profile.user.name}</h1>
        <div class="contact">${profile.user.email}</div>
        ${profile.user.phone ? `<div class="contact">${profile.user.phone}</div>` : ""}
        ${profile.city ? `<div class="contact">${profile.city}</div>` : ""}
      </div>

      ${profile.bio ? `
        <div class="section">
          <h2>PROFESSIONAL SUMMARY</h2>
          <p>${profile.bio}</p>
        </div>
      ` : ""}

      <div class="section">
        <h2>CORE COMPETENCIES</h2>
        <ul>
          ${profile.subjects.map((s: string) => `<li>${s}</li>`).join("")}
        </ul>
      </div>

      ${profile.experiences && profile.experiences.length > 0 ? `
        <div class="section">
          <h2>EXPERIENCE</h2>
          ${profile.experiences.map((exp: any) => `
            <div class="job">
              <div class="job-title">${exp.role} - ${exp.schoolName}</div>
              <div class="job-meta">${new Date(exp.startDate).getFullYear()} - ${exp.isCurrent ? 'Present' : new Date(exp.endDate).getFullYear()}</div>
              ${exp.description ? `<p>${exp.description}</p>` : ""}
            </div>
          `).join("")}
        </div>
      ` : ""}

      ${profile.certifications && profile.certifications.length > 0 ? `
        <div class="section">
          <h2>CERTIFICATIONS</h2>
          <ul>
            ${profile.certifications.map((cert: any) => `
              <li>${cert.name} - ${cert.issuedBy}</li>
            `).join("")}
          </ul>
        </div>
      ` : ""}

      <div class="section">
        <h2>QUALIFICATIONS</h2>
        <p>${profile.qualification || "N/A"}</p>
      </div>
    </body>
    </html>
  `;
}

function generateModern(profile: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; margin: -40px -40px 30px -40px; }
        h1 { margin: 0; font-size: 32px; }
        .contact { font-size: 13px; margin-top: 10px; opacity: 0.9; }
        h2 { color: #667eea; margin: 25px 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
        .section { margin-bottom: 20px; }
        .job { margin-bottom: 15px; }
        .job-title { font-weight: 600; color: #333; }
        .job-meta { font-size: 12px; color: #999; }
        ul { margin: 5px 0; padding-left: 20px; }
        li { margin: 5px 0; font-size: 13px; }
        p { margin: 5px 0; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${profile.user.name}</h1>
          <div class="contact">${profile.user.email} ${profile.user.phone ? `| ${profile.user.phone}` : ""} ${profile.city ? `| ${profile.city}` : ""}</div>
        </div>

        ${profile.bio ? `
          <div class="section">
            <h2>About</h2>
            <p>${profile.bio}</p>
          </div>
        ` : ""}

        <div class="section">
          <h2>Expertise</h2>
          <ul>
            ${profile.subjects.map((s: string) => `<li>${s}</li>`).join("")}
          </ul>
        </div>

        ${profile.experiences && profile.experiences.length > 0 ? `
          <div class="section">
            <h2>Experience</h2>
            ${profile.experiences.map((exp: any) => `
              <div class="job">
                <div class="job-title">${exp.role}</div>
                <div class="job-meta">${exp.schoolName} | ${new Date(exp.startDate).getFullYear()} - ${exp.isCurrent ? 'Present' : new Date(exp.endDate).getFullYear()}</div>
                ${exp.description ? `<p style="margin: 8px 0; font-size: 12px;">${exp.description}</p>` : ""}
              </div>
            `).join("")}
          </div>
        ` : ""}

        ${profile.certifications && profile.certifications.length > 0 ? `
          <div class="section">
            <h2>Certifications</h2>
            <ul>
              ${profile.certifications.map((cert: any) => `
                <li><strong>${cert.name}</strong> - ${cert.issuedBy}</li>
              `).join("")}
            </ul>
          </div>
        ` : ""}
      </div>
    </body>
    </html>
  `;
}

function generateMinimal(profile: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Courier New', monospace; line-height: 1.6; color: #222; margin: 0; padding: 30px; max-width: 600px; margin: 0 auto; }
        h1 { font-size: 20px; margin: 0 0 5px 0; font-weight: normal; }
        .contact { font-size: 11px; margin-bottom: 15px; }
        h2 { font-size: 11px; font-weight: bold; margin: 12px 0 8px 0; text-transform: uppercase; }
        .job { margin-bottom: 8px; }
        .job-title { font-weight: bold; }
        .job-meta { font-size: 11px; }
        ul { margin: 3px 0; padding-left: 15px; }
        li { margin: 2px 0; font-size: 11px; }
        p { margin: 3px 0; font-size: 11px; }
      </style>
    </head>
    <body>
      <h1>${profile.user.name}</h1>
      <div class="contact">${profile.user.email} ${profile.user.phone ? `/ ${profile.user.phone}` : ""} ${profile.city ? `/ ${profile.city}` : ""}</div>

      ${profile.bio ? `
        <h2>Summary</h2>
        <p>${profile.bio}</p>
      ` : ""}

      <h2>Subjects</h2>
      <ul>${profile.subjects.map((s: string) => `<li>${s}</li>`).join("")}</ul>

      ${profile.experiences && profile.experiences.length > 0 ? `
        <h2>Experience</h2>
        ${profile.experiences.map((exp: any) => `
          <div class="job">
            <div class="job-title">${exp.role}</div>
            <div class="job-meta">${exp.schoolName} | ${new Date(exp.startDate).getFullYear()}-${exp.isCurrent ? 'now' : new Date(exp.endDate).getFullYear()}</div>
          </div>
        `).join("")}
      ` : ""}

      ${profile.certifications && profile.certifications.length > 0 ? `
        <h2>Certifications</h2>
        <ul>${profile.certifications.map((cert: any) => `<li>${cert.name} (${cert.issuedBy})</li>`).join("")}</ul>
      ` : ""}
    </body>
    </html>
  `;
}

export async function POST(req: NextRequest) {
  let browser;

  // Use streaming response for progress updates
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      const auth = await requireAuth(["TEACHER"]);
      if ("error" in auth) {
        await sendProgress(encoder, writer, 0, "Authentication failed");
        await writer.close();
        return;
      }

      const body = await req.json();
      const parsed = generateResumeSchema.safeParse(body);

      if (!parsed.success) {
        await sendProgress(encoder, writer, 0, "Invalid request");
        await writer.close();
        return;
      }

      // Step 1: Fetch profile (0-20%)
      await sendProgress(encoder, writer, 5, "Fetching your profile...");
      const profile = await prisma.teacherProfile.findUnique({
        where: { userId: auth.user.id },
        include: {
          experiences: { orderBy: { startDate: "desc" } },
          certifications: { orderBy: { issuedAt: "desc" } },
        },
      });

      if (!profile) {
        await sendProgress(encoder, writer, 10, "Please complete your profile first");
        await writer.close();
        return;
      }

      await sendProgress(encoder, writer, 15, "Loading user data...");
      const user = await prisma.user.findUnique({
        where: { id: auth.user.id },
        select: { name: true, email: true, phone: true },
      });

      if (!user) {
        await sendProgress(encoder, writer, 20, "User not found");
        await writer.close();
        return;
      }

      // Step 2: Generate HTML (20-40%)
      await sendProgress(encoder, writer, 25, "Generating document format...");
      const profileData = { ...profile, user };

      let html = "";
      if (parsed.data.template === "ats-friendly") {
        html = generateATSFriendly(profileData);
      } else if (parsed.data.template === "modern") {
        html = generateModern(profileData);
      } else {
        html = generateMinimal(profileData);
      }
      await sendProgress(encoder, writer, 40, "Converting to PDF...");

      // Step 3: Generate PDF (40-70%)
      browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      await sendProgress(encoder, writer, 50, "Rendering PDF...");

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      await sendProgress(encoder, writer, 60, "Processing document...");

      const pdfBuffer = await page.pdf({ format: "A4", margin: { top: 0, right: 0, bottom: 0, left: 0 } });
      await browser.close();
      await sendProgress(encoder, writer, 70, "Uploading to cloud storage...");

      // Step 4: Upload to storage (70-90%)
      const fileName = `${parsed.data.template}-resume-${Date.now()}.pdf`;
      const storagePath = `${auth.user.id}/${fileName}`;

      await sendProgress(encoder, writer, 75, "Finalizing upload...");
      const { error: uploadError } = await supabaseAdmin.storage
        .from("Resumes")
        .upload(storagePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        await sendProgress(encoder, writer, 80, "Upload failed");
        await writer.close();
        return;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("Resumes")
        .getPublicUrl(storagePath);

      // Step 5: Save to database (90-100%)
      await sendProgress(encoder, writer, 85, "Saving to database...");
      const resume = await prisma.resume.create({
        data: {
          userId: auth.user.id,
          fileUrl: urlData.publicUrl,
          fileName: `Resume-${parsed.data.template}.pdf`,
          fileSize: pdfBuffer.length,
          isGenerated: true,
          template: parsed.data.template,
          generatedData: {
            profileId: profile.id,
            generatedAt: new Date().toISOString(),
          },
        },
      });

      await sendProgress(encoder, writer, 95, "Finalizing...");

      // Small delay to ensure 95% is processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send final 100% message with result
      const finalData = `data: ${JSON.stringify({
        progress: 100,
        message: "Resume generated successfully!",
        success: true,
        result: {
          id: resume.id,
          fileUrl: resume.fileUrl,
          fileName: resume.fileName,
          isGenerated: true,
          template: parsed.data.template,
          uploadedAt: resume.uploadedAt,
        },
      })}\n\n`;

      await writer.write(encoder.encode(finalData));

      // Give time for the 100% to be received before closing
      await new Promise(resolve => setTimeout(resolve, 100));
      await writer.close();
    } catch (error) {
      console.error("POST /api/resumes/generate error:", error);
      try {
        await sendProgress(encoder, writer, 0, "Error generating resume");
      } catch (e) {
        // Writer might already be closed
      }
      try {
        await writer.close();
      } catch (e) {
        // Already closed
      }
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          // Already closed
        }
      }
    }
  })();

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
