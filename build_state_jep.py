from copy import deepcopy
from pathlib import Path
import shutil
import zipfile
import xml.etree.ElementTree as ET

from PIL import Image, ImageDraw, ImageFont

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


SOURCE_TEMPLATE = Path("/Users/NVENGURL/Library/CloudStorage/OneDrive-OracleCorporation/2024-MDP-GenAI/Template_JEP.docx")
OUTPUT = Path("/Users/NVENGURL/Documents/TCEQ_Query_Agents/AI_SE_Joint_Engagement_Plan_Department_of_State_Rebuilt.docx")
ARCHITECTURE_IMAGE = Path("/private/tmp/state-jep-rebuild/department-of-state-time-labor-architecture.png")

RED = "9E1B32"
GOLD = "D59B2A"
GREEN = "779E65"
LIGHT_GREEN = "EDF3E9"
PALE_RED = "F9EFF1"
GRAY = "666666"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)
    shd.set(qn("w:val"), "clear")


def set_cell_margins(cell, top=90, start=120, bottom=90, end=120):
    tc_pr = cell._tc.get_or_add_tcPr()
    mar = tc_pr.first_child_found_in("w:tcMar")
    if mar is None:
        mar = OxmlElement("w:tcMar")
        tc_pr.append(mar)
    for side, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = mar.find(qn(f"w:{side}"))
        if node is None:
            node = OxmlElement(f"w:{side}")
            mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_cell_border(cell, color="D9D9D9", size="6"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right"):
        tag = qn(f"w:{edge}")
        node = borders.find(tag)
        if node is None:
            node = OxmlElement(f"w:{edge}")
            borders.append(node)
        node.set(qn("w:val"), "single")
        node.set(qn("w:sz"), size)
        node.set(qn("w:color"), color)


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    hdr = OxmlElement("w:tblHeader")
    hdr.set(qn("w:val"), "true")
    tr_pr.append(hdr)


def set_table_widths(table, widths):
    for row in table.rows:
        for cell, width in zip(row.cells, widths):
            cell.width = Inches(width)
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(int(width * 1440)))
            tc_w.set(qn("w:type"), "dxa")


def style_run(run, size=10, bold=False, color=None, italic=False, font="Arial"):
    run.font.name = font
    run._element.rPr.rFonts.set(qn("w:ascii"), font)
    run._element.rPr.rFonts.set(qn("w:hAnsi"), font)
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    if color:
        run.font.color.rgb = RGBColor.from_string(color)


def add_body(doc, text="", style="Normal", before=0, after=5, line=1.06):
    p = doc.add_paragraph(style=style)
    p.paragraph_format.left_indent = Inches(0)
    p.paragraph_format.first_line_indent = Inches(0)
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = line
    p.paragraph_format.keep_together = True
    if text:
        style_run(p.add_run(text))
    return p


def add_heading(doc, text, level=1):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(13 if level == 1 else 8)
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text.upper() if level == 1 else text)
    style_run(r, size=15 if level == 1 else 11, bold=True, color=RED if level == 1 else GREEN)
    return p


def add_label_paragraph(doc, label, text):
    p = add_body(doc, before=0, after=4)
    style_run(p.add_run(f"{label}: "), size=10, bold=True, color=RED)
    style_run(p.add_run(text), size=10)
    return p


