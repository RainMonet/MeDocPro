# In app/routes/auth.py

from flask import Blueprint
from ..extensions import db  # Import extensions if needed
from ..models.user import User # Import models as needed

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/test')
def auth_test():
    # Now you can safely use the db object and models
    user_count = User.query.count()
    return f"Authentication blueprint is live! User count: {user_count}"