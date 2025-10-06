# db_setup.py
import os
from app import app, db, User # Import app, db, and User model from your main app.py
from werkzeug.security import generate_password_hash # Assuming this is used for admin user

print("Starting Database Setup...")

with app.app_context():
    # 1. Create all tables
    print("Creating database tables...")
    db.create_all()
    print("Tables created successfully.")
    
    # 2. Create a default admin user if one doesn't exist
    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        print("Creating default admin user...")
        new_admin = User(username='admin', is_admin=True)
        # Ensure you use the same password logic as in your app.py
        # NOTE: This password should be moved to a Secret in a real K8s setup
        new_admin.password_hash = generate_password_hash('admin_password') 
        db.session.add(new_admin)
        db.session.commit()
        print("Default admin user created successfully.")
    else:
        print("Default admin user already exists. Skipping creation.")

print("Database setup complete.")