def add_bullets(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Paragraph")
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.02
        p.paragraph_format.keep_together = True
        style_run(p.add_run(item), size=10)


def set_table_text(cell, text, *, bold=False, color=None, size=9, align=None):
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    if align is not None:
        p.alignment = align
    r = p.add_run(text)
    style_run(r, size=size, bold=bold, color=color)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    set_cell_margins(cell)
    set_cell_border(cell)


def add_matrix(doc, headers, rows, widths):
    table = doc.add_table(rows=1, cols=len(headers))
    table.autofit = False
    table.style = "Table Grid"
    set_table_widths(table, widths)
    header = table.rows[0]
    set_repeat_table_header(header)
    for cell, value in zip(header.cells, headers):
        set_cell_shading(cell, GREEN)
        set_table_text(cell, value, bold=True, color="FFFFFF", size=8.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    for idx, row_values in enumerate(rows):
        cells = table.add_row().cells
        for cell, value in zip(cells, row_values):
            if idx % 2 == 0:
                set_cell_shading(cell, LIGHT_GREEN)
            set_table_text(cell, value, size=8.5)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


def add_use_case(doc, title, audience, problem, solution, example_user, example_ai, value):
    table = doc.add_table(rows=1, cols=2)
    table.autofit = False
    set_table_widths(table, [1.55, 4.95])
    left, right = table.rows[0].cells
    set_cell_shading(left, PALE_RED)
    set_cell_shading(right, "FFFFFF")
    set_cell_border(left, color="C89AA6")
    set_cell_border(right, color="C89AA6")
    set_cell_margins(left, 140, 150, 140, 150)
    set_cell_margins(right, 140, 150, 140, 150)
    p = left.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(4)
    style_run(p.add_run(title), size=10, bold=True, color=RED)
    p2 = left.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_run(p2.add_run(audience), size=8.5, bold=True, color=GRAY)
    entries = [
        ("Problem", problem),
        ("AI solution", solution),
        ("Example interaction", f'User: “{example_user}”\nAI Agent: “{example_ai}”'),
        ("Value", value),
    ]
    for i, (label, text) in enumerate(entries):
        p = right.paragraphs[0] if i == 0 else right.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.0
        style_run(p.add_run(label + ": "), size=8.8, bold=True, color=RED)
        style_run(p.add_run(text), size=8.8)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def draw_architecture_diagram():
    """Create a clean sample architecture diagram for the document's OCI Gov pilot."""
    ARCHITECTURE_IMAGE.parent.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGB", (1800, 980), "white")
    draw = ImageDraw.Draw(image)
    regular = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 30)
    bold = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 34)
    small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 25)
    RED_RGB = (158, 27, 50)
    GREEN_RGB = (119, 158, 101)
    PALE_GREEN_RGB = (237, 243, 233)
    PALE_RED_RGB = (249, 239, 241)
    GRAY_RGB = (82, 82, 82)

    def text_box(x1, y1, x2, y2, title, lines, fill, outline=GRAY_RGB):
        draw.rounded_rectangle((x1, y1, x2, y2), radius=20, fill=fill, outline=outline, width=3)
        y = y1 + 22
        title_bbox = draw.textbbox((0, 0), title, font=bold)
        draw.text(((x1 + x2 - (title_bbox[2] - title_bbox[0])) / 2, y), title, font=bold, fill=RED_RGB)
        y += 55
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=small)
            draw.text(((x1 + x2 - (bbox[2] - bbox[0])) / 2, y), line, font=small, fill=GRAY_RGB)
            y += 33

    def arrow(start, end, label=None):
        draw.line((start, end), fill=RED_RGB, width=6)
        x1, y1 = start
        x2, y2 = end
        dx, dy = x2 - x1, y2 - y1
        length = max((dx * dx + dy * dy) ** 0.5, 1)
        ux, uy = dx / length, dy / length
        px, py = -uy, ux
        tip = (x2, y2)
        left = (x2 - 24 * ux + 13 * px, y2 - 24 * uy + 13 * py)
        right = (x2 - 24 * ux - 13 * px, y2 - 24 * uy - 13 * py)
        draw.polygon((tip, left, right), fill=RED_RGB)
        if label:
            lx, ly = (x1 + x2) / 2, (y1 + y2) / 2
            draw.rounded_rectangle((lx - 130, ly - 20, lx + 130, ly + 20), radius=8, fill="white")
            bbox = draw.textbbox((0, 0), label, font=small)
            draw.text((lx - (bbox[2] - bbox[0]) / 2, ly - 13), label, font=small, fill=GRAY_RGB)

    # Department of State users
    text_box(55, 225, 345, 485, "Department of State", ["Employees", "Supervisors / Admins", "Browser experience"], PALE_RED_RGB, RED_RGB)
    # OCI Gov boundary
    draw.rounded_rectangle((430, 80, 1740, 885), radius=28, fill=(252, 253, 251), outline=GREEN_RGB, width=6)
    draw.text((470, 112), "OCI Gov — Secure VCN", font=regular, fill=GREEN_RGB)
    text_box(510, 240, 875, 485, "Time & Labor Co-Pilot", ["OCI Compute", "Employee policy assistant", "Supervisor review experience"], PALE_GREEN_RGB, GREEN_RGB)
    text_box(1040, 220, 1440, 425, "OCI Generative AI", ["Selected LLM", "Natural-language answers", "Response summarization"], PALE_GREEN_RGB, GREEN_RGB)
    text_box(970, 530, 1390, 710, "RAG / Vector Search", ["Approved policy PDFs", "Policy manuals", "Union agreements"], PALE_GREEN_RGB, GREEN_RGB)
    text_box(1460, 530, 1720, 710, "Autonomous", ["Database", "Approved anonymized", "PeopleSoft T&L data"], PALE_GREEN_RGB, GREEN_RGB)
    text_box(555, 755, 1645, 870, "Security and operations", ["IAM • encryption • network segmentation • audit logging • access controls"], (246, 246, 246), GRAY_RGB)
    arrow((345, 355), (510, 365), "secure access")
    arrow((875, 330), (1040, 325), "prompt")
    arrow((1040, 385), (875, 425), "answer")
    arrow((1240, 425), (1210, 530), "retrieve")
    draw.line(((1460, 730), (905, 730), (905, 500)), fill=RED_RGB, width=6)
    draw.polygon(((905, 485), (892, 512), (918, 512)), fill=RED_RGB)
    draw.rounded_rectangle((1090, 705, 1325, 744), radius=8, fill="white")
    draw.text((1115, 711), "approved T&L data", font=small, fill=GRAY_RGB)
    image.save(ARCHITECTURE_IMAGE, "PNG")


