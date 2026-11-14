"""Build the one-page CV and ATS resume PDFs in output/resume/.

    python scripts/build_resume_pdfs.py

Both files share the content below. The CV puts dates in a right-hand column and
rules under section headings; the ATS version keeps everything inline in a single
text column so applicant tracking systems read it in order.
Needs: pip install reportlab (and Calibri, which ships with Windows).
"""
import os
from reportlab.lib.colors import black, HexColor
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output", "resume")
FONTS = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
pdfmetrics.registerFont(TTFont("Calibri", os.path.join(FONTS, "calibri.ttf")))
pdfmetrics.registerFont(TTFont("Calibri-Bold", os.path.join(FONTS, "calibrib.ttf")))
pdfmetrics.registerFontFamily("Calibri", normal="Calibri", bold="Calibri-Bold")

# ---------------------------------------------------------------- content
NAME = "Jervil Angelo D. De Leon"
TITLE = "IT Support | Cloud Infrastructure (AWS)"
CONTACT = [
    'Makati City, Philippines | +63 962 586 5208 | <a href="mailto:deleonangelojervil@gmail.com">deleonangelojervil@gmail.com</a>',
    '<a href="https://jervilangelo.online">jervilangelo.online</a> | '
    '<a href="https://www.linkedin.com/in/jervilangelo">linkedin.com/in/jervilangelo</a> | '
    '<a href="https://github.com/jervilangelo">github.com/jervilangelo</a>',
]
SUMMARY = (
    "IT support professional in HRIS and field engineering roles who builds and tests AWS infrastructure in personal "
    "projects. Wrote the Terraform for a disaster recovery proof of concept with CI checks and timed recovery drills, "
    "built an event-driven incident response platform with approved, audited remediation, and runs a live serverless "
    "application on AWS. Hands-on with IAM, VPC networking, monitoring, Linux and automation, and moving toward cloud "
    "infrastructure and reliability work."
)
SKILLS = [
    ("AWS (hands-on)", "EC2, VPC, IAM, IAM Identity Center, S3, Lambda, API Gateway, DynamoDB, EventBridge, SNS, "
                       "CloudWatch, Systems Manager, EBS, Cognito, AppSync, Amplify, CloudFront, AWS Budgets"),
    ("IaC &amp; CI/CD", "Terraform, GitHub Actions, TFLint, Trivy, Git, Docker Compose (local and CI tests), "
                        "disaster recovery testing"),
    ("Linux &amp; Networking", "Amazon Linux 2023, Nginx, TCP/IP, DNS, DHCP, subnetting, routing, security groups, "
                               "VPC endpoints, VLANs"),
    ("Scripting &amp; Automation", "Python, TypeScript, PowerShell, Bash, C#, REST APIs, Power Automate, Power BI"),
]


def link(url, text):
    return f'<a href="{url}">{text}</a>'


