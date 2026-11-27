"""Build the three career documents in output/resume/.

    python scripts/build_resume_pdfs.py

Professional-Resume.pdf: one page, US Letter, navy headings.
Comprehensive-CV.pdf:    detailed A4 CV with right-aligned dates.
ATS-Optimized-Resume.pdf: single-column A4 text for applicant tracking systems.
Needs: pip install reportlab (and Calibri, which ships with Windows).
"""
import os
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4, LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (HRFlowable, KeepTogether, Paragraph, SimpleDocTemplate,
                                Spacer, Table, TableStyle)

FONT_DIR = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
pdfmetrics.registerFont(TTFont("Calibri", f"{FONT_DIR}/calibri.ttf"))
pdfmetrics.registerFont(TTFont("Calibri-Bold", f"{FONT_DIR}/calibrib.ttf"))
pdfmetrics.registerFont(TTFont("Calibri-Italic", f"{FONT_DIR}/calibrii.ttf"))
pdfmetrics.registerFont(TTFont("Calibri-BoldItalic", f"{FONT_DIR}/calibriz.ttf"))
pdfmetrics.registerFontFamily("Calibri", normal="Calibri", bold="Calibri-Bold",
                              italic="Calibri-Italic", boldItalic="Calibri-BoldItalic")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "output", "resume")

NAME = "Jervil Angelo D. De Leon"
PHONE = "+63 962 586 5208"
EMAIL = "deleonangelojervil@gmail.com"
LOCATION = "Makati City, Philippines"
GH = "https://github.com/jervilangelo"


def link(url, text=None, color=None):
    text = text or url.replace("https://", "").replace("mailto:", "")
    c = f' color="{color}"' if color else ""
    return f'<link href="{url}"{c}>{text}</link>'


CRED = {
    "ccp": "https://www.credly.com/badges/288410a2-4082-4f35-aa7a-b700e636a4ae/public_url",
    "aip": "https://www.credly.com/badges/69244e1f-ff05-4cae-99f3-bb521c658079/public_url",
    "oci": "https://catalog-education.oracle.com/ords/certview/sharebadge_m?id=3FA5AF9333F9ED712E262BA8A86421975241ECDD293F362F8F83AC2D94639242",
    "ociai": "https://catalog-education.oracle.com/ords/certview/sharebadge?id=65E6F94D89BDDF6F2491DC77B17697DCB7B66918AFA5D572592CC413CF23709E",
}


class Kit:
    """Paragraph styles for one document."""

    def __init__(self, body, accent, head_size, name_size, lead=1.18, bullet_space=0.6):
        self.accent = accent
        self.body = ParagraphStyle("body", fontName="Calibri", fontSize=body,
                                   leading=body * lead, alignment=TA_LEFT)
        self.small = ParagraphStyle("small", parent=self.body)
        self.name = ParagraphStyle("name", parent=self.body, fontName="Calibri-Bold",
                                   fontSize=name_size, leading=name_size * 1.15,
                                   textColor=accent)
        self.head = ParagraphStyle("head", parent=self.body, fontName="Calibri-Bold",
                                   fontSize=head_size, leading=head_size * 1.2,
                                   textColor=accent, spaceBefore=6, spaceAfter=1,
                                   keepWithNext=1)
        self.sub = ParagraphStyle("sub", parent=self.body, fontName="Calibri-Bold",
                                  spaceBefore=2.5)
        self.bullet = ParagraphStyle("bullet", parent=self.body, leftIndent=11,
                                     bulletIndent=2, spaceBefore=bullet_space)
        self.right = ParagraphStyle("right", parent=self.body, alignment=TA_RIGHT)

    def H(self, text, rule_width=0.8):
        rule = HRFlowable(width="100%", thickness=rule_width, color=self.accent,
                          spaceBefore=0, spaceAfter=2.5)
        rule.keepWithNext = 1  # never leave a heading alone at the bottom of a page
        return [Paragraph(text.upper(), self.head), rule]

    def P(self, text, style=None):
        return Paragraph(text, style or self.body)

    def B(self, items):
        return [Paragraph(t, self.bullet, bulletText="\u2022") for t in items]

    def row(self, left, right, width):
        """Left text with a right-aligned date (layout table; not used in the ATS file)."""
        title, _, rest = left.partition(" | ")
        left = f"<b>{title}</b>" + (f" | {rest}" if rest else "")
        style = ParagraphStyle("rowl", parent=self.body, spaceBefore=self.sub.spaceBefore)
        t = Table([[Paragraph(left, style), Paragraph(right, self.right)]],
                  colWidths=[width * 0.80, width * 0.20])
        t.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0),
                               ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                               ("TOPPADDING", (0, 0), (-1, -1), 3.5),
                               ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                               ("VALIGN", (0, 0), (-1, -1), "BOTTOM")]))
        return t


def build(path, pagesize, margins, story, title, subject):
    doc = SimpleDocTemplate(path, pagesize=pagesize, leftMargin=margins[0],
                            rightMargin=margins[0], topMargin=margins[1],
                            bottomMargin=margins[1], title=title, author=NAME,
                            subject=subject, creator=NAME)
    doc.build(story)