def clear_body(doc):
    body = doc._element.body
    for child in list(body):
        if child.tag != qn("w:sectPr"):
            body.remove(child)


def patch_template_chrome(path):
    """Keep the template chrome while removing LibreOffice's duplicate VML fallback."""
    ns = {
        "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
        "mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
    }
    ET.register_namespace("w", ns["w"])
    ET.register_namespace("mc", ns["mc"])
    temp = path.with_suffix(".patched.docx")
    with zipfile.ZipFile(path, "r") as zin, zipfile.ZipFile(temp, "w", zipfile.ZIP_DEFLATED) as zout:
        for info in zin.infolist():
            data = zin.read(info.filename)
            if (info.filename.startswith("word/header") or info.filename.startswith("word/footer")) and info.filename.endswith(".xml"):
                root = ET.fromstring(data)
                for parent in root.iter():
                    for child in list(parent):
                        if child.tag == f"{{{ns['mc']}}}AlternateContent" and "Confidential - Oracle Restricted" in "".join(child.itertext()):
                            parent.remove(child)
                if info.filename.startswith("word/footer"):
                    for paragraph in root.findall(".//w:p", ns):
                        text_nodes = paragraph.findall(".//w:t", ns)
                        paragraph_text = "".join(node.text or "" for node in text_nodes)
                        if paragraph_text.startswith("Joint Execution Plan | UH POC-"):
                            text_nodes[0].text = "Joint Engagement Plan | Department of State AI Pilot | Version 1.0"
                            for node in text_nodes[1:]:
                                node.text = ""
                data = ET.tostring(root, encoding="utf-8", xml_declaration=True)
            zout.writestr(info, data)
    temp.replace(path)


def add_cover(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(90)
    p.paragraph_format.space_after = Pt(14)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_run(p.add_run("ORACLE NORTH AMERICAN CLOUD ENGINEERING"), size=10, color=RED)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(5)
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    style_run(p.add_run("Joint Engagement Plan"), size=26, color="333333", font="Times New Roman")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(14)
    style_run(p.add_run("For\nThe U.S. Department of State"), size=21, color="333333", font="Times New Roman")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(22)
    r = p.add_run(" ")
    r.font.size = Pt(2)
    p_pr = p._p.get_or_add_pPr()
    p_bdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "14")
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), GOLD)
    p_bdr.append(bottom)
    p_pr.append(p_bdr)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    style_run(p.add_run("AI Pilot for PeopleSoft Time & Labor"), size=12, color=GRAY)
    p = doc.add_paragraph()
    style_run(p.add_run("Document date: INSERT DATE\nVersion 1.0"), size=9, color=GRAY)
    doc.add_page_break()


