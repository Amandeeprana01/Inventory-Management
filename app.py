from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin, LoginManager, login_user, login_required, current_user, logout_user
from sqlalchemy import func
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'a_very_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://user:password@localhost/my_python_app_db' # Use your MySQL credentials
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app, origins="http://localhost:3001", supports_credentials=True)

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)

# User loader function for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# NEW: Admin-only decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated_function


# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    # NEW: Add is_admin column
    is_admin = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Inventory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

    def __repr__(self):
        return f"Inventory('{self.name}', '{self.quantity}', '{self.price}')"
    
class Allocation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    allocation_date = db.Column(db.DateTime, server_default=func.now())
    
    # Relationships for easy access
    user = db.relationship('User', backref=db.backref('allocations', lazy=True))
    inventory = db.relationship('Inventory', backref=db.backref('allocations', lazy=True))

# NEW: API route to get all non-admin users
@app.route("/api/users", methods=["GET"])
@login_required
@admin_required
def get_users():
    try:
        non_admin_users = User.query.filter_by(is_admin=False).all()
        user_list = [
            {"id": user.id, "username": user.username}
            for user in non_admin_users
        ]
        return jsonify({"users": user_list})
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({"error": "Failed to fetch users"}), 500

# API Routes
@app.route("/")
def home():
    return "<h1>Flask Inventory Backend is Running!</h1>"

# Route to check login status
@app.route("/api/status")
def status():
    if current_user.is_authenticated:
        # NEW: Return is_admin status
        return jsonify({"is_logged_in": True, "username": current_user.username, "is_admin": current_user.is_admin})
    else:
        return jsonify({"is_logged_in": False, "username": None, "is_admin": False})

# Registration route
@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
        if User.query.filter_by(username=username).first():
            return jsonify({"error": "User already exists"}), 409
        # NEW: Don't set is_admin to True by default
        new_user = User(username=username, is_admin=False)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Login route
@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(username=data.get("username")).first()
        if user and user.check_password(data.get("password")):
            login_user(user)
            # NEW: Return is_admin status on login
            return jsonify({"message": "Logged in successfully!", "username": user.username, "is_admin": user.is_admin}), 200
        else:
            return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Logout route
@app.route("/api/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully!"}), 200

# Dashboard Summary route
@app.route("/api/inventory/summary", methods=["GET"])
@login_required
def get_inventory_summary():
    try:
        total_items = db.session.query(func.count(Inventory.id)).scalar()
        total_value = db.session.query(func.sum(Inventory.quantity * Inventory.price)).scalar()
        
        if total_value is None:
            total_value = 0
            
        return jsonify({
            "total_items": total_items,
            "total_value": round(total_value, 2)
        })
    except Exception as e:
        print(f"Error fetching inventory summary: {e}")
        return jsonify({"error": "Failed to fetch summary data"}), 500

# GET endpoint to retrieve all inventory items (Admin Only)
@app.route("/api/inventory", methods=["GET"])
@login_required
@admin_required
def get_inventory():
    inventory_items = Inventory.query.all()
    inventory_list = [
        {"id": item.id, "name": item.name, "quantity": item.quantity, "price": item.price}
        for item in inventory_items
    ]
    return jsonify({"inventory": inventory_list})

# NEW: GET endpoint for a normal user's assigned items
@app.route("/api/my-inventory", methods=["GET"])
@login_required
def get_user_inventory():
    try:
        user_allocations = Allocation.query.filter_by(user_id=current_user.id).all()
        
        inventory_items = {}
        for alloc in user_allocations:
            inventory_item = Inventory.query.get(alloc.inventory_id)
            if inventory_item:
                item_data = {
                    "id": inventory_item.id,
                    "name": inventory_item.name,
                    "quantity": alloc.quantity,
                    "price": inventory_item.price
                }
                
                # If the item already exists in our grouped list, update the quantity.
                # Otherwise, add the new item.
                if inventory_item.id in inventory_items:
                    inventory_items[inventory_item.id]['quantity'] += alloc.quantity
                else:
                    inventory_items[inventory_item.id] = item_data
                    
        return jsonify({"inventory": list(inventory_items.values())})
    except Exception as e:
        print(f"Error fetching user inventory: {e}")
        return jsonify({"error": "Failed to fetch user inventory"}), 500

