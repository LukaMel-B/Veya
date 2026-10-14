import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Group, Circle

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress running header/footer on cover page

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#8E8E93"))

        # Running Header
        self.drawString(36, 841.89 - 24, "TravelNest — Finalized App Wireframe & Specification Document")
        self.setStrokeColor(colors.HexColor("#007AFF"))
        self.setLineWidth(1)
        self.line(36, 841.89 - 28, 595.27 - 36, 841.89 - 28)

        # Running Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(595.27 - 36, 20, page_str)
        self.drawString(36, 20, "Confidential — TravelNest Architecture Specification")
        self.setStrokeColor(colors.HexColor("#E5E5EA"))
        self.setLineWidth(0.5)
        self.line(36, 30, 595.27 - 36, 30)

        self.restoreState()

def create_phone_drawing(screen_type):
    """Draws precise vector iPhone wireframe representations for all 14 screens."""
    d = Drawing(210, 430)

    # Phone Outer Shell
    d.add(Rect(0, 0, 210, 430, rx=24, ry=24, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#2C2C2E"), strokeWidth=3))

    # Notch / Dynamic Island
    d.add(Rect(65, 416, 80, 12, rx=6, ry=6, fillColor=colors.HexColor("#2C2C2E"), strokeColor=None))

    # Status Bar
    d.add(String(14, 418, "9:41", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.HexColor("#1C1C1E")))
    d.add(String(170, 418, "5G 100%", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))

    # Phone Content Area Background
    d.add(Rect(6, 38, 198, 374, rx=4, ry=4, fillColor=colors.HexColor("#F2F2F7"), strokeColor=None))

    # Bottom Nav Bar Container
    d.add(Rect(0, 0, 210, 38, rx=0, ry=0, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#C6C6C8"), strokeWidth=0.5))

    tabs = ["Home", "Trips", "Inbox", "Map", "Settings"]
    for idx, tab_name in enumerate(tabs):
        tx = 21 + idx * 42
        is_active = (
            (tab_name == "Home" and screen_type == "home") or
            (tab_name == "Trips" and screen_type in ["trips", "trip_overview", "itinerary", "budget", "bookings", "essentials", "docs", "share", "edit_modal"]) or
            (tab_name == "Inbox" and screen_type == "collection") or
            (tab_name == "Map" and screen_type == "map") or
            (tab_name == "Settings" and screen_type == "settings")
        )
        col = colors.HexColor("#007AFF") if is_active else colors.HexColor("#8E8E93")
        d.add(Rect(tx - 6, 20, 12, 12, rx=3, ry=3, fillColor=col, strokeColor=None))
        d.add(String(tx - 10, 8, tab_name, fontName="Helvetica-Bold" if is_active else "Helvetica", fontSize=5.5, fillColor=col))

    # FAB
    if screen_type in ["home", "trips", "trip_overview", "itinerary", "budget", "bookings", "essentials", "docs", "share"]:
        d.add(Circle(182, 58, 14, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(178, 53, "+", fontName="Helvetica-Bold", fontSize=14, fillColor=colors.HexColor("#FFFFFF")))

    # Detailed Content per Screen
    if screen_type == "home":
        d.add(String(12, 396, "Travel Workspace ✨", fontName="Helvetica-Bold", fontSize=8, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(12, 386, "Local-first private workspace", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

        d.add(Rect(12, 305, 186, 75, rx=8, ry=8, fillColor=colors.HexColor("#1C1C1E"), strokeColor=None))
        d.add(Rect(18, 362, 60, 12, rx=6, ry=6, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(22, 366, "⏳ 14 Days Away", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#FFFFFF")))
        d.add(String(18, 335, "Kyoto Cherry Blossom Tour", fontName="Helvetica-Bold", fontSize=8, fillColor=colors.HexColor("#FFFFFF")))
        d.add(String(18, 322, "📍 Kyoto, Japan • Mar 25 - Apr 04", fontName="Helvetica", fontSize=5.5, fillColor=colors.HexColor("#E5E5EA")))
        d.add(String(18, 311, "Planned Budget: ₹1,50,000", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#34C759")))

        d.add(Rect(12, 252, 90, 46, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(18, 286, "Total Outlay", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(18, 272, "₹1,07,000", fontName="Helvetica-Bold", fontSize=8, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 260, "of ₹1,50,000", fontName="Helvetica", fontSize=4.5, fillColor=colors.HexColor("#8E8E93")))

        d.add(Rect(108, 252, 90, 46, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(114, 286, "Packing Progress", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(114, 272, "85%", fontName="Helvetica-Bold", fontSize=8, fillColor=colors.HexColor("#34C759")))
        d.add(String(114, 260, "17/20 items", fontName="Helvetica", fontSize=4.5, fillColor=colors.HexColor("#8E8E93")))

        d.add(Rect(12, 140, 186, 105, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(18, 230, "🔖 Saved Inbox (2 unassigned)", fontName="Helvetica-Bold", fontSize=6, fillColor=colors.HexColor("#007AFF")))
        d.add(Line(12, 222, 198, 222, strokeColor=colors.HexColor("#E5E5EA"), strokeWidth=0.5))
        d.add(String(18, 208, "[PLACE] Fushimi Inari Taisha", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 198, "Early morning hike up torii gate trail", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Line(12, 188, 198, 188, strokeColor=colors.HexColor("#E5E5EA"), strokeWidth=0.5))
        d.add(String(18, 174, "[LINK] Gion Tea Ceremony Booking", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 164, "https://tokyocheapo.com/tea-gion", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

    elif screen_type == "trips":
        d.add(String(12, 396, "My Trips (3)", fontName="Helvetica-Bold", fontSize=9, fillColor=colors.HexColor("#1C1C1E")))
        d.add(Rect(150, 392, 48, 14, rx=4, ry=4, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(154, 396, "+ New Trip", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#FFFFFF")))

        d.add(Rect(12, 374, 25, 10, rx=3, ry=3, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(17, 377, "All", fontName="Helvetica-Bold", fontSize=4.5, fillColor=colors.HexColor("#FFFFFF")))
        d.add(Rect(41, 374, 35, 10, rx=3, ry=3, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(String(45, 377, "Planning", fontName="Helvetica", fontSize=4.5, fillColor=colors.HexColor("#3A3A3C")))
        d.add(Rect(80, 374, 40, 10, rx=3, ry=3, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(String(84, 377, "Upcoming", fontName="Helvetica", fontSize=4.5, fillColor=colors.HexColor("#3A3A3C")))

        d.add(Rect(12, 280, 186, 86, rx=8, ry=8, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(Rect(12, 320, 186, 46, rx=0, ry=0, fillColor=colors.HexColor("#1C1C1E"), strokeColor=None))
        d.add(String(18, 350, "Kyoto Cherry Blossom Tour", fontName="Helvetica-Bold", fontSize=7.5, fillColor=colors.HexColor("#FFFFFF")))
        d.add(String(18, 338, "📍 Kyoto • Mar 25 - Apr 04", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#E5E5EA")))
        d.add(String(18, 304, "Budget: ₹1,50,000 • 👥 2 Travelers", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#007AFF")))
        d.add(String(155, 304, "Open Trip ›", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#007AFF")))

        d.add(Rect(12, 180, 186, 86, rx=8, ry=8, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(Rect(12, 220, 186, 46, rx=0, ry=0, fillColor=colors.HexColor("#2C3E50"), strokeColor=None))
        d.add(String(18, 250, "Goa Beach & Heritage Break", fontName="Helvetica-Bold", fontSize=7.5, fillColor=colors.HexColor("#FFFFFF")))
        d.add(String(18, 238, "📍 Goa, India • Nov 10 - Nov 15", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#E5E5EA")))
        d.add(String(18, 204, "Budget: ₹45,000 • 👥 4 Travelers", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#007AFF")))
        d.add(String(155, 204, "Open Trip ›", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#007AFF")))

    elif screen_type == "edit_modal":
        d.add(Rect(6, 38, 198, 374, rx=4, ry=4, fillColor=colors.HexColor("#000000"), strokeColor=None))
        d.add(Rect(6, 38, 198, 320, rx=12, ry=12, fillColor=colors.HexColor("#FFFFFF"), strokeColor=None))
        d.add(String(14, 342, "Edit Trip Details", fontName="Helvetica-Bold", fontSize=8, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(170, 342, "Cancel", fontName="Helvetica", fontSize=6, fillColor=colors.HexColor("#8E8E93")))
        d.add(Line(6, 334, 204, 334, strokeColor=colors.HexColor("#E5E5EA"), strokeWidth=0.5))

        d.add(String(14, 320, "Trip Title *", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Rect(14, 304, 182, 14, rx=3, ry=3, fillColor=colors.HexColor("#F2F2F7"), strokeColor=colors.HexColor("#C6C6C8"), strokeWidth=0.5))
        d.add(String(18, 308, "Kyoto Cherry Blossom Tour", fontName="Helvetica", fontSize=6, fillColor=colors.HexColor("#1C1C1E")))

        d.add(String(14, 290, "Destinations *", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Rect(14, 274, 182, 14, rx=3, ry=3, fillColor=colors.HexColor("#F2F2F7"), strokeColor=colors.HexColor("#C6C6C8"), strokeWidth=0.5))
        d.add(String(18, 278, "Kyoto, Tokyo, Osaka", fontName="Helvetica", fontSize=6, fillColor=colors.HexColor("#1C1C1E")))

        d.add(String(14, 260, "Start Date", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Rect(14, 244, 86, 14, rx=3, ry=3, fillColor=colors.HexColor("#F2F2F7"), strokeColor=colors.HexColor("#C6C6C8"), strokeWidth=0.5))
        d.add(String(18, 248, "2026-03-25", fontName="Helvetica", fontSize=6, fillColor=colors.HexColor("#1C1C1E")))

        d.add(String(110, 260, "End Date", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Rect(110, 244, 86, 14, rx=3, ry=3, fillColor=colors.HexColor("#F2F2F7"), strokeColor=colors.HexColor("#C6C6C8"), strokeWidth=0.5))
        d.add(String(114, 248, "2026-04-04", fontName="Helvetica", fontSize=6, fillColor=colors.HexColor("#1C1C1E")))

        d.add(String(14, 230, "Planned Target Budget", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Rect(14, 214, 182, 14, rx=3, ry=3, fillColor=colors.HexColor("#F2F2F7"), strokeColor=colors.HexColor("#C6C6C8"), strokeWidth=0.5))
        d.add(String(18, 218, "₹ 150000", fontName="Helvetica", fontSize=6, fillColor=colors.HexColor("#1C1C1E")))

        d.add(String(14, 200, "Travelers (for Expense Splits)", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Rect(14, 184, 182, 14, rx=3, ry=3, fillColor=colors.HexColor("#F2F2F7"), strokeColor=colors.HexColor("#C6C6C8"), strokeWidth=0.5))
        d.add(String(18, 188, "Me, Sarah, Alex", fontName="Helvetica", fontSize=6, fillColor=colors.HexColor("#1C1C1E")))

        d.add(Rect(14, 140, 182, 22, rx=6, ry=6, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(75, 147, "Save Changes", fontName="Helvetica-Bold", fontSize=7, fillColor=colors.HexColor("#FFFFFF")))

    elif screen_type == "trip_overview":
        d.add(String(12, 396, "‹ My Trips", fontName="Helvetica-Bold", fontSize=6, fillColor=colors.HexColor("#007AFF")))
        d.add(Rect(144, 392, 54, 12, rx=3, ry=3, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(String(150, 395, "Edit Trip", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#1C1C1E")))

        d.add(Rect(12, 315, 186, 70, rx=8, ry=8, fillColor=colors.HexColor("#1C1C1E"), strokeColor=None))
        d.add(String(18, 368, "Kyoto Cherry Blossom Tour", fontName="Helvetica-Bold", fontSize=8, fillColor=colors.HexColor("#FFFFFF")))
        d.add(String(18, 356, "📍 Kyoto, Japan • Mar 25 - Apr 04", fontName="Helvetica", fontSize=5.5, fillColor=colors.HexColor("#E5E5EA")))
        d.add(Rect(18, 328, 55, 12, rx=6, ry=6, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(22, 332, "⏳ 14 Days Away", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#FFFFFF")))

        # Segmented Sub-Nav
        d.add(Rect(12, 290, 186, 16, rx=4, ry=4, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(Rect(14, 292, 40, 12, rx=3, ry=3, fillColor=colors.HexColor("#FFFFFF"), strokeColor=None))
        d.add(String(18, 295, "Overview", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(58, 295, "Itinerary(8)", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(100, 295, "Budget", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(135, 295, "Bookings", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(170, 295, "Docs", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

        # Quick Stats
        d.add(Rect(12, 240, 58, 42, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(34, 262, "8", fontName="Helvetica-Bold", fontSize=10, fillColor=colors.HexColor("#007AFF")))
        d.add(String(22, 248, "Schedule", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

        d.add(Rect(76, 240, 58, 42, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(98, 262, "3", fontName="Helvetica-Bold", fontSize=10, fillColor=colors.HexColor("#007AFF")))
        d.add(String(86, 248, "Bookings", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

        d.add(Rect(140, 240, 58, 42, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(154, 262, "12/15", fontName="Helvetica-Bold", fontSize=9, fillColor=colors.HexColor("#34C759")))
        d.add(String(152, 248, "Packed", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

        # Details Card
        d.add(Rect(12, 140, 186, 92, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(18, 218, "Trip Details & Travelers", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 204, "Planned Budget: ₹1,50,000", fontName="Helvetica-Bold", fontSize=6, fillColor=colors.HexColor("#007AFF")))
        d.add(String(18, 192, "Travelers: Me, Sarah, Alex", fontName="Helvetica", fontSize=5.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(Line(12, 184, 198, 184, strokeColor=colors.HexColor("#E5E5EA"), strokeWidth=0.5))
        d.add(String(18, 170, "+ Capture Note, Place or Expense", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 156, "🗓 Add Day-by-Day Activity", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 144, "📱 Generate WhatsApp Schedule", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#1C1C1E")))

    elif screen_type == "itinerary":
        d.add(Rect(12, 390, 50, 12, rx=4, ry=4, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(16, 393, "Day 1 • Mar 25", fontName="Helvetica-Bold", fontSize=4.5, fillColor=colors.HexColor("#FFFFFF")))
        d.add(Rect(66, 390, 50, 12, rx=4, ry=4, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(String(70, 393, "Day 2 • Mar 26", fontName="Helvetica-Bold", fontSize=4.5, fillColor=colors.HexColor("#3A3A3C")))
        d.add(Rect(120, 390, 50, 12, rx=4, ry=4, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(String(124, 393, "Day 3 • Mar 27", fontName="Helvetica-Bold", fontSize=4.5, fillColor=colors.HexColor("#3A3A3C")))

        d.add(Rect(12, 362, 186, 22, rx=4, ry=4, fillColor=colors.HexColor("#FFF3E0"), strokeColor=colors.HexColor("#FF9500"), strokeWidth=0.5))
        d.add(String(16, 370, "⚠️ Overlap Warning: Flight JL708 lands 14:00,", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#D97706")))
        d.add(String(16, 364, "Hotel check-in scheduled for 13:30.", fontName="Helvetica", fontSize=4.5, fillColor=colors.HexColor("#D97706")))

        d.add(Rect(12, 305, 186, 50, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(18, 338, "09:30 AM", fontName="Helvetica-Bold", fontSize=6, fillColor=colors.HexColor("#007AFF")))
        d.add(String(55, 338, "🛫 Flight JL708 Departure", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(55, 326, "DEL ➔ KIX • Terminal 1", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

        d.add(Rect(12, 248, 186, 50, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#FF9500"), strokeWidth=1.5))
        d.add(String(18, 281, "01:30 PM", fontName="Helvetica-Bold", fontSize=6, fillColor=colors.HexColor("#FF9500")))
        d.add(String(55, 281, "🏨 Hotel Gracery Check-in", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(55, 269, "Kyoto Sanjo • Conf #HG-9912", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Rect(150, 280, 42, 10, rx=3, ry=3, fillColor=colors.HexColor("#FF9500"), strokeColor=None))
        d.add(String(154, 283, "Conflict ⚠️", fontName="Helvetica-Bold", fontSize=4.5, fillColor=colors.HexColor("#FFFFFF")))

        d.add(Rect(12, 191, 186, 50, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(18, 224, "05:00 PM", fontName="Helvetica-Bold", fontSize=6, fillColor=colors.HexColor("#007AFF")))
        d.add(String(55, 224, "🍜 Gion Ramen Dinner", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(55, 212, "Reservation for 3 people", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

    elif screen_type == "budget":
        d.add(Rect(12, 388, 186, 16, rx=4, ry=4, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(Rect(14, 390, 90, 12, rx=3, ry=3, fillColor=colors.HexColor("#FFFFFF"), strokeColor=None))
        d.add(String(24, 393, "Expenses & Budget", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(114, 393, "Group Settlement", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

        d.add(Rect(12, 310, 186, 70, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(18, 362, "TOTAL OUTLAY VS PLANNED", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(18, 346, "₹1,07,000 / ₹1,50,000", fontName="Helvetica-Bold", fontSize=9, fillColor=colors.HexColor("#007AFF")))
        d.add(Rect(18, 334, 174, 6, rx=3, ry=3, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(Rect(18, 334, 124, 6, rx=3, ry=3, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(18, 322, "Bookings: ₹65,000 • Expenses: ₹42,000", fontName="Helvetica", fontSize=4.5, fillColor=colors.HexColor("#8E8E93")))

        d.add(Rect(12, 210, 186, 92, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(18, 288, "Group Debt Balances (3 Travelers)", fontName="Helvetica-Bold", fontSize=6, fillColor=colors.HexColor("#1C1C1E")))
        d.add(Rect(144, 284, 48, 12, rx=4, ry=4, fillColor=colors.HexColor("#34C759"), strokeColor=None))
        d.add(String(150, 288, "Settle Up", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#FFFFFF")))
        d.add(Line(12, 278, 198, 278, strokeColor=colors.HexColor("#E5E5EA"), strokeWidth=0.5))

        d.add(String(18, 264, "Sarah paid ₹12,000 for Dinner", fontName="Helvetica-Bold", fontSize=6, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 254, "Split equally (₹4,000 each)", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(130, 260, "You owe ₹4,000", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#FF3B30")))

        d.add(Line(12, 246, 198, 246, strokeColor=colors.HexColor("#E5E5EA"), strokeWidth=0.5))
        d.add(String(18, 232, "You paid ₹15,000 for Bullet Train", fontName="Helvetica-Bold", fontSize=6, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 222, "Split equally (₹5,000 each)", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(125, 228, "Alex owes ₹5,000", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#34C759")))

    elif screen_type == "bookings":
        d.add(Rect(12, 390, 35, 12, rx=4, ry=4, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(18, 393, "All (3)", fontName="Helvetica-Bold", fontSize=4.5, fillColor=colors.HexColor("#FFFFFF")))
        d.add(Rect(51, 390, 40, 12, rx=4, ry=4, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(String(56, 393, "Flights", fontName="Helvetica", fontSize=4.5, fillColor=colors.HexColor("#3A3A3C")))
        d.add(Rect(95, 390, 38, 12, rx=4, ry=4, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(String(100, 393, "Hotels", fontName="Helvetica", fontSize=4.5, fillColor=colors.HexColor("#3A3A3C")))

        # Booking Card 1
        d.add(Rect(12, 310, 186, 70, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(Rect(18, 362, 36, 10, rx=3, ry=3, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(22, 365, "FLIGHT", fontName="Helvetica-Bold", fontSize=4.5, fillColor=colors.HexColor("#FFFFFF")))
        d.add(Rect(160, 362, 30, 10, rx=3, ry=3, fillColor=colors.HexColor("#34C759"), strokeColor=None))
        d.add(String(165, 365, "PAID", fontName="Helvetica-Bold", fontSize=4.5, fillColor=colors.HexColor("#FFFFFF")))
        d.add(String(18, 348, "Japan Airlines JL708", fontName="Helvetica-Bold", fontSize=7, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 338, "DEL ➔ KIX • PNR: JL-884920", fontName="Helvetica", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(18, 318, "Cost: ₹45,000", fontName="Helvetica-Bold", fontSize=6, fillColor=colors.HexColor("#007AFF")))
        d.add(Rect(138, 314, 52, 12, rx=3, ry=3, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(String(142, 317, "📄 Ticket PDF", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#1C1C1E")))

        # Booking Card 2
        d.add(Rect(12, 230, 186, 70, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(Rect(18, 282, 36, 10, rx=3, ry=3, fillColor=colors.HexColor("#5856D6"), strokeColor=None))
        d.add(String(22, 285, "HOTEL", fontName="Helvetica-Bold", fontSize=4.5, fillColor=colors.HexColor("#FFFFFF")))
        d.add(String(18, 268, "Hotel Gracery Kyoto Sanjo", fontName="Helvetica-Bold", fontSize=7, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 258, "Check-in: Mar 25 • Conf #HG-9912", fontName="Helvetica", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(18, 238, "Cost: ₹35,000", fontName="Helvetica-Bold", fontSize=6, fillColor=colors.HexColor("#007AFF")))
        d.add(Rect(138, 234, 52, 12, rx=3, ry=3, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(String(142, 237, "📄 Voucher PDF", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#1C1C1E")))

    elif screen_type == "essentials":
        d.add(Rect(12, 388, 186, 16, rx=4, ry=4, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(Rect(14, 390, 90, 12, rx=3, ry=3, fillColor=colors.HexColor("#FFFFFF"), strokeColor=None))
        d.add(String(26, 393, "Packing Checklist", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(120, 393, "Prep Tasks", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

        # Progress
        d.add(Rect(12, 342, 186, 38, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(18, 366, "Packing Completion Progress", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(154, 366, "85% (17/20)", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#34C759")))
        d.add(Rect(18, 352, 174, 5, rx=2, ry=2, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(Rect(18, 352, 148, 5, rx=2, ry=2, fillColor=colors.HexColor("#34C759"), strokeColor=None))

        # Checklist rows
        d.add(Rect(12, 230, 186, 104, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(18, 318, "✓ Passport & Japan Visa", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(18, 308, "Category: Documents • High Priority", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Line(12, 300, 198, 300, strokeColor=colors.HexColor("#E5E5EA"), strokeWidth=0.5))

        d.add(String(18, 286, "✓ Universal Power Adapter", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(18, 276, "Category: Electronics • Qty: 2", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Line(12, 268, 198, 268, strokeColor=colors.HexColor("#E5E5EA"), strokeWidth=0.5))

        d.add(String(18, 254, "☐ Comfortable Walking Shoes", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 244, "Category: Clothing • Qty: 1 pair", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

    elif screen_type == "map":
        d.add(Rect(6, 38, 198, 374, rx=4, ry=4, fillColor=colors.HexColor("#E0ECE4"), strokeColor=None))
        for i in range(10, 200, 30):
            d.add(Line(i, 38, i, 412, strokeColor=colors.HexColor("#C0D6C8"), strokeWidth=0.5))
        for j in range(50, 410, 30):
            d.add(Line(6, j, 204, j, strokeColor=colors.HexColor("#C0D6C8"), strokeWidth=0.5))

        d.add(Circle(70, 320, 7, fillColor=colors.HexColor("#5856D6"), strokeColor=colors.HexColor("#FFFFFF"), strokeWidth=1))
        d.add(String(60, 332, "🏨 Hotel Gracery", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#5856D6")))

        d.add(Circle(130, 240, 8, fillColor=colors.HexColor("#007AFF"), strokeColor=colors.HexColor("#FFFFFF"), strokeWidth=1.5))
        d.add(String(110, 253, "⛩️ Fushimi Inari", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#007AFF")))

        d.add(Rect(12, 48, 186, 68, rx=8, ry=8, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(18, 102, "Fushimi Inari Taisha", fontName="Helvetica-Bold", fontSize=7.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 92, "Fushimi Ward, Kyoto • 4.8 ★", fontName="Helvetica", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Rect(18, 56, 100, 16, rx=4, ry=4, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(26, 61, "+ Add to Itinerary", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#FFFFFF")))
        d.add(Rect(124, 56, 68, 16, rx=4, ry=4, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(String(132, 61, "🗺 Open Maps", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#1C1C1E")))

    elif screen_type == "docs":
        d.add(String(12, 396, "Document Vault (4)", fontName="Helvetica-Bold", fontSize=9, fillColor=colors.HexColor("#1C1C1E")))
        d.add(Rect(150, 392, 48, 14, rx=4, ry=4, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(156, 396, "+ Upload", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#FFFFFF")))

        d.add(Rect(12, 374, 186, 14, rx=4, ry=4, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#C6C6C8"), strokeWidth=0.5))
        d.add(String(18, 378, "🔍 Search passports, visas, tickets...", fontName="Helvetica", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))

        # Docs grid 2x2
        d.add(Rect(12, 280, 88, 84, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(Rect(22, 314, 68, 42, rx=4, ry=4, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(String(46, 330, "📄", fontName="Helvetica", fontSize=14, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(16, 302, "Passport_Luha.pdf", fontName="Helvetica-Bold", fontSize=6, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(16, 292, "1.2 MB • Passport", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

        d.add(Rect(110, 280, 88, 84, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(Rect(120, 314, 68, 42, rx=4, ry=4, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(String(144, 330, "✈️", fontName="Helvetica", fontSize=14, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(114, 302, "JAL_Ticket_JL708.pdf", fontName="Helvetica-Bold", fontSize=6, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(114, 292, "850 KB • Flight", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

    elif screen_type == "share":
        d.add(String(12, 396, "WhatsApp Export Generator", fontName="Helvetica-Bold", fontSize=8.5, fillColor=colors.HexColor("#1C1C1E")))

        d.add(Rect(12, 370, 186, 16, rx=4, ry=4, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(Rect(14, 372, 60, 12, rx=3, ry=3, fillColor=colors.HexColor("#FFFFFF"), strokeColor=None))
        d.add(String(20, 375, "Full Itinerary", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(80, 375, "Day 1", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(115, 375, "Bookings", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

        d.add(Rect(12, 240, 186, 120, rx=6, ry=6, fillColor=colors.HexColor("#EEF9F2"), strokeColor=colors.HexColor("#25D366"), strokeWidth=1))
        d.add(String(18, 348, "LIVE WHATSAPP TEXT PREVIEW", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#075E54")))
        d.add(String(18, 334, "*🌸 Kyoto Cherry Blossom Tour*", fontName="Helvetica-Bold", fontSize=6, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 324, "📅 Mar 25 - Apr 04", fontName="Helvetica", fontSize=5.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 308, "*Day 1 (Mar 25)*", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 296, "• 🛫 09:30 - Flight JL708 Departure", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 286, "• 🏨 13:30 - Check-in Hotel Gracery", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 276, "• 🍜 17:00 - Gion Ramen Dinner", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#1C1C1E")))

        d.add(Rect(12, 190, 186, 42, rx=6, ry=6, fillColor=colors.HexColor("#25D366"), strokeColor=None))
        d.add(String(50, 208, "📱 Share via WhatsApp", fontName="Helvetica-Bold", fontSize=8, fillColor=colors.HexColor("#FFFFFF")))

    elif screen_type == "collection":
        d.add(String(12, 396, "Global Collection Inbox", fontName="Helvetica-Bold", fontSize=9, fillColor=colors.HexColor("#1C1C1E")))
        d.add(Rect(12, 374, 186, 14, rx=4, ry=4, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#C6C6C8"), strokeWidth=0.5))
        d.add(String(18, 378, "🔍 Search saved spots & links...", fontName="Helvetica", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))

        d.add(Rect(12, 260, 186, 104, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(Rect(18, 342, 30, 10, rx=3, ry=3, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(22, 345, "PLACE", fontName="Helvetica-Bold", fontSize=4.5, fillColor=colors.HexColor("#FFFFFF")))
        d.add(String(52, 344, "Arashiyama Bamboo Grove", fontName="Helvetica-Bold", fontSize=7, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 332, "Unassigned • Saved from Instagram reel", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Rect(154, 330, 38, 12, rx=3, ry=3, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(160, 333, "Assign", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#FFFFFF")))

        d.add(Line(12, 320, 198, 320, strokeColor=colors.HexColor("#E5E5EA"), strokeWidth=0.5))

        d.add(Rect(18, 302, 28, 10, rx=3, ry=3, fillColor=colors.HexColor("#5856D6"), strokeColor=None))
        d.add(String(22, 305, "LINK", fontName="Helvetica-Bold", fontSize=4.5, fillColor=colors.HexColor("#FFFFFF")))
        d.add(String(50, 304, "Tenryu-ji Temple Guide", fontName="Helvetica-Bold", fontSize=7, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 292, "https://japan-guide.com/e/e3912.html", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Rect(154, 290, 38, 12, rx=3, ry=3, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(160, 293, "Assign", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#FFFFFF")))

    elif screen_type == "settings":
        d.add(String(12, 396, "Settings & Backup", fontName="Helvetica-Bold", fontSize=9, fillColor=colors.HexColor("#1C1C1E")))

        d.add(Rect(12, 320, 186, 64, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(18, 372, "LOCAL STORAGE", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(18, 356, "Storage Space Used", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(18, 344, "4.8 MB (IndexedDB Local Data)", fontName="Helvetica", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))

        d.add(Rect(12, 200, 186, 110, rx=6, ry=6, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#D1D1D6"), strokeWidth=0.5))
        d.add(String(18, 296, "BACKUP & RESTORE ENGINE", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

        d.add(Rect(18, 260, 174, 24, rx=6, ry=6, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(32, 269, "📦 Export Full Backup (.travelnest ZIP)", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.HexColor("#FFFFFF")))

        d.add(Rect(18, 224, 174, 24, rx=6, ry=6, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(String(42, 233, "📥 Import & Restore Backup Archive", fontName="Helvetica-Bold", fontSize=6.5, fillColor=colors.HexColor("#1C1C1E")))

    elif screen_type == "quick_add":
        d.add(Rect(6, 38, 198, 374, rx=4, ry=4, fillColor=colors.HexColor("#000000"), strokeColor=None))
        d.add(Rect(6, 38, 198, 280, rx=12, ry=12, fillColor=colors.HexColor("#FFFFFF"), strokeColor=None))
        d.add(String(14, 302, "Quick Capture", fontName="Helvetica-Bold", fontSize=8, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(170, 302, "Cancel", fontName="Helvetica", fontSize=6, fillColor=colors.HexColor("#8E8E93")))
        d.add(Line(6, 294, 204, 294, strokeColor=colors.HexColor("#E5E5EA"), strokeWidth=0.5))

        d.add(Rect(14, 272, 182, 16, rx=4, ry=4, fillColor=colors.HexColor("#E5E5EA"), strokeColor=None))
        d.add(Rect(16, 274, 40, 12, rx=3, ry=3, fillColor=colors.HexColor("#FFFFFF"), strokeColor=None))
        d.add(String(22, 277, "📍 Place", fontName="Helvetica-Bold", fontSize=5, fillColor=colors.HexColor("#1C1C1E")))
        d.add(String(62, 277, "🔗 Link", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(102, 277, "📝 Note", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))
        d.add(String(142, 277, "💸 Expense", fontName="Helvetica", fontSize=5, fillColor=colors.HexColor("#8E8E93")))

        d.add(String(14, 256, "Spot Name *", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Rect(14, 240, 182, 14, rx=3, ry=3, fillColor=colors.HexColor("#F2F2F7"), strokeColor=colors.HexColor("#C6C6C8"), strokeWidth=0.5))
        d.add(String(18, 244, "Kiyomizu-dera Temple", fontName="Helvetica", fontSize=6, fillColor=colors.HexColor("#1C1C1E")))

        d.add(String(14, 226, "Target Trip", fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor("#8E8E93")))
        d.add(Rect(14, 210, 182, 14, rx=3, ry=3, fillColor=colors.HexColor("#F2F2F7"), strokeColor=colors.HexColor("#C6C6C8"), strokeWidth=0.5))
        d.add(String(18, 214, "Kyoto Cherry Blossom Tour (Active)", fontName="Helvetica", fontSize=6, fillColor=colors.HexColor("#1C1C1E")))

        d.add(Rect(14, 160, 182, 22, rx=6, ry=6, fillColor=colors.HexColor("#007AFF"), strokeColor=None))
        d.add(String(65, 167, "Save to Collection", fontName="Helvetica-Bold", fontSize=7, fillColor=colors.HexColor("#FFFFFF")))

    return d

def build_pdf():
    pdf_filename = "TravelNest_Finalized_App_Wireframe_Document.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    cover_title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=32,
        textColor=colors.HexColor('#000000'),
        spaceAfter=8
    )

    cover_subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#3A3A3C'),
        spaceAfter=24
    )

    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#000000'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    subsection_title_style = ParagraphStyle(
        'SubSectionTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#007AFF'),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor('#1C1C1E'),
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor('#1C1C1E')
    )

    story = []

    # ================= COVER PAGE =================
    story.append(Spacer(1, 15))
    story.append(Paragraph("<font color='#007AFF'><b>LOCAL-FIRST PRIVATE TRAVEL WORKSPACE</b></font>", body_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("TravelNest", cover_title_style))
    story.append(Paragraph("Finalized Application Wireframe & System Architecture Document<br/><font size=9 color='#8E8E93'>Complete Visual Screen-by-Screen Specifications Across All 14 App Pages</font>", cover_subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#007AFF'), spaceAfter=16))

    meta_data = [
        [Paragraph("<b>Target Platform:</b> Android & iOS PWA", body_style), Paragraph("<b>Document Version:</b> 1.0.0 (Finalized)", body_style)],
        [Paragraph("<b>Data Engine:</b> Dexie.js (IndexedDB) + OPFS", body_style), Paragraph("<b>UI Framework:</b> iOS Cupertino Design Tokens", body_style)],
        [Paragraph("<b>Document Date:</b> October 10, 2026", body_style), Paragraph("<b>Lead Authors:</b> Luha Saniyya & Antigravity AI", body_style)],
    ]
    t_meta = Table(meta_data, colWidths=[250, 250])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F2F2F7')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E5EA')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E5EA')),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 16))

    story.append(Paragraph("<b>Finalized Functional Capabilities Summary</b>", subsection_title_style))
    story.append(Paragraph("✓ <b>Global Collection Inbox:</b> Staging inbox for unassigned links, places, and notes captured from social media.", body_style))
    story.append(Paragraph("✓ <b>Context-Aware Home Dashboard:</b> Featured trip card, departure countdown (⏳ N Days Away), outlay budget metrics, packing gauge.", body_style))
    story.append(Paragraph("✓ <b>Chronological Itinerary Timeline:</b> Drag-and-drop ordering, day selector tabs, and <b>Overlap Conflict Advisory (⚠️ badge)</b>.", body_style))
    story.append(Paragraph("✓ <b>3-Tier Financial Ledger:</b> Planned vs Committed Bookings vs Actual Expenses with double-counting prevention.", body_style))
    story.append(Paragraph("✓ <b>Group Expense Splitter & Settlement:</b> Bilateral debt minimization calculation with one-tap 'Settle Up'.", body_style))
    story.append(Paragraph("✓ <b>Interactive Leaflet Map:</b> Color-coded pins for saved places, itinerary stops, and hotel bookings.", body_style))
    story.append(Paragraph("✓ <b>Binary Document Vault:</b> Offline blob storage for passports, flight tickets, and vouchers.", body_style))
    story.append(Paragraph("✓ <b>WhatsApp Share Engine:</b> Formatted Markdown export with Web Share API and privacy filters.", body_style))
    story.append(Paragraph("✓ <b>JSON + Blob ZIP Backup:</b> Single <code>.travelnest</code> archive export/import utility with transactional rollback.", body_style))

    story.append(PageBreak())

    # ================= SECTION 1: EVOLUTION & REVISION MATRIX =================
    story.append(Paragraph("1. Initial Stage vs. Finalized App Evolution", section_title_style))
    story.append(Paragraph(
        "TravelNest evolved from an initial PRD draft addressing travel data fragmentation into a finalized local-first application workspace. "
        "The revision matrix below documents every initial requirement alongside its finalized implementation and UI updates delivered in the completed codebase.",
        body_style
    ))
    story.append(Spacer(1, 6))

    matrix_data = [
        [Paragraph("<b>Module / Feature</b>", body_style), Paragraph("<b>Initial Stage Requirement (PRD)</b>", body_style), Paragraph("<b>Finalized App Implementation & UI Updates</b>", body_style)],
        [Paragraph("<b>UI Design System</b>", body_style), Paragraph("Generic mobile layout with basic utilities.", body_style), Paragraph("<b>iOS Cupertino System:</b> SF font stack, glassmorphism bottom nav, inset grouped cards, segmented controls, status badges.", body_style)],
        [Paragraph("<b>Home Dashboard</b>", body_style), Paragraph("Basic trip overview card.", body_style), Paragraph("<b>Context Dashboard:</b> Next-trip countdown card, total outlay metrics, packing progress bar, saved inbox preview.", body_style)],
        [Paragraph("<b>Itinerary Module</b>", body_style), Paragraph("Simple vertical list of activities.", body_style), Paragraph("<b>Chronological Timeline:</b> Multi-day pill tab bar, activity category icons, drag-reordering, <b>Overlap Conflict Advisory (⚠️)</b>.", body_style)],
        [Paragraph("<b>Budget & Money</b>", body_style), Paragraph("Total expense calculator.", body_style), Paragraph("<b>3-Tier Financial Ledger:</b> Planned vs Committed vs Actual. Stored exchange rates, <b>Group Expense Splitter with Settle Up</b>.", body_style)],
        [Paragraph("<b>Bookings & Vault</b>", body_style), Paragraph("Text confirmation notes.", body_style), Paragraph("<b>Reservations & Doc Vault:</b> Filterable booking cards, PNR tracking, payment status pills, offline PDF/image viewer.", body_style)],
        [Paragraph("<b>Interactive Map</b>", body_style), Paragraph("Static pin list.", body_style), Paragraph("<b>Spatial Leaflet Map:</b> Custom markers (Places, Itinerary stops, Hotels), layer filters, place card popup launcher.", body_style)],
        [Paragraph("<b>WhatsApp Share</b>", body_style), Paragraph("Plain text clipboard copy.", body_style), Paragraph("<b>Formatting Engine:</b> Web Share API integration, privacy toggles (hide IDs/costs), custom Markdown text builder.", body_style)],
        [Paragraph("<b>Backup Engine</b>", body_style), Paragraph("JSON data string export.", body_style), Paragraph("<b>Blob ZIP Backup:</b> Single <code>.travelnest</code> ZIP file holding IndexedDB tables and binary files with transactional rollback.", body_style)],
    ]

    t_matrix = Table(matrix_data, colWidths=[95, 190, 235])
    t_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F2F2F7')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D1D1D6')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_matrix)

    story.append(PageBreak())

    # ================= SECTION 2: SCREEN BY SCREEN WIREFRAMES (14 PAGES) =================
    screens_spec = [
        ("Screen 1: Home Dashboard (`HomeView.tsx`)", "home", [
            ("Header Tagline", "Contextual greeting with 'Travel Workspace' title and local-first private indicator."),
            ("Featured Next Trip", "Scans IndexedDB for nearest active trip. Displays cover photo, status pill, and live departure countdown (⏳ N Days Away)."),
            ("Planned Budget", "Banner showcasing total planned expenditure with one-tap 'Open Trip' navigation trigger."),
            ("Outlay & Packing", "Metrics grid displaying total committed outlay across active trips and packing completion percentage gauge."),
            ("Saved Inbox", "Preview of unassigned saved collection items captured from social media or quick notes."),
            ("FAB", "Persistent floating capture button opening Quick Add bottom sheet modal.")
        ]),
        ("Screen 2: My Trips Hub (`TripsView.tsx`)", "trips", [
            ("View Toggle", "Segmented Grid View vs List View toggle for trip cards."),
            ("Status Filters", "Horizontal filter bar allowing instant filtering by status: All, Planning, Upcoming, Ongoing, Completed, Archived."),
            ("Trip Cards", "Displays cover photo, trip name, target destinations, date range, live countdown badge, budget, and traveler count."),
            ("Create Trip CTA", "+ New Trip header button and persistent FAB both trigger the EditTripModal dialog.")
        ]),
        ("Screen 3: Create & Edit Trip Modal (`EditTripModal.tsx`)", "edit_modal", [
            ("Cupertino Sheet", "Bottom sheet modal dialog rendered inside React portal with dark backdrop dimming."),
            ("Form Fields", "Trip Title, Destination List, Start/End Dates, Cover Photo URL, Default Currency dropdown (INR, USD, EUR, GBP, JPY), Target Budget, Traveler Names."),
            ("Relative Shift", "If trip dates change, prompts user whether to automatically shift all scheduled itinerary events by the exact day delta.")
        ]),
        ("Screen 4: Trip Workspace Overview (`TripDetailView.tsx`)", "trip_overview", [
            ("Sub-Nav Control", "8-tab Cupertino Segmented Sub-Navigation bar with dynamic item count badges: Overview, Itinerary, Budget, Bookings, Essentials, Map, Docs, WhatsApp."),
            ("Hero Banner", "Visual header card with cover photo, countdown badge, destination, and dates."),
            ("Quick Metrics", "Summary cards linking directly to Itinerary, Bookings, and Essentials modules."),
            ("Inset Quick Actions", "Grouped list rows with instant triggers for capture, activity logging, and WhatsApp summary generation.")
        ]),
        ("Screen 5: Itinerary Builder & Timeline (`ItineraryView.tsx`)", "itinerary", [
            ("Day Selector", "Horizontal pill carousel displaying relative trip days (Day 1, Day 2...) paired with exact dates."),
            ("Vertical Timeline", "Time-ordered activity cards with category badges (Flight, Hotel, Food, Sightseeing, Transport, Note)."),
            ("Conflict Advisory", "Scans start/end times within timeline. If Event B Start < Event A End, renders a ⚠️ warning banner and amber border highlight."),
            ("Drag & Reorder", "Allows manual drag ordering of activities within a day timeline.")
        ]),
        ("Screen 6: Budget & Group Split Settlements (`BudgetView.tsx`)", "budget", [
            ("Segmented View", "Toggles between Expense Log & Category Breakdown vs Group Debt Settlement Ledger."),
            ("Outlay Gauge", "Displays Total Planned Budget vs Outlay (Bookings + Independent Expenses) with a color progress bar."),
            ("Double-Counting Rule", "If expense is linked to a booking, subtracts from booking outstanding without double-counting towards total outlay."),
            ("Group Debt Calculator", "Computes who paid, who owes whom, equal or custom splits, and provides a 'Settle Up' action button.")
        ]),
        ("Screen 7: Bookings Manager (`BookingsView.tsx`)", "bookings", [
            ("Category Filters", "Filter reservation cards by category: All, Flights, Hotels, Trains, Rental Cars, Experiences."),
            ("Reservation Cards", "Displays provider name, confirmation PNR, check-in/out dates, seat numbers, total cost, and payment status pill."),
            ("Document Launcher", "Direct shortcut button on booking cards that opens attached binary PDF tickets or vouchers.")
        ]),
        ("Screen 8: Essentials & Packing Checklist (`EssentialsView.tsx`)", "essentials", [
            ("Sub-Segmented Control", "Toggles between Packing Checklist and Departure Prep Tasks."),
            ("Category Pills", "Filter checklist by Clothing, Electronics, Toiletries, Documents, Medicine, Misc."),
            ("Interactive Checkboxes", "One-tap toggle automatically recalculates packing completion percentage bar."),
            ("Preset Templates", "One-click dropdown to instantly populate checklists with pre-loaded travel templates (Beach, Hiking, International).")
        ]),
        ("Screen 9: Interactive Map View (`MapView.tsx`)", "map", [
            ("Leaflet Engine", "OpenStreetMap tiles rendered via Leaflet.js with cached tile support for offline viewing."),
            ("Custom Pins", "Color-coded visual pin markers: Blue = Saved Place, Green = Scheduled Itinerary Stop, Purple = Hotel Reservation."),
            ("Popup Card", "Tapping any map pin slides up a detailed place card showing title, notes, and instant triggers to schedule in itinerary or launch external navigation.")
        ]),
        ("Screen 10: Document Vault (`DocumentsView.tsx`)", "docs", [
            ("Binary Vault", "Stores original document binaries (PDF, PNG, JPG) in IndexedDB Blobs / OPFS with offline access."),
            ("Grid & Cards", "Displays file thumbnails, file size, MIME type badges, category tags, and instant full-screen preview modal."),
            ("Upload Picker", "Native file picker integration with client-side 5MB size limit validation.")
        ]),
        ("Screen 11: WhatsApp & Companion Share (`ShareView.tsx`)", "share", [
            ("Text Formatter", "Generates clean plain text formatted with WhatsApp markdown (*bold titles*, _italics_, bullet emojis)."),
            ("Privacy Options", "Explicit opt-in toggles to strip sensitive booking reference numbers, private notes, or financial costs before sharing."),
            ("Web Share API", "Invokes native share sheet targeting WhatsApp, Telegram, or SMS with fallback to clipboard copy.")
        ]),
        ("Screen 12: Global Collection Inbox (`CollectionView.tsx`)", "collection", [
            ("Global Inbox", "Staging area for places, links, videos, and notes saved prior to trip assignment."),
            ("Source Badges", "Displays origin badges (Instagram, Web Link, Quick Note) and metadata previews."),
            ("Assign Action", "One-click modal to link inbox item to a specific trip or convert into an itinerary activity.")
        ]),
        ("Screen 13: Settings & Backup/Restore (`SettingsView.tsx`)", "settings", [
            ("Storage Meter", "Live meter showing IndexedDB storage space consumed and local storage persistence state."),
            ("ZIP Backup Engine", "Exports single compressed .travelnest ZIP file containing database.json and /attachments binaries."),
            ("Transactional Restore", "Imports backup ZIP with schema version validation and full transactional rollback protection.")
        ]),
        ("Screen 14: Global Quick Capture Modal (`QuickAddModal.tsx`)", "quick_add", [
            ("Frictionless Capture", "Opens from any screen within < 3 interactions via persistent floating action button."),
            ("Type Pills", "Type selector pills: Place, Link, Note, Expense."),
            ("Smart Assignment", "Pre-selects current active trip context if triggered inside a trip workspace; otherwise defaults to Global Inbox.")
        ])
    ]

    for title, screen_type, specs in screens_spec:
        story.append(Paragraph(title, section_title_style))

        spec_rows = [[Paragraph("<b>Component / Element</b>", body_style), Paragraph("<b>Functional Specification & System Behavior</b>", body_style)]]
        for comp, spec in specs:
            spec_rows.append([Paragraph(f"<b>{comp}</b>", body_style), Paragraph(spec, body_style)])

        t_spec = Table(spec_rows, colWidths=[105, 180])
        t_spec.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F2F2F7')),
            ('PADDING', (0,0), (-1,-1), 4),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D1D1D6')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))

        phone_dwg = create_phone_drawing(screen_type)

        grid_table = Table([[phone_dwg, t_spec]], colWidths=[215, 290])
        grid_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 0),
        ]))

        story.append(grid_table)
        story.append(PageBreak())

    # ================= SECTION 3: SYSTEM CALCULATION LOGIC =================
    story.append(Paragraph("3. Key Business Logic & System Calculation Matrix", section_title_style))

    story.append(Paragraph("1. Budget Double-Counting Prevention Engine", subsection_title_style))
    story.append(Paragraph("To ensure the financial ledger accurately tracks commitments without double counting:", body_style))
    story.append(Paragraph("<font color='#007AFF'><b>TotalOutlay = Sum(IndependentExpenses) + Sum(Bookings.cost)</b></font><br/><i>Rule: If an Expense is explicitly linked to a Booking (payment), the Expense amount subtracts from the Booking outstanding balance and is NOT added to TotalOutlay again.</i>", body_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("2. Group Expense Settlement Minimization Algorithm", subsection_title_style))
    story.append(Paragraph("Calculates net balances across group travelers to minimize payments:", body_style))
    code_text = (
        "For each Expense E in Trip:<br/>"
        "&nbsp;&nbsp;Payer = E.paidBy;<br/>"
        "&nbsp;&nbsp;SharePerPerson = E.amount / E.travelers.length;<br/>"
        "&nbsp;&nbsp;For each Person P in E.travelers:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;If (P != Payer) DebtMatrix[P][Payer] += SharePerPerson;<br/>"
        "Net bilateral debts are simplified to output single 'Settle Up' transactions."
    )
    story.append(Paragraph(code_text, code_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("3. Itinerary Overlap Advisory Algorithm", subsection_title_style))
    story.append(Paragraph("Detects temporal collisions between itinerary activities within a day timeline:", body_style))
    code_text2 = (
        "Sort day events by startTime;<br/>"
        "For i = 0 to events.length - 2:<br/>"
        "&nbsp;&nbsp;Curr = events[i]; Next = events[i+1];<br/>"
        "&nbsp;&nbsp;If (Next.startTime &lt; Curr.endTime) {<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;FlagConflict(Curr, Next, '⚠️ Time Overlap Warning');<br/>"
        "&nbsp;&nbsp;}"
    )
    story.append(Paragraph(code_text2, code_style))

    story.append(Spacer(1, 16))

    # ================= SECTION 4: DELIVERABLES & VERIFICATION =================
    story.append(Paragraph("4. Deliverables & Final Verification Checklist", section_title_style))
    story.append(Paragraph("The finalized TravelNest application completely satisfies all functional and non-functional requirements:", body_style))
    story.append(Spacer(1, 6))

    chk_data = [
        [Paragraph("<b>Req ID</b>", body_style), Paragraph("<b>Requirement Description</b>", body_style), Paragraph("<b>Status</b>", body_style), Paragraph("<b>Implementation Verification</b>", body_style)],
        [Paragraph("<b>FR-COL-001</b>", body_style), Paragraph("Quick capture unassigned inbox items", body_style), Paragraph("<font color='#34C759'><b>VERIFIED</b></font>", body_style), Paragraph("QuickAddModal & CollectionView with 3-tap capture.", body_style)],
        [Paragraph("<b>FR-ITN-001</b>", body_style), Paragraph("Manual itinerary timeline ordering", body_style), Paragraph("<font color='#34C759'><b>VERIFIED</b></font>", body_style), Paragraph("Drag-and-drop reordering in ItineraryView.", body_style)],
        [Paragraph("<b>FR-ITN-002</b>", body_style), Paragraph("Conflict Advisory Warning", body_style), Paragraph("<font color='#34C759'><b>VERIFIED</b></font>", body_style), Paragraph("⚠️ Overlap engine flags collisions on timeline cards.", body_style)],
        [Paragraph("<b>FR-BUD-001</b>", body_style), Paragraph("Distinct budget states", body_style), Paragraph("<font color='#34C759'><b>VERIFIED</b></font>", body_style), Paragraph("Calculates Planned vs Outlay without double counting.", body_style)],
        [Paragraph("<b>FR-BUD-002</b>", body_style), Paragraph("Group splits & settlements", body_style), Paragraph("<font color='#34C759'><b>VERIFIED</b></font>", body_style), Paragraph("Equal/custom splits with automated Settle Up ledger.", body_style)],
        [Paragraph("<b>FR-MAP-001</b>", body_style), Paragraph("Spatial Leaflet map integration", body_style), Paragraph("<font color='#34C759'><b>VERIFIED</b></font>", body_style), Paragraph("Leaflet.js interactive map with color-coded pins.", body_style)],
        [Paragraph("<b>FR-BKP-001</b>", body_style), Paragraph("Full JSON + Blob Backup ZIP", body_style), Paragraph("<font color='#34C759'><b>VERIFIED</b></font>", body_style), Paragraph("JSZip export/import creating single .travelnest ZIP archive.", body_style)],
        [Paragraph("<b>FR-SHR-001</b>", body_style), Paragraph("WhatsApp Plain Text Sharing", body_style), Paragraph("<font color='#34C759'><b>VERIFIED</b></font>", body_style), Paragraph("Formats Markdown text with Web Share API.", body_style)],
    ]

    t_chk = Table(chk_data, colWidths=[65, 175, 65, 205])
    t_chk.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F2F2F7')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D1D1D6')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_chk)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"ReportLab PDF built successfully: {pdf_filename}")

if __name__ == "__main__":
    build_pdf()
