"""
GearGuard - Flask Backend API
Maintenance Management System

Run with: python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import date, datetime
import json

app = Flask(__name__)

# Enable CORS for all routes (allows React frontend to connect)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --------------------------------------------------
# DATABASE CONNECTION
# --------------------------------------------------
def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root1234",   # change if needed
        database="gearguard"
    )

# Custom JSON encoder for dates
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super().default(obj)

app.json_encoder = CustomJSONEncoder

# --------------------------------------------------
# HELPER: Convert MySQL row to JSON-safe dict
# --------------------------------------------------
def row_to_dict(row):
    if row is None:
        return None
    result = {}
    for key, value in row.items():
        if isinstance(value, (date, datetime)):
            result[key] = value.isoformat() if value else None
        else:
            result[key] = value
    return result

# --------------------------------------------------
# EQUIPMENT APIs
# --------------------------------------------------

@app.route("/api/equipment", methods=["GET"])
def get_equipment():
    try:
        db = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT * FROM equipment WHERE is_scrapped = FALSE")
        data = cur.fetchall()
        db.close()
        return jsonify([row_to_dict(row) for row in data])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/equipment/<int:eq_id>", methods=["GET"])
def get_single_equipment(eq_id):
    try:
        db = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT * FROM equipment WHERE id = %s", (eq_id,))
        data = cur.fetchone()
        db.close()
        return jsonify(row_to_dict(data))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/equipment/<int:eq_id>/requests", methods=["GET"])
def equipment_requests(eq_id):
    try:
        db = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute("""
            SELECT * FROM maintenance_requests
            WHERE equipment_id = %s
        """, (eq_id,))
        data = cur.fetchall()
        db.close()
        return jsonify([row_to_dict(row) for row in data])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# CREATE MAINTENANCE REQUEST
# --------------------------------------------------

@app.route("/api/requests", methods=["POST"])
def create_request():
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        if not data.get("equipment_id"):
            return jsonify({"error": "equipment_id is required"}), 400
        
        if not data.get("subject"):
            return jsonify({"error": "subject is required"}), 400

        db = get_db()
        cur = db.cursor(dictionary=True)

        # Auto-fill from equipment
        cur.execute("""
            SELECT maintenance_team_id, default_technician_id
            FROM equipment
            WHERE id = %s AND is_scrapped = FALSE
        """, (data["equipment_id"],))

        auto = cur.fetchone()
        if not auto:
            db.close()
            return jsonify({"error": "Invalid or scrapped equipment"}), 400

        cur.execute("""
            INSERT INTO maintenance_requests
            (subject, request_type, equipment_id,
             maintenance_team_id, assigned_technician_id, scheduled_date, stage)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data["subject"],
            data.get("request_type", "corrective"),
            data["equipment_id"],
            auto["maintenance_team_id"],
            auto["default_technician_id"],
            data.get("scheduled_date"),
            "new"
        ))

        new_id = cur.lastrowid
        db.commit()
        db.close()
        return jsonify({"message": "Request created successfully", "id": new_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# KANBAN BOARD
# --------------------------------------------------

@app.route("/api/requests/kanban", methods=["GET"])
def kanban_view():
    try:
        db = get_db()
        cur = db.cursor(dictionary=True)

        cur.execute("""
            SELECT r.id, r.subject, r.stage, r.request_type, r.scheduled_date,
                   r.equipment_id, r.maintenance_team_id, r.assigned_technician_id,
                   r.duration_hours, r.created_at,
                   u.name AS technician
            FROM maintenance_requests r
            LEFT JOIN users u ON r.assigned_technician_id = u.id
        """)
        rows = cur.fetchall()
        db.close()

        kanban = {
            "new": [],
            "in_progress": [],
            "repaired": [],
            "scrap": []
        }

        for r in rows:
            stage = r.get("stage", "new") or "new"
            if stage in kanban:
                kanban[stage].append(row_to_dict(r))

        return jsonify(kanban)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# UPDATE STAGE (DRAG & DROP)
# --------------------------------------------------

@app.route("/api/requests/<int:req_id>/stage", methods=["PUT"])
def update_stage(req_id):
    try:
        data = request.json
        if not data or "stage" not in data:
            return jsonify({"error": "stage is required"}), 400
            
        stage = data["stage"]
        
        # Validate stage
        valid_stages = ["new", "in_progress", "repaired", "scrap"]
        if stage not in valid_stages:
            return jsonify({"error": f"Invalid stage. Must be one of: {valid_stages}"}), 400

        db = get_db()
        cur = db.cursor()

        cur.execute("""
            UPDATE maintenance_requests
            SET stage = %s
            WHERE id = %s
        """, (stage, req_id))

        # Scrap logic - mark equipment as scrapped
        if stage == "scrap":
            cur.execute("""
                UPDATE equipment
                SET is_scrapped = TRUE
                WHERE id = (
                    SELECT equipment_id
                    FROM maintenance_requests
                    WHERE id = %s
                )
            """, (req_id,))

        db.commit()
        db.close()
        return jsonify({"message": "Stage updated", "stage": stage})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# COMPLETE REQUEST
# --------------------------------------------------

@app.route("/api/requests/<int:req_id>/complete", methods=["PUT"])
def complete_request(req_id):
    try:
        data = request.json
        if not data or "duration_hours" not in data:
            return jsonify({"error": "duration_hours is required"}), 400
            
        hours = data["duration_hours"]
        
        if not isinstance(hours, (int, float)) or hours <= 0:
            return jsonify({"error": "duration_hours must be a positive number"}), 400

        db = get_db()
        cur = db.cursor()
        cur.execute("""
            UPDATE maintenance_requests
            SET stage = 'repaired', duration_hours = %s
            WHERE id = %s
        """, (hours, req_id))
        db.commit()
        db.close()

        return jsonify({"message": "Request completed", "duration_hours": hours})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# CALENDAR VIEW (PREVENTIVE)
# --------------------------------------------------

@app.route("/api/requests/calendar", methods=["GET"])
def calendar_view():
    try:
        db = get_db()
        cur = db.cursor(dictionary=True)

        cur.execute("""
            SELECT id, subject AS title, scheduled_date AS date
            FROM maintenance_requests
            WHERE request_type = 'preventive' AND scheduled_date IS NOT NULL
        """)
        data = cur.fetchall()
        db.close()
        return jsonify([row_to_dict(row) for row in data])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# TECHNICIAN DASHBOARD
# --------------------------------------------------

@app.route("/api/technicians/<int:tech_id>/requests", methods=["GET"])
def technician_tasks(tech_id):
    try:
        db = get_db()
        cur = db.cursor(dictionary=True)

        cur.execute("""
            SELECT * FROM maintenance_requests
            WHERE assigned_technician_id = %s
        """, (tech_id,))
        data = cur.fetchall()
        db.close()
        return jsonify([row_to_dict(row) for row in data])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# USERS API (for frontend compatibility)
# --------------------------------------------------

@app.route("/api/users", methods=["GET"])
def get_users():
    try:
        db = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT id, name, email, role, department FROM users")
        data = cur.fetchall()
        db.close()
        return jsonify([row_to_dict(row) for row in data])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    try:
        db = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT id, name, email, role, department FROM users WHERE id = %s", (user_id,))
        data = cur.fetchone()
        db.close()
        return jsonify(row_to_dict(data))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# TEAMS API
# --------------------------------------------------

@app.route("/api/teams", methods=["GET"])
def get_teams():
    try:
        db = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT * FROM maintenance_teams")
        data = cur.fetchall()
        db.close()
        return jsonify([row_to_dict(row) for row in data])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health_check():
    try:
        db = get_db()
        db.close()
        return jsonify({"status": "healthy", "database": "connected"})
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

# --------------------------------------------------
# RUN SERVER
# --------------------------------------------------
if __name__ == "__main__":
    print("Starting GearGuard API Server...")
    print("API available at: http://localhost:5000/api")
    print("Health check: http://localhost:5000/api/health")
    app.run(debug=True, host="0.0.0.0", port=5000)
