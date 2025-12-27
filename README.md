# GearGuard-Maintenance_Tracker
GearGuard-Maintenance_Tracker is a smart maintenance management system built to track company equipment and handle maintenance requests efficiently. It connects assets, teams, and workflows using Kanban, Calendar views, and automation logic in an Odoo-like structure.

# Objective
To build a maintenance tracking module that allows:
- Centralized equipment management
- Assignment of maintenance to teams and technicians
- Handling of corrective and preventive maintenance requests
- Visual task tracking using Kanban and Calendar views


# Key Features
- Equipment management with ownership and warranty details
- Maintenance teams with assigned technicians
- Corrective (breakdown) and preventive (scheduled) requests
- Kanban board with drag-and-drop workflow stages
- Calendar view for scheduled preventive maintenance
- Smart button on equipment to view related maintenance requests
- Scrap logic to mark equipment as unusable

# Workflow Overview
1. User creates a maintenance request
2. Selecting equipment auto-fills the maintenance team
3. Request starts in "New" stage
4. Technician assigns and moves it to "In Progress"
5. After repair, hours are logged and status moves to "Repaired"
6. Preventive tasks appear on the calendar view