# =====================================================================================
# 1. PROFESSIONAL RESUME (Letter, navy identity of the original Word resume, one page)
# =====================================================================================
def resume():
    navy = colors.HexColor("#1F3A5F")
    k = Kit(body=9.6, accent=navy, head_size=10.8, name_size=18, lead=1.15, bullet_space=0.3)
    k.head.spaceBefore = 4.5
    hdr = ParagraphStyle("hdr", parent=k.body, spaceBefore=2.5)
    s = []
    s.append(k.P(NAME.upper(), k.name))
    s.append(k.P("IT Support Professional Moving into Cloud Engineering | AWS, Terraform, Serverless, "
                 "Linux, Networking", ParagraphStyle("t", parent=k.body, fontSize=10.6, leading=13)))
    s.append(k.P(f"{LOCATION} | {PHONE} | {link('mailto:' + EMAIL, EMAIL)}"))
    s.append(k.P(f"{link('https://www.linkedin.com/in/jervilangelo', 'linkedin.com/in/jervilangelo')} | "
                 f"{link(GH, 'github.com/jervilangelo')} | {link('https://jervilangelo.online', 'jervilangelo.online')}"))

    s += k.H("Summary")
    s.append(k.P(
        "IT support professional (HRIS application support, field engineering) moving into cloud "
        "engineering through hands-on AWS projects. Built and runs <b>Resolve</b> in production, a "
        "serverless AWS platform defined in Terraform and deployed by GitHub Actions through OIDC; also "
        "built a Terraform disaster recovery proof of concept and an event-driven incident response "
        "platform. Brings daily triage, escalation and documentation habits. AWS Certified Cloud "
        "Practitioner, preparing for Solutions Architect – Associate (SAA-C03)."))

    s += k.H("Technical Skills")
    for label, val in [
        ("AWS", "Lambda, API Gateway, DynamoDB, Cognito, SQS, SES, SNS, EventBridge, CloudWatch, IAM, "
                "S3, Route 53, KMS, Amplify, EC2, VPC, Systems Manager, IAM Identity Center, Budgets"),
        ("IaC and CI/CD", "Terraform (modules, remote state, terraform test), GitHub Actions (OIDC), "
                          "Checkov, TFLint, Trivy, Playwright, Git"),
        ("Networking", "TCP/IP, DNS (Route 53, DNSSEC, SPF/DKIM/DMARC), DHCP, subnetting, routing, "
                       "security groups, VPC endpoints"),
        ("Systems and scripting", "Linux (Amazon Linux 2023), Windows Server, Nginx; Python, "
                                  "TypeScript, Bash, PowerShell, C#, REST APIs"),
    ]:
        s.append(k.P(f"<b>{label}:</b> {val}", ParagraphStyle("sk", parent=k.body, spaceBefore=0.5)))

    s += k.H("Cloud Projects (Personal)")
    s.append(k.P(f"<b>Resolve: Serverless Platform on AWS (live in production)</b> | Nov 2026 – Present | "
                 f"{link(GH + '/resolve', 'github.com/jervilangelo/resolve')} | "
                 f"{link('https://getresolved.site', 'getresolved.site')}", hdr))
    s.append(k.P("<i>Terraform, Lambda, API Gateway, DynamoDB, Cognito, SQS, SES, EventBridge, CloudWatch, "
                 "Amplify, GitHub Actions</i>"))
    s += k.B([
        "Built the backend for a browser extension and Next.js dashboard: an API Gateway HTTP API (35 "
        "routes, 32 behind a Cognito JWT authorizer) on Node.js 22 Lambda and single-table DynamoDB.",
        "Defined dev and production, in separate AWS accounts, with 10 Terraform modules; GitHub Actions "
        "runs 200+ unit tests, Playwright E2E, terraform validate and Checkov, then deploys through OIDC "
        "(no stored AWS keys) and runs live integration tests.",
        "Built email alerts on a transactional outbox: DynamoDB Streams, a relay Lambda, SQS with a "
        "dead-letter queue and SES (DKIM, SPF, DMARC), with idempotency keys and retries.",
        "Scoped each Lambda role to its DynamoDB key prefixes under a permissions boundary; CloudWatch "
        "alarms (Lambda errors, API 5xx, queue backlog) notify SNS, with AWS Budgets cost alerts.",
    ])
    s.append(k.P(f"<b>BayanihanDR: AWS Disaster Recovery with Terraform</b> | Nov 2026 | "
                 f"{link(GH + '/bayanihan-dr', 'github.com/jervilangelo/bayanihan-dr')}", hdr))
    s += k.B([
        "Wrote five Terraform modules for a low-cost standby that creates an IMDSv2-only EC2 recovery host "
        "with no inbound ports; access through IAM Identity Center and Session Manager, no SSH keys.",
        "Final drill restored a PostgreSQL app in 5 min 29 s with 26 s of data loss (targets: 30 min RTO, "
        "60 min RPO); CI runs terraform test, TFLint and Trivy.",
    ])
    s.append(k.P(f"<b>Opsentra: AWS Incident Response Platform</b> | Nov 2026 | "
                 f"{link(GH + '/opsentra', 'github.com/jervilangelo/opsentra')}", hdr))
    s += k.B([
        "Routed CloudWatch alarms through EventBridge to Lambda, opening one deduplicated DynamoDB incident "
        "and one SNS alert; fixes run only as allowlisted SSM runbooks approved by an admin and audited.",
    ])
    s.append(k.P(f"<b>Also on GitHub:</b> Teolohiya.site (live; Amplify Gen 2, Cognito, AppSync, DynamoDB), "
                 f"Serverless Ticketing API (HTTP API, Lambda, DynamoDB Streams, SNS), Secure EC2 Web Server "
                 f"(custom VPC, Nginx, Session Manager).", hdr))

    s += k.H("Work Experience")
    s.append(k.P("<b>HRIS Technical Support (Level 1)</b> | First Maritime Shared Services / PTC Group, "
                 "Makati | Jul 2026 – Present", hdr))
    s += k.B([
        "Provide first-line support for a cloud HRIS used by seafarers and office staff: investigate "
        "issues, guide users to resolution and escalate complex cases to the right team.",
        "Automated a manual check with a daily Power Automate flow that flags SharePoint templates untouched "
        "for 7+ days and feeds a Power BI dashboard (about 29 templates across 9 business units).",
        "Support the HRIS rollout with the vendor (data gathering, template validation, issue tracking).",
    ])
    s.append(k.P("<b>Field / Onsite Engineer</b> | HP Service Center / Actionlabs IT Services Phils Corp, "
                 "Makati | May 2025 – Nov 2025", hdr))
    s += k.B(["Diagnosed and repaired hardware, OS and peripheral faults on HP laptops, workstations, "
              "printers and POS systems at client sites."])
    s.append(k.P("<b>IT Intern / C# Programmer</b> | TechFactors Inc., Quezon City | Jan 2024 – Jul 2024", hdr))
    s += k.B(["Developed front-end and back-end features for company C# applications, including REST API work."])

    s += k.H("Certifications")
    s.append(k.P(
        f"{link(CRED['ccp'], 'AWS Certified Cloud Practitioner')} (2026) | "
        f"{link(CRED['aip'], 'AWS Certified AI Practitioner')} (2026) | "
        f"{link(CRED['oci'], 'OCI Foundations Associate')} (2026) | "
        f"{link(CRED['ociai'], 'OCI AI Foundations Associate')} (2026) | Google IT Support Professional "
        "Certificate (2026) | Cisco CCNA ITN, SRWE, CyberOps | "
        "<b>In progress:</b> AWS Solutions Architect – Associate (SAA-C03)"))

    s += k.H("Education")
    s.append(k.P("<b>BS Information Technology, Major in Animation and Game Development</b> | "
                 "FEU Institute of Technology | 2025"))
    build(os.path.join(OUT, "Professional-Resume.pdf"), LETTER,
          (0.55 * inch, 0.42 * inch), s, f"{NAME} - Resume",
          "Resume - Junior Cloud Engineer / AWS")