GH = "https://github.com/jervilangelo/"
PROJECTS = [
    ("BayanihanDR: AWS Disaster Recovery (proof of concept)",
     "Terraform, EC2, S3, GitHub Actions | " + link(GH + "bayanihan-dr", "GitHub"), "Nov 2026", [
        "Wrote five Terraform modules that keep a low-cost standby and, on approval, create an IMDSv2-only EC2 recovery "
        "host with no inbound ports; state lives in an encrypted S3 backend, and access uses IAM Identity Center and "
        "Session Manager.",
        "Validated with GitHub Actions CI (terraform fmt, validate, test on a mocked provider, TFLint, Trivy) and real "
        "AWS drills: the final drill restored the PostgreSQL app in 5 min 29 s with 26 s of data loss (synthetic data; "
        "targets 30/60 min).",
    ]),
    ("Opsentra: AWS Incident Response Platform",
     "Lambda, EventBridge, Systems Manager, Terraform | " + link(GH + "opsentra", "GitHub"), "Nov 2026", [
        "Built an event-driven incident pipeline: a probe Lambda feeds a CloudWatch alarm that EventBridge routes to "
        "Lambda, which opens one deduplicated incident in DynamoDB and sends one SNS alert; a reconciler catches missed "
        "events.",
        "Limited fixes to allowlisted, hash-pinned SSM runbooks that an operator requests and an admin approves (Cognito "
        "roles, JWT on API Gateway); incidents close only after 3 healthy probes. Tested with pytest, Vitest and "
        "Playwright.",
    ]),
    ("Teolohiya.site: Serverless Web Application",
     "Amplify Gen 2, Cognito, AppSync, DynamoDB | " + link("https://teolohiya.site", "Live site"), "2026", [
        "Run a live, moderated listing site where Cognito groups and IAM roles gate access, AppSync serves GraphQL over "
        "DynamoDB, and Lambda performs every approval, so unreviewed listings and photos stay out of the public table "
        "and S3 path.",
        "Backend defined as code with Amplify Gen 2 (CDK/CloudFormation) and released through sandbox testing; no NAT "
        "gateway or always-on compute.",
    ]),
    ("Serverless Ticketing API",
     "API Gateway, Lambda (Python), DynamoDB, SNS, CloudWatch | " + link(GH + "aws-serverless-ticketing-api", "GitHub"),
     "Oct 2026", [
        "Built six HTTP API routes on DynamoDB with a status index and priority-based SLA due dates; a DynamoDB Streams "
        "trigger sends Critical tickets to SNS email.",
        "Scoped one IAM role per Lambda to specific table, index, stream and topic ARNs, throttled the API to 5 "
        "requests/s, and added JSON logs and a CloudWatch error alarm.",
    ]),
    ("Secure EC2 Web Server", "VPC, EC2, IAM, EBS, Nginx | " + link(GH + "secure-ec2-web-server", "GitHub"), "2026", [
        "Built a custom VPC (10.0.0.0/16) with subnet, internet gateway and route table to serve Nginx on Amazon Linux "
        "2023; limited SSH to one IP, added an instance role for Session Manager, root MFA, an EBS snapshot and a budget "
        "alert.",
    ]),
]
EXPERIENCE = [
    ("HRIS Technical Support (Level 1)", "First Maritime Shared Services / PTC Group, Makati", "Jul 2026 – Present", [
        "Provide Level 1 application support for seafarers and office staff on a cloud HRIS: triage issues, guide users "
        "to resolution and escalate complex cases.",
        "Built a daily Power Automate flow that scans SharePoint, flags templates untouched for 7+ days and upserts their "
        "status into an Excel Online table behind a Power BI dashboard, replacing manual checks of about 29 templates "
        "across 9 business units.",
        "Support the HRIS rollout with the vendor and internal teams: data gathering, template validation and issue "
        "follow-up.",
    ]),
    ("Field / Onsite Engineer", "HP Service Center / Actionlabs IT Services Phils Corp, Makati", "May 2025 – Nov 2025", [
        "Diagnosed and repaired hardware, OS and peripheral faults on HP laptops, workstations, printers and POS systems "
        "at client sites; reinstalled operating systems, explained findings to users and recorded each service action.",
    ]),
    ("IT Intern / C# Programmer", "TechFactors Inc., Quezon City", "Jan 2024 – Jul 2024", [
        "Developed front-end and back-end features, including REST API work, for company C# applications.",
    ]),
]
CERTS = [
    ("AWS Certified Cloud Practitioner", "Amazon Web Services", "Oct 2026",
     "https://www.credly.com/badges/288410a2-4082-4f35-aa7a-b700e636a4ae/public_url"),
    ("AWS Certified AI Practitioner", "Amazon Web Services", "Jul 2026",
     "https://www.credly.com/badges/69244e1f-ff05-4cae-99f3-bb521c658079/public_url"),
    ("Oracle Cloud Infrastructure Foundations Associate", "Oracle", "Oct 2026",
     "https://catalog-education.oracle.com/ords/certview/sharebadge_m?id=3FA5AF9333F9ED712E262BA8A86421975241ECDD293F362F8F83AC2D94639242"),
    ("Oracle Cloud Infrastructure AI Foundations Associate", "Oracle", "Oct 2026",
     "https://catalog-education.oracle.com/ords/certview/sharebadge?id=65E6F94D89BDDF6F2491DC77B17697DCB7B66918AFA5D572592CC413CF23709E"),
]
TRAINING = ("Google IT Support Professional Certificate (2026); Cisco CCNA ITN (2021) and SRWE (2022); "
            "NDG Linux Essentials (2023)")