# POST endpoint to add a new inventory item (Admin Only)
@app.route("/api/inventory", methods=["POST"])
@login_required
@admin_required
def add_inventory_item():
    try:
        data = request.get_json()
        name = data.get("name")
        quantity = data.get("quantity")
        price = data.get("price")

        if not all([name, quantity, price]):
            return jsonify({"error": "Name, quantity, and price are required"}), 400

        new_item = Inventory(name=name, quantity=quantity, price=price)
        db.session.add(new_item)
        db.session.commit()
        
        return jsonify({"message": "Item added successfully!", "item": {"id": new_item.id, "name": new_item.name}}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error adding inventory item: {e}")
        return jsonify({"error": "Failed to add item"}), 500

# DELETE endpoint to remove an inventory item (Admin Only)
@app.route("/api/inventory/<int:id>", methods=["DELETE"])
@login_required
@admin_required
def delete_inventory_item(id):
    try:
        item_to_delete = Inventory.query.get_or_404(id)
        db.session.delete(item_to_delete)
        db.session.commit()
        return jsonify({"message": "Item deleted successfully!"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting inventory item: {e}")
        return jsonify({"error": "Failed to delete item"}), 500

# PUT endpoint to update an inventory item (Admin Only)
@app.route("/api/inventory/<int:id>", methods=["PUT"])
@login_required
@admin_required
def update_inventory_item(id):
    try:
        item_to_update = Inventory.query.get_or_404(id)
        data = request.get_json()

        item_to_update.name = data.get("name", item_to_update.name)
        item_to_update.quantity = data.get("quantity", item_to_update.quantity)
        item_to_update.price = data.get("price", item_to_update.price)
        
        db.session.commit()
        return jsonify({"message": "Item updated successfully!"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating inventory item: {e}")
        return jsonify({"error": "Failed to update item"}), 500

# New GET route to find a specific allocation (Admin only)
@app.route("/api/allocations/find", methods=["GET"])
@login_required
@admin_required
def find_allocation():
    user_id = request.args.get('user_id', type=int)
    inventory_id = request.args.get('inventory_id', type=int)
    
    if not user_id or not inventory_id:
        return jsonify({"error": "User ID and Inventory ID are required"}), 400

    allocation = Allocation.query.filter_by(
        user_id=user_id,
        inventory_id=inventory_id
    ).first()

    if allocation:
        return jsonify({
            "id": allocation.id,
            "user_id": allocation.user_id,
            "inventory_id": allocation.inventory_id,
            "quantity": allocation.quantity
        })
    else:
        return jsonify({"message": "Allocation not found"}), 404

# Main allocation route
@app.route("/api/allocations", methods=["POST"])
@login_required
@admin_required
def create_allocation():
    try:
        data = request.get_json()
        
        user_id = int(data.get("user_id"))
        inventory_id = int(data.get("inventory_id"))
        quantity = int(data.get("quantity"))
        
        if not all([user_id, inventory_id, quantity]):
            return jsonify({"error": "User ID, Inventory ID, and quantity are required"}), 400
            
        # Check if an existing allocation for this user and item already exists
        existing_allocation = Allocation.query.filter_by(
            user_id=user_id,
            inventory_id=inventory_id
        ).first()

        # Check if the inventory item has enough stock
        inventory_item = Inventory.query.get(inventory_id)
        if not inventory_item or inventory_item.quantity < quantity:
            return jsonify({"error": "Not enough stock available"}), 400

        if existing_allocation:
            # Update the existing allocation's quantity
            existing_allocation.quantity += quantity
        else:
            # Create a new allocation
            new_allocation = Allocation(
                user_id=user_id,
                inventory_id=inventory_id,
                quantity=quantity
            )
            db.session.add(new_allocation)
            
        # Decrease the inventory stock
        inventory_item.quantity -= quantity
        
        db.session.commit()
        
        return jsonify({"message": "Item allocated successfully!"}), 201
    
    except ValueError:
        db.session.rollback()
        return jsonify({"error": "Invalid data format. Please ensure user_id, inventory_id, and quantity are numbers."}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Error creating allocation: {e}")
        return jsonify({"error": "Failed to create allocation"}), 500

if __name__ == "__main__":
    with app.app_context():
        # This will create all the tables if they don't exist
        db.create_all()
        # Create a default admin user if one doesn't exist
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            new_admin = User(username='admin', is_admin=True)
            new_admin.set_password('admin_password')  # Use a strong password in a real app
            db.session.add(new_admin)
            db.session.commit()
            print("Default admin user created.")
    app.run(debug=True, port=5000)