# =====================================================================================
# 2. COMPREHENSIVE CV (A4, black Calibri identity of the original CV, right-aligned dates)
# =====================================================================================
def cv():
    k = Kit(body=9.6, accent=colors.black, head_size=10.8, name_size=18, lead=1.2, bullet_space=0.7)
    W = A4[0] - 2 * 0.6 * inch - 12  # frame padding is 6 pt per side
    s = []
    s.append(k.P(NAME, k.name))
    s.append(k.P("Curriculum Vitae | IT Support Professional | Cloud Infrastructure (AWS)",
                 ParagraphStyle("t", parent=k.body, fontSize=10.5, leading=13)))
    s.append(k.P(f"{LOCATION} | {PHONE} | {link('mailto:' + EMAIL, EMAIL)}"))
    s.append(k.P(f"{link('https://jervilangelo.online', 'jervilangelo.online')} | "
                 f"{link('https://www.linkedin.com/in/jervilangelo', 'linkedin.com/in/jervilangelo')} | "
                 f"{link(GH, 'github.com/jervilangelo')}"))

    s += k.H("Professional Profile")
    s.append(k.P(
        "IT support professional with experience in enterprise HRIS application support and onsite "
        "hardware and OS repair, now moving into cloud engineering. Outside work, designs, builds and "
        "operates AWS systems end to end: Resolve, a serverless platform running in production on its own "
        "domain; BayanihanDR, a Terraform disaster recovery proof of concept validated by timed drills; and "
        "Opsentra, an event-driven incident response platform with approved, audited remediation. Works "
        "with Terraform, GitHub Actions, IAM least privilege, CloudWatch monitoring, Linux and networking, "
        "and writes the runbooks and documentation behind them. The support role adds daily practice in "
        "triage, escalation, vendor coordination and written communication."))
    s.append(k.P("<b>Target roles:</b> Junior Cloud Engineer, Junior AWS Cloud Engineer, Cloud Support "
                 "Engineer, Associate Cloud Engineer, Junior Cloud Infrastructure Engineer, Junior DevOps "
                 "Engineer.", ParagraphStyle("tr", parent=k.body, spaceBefore=3)))

    s += k.H("Technical Skills")
    for label, val in [
        ("AWS compute and integration", "Lambda (Node.js, Python), API Gateway (HTTP API, JWT authorizers), "
         "EventBridge (scheduled rules, event routing), SQS (dead-letter queues), SNS, SES v2, EC2, Amplify Hosting"),
        ("AWS data and storage", "DynamoDB (single-table design, GSIs, Streams, TTL, transactions, "
         "point-in-time recovery), S3 (versioning, lifecycle, encryption, Block Public Access), EBS, PostgreSQL"),
        ("AWS security and identity", "IAM (least-privilege policies, condition keys, permissions "
         "boundaries, OIDC federation), Cognito (user pools, managed login, PKCE, MFA), IAM Identity Center, "
         "KMS, Systems Manager Session Manager, IAM Access Analyzer"),
        ("Networking and DNS", "VPC, subnets, route tables, internet gateways, security groups, VPC gateway "
         "endpoints, Route 53 (hosted zones, DNSSEC, query logging), SPF/DKIM/DMARC, TCP/IP, DNS, DHCP, "
         "subnetting, VLANs, static routing"),
        ("Observability and cost", "CloudWatch (alarms, Logs, embedded metric format, log retention), SNS "
         "alerting, structured JSON logging, AWS Budgets (actual and forecast alerts, cost allocation tags)"),
        ("Infrastructure as code and CI/CD", "Terraform (reusable modules, S3 backend with lockfile, multi-"
         "account environments, terraform test, mocked providers), GitHub Actions (OIDC, environment "
         "approvals, matrix jobs, Dependabot), Checkov, TFLint, Trivy, Git, pnpm monorepos, Docker Compose"),
        ("Languages and frameworks", "TypeScript/Node.js, Python (FastAPI, pytest), C#, Bash, PowerShell, "
         "SQL, GraphQL (AppSync), Next.js, React, Zod, REST API design"),
        ("Testing", "Vitest, pytest, Playwright end-to-end tests, axe accessibility tests, live integration "
         "tests against AWS, disaster recovery drills"),
        ("Systems and support", "Amazon Linux 2023, Windows, Windows Server, Nginx, Active Directory "
         "fundamentals, VMware Workstation, hardware and OS diagnostics, incident triage, escalation, runbooks"),
        ("Automation and business apps", "Power Automate, Power BI, SharePoint, Excel Online"),
    ]:
        s.append(k.P(f"<b>{label}:</b> {val}", ParagraphStyle("sk", parent=k.body, spaceBefore=0.9)))

    # ---------------- Resolve, in depth
    s += k.H("Featured Project: Resolve")
    s.append(k.row("Resolve: Serverless Browser-Protection and Accountability Platform on AWS",
                   "Nov 2026 – Present", W))
    s.append(k.P(f"Personal project, live in production | "
                 f"{link(GH + '/resolve', 'github.com/jervilangelo/resolve')} | "
                 f"{link('https://getresolved.site', 'getresolved.site')} | Region: ap-southeast-1"))
    s.append(k.P("<i>Stack: Terraform, AWS Lambda (Node.js 22, arm64), API Gateway HTTP API, DynamoDB, "
                 "Cognito, SQS, SES, SNS, EventBridge, CloudWatch, S3, Route 53, KMS, Amplify Hosting, IAM, "
                 "AWS Budgets, GitHub Actions, TypeScript, Next.js, Chromium extension (Manifest V3)</i>",
                 ParagraphStyle("st", parent=k.body, spaceBefore=1.5)))
    s.append(k.P(
        "Resolve is a free Chromium browser extension and web dashboard that lets small groups agree on "
        "blocked websites, with on-device image blurring, a Focus Mode and opt-in email alerts between "
        "consenting members. Built and operated as a solo project from design through production release; "
        "the extension is distributed as a limited beta through GitHub Releases (v0.5.1).",
        ParagraphStyle("ov", parent=k.body, spaceBefore=2.5)))

    def sub(t):
        s.append(k.P(t, ParagraphStyle("s2", parent=k.sub, spaceBefore=4)))

    sub("Architecture and AWS services")
    s += k.B([
        "<b>API Gateway (HTTP API):</b> 35 routes behind one Lambda proxy integration; 32 require a Cognito "
        "JWT authorizer. The health check and two installation-token routes are public by design and the "
        "function validates their tokens. Stage throttling, CORS limited to the dashboard origins, and JSON "
        "access logs that record route templates only (no paths, IPs or user agents).",
        "<b>AWS Lambda:</b> Node.js 22 functions on arm64 (API, outbox relay, notification worker, "
        "inactivity check), each with its own IAM role and CloudWatch log group, bundled with esbuild and "
        "deployed by Terraform.",
        "<b>Amazon DynamoDB:</b> one on-demand table with a query-driven single-table key design, a global "
        "secondary index for membership lookups, TTL for short-lived records, point-in-time recovery, "
        "deletion protection in production, and TransactWriteItems with condition expressions for "
        "membership, invitation and consent changes.",
        "<b>Amazon Cognito:</b> user pool with branded managed login, authorization code flow with PKCE "
        "for the dashboard and the extension (no client secrets), optional TOTP MFA, 12-character password "
        "policy, token revocation and 60-minute access tokens; the integration-test client exists only "
        "outside production.",
        "<b>DynamoDB Streams, SQS and SES (transactional outbox):</b> the API writes an outbox item in the "
        "same transaction as the change that causes it. A relay Lambda reads the stream through an event "
        "filter (inserts with the OUTBOX# prefix only), reports partial batch failures, and sends failed "
        "batches to an SQS failure queue. Messages go to an encrypted SQS queue with a dead-letter queue "
        "after 5 receives; a worker Lambda (concurrency capped at 2) re-checks membership and consent at "
        "send time and sends email through SES v2.",
        "<b>Amazon EventBridge:</b> hourly scheduled rule that invokes the inactivity Lambda to find enrolled "
        "browsers that have not checked in for 72 hours.",
        "<b>Route 53, SES domain identity and KMS:</b> production hosted zone with DNSSEC signing (KMS ECC "
        "key in us-east-1), DNS query logging to CloudWatch Logs, and SES domain authentication with "
        "2048-bit DKIM, SPF, DMARC and a custom MAIL FROM domain.",
        "<b>AWS Amplify Hosting:</b> server-rendered Next.js dashboard built from the GitHub monorepo with a "
        "Terraform-defined build specification, custom apex and www domain, and environment variables "
        "wired from Terraform outputs.",
        "<b>Amazon S3:</b> private bucket provisioned for future profile pictures (upload feature not yet "
        "built): Block Public Access, SSE-S3 encryption, TLS-only bucket policy, versioning and lifecycle "
        "rules that expire replaced versions after 7 days.",
    ])
    sub("Security and access control")
    s += k.B([
        "Wrote per-function IAM policies limited to specific actions and DynamoDB partition-key prefixes "
        "using the dynamodb:LeadingKeys condition key; the API role cannot read or modify outbox items.",
        "Attached a permissions boundary to every role the stack creates; the deployment role may create "
        "only roles that carry the boundary and is explicitly denied from removing it.",
        "Replaced long-lived AWS keys in CI with GitHub OIDC federation; the trust policy accepts only the "
        "repository's dev or prod GitHub environment.",
        "Kept browsing data out of the backend: strict request schemas (Zod), allowlisted log fields, and a "
        "test that proves no URL, domain, name or token reaches logs. Wrote a threat model and data "
        "inventory before release.",
    ])
    sub("Infrastructure as code, CI/CD and environments")
    s += k.B([
        "Organized Terraform into 10 modules (stack, api, lambda, data, identity, notifications, "
        "observability, hosting, domain, github-deploy); dev and prod differ only in variables and run in "
        "separate AWS accounts, with state in an encrypted S3 backend using native lockfile locking.",
        "CI on every push and pull request: pnpm audit, formatting, lint, type checks, unit tests, build, "
        "Playwright E2E, terraform fmt and validate for both environments, and a Checkov IaC scan with "
        "documented exceptions.",
        "Dev deploys automatically after CI passes on main (OIDC, terraform apply, then live integration "
        "tests against AWS); production deploys are manual, gated by a GitHub environment approval, and end "
        "with an automated health check.",
    ])
    sub("Monitoring, reliability and cost")
    s += k.B([
        "CloudWatch alarms for Lambda errors, API 5xx responses, non-empty dead-letter and failure queues, "
        "and messages older than one hour, all notifying an SNS topic; delivery metrics published with "
        "CloudWatch embedded metric format; log retention set per stage (90 days in production).",
        "Idempotency keys on write routes, cooldowns and per-recipient rate caps on alerts, and retries "
        "routed to alarmed dead-letter queues; wrote runbooks for queue alarms, SES issues, rollbacks, "
        "compromised tokens and data deletion requests.",
        "Kept the design pay-per-use: on-demand DynamoDB, arm64 Lambda, no NAT gateway or always-on servers, "
        "and a tag-filtered AWS Budgets monthly budget with alerts at 80% actual and 100% forecast spend.",
    ])
    sub("Testing and results")
    s += k.B([
        "Test report (24 Nov 2026): 203 unit and route tests, 11 live integration tests run on every dev "
        "deploy, 26 Playwright E2E tests, 0 known dependency vulnerabilities, 0 failing Checkov checks and "
        "0 axe accessibility violations; extension suite also passes in Microsoft Edge and Brave.",
        "Released to production on 25 Nov 2026 after acceptance tests on the production stack; the "
        "production API health endpoint and dashboard are live. Not yet done: Chrome Web Store and Edge "
        "listings, and Firefox support.",
    ])

    # ---------------- other projects
    s += k.H("Other Cloud Projects (Personal)")
    s.append(k.row("BayanihanDR: AWS Disaster Recovery with Terraform (proof of concept)", "Nov 2026", W))
    s.append(k.P(f"{link(GH + '/bayanihan-dr', 'github.com/jervilangelo/bayanihan-dr')} | Terraform, EC2, "
                 "S3, VPC, IAM, IAM Identity Center, Systems Manager, GitHub Actions, PostgreSQL 16, FastAPI"))
    s += k.B([
        "Provisioned a standby and recovery environment with five Terraform modules (networking, compute, "
        "storage, identity, monitoring) switched by one recovery variable; remote state in a versioned, "
        "encrypted S3 bucket with native lockfile locking.",
        "Final AWS drill recovered the application in 5 min 29 s with 26 s of data loss against targets of "
        "30 min RTO and 60 min RPO; 10 of 10 post-recovery checks passed (synthetic data).",
        "Scheduled hourly pg_dump backups, each restored into a throwaway database and row-counted before "
        "upload to S3.",
        "GitHub Actions CI runs terraform fmt, validate, terraform test against a mocked AWS provider, "
        "TFLint and a Trivy misconfiguration scan.",
        "Removed SSH keys, IAM users and long-lived access keys: operator access through IAM Identity "
        "Center, host access through Session Manager, separate least-privilege roles for the host and the "
        "backup writer; IMDSv2-only EC2, encrypted gp3 volumes, TLS-only private backup bucket, no inbound "
        "security group rules, and an S3 gateway endpoint instead of a NAT gateway (recorded compute spend "
        "about USD 0.01).",
    ])
    s.append(k.row("Opsentra: AWS Incident Response Platform", "Nov 2026", W))
    s.append(k.P(f"{link(GH + '/opsentra', 'github.com/jervilangelo/opsentra')} | Lambda, EventBridge, "
                 "CloudWatch, DynamoDB, SNS, Systems Manager, Cognito, API Gateway, Terraform"))
    s += k.B([
        "Built an event-driven incident pipeline: a probe Lambda checks a disposable EC2 and Nginx lab every "
        "minute; a CloudWatch alarm is routed by EventBridge to Lambda, which opens one deduplicated incident "
        "in DynamoDB and sends one SNS alert; a reconciler runs every 2 minutes to catch missed events.",
        "Limited remediation to allowlisted, hash-pinned Systems Manager runbooks that an operator requests "
        "and an admin approves, recorded in an append-only audit trail; incidents close only after 3 healthy "
        "probes and escalate if SSM reports success while the service is still down.",
        "Secured the API with Cognito roles (viewer, operator, admin), JWT auth on every route except health, "
        "idempotency keys on writes and least-privilege IAM with no IAM Access Analyzer findings.",
        "Provisioned with Terraform across ten gated phases; tested with pytest, Vitest, Playwright and axe; "
        "lab cost about USD 0.01–0.02/hour.",
    ])
    s.append(k.row("Teolohiya.site: Live Serverless Web Application", "2026", W))
    s.append(k.P(f"{link('https://teolohiya.site', 'teolohiya.site')} | Amplify Gen 2, Cognito, AppSync, "
                 "DynamoDB, Lambda, S3, CloudFront, ACM, AWS Budgets"))
    s += k.B([
        "Built and operate a moderated book listing site in ap-southeast-1 with Cognito sign-in, an AppSync "
        "GraphQL API and DynamoDB models that keep private listing data separate from public listings.",
        "Implemented role-based moderation through Lambda admin actions and split S3 photo uploads into "
        "pending and approved paths so unreviewed content never reaches the public path.",
        "Defined the backend as code with Amplify Gen 2 (CDK/CloudFormation), released through sandbox "
        "testing, served through CloudFront with an ACM certificate; no NAT gateway or always-on compute, "
        "with AWS Budgets alerts.",
    ])
    s.append(k.row("Serverless Ticketing API", "Oct 2026", W))
    s.append(k.P(f"{link(GH + '/aws-serverless-ticketing-api', 'github.com/jervilangelo/aws-serverless-ticketing-api')} "
                 "| API Gateway HTTP API, Lambda (Python), DynamoDB, SNS, CloudWatch"))
    s += k.B([
        "Built six HTTP API routes for HRIS support tickets on an on-demand DynamoDB table with a status "
        "index and priority-based due dates (Critical 4 h, High 8 h, Medium 24 h, Low 72 h).",
        "Scoped one IAM role per Lambda to specific table, index, stream and topic ARNs; throttled the API to "
        "5 req/s (burst 10).",
        "Connected DynamoDB Streams to a second Lambda that emails Critical tickets through SNS; added JSON "
        "logs and a CloudWatch error alarm, and tested every route and error case (400, 404) from PowerShell.",
    ])
    s.append(k.row("Secure EC2 Web Server", "2026", W))
    s.append(k.P(f"{link(GH + '/secure-ec2-web-server', 'github.com/jervilangelo/secure-ec2-web-server')} "
                 "| EC2, VPC, IAM, Systems Manager, EBS, Nginx, Amazon Linux 2023"))
    s += k.B([
        "Deployed Nginx on Amazon Linux 2023 in a custom VPC (10.0.0.0/16) with a public subnet, internet "
        "gateway and route table; restricted SSH to one IP and enabled Session Manager through an instance "
        "role; enforced root MFA, took an EBS snapshot backup and set a budget alert.",
    ])

    # ---------------- experience
    s += k.H("Professional Experience")
    s.append(k.row("HRIS Technical Support (Level 1) | First Maritime Shared Services / PTC Group, Makati",
                   "Jul 2026 – Present", W))
    s += k.B([
        "Provide Level 1 application support for seafarers and office employees on a cloud-based HRIS: "
        "investigate reported issues, guide users to resolution and escalate complex cases to the right "
        "team with the details needed to act.",
        f"Built a daily Power Automate flow that recursively scans a SharePoint document library, flags "
        f"templates untouched for 7+ days and upserts their status into an Excel Online table feeding a "
        f"Power BI completion dashboard, replacing manual checks of about 29 templates across 9 business "
        f"units ({link(GH + '/hris-template-tracker-automation-', 'project write-up')}).",
        "Coordinate with the HRIS vendor and internal stakeholders during implementation: data gathering, "
        "template validation, issue follow-up and status tracking.",
        "Document procedures, recurring issues and fixes so support stays consistent across the team.",
    ])
    s.append(k.row("Field / Onsite Engineer | HP Service Center / Actionlabs IT Services Phils Corp, Makati",
                   "May 2025 – Nov 2025", W))
    s += k.B([
        "Diagnosed and repaired hardware, software and peripheral faults on HP laptops, workstations, "
        "printers and POS systems at client and partner sites.",
        "Installed operating systems, ran component diagnostics, explained findings to users and client "
        "contacts, and recorded each completed service action.",
    ])
    s.append(k.row("IT Intern / C# Programmer | TechFactors Inc., Quezon City", "Jan 2024 – Jul 2024", W))
    s += k.B(["Developed front-end and back-end features for company C# applications, including REST API work."])

    s += k.H("Certifications")
    for name, issuer, date, key in [
        ("AWS Certified Cloud Practitioner", "Amazon Web Services", "Oct 2026", "ccp"),
        ("AWS Certified AI Practitioner", "Amazon Web Services", "Jul 2026", "aip"),
        ("Oracle Cloud Infrastructure Foundations Associate", "Oracle", "Oct 2026", "oci"),
        ("Oracle Cloud Infrastructure AI Foundations Associate", "Oracle", "Oct 2026", "ociai"),
    ]:
        s.append(k.P(f"<b>{name}</b> | {issuer} | {date} | {link(CRED[key], 'Verify')}",
                     ParagraphStyle("c", parent=k.body, spaceBefore=0.8)))
    s.append(k.P("<b>In progress:</b> AWS Certified Solutions Architect – Associate (SAA-C03)",
                 ParagraphStyle("c2", parent=k.body, spaceBefore=0.8)))
    s.append(k.P("<b>Training and certificates:</b> Google IT Support Professional Certificate (2026); Google "
                 "System Administration and IT Infrastructure Services (2026); Cisco Networking Academy: CCNA "
                 "Introduction to Networks (2021), CCNA Switching, Routing and Wireless Essentials (2022), "
                 "CyberOps Associate (2022), NDG Linux Essentials (2023), Networking Basics (2026); IT "
                 "Specialist: Databases, Certiport (2022)", ParagraphStyle("c3", parent=k.body, spaceBefore=0.8)))

    s += k.H("Education")
    s.append(k.P("<b>BS Information Technology, Major in Animation and Game Development</b> | "
                 "FEU Institute of Technology | 2025"))
    build(os.path.join(OUT, "Comprehensive-CV.pdf"), A4,
          (0.6 * inch, 0.45 * inch), s, f"{NAME} - Curriculum Vitae",
          "Curriculum Vitae - Cloud Engineering (AWS)")