def build():
    shutil.copy2(SOURCE_TEMPLATE, OUTPUT)
    doc = Document(OUTPUT)
    clear_body(doc)
    for section in doc.sections:
        section.top_margin = Inches(1.08)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    add_cover(doc)
    add_heading(doc, "1. Overview")
    add_body(doc, "The U.S. Department of State is engaging with Oracle to conduct a technical and functional pilot using Oracle AI capabilities to improve PeopleSoft Time & Labor (T&L) workflows.")
    add_body(doc, "The pilot will demonstrate a limited-scope AI Agent and user experience that enables employees, supervisors, and administrators to query, validate, and act on T&L information through natural language. It is intended to show how Generative AI can modernize the Department of State PeopleSoft experience, improve compliance, and reduce administrative burden.")
    add_body(doc, "Evaluation will focus on ease of development, security compliance in a FedRAMP High environment, and measurable improvements to time entry and auditing work.")
    add_heading(doc, "Pilot objectives", level=2)
    add_bullets(doc, [
        "Validate secure AI and data-integration patterns for selected Department of State T&L workflows.",
        "Demonstrate an employee-facing policy assistant grounded in approved policy content.",
        "Demonstrate supervisor/admin anomaly detection for prioritized timecard exceptions.",
        "Establish a fact-based roadmap for production-scale adoption.",
    ])

    add_heading(doc, "2. Scope and approach")
    add_heading(doc, "Environment", level=2)
    add_body(doc, "The pilot will be implemented in a new secure tenancy within Oracle US Government Cloud (OCI Gov). The pilot dataset will consist of approved non-PII or anonymized PeopleSoft T&L data and relevant policy content.")
    add_heading(doc, "2.2. Core Activities", level=2)
    add_matrix(doc, ["Workstream", "Pilot activity", "Primary output"], [
        ("Provisioning", "Set up the OCI Gov tenancy, required network controls, and OCI Generative AI services.", "Secure pilot environment"),
        ("Data integration", "Ingest approved PeopleSoft T&L data and policy documents into an OCI Vector Database.", "Connected data foundation"),
        ("Model configuration", "Configure LLM and Retrieval-Augmented Generation (RAG) patterns for Department of State T&L terminology.", "Grounded AI responses"),
        ("Experience development", "Deploy the Time & Labor Co-Pilot experience and the supervisor/admin review workflow.", "Working AI prototype"),
    ], [1.25, 3.85, 1.4])

    doc.add_page_break()
    add_heading(doc, "3. Pilot use cases: Time & Labor")
    add_body(doc, "The pilot will focus on two high-value workflows that test employee self-service, policy interpretation, supervisory review, and audit-oriented exception handling.")
    add_use_case(doc, "USE CASE A", "EMPLOYEE-FACING", "Employees can struggle to apply complex leave codes or interpret overtime rules, resulting in errors and resubmissions.", "An embedded chat assistant answers natural-language questions using approved Department of State policy and relevant guidance.", "I worked two extra hours on Tuesday to finish an audit report. How should I code this?", "Based on your bargaining-unit status, this may qualify as Credit Hours. I can open the Credit Hour entry screen for you. Would you like to proceed?", "Reduces Tier 1 support requests and coding errors at the source.")
    add_use_case(doc, "USE CASE B", "SUPERVISOR / ADMIN", "Supervisors must manually review large volumes of timecards and may miss patterns of non-compliance, including overlapping leave and work hours.", "A predictive AI model scans finalized timecards against historical patterns and policy limits to flag high-risk exceptions for review.", "What timecards require priority review this week?", "Alert: Employee X has claimed Sick Leave on four consecutive Mondays following a holiday. This exceeds the deviation threshold. Recommended action: request documentation.", "Increases audit accuracy and reduces manual review time.")

    doc.add_page_break()
    add_heading(doc, "4. Proof of Concept Requirements")
    add_heading(doc, "4.1. Oracle Pilot Team Responsibilities", level=2)
    add_bullets(doc, [
        "Provide dedicated AI specialist(s) to guide the OCI environment architecture and configuration.",
        "Assist with setup of OCI Generative AI Service and Vector Search capabilities.",
        "Provide pre-built code accelerators for Retrieval-Augmented Generation (RAG) pipelines to speed development.",
        "Conduct the final proof-of-value debriefing.",
    ])
    add_heading(doc, "4.2. Department of State Team Responsibilities", level=2)
    add_bullets(doc, [
        "Provide a cleansed, approved dataset of anonymized PeopleSoft time data and relevant policy PDFs, including policy manuals and union contracts.",
        "Identify functional SMEs, including Time Administrators, to test the system and provide feedback.",
        "Review and approve the pilot cloud-tenancy architecture and support the security-assessment process.",
    ])
    add_heading(doc, "60-day pilot timeline", level=2)
    add_matrix(doc, ["Phase", "Duration", "Key activities", "Output"], [
        ("1. Discovery & Define", "Days 1–10", "Kickoff, cloud tenancy activation, and use-case refinement workshop.", "Signed pilot charter; architecture diagram"),
        ("2. Develop & Deploy", "Days 11–40", "Ingest policy data, connect sandbox data, configure models, and develop the user experience.", "Working AI prototype; connected data pipeline"),
        ("3. Test & Improve", "Days 41–60", "UAT with SMEs, answer refinement, final readout, and ROI calculation.", "Performance report; production roadmap"),
    ], [1.3, .75, 3.0, 1.45])

    doc.add_page_break()
    draw_architecture_diagram()
    add_heading(doc, "5. Proposed architecture")
    add_body(doc, "The solution will use Oracle Cloud Infrastructure services designed for secure AI workloads. All components will be deployed within a Virtual Cloud Network (VCN) with strict Identity and Access Management (IAM) policies aligned to Department of State security standards.")
    diagram = doc.add_picture(str(ARCHITECTURE_IMAGE), width=Inches(6.5))
    diagram_paragraph = doc.paragraphs[-1]
    diagram_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    diagram_paragraph.paragraph_format.space_after = Pt(8)
    add_matrix(doc, ["Component", "Role in pilot"], [
        ("OCI Compute", "Hosts application logic and the Time & Labor Co-Pilot user experience."),
        ("Autonomous Database", "Stores approved structured PeopleSoft pilot data."),
        ("OCI Generative AI", "Generates responses and summaries using selected large language models."),
        ("Vector Search / RAG", "Grounds responses in approved policy documents and Department of State terminology."),
        ("VCN and IAM", "Provides network segmentation, controlled access, encryption, and auditability."),
    ], [1.65, 4.85])

    doc.add_page_break()
    add_heading(doc, "6. Success criteria")
    add_body(doc, "The pilot will be considered successful when the following outcomes are demonstrated and jointly reviewed:")
    add_matrix(doc, ["Area", "Criteria", "Target metric"], [
        ("Accuracy", "The AI Agent provides correct policy citations for T&L questions.", ">90% accuracy in UAT feedback"),
        ("Efficiency", "Time required to audit a set of complex timecards is reduced.", ">50% reduction versus manual process"),
        ("Usability", "End-user satisfaction during pilot testing.", "4/5 average rating"),
        ("Security", "Deployment meets FedRAMP High requirements with data encryption.", "100% security-control validation"),
    ], [1.0, 3.85, 1.65])
    add_heading(doc, "Pilot ground rules and assumptions", level=2)
    add_bullets(doc, [
        "Only approved non-PII or anonymized pilot data will be used for the pilot.",
        "Department of State SMEs will validate policy interpretation and use-case outcomes during UAT.",
        "Changes to scope, data sources, security architecture, or production integrations require joint agreement.",
        "The pilot validates proof of value; production deployment decisions, operating model, and integration scope will be handled separately.",
    ])

    doc.add_page_break()
    add_heading(doc, "7. Roles, contacts, and next steps")
    add_heading(doc, "Key roles", level=2)
    add_matrix(doc, ["Party", "Role", "Contribution"], [
        ("Department of State", "Program Manager", "Own pilot priorities, stakeholder alignment, and decision-making."),
        ("Department of State", "Functional Lead", "Guide T&L use cases, policy content, and UAT feedback."),
        ("Department of State", "Security / ISSO", "Review architecture and security-assessment approach."),
        ("Oracle", "Account Lead / AI Engineering Lead", "Coordinate the engagement and technical delivery."),
    ], [1.35, 1.8, 3.35])
    add_heading(doc, "Contacts", level=2)
    add_matrix(doc, ["Team", "Name", "Role / email"], [
        ("Department of State", "[Name]", "Program Manager"),
        ("Department of State", "[Name]", "Functional Lead"),
        ("Department of State", "[Name]", "Security / ISSO"),
        ("Oracle", "[Name]", "Account Lead — [Email]"),
        ("Oracle", "[Name]", "Enterprise Cloud Architect — [Email]"),
        ("Oracle", "[Name]", "AI Engineering Lead — [Email]"),
    ], [1.65, 1.45, 3.4])
    add_heading(doc, "Next steps", level=2)
    add_bullets(doc, [
        "Confirm the two Time & Labor use cases, pilot users, and success-measurement approach.",
        "Identify approved sample data and policy sources for ingestion.",
        "Confirm the OCI Gov tenancy, security review path, and pilot kickoff date.",
        "Conduct the discovery workshop and finalize the pilot charter.",
    ])

    doc.core_properties.title = "AI Pilot for Department of State — Joint Engagement Plan"
    doc.core_properties.subject = "PeopleSoft Time & Labor AI Pilot"
    doc.core_properties.author = "Oracle"
    doc.save(OUTPUT)
    patch_template_chrome(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build()