EDUCATION = ("BS Information Technology, Major in Animation and Game Development", "FEU Institute of Technology", "2025")

# ---------------------------------------------------------------- layout
MARGIN = 41
WIDTH = A4[0] - 2 * MARGIN
DATE_W = 100
BODY = ParagraphStyle("body", fontName="Calibri", fontSize=9.5, leading=11.4, textColor=black)
NAME_S = ParagraphStyle("name", parent=BODY, fontName="Calibri-Bold", fontSize=18, leading=21)
TITLE_S = ParagraphStyle("title", parent=BODY, fontSize=10.5, leading=13)
HEAD_S = ParagraphStyle("head", parent=BODY, fontName="Calibri-Bold", fontSize=10.5, leading=12.5, spaceBefore=5)
BULLET_S = ParagraphStyle("bullet", parent=BODY, leftIndent=13, bulletIndent=3)
DATE_S = ParagraphStyle("date", parent=BODY, alignment=TA_RIGHT)
RULE = HexColor("#333333")


def build(path, cv):
    story = [Paragraph(NAME, NAME_S), Paragraph(TITLE, TITLE_S)]
    story += [Paragraph(c, BODY) for c in CONTACT]

    def heading(text):
        story.append(Paragraph(text, HEAD_S))
        if cv:
            story.append(HRFlowable(width="100%", thickness=0.6, color=RULE, spaceBefore=1, spaceAfter=3))
        else:
            story.append(Spacer(1, 2))

    def entry(left, date):
        if cv:
            t = Table([[Paragraph(left, BODY), Paragraph(date, DATE_S)]], colWidths=[WIDTH - DATE_W, DATE_W])
            t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                   ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 1.5),
                                   ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
            story.append(t)
        else:
            story.append(Spacer(1, 1.5))
            story.append(Paragraph(f"{left} | {date}", BODY))

    def bullets(items):
        story.extend(Paragraph(b, BULLET_S, bulletText="•") for b in items)

    heading("PROFESSIONAL SUMMARY")
    story.append(Paragraph(SUMMARY, BODY))
    heading("TECHNICAL SKILLS")
    story += [Paragraph(f"<b>{k}:</b> {v}", BODY) for k, v in SKILLS]
    heading("SELECTED PROJECTS")
    for name, meta, date, items in PROJECTS:
        entry(f"<b>{name}</b> | {meta}", date)
        bullets(items)
    heading("PROFESSIONAL EXPERIENCE")
    for role, org, date, items in EXPERIENCE:
        entry(f"<b>{role}</b> | {org}", date)
        bullets(items)
    heading("CERTIFICATIONS")
    story += [Paragraph(f'<b>{n}</b> | {o} | {d} | <u><a href="{u}">Verify</a></u>', BODY) for n, o, d, u in CERTS]
    story.append(Paragraph(f"<b>Training:</b> {TRAINING}", BODY))
    heading("EDUCATION")
    entry(f"<b>{EDUCATION[0]}</b> | {EDUCATION[1]}", EDUCATION[2])

    # the page frame adds 6pt of padding on every side, so subtract it to land text at MARGIN
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=MARGIN - 6, rightMargin=MARGIN - 6, topMargin=30,
                            bottomMargin=22,
                            title=f"{NAME} - Resume", author=NAME)
    doc.build(story)


if __name__ == "__main__":
    build(os.path.join(OUT, "Comprehensive-CV.pdf"), cv=True)
    build(os.path.join(OUT, "ATS-Optimized-Resume.pdf"), cv=False)
    print("Built Comprehensive-CV.pdf and ATS-Optimized-Resume.pdf")