# =====================================================================================
# 3. ATS RESUME (A4, single column, no tables, no icons, plain ASCII-friendly separators)
# =====================================================================================
def ats():
    k = Kit(body=10, accent=colors.black, head_size=11, name_size=16, lead=1.2, bullet_space=0.8)
    s = []
    s.append(k.P(NAME, k.name))
    s.append(k.P("IT Support Professional | Junior Cloud Engineer Candidate | AWS Certified Cloud Practitioner"))
    s.append(k.P(f"{LOCATION} | {PHONE} | {EMAIL}"))
    s.append(k.P("LinkedIn: linkedin.com/in/jervilangelo | GitHub: github.com/jervilangelo | "
                 "Portfolio: jervilangelo.online"))

    s += k.H("Professional Summary", 0.6)
    s.append(k.P(
        "IT support professional seeking a Junior Cloud Engineer, Cloud Support Engineer or Junior DevOps "
        "Engineer role. Experienced in technical support, troubleshooting, incident triage, escalation and "
        "technical documentation in enterprise HRIS support and field engineering. Builds and operates "
        "Amazon Web Services (AWS) infrastructure in personal projects, including Resolve, a serverless "
        "application running in production that uses AWS Lambda, Amazon API Gateway, Amazon DynamoDB, "
        "Amazon Cognito, Amazon SQS and Amazon SES, provisioned with Terraform (infrastructure as code) and "
        "deployed through a GitHub Actions CI/CD pipeline. Hands-on with IAM least privilege, CloudWatch "
        "monitoring and alerting, VPC networking, Linux and Python scripting. AWS Certified Cloud "
        "Practitioner, preparing for AWS Certified Solutions Architect - Associate."))

    s += k.H("Technical Skills", 0.6)
    for label, val in [
        ("Cloud Platforms", "Amazon Web Services (AWS); Oracle Cloud Infrastructure (foundational)"),
        ("AWS Services", "AWS Lambda, Amazon API Gateway, Amazon DynamoDB, Amazon S3, Amazon EC2, Amazon VPC, "
                         "AWS IAM, Amazon Cognito, Amazon SQS, Amazon SNS, Amazon SES, Amazon EventBridge, "
                         "Amazon CloudWatch, AWS Systems Manager, Amazon Route 53, AWS KMS, AWS Amplify, "
                         "AWS AppSync, Amazon CloudFront, AWS Certificate Manager, IAM Identity Center, AWS Budgets"),
        ("Infrastructure as Code", "Terraform, Terraform modules, remote state, terraform test, "
                                   "AWS CloudFormation (through Amplify Gen 2 / CDK)"),
        ("CI/CD and DevOps", "GitHub Actions, CI/CD pipelines, OIDC deployment roles, Git, GitHub, Checkov, "
                             "TFLint, Trivy, Docker Compose, automated testing"),
        ("Cloud Security", "IAM least privilege, permissions boundaries, MFA, encryption at rest and in "
                           "transit, Session Manager (no SSH keys), security groups, DNSSEC"),
        ("Monitoring and Logging", "CloudWatch alarms, CloudWatch Logs, structured logging, SNS alerting, "
                                   "dead-letter queues, AWS Budgets cost alerts"),
        ("Networking", "TCP/IP, DNS, DHCP, subnetting, routing, VPC, subnets, route tables, internet gateway, "
                       "VPC endpoints, VLANs, OSI model"),
        ("Operating Systems", "Linux (Amazon Linux 2023), Windows, Windows Server, Nginx"),
        ("Scripting and Programming", "Python, Bash, PowerShell, TypeScript, Node.js, C#, SQL, REST APIs, GraphQL"),
        ("Databases", "Amazon DynamoDB, PostgreSQL"),
        ("Support and Operations", "Technical support, troubleshooting, incident management, "
                                   "escalation, runbooks, technical documentation, "
                                   "Power Automate, Power BI, SharePoint"),
    ]:
        s.append(k.P(f"<b>{label}:</b> {val}", ParagraphStyle("sk", parent=k.body, spaceBefore=0.9)))

    s += k.H("Professional Experience", 0.6)
    s.append(k.P("<b>HRIS Technical Support (Level 1)</b>", k.sub))
    s.append(k.P("First Maritime Shared Services / PTC Group | Makati City, Philippines | Jul 2026 - Present"))
    s += k.B([
        "Provide Level 1 technical support for a cloud-based HRIS application used by seafarers and office "
        "employees: troubleshoot reported issues, guide users to resolution and escalate complex incidents.",
        "Automated a manual tracking process with a scheduled Power Automate flow that scans a SharePoint "
        "library daily, flags templates not updated in 7 days and updates an Excel Online table for a Power "
        "BI dashboard, covering about 29 templates across 9 business units.",
        "Coordinate with the HRIS vendor and internal stakeholders during system implementation, including "
        "data gathering, template validation, issue tracking and status reporting.",
        "Write technical documentation for procedures, recurring issues and fixes.",
    ])
    s.append(k.P("<b>Field / Onsite Engineer</b>", k.sub))
    s.append(k.P("HP Service Center / Actionlabs IT Services Phils Corp | Makati City, Philippines | "
                 "May 2025 - Nov 2025"))
    s += k.B([
        "Troubleshot and repaired hardware, operating system and peripheral issues on HP laptops, "
        "workstations, printers and POS systems at client sites.",
        "Installed operating systems, ran hardware diagnostics, communicated findings to users and "
        "documented each service action.",
    ])
    s.append(k.P("<b>IT Intern / C# Programmer</b>", k.sub))
    s.append(k.P("TechFactors Inc. | Quezon City, Philippines | Jan 2024 - Jul 2024"))
    s += k.B(["Developed front-end and back-end features and REST API functionality for C# applications "
              "as part of a software development team."])

    s += k.H("Projects", 0.6)
    s.append(k.P("<b>Resolve - Serverless AWS Application (Personal Project, Live in Production)</b>", k.sub))
    s.append(k.P("Nov 2026 - Present | github.com/jervilangelo/resolve | getresolved.site"))
    s.append(k.P("Technologies: Terraform, AWS Lambda, Amazon API Gateway, Amazon DynamoDB, Amazon Cognito, "
                 "Amazon SQS, Amazon SES, Amazon EventBridge, Amazon CloudWatch, Amazon SNS, Amazon Route 53, "
                 "AWS Amplify, AWS IAM, GitHub Actions, TypeScript, Node.js"))
    s += k.B([
        "Built a serverless backend on AWS with an API Gateway HTTP API (35 routes, 32 protected by a Cognito "
        "JWT authorizer), Node.js Lambda functions and a single-table DynamoDB design with a global secondary "
        "index, TTL and point-in-time recovery.",
        "Provisioned dev and production environments in separate AWS accounts with 10 Terraform modules and "
        "an encrypted S3 remote state backend.",
        "Built a CI/CD pipeline in GitHub Actions that runs linting, 200+ unit tests, Playwright end-to-end "
        "tests, terraform validate and a Checkov security scan, then deploys with GitHub OIDC (no long-lived "
        "access keys) and runs live integration tests; production releases require manual approval and "
        "pass an automated health check.",
        "Implemented event-driven email notifications with DynamoDB Streams, Lambda, Amazon SQS with a "
        "dead-letter queue and Amazon SES, using idempotency keys and retries; scheduled checks run hourly "
        "through Amazon EventBridge.",
        "Applied IAM least privilege with per-function roles limited to specific DynamoDB key prefixes and a "
        "permissions boundary on all stack roles; configured Cognito with PKCE, optional MFA and token "
        "revocation.",
        "Set up monitoring and alerting with CloudWatch alarms for Lambda errors, API 5xx errors and queue "
        "backlogs, SNS notifications and AWS Budgets cost alerts; configured Route 53 with DNSSEC and SES "
        "email authentication (DKIM, SPF, DMARC).",
    ])
    s.append(k.P("<b>BayanihanDR - AWS Disaster Recovery with Terraform (Personal Project)</b>", k.sub))
    s.append(k.P("Nov 2026 | github.com/jervilangelo/bayanihan-dr"))
    s += k.B([
        "Built a disaster recovery environment on AWS with five Terraform modules (networking, compute, "
        "storage, identity, monitoring) using EC2, VPC, S3, IAM and Systems Manager, with a GitHub Actions "
        "pipeline running terraform validate, terraform test, TFLint and Trivy.",
        "Recovered a PostgreSQL application in 5 minutes 29 seconds with 26 seconds of data loss in the final "
        "drill, against a 30-minute RTO and 60-minute RPO.",
        "Removed SSH keys and long-lived access keys by using IAM Identity Center and Session Manager; "
        "hardened EC2 with IMDSv2, encrypted volumes and no inbound security group rules.",
    ])
    s.append(k.P("<b>Opsentra - AWS Incident Response Platform (Personal Project)</b>", k.sub))
    s.append(k.P("Nov 2026 | github.com/jervilangelo/opsentra"))
    s += k.B([
        "Built an event-driven incident response pipeline with CloudWatch alarms, EventBridge, Lambda, "
        "DynamoDB and SNS that opens one deduplicated incident per outage.",
        "Automated remediation with approved AWS Systems Manager runbooks, an audit trail and recovery "
        "verification; secured the API with Cognito role-based access control and Terraform-managed IAM.",
    ])
    s.append(k.P("<b>Additional AWS Projects (Personal)</b>", k.sub))
    s += k.B([
        "Teolohiya.site: live serverless web application on AWS Amplify Gen 2 with Cognito, AppSync, "
        "DynamoDB, Lambda and S3.",
        "Serverless Ticketing API: API Gateway HTTP API, Python Lambda, DynamoDB Streams, SNS and CloudWatch "
        "alarms with per-function IAM roles and API throttling.",
        "Secure EC2 Web Server: Nginx on Amazon Linux 2023 in a custom VPC with Session Manager access, root "
        "MFA, EBS snapshot backup and budget alert.",
    ])

    s += k.H("Certifications", 0.6)
    s += k.B([
        "AWS Certified Cloud Practitioner - Amazon Web Services - Oct 2026",
        "AWS Certified AI Practitioner - Amazon Web Services - Jul 2026",
        "Oracle Cloud Infrastructure Foundations Associate - Oracle - Oct 2026",
        "Oracle Cloud Infrastructure AI Foundations Associate - Oracle - Oct 2026",
        "Google IT Support Professional Certificate - Google - 2026",
        "Cisco CCNA: Introduction to Networks (2021); Switching, Routing and Wireless Essentials (2022); "
        "CyberOps Associate (2022); NDG Linux Essentials (2023)",
        "In progress: AWS Certified Solutions Architect - Associate (SAA-C03)",
    ])

    s += k.H("Education", 0.6)
    s.append(k.P("<b>Bachelor of Science in Information Technology, Major in Animation and Game Development</b>"))
    s.append(k.P("FEU Institute of Technology | 2025"))
    build(os.path.join(OUT, "ATS-Optimized-Resume.pdf"), A4,
          (0.7 * inch, 0.6 * inch), s, f"{NAME} - Resume",
          "Resume - Junior Cloud Engineer, AWS, Terraform, Serverless")


if __name__ == "__main__":
    resume()
    cv()
    ats()
    print("written to", OUT)
